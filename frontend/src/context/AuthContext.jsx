// Contexte d'authentification : rend l'utilisateur connecté (et les actions
// de connexion/déconnexion) disponibles dans TOUTE l'application, sans avoir
// à passer les infos de composant en composant.
import { createContext, useContext, useEffect, useState } from "react";
import {
  seConnecter as apiConnexion,
  seDeconnecter as apiDeconnexion,
  utilisateurCourant,
} from "../auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Au démarrage, on récupère l'utilisateur éventuellement déjà connecté
  const [utilisateur, setUtilisateur] = useState(utilisateurCourant());

  // Si l'API signale une session expirée (jeton invalide), on repasse en
  // « déconnecté » dans toute l'interface.
  useEffect(() => {
    const gerer = () => setUtilisateur(null);
    window.addEventListener("session-expiree", gerer);
    return () => window.removeEventListener("session-expiree", gerer);
  }, []);

  async function connexion(email, motDePasse) {
    const u = await apiConnexion(email, motDePasse);
    setUtilisateur(u);
    return u;
  }

  function deconnexion() {
    apiDeconnexion();
    setUtilisateur(null);
  }

  return (
    <AuthContext.Provider value={{ utilisateur, connexion, deconnexion }}>
      {children}
    </AuthContext.Provider>
  );
}

// Petit raccourci pour utiliser le contexte : const { utilisateur } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
