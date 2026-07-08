"""Personnalisation du jeton JWT : on y ajoute le rôle et le nom, et on renvoie
aussi ces infos dans la réponse de connexion (pratique pour le frontend)."""

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class ConnexionSerializer(TokenObtainPairSerializer):
    """Serializer de connexion. Hérite du comportement JWT standard (vérifie
    email + mot de passe) et enrichit le jeton / la réponse."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Ces données sont encodées DANS le jeton
        token["role"] = user.role
        token["nom"] = user.nom
        return token

    def validate(self, attrs):
        # Réponse standard : {"access": "...", "refresh": "..."}
        data = super().validate(attrs)
        # On ajoute les infos utilisateur pour éviter un appel supplémentaire
        data["utilisateur"] = {
            "id": self.user.id,
            "nom": self.user.nom,
            "email": self.user.email,
            "role": self.user.role,
        }
        return data
