"""
Moteur adaptatif (rôle de l'« AgentDiagnostic » et de l'« AgentRecommandation »).

Deux responsabilités :
  1) mettre_a_jour_competence : après un quiz, actualiser le niveau de maîtrise
     de l'apprenant sur le cours concerné.
  2) recommander : à partir des niveaux de maîtrise, proposer de la remédiation
     (si maîtrise faible) ou du contenu plus avancé (si maîtrise élevée).
"""

from apps.catalogue.models import Cours, NiveauDifficulte
from .models import ProfilCompetence

# Coefficient de la moyenne mobile exponentielle (EMA).
# 0.5 = on accorde autant de poids au dernier quiz qu'à l'historique.
ALPHA = 0.5

# Seuils de décision pour les recommandations
SEUIL_FAIBLE = 0.5    # en dessous -> remédiation
SEUIL_ELEVE = 0.8     # au dessus -> contenu plus avancé


def mettre_a_jour_competence(apprenant, cours, score):
    """Met à jour (ou crée) le ProfilCompetence de l'apprenant pour ce cours.

    `score` est en pourcentage (0 à 100) ; on le ramène sur 0..1.
    - Première évaluation : le niveau = score obtenu.
    - Évaluations suivantes : moyenne mobile entre l'ancien niveau et le nouveau.
    Retourne le ProfilCompetence mis à jour.
    """
    score_normalise = max(0.0, min(1.0, score / 100.0))

    profil, cree = ProfilCompetence.objects.get_or_create(
        apprenant=apprenant,
        cours=cours,
        defaults={"niveau_maitrise": score_normalise},
    )

    if not cree:
        # Moyenne mobile : nouveau = ALPHA*score + (1-ALPHA)*ancien
        profil.niveau_maitrise = round(
            ALPHA * score_normalise + (1 - ALPHA) * profil.niveau_maitrise, 4
        )
        profil.save()

    return profil


def recommander(apprenant):
    """Construit une liste de recommandations pour l'apprenant, à partir de ses
    niveaux de maîtrise. Chaque recommandation indique le cours suggéré et la
    raison (remédiation ou approfondissement).
    """
    recommandations = []
    profils = ProfilCompetence.objects.filter(apprenant=apprenant).select_related("cours")

    for profil in profils:
        cours = profil.cours
        niveau = profil.niveau_maitrise

        if niveau < SEUIL_FAIBLE:
            # Maîtrise faible -> proposer un cours plus facile sur la même norme
            cible = (
                Cours.objects.filter(norme=cours.norme)
                .exclude(id=cours.id)
                .filter(niveau_difficulte=NiveauDifficulte.DEBUTANT)
                .first()
            )
            recommandations.append({
                "type": "remediation",
                "raison": f"Maîtrise faible ({round(niveau*100)}%) sur « {cours.titre} ».",
                "cours_source": cours.id,
                "cours_suggere": cible.id if cible else None,
                "titre_suggere": cible.titre if cible else "Revoir ce cours",
            })

        elif niveau > SEUIL_ELEVE:
            # Maîtrise élevée -> proposer un cours plus avancé sur la même norme
            cible = (
                Cours.objects.filter(norme=cours.norme)
                .exclude(id=cours.id)
                .filter(niveau_difficulte=NiveauDifficulte.AVANCE)
                .first()
            )
            recommandations.append({
                "type": "approfondissement",
                "raison": f"Bonne maîtrise ({round(niveau*100)}%) sur « {cours.titre} ».",
                "cours_source": cours.id,
                "cours_suggere": cible.id if cible else None,
                "titre_suggere": cible.titre if cible else "Contenu avancé à venir",
            })

    return recommandations
