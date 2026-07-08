"""Serializers du catalogue. On propose deux niveaux de détail :
- des serializers simples (listes),
- des serializers « imbriqués » qui renvoient toute la hiérarchie d'un cours."""

from rest_framework import serializers

from .models import Cours, Chapitre, SousChapitre, Media


class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = ["id", "type", "url"]


class SousChapitreSerializer(serializers.ModelSerializer):
    medias = MediaSerializer(many=True, read_only=True)

    class Meta:
        model = SousChapitre
        fields = ["id", "titre", "contenu", "ordre", "medias"]


class ChapitreSerializer(serializers.ModelSerializer):
    sous_chapitres = SousChapitreSerializer(many=True, read_only=True)

    class Meta:
        model = Chapitre
        fields = ["id", "titre", "ordre", "chapitre_hls", "sous_chapitres"]


class CoursListeSerializer(serializers.ModelSerializer):
    """Version légère pour l'affichage du catalogue (liste de cours)."""

    class Meta:
        model = Cours
        fields = ["id", "titre", "norme", "description", "niveau_difficulte"]


class CoursDetailSerializer(serializers.ModelSerializer):
    """Version complète : le cours avec toute sa hiérarchie de contenu."""

    chapitres = ChapitreSerializer(many=True, read_only=True)

    class Meta:
        model = Cours
        fields = [
            "id", "titre", "norme", "description",
            "niveau_difficulte", "date_creation", "chapitres",
        ]
