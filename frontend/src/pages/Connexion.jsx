// Page de connexion.
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Connexion() {
  const { connexion } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  async function gererSoumission(e) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await connexion(email, motDePasse);
      navigate("/catalogue"); // redirection après connexion
    } catch {
      setErreur("Email ou mot de passe incorrect.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="page">
      <form className="form-carte" onSubmit={gererSoumission}>
        <h1 style={{ marginTop: 0 }}>Connexion</h1>

        {erreur && <div className="message erreur">{erreur}</div>}

        <div className="champ">
          <label>Adresse email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="champ">
          <label>Mot de passe</label>
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
          />
        </div>

        <button className="btn btn-plein" disabled={chargement}>
          {chargement ? "Connexion…" : "Se connecter"}
        </button>

        <p className="muted" style={{ marginTop: 16, textAlign: "center" }}>
          Pas encore de compte ? <Link to="/inscription">S'inscrire</Link>
        </p>
      </form>
    </div>
  );
}
