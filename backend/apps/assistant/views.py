"""Vues de la base documentaire et des conversations IA.

Le point d'entrée du chatbot RAG (recherche + génération via LLM) sera ajouté
à l'étape 7. Ici on expose seulement la gestion des documents et l'historique
des conversations."""

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.utilisateurs.permissions import EstAdmin

from .models import BaseConnaissance, Document, ConversationIA
from .serializers import (
    BaseConnaissanceSerializer,
    DocumentSerializer,
    ConversationIASerializer,
)
from .rag import rechercher_documents, construire_contexte
from .llm import appeler_llm, LLMNonConfigure


# Consigne système : elle CONTRAINT le chatbot à ne répondre qu'à partir des
# documents fournis (c'est le cœur de la promesse « réponses basées uniquement
# sur les documents Marsa Maroc + ISO »).
CONSIGNE_SYSTEME = (
    "Tu es l'assistant de formation ISO de Marsa Maroc. "
    "Réponds en français, de façon claire et concise. "
    "Tu dois répondre UNIQUEMENT à partir des passages de documents fournis "
    "ci-dessous. Si la réponse ne s'y trouve pas, dis explicitement : "
    "« Je ne trouve pas cette information dans la base documentaire. » "
    "N'invente jamais de contenu."
)


class BaseConnaissanceViewSet(viewsets.ModelViewSet):
    """Gestion des bases de connaissance (réservé aux admins)."""

    queryset = BaseConnaissance.objects.all()
    serializer_class = BaseConnaissanceSerializer
    permission_classes = [EstAdmin]


class DocumentViewSet(viewsets.ModelViewSet):
    """Gestion des documents de la base de connaissance (réservé aux admins)."""

    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [EstAdmin]


class ConversationIAViewSet(viewsets.ReadOnlyModelViewSet):
    """L'utilisateur connecté consulte l'historique de SES conversations."""

    serializer_class = ConversationIASerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ConversationIA.objects.filter(utilisateur=self.request.user)


class ChatbotView(APIView):
    """POST /api/chatbot/ -> pose une question au chatbot RAG.

    Corps attendu : { "message": "Ma question ?" }
    Réponse : { "reponse": "...", "sources": [...] }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        question = (request.data.get("message") or "").strip()
        if not question:
            return Response(
                {"detail": "Le champ 'message' est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1) RECHERCHE : passages pertinents dans la base documentaire
        documents = rechercher_documents(question, k=3)
        sources = [{"id": d.id, "titre": d.titre, "url": d.url} for d in documents]

        # Aucun document trouvé -> on ne sollicite pas le LLM inutilement
        if not documents:
            reponse = "Je ne trouve pas cette information dans la base documentaire."
            ConversationIA.objects.create(
                utilisateur=request.user, message=question, reponse=reponse
            )
            return Response({"reponse": reponse, "sources": []})

        # 2) AUGMENTATION : on injecte les passages dans le prompt
        contexte = construire_contexte(documents)
        messages = [
            {"role": "system", "content": CONSIGNE_SYSTEME},
            {
                "role": "user",
                "content": (
                    f"Passages de documents :\n\n{contexte}\n\n"
                    f"Question : {question}"
                ),
            },
        ]

        # 3) GÉNÉRATION : appel au LLM (Grok)
        try:
            reponse = appeler_llm(messages)
        except LLMNonConfigure:
            # Mode dégradé : pas de clé API -> on renvoie les passages trouvés
            reponse = (
                "⚠️ Le service IA n'est pas encore configuré (clé API manquante). "
                "Voici toutefois les passages pertinents trouvés :\n\n"
                + "\n\n".join(f"• {d.titre}" for d in documents)
            )
        except Exception:
            return Response(
                {"detail": "Le service IA est momentanément indisponible."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # 4) On enregistre l'échange dans l'historique
        ConversationIA.objects.create(
            utilisateur=request.user, message=question, reponse=reponse
        )

        return Response({"reponse": reponse, "sources": sources})
