"""
Modèle Utilisateur personnalisé.

Le diagramme de classes prévoit Utilisateur avec des sous-classes
(Administrateur, Apprenant, RH, Visiteur). En Django, la façon standard et
efficace de représenter ces rôles est un SEUL modèle avec un champ `role`
(énumération), plutôt que quatre tables séparées. On peut ainsi :
  - filtrer facilement les utilisateurs par rôle,
  - contrôler les permissions dans l'API selon le rôle,
  - faire évoluer un Visiteur en Apprenant sans recréer de ligne.

On utilise aussi l'EMAIL comme identifiant de connexion (au lieu d'un username).
"""

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UtilisateurManager(BaseUserManager):
    """Gestionnaire qui crée les utilisateurs à partir de l'email (pas d'un username)."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # hache le mot de passe
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """Crée un utilisateur normal (visiteur par défaut)."""
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("role", Utilisateur.Role.VISITEUR)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        """Crée un super-administrateur (accès complet + admin Django)."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", Utilisateur.Role.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Un superuser doit avoir is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Un superuser doit avoir is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class Utilisateur(AbstractUser):
    """Utilisateur de la plateforme. Hérite de la gestion de mot de passe de Django."""

    class Role(models.TextChoices):
        # (valeur en base, libellé affiché)
        ADMIN = "ADMIN", "Administrateur"
        RH = "RH", "Ressources Humaines"
        APPRENANT = "APPRENANT", "Apprenant"
        VISITEUR = "VISITEUR", "Visiteur"

    # On retire le username hérité : la connexion se fait par email.
    username = None

    nom = models.CharField("Nom complet", max_length=150)
    email = models.EmailField("Adresse email", unique=True)
    role = models.CharField(
        "Rôle",
        max_length=20,
        choices=Role.choices,
        default=Role.VISITEUR,
    )

    # Champ utilisé par Django pour identifier l'utilisateur à la connexion
    USERNAME_FIELD = "email"
    # Champs demandés en plus lors d'un createsuperuser (email + password sont implicites)
    REQUIRED_FIELDS = ["nom"]

    objects = UtilisateurManager()

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def __str__(self):
        return f"{self.nom} ({self.get_role_display()})"

    # Petits raccourcis pratiques pour les vérifications de rôle dans l'API
    @property
    def est_apprenant(self):
        return self.role == self.Role.APPRENANT

    @property
    def est_rh(self):
        return self.role == self.Role.RH

    @property
    def est_admin(self):
        return self.role == self.Role.ADMIN
