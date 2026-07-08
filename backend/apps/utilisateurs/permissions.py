"""Permissions réutilisables basées sur le rôle de l'utilisateur.

À utiliser dans les vues via `permission_classes = [EstAdmin]`, etc.
"""

from rest_framework.permissions import BasePermission

from .models import Utilisateur


class EstAdmin(BasePermission):
    """Autorise uniquement les administrateurs."""

    message = "Réservé aux administrateurs."

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.role == Utilisateur.Role.ADMIN)


class EstRH(BasePermission):
    """Autorise uniquement le service RH."""

    message = "Réservé au service RH."

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.role == Utilisateur.Role.RH)


class EstApprenant(BasePermission):
    """Autorise uniquement les apprenants."""

    message = "Réservé aux apprenants."

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.role == Utilisateur.Role.APPRENANT)


class EstAdminOuRH(BasePermission):
    """Autorise les administrateurs et le service RH (gestion/suivi)."""

    message = "Réservé aux administrateurs et RH."

    def has_permission(self, request, view):
        u = request.user
        return bool(
            u
            and u.is_authenticated
            and u.role in (Utilisateur.Role.ADMIN, Utilisateur.Role.RH)
        )


class LectureSeulePourTous(BasePermission):
    """Lecture (GET) autorisée à tous ; écriture réservée aux administrateurs.
    Pratique pour le catalogue : consultable par les visiteurs, modifiable par l'admin."""

    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        u = request.user
        return bool(u and u.is_authenticated and u.role == Utilisateur.Role.ADMIN)
