"""
Moteur adaptatif — machine à états de progression (le cœur du projet).

Enchaînement (voir schéma de la spec) :

  Lire sous-partie -> micro-quiz (10 Q)
     score < 60% -> AgentIA génère un contenu SIMPLIFIÉ -> relire -> nouveau
                    micro-quiz (questions différentes) -> boucle
     score >= 60% -> sous-partie VALIDÉE -> sous-partie suivante (ordre strict)
  Toutes les sous-parties validées -> quiz FINAL de chapitre (50 Q)
     score < 60% -> relire le chapitre -> quiz régénéré (questions différentes)
     score >= 60% -> CHAPITRE VALIDÉ -> chapitre suivant

Règles clés : ordre strict, non-répétition des questions (HistoriqueQuestion),
mise à jour du niveau de maîtrise (ProfilCompetence + ProgressionSousPartie).
"""

from django.db import transaction

from apps.catalogue.models import Cours, Chapitre, SousChapitre
from .models import (
    Quiz, Question, Reponse, Resultat, TypeQuiz, Statut,
    ProgressionSousPartie, ProgressionChapitre, HistoriqueQuestion,
)
from .generation import (
    generer_questions_depuis_texte, enregistrer_questions,
    generer_contenu_simplifie,
)
from .services import mettre_a_jour_competence

# Paramètres de la logique adaptative
MICRO_NB = 10
FINAL_NB = 50
SEUIL_PCT = 60.0   # 6/10 comme 30/50 = 60 %


# ---------------------------------------------------------------------------
# Accès / création des lignes de progression
# ---------------------------------------------------------------------------

def _prog_sous(apprenant, sc):
    prog, _ = ProgressionSousPartie.objects.get_or_create(apprenant=apprenant, sous_chapitre=sc)
    return prog


def _prog_chap(apprenant, chap):
    prog, _ = ProgressionChapitre.objects.get_or_create(apprenant=apprenant, chapitre=chap)
    return prog


def prochaine_sous_partie(apprenant, cours, apres_sc):
    """Renvoie la prochaine sous-partie À ÉTUDIER (débloquée = EN_COURS, non
    validée) dans l'ordre du parcours, située après `apres_sc`.

    Sert à enchaîner automatiquement : après avoir validé une sous-partie, on
    envoie directement l'apprenant sur la suivante. Renvoie None si le chapitre
    est terminé (place au quiz final) ou si le cours est fini.
    """
    ordonnees = [
        sc
        for chap in cours.chapitres.all().order_by("ordre")
        for sc in chap.sous_chapitres.all().order_by("ordre")
    ]
    ids = [sc.id for sc in ordonnees]
    depart = ids.index(apres_sc.id) + 1 if apres_sc.id in ids else 0
    for sc in ordonnees[depart:]:
        if _prog_sous(apprenant, sc).statut == Statut.EN_COURS:
            return sc
    return None


def rafraichir_deverrouillage(apprenant, cours):
    """Recalcule les statuts VERROUILLE / EN_COURS selon l'ordre strict.
    Les statuts VALIDE (posés par la réussite d'un quiz) ne sont jamais annulés.
    """
    chap_precedent_valide = True  # le 1er chapitre est actif d'emblée
    for chap in cours.chapitres.all().order_by("ordre"):
        pc = _prog_chap(apprenant, chap)
        chapitre_actif = chap_precedent_valide or pc.statut == Statut.VALIDE

        sous_precedente_valide = True  # 1re sous-partie active si chapitre actif
        for sc in chap.sous_chapitres.all().order_by("ordre"):
            ps = _prog_sous(apprenant, sc)
            if ps.statut != Statut.VALIDE:
                deverrouille = chapitre_actif and sous_precedente_valide
                nouveau = Statut.EN_COURS if deverrouille else Statut.VERROUILLE
                if ps.statut != nouveau:
                    ps.statut = nouveau
                    ps.save(update_fields=["statut"])
            sous_precedente_valide = (ps.statut == Statut.VALIDE)

        # Le chapitre est "en cours" s'il est actif mais pas encore validé
        if pc.statut != Statut.VALIDE:
            nouveau = Statut.EN_COURS if chapitre_actif else Statut.VERROUILLE
            if pc.statut != nouveau:
                pc.statut = nouveau
                pc.save(update_fields=["statut"])

        chap_precedent_valide = (pc.statut == Statut.VALIDE)


def etat_cours(apprenant, cours):
    """Renvoie l'état complet de progression de l'apprenant sur un cours
    (pour piloter l'affichage du parcours côté frontend)."""
    rafraichir_deverrouillage(apprenant, cours)

    chapitres = []
    for chap in cours.chapitres.all().order_by("ordre"):
        pc = _prog_chap(apprenant, chap)
        sous = []
        for sc in chap.sous_chapitres.all().order_by("ordre"):
            ps = _prog_sous(apprenant, sc)
            sous.append({
                "id": sc.id, "titre": sc.titre, "ordre": sc.ordre,
                "statut": ps.statut, "lu": ps.lu,
                "nb_tentatives": ps.nb_tentatives,
                "meilleur_score": ps.meilleur_score,
                "a_contenu_simplifie": bool(ps.contenu_simplifie),
            })
        toutes_validees = all(s["statut"] == Statut.VALIDE for s in sous) and sous
        chapitres.append({
            "id": chap.id, "titre": chap.titre, "ordre": chap.ordre,
            "chapitre_hls": chap.chapitre_hls, "statut": pc.statut,
            "sous_parties": sous,
            "quiz_final_debloque": bool(toutes_validees) and pc.statut != Statut.VALIDE,
            "nb_tentatives_final": pc.nb_tentatives,
        })
    return {"cours": {"id": cours.id, "titre": cours.titre, "norme": cours.norme},
            "chapitres": chapitres}


# ---------------------------------------------------------------------------
# Lecture d'une sous-partie
# ---------------------------------------------------------------------------

def marquer_lu(apprenant, sc):
    """Marque une sous-partie comme lue. Elle doit être débloquée (ordre strict)."""
    rafraichir_deverrouillage(apprenant, sc.chapitre.cours)
    ps = _prog_sous(apprenant, sc)
    if ps.statut == Statut.VERROUILLE:
        raise PermissionError("Cette sous-partie n'est pas encore accessible.")
    ps.lu = True
    ps.save(update_fields=["lu"])
    return ps


# ---------------------------------------------------------------------------
# Micro-quiz de sous-partie
# ---------------------------------------------------------------------------

def _enonces_deja_poses(apprenant, **filtre_quiz):
    """Liste des énoncés déjà posés à l'apprenant (pour la non-répétition)."""
    qs = HistoriqueQuestion.objects.filter(apprenant=apprenant, **{
        f"question__quiz__{k}": v for k, v in filtre_quiz.items()
    })
    return list(qs.values_list("enonce", flat=True))


@transaction.atomic
def demarrer_micro_quiz(apprenant, sc):
    """Génère un micro-quiz (10 questions) pour une sous-partie débloquée et lue."""
    rafraichir_deverrouillage(apprenant, sc.chapitre.cours)
    ps = _prog_sous(apprenant, sc)
    if ps.statut == Statut.VERROUILLE:
        raise PermissionError("Sous-partie verrouillée : validez la précédente d'abord.")
    if not ps.lu:
        raise PermissionError("Lisez d'abord le contenu de la sous-partie.")

    # Contenu source : version simplifiée si elle existe, sinon contenu original
    contenu = ps.contenu_simplifie or sc.contenu
    exclure = _enonces_deja_poses(apprenant, sous_chapitre=sc)

    questions = generer_questions_depuis_texte(
        sc.titre, contenu, MICRO_NB, exclure=exclure,
    )
    if not questions:
        raise ValueError("Génération de questions impossible.")

    quiz = Quiz.objects.create(
        titre=f"Micro-quiz — {sc.titre}",
        type_quiz=TypeQuiz.MICRO, sous_chapitre=sc, chapitre=sc.chapitre,
        apprenant=apprenant, niveau_difficulte=questions[0]["niveau"],
    )
    enregistrer_questions(quiz, questions)

    # Historique (non-répétition)
    HistoriqueQuestion.objects.bulk_create([
        HistoriqueQuestion(apprenant=apprenant, question=q, enonce=q.enonce)
        for q in quiz.questions.all()
    ])
    ps.nb_tentatives += 1
    ps.save(update_fields=["nb_tentatives"])
    return quiz


# ---------------------------------------------------------------------------
# Quiz final de chapitre
# ---------------------------------------------------------------------------

@transaction.atomic
def demarrer_quiz_final(apprenant, chap):
    """Génère le quiz final (50 questions) si toutes les sous-parties sont validées."""
    rafraichir_deverrouillage(apprenant, chap.cours)
    sous = chap.sous_chapitres.all()
    if not sous:
        raise ValueError("Ce chapitre n'a pas de sous-parties.")
    for sc in sous:
        if _prog_sous(apprenant, sc).statut != Statut.VALIDE:
            raise PermissionError("Validez toutes les sous-parties avant le quiz final.")

    contenu = "\n".join(f"[{chap.chapitre_hls}] {sc.titre} : {sc.contenu}" for sc in sous)
    exclure = _enonces_deja_poses(apprenant, chapitre=chap)

    questions = generer_questions_depuis_texte(chap.titre, contenu, FINAL_NB, exclure=exclure)
    if not questions:
        raise ValueError("Génération de questions impossible.")

    quiz = Quiz.objects.create(
        titre=f"Quiz final — {chap.titre}",
        type_quiz=TypeQuiz.FINAL, chapitre=chap, apprenant=apprenant,
        niveau_difficulte=questions[0]["niveau"],
    )
    enregistrer_questions(quiz, questions)
    HistoriqueQuestion.objects.bulk_create([
        HistoriqueQuestion(apprenant=apprenant, question=q, enonce=q.enonce)
        for q in quiz.questions.all()
    ])
    pc = _prog_chap(apprenant, chap)
    pc.nb_tentatives += 1
    pc.save(update_fields=["nb_tentatives"])
    return quiz


# ---------------------------------------------------------------------------
# Correction commune + mise à jour de la progression
# ---------------------------------------------------------------------------

def _corriger(quiz, soumissions):
    """Corrige un quiz.

    Renvoie (nb_correctes, nb_questions, score_pct, detail, corrections) où :
      - `detail`      : [(question_id, est_correcte)] -> sert à créer les ReponseDonnee ;
      - `corrections` : détail par question renvoyé au client, pour afficher le
                        feedback vert/rouge sur chaque option :
                        [{"question", "choisie", "correcte", "juste"}]
    """
    # question_id -> id de la bonne réponse (une seule par question)
    bonne_par_question = dict(
        Reponse.objects.filter(question__quiz=quiz, est_correcte=True)
        .values_list("question_id", "id")
    )
    nb_questions = quiz.questions.count()
    nb_correctes = 0
    detail = []
    corrections = []
    for item in soumissions:
        qid = item.get("question")
        rid = item.get("reponse")
        bonne = bonne_par_question.get(qid)
        correcte = bonne is not None and rid == bonne
        if correcte:
            nb_correctes += 1
        detail.append((qid, correcte))
        corrections.append({
            "question": qid,      # id de la question
            "choisie": rid,       # id de la réponse choisie par l'apprenant
            "correcte": bonne,    # id de la bonne réponse
            "juste": correcte,    # la réponse choisie était-elle la bonne ?
        })
    score = round(100 * nb_correctes / nb_questions, 2) if nb_questions else 0
    return nb_correctes, nb_questions, score, detail, corrections


@transaction.atomic
def soumettre_micro_quiz(apprenant, quiz, soumissions):
    """Corrige un micro-quiz, met à jour la progression et déclenche la
    simplification IA si l'apprenant échoue."""
    from .models import ReponseDonnee  # import local pour éviter les cycles

    nb_correctes, nb_questions, score, detail, corrections = _corriger(quiz, soumissions)
    sc = quiz.sous_chapitre

    resultat = Resultat.objects.create(
        utilisateur=apprenant, quiz=quiz, type_resultat=TypeQuiz.MICRO,
        score=score, nb_correctes=nb_correctes, nb_questions=nb_questions,
    )
    ReponseDonnee.objects.bulk_create([
        ReponseDonnee(resultat=resultat, question_id=qid, est_correcte=ok)
        for qid, ok in detail if qid is not None
    ])

    ps = _prog_sous(apprenant, sc)
    ps.meilleur_score = max(ps.meilleur_score, score)
    ps.niveau_maitrise = round(0.5 * (score / 100) + 0.5 * ps.niveau_maitrise, 4)

    reussi = score >= SEUIL_PCT
    contenu_simplifie = None
    suivante = None
    if reussi:
        ps.statut = Statut.VALIDE
        ps.save()
        rafraichir_deverrouillage(apprenant, sc.chapitre.cours)
        # Sous-partie suivante à étudier (pour l'enchaînement automatique côté client)
        suivante = prochaine_sous_partie(apprenant, sc.chapitre.cours, sc)
    else:
        # AgentContenu : on génère une version simplifiée pour la relecture
        contenu_simplifie = generer_contenu_simplifie(sc)
        ps.contenu_simplifie = contenu_simplifie
        ps.lu = False  # l'apprenant doit relire la version simplifiée
        ps.save()

    # Met aussi à jour le profil de compétence au niveau du cours (dashboard/reco)
    mettre_a_jour_competence(apprenant, sc.chapitre.cours, score)

    return {
        "score": score, "nb_correctes": nb_correctes, "nb_questions": nb_questions,
        "reussi": reussi, "seuil_pct": SEUIL_PCT,
        "sous_partie_validee": reussi,
        "contenu_simplifie": contenu_simplifie,
        # Sous-partie suivante (réussite) : {id, titre} ou null si chapitre terminé
        # (dans ce cas le client renvoie vers le parcours pour le quiz final).
        "sous_partie_suivante": ({"id": suivante.id, "titre": suivante.titre} if suivante else None),
        # Correction par question -> feedback vert/rouge côté client
        "corrections": corrections,
        "message": ("Sous-partie validée !" if reussi
                    else "Score insuffisant : relisez la version simplifiée puis retentez."),
    }


@transaction.atomic
def soumettre_quiz_final(apprenant, quiz, soumissions):
    """Corrige un quiz final de chapitre et valide (ou non) le chapitre."""
    from .models import ReponseDonnee

    nb_correctes, nb_questions, score, detail, corrections = _corriger(quiz, soumissions)
    chap = quiz.chapitre

    resultat = Resultat.objects.create(
        utilisateur=apprenant, quiz=quiz, type_resultat=TypeQuiz.FINAL,
        score=score, nb_correctes=nb_correctes, nb_questions=nb_questions,
    )
    ReponseDonnee.objects.bulk_create([
        ReponseDonnee(resultat=resultat, question_id=qid, est_correcte=ok)
        for qid, ok in detail if qid is not None
    ])

    pc = _prog_chap(apprenant, chap)
    pc.meilleur_score = max(pc.meilleur_score, score)
    reussi = score >= SEUIL_PCT
    if reussi:
        pc.statut = Statut.VALIDE
        pc.save()
        rafraichir_deverrouillage(apprenant, chap.cours)
    else:
        pc.save()

    mettre_a_jour_competence(apprenant, chap.cours, score)

    return {
        "score": score, "nb_correctes": nb_correctes, "nb_questions": nb_questions,
        "reussi": reussi, "seuil_pct": SEUIL_PCT,
        "chapitre_valide": reussi,
        # Correction par question -> feedback vert/rouge côté client
        "corrections": corrections,
        "message": ("Chapitre validé ! Chapitre suivant débloqué." if reussi
                    else "Score insuffisant : relisez le chapitre, un nouveau quiz sera généré."),
    }
