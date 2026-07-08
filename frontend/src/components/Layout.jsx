// Mise en page globale : sidebar latérale (desktop) / menu hamburger (mobile).
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home, BookOpen, User, LayoutDashboard, LogIn, UserPlus, LogOut, Menu, X,
  GraduationCap, Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Footer from "./Footer";
import AnimatedBackground from "./AnimatedBackground";

// Un lien de navigation avec icône + état actif
function Lien({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onClick}
      className={({ isActive }) => `lien ${isActive ? "actif" : ""}`}
    >
      <Icon size={19} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout({ children }) {
  const { utilisateur, deconnexion } = useAuth();
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(false); // tiroir mobile
  const fermer = () => setOuvert(false);

  const estAdminRH = utilisateur && (utilisateur.role === "ADMIN" || utilisateur.role === "RH");

  function gererDeconnexion() {
    deconnexion();
    fermer();
    navigate("/connexion");
  }

  return (
    <div className="app-shell">
      {/* Arrière-plan animé (formes géométriques + vagues), sur toutes les pages */}
      <AnimatedBackground opacite={0.15} />

      {/* ---- Sidebar ---- */}
      <aside className={`sidebar ${ouvert ? "ouvert" : ""}`}>
        <div className="marque">
          <span className="logo"><GraduationCap size={22} /></span>
          <span>Marsa&nbsp;ISO</span>
        </div>

        <nav>
          <Lien to="/" icon={Home} label="Accueil" onClick={fermer} />
          <Lien to="/catalogue" icon={BookOpen} label="Catalogue" onClick={fermer} />
          {!utilisateur && <Lien to="/decouverte" icon={Sparkles} label="Quiz découverte" onClick={fermer} />}
          {utilisateur && <Lien to="/profil" icon={User} label="Mon profil" onClick={fermer} />}
          {estAdminRH && (
            <Lien to="/tableau-de-bord" icon={LayoutDashboard} label="Tableau de bord" onClick={fermer} />
          )}
        </nav>

        <div className="bas">
          {utilisateur ? (
            <>
              <div style={{ padding: "8px 6px" }}>
                <div className="role-chip">{utilisateur.role}</div>
                <div style={{ color: "#dbeafe", fontSize: 13, marginTop: 8, paddingLeft: 2 }}>
                  {utilisateur.nom}
                </div>
              </div>
              <div className="lien" onClick={gererDeconnexion}>
                <LogOut size={19} />
                <span>Déconnexion</span>
              </div>
            </>
          ) : (
            <>
              <Lien to="/connexion" icon={LogIn} label="Connexion" onClick={fermer} />
              <Lien to="/inscription" icon={UserPlus} label="Inscription" onClick={fermer} />
            </>
          )}
        </div>
      </aside>

      {/* Voile sombre derrière le tiroir mobile */}
      <div className={`voile-mobile ${ouvert ? "actif" : ""}`} onClick={fermer} />

      {/* ---- Contenu principal ---- */}
      <div className="main-content">
        <div className="topbar-mobile">
          <button onClick={() => setOuvert(true)} aria-label="Ouvrir le menu">
            <Menu size={24} />
          </button>
          <strong>Marsa Maroc · Formations ISO</strong>
        </div>

        <div style={{ flex: 1 }}>{children}</div>
        <Footer />
      </div>
    </div>
  );
}
