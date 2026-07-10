// Service central d'appel à l'API Django (axios).
// - Joint automatiquement le jeton JWT (stocké de façon sécurisée avec SecureStore).
// - Renouvelle le jeton d'accès expiré via le jeton de rafraîchissement.
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../../config";

const api = axios.create({ baseURL: API_URL, timeout: 20000 });

// Callback appelé quand la session est définitivement terminée (le contexte
// d'auth s'y branche pour remettre l'app en état « déconnecté »).
let surDeconnexion = () => {};
export function definirSurDeconnexion(fn) {
  surDeconnexion = fn;
}

// --- Intercepteur de requête : ajoute le jeton d'accès ---
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Renouvellement du jeton (une seule demande à la fois) ---
let refreshEnCours = null;
async function rafraichirJeton() {
  const refresh = await SecureStore.getItemAsync("refresh");
  if (!refresh) throw new Error("Aucun jeton de rafraîchissement");
  if (!refreshEnCours) {
    refreshEnCours = axios
      .post(`${API_URL}/token/refresh/`, { refresh })
      .then(async (r) => {
        await SecureStore.setItemAsync("access", r.data.access);
        return r.data.access;
      })
      .finally(() => { refreshEnCours = null; });
  }
  return refreshEnCours;
}

// Purge les jetons stockés et remet l'app en état « déconnecté ».
async function terminerSession() {
  await SecureStore.deleteItemAsync("access");
  await SecureStore.deleteItemAsync("refresh");
  await SecureStore.deleteItemAsync("utilisateur");
  surDeconnexion();
}

// --- Intercepteur de réponse : gère le 401 (jeton expiré ou invalide) ---
// Deux cas : (1) jeton d'accès expiré -> on le renouvelle et on rejoue ;
// (2) jeton renouvelé TOUJOURS refusé (compte supprimé, base changée,
// `user_id` obsolète...) -> la session est morte, on la termine proprement.
api.interceptors.response.use(
  (reponse) => reponse,
  async (erreur) => {
    const { response, config } = erreur;
    if (!response || response.status !== 401 || !config) {
      return Promise.reject(erreur);
    }
    if (!config.headers?.Authorization) return Promise.reject(erreur);

    // Cas 1 : première tentative -> renouveler le jeton d'accès
    if (!config._rejoue) {
      config._rejoue = true;
      try {
        const nouveau = await rafraichirJeton();
        config.headers.Authorization = `Bearer ${nouveau}`;
        return api(config); // on rejoue la requête avec le nouveau jeton
      } catch {
        // renouvellement impossible -> on termine la session ci-dessous
      }
    }

    // Cas 2 : renouvellement impossible, ou jeton renouvelé encore refusé
    await terminerSession();
    return Promise.reject(erreur);
  }
);

export default api;
