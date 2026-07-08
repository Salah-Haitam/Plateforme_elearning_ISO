from django.contrib import admin

from .models import BaseConnaissance, Document, ConversationIA, Agent


class DocumentInline(admin.TabularInline):
    model = Document
    extra = 1


@admin.register(BaseConnaissance)
class BaseConnaissanceAdmin(admin.ModelAdmin):
    list_display = ("source", "domaine")
    search_fields = ("source", "domaine")
    inlines = [DocumentInline]


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("titre", "base_connaissance", "categorie")
    list_filter = ("base_connaissance", "categorie")
    search_fields = ("titre", "contenu")


@admin.register(ConversationIA)
class ConversationIAAdmin(admin.ModelAdmin):
    list_display = ("utilisateur", "horodatage")
    search_fields = ("message", "reponse")


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ("type", "actif", "description")
    list_filter = ("type", "actif")
