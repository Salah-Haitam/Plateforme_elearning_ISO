"""
Configuration Django pour la plateforme e-learning ISO (Marsa Maroc).

Principe : tout ce qui est secret ou dépend de l'environnement (clé, base de
données, debug...) est lu depuis un fichier .env, jamais écrit en dur ici.
"""

from pathlib import Path
import os
from datetime import timedelta

from dotenv import load_dotenv
import dj_database_url

# Chemin racine du backend (dossier qui contient manage.py)
BASE_DIR = Path(__file__).resolve().parent.parent

# Charge les variables du fichier backend/.env dans os.environ
load_dotenv(BASE_DIR / ".env")


# ---------------------------------------------------------------------------
# Sécurité de base
# ---------------------------------------------------------------------------

# Clé secrète : lue depuis .env. Une valeur de secours est fournie pour le dev.
SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-cle-de-dev-a-remplacer-en-production",
)

# DEBUG=True uniquement en développement. En prod, mettre DEBUG=False dans .env.
DEBUG = os.getenv("DJANGO_DEBUG", "True") == "True"

# Hôtes autorisés (ex : "localhost,127.0.0.1,mon-domaine.com")
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Bibliothèques tierces
    "rest_framework",          # API REST
    "corsheaders",             # Autorise React à appeler l'API

    # Nos applications
    "apps.utilisateurs",
    "apps.catalogue",
    "apps.evaluations",
    "apps.assistant",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # CORS doit être placé le plus haut possible, avant CommonMiddleware
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# ---------------------------------------------------------------------------
# Base de données : SQLite en développement, PostgreSQL (Supabase) en production
# ---------------------------------------------------------------------------
# Si la variable DATABASE_URL est définie (ex : Supabase), on l'utilise.
# Sinon, on retombe automatiquement sur SQLite (fichier local db.sqlite3).

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# ---------------------------------------------------------------------------
# Validation des mots de passe
# ---------------------------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ---------------------------------------------------------------------------
# Internationalisation (français / Maroc)
# ---------------------------------------------------------------------------

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Casablanca"
USE_I18N = True
USE_TZ = True


# ---------------------------------------------------------------------------
# Fichiers statiques
# ---------------------------------------------------------------------------

STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ---------------------------------------------------------------------------
# Django REST Framework + Authentification JWT
# ---------------------------------------------------------------------------

REST_FRAMEWORK = {
    # Par défaut, l'API attend un jeton JWT dans l'en-tête Authorization
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    # Par défaut, il faut être authentifié (on ouvrira certaines vues au public
    # explicitement, ex : catalogue et quiz de découverte pour les visiteurs)
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}

# Durée de vie des jetons
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),   # jeton d'accès court
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),      # jeton de rafraîchissement
}


# ---------------------------------------------------------------------------
# CORS : autoriser le frontend React à consommer l'API
# ---------------------------------------------------------------------------
# En dev, React tourne sur http://localhost:5173 (Vite).

CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")


# ---------------------------------------------------------------------------
# Modèle utilisateur personnalisé
# ---------------------------------------------------------------------------
# On remplace le User par défaut par notre modèle Utilisateur (avec rôle).
AUTH_USER_MODEL = "utilisateurs.Utilisateur"
