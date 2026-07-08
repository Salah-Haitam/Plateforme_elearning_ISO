from rest_framework import serializers

from .models import BaseConnaissance, Document, ConversationIA, Agent


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["id", "base_connaissance", "titre", "contenu", "categorie", "url"]


class BaseConnaissanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseConnaissance
        fields = ["id", "source", "domaine"]


class ConversationIASerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversationIA
        fields = ["id", "message", "reponse", "horodatage"]
        read_only_fields = ["reponse", "horodatage"]


class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ["id", "type", "description", "actif"]
