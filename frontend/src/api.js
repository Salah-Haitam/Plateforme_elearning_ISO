// Client HTTP centralisé pour parler à l'API Django.
// Tous les appels réseau du frontend passent par cet objet « api ».
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({ baseURL: BASE });

// --- Intercepteur : joint automatiquement le jeton JWT à chaque requête ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Renouvellement du jeton d'accès via le jeton de rafraîchissement ---
// Le jeton d'accès dure 60 min ; le jeton de rafraîchissement 7 jours. Quand
// l'accès expire, on en demande un nouveau (sans déconnecter l'utilisateur).
// `refreshEnCours` évite de lancer plusieurs renouvellements simultanés.
let refreshEnCours = null;

function rafraichirJeton() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return Promise.reject(new Error("Aucun jeton de rafraîchissement"));
  if (!refreshEnCours) {
    // On utilise axios « nu » (pas api) pour éviter de repasser par l'intercepteur
    refreshEnCours = axios
      .post(`${BASE}/token/refresh/`, { refresh })
      .then((r) => {
        localStorage.setItem("access", r.data.access);
        return r.data.access;
      })
      .finally(() => { refreshEnCours = null; });
  }
  return refreshEnCours;
}

// Termine la session locale et prévient l'application.
function terminerSession() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("utilisateur");
  window.dispatchEvent(new Event("session-expiree"));
}

// --- Intercepteur de réponse : gère les jetons expirés / invalides ---
// Deux cas de 401 sur une requête portant un jeton :
//   1) jeton d'accès expiré      -> on le renouvelle et on rejoue ;
//   2) jeton renouvelé TOUJOURS refusé (compte supprimé, base de données
//      changée, `user_id` obsolète...) -> la session est morte : on la purge
//      et on rejoue sans jeton, pour que les routes publiques répondent.
api.interceptors.response.use(
  (reponse) => reponse,
  async (erreur) => {
    const { response, config } = erreur;

    if (!response || response.status !== 401 || !config) {
      return Promise.reject(erreur);
    }
    // Déjà rejoué sans jeton : c'est une vraie erreur d'autorisation.
    if (config._sansJeton) return Promise.reject(erreur);
    // 401 sans jeton envoyé : vraie erreur d'autorisation.
    if (!config.headers?.Authorization) return Promise.reject(erreur);

    // Cas 1 : première tentative -> renouveler le jeton d'accès
    if (!config._rejoue) {
      config._rejoue = true;
      try {
        const nouveauJeton = await rafraichirJeton();
        config.headers.Authorization = `Bearer ${nouveauJeton}`;
        return api(config);
      } catch {
        // renouvellement impossible -> on bascule sur la purge ci-dessous
      }
    }

    // Cas 2 : renouvellement impossible, ou jeton renouvelé encore refusé
    terminerSession();
    config._sansJeton = true;
    delete config.headers.Authorization;
    return api(config); // rejoue sans jeton (catalogue, quiz découverte…)
  }
);

export default api;
