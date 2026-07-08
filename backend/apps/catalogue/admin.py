from django.contrib import admin

from .models import Cours, Chapitre, SousChapitre, Media


# --- Édition « imbriquée » : gérer les sous-niveaux depuis le niveau parent ---

class ChapitreInline(admin.TabularInline):
    model = Chapitre
    extra = 1


class SousChapitreInline(admin.TabularInline):
    model = SousChapitre
    extra = 1


class MediaInline(admin.TabularInline):
    model = Media
    extra = 1


@admin.register(Cours)
class CoursAdmin(admin.ModelAdmin):
    list_display = ("titre", "norme", "niveau_difficulte", "date_creation")
    list_filter = ("norme", "niveau_difficulte")
    search_fields = ("titre", "norme")
    inlines = [ChapitreInline]


@admin.register(Chapitre)
class ChapitreAdmin(admin.ModelAdmin):
    list_display = ("titre", "cours", "ordre", "chapitre_hls")
    list_filter = ("cours",)
    inlines = [SousChapitreInline]


@admin.register(SousChapitre)
class SousChapitreAdmin(admin.ModelAdmin):
    list_display = ("titre", "chapitre", "ordre")
    inlines = [MediaInline]


admin.site.register(Media)
