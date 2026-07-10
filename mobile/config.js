// ===========================================================================
// Configuration centrale de l'API Django
// ===========================================================================
// En développement avec Expo Go, l'app doit viser l'IP LOCALE de ton PC
// (PAS "localhost", car "localhost" sur le téléphone = le téléphone lui-même).
//
// ASTUCE : on récupère automatiquement l'IP du PC depuis l'URL du serveur Expo
// (Metro). Ainsi, si ton IP Wi-Fi change, l'app se met à jour toute seule —
// plus besoin de modifier ce fichier. Ton téléphone et ton PC doivent rester
// sur le MÊME réseau Wi-Fi.
import Constants from "expo-constants";

// Repli manuel si la détection automatique échoue (ex : build APK autonome).
// Mets ici l'IP Wi-Fi de ton PC (commande : ipconfig) ou l'URL de production.
const IP_LOCALE_REPLI = "10.164.8.221";
const DEV = true; // passe à false pour utiliser l'URL de production

// URL de production (à renseigner une fois le backend déployé)
const URL_PRODUCTION = "https://mon-domaine-de-production/api";

// Extrait l'IP/hôte depuis l'URL du bundler Expo (ex : "10.164.8.221:8081")
function hoteDepuisExpo() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    "";
  // On ne garde que la partie hôte (avant le ":") et on ignore l'ancien port.
  const hote = hostUri.split(":")[0];
  return hote || null;
}

function urlDev() {
  const hote = hoteDepuisExpo() || IP_LOCALE_REPLI;
  return `http://${hote}:8000/api`;
}

export const API_URL = DEV ? urlDev() : URL_PRODUCTION;

// Petit log au démarrage pour vérifier facilement la cible de l'API
console.log("API_URL =", API_URL);

export default { API_URL };
