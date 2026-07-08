"""
Assistant IA (chatbot RAG) et base documentaire.

    BaseConnaissance  ->  Document   : sources Marsa Maroc + normes ISO
    ConversationIA                   : historique des échanges avec le chatbot
    Agent -> AgentDiagnostic / AgentRecommandation : acteurs système (IA)

Le contenu détaillé du RAG (recherche + génération) sera implémenté à l'étape 7 ;
ici on pose seulement le stockage des données.
"""

from django.conf import settings
from django.db import models


class BaseConnaissance(models.Model):
    """Un corpus documentaire (ex : « Documents internes Marsa Maroc »,
    « Normes ISO 27001 »...). Regroupe des documents par source/domaine."""

    source = models.CharField("Source", max_length=200)          # ex : "Marsa Maroc"
    domaine = models.CharField("Domaine", max_length=200)        # ex : "ISO 27001"

    class Meta:
        verbose_name = "Base de connaissance"
        verbose_name_plural = "Bases de connaissance"

    def __str__(self):
        return f"{self.source} — {self.domaine}"


class Document(models.Model):
    """Un document de la base de connaissance, dans lequel le chatbot RAG
    ira chercher les passages pertinents avant de répondre."""

    base_connaissance = models.ForeignKey(
        BaseConnaissance,
        on_delete=models.CASCADE,
        related_name="documents",
        verbose_name="Base de connaissance",
    )
    titre = models.CharField("Titre", max_length=300)
    contenu = models.TextField("Contenu (texte)")
    categorie = models.CharField("Catégorie", max_length=150, blank=True)
    url = models.URLField("URL source", max_length=500, blank=True)

    # NB : à l'étape 7 (RAG), on ajoutera ici un champ « embedding » (vecteur)
    # pour la recherche sémantique. On le laisse de côté pour l'instant.

    class Meta:
        verbose_name = "Document"
        verbose_name_plural = "Documents"

    def __str__(self):
        return self.titre


class ConversationIA(models.Model):
    """Un échange avec le chatbot : message de l'utilisateur + réponse de l'IA."""

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversations_ia",
        verbose_name="Utilisateur",
    )
    message = models.TextField("Message de l'utilisateur")
    reponse = models.TextField("Réponse de l'IA")
    horodatage = models.DateTimeField("Horodatage", auto_now_add=True)

    class Meta:
        verbose_name = "Conversation IA"
        verbose_name_plural = "Conversations IA"
        ordering = ["horodatage"]

    def __str__(self):
        return f"{self.utilisateur} · {self.horodatage:%d/%m/%Y %H:%M}"


class Agent(models.Model):
    """Acteur système « Agent IA ». Le champ `type` distingue les rôles :
    diagnostic (analyse des quiz) ou recommandation (adaptation du parcours).

    Le modèle prévoyait des sous-classes AgentDiagnostic / AgentRecommandation :
    comme pour les rôles utilisateurs, on les représente par un champ `type`
    plutôt que par des tables séparées."""

    class TypeAgent(models.TextChoices):
        DIAGNOSTIC = "DIAGNOSTIC", "Agent de diagnostic"
        RECOMMANDATION = "RECOMMANDATION", "Agent de recommandation"

    type = models.CharField(
        "Type d'agent",
        max_length=20,
        choices=TypeAgent.choices,
    )
    description = models.CharField("Description", max_length=300, blank=True)
    actif = models.BooleanField("Actif", default=True)

    class Meta:
        verbose_name = "Agent IA"
        verbose_name_plural = "Agents IA"

    def __str__(self):
        return self.get_type_display()
