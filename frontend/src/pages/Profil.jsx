// Page « Mon profil » : infos utilisateur, résultats de quiz, et niveaux de
// maîtrise (profils de compétence — cœur du moteur adaptatif, étape 6).
import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Profil() {
  const { utilisateur } = useAuth();
  const [resultats, setResultats] = useState([]);
  const [competences, setCompetences] = useState([]);
  const [recommandations, setRecommandations] = useState([]);

  useEffect(() => {
    api.get("/resultats/").then((r) => setResultats(r.data)).catch(() => {});
    api.get("/profils-competence/").then((r) => setCompetences(r.data)).catch(() => {});
    api.get("/recommandations/").then((r) => setRecommandations(r.data)).catch(() => {});
  }, []);

  return (
    <div className="page">
      <h1>Mon profil</h1>

      <div className="carte" style={{ marginBottom: 24 }}>
        <p><strong>Nom :</strong> {utilisateur.nom}</p>
        <p><strong>Email :</strong> {utilisateur.email}</p>
        <p><strong>Rôle :</strong> <span className="badge">{utilisateur.role}</span></p>
      </div>

      {/* Recommandations du moteur adaptatif */}
      {recommandations.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2>Recommandations pour vous</h2>
          {recommandations.map((reco, i) => (
            <div
              className="carte"
              key={i}
              style={{
                marginBottom: 12,
                borderLeft: `4px solid ${reco.type === "remediation" ? "var(--erreur)" : "var(--succes)"}`,
              }}
            >
              <span className="badge">
                {reco.type === "remediation" ? "Remédiation" : "Approfondissement"}
              </span>
              <p style={{ margin: "8px 0" }}>{reco.raison}</p>
              {reco.cours_suggere ? (
                <a className="btn" href={`/cours/${reco.cours_suggere}`}>
                  {reco.titre_suggere}
                </a>
              ) : (
                <span className="muted">{reco.titre_suggere}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <h2>Mes niveaux de maîtrise</h2>
      {competences.length === 0 ? (
        <p className="muted">Passez des quiz pour voir évoluer vos compétences.</p>
      ) : (
        competences.map((c) => (
          <div className="carte" key={c.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>Cours #{c.cours}</strong>
              <span>{Math.round(c.niveau_maitrise * 100)}%</span>
            </div>
            <div className="barre" style={{ marginTop: 8 }}>
              <div style={{ width: `${c.niveau_maitrise * 100}%` }} />
            </div>
          </div>
        ))
      )}

      <h2 style={{ marginTop: 32 }}>Mes résultats de quiz</h2>
      {resultats.length === 0 ? (
        <p className="muted">Aucun résultat pour l'instant.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--bordure)" }}>
              <th style={{ padding: 8 }}>Quiz</th>
              <th style={{ padding: 8 }}>Score</th>
              <th style={{ padding: 8 }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {resultats.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--bordure)" }}>
                <td style={{ padding: 8 }}>Quiz #{r.quiz}</td>
                <td style={{ padding: 8 }}>{r.score}%</td>
                <td style={{ padding: 8 }}>
                  {new Date(r.date_passage).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
