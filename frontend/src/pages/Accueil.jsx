// Page d'accueil publique — hero maritime animé + présentation.
import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";

export default function Accueil() {
  return (
    <>
      {/* ---- Hero avec photo de port en fond + voile bleu marine ---- */}
      <section className="hero">
        <div className="hero-fond" />
        <div className="hero-voile" />
        {/* Bulles montantes (ambiance maritime) */}
        <div className="bulles" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
        <div className="hero-contenu">
          <span className="badge-norme">FORMATION · NORMES ISO</span>
          <h1>Montez en compétence sur les normes ISO, à votre rythme</h1>
          <p>
            La plateforme de formation adaptative de Marsa Maroc : des parcours
            qui s'ajustent à votre niveau et un assistant IA fondé sur les
            documents internes et les normes ISO (27001, 9001…).
          </p>
          <div className="hero-actions">
            <Link to="/catalogue" className="btn">Découvrir le catalogue →</Link>
            <Link to="/decouverte" className="btn btn-secondaire">Tester mes connaissances</Link>
          </div>
        </div>
      </section>

      {/* Séparateur en vague (rappel maritime) */}
      <svg className="hero-vague" viewBox="0 0 1440 90" preserveAspectRatio="none" style={{ height: 70 }}>
        <path
          fill="#f5f7fa"
          d="M0,40 C240,90 480,90 720,50 C960,10 1200,10 1440,45 L1440,90 L0,90 Z"
        />
      </svg>

      {/* ---- Section « atouts » avec apparition au défilement ---- */}
      <div className="page" style={{ marginTop: 0 }}>
        <Reveal>
          <h2 style={{ textAlign: "center" }}>Une formation nouvelle génération</h2>
          <p className="muted" style={{ textAlign: "center", maxWidth: 620, margin: "0 auto" }}>
            Trois piliers pour progresser efficacement sur les normes ISO.
          </p>
        </Reveal>

        <div className="atouts">
          {[
            { icone: "🎯", titre: "Parcours adaptatif", texte: "Le contenu et les quiz s'ajustent à votre niveau de maîtrise, quiz après quiz." },
            { icone: "🤖", titre: "Assistant IA", texte: "Un chatbot qui répond uniquement à partir des documents Marsa Maroc et des normes ISO." },
            { icone: "📊", titre: "Suivi de progression", texte: "Visualisez vos scores, vos compétences et recevez des recommandations personnalisées." },
          ].map((a, i) => (
            <Reveal key={a.titre} delay={i * 120}>
              <div className="atout">
                <div className="icone">{a.icone}</div>
                <h3>{a.titre}</h3>
                <p className="muted">{a.texte}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Bandeau d'appel à l'action */}
        <Reveal>
          <div
            className="carte"
            style={{
              marginTop: 40, padding: 40, textAlign: "center",
              background: "linear-gradient(120deg, var(--navy), var(--bleu))", color: "#fff",
            }}
          >
            <h2 style={{ color: "#fff" }}>Prêt à commencer ?</h2>
            <p style={{ color: "#dbe7f2" }}>Rejoignez les collaborateurs déjà formés aux normes ISO.</p>
            <Link to="/inscription" className="btn" style={{ marginTop: 10 }}>Je m'inscris</Link>
          </div>
        </Reveal>
      </div>
    </>
  );
}
