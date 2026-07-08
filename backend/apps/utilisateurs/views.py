"""Vues des utilisateurs : inscription publique, profil courant, gestion (admin)."""

from rest_framework import viewsets, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Utilisateur
from .serializers import UtilisateurSerializer, InscriptionSerializer
from .permissions import EstAdminOuRH


class InscriptionView(generics.CreateAPIView):
    """POST /api/inscription/ -> crée un compte apprenant (accès public)."""

    queryset = Utilisateur.objects.all()
    serializer_class = InscriptionSerializer
    permission_classes = [AllowAny]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def moi(request):
    """GET /api/moi/ -> renvoie les infos de l'utilisateur connecté."""
    serializer = UtilisateurSerializer(request.user)
    return Response(serializer.data)


class UtilisateurViewSet(viewsets.ModelViewSet):
    """
      /api/utilisateurs/  (CRUD complet) -> réservé aux administrateurs.
    Permet à l'admin/RH de gérer les comptes.
    """

    queryset = Utilisateur.objects.all().order_by("email")
    serializer_class = UtilisateurSerializer
    permission_classes = [EstAdminOuRH]  # admin + RH peuvent gérer/suivre les comptes
