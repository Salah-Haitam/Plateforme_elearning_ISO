"""
Calcul des statistiques du tableau de bord (étape 8).

Fournit :
  - le taux de réussite moyen par norme ISO,
  - les clauses HLS les plus ratées,
  - la progression moyenne (niveaux de maîtrise),
  - quelques compteurs globaux.
"""

from django.db.models import Avg, Count, Q

from apps.utilisateurs.models import Utilisateur
from apps.catalogue.models import Cours
from .models import Resultat, ProfilCompetence, ReponseDonnee


def taux_reussite_par_norme():
    """Score moyen aux quiz, regroupé par norme du cours associé."""
    lignes = (
        Resultat.objects
        .filter(quiz__cours__isnull=False)
        .values("quiz__cours__norme")
        .annotate(score_moyen=Avg("score"), nb=Count("id"))
        .order_by("-score_moyen")
    )
    return [
        {
            "norme": l["quiz__cours__norme"],
            "score_moyen": round(l["score_moyen"], 1),
            "nb_passages": l["nb"],
        }
        for l in lignes
    ]


def clauses_les_plus_ratees(limite=5):
    """Clauses HLS où le taux d'échec est le plus élevé.

    Pour chaque clause, on compte le total de réponses et les réponses fausses,
    puis on calcule le taux d'échec.
    """
    lignes = (
        ReponseDonnee.objects
        .exclude(question__clause_hls="")
        .values("question__clause_hls")
        .annotate(
            total=Count("id"),
            echecs=Count("id", filter=Q(est_correcte=False)),
        )
    )
    resultat = []
    for l in lignes:
        total = l["total"]
        echecs = l["echecs"]
        resultat.append({
            "clause": l["question__clause_hls"],
            "taux_echec": round(100 * echecs / total, 1) if total else 0,
            "nb_reponses": total,
        })
    # Les clauses les plus ratées d'abord
    resultat.sort(key=lambda x: x["taux_echec"], reverse=True)
    return resultat[:limite]


def progression_moyenne():
    """Niveau de maîtrise moyen (0..1) sur l'ensemble des profils de compétence."""
    moyenne = ProfilCompetence.objects.aggregate(m=Avg("niveau_maitrise"))["m"]
    return round((moyenne or 0) * 100, 1)  # renvoyé en pourcentage


def compteurs_globaux():
    return {
        "nb_apprenants": Utilisateur.objects.filter(
            role=Utilisateur.Role.APPRENANT
        ).count(),
        "nb_cours": Cours.objects.count(),
        "nb_quiz_passes": Resultat.objects.count(),
    }


def tableau_de_bord():
    """Assemble toutes les statistiques en un seul objet."""
    return {
        "compteurs": compteurs_globaux(),
        "progression_moyenne": progression_moyenne(),
        "taux_reussite_par_norme": taux_reussite_par_norme(),
        "clauses_les_plus_ratees": clauses_les_plus_ratees(),
    }
