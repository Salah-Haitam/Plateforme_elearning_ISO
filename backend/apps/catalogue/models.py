"""
Contenu pédagogique, organisé en hiérarchie :

    Cours  ->  Chapitre  ->  SousChapitre  ->  Media

Chaque niveau « appartient » au niveau supérieur (clé étrangère). La suppression
d'un cours supprime en cascade ses chapitres, sous-chapitres et médias.
"""

from django.db import models


class NiveauDifficulte(models.TextChoices):
    """Niveaux de difficulté partagés (cours et quiz)."""
    DEBUTANT = "DEBUTANT", "Débutant"
    INTERMEDIAIRE = "INTERMEDIAIRE", "Intermédiaire"
    AVANCE = "AVANCE", "Avancé"


class Cours(models.Model):
    """Un cours portant sur une norme ISO (ex : ISO 27001)."""

    titre = models.CharField("Titre", max_length=200)
    # La norme concernée (ISO 27001, ISO 9001...). On garde un texte libre
    # pour rester souple ; on pourrait en faire une table dédiée plus tard.
    norme = models.CharField("Norme ISO", max_length=100)
    description = models.TextField("Description", blank=True)
    niveau_difficulte = models.CharField(
        "Niveau de difficulté",
        max_length=20,
        choices=NiveauDifficulte.choices,
        default=NiveauDifficulte.DEBUTANT,
    )
    date_creation = models.DateTimeField("Date de création", auto_now_add=True)

    class Meta:
        verbose_name = "Cours"
        verbose_name_plural = "Cours"
        ordering = ["titre"]

    def __str__(self):
        return f"{self.titre} — {self.norme}"


class Chapitre(models.Model):
    """Un chapitre à l'intérieur d'un cours."""

    cours = models.ForeignKey(
        Cours,
        on_delete=models.CASCADE,
        related_name="chapitres",  # cours.chapitres.all()
        verbose_name="Cours",
    )
    titre = models.CharField("Titre", max_length=200)
    ordre = models.PositiveIntegerField("Ordre d'affichage", default=1)
    # « chapitreHLS » du modèle : rattachement à la clause High Level Structure
    # commune aux normes ISO (ex : "6. Planification"). Utile pour les stats
    # « clauses les plus ratées ».
    chapitre_hls = models.CharField("Clause HLS (ISO)", max_length=100, blank=True)

    class Meta:
        verbose_name = "Chapitre"
        verbose_name_plural = "Chapitres"
        ordering = ["cours", "ordre"]

    def __str__(self):
        return f"{self.cours.titre} · Chap. {self.ordre} : {self.titre}"


class SousChapitre(models.Model):
    """Une section de contenu à l'intérieur d'un chapitre."""

    chapitre = models.ForeignKey(
        Chapitre,
        on_delete=models.CASCADE,
        related_name="sous_chapitres",
        verbose_name="Chapitre",
    )
    titre = models.CharField("Titre", max_length=200)
    contenu = models.TextField("Contenu pédagogique", blank=True)
    ordre = models.PositiveIntegerField("Ordre d'affichage", default=1)

    class Meta:
        verbose_name = "Sous-chapitre"
        verbose_name_plural = "Sous-chapitres"
        ordering = ["chapitre", "ordre"]

    def __str__(self):
        return f"{self.titre}"


class Media(models.Model):
    """Ressource média rattachée à un sous-chapitre (vidéo, PDF, image...)."""

    class TypeMedia(models.TextChoices):
        VIDEO = "VIDEO", "Vidéo"
        PDF = "PDF", "Document PDF"
        IMAGE = "IMAGE", "Image"
        LIEN = "LIEN", "Lien externe"

    sous_chapitre = models.ForeignKey(
        SousChapitre,
        on_delete=models.CASCADE,
        related_name="medias",
        verbose_name="Sous-chapitre",
    )
    type = models.CharField(
        "Type de média",
        max_length=10,
        choices=TypeMedia.choices,
        default=TypeMedia.LIEN,
    )
    url = models.URLField("URL de la ressource", max_length=500)

    class Meta:
        verbose_name = "Média"
        verbose_name_plural = "Médias"

    def __str__(self):
        return f"{self.get_type_display()} — {self.url}"
