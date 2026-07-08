"""
Commande d'import du support de cours Markdown vers la base de données.

Usage :
    python manage.py importer_cours "../cours iso/cours_iso_detaille.md"

Elle lit un fichier structuré (Cours -> Chapitre -> SousChapitre) et :
  1) crée les objets Cours / Chapitre / SousChapitre du catalogue ;
  2) alimente la base de connaissance (BaseConnaissance / Document) pour que
     le chatbot RAG puisse répondre à partir de ce contenu.

La commande est ré-exécutable : elle remplace les cours de mêmes titres.
"""

import re
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.catalogue.models import Cours, Chapitre, SousChapitre, NiveauDifficulte
from apps.assistant.models import BaseConnaissance, Document

# Chemin par défaut vers le fichier de cours (relatif au dossier backend)
CHEMIN_DEFAUT = "../cours iso/cours_iso_detaille.md"


def niveau_depuis_texte(texte):
    """Convertit un libellé de niveau en valeur du modèle."""
    t = texte.lower()
    if "débutant" in t or "debutant" in t:
        return NiveauDifficulte.DEBUTANT
    if "avancé" in t or "avance" in t:
        return NiveauDifficulte.AVANCE
    return NiveauDifficulte.INTERMEDIAIRE


def nettoyer(txt):
    """Retire le gras/italique Markdown et les espaces superflus."""
    return txt.replace("**", "").strip()


class Command(BaseCommand):
    help = "Importe un support de cours Markdown dans le catalogue et la base de connaissance."

    def add_arguments(self, parser):
        parser.add_argument("chemin", nargs="?", default=CHEMIN_DEFAUT,
                            help="Chemin vers le fichier .md du cours")

    @transaction.atomic
    def handle(self, *args, **options):
        chemin = Path(options["chemin"])
        if not chemin.exists():
            raise CommandError(f"Fichier introuvable : {chemin.resolve()}")

        lignes = chemin.read_text(encoding="utf-8").split("\n")

        # État courant pendant le parcours du fichier
        cours = None
        chapitre = None
        base = None
        ordre_chapitre = 0
        ordre_sous = 0
        buffer = []            # lignes de contenu du sous-chapitre en cours
        sous = None            # sous-chapitre en cours
        mode_description = False  # on capture la description du cours ("Pourquoi ?")

        # Compteurs pour le récapitulatif
        n_cours = n_chap = n_sous = n_doc = 0

        def finaliser_sous():
            """Enregistre le contenu accumulé dans le sous-chapitre + crée un Document RAG."""
            nonlocal sous, buffer, n_doc
            if sous is not None:
                sous.contenu = "\n".join(buffer).strip()
                sous.save()
                # Document pour le chatbot RAG
                if base is not None and sous.contenu:
                    Document.objects.create(
                        base_connaissance=base,
                        titre=f"{cours.titre} · {sous.titre}",
                        contenu=sous.contenu,
                        categorie=chapitre.titre if chapitre else "",
                    )
                    n_doc += 1
            sous = None
            buffer = []

        for i, ligne in enumerate(lignes):
            brut = ligne.rstrip()

            # --- Nouveau COURS ---
            m = re.match(r"^# COURS\s+\d+\s*[—-]\s*(.+)", brut)
            if m:
                finaliser_sous()
                titre = nettoyer(m.group(1))
                # On remplace un éventuel cours de même titre (ré-exécution)
                Cours.objects.filter(titre=titre).delete()
                cours = Cours.objects.create(
                    titre=titre, norme="ISO", niveau_difficulte=NiveauDifficulte.DEBUTANT
                )
                chapitre = None
                ordre_chapitre = 0
                mode_description = False
                n_cours += 1
                continue

            # --- Ligne "Norme / Niveau" (juste après le titre du cours) ---
            m = re.match(r"^\*\*Norme\s*:\*\*\s*(.+)", brut)
            if m and cours is not None:
                # ex : "ISO/IEC 27001:2022 · **Niveau :** Intermédiaire"
                partie = m.group(1)
                # Norme = avant le séparateur ·
                norme = nettoyer(partie.split("·")[0]).replace("Norme :", "").strip()
                # On enlève la version (":2022") pour un affichage propre, tout
                # en gardant le numéro (27001, 9001) utile au frontend.
                norme = re.sub(r":\d{4}$", "", norme).strip()
                cours.norme = norme
                m2 = re.search(r"Niveau\s*:\*\*\s*(.+)", partie)
                if m2:
                    cours.niveau_difficulte = niveau_depuis_texte(m2.group(1))
                cours.save()
                continue

            # --- Début de la description ("### Pourquoi ce cours ?") ---
            if re.match(r"^###\s+Pourquoi", brut):
                mode_description = True
                continue

            # --- Nouveau CHAPITRE ---
            m = re.match(r"^## Chapitre\s+(\d+)\s*[—-]\s*(.+)", brut)
            if m and cours is not None:
                finaliser_sous()
                mode_description = False
                # La base de connaissance est créée à la volée pour ce cours
                if base is None or base.domaine != cours.norme:
                    base, _ = BaseConnaissance.objects.get_or_create(
                        source="Marsa Maroc — Support de cours", domaine=cours.norme
                    )
                    # On vide les anciens documents de cette base (ré-exécution)
                    base.documents.all().delete()
                ordre_chapitre += 1
                chapitre = Chapitre.objects.create(
                    cours=cours,
                    titre=nettoyer(m.group(2)),
                    ordre=int(m.group(1)),
                )
                ordre_sous = 0
                n_chap += 1
                continue

            # --- Ligne chapitreHLS (`chapitreHLS : X`) ---
            m = re.search(r"chapitreHLS\s*:\s*([^`]+)", brut)
            if m and chapitre is not None:
                chapitre.chapitre_hls = m.group(1).strip()
                chapitre.save()
                continue

            # --- Nouveau SOUS-CHAPITRE ("### 0.1 — Titre") ---
            m = re.match(r"^###\s+(\d+\.\d+)\s*[—-]\s*(.+)", brut)
            if m and chapitre is not None:
                finaliser_sous()
                ordre_sous += 1
                sous = SousChapitre.objects.create(
                    chapitre=chapitre,
                    titre=nettoyer(m.group(2)),
                    contenu="",
                    ordre=ordre_sous,
                )
                n_sous += 1
                continue

            # --- Lignes de contenu ---
            # On ignore les séparateurs, titres non pertinents et citations
            if brut.strip() in ("---", "") or brut.startswith(">") or brut.startswith("#"):
                if brut.strip() == "" and mode_description and cours and cours.description:
                    mode_description = False  # fin du paragraphe de description
                continue

            texte = nettoyer(brut)
            if mode_description and cours is not None:
                cours.description = (cours.description + " " + texte).strip() if cours.description else texte
                cours.save()
            elif sous is not None:
                buffer.append(texte)

        finaliser_sous()

        self.stdout.write(self.style.SUCCESS(
            f"Import terminé : {n_cours} cours, {n_chap} chapitres, "
            f"{n_sous} sous-chapitres, {n_doc} documents (base de connaissance)."
        ))
