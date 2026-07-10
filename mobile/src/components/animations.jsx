// ===========================================================================
// Primitives d'animation réutilisables (react-native-reanimated v4)
// ===========================================================================
// Toutes tournent sur le thread UI natif (worklets) -> 60 fps même sur mobiles
// modestes. Toutes respectent « réduire les animations » (accessibilité) :
// dans ce cas, l'état final est affiché directement, sans mouvement.
import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { couleurs, radius, police } from "../theme";
import {
  RESSORT, RESSORT_POP, DOUX, CASCADE_MS, DECALAGE_Y, useAnimationsReduites,
} from "../anim";

// ---------------------------------------------------------------------------
// 1) Apparition : fondu + translation vers le haut. Équivalent du <Reveal> web.
//    Dans une liste, passer delay = index * CASCADE_MS pour l'effet cascade.
// ---------------------------------------------------------------------------
export function Apparition({ delay = 0, children, style }) {
  const reduites = useAnimationsReduites();

  if (reduites) return <View style={style}>{children}</View>;

  return (
    <Animated.View
      style={style}
      entering={FadeInDown.delay(delay).duration(320).withInitialValues({
        transform: [{ translateY: DECALAGE_Y }],
      })}
    >
      {children}
    </Animated.View>
  );
}

// Décalage en cascade pour l'élément d'index `i` (plafonné : au-delà de ~8
// cartes, l'attente deviendrait perceptible).
export function cascade(i) {
  return Math.min(i, 8) * CASCADE_MS;
}

// ---------------------------------------------------------------------------
// 2) Squelette : bloc gris qui « respire » pendant le chargement des données.
//    Remplace les spinners (on montre la forme du contenu à venir).
// ---------------------------------------------------------------------------
export function Squelette({ largeur = "100%", hauteur = 16, rayon = 8, style }) {
  const reduites = useAnimationsReduites();
  const opacite = useSharedValue(0.45);

  useEffect(() => {
    if (!reduites) {
      opacite.value = withRepeat(withTiming(0.9, { duration: 800 }), -1, true);
    }
  }, [reduites, opacite]);

  const styleAnime = useAnimatedStyle(() => ({ opacity: opacite.value }));
  const base = { width: largeur, height: hauteur, borderRadius: rayon, backgroundColor: "#e2e8f0" };

  if (reduites) return <View style={[base, { opacity: 0.6 }, style]} />;
  return <Animated.View style={[base, styleAnime, style]} />;
}

// Squelette d'une carte de cours (image + titre + texte + bouton)
export function SqueletteCarteCours() {
  return (
    <View style={styles.squeletteCarte}>
      <Squelette hauteur={150} rayon={0} />
      <View style={{ padding: 16 }}>
        <Squelette largeur={90} hauteur={22} rayon={999} />
        <Squelette hauteur={18} style={{ marginTop: 12 }} />
        <Squelette largeur="70%" hauteur={14} style={{ marginTop: 8 }} />
        <Squelette hauteur={46} rayon={12} style={{ marginTop: 16 }} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 3) Barre de progression animée (remplissage au ressort).
//    `valeur` : 0 -> 1. Élément central du côté adaptatif.
// ---------------------------------------------------------------------------
export function BarreProgression({ valeur = 0, hauteur = 12, couleur = couleurs.brand, style }) {
  const reduites = useAnimationsReduites();
  const p = useSharedValue(0);

  useEffect(() => {
    const cible = Math.max(0, Math.min(1, valeur));
    p.value = reduites ? cible : withSpring(cible, RESSORT);
  }, [valeur, reduites, p]);

  const styleAnime = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));

  return (
    <View style={[{ height: hauteur, borderRadius: 999, backgroundColor: "#e5edff", overflow: "hidden" }, style]}>
      <Animated.View style={[{ height: "100%", borderRadius: 999, backgroundColor: couleur }, styleAnime]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// 4) Secousse (shake) : signale une erreur / une mauvaise réponse.
//    Renvoie un style animé + une fonction pour déclencher la secousse.
// ---------------------------------------------------------------------------
export function useSecousse() {
  const reduites = useAnimationsReduites();
  const x = useSharedValue(0);

  const styleSecousse = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  function secouer() {
    if (reduites) return; // accessibilité : pas de mouvement
    x.value = withSequence(
      withTiming(-7, { duration: 45 }),
      withTiming(7, { duration: 45 }),
      withTiming(-5, { duration: 45 }),
      withTiming(5, { duration: 45 }),
      withTiming(0, { duration: 45 }),
    );
  }

  return { styleSecousse, secouer };
}

// ---------------------------------------------------------------------------
// 5) Pop : un élément qui apparaît en rebondissant (badge de réussite, score).
// ---------------------------------------------------------------------------
export function Pop({ delay = 0, children, style }) {
  const reduites = useAnimationsReduites();
  const echelle = useSharedValue(reduites ? 1 : 0);

  useEffect(() => {
    if (reduites) { echelle.value = 1; return; }
    echelle.value = withDelay(delay, withSpring(1, RESSORT_POP));
  }, [reduites, delay, echelle]);

  const styleAnime = useAnimatedStyle(() => ({ transform: [{ scale: echelle.value }] }));
  return <Animated.View style={[styleAnime, style]}>{children}</Animated.View>;
}

// ---------------------------------------------------------------------------
// 6) Confettis légers : célèbrent la réussite d'un quiz. Volontairement sobres
//    (12 pièces, 1,4 s) pour ne pas distraire.
// ---------------------------------------------------------------------------
const TEINTES = [couleurs.brand, couleurs.turquoise, couleurs.ambre, couleurs.succes];

function Confetti({ index }) {
  const y = useSharedValue(0);
  const rot = useSharedValue(0);
  const op = useSharedValue(1);

  // Positions/durées déterministes (dérivées de l'index) : pas de Math.random
  const gauche = 6 + (index * 8) % 88;
  const duree = 1100 + (index % 4) * 140;
  const retard = (index % 6) * 60;

  useEffect(() => {
    y.value = withDelay(retard, withTiming(320, { duration: duree }));
    rot.value = withDelay(retard, withTiming(360 + index * 30, { duration: duree }));
    op.value = withDelay(retard + duree - 300, withTiming(0, { duration: 300 }));
  }, [y, rot, op, duree, retard, index]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${rot.value}deg` }],
    opacity: op.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute", top: -10, left: `${gauche}%`,
          width: 8, height: 12, borderRadius: 2,
          backgroundColor: TEINTES[index % TEINTES.length],
        },
        style,
      ]}
    />
  );
}

export function Confettis({ actif = true, nombre = 12 }) {
  const reduites = useAnimationsReduites();
  if (!actif || reduites) return null; // accessibilité : aucun confetti
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: nombre }, (_, i) => <Confetti key={i} index={i} />)}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 7) Compteur animé : le score s'incrémente au lieu d'apparaître d'un coup.
// ---------------------------------------------------------------------------
export function ScoreAnime({ valeur = 0, suffixe = "", style }) {
  const reduites = useAnimationsReduites();
  const [affiche, setAffiche] = useState(reduites ? valeur : 0);

  useEffect(() => {
    if (reduites) { setAffiche(valeur); return; }
    let courant = 0;
    const pas = Math.max(1, Math.ceil(valeur / 24)); // ~24 incréments -> ~700 ms
    const id = setInterval(() => {
      courant += pas;
      if (courant >= valeur) { setAffiche(valeur); clearInterval(id); }
      else setAffiche(courant);
    }, 28);
    return () => clearInterval(id);
  }, [valeur, reduites]);

  return <Text style={style}>{affiche}{suffixe}</Text>;
}

// ---------------------------------------------------------------------------
// 8) Indicateur « l'assistant écrit… » : trois points qui pulsent.
// ---------------------------------------------------------------------------
function PointFrappe({ index }) {
  const reduites = useAnimationsReduites();
  const y = useSharedValue(0);

  useEffect(() => {
    if (reduites) return;
    y.value = withDelay(
      index * 150,
      withRepeat(withSequence(withTiming(-4, { duration: 300 }), withTiming(0, { duration: 300 })), -1, false)
    );
  }, [y, index, reduites]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[styles.point, style]} />;
}

export function IndicateurFrappe() {
  return (
    <View style={styles.frappe}>
      {[0, 1, 2].map((i) => <PointFrappe key={i} index={i} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  squeletteCarte: {
    backgroundColor: "#fff", borderRadius: radius.xl, marginBottom: 16,
    overflow: "hidden", borderWidth: 1, borderColor: couleurs.bordure,
  },
  frappe: { flexDirection: "row", gap: 5, alignItems: "center", paddingVertical: 4 },
  point: { width: 7, height: 7, borderRadius: 4, backgroundColor: couleurs.muted },
});
