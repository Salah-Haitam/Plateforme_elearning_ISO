"""Vues du catalogue. Le catalogue est RÉSERVÉ AUX UTILISATEURS CONNECTÉS ;
seul un admin peut créer/modifier des cours (via l'admin Django).

Les visiteurs non connectés n'ont accès qu'au quiz de découverte
(/api/quiz-decouverte/), pas au contenu des cours."""

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Cours
from .serializers import CoursListeSerializer, CoursDetailSerializer


class CoursViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoints générés automatiquement :
      GET /api/cours/       -> liste des cours (version légère)
      GET /api/cours/{id}/  -> détail d'un cours (hiérarchie complète)

    On reste en lecture seule ici (ReadOnly) : la création/édition des cours se
    fait via l'admin Django.
    """

    queryset = Cours.objects.all().prefetch_related(
        "chapitres__sous_chapitres__medias"
    )
    permission_classes = [IsAuthenticated]  # catalogue réservé aux connectés

    def get_serializer_class(self):
        # Liste -> serializer léger ; détail -> serializer complet imbriqué
        if self.action == "retrieve":
            return CoursDetailSerializer
        return CoursListeSerializer
