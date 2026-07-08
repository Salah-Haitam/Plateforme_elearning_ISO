// Arrière-plan animé global : formes géométriques flottantes (cercles,
// hexagones, triangles, lignes) + vagues douces en bas (thème port / mer).
//
// Techniques : SVG + animations CSS uniquement (transform/opacity sur GPU),
// donc aucune boucle JavaScript -> très performant, fluide sur mobile.
// Monté une seule fois dans le Layout, derrière tout le contenu (z-index 0).
//
// Réglages faciles via les props (voir plus bas) : nombre de formes, opacité
// globale, couleurs, vitesse. Respecte prefers-reduced-motion (via le CSS).
import { memo } from "react";

// Palette de la plateforme (bleu / turquoise / vert)
const COULEURS = ["#2563eb", "#06b6d4", "#10b981"];

// Description des formes flottantes. Chaque forme précise sa position, sa
// taille, sa couleur et ses paramètres de mouvement (dérive + rotation).
// `sm:false` = masquée sur mobile (pour alléger). ~14 formes desktop / ~8 mobile.
const FORMES = [
  { type: "anneau",   top: "10%", left: "6%",  taille: 90,  c: 0, dx: 30,  dy: 40,  rot: 20,  dur: 28, delai: 0,   sm: true },
  { type: "hexagone", top: "22%", left: "82%", taille: 74,  c: 1, dx: -34, dy: 30,  rot: -25, dur: 32, delai: 1.5, sm: true },
  { type: "triangle", top: "68%", left: "12%", taille: 66,  c: 2, dx: 26,  dy: -38, rot: 30,  dur: 30, delai: 0.8, sm: true },
  { type: "cercle",   top: "40%", left: "48%", taille: 44,  c: 0, dx: -28, dy: 34,  rot: 0,   dur: 26, delai: 2,   sm: false },
  { type: "ligne",    top: "16%", left: "38%", taille: 120, c: 1, dx: 40,  dy: 20,  rot: 15,  dur: 34, delai: 1,   sm: false },
  { type: "hexagone", top: "78%", left: "68%", taille: 58,  c: 0, dx: -24, dy: -30, rot: 22,  dur: 29, delai: 2.4, sm: true },
  { type: "anneau",   top: "52%", left: "88%", taille: 64,  c: 2, dx: 20,  dy: 44,  rot: -18, dur: 31, delai: 0.5, sm: false },
  { type: "triangle", top: "34%", left: "22%", taille: 50,  c: 1, dx: 34,  dy: 26,  rot: -28, dur: 27, delai: 3,   sm: true },
  { type: "cercle",   top: "84%", left: "40%", taille: 36,  c: 2, dx: -30, dy: -24, rot: 0,   dur: 24, delai: 1.2, sm: false },
  { type: "ligne",    top: "60%", left: "58%", taille: 100, c: 0, dx: -36, dy: 28,  rot: -14, dur: 33, delai: 2,   sm: false },
  { type: "hexagone", top: "6%",  left: "60%", taille: 46,  c: 2, dx: 22,  dy: 36,  rot: 20,  dur: 30, delai: 0.3, sm: true },
  { type: "anneau",   top: "88%", left: "84%", taille: 54,  c: 1, dx: -26, dy: -32, rot: 16,  dur: 28, delai: 1.8, sm: true },
  { type: "triangle", top: "48%", left: "4%",  taille: 40,  c: 0, dx: 28,  dy: 30,  rot: 26,  dur: 26, delai: 2.6, sm: false },
  { type: "cercle",   top: "26%", left: "70%", taille: 30,  c: 1, dx: -20, dy: 26,  rot: 0,   dur: 23, delai: 0.9, sm: true },
];

// Rendu SVG d'une forme selon son type (contours fins = esprit « normes / structure »)
function DessinForme({ type, couleur }) {
  const commun = { fill: "none", stroke: couleur, strokeWidth: 6, vectorEffect: "non-scaling-stroke" };
  switch (type) {
    case "cercle":
      return <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill={couleur} opacity="0.9" /></svg>;
    case "anneau":
      return <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" {...commun} /></svg>;
    case "hexagone":
      return <svg viewBox="0 0 100 100"><polygon points="50,4 92,27 92,73 50,96 8,73 8,27" {...commun} /></svg>;
    case "triangle":
      return <svg viewBox="0 0 100 100"><polygon points="50,8 92,90 8,90" {...commun} /></svg>;
    case "ligne":
      return <svg viewBox="0 0 100 20"><line x1="2" y1="10" x2="98" y2="10" stroke={couleur} strokeWidth="3" strokeLinecap="round" /></svg>;
    default:
      return null;
  }
}

// Le chemin d'une vague (2 périodes -> défilement -50% sans couture)
const CHEMIN_VAGUE =
  "M0,80 C240,40 480,120 720,80 C960,40 1200,120 1440,80 " +
  "C1680,40 1920,120 2160,80 C2400,40 2640,120 2880,80 L2880,200 L0,200 Z";

function AnimatedBackground({
  formes = FORMES,          // liste des formes (personnalisable)
  couleurs = COULEURS,      // palette
  opacite = 0.15,           // opacité globale (subtil : 0.10 - 0.15)
  vitesse = 1,              // multiplicateur de durée (1 = normal, >1 = plus lent)
}) {
  return (
    <>
      {/* Formes géométriques flottantes */}
      <div className="animated-bg" aria-hidden="true" style={{ opacity: opacite }}>
        {formes.map((f, i) => (
          <div
            key={i}
            className={`forme ${f.sm ? "" : "sm-hidden"}`}
            style={{
              top: f.top, left: f.left, width: f.taille, height: f.taille,
              // Variables lues par l'animation CSS (dérive + rotation + durée)
              "--dx": `${f.dx}px`, "--dy": `${f.dy}px`, "--rot": `${f.rot}deg`,
              "--dur": `${f.dur * vitesse}s`, "--delai": `${f.delai}s`,
            }}
          >
            <DessinForme type={f.type} couleur={couleurs[f.c % couleurs.length]} />
          </div>
        ))}
      </div>

      {/* Vagues en bas (port / mer) — 3 couches qui défilent lentement */}
      <div className="vagues" aria-hidden="true">
        {["v1", "v2", "v3"].map((cls, i) => (
          <div className={`vague ${cls}`} key={cls}>
            <svg viewBox="0 0 2880 200" preserveAspectRatio="none">
              <path d={CHEMIN_VAGUE} fill={couleurs[i % couleurs.length]} />
            </svg>
          </div>
        ))}
      </div>
    </>
  );
}

// Mémoïsé : n'a aucune prop dynamique -> ne re-rend jamais inutilement.
export default memo(AnimatedBackground);
