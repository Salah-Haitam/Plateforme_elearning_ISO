"""
Importe dans la base documentaire du chatbot RAG des informations factuelles
sur MARSA MAROC (source : site officiel marsamaroc.co.ma).

Objectif : l'assistant IA peut désormais répondre aux questions relatives à
Marsa Maroc (activités, ports, historique, chiffres, certification ISO), en plus
des questions sur les normes ISO issues des cours.

Ré-exécutable : on remplace les documents de la base « Marsa Maroc — Site officiel ».

    python manage.py importer_marsa_maroc
"""

from django.core.management.base import BaseCommand

from apps.assistant.models import BaseConnaissance, Document

SOURCE = "Marsa Maroc"
DOMAINE = "Site officiel"
URL_SITE = "https://www.marsamaroc.co.ma"

# Documents (titre, url, contenu). Contenu factuel synthétisé depuis le site
# officiel de Marsa Maroc. Chaque document mentionne « Marsa Maroc » pour être
# bien retrouvé par la recherche par mots-clés du RAG.
DOCUMENTS = [
    (
        "Présentation de Marsa Maroc",
        f"{URL_SITE}/fr",
        "Marsa Maroc est le 1er opérateur portuaire au Maroc et le leader national "
        "dans l'exploitation des terminaux portuaires. C'est un opérateur portuaire "
        "multitrafic et multisite, présent sur le trafic import-export et sur le "
        "marché du transbordement. Marsa Maroc accompagne la croissance de ses clients "
        "en proposant des solutions portuaires intégrées.\n\n"
        "La communauté Marsa Maroc réunit plus de 2 500 femmes et hommes, liés par des "
        "valeurs communes : engagement, performance, responsabilité et transparence.\n\n"
        "Les activités de Marsa Maroc s'organisent autour de six domaines :\n"
        "- Conteneurs : manutention et stockage de conteneurs ;\n"
        "- Vracs solides : minerais, céréales, engrais ;\n"
        "- Vracs liquides : hydrocarbures, produits chimiques ;\n"
        "- Conventionnel : marchandises diverses ;\n"
        "- Roulier (RoRo) : véhicules et engins ;\n"
        "- Passagers : services aux voyageurs.\n\n"
        "Marsa Maroc propose deux grandes catégories de services : les services aux "
        "navires (pilotage, remorquage, lamanage) et les services aux marchandises "
        "(manutention, stockage, logistique), ainsi que des services à valeur ajoutée "
        "liés aux opérations portuaires.",
    ),
    (
        "Ports et terminaux de Marsa Maroc",
        f"{URL_SITE}/fr/ports-et-terminaux",
        "Marsa Maroc exploite 34 terminaux répartis dans 20 ports et est présente dans "
        "les 10 principaux ports du Royaume du Maroc. Les ports où opère Marsa Maroc "
        "incluent notamment : Nador, Nador West Med, Al Hoceima, Tanger Med, "
        "Tanger Alliance, Mohammedia, Casablanca, Safi, Jorf Lasfar, Agadir, Laâyoune "
        "et Dakhla. Marsa Maroc développe aussi une présence à l'international, "
        "notamment au port de Cotonou (Bénin).\n\n"
        "Au port de Casablanca, Marsa Maroc opère trois terminaux : un terminal "
        "polyvalent, un terminal à hydrocarbures, et un terminal passagers et roulier. "
        "Le terminal à conteneurs 3 du port de Casablanca est exploité par la filiale "
        "TC3PC. Au port d'Agadir, Marsa Maroc exploite le terminal polyvalent du Quai "
        "Nord via la filiale SMA.",
    ),
    (
        "Historique de Marsa Maroc",
        f"{URL_SITE}/fr/historique",
        "Historique de Marsa Maroc :\n"
        "- 2006 : fondation de la Société d'Exploitation des Ports (SODEP), qui opère "
        "sous la marque « Marsa Maroc » à partir de 2007.\n"
        "- 2009 : obtention de la concession d'exploitation d'un terminal à conteneurs "
        "à Tanger Med 2 (remplacée ultérieurement par celle du TC3).\n"
        "- 2011 : lancement d'un nouveau terminal polyvalent au port de Jorf Lasfar.\n"
        "- 2012 : inauguration d'un espace de stockage vertical pour voitures au port "
        "de Casablanca.\n"
        "- 2015 : certification de l'ensemble des sites opérationnels de Marsa Maroc "
        "aux normes ISO 9001.\n"
        "- 2016 : introduction de Marsa Maroc à la Bourse des Valeurs de Casablanca ; "
        "mise en service du terminal à conteneurs 3 au port de Casablanca (TC3PC) et "
        "du terminal polyvalent Quai Nord au port d'Agadir (SMA).\n"
        "- 2021 : démarrage des opérations du terminal à conteneurs 3 au port de "
        "Tanger Med 2.\n"
        "- 2024 : expansion internationale avec la gestion déléguée des Terminaux 1 et "
        "5 du port de Cotonou (Bénin) et l'obtention de la concession du Terminal à "
        "Conteneurs Est du port de Nador West Med.",
    ),
    (
        "Chiffres clés de Marsa Maroc",
        f"{URL_SITE}/fr/chiffres-cles",
        "Chiffres clés de Marsa Maroc :\n"
        "- 1er opérateur portuaire du Maroc ;\n"
        "- environ 57 millions de tonnes de marchandises manutentionnées par an ;\n"
        "- chiffre d'affaires de l'ordre de 4,32 milliards de dirhams (DHS) ;\n"
        "- plus de 2 500 collaborateurs (femmes et hommes) ;\n"
        "- 34 terminaux exploités dans 20 ports ;\n"
        "- présence dans les 10 principaux ports commerciaux du Royaume.",
    ),
    (
        "Marsa Maroc et les normes ISO",
        f"{URL_SITE}/fr/historique",
        "Marsa Maroc accorde une grande importance à la qualité et à la normalisation. "
        "En 2015, Marsa Maroc a fait certifier l'ensemble de ses sites opérationnels "
        "selon la norme ISO 9001, qui porte sur le système de management de la qualité. "
        "Cette démarche s'inscrit dans l'engagement de Marsa Maroc pour la performance, "
        "la satisfaction des clients et l'amélioration continue de ses services "
        "portuaires. La maîtrise des normes ISO (par exemple ISO 9001 pour la qualité "
        "et ISO/IEC 27001 pour la sécurité de l'information) est ainsi un enjeu clé "
        "pour les collaborateurs de Marsa Maroc.",
    ),
]


class Command(BaseCommand):
    help = "Importe les informations Marsa Maroc (site officiel) dans la base RAG."

    def handle(self, *args, **options):
        base, cree = BaseConnaissance.objects.get_or_create(
            source=SOURCE, domaine=DOMAINE
        )
        # Ré-exécutable : on repart d'une base propre pour cette source
        supprimes = base.documents.count()
        base.documents.all().delete()

        for titre, url, contenu in DOCUMENTS:
            Document.objects.create(
                base_connaissance=base,
                titre=titre,
                contenu=contenu,
                categorie="Marsa Maroc",
                url=url,
            )

        self.stdout.write(self.style.SUCCESS(
            f"Base '{SOURCE} - {DOMAINE}' {'creee' if cree else 'mise a jour'} : "
            f"{len(DOCUMENTS)} documents importes ({supprimes} anciens remplaces)."
        ))
