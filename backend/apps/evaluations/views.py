"""Vues des quiz, de la soumission des réponses et de la consultation des
résultats / profils de compétence."""

from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Quiz, Question, Reponse, Resultat, ProfilCompetence, ReponseDonnee,
    ProgressionSousPartie, TypeQuiz,
)

# Seuil de réussite du quiz de découverte (visiteurs) : 30 bonnes réponses
SEUIL_DECOUVERTE = 30
from .serializers import (
    QuizSerializer,
    ResultatSerializer,
    ProfilCompetenceSerializer,
)
from .services import mettre_a_jour_competence, recommander
from .stats import tableau_de_bord
from .generation import generer_quiz
from . import adaptatif
from apps.catalogue.models import Cours, Chapitre, SousChapitre
from apps.assistant.llm import LLMNonConfigure
from apps.utilisateurs.permissions import EstAdminOuRH, EstAdmin


class QuizDecouverteView(APIView):
    """GET /api/quiz-decouverte/ -> renvoie le quiz de découverte (public, visiteurs).
    Les bonnes réponses ne sont pas exposées."""

    permission_classes = [AllowAny]

    def get(self, request):
        quiz = Quiz.objects.filter(est_quiz_decouverte=True).order_by("-id").first()
        if not quiz:
            return Response(
                {"detail": "Le quiz de découverte n'est pas encore disponible."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(QuizSerializer(quiz).data)


class SoumettreDecouverteView(APIView):
    """POST /api/quiz-decouverte/soumettre/ -> le VISITEUR soumet ses réponses.

    Corps : { "nom": "...", "prenom": "...", "reponses": [{question, reponse}] }
    Enregistre le résultat au nom du visiteur. Réussite si >= 30 bonnes réponses.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        nom = (request.data.get("nom") or "").strip()
        prenom = (request.data.get("prenom") or "").strip()
        soumissions = request.data.get("reponses", [])

        if not nom or not prenom:
            return Response(
                {"detail": "Veuillez saisir votre nom et votre prénom."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        quiz = Quiz.objects.filter(est_quiz_decouverte=True).order_by("-id").first()
        if not quiz:
            return Response({"detail": "Quiz de découverte indisponible."},
                            status=status.HTTP_404_NOT_FOUND)

        ids_corrects = set(
            Reponse.objects.filter(question__quiz=quiz, est_correcte=True)
            .values_list("id", flat=True)
        )
        nb_questions = quiz.questions.count()
        nb_correctes = sum(1 for item in soumissions if item.get("reponse") in ids_corrects)
        score = round(100 * nb_correctes / nb_questions, 2) if nb_questions else 0
        reussi = nb_correctes >= SEUIL_DECOUVERTE

        Resultat.objects.create(
            quiz=quiz, type_resultat=TypeQuiz.DECOUVERTE,
            nom_visiteur=nom, prenom_visiteur=prenom,
            score=score, nb_correctes=nb_correctes, nb_questions=nb_questions,
        )

        return Response({
            "score": score,
            "nb_correctes": nb_correctes,
            "nb_questions": nb_questions,
            "seuil": SEUIL_DECOUVERTE,
            "reussi": reussi,
            "message": (
                f"Bravo {prenom} ! Vous avez {nb_correctes}/{nb_questions}. "
                "Créez un compte pour suivre une formation adaptée."
                if reussi else
                f"{prenom}, vous avez obtenu {nb_correctes}/{nb_questions} (moins de "
                f"{SEUIL_DECOUVERTE}). Nous vous recommandons de commencer par les fondamentaux."
            ),
        })


class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    """
      GET /api/quiz/                 -> liste des quiz
      GET /api/quiz/{id}/            -> un quiz avec ses questions/réponses
      POST /api/quiz/{id}/soumettre/ -> soumettre ses réponses et obtenir le score

    La consultation est publique (un visiteur peut passer le quiz de découverte).
    L'enregistrement du résultat n'a lieu que si l'utilisateur est connecté.
    """

    queryset = Quiz.objects.all().prefetch_related("questions__reponses")
    serializer_class = QuizSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=["post"], permission_classes=[AllowAny])
    def soumettre(self, request, pk=None):
        """
        Reçoit les réponses choisies et calcule le score.

        Format attendu du corps (JSON) :
            { "reponses": [ {"question": 1, "reponse": 3}, ... ] }
        où « reponse » est l'id de la réponse choisie pour cette question.
        """
        quiz = self.get_object()
        soumissions = request.data.get("reponses", [])

        if not isinstance(soumissions, list) or not soumissions:
            return Response(
                {"detail": "Fournir une liste 'reponses' non vide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Ensemble des ids de réponses correctes pour ce quiz (une requête)
        ids_corrects = set(
            Reponse.objects.filter(
                question__quiz=quiz, est_correcte=True
            ).values_list("id", flat=True)
        )
        nb_questions = quiz.questions.count()
        if nb_questions == 0:
            return Response(
                {"detail": "Ce quiz ne contient aucune question."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # On compte les réponses justes, en gardant le détail par question
        nb_correctes = 0
        detail = []  # [(question_id, est_correcte)]
        for item in soumissions:
            id_reponse = item.get("reponse")
            id_question = item.get("question")
            correcte = id_reponse in ids_corrects
            if correcte:
                nb_correctes += 1
            detail.append((id_question, correcte))

        score = round(100 * nb_correctes / nb_questions, 2)

        # On enregistre le résultat SI l'utilisateur est connecté
        resultat_id = None
        niveau_maitrise = None
        if request.user and request.user.is_authenticated:
            resultat = Resultat.objects.create(
                utilisateur=request.user, quiz=quiz, score=score
            )
            resultat_id = resultat.id

            # Détail par question (pour les stats « clauses les plus ratées »)
            ReponseDonnee.objects.bulk_create([
                ReponseDonnee(resultat=resultat, question_id=qid, est_correcte=ok)
                for qid, ok in detail
                if qid is not None
            ])

            # --- MOTEUR ADAPTATIF ---
            # Si le quiz est rattaché à un cours, on met à jour le niveau de
            # maîtrise de l'apprenant sur ce cours.
            if quiz.cours_id:
                profil = mettre_a_jour_competence(request.user, quiz.cours, score)
                niveau_maitrise = profil.niveau_maitrise

        return Response(
            {
                "score": score,
                "nb_questions": nb_questions,
                "nb_correctes": nb_correctes,
                "resultat_id": resultat_id,
                "enregistre": resultat_id is not None,
                "niveau_maitrise": niveau_maitrise,  # 0..1, null si non applicable
            },
            status=status.HTTP_200_OK,
        )


class ResultatViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/resultats/ -> l'utilisateur connecté voit SES propres résultats."""

    serializer_class = ResultatSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Resultat.objects.filter(utilisateur=self.request.user)


class ProfilCompetenceViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/profils-competence/ -> les profils de compétence de l'apprenant connecté."""

    serializer_class = ProfilCompetenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ProfilCompetence.objects.filter(apprenant=self.request.user)


class RecommandationView(APIView):
    """GET /api/recommandations/ -> suggestions personnalisées (moteur adaptatif).

    S'appuie sur les niveaux de maîtrise de l'apprenant connecté :
    remédiation si maîtrise faible, approfondissement si maîtrise élevée.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(recommander(request.user))


class TableauDeBordView(APIView):
    """GET /api/statistiques/ -> statistiques globales (réservé Admin / RH)."""

    permission_classes = [EstAdminOuRH]

    def get(self, request):
        return Response(tableau_de_bord())


class GenererQuizView(APIView):
    """POST /api/cours/<id>/generer-quiz/ -> l'Agent IA génère un quiz pour ce
    cours à partir de son contenu (réservé aux administrateurs).

    Corps optionnel : { "nombre": 6 }
    """

    permission_classes = [EstAdmin]

    def post(self, request, cours_id):
        cours = get_object_or_404(Cours, id=cours_id)
        nombre = int(request.data.get("nombre", 5))
        try:
            quiz = generer_quiz(cours, nombre=nombre)
        except LLMNonConfigure:
            return Response(
                {"detail": "Service IA non configuré (clé LLM manquante)."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as e:
            return Response(
                {"detail": f"Échec de la génération : {e}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response(
            {
                "quiz_id": quiz.id,
                "titre": quiz.titre,
                "nb_questions": quiz.questions.count(),
            },
            status=status.HTTP_201_CREATED,
        )


# ===========================================================================
#  PARCOURS ADAPTATIF (machine à états : micro-quiz -> quiz final)
# ===========================================================================

def _gerer_erreurs_ia(fn):
    """Exécute une action du moteur et convertit les erreurs en réponses HTTP."""
    try:
        return None, fn()
    except PermissionError as e:
        return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN), None
    except LLMNonConfigure:
        return Response({"detail": "Service IA non configuré (clé LLM manquante)."},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE), None
    except ValueError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST), None
    except Exception as e:
        return Response({"detail": f"Erreur : {e}"}, status=status.HTTP_502_BAD_GATEWAY), None


class ParcoursView(APIView):
    """GET /api/cours/<id>/parcours/ -> état de progression de l'apprenant
    (chapitres, sous-parties, statuts verrouillé/en cours/validé)."""

    permission_classes = [IsAuthenticated]

    def get(self, request, cours_id):
        cours = get_object_or_404(Cours, id=cours_id)
        return Response(adaptatif.etat_cours(request.user, cours))


class ContenuSousPartieView(APIView):
    """GET /api/sous-parties/<id>/contenu/ -> contenu de la sous-partie + la
    version simplifiée (IA) propre à l'apprenant, si elle a été générée."""

    permission_classes = [IsAuthenticated]

    def get(self, request, sous_id):
        sc = get_object_or_404(SousChapitre, id=sous_id)
        prog = ProgressionSousPartie.objects.filter(
            apprenant=request.user, sous_chapitre=sc
        ).first()
        return Response({
            "id": sc.id,
            "titre": sc.titre,
            "contenu": sc.contenu,
            "contenu_simplifie": prog.contenu_simplifie if prog else "",
            "statut": prog.statut if prog else "VERROUILLE",
            "lu": prog.lu if prog else False,
        })


class MarquerLuView(APIView):
    """POST /api/sous-parties/<id>/lu/ -> marque la sous-partie comme lue."""

    permission_classes = [IsAuthenticated]

    def post(self, request, sous_id):
        sc = get_object_or_404(SousChapitre, id=sous_id)
        err, _ = _gerer_erreurs_ia(lambda: adaptatif.marquer_lu(request.user, sc))
        if err:
            return err
        return Response({"detail": "Sous-partie marquée comme lue."})


class DemarrerMicroQuizView(APIView):
    """POST /api/sous-parties/<id>/micro-quiz/ -> génère et renvoie un micro-quiz."""

    permission_classes = [IsAuthenticated]

    def post(self, request, sous_id):
        sc = get_object_or_404(SousChapitre, id=sous_id)
        err, quiz = _gerer_erreurs_ia(lambda: adaptatif.demarrer_micro_quiz(request.user, sc))
        if err:
            return err
        return Response(QuizSerializer(quiz).data, status=status.HTTP_201_CREATED)


class SoumettreMicroQuizView(APIView):
    """POST /api/quiz/<id>/soumettre-micro/ -> corrige le micro-quiz et fait
    avancer la progression (simplification IA si échec)."""

    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        quiz = get_object_or_404(Quiz, id=quiz_id, apprenant=request.user)
        soumissions = request.data.get("reponses", [])
        err, res = _gerer_erreurs_ia(
            lambda: adaptatif.soumettre_micro_quiz(request.user, quiz, soumissions)
        )
        if err:
            return err
        return Response(res)


class DemarrerQuizFinalView(APIView):
    """POST /api/chapitres/<id>/quiz-final/ -> génère le quiz final de chapitre."""

    permission_classes = [IsAuthenticated]

    def post(self, request, chapitre_id):
        chap = get_object_or_404(Chapitre, id=chapitre_id)
        err, quiz = _gerer_erreurs_ia(lambda: adaptatif.demarrer_quiz_final(request.user, chap))
        if err:
            return err
        return Response(QuizSerializer(quiz).data, status=status.HTTP_201_CREATED)


class SoumettreQuizFinalView(APIView):
    """POST /api/quiz/<id>/soumettre-final/ -> corrige le quiz final et valide
    (ou non) le chapitre."""

    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        quiz = get_object_or_404(Quiz, id=quiz_id, apprenant=request.user)
        soumissions = request.data.get("reponses", [])
        err, res = _gerer_erreurs_ia(
            lambda: adaptatif.soumettre_quiz_final(request.user, quiz, soumissions)
        )
        if err:
            return err
        return Response(res)
