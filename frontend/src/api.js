// Client HTTP centralisé pour parler à l'API Django.
// Tous les appels réseau du frontend passent par cet objet « api ».
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
});

// --- Intercepteur : joint automatiquement le jeton JWT à chaque requête ---
// Avant chaque appel, on lit le jeton stocké dans le navigateur (localStorage)
// et on l'ajoute dans l'en-tête Authorization.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Intercepteur de réponse : gère les jetons expirés / invalides ---
// Si l'API renvoie 401 alors qu'on avait envoyé un jeton, c'est que ce jeton
// est expiré ou invalide : on le purge (déconnexion) et on rejoue la requête
// SANS jeton, pour que les routes publiques (catalogue, quiz...) fonctionnent.
api.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    const { response, config } = erreur;
    const avaitJeton = !!config?.headers?.Authorization;

    if (response?.status === 401 && avaitJeton && !config._rejoue) {
      // On purge la session expirée
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("utilisateur");
      // On prévient l'application (le contexte d'auth remet l'UI à « déconnecté »)
      window.dispatchEvent(new Event("session-expiree"));
      // On rejoue une seule fois, sans le jeton
      config._rejoue = true;
      delete config.headers.Authorization;
      return api(config);
    }
    return Promise.reject(erreur);
  }
);

export default api;
