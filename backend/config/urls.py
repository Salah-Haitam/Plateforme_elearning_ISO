"""
Routage principal (URLs) du projet.

On utilise un « routeur » DRF : il génère automatiquement les routes REST
(list, create, retrieve, update, delete) pour chaque ViewSet enregistré.

Routes principales exposées sous /api/ :
  - /api/ping/                 test de l'API
  - /api/inscription/          création de compte (public)
  - /api/moi/                  profil de l'utilisateur connecté
  - /api/utilisateurs/         gestion des comptes (admin)
  - /api/cours/                catalogue de cours
  - /api/quiz/                 quiz (+ /api/quiz/{id}/soumettre/)
  - /api/resultats/            résultats de l'utilisateur connecté
  - /api/profils-competence/   profils de compétence de l'apprenant
  - /api/bases-connaissance/   bases documentaires (admin)
  - /api/documents/            documents (admin)
  - /api/conversations/        historique chatbot de l'utilisateur

L'authentification JWT (login) sera ajoutée à l'étape 4.
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.utilisateurs.auth_serializers import ConnexionSerializer
from apps.utilisateurs.views import UtilisateurViewSet, InscriptionView, moi
from apps.catalogue.views import CoursViewSet
from apps.evaluations.views import (
    QuizViewSet,
    ResultatViewSet,
    ProfilCompetenceViewSet,
    RecommandationView,
    TableauDeBordView,
    GenererQuizView,
    QuizDecouverteView,
    SoumettreDecouverteView,
    ParcoursView,
    ContenuSousPartieView,
    MarquerLuView,
    DemarrerMicroQuizView,
    SoumettreMicroQuizView,
    DemarrerQuizFinalView,
    SoumettreQuizFinalView,
)
from apps.assistant.views import (
    BaseConnaissanceViewSet,
    DocumentViewSet,
    ConversationIAViewSet,
    ChatbotView,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def ping(request):
    """Endpoint de santé : confirme que l'API Django fonctionne."""
    return Response({"message": "API Marsa Maroc e-learning opérationnelle 🚀"})


class ConnexionView(TokenObtainPairView):
    """POST /api/token/ -> connexion (email + mot de passe) -> jetons JWT."""
    serializer_class = ConnexionSerializer


# Routeur DRF : on enregistre chaque ViewSet avec son préfixe d'URL
router = routers.DefaultRouter()
router.register("utilisateurs", UtilisateurViewSet, basename="utilisateur")
router.register("cours", CoursViewSet, basename="cours")
router.register("quiz", QuizViewSet, basename="quiz")
router.register("resultats", ResultatViewSet, basename="resultat")
router.register("profils-competence", ProfilCompetenceViewSet, basename="profilcompetence")
router.register("bases-connaissance", BaseConnaissanceViewSet, basename="baseconnaissance")
router.register("documents", DocumentViewSet, basename="document")
router.register("conversations", ConversationIAViewSet, basename="conversation")


urlpatterns = [
    path("admin/", admin.site.urls),

    # Endpoints « à la main » (hors routeur)
    path("api/ping/", ping),
    path("api/inscription/", InscriptionView.as_view()),
    path("api/moi/", moi),

    # Authentification JWT
    path("api/token/", ConnexionView.as_view()),          # connexion
    path("api/token/refresh/", TokenRefreshView.as_view()),  # rafraîchir le jeton

    # Moteur adaptatif : recommandations personnalisées
    path("api/recommandations/", RecommandationView.as_view()),

    # Chatbot RAG
    path("api/chatbot/", ChatbotView.as_view()),

    # Tableau de bord / statistiques (Admin & RH)
    path("api/statistiques/", TableauDeBordView.as_view()),

    # Agent IA : génération de quiz pour un cours (Admin)
    path("api/cours/<int:cours_id>/generer-quiz/", GenererQuizView.as_view()),

    # Quiz de découverte (visiteurs, public)
    path("api/quiz-decouverte/", QuizDecouverteView.as_view()),
    path("api/quiz-decouverte/soumettre/", SoumettreDecouverteView.as_view()),

    # --- Parcours adaptatif (apprenant) ---
    path("api/cours/<int:cours_id>/parcours/", ParcoursView.as_view()),
    path("api/sous-parties/<int:sous_id>/contenu/", ContenuSousPartieView.as_view()),
    path("api/sous-parties/<int:sous_id>/lu/", MarquerLuView.as_view()),
    path("api/sous-parties/<int:sous_id>/micro-quiz/", DemarrerMicroQuizView.as_view()),
    path("api/quiz/<int:quiz_id>/soumettre-micro/", SoumettreMicroQuizView.as_view()),
    path("api/chapitres/<int:chapitre_id>/quiz-final/", DemarrerQuizFinalView.as_view()),
    path("api/quiz/<int:quiz_id>/soumettre-final/", SoumettreQuizFinalView.as_view()),

    # Toutes les routes générées par le routeur, préfixées par /api/
    path("api/", include(router.urls)),
]
