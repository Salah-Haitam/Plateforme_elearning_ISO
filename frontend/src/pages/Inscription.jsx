// Page d'inscription (crée un compte apprenant, puis connecte automatiquement).
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { sInscrire } from "../auth";
import { useAuth } from "../context/AuthContext";

export default function Inscription() {
  const { connexion } = useAuth();
  const navigate = useNavigate();

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  async function gererSoumission(e) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await sInscrire(nom, email, motDePasse);
      // On connecte directement l'utilisateur après création du compte
      await connexion(email, motDePasse);
      navigate("/catalogue");
    } catch (err) {
      // L'API renvoie souvent une erreur si l'email existe déjà
      const detail = err?.response?.data?.email?.[0];
      setErreur(detail || "Inscription impossible. Vérifiez vos informations.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="page">
      <form className="form-carte" onSubmit={gererSoumission}>
        <h1 style={{ marginTop: 0 }}>Créer un compte</h1>

        {erreur && <div className="message erreur">{erreur}</div>}

        <div className="champ">
          <label>Nom complet</label>
          <input value={nom} onChange={(e) => setNom(e.target.value)} required />
        </div>
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
          <label>Mot de passe (6 caractères min.)</label>
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            minLength={6}
            required
          />
        </div>

        <button className="btn btn-plein" disabled={chargement}>
          {chargement ? "Création…" : "S'inscrire"}
        </button>

        <p className="muted" style={{ marginTop: 16, textAlign: "center" }}>
          Déjà un compte ? <Link to="/connexion">Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
