"""
Commande : génère le quiz de découverte (visiteurs), 50 questions par défaut.

Usage :
    python manage.py generer_quiz_decouverte --n 50
"""

from django.core.management.base import BaseCommand, CommandError

from apps.assistant.llm import LLMNonConfigure
from apps.evaluations.generation import generer_quiz_decouverte


class Command(BaseCommand):
    help = "Génère le quiz de découverte pour les visiteurs."

    def add_arguments(self, parser):
        parser.add_argument("--n", type=int, default=50, help="Nombre de questions")

    def handle(self, *args, **options):
        self.stdout.write("Génération du quiz de découverte…")
        try:
            quiz = generer_quiz_decouverte(nombre=options["n"])
        except LLMNonConfigure:
            raise CommandError("Cle LLM manquante (LLM_API_KEY dans .env).")
        except Exception as e:
            raise CommandError(f"Echec : {e}")
        self.stdout.write(self.style.SUCCESS(
            f"OK - Quiz de decouverte #{quiz.id} : {quiz.questions.count()} questions."
        ))
