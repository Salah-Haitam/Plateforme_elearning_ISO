"""
Commande : génère des quiz par IA pour un cours (ou tous les cours).

Usage :
    python manage.py generer_quiz --cours 3 --n 6
    python manage.py generer_quiz --tous --n 5
"""

from django.core.management.base import BaseCommand, CommandError

from apps.catalogue.models import Cours
from apps.assistant.llm import LLMNonConfigure
from apps.evaluations.generation import generer_quiz


class Command(BaseCommand):
    help = "Génère des quiz par IA à partir du contenu des cours."

    def add_arguments(self, parser):
        parser.add_argument("--cours", type=int, help="Id du cours ciblé")
        parser.add_argument("--tous", action="store_true", help="Tous les cours")
        parser.add_argument("--n", type=int, default=5, help="Nombre de questions par quiz")

    def handle(self, *args, **options):
        if options["tous"]:
            cours_list = list(Cours.objects.all())
        elif options["cours"]:
            cours_list = list(Cours.objects.filter(id=options["cours"]))
            if not cours_list:
                raise CommandError(f"Aucun cours d'id {options['cours']}.")
        else:
            raise CommandError("Préciser --cours <id> ou --tous.")

        for cours in cours_list:
            self.stdout.write(f"Génération pour « {cours.titre} »…")
            try:
                quiz = generer_quiz(cours, nombre=options["n"])
            except LLMNonConfigure:
                raise CommandError("Clé LLM manquante (LLM_API_KEY dans .env).")
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"  Échec : {e}"))
                continue
            self.stdout.write(self.style.SUCCESS(
                f"  OK - Quiz #{quiz.id} cree avec {quiz.questions.count()} questions."
            ))
