"""
Étape « Retrieval » du RAG : rechercher, dans la base documentaire, les
passages les plus pertinents pour une question.

Choix de simplicité : plutôt qu'une recherche vectorielle (embeddings), qui
demande une base spécialisée (pgvector) et un service d'embeddings, on fait une
recherche par MOTS-CLÉS en Python. C'est suffisant pour un corpus de taille
raisonnable et ça fonctionne sur SQLite comme sur PostgreSQL, sans dépendance.
(On pourra passer aux embeddings plus tard sans changer le reste du RAG.)
"""

import re
import unicodedata

from .models import Document

# Mots trop courants pour être discriminants (on les ignore dans le score)
MOTS_VIDES = {
    "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "à", "a",
    "en", "dans", "pour", "par", "sur", "avec", "que", "qui", "quoi", "est",
    "sont", "ce", "cette", "ces", "il", "elle", "on", "je", "tu", "nous",
    "vous", "quel", "quelle", "comment", "pourquoi", "au", "aux", "se",
}


def _normaliser(texte):
    """Minuscules + suppression des accents, pour comparer sans se soucier de la casse/accents."""
    texte = texte.lower()
    texte = unicodedata.normalize("NFD", texte)
    texte = "".join(c for c in texte if unicodedata.category(c) != "Mn")
    return texte


def _mots_cles(texte):
    """Extrait les mots significatifs d'un texte."""
    mots = re.findall(r"\w+", _normaliser(texte))
    return [m for m in mots if len(m) > 2 and m not in MOTS_VIDES]


def rechercher_documents(question, k=3):
    """Renvoie les k documents les plus pertinents pour la question.

    Score = nombre d'occurrences des mots-clés de la question dans le
    (titre + contenu) du document. On ne garde que les documents au score > 0.
    """
    termes = _mots_cles(question)
    if not termes:
        return []

    resultats = []
    for doc in Document.objects.all():
        texte = _normaliser(f"{doc.titre} {doc.contenu}")
        score = sum(texte.count(terme) for terme in termes)
        if score > 0:
            resultats.append((score, doc))

    # Tri par score décroissant, puis on prend les k premiers
    resultats.sort(key=lambda x: x[0], reverse=True)
    return [doc for _, doc in resultats[:k]]


def construire_contexte(documents):
    """Assemble le texte des documents retrouvés, en citant leur source.
    Ce texte sera injecté dans le prompt du LLM."""
    blocs = []
    for i, doc in enumerate(documents, start=1):
        source = doc.base_connaissance
        blocs.append(
            f"[Source {i}] {doc.titre} "
            f"(base : {source.source} — {source.domaine})\n{doc.contenu}"
        )
    return "\n\n".join(blocs)
