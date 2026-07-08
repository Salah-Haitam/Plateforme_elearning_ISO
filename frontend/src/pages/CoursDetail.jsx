// Détail d'un cours : affiche la hiérarchie chapitres -> sous-chapitres -> médias.
// Charge GET /api/cours/{id}/ (serializer imbriqué côté backend).
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import Reveal from "../components/Reveal";
import { useAuth } from "../context/AuthContext";

function imagePourNorme(norme = "") {
  const n = norme.toLowerCase();
  if (n.includes("27001")) return "/img/securite.jpg";
  if (n.includes("9001")) return "/img/qualite.jpg";
  if (n.includes("14001")) return "/img/navire.jpg";
  return "/img/port.jpg";
}

export default function CoursDetail() {
  const { id } = useParams();
  const { utilisateur } = useAuth();
  const [cours, setCours] = useState(null);
  const [quiz, setQuiz] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [generation, setGeneration] = useState({ actif: false, message: null });

  // Charge le cours + la liste des quiz de ce cours
  function chargerQuiz() {
    api.get("/quiz/").then((r) => {
      setQuiz(r.data.filter((q) => q.cours === Number(id)));
    });
  }

  useEffect(() => {
    api
      .get(`/cours/${id}/`)
      .then((r) => setCours(r.data))
      .catch(() => setErreur("Cours introuvable."));
    chargerQuiz();
  }, [id]);

  // Génération d'un quiz par l'Agent IA (admin uniquement)
  async function genererQuiz() {
    setGeneration({ actif: true, message: "L'agent IA rédige les questions…" });
    try {
      const { data } = await api.post(`/cours/${id}/generer-quiz/`, { nombre: 5 });
      setGeneration({ actif: false, message: `Quiz généré (${data.nb_questions} questions).` });
      chargerQuiz();
    } catch (e) {
      const detail = e?.response?.data?.detail || "Échec de la génération.";
      setGeneration({ actif: false, message: detail });
    }
  }

  if (erreur) return <div className="page"><div className="message erreur">{erreur}</div></div>;
  if (!cours) return <div className="page"><p className="muted">Chargement…</p></div>;

  const estAdmin = utilisateur?.role === "ADMIN";

  return (
    <div className="page">
      {/* Bannière de couverture */}
      <div
        style={{
          position: "relative", height: 220, borderRadius: 16, overflow: "hidden",
          marginBottom: 24, display: "flex", alignItems: "flex-end",
        }}
      >
        <img
          src={imagePourNorme(cours.norme)}
          alt={cours.norme}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(0,43,78,0.2), rgba(0,43,78,0.85))",
          }}
        />
        <div style={{ position: "relative", padding: 24, color: "#fff" }}>
          <span className="badge orange">{cours.norme}</span>
          <h1 style={{ color: "#fff", margin: "8px 0 4px" }}>{cours.titre}</h1>
          <p style={{ color: "#dbe7f2", margin: 0 }}>{cours.description}</p>
        </div>
      </div>

      {/* Appel à l'action : démarrer le parcours adaptatif (apprenant connecté) */}
      {utilisateur && (
        <div className="carte" style={{ marginBottom: 24, display: "flex",
          justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
          background: "linear-gradient(120deg, var(--navy), var(--bleu))", color: "#fff" }}>
          <div>
            <h3 style={{ color: "#fff", margin: 0 }}>Parcours adaptatif</h3>
            <p style={{ color: "#dbe7f2", margin: "4px 0 0" }}>
              Apprenez dans l'ordre, avec des micro-quiz qui s'adaptent à votre niveau.
            </p>
          </div>
          <Link to={`/cours/${id}/parcours`} className="btn">🎯 Commencer le parcours</Link>
        </div>
      )}

      {/* Section Quiz : liste des quiz + génération par IA (admin) */}
      <div className="carte" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ margin: 0 }}>Évaluations</h3>
          {estAdmin && (
            <button className="btn" onClick={genererQuiz} disabled={generation.actif}>
              {generation.actif ? "Génération…" : "🤖 Générer un quiz par IA"}
            </button>
          )}
        </div>

        {generation.message && (
          <div className="message succes" style={{ marginTop: 12 }}>{generation.message}</div>
        )}

        {quiz.length === 0 ? (
          <p className="muted" style={{ marginTop: 12 }}>
            Aucun quiz pour ce cours pour l'instant.
            {estAdmin && " Cliquez sur « Générer un quiz par IA »."}
          </p>
        ) : (
          <ul style={{ marginTop: 12, listStyle: "none", padding: 0 }}>
            {quiz.map((q) => (
              <li key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: "1px solid var(--bordure)" }}>
                <span>{q.titre} <span className="badge">{q.niveau_difficulte}</span></span>
                <Link to={`/quiz/${q.id}`} className="btn btn-bleu">Passer le quiz →</Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {cours.chapitres.map((chap, idx) => (
        <Reveal key={chap.id} delay={idx * 60}>
        <div className="carte" style={{ marginBottom: 16 }}>
          <h3>
            {chap.ordre}. {chap.titre}{" "}
            {chap.chapitre_hls && (
              <span className="badge" style={{ marginLeft: 8 }}>{chap.chapitre_hls}</span>
            )}
          </h3>

          {chap.sous_chapitres.map((sc) => (
            <div key={sc.id} style={{ marginTop: 12, paddingLeft: 12, borderLeft: "3px solid var(--bleu-clair)" }}>
              <h4 style={{ margin: "4px 0" }}>{sc.titre}</h4>
              <p style={{ whiteSpace: "pre-wrap" }}>{sc.contenu}</p>
              {sc.medias.length > 0 && (
                <ul>
                  {sc.medias.map((m) => (
                    <li key={m.id}>
                      <a href={m.url} target="_blank" rel="noreferrer">
                        {m.type} — {m.url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        </Reveal>
      ))}
    </div>
  );
}
