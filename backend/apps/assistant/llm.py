"""
Client LLM (étape « Generation » du RAG).

Grok (xAI) expose une API compatible OpenAI : on envoie une liste de messages
à l'endpoint /chat/completions et on récupère le texte généré. En changeant
LLM_BASE_URL / LLM_MODEL dans .env, on peut viser un autre fournisseur
compatible OpenAI sans toucher au code.
"""

import os
import time
import requests


class LLMNonConfigure(Exception):
    """Levée quand aucune clé API n'est configurée."""


def llm_est_configure():
    return bool(os.getenv("LLM_API_KEY"))


def appeler_llm(messages, temperature=0.2, timeout=60, max_retries=4):
    """Envoie une conversation au LLM et renvoie le texte de la réponse.

    Gère automatiquement la limite de débit (HTTP 429) et les erreurs
    serveur temporaires (5xx) avec une temporisation croissante.

    `messages` : liste de dicts au format OpenAI, ex :
        [{"role": "system", "content": "..."},
         {"role": "user", "content": "..."}]
    """
    cle = os.getenv("LLM_API_KEY")
    if not cle:
        raise LLMNonConfigure()

    base_url = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")
    modele = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")

    for tentative in range(max_retries):
        reponse = requests.post(
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {cle}",
                "Content-Type": "application/json",
            },
            json={
                "model": modele,
                "messages": messages,
                "temperature": temperature,  # bas = réponses factuelles
            },
            timeout=timeout,
        )

        # Limite de débit (429) ou erreur serveur temporaire (5xx) -> on réessaie
        if reponse.status_code == 429 or reponse.status_code >= 500:
            if tentative < max_retries - 1:
                # On respecte l'en-tête Retry-After si présent, sinon backoff
                attente = float(reponse.headers.get("Retry-After", 2 * (tentative + 1)))
                time.sleep(min(attente, 15))
                continue

        reponse.raise_for_status()
        data = reponse.json()
        return data["choices"][0]["message"]["content"].strip()

    # Toutes les tentatives ont échoué à cause de la limite de débit
    reponse.raise_for_status()
    data = reponse.json()
    return data["choices"][0]["message"]["content"].strip()
