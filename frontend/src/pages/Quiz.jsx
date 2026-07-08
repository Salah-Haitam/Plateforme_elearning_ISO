// Page de passage d'un quiz.
// 1) charge GET /api/quiz/{id}/  (questions + réponses SANS la bonne réponse)
// 2) l'utilisateur choisit ses réponses
// 3) POST /api/quiz/{id}/soumettre/ -> renvoie le score
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

export default function Quiz() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [choix, setChoix] = useState({});   // { questionId: reponseId }
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    api
      .get(`/quiz/${id}/`)
      .then((r) => setQuiz(r.data))
      .catch(() => setErreur("Quiz introuvable."));
  }, [id]);

  function choisir(questionId, reponseId) {
    setChoix((prec) => ({ ...prec, [questionId]: reponseId }));
  }

  async function soumettre() {
    // On transforme l'objet choix en tableau attendu par l'API
    const reponses = Object.entries(choix).map(([question, reponse]) => ({
      question: Number(question),
      reponse: Number(reponse),
    }));
    try {
      const r = await api.post(`/quiz/${id}/soumettre/`, { reponses });
      setResultat(r.data);
    } catch {
      setErreur("Erreur lors de la soumission.");
    }
  }

  if (erreur) return <div className="page"><div className="message erreur">{erreur}</div></div>;
  if (!quiz) return <div className="page"><p className="muted">Chargement…</p></div>;

  return (
    <div className="page">
      <h1>{quiz.titre}</h1>
      <span className="badge">Niveau : {quiz.niveau_difficulte}</span>

      {/* Résultat après soumission */}
      {resultat && (
        <div className="message succes" style={{ fontSize: 18 }}>
          Score : <strong>{resultat.score}%</strong> ({resultat.nb_correctes}/
          {resultat.nb_questions} bonnes réponses)
          {resultat.enregistre
            ? " — résultat enregistré."
            : " — connectez-vous pour enregistrer votre résultat."}
        </div>
      )}

      {quiz.questions.map((q, index) => (
        <div className="question" key={q.id}>
          <strong>{index + 1}. {q.enonce}</strong>
          {q.reponses.map((rep) => (
            <label className="option" key={rep.id}>
              <input
                type="radio"
                name={`q-${q.id}`}
                value={rep.id}
                checked={choix[q.id] === rep.id}
                onChange={() => choisir(q.id, rep.id)}
                disabled={!!resultat}
              />
              {rep.texte}
            </label>
          ))}
        </div>
      ))}

      {!resultat && (
        <button className="btn" onClick={soumettre} disabled={Object.keys(choix).length === 0}>
          Valider mes réponses
        </button>
      )}
    </div>
  );
}
