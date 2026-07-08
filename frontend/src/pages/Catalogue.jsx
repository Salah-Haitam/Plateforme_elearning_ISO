// Catalogue des cours (public). Charge la liste depuis GET /api/cours/.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Reveal from "../components/Reveal";

// Choisit une image illustrative selon la norme (thème maritime/entreprise).
function imagePourNorme(norme = "") {
  const n = norme.toLowerCase();
  if (n.includes("27001")) return "/img/securite.jpg";   // sécurité de l'info
  if (n.includes("9001")) return "/img/qualite.jpg";     // qualité / logistique
  if (n.includes("14001")) return "/img/navire.jpg";     // environnement
  return "/img/port.jpg";                                 // par défaut
}

export default function Catalogue() {
  const [cours, setCours] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    api
      .get("/cours/")
      .then((r) => setCours(r.data))
      .catch(() => setErreur("Impossible de charger le catalogue."))
      .finally(() => setChargement(false));
  }, []);

  return (
    <div className="page">
      <h1>Catalogue des formations</h1>
      <p className="muted">Choisissez une norme et progressez à votre rythme.</p>

      {chargement && <p className="muted">Chargement…</p>}
      {erreur && <div className="message erreur">{erreur}</div>}
      {!chargement && !erreur && cours.length === 0 && (
        <p className="muted">
          Aucun cours pour l'instant. Ajoutez-en depuis l'administration Django.
        </p>
      )}

      <div className="grille" style={{ marginTop: 20 }}>
        {cours.map((c, i) => (
          <Reveal key={c.id} delay={i * 80}>
            <div className="carte">
              <div className="carte-image">
                <img src={imagePourNorme(c.norme)} alt={c.norme} loading="lazy" />
              </div>
              <span className="badge orange">{c.norme}</span>
              <h3 style={{ margin: "10px 0 8px" }}>{c.titre}</h3>
              <p className="muted" style={{ minHeight: 42 }}>
                {c.description || "Formation aux exigences de la norme."}
              </p>
              <p className="muted" style={{ fontSize: 13 }}>
                Niveau : {c.niveau_difficulte}
              </p>
              <Link to={`/cours/${c.id}`} className="btn btn-bleu">Consulter →</Link>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
