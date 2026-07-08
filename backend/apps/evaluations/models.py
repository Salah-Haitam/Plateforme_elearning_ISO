"""
Évaluations (quiz) et suivi de la compétence des apprenants.

    Quiz  ->  Question  ->  Reponse
    Resultat         : score obtenu par un utilisateur à un quiz
    ProfilCompetence : niveau de maîtrise d'un apprenant sur un cours (0 à 1)
                       -> cœur du moteur adaptatif (étape 6)
"""

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

from apps.catalogue.models import Cours, Chapitre, SousChapitre, NiveauDifficulte


class TypeQuiz(models.TextChoices):
    """Type de quiz dans la logique adaptative."""
    MICRO = "MICRO", "Micro-quiz de sous-partie (10 questions)"
    FINAL = "FINAL", "Quiz final de chapitre (50 questions)"
    DECOUVERTE = "DECOUVERTE", "Quiz de découverte (visiteurs)"


class Quiz(models.Model):
    """Un questionnaire.

    Dans le système adaptatif, un quiz est de trois types :
    - MICRO  : rattaché à une SousChapitre (10 questions),
    - FINAL  : rattaché à un Chapitre (50 questions),
    - DECOUVERTE : rattaché à un cours (ou rien), pour les visiteurs.
    """

    titre = models.CharField("Titre", max_length=200)
    type_quiz = models.CharField(
        "Type de quiz",
        max_length=12,
        choices=TypeQuiz.choices,
        default=TypeQuiz.MICRO,
    )
    niveau_difficulte = models.CharField(
        "Niveau de difficulté",
        max_length=20,
        choices=NiveauDifficulte.choices,
        default=NiveauDifficulte.DEBUTANT,
    )
    # Rattachements (selon le type) — tous facultatifs
    cours = models.ForeignKey(
        Cours, on_delete=models.CASCADE, related_name="quiz",
        null=True, blank=True, verbose_name="Cours associé",
    )
    chapitre = models.ForeignKey(
        Chapitre, on_delete=models.CASCADE, related_name="quiz",
        null=True, blank=True, verbose_name="Chapitre (quiz final)",
    )
    sous_chapitre = models.ForeignKey(
        SousChapitre, on_delete=models.CASCADE, related_name="quiz",
        null=True, blank=True, verbose_name="Sous-partie (micro-quiz)",
    )
    # Pour les micro-quiz régénérés : à quel apprenant est destinée cette
    # tentative (les questions sont personnalisées et non répétées).
    apprenant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="quiz_personnalises", null=True, blank=True,
        verbose_name="Apprenant destinataire (quiz généré)",
    )
    est_quiz_decouverte = models.BooleanField(
        "Quiz de découverte (visiteurs)", default=False
    )
    date_creation = models.DateTimeField("Créé le", auto_now_add=True, null=True)

    class Meta:
        verbose_name = "Quiz"
        verbose_name_plural = "Quiz"

    def __str__(self):
        return self.titre


class Question(models.Model):
    """Une question appartenant à un quiz."""

    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name="questions",
        verbose_name="Quiz",
    )
    enonce = models.TextField("Énoncé")
    niveau_difficulte = models.CharField(
        "Niveau de difficulté",
        max_length=20,
        choices=NiveauDifficulte.choices,
        default=NiveauDifficulte.DEBUTANT,
    )
    # Rattachement facultatif à une clause HLS : permet de repérer
    # « les clauses les plus ratées » dans le tableau de bord (étape 8).
    clause_hls = models.CharField("Clause HLS (ISO)", max_length=100, blank=True)

    class Meta:
        verbose_name = "Question"
        verbose_name_plural = "Questions"

    def __str__(self):
        return self.enonce[:60]


class Reponse(models.Model):
    """Une réponse possible à une question (QCM)."""

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="reponses",
        verbose_name="Question",
    )
    texte = models.CharField("Texte de la réponse", max_length=500)
    est_correcte = models.BooleanField("Est correcte ?", default=False)

    class Meta:
        verbose_name = "Réponse"
        verbose_name_plural = "Réponses"

    def __str__(self):
        marque = "✓" if self.est_correcte else "✗"
        return f"{marque} {self.texte}"


class Resultat(models.Model):
    """Score obtenu par un utilisateur à un quiz, à une date donnée.

    Relié à Utilisateur (et non seulement Apprenant) car un VISITEUR passe
    aussi le quiz de découverte : son résultat doit être enregistré.
    """

    # Utilisateur connecté (apprenant...) OU null si c'est un VISITEUR anonyme
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="resultats",
        null=True, blank=True,
        verbose_name="Utilisateur",
    )
    # Identité saisie par le visiteur (quiz de découverte, sans compte)
    nom_visiteur = models.CharField("Nom du visiteur", max_length=150, blank=True)
    prenom_visiteur = models.CharField("Prénom du visiteur", max_length=150, blank=True)
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name="resultats",
        verbose_name="Quiz",
    )
    # Type de quiz passé (micro / final / découverte) — copié depuis le quiz
    type_resultat = models.CharField(
        "Type", max_length=12, choices=TypeQuiz.choices,
        default=TypeQuiz.MICRO,
    )
    # Score en pourcentage (0 à 100)
    score = models.FloatField(
        "Score (%)",
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    # Score brut (ex : 7 bonnes sur 10) pour la logique adaptative (6/10, 30/50)
    nb_correctes = models.PositiveIntegerField("Bonnes réponses", default=0)
    nb_questions = models.PositiveIntegerField("Nombre de questions", default=0)
    date_passage = models.DateTimeField("Date de passage", auto_now_add=True)

    class Meta:
        verbose_name = "Résultat"
        verbose_name_plural = "Résultats"
        ordering = ["-date_passage"]

    def __str__(self):
        qui = self.utilisateur or f"{self.prenom_visiteur} {self.nom_visiteur} (visiteur)"
        return f"{qui} · {self.quiz} · {self.score}%"


class ReponseDonnee(models.Model):
    """Trace d'une réponse donnée par l'utilisateur à une question, lors d'un
    passage de quiz. Sert à calculer des statistiques fines (ex : clauses HLS
    les plus ratées) dans le tableau de bord (étape 8)."""

    resultat = models.ForeignKey(
        Resultat,
        on_delete=models.CASCADE,
        related_name="reponses_donnees",
        verbose_name="Résultat",
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="reponses_donnees",
        verbose_name="Question",
    )
    est_correcte = models.BooleanField("Réponse correcte ?")

    class Meta:
        verbose_name = "Réponse donnée"
        verbose_name_plural = "Réponses données"

    def __str__(self):
        return f"{self.question} · {'✓' if self.est_correcte else '✗'}"


class ProfilCompetence(models.Model):
    """Niveau de maîtrise d'un apprenant sur un cours donné (0.0 à 1.0).

    C'est la donnée centrale du MOTEUR ADAPTATIF : après chaque quiz, on met à
    jour ce niveau. Faible -> proposer de la remédiation ; élevé -> proposer
    du contenu plus avancé.
    """

    apprenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profils_competence",
        verbose_name="Apprenant",
    )
    cours = models.ForeignKey(
        Cours,
        on_delete=models.CASCADE,
        related_name="profils_competence",
        verbose_name="Cours",
    )
    niveau_maitrise = models.FloatField(
        "Niveau de maîtrise (0 à 1)",
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
    )
    derniere_maj = models.DateTimeField("Dernière mise à jour", auto_now=True)

    class Meta:
        verbose_name = "Profil de compétence"
        verbose_name_plural = "Profils de compétence"
        # Un seul profil par couple (apprenant, cours)
        unique_together = ("apprenant", "cours")

    def __str__(self):
        return f"{self.apprenant} · {self.cours} · maîtrise {self.niveau_maitrise:.2f}"


# ===========================================================================
#  MACHINE À ÉTATS DE PROGRESSION (cœur du système adaptatif)
# ===========================================================================

class Statut(models.TextChoices):
    """États d'avancement d'une sous-partie ou d'un chapitre."""
    VERROUILLE = "VERROUILLE", "Verrouillé"      # pas encore accessible (ordre strict)
    EN_COURS = "EN_COURS", "En cours"            # débloqué, en cours d'apprentissage
    VALIDE = "VALIDE", "Validé"                  # quiz réussi


class ProgressionSousPartie(models.Model):
    """Suit l'avancement d'un apprenant sur UNE sous-partie (SousChapitre).

    C'est ce modèle qui fait respecter l'ORDRE STRICT : une sous-partie n'est
    accessible que si la précédente est validée. On y stocke aussi le niveau
    de maîtrise fin (0..1) qui alimente le moteur adaptatif au niveau clause.
    """

    apprenant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="progressions_sous_parties", verbose_name="Apprenant",
    )
    sous_chapitre = models.ForeignKey(
        SousChapitre, on_delete=models.CASCADE,
        related_name="progressions", verbose_name="Sous-partie",
    )
    statut = models.CharField(
        "Statut", max_length=12, choices=Statut.choices, default=Statut.VERROUILLE,
    )
    lu = models.BooleanField("Contenu lu", default=False)
    nb_tentatives = models.PositiveIntegerField("Nombre de tentatives", default=0)
    meilleur_score = models.FloatField("Meilleur score (%)", default=0.0)
    niveau_maitrise = models.FloatField(
        "Niveau de maîtrise (0 à 1)", default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
    )
    # Version simplifiée générée par l'IA si l'apprenant a échoué (score < 6/10)
    contenu_simplifie = models.TextField("Contenu simplifié (IA)", blank=True)
    derniere_maj = models.DateTimeField("Dernière mise à jour", auto_now=True)

    class Meta:
        verbose_name = "Progression (sous-partie)"
        verbose_name_plural = "Progressions (sous-parties)"
        unique_together = ("apprenant", "sous_chapitre")

    def __str__(self):
        return f"{self.apprenant} · {self.sous_chapitre} · {self.statut}"


class ProgressionChapitre(models.Model):
    """Suit l'avancement d'un apprenant sur un chapitre (quiz final)."""

    apprenant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="progressions_chapitres", verbose_name="Apprenant",
    )
    chapitre = models.ForeignKey(
        Chapitre, on_delete=models.CASCADE,
        related_name="progressions", verbose_name="Chapitre",
    )
    statut = models.CharField(
        "Statut", max_length=12, choices=Statut.choices, default=Statut.VERROUILLE,
    )
    nb_tentatives = models.PositiveIntegerField("Tentatives quiz final", default=0)
    meilleur_score = models.FloatField("Meilleur score (%)", default=0.0)
    derniere_maj = models.DateTimeField("Dernière mise à jour", auto_now=True)

    class Meta:
        verbose_name = "Progression (chapitre)"
        verbose_name_plural = "Progressions (chapitres)"
        unique_together = ("apprenant", "chapitre")

    def __str__(self):
        return f"{self.apprenant} · {self.chapitre} · {self.statut}"


class HistoriqueQuestion(models.Model):
    """Mémorise chaque question déjà posée à un apprenant, pour garantir la
    NON-RÉPÉTITION : lors de la génération d'un nouveau quiz, on fournit à
    l'agent IA les énoncés déjà vus afin qu'il en produise de nouveaux."""

    apprenant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="historique_questions", verbose_name="Apprenant",
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE,
        related_name="historique", verbose_name="Question",
    )
    # On copie l'énoncé pour le garder même si la question est supprimée
    enonce = models.TextField("Énoncé posé", blank=True)
    date_posee = models.DateTimeField("Date", auto_now_add=True)

    class Meta:
        verbose_name = "Historique de question"
        verbose_name_plural = "Historique des questions"

    def __str__(self):
        return f"{self.apprenant} · {self.enonce[:50]}"
