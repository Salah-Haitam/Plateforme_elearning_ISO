// Système de design de l'app mobile — aligné sur le web (Marsa ISO).
// Palette bleu / turquoise / ambre, dégradés, ombres et police Poppins.

export const couleurs = {
  brand: "#2563eb",
  brandFonce: "#1d4ed8",
  brandClair: "#dbeafe",
  turquoise: "#06b6d4",
  turquoiseFonce: "#0891b2",
  vert: "#10b981",
  ambre: "#f59e0b",
  ambreFonce: "#d97706",
  succes: "#22c55e",
  erreur: "#ef4444",
  navy: "#1e3a8a",       // navy du web (sidebar/hero)
  navyProfond: "#0f2350",
  ink: "#1e293b",
  texte: "#334155",
  muted: "#64748b",
  bordure: "#e2e8f0",
  fond: "#f8fafc",
  blanc: "#ffffff",
};

// Dégradés (tableaux de couleurs pour expo-linear-gradient), sens {x,y}.
// Rappellent le web : boutons brand→turquoise, en-têtes navy→teal.
export const degrades = {
  bouton: ["#2563eb", "#06b6d4"],       // --degrade du web (120°)
  entete: ["#1e3a8a", "#0e7490"],       // sidebar / chat-entete du web
  hero: ["#1e3a8a", "#2563eb", "#0891b2"],
  ambre: ["#f59e0b", "#d97706"],
  debut: { x: 0, y: 0 },
  fin: { x: 1, y: 1 },
};

// Rayons de bordure cohérents avec le web (12–20px)
export const radius = { sm: 10, md: 12, lg: 16, xl: 20, pill: 999 };

// Ombres douces (bleutées, comme --ombre du web)
export const ombre = {
  carte: {
    shadowColor: "#2563eb",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  bouton: {
    shadowColor: "#2563eb",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
};

// Familles Poppins (chargées dans App.js). On centralise les noms ici.
export const police = {
  normal: "Poppins_400Regular",
  moyen: "Poppins_500Medium",
  semi: "Poppins_600SemiBold",
  gras: "Poppins_700Bold",
  extra: "Poppins_800ExtraBold",
};

// Image illustrative selon la norme (mêmes visuels que le web)
const IMAGES = {
  securite: require("../assets/cours/securite.jpg"),
  qualite: require("../assets/cours/qualite.jpg"),
  navire: require("../assets/cours/navire.jpg"),
  port: require("../assets/cours/port.jpg"),
  hero: require("../assets/cours/hero.jpg"),
};

export function imageCours(norme = "") {
  const n = String(norme).toLowerCase();
  if (n.includes("27001")) return IMAGES.securite;
  if (n.includes("9001")) return IMAGES.qualite;
  if (n.includes("14001")) return IMAGES.navire;
  return IMAGES.port;
}

export const imageHero = IMAGES.hero;
