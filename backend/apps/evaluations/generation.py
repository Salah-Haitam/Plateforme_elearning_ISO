"""
Agent IA — génération de questions et de quiz.

Fonctions :
  - generer_questions_depuis_texte : produit N questions QCM à partir d'un texte,
    en évitant une liste d'énoncés déjà posés (non-répétition).
  - generer_quiz : crée un quiz « catalogue » pour un cours (usage admin).

C'est la brique utilisée par le moteur adaptatif (micro-quiz et quiz final).
"""

import json
import re

from django.db import transaction

from apps.catalogue.models import NiveauDifficulte
from apps.assistant.llm import appeler_llm
from .models import Quiz, Question, Reponse, TypeQuiz

MAX_CONTENU = 9000
TAILLE_LOT = 10  # on génère par lots de 10 max (fiabilité du JSON)
NIVEAUX_VALIDES = {n.value for n in NiveauDifficulte}


def _extraire_json(texte):
    """Récupère le tableau JSON même si le LLM l'entoure de ```json ... ```.
    Tolère une réponse tronquée : on récupère alors les objets complets."""
    texte = re.sub(r"```(json)?", "", texte).strip()
    debut, fin = texte.find("["), texte.rfind("]")
    if debut == -1:
        raise ValueError("Aucun tableau JSON trouvé dans la réponse du LLM.")
    if fin != -1:
        try:
            return json.loads(texte[debut:fin + 1])
        except json.JSONDecodeError:
            pass
    # Réponse tronquée : on ferme le tableau après le dernier objet complet
    dernier = texte.rfind("}")
    if dernier == -1:
        raise ValueError("JSON illisible dans la réponse du LLM.")
    return json.loads(texte[debut:dernier + 1] + "]")


def generer_questions_depuis_texte(titre, contenu, nombre, exclure=None, niveau=None):
    """Génère `nombre` questions QCM à partir de `contenu`, PAR LOTS.

    Génère par paquets de TAILLE_LOT pour éviter les réponses tronquées et
    garantir la non-répétition (on ajoute chaque énoncé produit à la liste
    d'exclusion des lots suivants).
    `exclure` : énoncés déjà posés à l'apprenant.
    """
    exclure = list(exclure or [])
    resultat = []
    tentatives = 0
    max_tentatives = (nombre // TAILLE_LOT) + 3

    while len(resultat) < nombre and tentatives < max_tentatives:
        tentatives += 1
        a_generer = min(TAILLE_LOT, nombre - len(resultat))
        lot = _generer_un_lot(titre, contenu, a_generer, exclure, niveau)
        for q in lot:
            resultat.append(q)
            exclure.append(q["enonce"])  # empêche les doublons entre lots
    return resultat[:nombre]


def _generer_un_lot(titre, contenu, nombre, exclure, niveau):
    """Un seul appel LLM produisant jusqu'à `nombre` questions."""
    contenu = (contenu or "")[:MAX_CONTENU]
    exclure = exclure or []

    consigne = (
        "Tu es un concepteur de quiz pédagogiques sur les normes ISO. "
        f"À partir UNIQUEMENT du contenu ci-dessous, rédige {nombre} questions "
        "à choix multiple (QCM) en français.\n"
        "Contraintes STRICTES :\n"
        "- Chaque question a exactement 4 options, une seule correcte.\n"
        "- Base-toi uniquement sur le contenu fourni.\n"
        "- Varie les questions ; ne reformule pas trivialement.\n"
    )
    if niveau:
        consigne += f"- Vise plutôt le niveau de difficulté : {niveau}.\n"
    if exclure:
        # On limite pour ne pas exploser le prompt
        deja = "\n".join(f"- {e}" for e in exclure[:40])
        consigne += (
            "- INTERDICTION de reposer une question équivalente à celles-ci "
            f"(déjà posées) :\n{deja}\n"
        )
    consigne += (
        "Réponds UNIQUEMENT par un tableau JSON valide, sans texte autour :\n"
        '[{"enonce": "...", "options": ["a","b","c","d"], "index_correct": 0, '
        '"clause_hls": "6", "niveau": "DEBUTANT"}]\n\n'
        f"=== CONTENU : {titre} ===\n{contenu}"
    )

    reponse = appeler_llm([{"role": "user", "content": consigne}], temperature=0.5)
    brut = _extraire_json(reponse)

    # Nettoyage / validation
    questions = []
    for q in brut:
        enonce = (q.get("enonce") or "").strip()
        options = q.get("options") or []
        index = q.get("index_correct")
        if not enonce or len(options) < 2 or not isinstance(index, int):
            continue
        niv = q.get("niveau") if q.get("niveau") in NIVEAUX_VALIDES else (niveau or NiveauDifficulte.DEBUTANT)
        questions.append({
            "enonce": enonce,
            "options": [str(o) for o in options],
            "index_correct": max(0, min(index, len(options) - 1)),
            "clause_hls": str(q.get("clause_hls") or "").strip()[:100],
            "niveau": niv,
        })
    return questions


def enregistrer_questions(quiz, questions):
    """Crée les objets Question + Reponse d'un quiz à partir de dicts."""
    n = 0
    for q in questions:
        question = Question.objects.create(
            quiz=quiz, enonce=q["enonce"],
            niveau_difficulte=q["niveau"], clause_hls=q["clause_hls"],
        )
        for i, texte in enumerate(q["options"]):
            Reponse.objects.create(
                question=question, texte=texte[:500],
                est_correcte=(i == q["index_correct"]),
            )
        n += 1
    return n


def generer_contenu_simplifie(sous_chapitre):
    """AgentContenu : réécrit une sous-partie de façon PLUS SIMPLE, avec des
    exemples supplémentaires, pour un apprenant qui a échoué au micro-quiz."""
    consigne = (
        "Tu es un formateur ISO. Un apprenant a eu des difficultés à comprendre "
        "la sous-partie suivante. Réexplique-la en français de façon PLUS SIMPLE : "
        "phrases courtes, vocabulaire accessible, une analogie concrète et un "
        "exemple appliqué à un port (Marsa Maroc). Reste fidèle au contenu, "
        "n'ajoute pas d'information fausse. Termine par 3 points clés à retenir.\n\n"
        f"=== Sous-partie : {sous_chapitre.titre} ===\n{sous_chapitre.contenu}"
    )
    return appeler_llm([{"role": "user", "content": consigne}], temperature=0.5)


@transaction.atomic
def generer_quiz_decouverte(nombre=50):
    """Crée le QUIZ DE DÉCOUVERTE pour les visiteurs (50 questions), à partir
    du contenu de tous les cours. Remplace l'éventuel quiz de découverte existant."""
    from apps.catalogue.models import Cours

    morceaux = []
    for cours in Cours.objects.all():
        for chap in cours.chapitres.all():
            for sc in chap.sous_chapitres.all():
                morceaux.append(f"[{cours.norme} · {chap.chapitre_hls}] {sc.titre} : {sc.contenu}")
    contenu = "\n".join(morceaux)
    if not contenu:
        raise ValueError("Aucun contenu de cours : importez d'abord des cours.")

    questions = generer_questions_depuis_texte("Découverte des normes ISO", contenu, nombre)
    if not questions:
        raise ValueError("Le LLM n'a produit aucune question exploitable.")

    Quiz.objects.filter(est_quiz_decouverte=True).delete()
    quiz = Quiz.objects.create(
        titre="Quiz de découverte des normes ISO",
        type_quiz=TypeQuiz.DECOUVERTE,
        est_quiz_decouverte=True,
    )
    enregistrer_questions(quiz, questions)
    return quiz


@transaction.atomic
def generer_quiz(cours, nombre=5):
    """Crée un quiz « catalogue » (usage admin) pour un cours entier."""
    # Contenu = concat des sous-chapitres
    morceaux = []
    for chap in cours.chapitres.all():
        for sc in chap.sous_chapitres.all():
            morceaux.append(f"[{chap.chapitre_hls}] {sc.titre} : {sc.contenu}")
    contenu = "\n".join(morceaux)

    questions = generer_questions_depuis_texte(cours.titre, contenu, nombre)
    if not questions:
        raise ValueError("Le LLM n'a produit aucune question exploitable.")

    titre_quiz = f"Quiz (IA) — {cours.titre}"
    Quiz.objects.filter(titre=titre_quiz).delete()
    quiz = Quiz.objects.create(
        titre=titre_quiz, cours=cours, type_quiz=TypeQuiz.FINAL,
        niveau_difficulte=cours.niveau_difficulte,
    )
    enregistrer_questions(quiz, questions)
    return quiz
