// Quiz de découverte (VISITEUR, public). Étapes :
//  1) saisir nom + prénom  ->  2) passer le quiz (50 Q)  ->  3) résultat
// Si le score est inférieur à 30 bonnes réponses, un message ROUGE s'affiche.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import api from "../api";
import QuizPassage from "../components/QuizPassage";

export default function Decouverte() {
  const [etape, setEtape] = useState("form"); // form | quiz | resultat
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [resultat, setResultat] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  // Étape 1 -> charge le quiz de découverte
  async function commencer(e) {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim()) {
      setErreur("Veuillez saisir votre nom et votre prénom.");
      return;
    }
    setErreur(null);
    setChargement(true);
    try {
      const { data } = await api.get("/quiz-decouverte/");
      setQuiz(data);
      setEtape("quiz");
    } catch {
      setErreur("Le quiz de découverte n'est pas encore disponible.");
    } finally {
      setChargement(false);
    }
  }

  // Étape 2 -> soumission
  async function soumettre(reponses) {
    setChargement(true);
    try {
      const { data } = await api.post("/quiz-decouverte/soumettre/", {
        nom: nom.trim(), prenom: prenom.trim(), reponses,
      });
      setResultat(data);
      setEtape("resultat");
    } catch {
      setErreur("Erreur lors de l'envoi de vos réponses.");
    } finally {
      setChargement(false);
    }
  }

  // ----- Écran de chargement -----
  if (chargement) {
    return (
      <div className="page">
        <div className="carte" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 40 }}>⏳</div>
          <p className="muted">Un instant…</p>
        </div>
      </div>
    );
  }

  // ----- Étape 1 : formulaire nom + prénom -----
  if (etape === "form") {
    return (
      <div className="page">
        <form className="form-carte" onSubmit={commencer}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div className="atout" style={{ display: "inline-flex", padding: 0 }}>
              <div className="icone" style={{ margin: 0 }}><Sparkles size={26} /></div>
            </div>
          </div>
          <h1 style={{ marginTop: 0, textAlign: "center" }}>Quiz de découverte</h1>
          <p className="muted" style={{ textAlign: "center" }}>
            Testez vos connaissances des normes ISO (50 questions).
            Renseignez votre identité pour commencer.
          </p>

          {erreur && <div className="message erreur">{erreur}</div>}

          <div className="champ">
            <label>Prénom</label>
            <input value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
          </div>
          <div className="champ">
            <label>Nom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} required />
          </div>

          <button className="btn btn-plein">Commencer le quiz →</button>
        </form>
      </div>
    );
  }

  // ----- Étape 2 : le quiz -----
  if (etape === "quiz" && quiz) {
    return (
      <div className="page">
        <h1>{quiz.titre}</h1>
        <p className="muted">Bonne chance, {prenom} ! Répondez aux 50 questions.</p>
        {erreur && <div className="message erreur">{erreur}</div>}
        <QuizPassage quiz={quiz} onSoumettre={soumettre} enCours={chargement} />
      </div>
    );
  }

  // ----- Étape 3 : résultat (message ROUGE si < 30) -----
  if (etape === "resultat" && resultat) {
    const reussi = resultat.reussi;
    return (
      <div className="page">
        <div className="carte" style={{ textAlign: "center", padding: 40,
          borderTop: `5px solid ${reussi ? "var(--succes)" : "var(--erreur)"}` }}>
          <div style={{ fontSize: 46 }}>{reussi ? "🎉" : "📚"}</div>
          <h1>{resultat.nb_correctes} / {resultat.nb_questions}</h1>
          <p className="muted">Score : {resultat.score}% · seuil de réussite : {resultat.seuil} bonnes réponses</p>

          {/* Message en ROUGE si moins de 30, en vert sinon */}
          <div className={`message ${reussi ? "succes" : "erreur"}`} style={{ fontSize: 16, fontWeight: 500 }}>
            {resultat.message}
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/inscription" className="btn">Créer un compte</Link>
            <Link to="/catalogue" className="btn btn-secondaire">Voir le catalogue</Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
