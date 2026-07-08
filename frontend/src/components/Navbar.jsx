// Barre de navigation. Affiche des liens différents selon que l'utilisateur
// est connecté ou non, et selon son rôle.
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { utilisateur, deconnexion } = useAuth();
  const navigate = useNavigate();

  function gererDeconnexion() {
    deconnexion();
    navigate("/connexion");
  }

  return (
    <header className="navbar">
      <Link to="/" className="marque">
        <span className="logo-vague">🌊</span>
        Marsa Maroc · Formations ISO
      </Link>
      <nav>
        <Link to="/catalogue">Catalogue</Link>

        {utilisateur ? (
          <>
            {/* L'assistant IA est désormais un bouton flottant (en bas à droite) */}
            {/* Lien tableau de bord visible seulement pour Admin et RH */}
            {(utilisateur.role === "ADMIN" || utilisateur.role === "RH") && (
              <Link to="/tableau-de-bord">Tableau de bord</Link>
            )}
            <Link to="/profil">Mon profil</Link>
            <span className="role-badge">{utilisateur.role}</span>
            <button className="btn btn-secondaire" onClick={gererDeconnexion}>
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/connexion">Connexion</Link>
            <Link to="/inscription">Inscription</Link>
          </>
        )}
      </nav>
    </header>
  );
}
