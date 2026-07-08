from django.contrib import admin

from .models import (
    Quiz, Question, Reponse, Resultat, ProfilCompetence, ReponseDonnee,
    ProgressionSousPartie, ProgressionChapitre, HistoriqueQuestion,
)


@admin.register(ProgressionSousPartie)
class ProgressionSousPartieAdmin(admin.ModelAdmin):
    list_display = ("apprenant", "sous_chapitre", "statut", "lu", "nb_tentatives", "meilleur_score")
    list_filter = ("statut", "lu")


@admin.register(ProgressionChapitre)
class ProgressionChapitreAdmin(admin.ModelAdmin):
    list_display = ("apprenant", "chapitre", "statut", "nb_tentatives", "meilleur_score")
    list_filter = ("statut",)


@admin.register(HistoriqueQuestion)
class HistoriqueQuestionAdmin(admin.ModelAdmin):
    list_display = ("apprenant", "enonce", "date_posee")


class ReponseInline(admin.TabularInline):
    model = Reponse
    extra = 2


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("titre", "niveau_difficulte", "cours", "est_quiz_decouverte")
    list_filter = ("niveau_difficulte", "est_quiz_decouverte")
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("enonce", "quiz", "niveau_difficulte", "clause_hls")
    list_filter = ("quiz", "niveau_difficulte")
    inlines = [ReponseInline]


@admin.register(Resultat)
class ResultatAdmin(admin.ModelAdmin):
    list_display = ("utilisateur", "quiz", "score", "date_passage")
    list_filter = ("quiz",)
    search_fields = ("utilisateur__email", "utilisateur__nom")


@admin.register(ProfilCompetence)
class ProfilCompetenceAdmin(admin.ModelAdmin):
    list_display = ("apprenant", "cours", "niveau_maitrise", "derniere_maj")
    list_filter = ("cours",)
    search_fields = ("apprenant__email", "apprenant__nom")


@admin.register(ReponseDonnee)
class ReponseDonneeAdmin(admin.ModelAdmin):
    list_display = ("resultat", "question", "est_correcte")
    list_filter = ("est_correcte",)
