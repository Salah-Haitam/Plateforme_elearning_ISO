// Composant réutilisable pour passer un quiz (micro-quiz ou quiz final).
// Affiche les questions, collecte les réponses, et appelle onSoumettre.
import { useState } from "react";

export default function QuizPassage({ quiz, onSoumettre, enCours }) {
  // { questionId: reponseId }
  const [choix, setChoix] = useState({});

  function choisir(qId, rId) {
    setChoix((p) => ({ ...p, [qId]: rId }));
  }

  function soumettre() {
    const reponses = Object.entries(choix).map(([question, reponse]) => ({
      question: Number(question),
      reponse: Number(reponse),
    }));
    onSoumettre(reponses);
  }

  const total = quiz.questions.length;
  const repondues = Object.keys(choix).length;

  return (
    <div>
      <div className="message" style={{ background: "var(--bleu-clair)", color: "var(--bleu-fonce)" }}>
        {repondues} / {total} questions répondues
      </div>

      {quiz.questions.map((q, index) => (
        <div className="question" key={q.id}>
          <strong>{index + 1}. {q.enonce}</strong>
          {q.clause_hls && <span className="badge" style={{ marginLeft: 8 }}>Clause {q.clause_hls}</span>}
          {q.reponses.map((rep) => (
            <label className="option" key={rep.id}>
              <input
                type="radio"
                name={`q-${q.id}`}
                checked={choix[q.id] === rep.id}
                onChange={() => choisir(q.id, rep.id)}
              />
              {rep.texte}
            </label>
          ))}
        </div>
      ))}

      <button
        className="btn"
        onClick={soumettre}
        disabled={enCours || repondues < total}
      >
        {enCours ? "Correction…" : `Valider mes réponses (${repondues}/${total})`}
      </button>
    </div>
  );
}
