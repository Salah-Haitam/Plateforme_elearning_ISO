"""Serializers des quiz, résultats et profils de compétence.

Attention sécurité : quand un apprenant PASSE un quiz, on ne doit pas lui
révéler quelle réponse est correcte. On propose donc deux serializers de
réponse : un « public » (sans est_correcte) et un « complet » (pour l'admin)."""

from rest_framework import serializers

from .models import Quiz, Question, Reponse, Resultat, ProfilCompetence


class ReponsePubliqueSerializer(serializers.ModelSerializer):
    """Réponse telle que vue par l'apprenant : SANS le champ est_correcte."""

    class Meta:
        model = Reponse
        fields = ["id", "texte"]


class QuestionPubliqueSerializer(serializers.ModelSerializer):
    reponses = ReponsePubliqueSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "enonce", "niveau_difficulte", "clause_hls", "reponses"]


class QuizSerializer(serializers.ModelSerializer):
    """Quiz avec ses questions et réponses (version pour passer le quiz)."""

    questions = QuestionPubliqueSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = [
            "id", "titre", "niveau_difficulte",
            "cours", "est_quiz_decouverte", "questions",
        ]


class ResultatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resultat
        fields = ["id", "utilisateur", "quiz", "score", "date_passage"]
        # score et utilisateur sont calculés/déduits côté serveur
        read_only_fields = ["score", "utilisateur", "date_passage"]


class ProfilCompetenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfilCompetence
        fields = ["id", "apprenant", "cours", "niveau_maitrise", "derniere_maj"]
        read_only_fields = ["apprenant", "niveau_maitrise", "derniere_maj"]
