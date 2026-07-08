// Fonctions utilitaires d'authentification (connexion, inscription, déconnexion).
// Les jetons et l'utilisateur sont conservés dans localStorage pour rester
// connecté même après un rafraîchissement de la page.
import api from "./api";

// Connexion : envoie email + mot de passe, stocke les jetons + l'utilisateur.
export async function seConnecter(email, password) {
  const { data } = await api.post("/token/", { email, password });
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  localStorage.setItem("utilisateur", JSON.stringify(data.utilisateur));
  return data.utilisateur;
}

// Inscription : crée un compte apprenant.
export async function sInscrire(nom, email, password) {
  const { data } = await api.post("/inscription/", { nom, email, password });
  return data;
}

// Déconnexion : efface les données locales.
export function seDeconnecter() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("utilisateur");
}

// Récupère l'utilisateur connecté (ou null).
export function utilisateurCourant() {
  const brut = localStorage.getItem("utilisateur");
  return brut ? JSON.parse(brut) : null;
}

// Vrai si un utilisateur est connecté.
export function estConnecte() {
  return !!localStorage.getItem("access");
}
