// Fonctions d'authentification : connexion, inscription, déconnexion.
// Les jetons + l'utilisateur sont stockés de façon sécurisée (expo-secure-store).
import * as SecureStore from "expo-secure-store";
import api from "./api";

export async function seConnecter(email, password) {
  const { data } = await api.post("/token/", { email, password });
  await SecureStore.setItemAsync("access", data.access);
  await SecureStore.setItemAsync("refresh", data.refresh);
  await SecureStore.setItemAsync("utilisateur", JSON.stringify(data.utilisateur));
  return data.utilisateur;
}

export async function sInscrire(nom, email, password) {
  const { data } = await api.post("/inscription/", { nom, email, password });
  return data;
}

export async function seDeconnecter() {
  await SecureStore.deleteItemAsync("access");
  await SecureStore.deleteItemAsync("refresh");
  await SecureStore.deleteItemAsync("utilisateur");
}

// Récupère l'utilisateur déjà connecté au démarrage de l'app (ou null).
export async function utilisateurStocke() {
  const brut = await SecureStore.getItemAsync("utilisateur");
  return brut ? JSON.parse(brut) : null;
}
