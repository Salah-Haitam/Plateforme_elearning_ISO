// Widget de chatbot flottant : bouton rond en bas à droite qui ouvre une
// fenêtre de discussion. Affiché uniquement pour les utilisateurs connectés
// (le chatbot nécessite d'être authentifié).
import { useEffect, useRef, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function ChatWidget() {
  const { utilisateur } = useAuth();
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState([]);
  const [saisie, setSaisie] = useState("");
  const [chargement, setChargement] = useState(false);
  const zoneMessages = useRef(null);

  // Défilement automatique vers le bas à chaque nouveau message
  useEffect(() => {
    if (zoneMessages.current) {
      zoneMessages.current.scrollTop = zoneMessages.current.scrollHeight;
    }
  }, [messages, chargement, ouvert]);

  // Le widget n'apparaît pas si l'utilisateur n'est pas connecté
  if (!utilisateur) return null;

  async function envoyer(e) {
    e.preventDefault();
    const question = saisie.trim();
    if (!question) return;

    setMessages((prec) => [...prec, { role: "user", texte: question }]);
    setSaisie("");
    setChargement(true);

    try {
      const { data } = await api.post("/chatbot/", { message: question });
      setMessages((prec) => [
        ...prec,
        { role: "ia", texte: data.reponse, sources: data.sources },
      ]);
    } catch {
      setMessages((prec) => [
        ...prec,
        { role: "ia", texte: "Désolé, une erreur est survenue.", sources: [] },
      ]);
    } finally {
      setChargement(false);
    }
  }

  return (
    <>
      {/* Fenêtre de discussion (visible seulement si ouverte) */}
      {ouvert && (
        <div className="chat-panneau">
          <div className="chat-entete">
            <div className="titre">
              <span className="avatar">🤖</span>
              Assistant ISO
            </div>
            <button className="fermer" onClick={() => setOuvert(false)} aria-label="Fermer">
              ×
            </button>
          </div>

          <div className="chat-messages" ref={zoneMessages}>
            {messages.length === 0 && (
              <p className="muted" style={{ fontSize: 14 }}>
                Bonjour {utilisateur.nom.split(" ")[0]} 👋 Posez-moi une question
                sur les normes ISO. Je réponds à partir des documents Marsa Maroc.
              </p>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`chat-bulle ${m.role}`}>
                <div className="texte">
                  {m.texte}
                  {m.sources && m.sources.length > 0 && (
                    <div className="chat-sources">
                      Sources : {m.sources.map((s) => s.titre).join(", ")}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {chargement && (
              <div className="chat-bulle ia">
                <div className="texte">
                  <span className="typing"><span></span><span></span><span></span></span>
                </div>
              </div>
            )}
          </div>

          <form className="chat-saisie" onSubmit={envoyer}>
            <input
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder="Votre question…"
            />
            <button disabled={chargement} aria-label="Envoyer">➤</button>
          </form>
        </div>
      )}

      {/* Bouton rond flottant */}
      <button
        className="chat-fab"
        onClick={() => setOuvert((o) => !o)}
        aria-label="Ouvrir l'assistant IA"
        title="Assistant IA"
      >
        {ouvert ? "×" : "💬"}
      </button>
    </>
  );
}
