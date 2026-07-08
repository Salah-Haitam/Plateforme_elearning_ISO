from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Utilisateur


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    """Configuration de l'affichage des utilisateurs dans l'admin Django."""

    ordering = ("email",)
    list_display = ("email", "nom", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("email", "nom")

    # Organisation des champs sur la fiche utilisateur (login par email)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Informations", {"fields": ("nom", "role")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    # Champs affichés lors de la création d'un utilisateur dans l'admin
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "nom", "role", "password1", "password2"),
        }),
    )
