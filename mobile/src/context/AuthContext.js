// Contexte d'authentification : rend l'utilisateur connecté disponible partout.
import { createContext, useContext, useEffect, useState } from "react";
import { seConnecter, seDeconnecter, utilisateurStocke } from "../services/auth";
import { definirSurDeconnexion } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true); // vrai pendant la vérif initiale

  useEffect(() => {
    // Au démarrage : récupère l'éventuel utilisateur déjà connecté
    utilisateurStocke()
      .then(setUtilisateur)
      .finally(() => setChargement(false));

    // Si la session expire (jeton irrécupérable), on repasse en « déconnecté »
    definirSurDeconnexion(() => setUtilisateur(null));
  }, []);

  async function connexion(email, motDePasse) {
    const u = await seConnecter(email, motDePasse);
    setUtilisateur(u);
    return u;
  }

  async function deconnexion() {
    await seDeconnecter();
    setUtilisateur(null);
  }

  return (
    <AuthContext.Provider value={{ utilisateur, chargement, connexion, deconnexion }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
