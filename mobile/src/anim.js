// ===========================================================================
// Système d'animation central (tokens de mouvement)
// ===========================================================================
// Toutes les animations de l'app puisent leurs durées / ressorts ICI, pour
// rester cohérentes. On évite les valeurs magiques éparpillées dans les écrans.
//
// Accessibilité : si l'utilisateur a activé « réduire les animations » dans les
// réglages de son téléphone, `useAnimationsReduites()` renvoie true et les
// composants affichent directement l'état final (aucun mouvement).
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { Easing } from "react-native-reanimated";

// --- Ressorts (mouvements naturels : scale, badges, barres) ---
export const RESSORT = { damping: 15, stiffness: 150, mass: 0.6 };
export const RESSORT_POP = { damping: 10, stiffness: 180, mass: 0.5 };

// --- Fondus / translations (entrées d'écran et de cartes) ---
export const DOUX = { duration: 220, easing: Easing.out(Easing.cubic) };
export const LENT = { duration: 400, easing: Easing.out(Easing.cubic) };

// Décalage entre deux cartes d'une liste (effet cascade / stagger)
export const CASCADE_MS = 70;
// Distance de translation verticale d'une entrée
export const DECALAGE_Y = 18;

// Échelle appliquée à un bouton pressé (micro-interaction)
export const ECHELLE_PRESSION = 0.97;

/**
 * Indique si l'utilisateur souhaite des animations réduites.
 * Équivalent mobile du `prefers-reduced-motion` du web.
 */
export function useAnimationsReduites() {
  const [reduites, setReduites] = useState(false);

  useEffect(() => {
    let actif = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (actif) setReduites(!!v);
    });
    const abonnement = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (v) => setReduites(!!v)
    );
    return () => {
      actif = false;
      abonnement?.remove?.();
    };
  }, []);

  return reduites;
}
