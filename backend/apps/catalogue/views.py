"""Vues du catalogue. Le catalogue est consultable publiquement (visiteurs),
mais seul un admin peut créer/modifier des cours."""

from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import Cours
from .serializers import CoursListeSerializer, CoursDetailSerializer


class CoursViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoints générés automatiquement :
      GET /api/cours/       -> liste des cours (version légère)
      GET /api/cours/{id}/  -> détail d'un cours (hiérarchie complète)

    On reste en lecture seule ici (ReadOnly) : la création/édition des cours se
    fait via l'admin Django. (On pourra ouvrir l'écriture aux admins à l'étape 4.)
    """

    queryset = Cours.objects.all().prefetch_related(
        "chapitres__sous_chapitres__medias"
    )
    permission_classes = [AllowAny]  # catalogue public

    def get_serializer_class(self):
        # Liste -> serializer léger ; détail -> serializer complet imbriqué
        if self.action == "retrieve":
            return CoursDetailSerializer
        return CoursListeSerializer
