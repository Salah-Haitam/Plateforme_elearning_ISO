// Parcours adaptatif : pilote la machine à états côté apprenant.
// Vues successives : aperçu -> lecture -> quiz -> résultat.
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import QuizPassage from "../components/QuizPassage";

// Icône selon le statut d'une sous-partie / d'un chapitre
const ICONE = { VERROUILLE: "🔒", EN_COURS: "📖", VALIDE: "✅" };

export default function Parcours() {
  const { id } = useParams(); // id du cours
  const [parcours, setParcours] = useState(null);
  const [vue, setVue] = useState("apercu"); // apercu | lecture | quiz | resultat
  const [scActive, setScActive] = useState(null);
  const [contenu, setContenu] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [modeQuiz, setModeQuiz] = useState("micro"); // micro | final
  const [resultat, setResultat] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [msgChargement, setMsgChargement] = useState("");
  const [erreur, setErreur] = useState(null);

  function chargerParcours() {
    api.get(`/cours/${id}/parcours/`).then((r) => setParcours(r.data)).catch(() => {});
  }

  useEffect(() => { chargerParcours(); }, [id]);

  // --- Lecture d'une sous-partie ---
  async function ouvrirLecture(sc) {
    setErreur(null);
    setScActive(sc);
    const { data } = await api.get(`/sous-parties/${sc.id}/contenu/`);
    setContenu(data);
    setVue("lecture");
  }

  async function marquerLu() {
    await api.post(`/sous-parties/${scActive.id}/lu/`);
    setContenu((c) => ({ ...c, lu: true }));
  }

  // --- Lancer un micro-quiz (génération IA) ---
  async function lancerMicroQuiz() {
    setChargement(true);
    setMsgChargement("L'agent IA prépare vos 10 questions… (quelques secondes)");
    setErreur(null);
    try {
      const { data } = await api.post(`/sous-parties/${scActive.id}/micro-quiz/`);
      setQuiz(data);
      setModeQuiz("micro");
      setVue("quiz");
    } catch (e) {
      setErreur(e?.response?.data?.detail || "Impossible de générer le quiz.");
    } finally {
      setChargement(false);
    }
  }

  // --- Lancer le quiz final d'un chapitre ---
  async function lancerQuizFinal(chap) {
    setChargement(true);
    setMsgChargement("L'agent IA prépare le quiz final de 50 questions… (patientez)");
    setErreur(null);
    try {
      const { data } = await api.post(`/chapitres/${chap.id}/quiz-final/`);
      setQuiz(data);
      setModeQuiz("final");
      setVue("quiz");
    } catch (e) {
      setErreur(e?.response?.data?.detail || "Impossible de générer le quiz final.");
    } finally {
      setChargement(false);
    }
  }

  // --- Soumettre un quiz ---
  async function soumettreQuiz(reponses) {
    setChargement(true);
    setMsgChargement("Correction en cours…");
    try {
      const url = modeQuiz === "micro"
        ? `/quiz/${quiz.id}/soumettre-micro/`
        : `/quiz/${quiz.id}/soumettre-final/`;
      const { data } = await api.post(url, { reponses });
      setResultat(data);
      setVue("resultat");
      chargerParcours(); // rafraîchit les statuts
    } catch (e) {
      setErreur(e?.response?.data?.detail || "Erreur lors de la correction.");
    } finally {
      setChargement(false);
    }
  }

  function retourApercu() {
    setVue("apercu");
    setResultat(null);
    setQuiz(null);
    setContenu(null);
    chargerParcours();
  }

  if (!parcours) return <div className="page"><p className="muted">Chargement du parcours…</p></div>;

  // ---------- Écran de chargement (génération IA) ----------
  if (chargement) {
    return (
      <div className="page">
        <div className="carte" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 40 }}>🤖</div>
          <h2>Un instant…</h2>
          <p className="muted">{msgChargement}</p>
        </div>
      </div>
    );
  }

  // ---------- Vue LECTURE ----------
  if (vue === "lecture" && contenu) {
    return (
      <div className="page">
        <button className="btn btn-secondaire" style={{ color: "var(--bleu)", borderColor: "var(--bleu)" }} onClick={retourApercu}>← Retour au parcours</button>
        <h1 style={{ marginTop: 16 }}>{contenu.titre}</h1>

        {/* Version simplifiée générée par l'IA après un échec */}
        {contenu.contenu_simplifie && (
          <div className="carte" style={{ borderLeft: "4px solid var(--orange)", background: "#fff8f0" }}>
            <span className="badge orange">🤖 Version simplifiée pour vous</span>
            <p style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>{contenu.contenu_simplifie}</p>
          </div>
        )}

        <div className="carte" style={{ marginTop: 16 }}>
          <h3>Contenu du cours</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{contenu.contenu}</p>
        </div>

        {erreur && <div className="message erreur">{erreur}</div>}

        <div style={{ marginTop: 20, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {!contenu.lu ? (
            <button className="btn btn-bleu" onClick={marquerLu}>✔ J'ai lu cette partie</button>
          ) : (
            <span className="badge">Lu ✅</span>
          )}
          <button className="btn" onClick={lancerMicroQuiz} disabled={!contenu.lu}>
            Passer le micro-quiz (10 questions) →
          </button>
        </div>
        {!contenu.lu && <p className="muted" style={{ marginTop: 8 }}>Vous devez lire la partie avant de passer le quiz.</p>}
      </div>
    );
  }

  // ---------- Vue QUIZ ----------
  if (vue === "quiz" && quiz) {
    return (
      <div className="page">
        <h1>{quiz.titre}</h1>
        <p className="muted">
          {modeQuiz === "micro" ? "Micro-quiz : obtenez au moins 60 % pour valider." : "Quiz final : 60 % pour valider le chapitre."}
        </p>
        {erreur && <div className="message erreur">{erreur}</div>}
        <QuizPassage quiz={quiz} onSoumettre={soumettreQuiz} enCours={chargement} />
      </div>
    );
  }

  // ---------- Vue RÉSULTAT ----------
  if (vue === "resultat" && resultat) {
    const reussi = resultat.reussi;
    return (
      <div className="page">
        <div className="carte" style={{ textAlign: "center", padding: 40,
          borderTop: `5px solid ${reussi ? "var(--succes)" : "var(--erreur)"}` }}>
          <div style={{ fontSize: 44 }}>{reussi ? "🎉" : "💪"}</div>
          <h1>Score : {resultat.score}%</h1>
          <p className="muted">{resultat.nb_correctes} / {resultat.nb_questions} bonnes réponses (seuil : {resultat.seuil_pct}%)</p>
          <div className={`message ${reussi ? "succes" : "erreur"}`}>{resultat.message}</div>

          {/* Échec micro-quiz : proposer la version simplifiée */}
          {!reussi && modeQuiz === "micro" && resultat.contenu_simplifie && (
            <div style={{ textAlign: "left", marginTop: 16 }}>
              <div className="carte" style={{ borderLeft: "4px solid var(--orange)", background: "#fff8f0" }}>
                <span className="badge orange">🤖 Version simplifiée</span>
                <p style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>{resultat.contenu_simplifie}</p>
              </div>
              <button className="btn" style={{ marginTop: 16 }} onClick={() => ouvrirLecture(scActive)}>
                Relire puis réessayer →
              </button>
            </div>
          )}

          {/* Échec quiz final : relire le chapitre */}
          {!reussi && modeQuiz === "final" && (
            <button className="btn" style={{ marginTop: 8 }} onClick={retourApercu}>Relire le chapitre</button>
          )}

          {/* Réussite : continuer */}
          {reussi && (
            <button className="btn" style={{ marginTop: 8 }} onClick={retourApercu}>Continuer le parcours →</button>
          )}
        </div>
      </div>
    );
  }

  // ---------- Vue APERÇU (par défaut) ----------
  return (
    <div className="page">
      <Link to={`/cours/${id}`} className="muted">← Détail du cours</Link>
      <h1 style={{ marginTop: 8 }}>Parcours : {parcours.cours.titre}</h1>
      <p className="muted">Progressez dans l'ordre. Une partie se débloque quand la précédente est validée.</p>

      {parcours.chapitres.map((chap) => (
        <div className="carte" key={chap.id} style={{ marginBottom: 18 }}>
          <h3>
            {ICONE[chap.statut]} Chapitre {chap.ordre} — {chap.titre}
            {chap.chapitre_hls && <span className="badge" style={{ marginLeft: 8 }}>Clause {chap.chapitre_hls}</span>}
          </h3>

          {/* Sous-parties */}
          <div style={{ marginTop: 10 }}>
            {chap.sous_parties.map((sp) => {
              const verrouille = sp.statut === "VERROUILLE";
              return (
                <div key={sp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0", borderBottom: "1px solid var(--bordure)", opacity: verrouille ? 0.5 : 1 }}>
                  <span>
                    {ICONE[sp.statut]} {sp.titre}
                    {sp.nb_tentatives > 0 && <span className="muted" style={{ fontSize: 12 }}> · {sp.nb_tentatives} tentative(s)</span>}
                  </span>
                  {verrouille ? (
                    <span className="muted" style={{ fontSize: 13 }}>Verrouillé</span>
                  ) : sp.statut === "VALIDE" ? (
                    <button className="btn btn-secondaire" style={{ color: "var(--bleu)", borderColor: "var(--bleu)" }} onClick={() => ouvrirLecture(sp)}>Revoir</button>
                  ) : (
                    <button className="btn btn-bleu" onClick={() => ouvrirLecture(sp)}>Étudier →</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quiz final du chapitre */}
          {chap.statut === "VALIDE" ? (
            <div className="message succes" style={{ marginTop: 12 }}>Chapitre validé ✅</div>
          ) : chap.quiz_final_debloque ? (
            <button className="btn" style={{ marginTop: 12 }} onClick={() => lancerQuizFinal(chap)}>
              🏁 Passer le quiz final (50 questions)
            </button>
          ) : (
            <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
              Validez toutes les sous-parties pour débloquer le quiz final.
            </p>
          )}
        </div>
      ))}

      {erreur && <div className="message erreur">{erreur}</div>}
    </div>
  );
}
