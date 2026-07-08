"""
Serializers = traducteurs entre les objets Python (modèles) et le JSON de l'API.
"""

from rest_framework import serializers

from .models import Utilisateur


class UtilisateurSerializer(serializers.ModelSerializer):
    """Lecture/écriture d'un utilisateur. Le mot de passe est en écriture seule
    (jamais renvoyé dans les réponses) et correctement haché à la création."""

    # write_only : accepté en entrée mais jamais renvoyé dans le JSON de sortie
    password = serializers.CharField(write_only=True, min_length=6, required=True)

    class Meta:
        model = Utilisateur
        fields = ["id", "nom", "email", "role", "password"]
        # Le rôle ne peut pas être choisi librement à l'inscription publique :
        # on le force côté vue. Ici on l'autorise en lecture seule par défaut
        # pour l'admin ; l'inscription visiteur passe par un serializer dédié.

    def create(self, validated_data):
        # On utilise le manager pour hacher le mot de passe correctement.
        password = validated_data.pop("password")
        utilisateur = Utilisateur(**validated_data)
        utilisateur.set_password(password)
        utilisateur.save()
        return utilisateur

    def update(self, instance, validated_data):
        # Si un mot de passe est fourni lors d'une mise à jour, on le hache.
        password = validated_data.pop("password", None)
        for attr, valeur in validated_data.items():
            setattr(instance, attr, valeur)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class InscriptionSerializer(serializers.ModelSerializer):
    """Serializer dédié à l'inscription publique d'un visiteur.
    Le rôle est forcé à APPRENANT (un visiteur qui s'inscrit devient apprenant)."""

    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Utilisateur
        fields = ["id", "nom", "email", "password"]

    def create(self, validated_data):
        # create_user force déjà le hachage ; on impose le rôle APPRENANT.
        return Utilisateur.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            nom=validated_data["nom"],
            role=Utilisateur.Role.APPRENANT,
        )
