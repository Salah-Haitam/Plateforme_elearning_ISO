// Protège une page : si l'utilisateur n'est pas connecté, on le renvoie vers
// la page de connexion. On peut aussi restreindre à certains rôles.
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoutePrivee({ children, roles }) {
  const { utilisateur } = useAuth();

  // Non connecté -> redirection vers connexion
  if (!utilisateur) {
    return <Navigate to="/connexion" replace />;
  }

  // Connecté mais rôle non autorisé -> retour à l'accueil
  if (roles && !roles.includes(utilisateur.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
