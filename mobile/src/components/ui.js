// Kit de composants réutilisables, calqués sur le design system du web :
// bouton dégradé, carte blanche arrondie, badge pilule, en-tête dégradé.
import { Text, View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { couleurs, degrades, radius, ombre, police } from "../theme";
import { RESSORT, ECHELLE_PRESSION, useAnimationsReduites } from "../anim";

// Zone pressable qui se contracte légèrement au toucher (micro-interaction).
// Respecte « réduire les animations » : dans ce cas, aucun mouvement.
function PressionAnimee({ onPress, disabled, style, children }) {
  const reduites = useAnimationsReduites();
  const echelle = useSharedValue(1);
  const styleAnime = useAnimatedStyle(() => ({ transform: [{ scale: echelle.value }] }));

  const enfoncer = (v) => {
    if (!reduites && !disabled) echelle.value = withSpring(v, RESSORT);
  };

  return (
    <Animated.View style={[styleAnime, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => enfoncer(ECHELLE_PRESSION)}
        onPressOut={() => enfoncer(1)}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// --- Texte par défaut en Poppins (à utiliser à la place de <Text>) ---
export function Txt({ style, poids = "normal", children, ...props }) {
  return (
    <Text style={[{ fontFamily: police[poids] || police.normal, color: couleurs.texte }, style]} {...props}>
      {children}
    </Text>
  );
}

// --- Bouton principal (dégradé brand→turquoise) ou secondaire (contour) ---
export function Bouton({ titre, onPress, variante = "primaire", plein = true, chargement, disabled, style }) {
  const inactif = disabled || chargement;

  if (variante === "secondaire") {
    return (
      <PressionAnimee
        onPress={onPress}
        disabled={inactif}
        style={[plein && styles.plein, inactif && { opacity: 0.5 }, style]}
      >
        <View style={styles.secondaire}>
          {chargement ? (
            <ActivityIndicator color={couleurs.brand} />
          ) : (
            <Text style={styles.texteSecondaire}>{titre}</Text>
          )}
        </View>
      </PressionAnimee>
    );
  }

  return (
    <PressionAnimee
      onPress={onPress}
      disabled={inactif}
      style={[plein && styles.plein, ombre.bouton, inactif && { opacity: 0.5 }, style]}
    >
      <LinearGradient
        colors={degrades.bouton}
        start={degrades.debut}
        end={degrades.fin}
        style={styles.gradientBtn}
      >
        {chargement ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.texteBtn}>{titre}</Text>
        )}
      </LinearGradient>
    </PressionAnimee>
  );
}

// --- Carte blanche arrondie avec ombre douce ---
export function Carte({ children, style }) {
  return <View style={[styles.carte, ombre.carte, style]}>{children}</View>;
}

// --- Badge pilule (variantes de couleur) ---
export function Badge({ children, variante = "brand", style }) {
  const v = BADGE[variante] || BADGE.brand;
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.badgeTexte, { color: v.fg }]}>{children}</Text>
    </View>
  );
}

const BADGE = {
  brand: { bg: "#dbeafe", fg: couleurs.brandFonce },
  orange: { bg: "#fef3c7", fg: couleurs.ambreFonce },
  turquoise: { bg: "#cffafe", fg: couleurs.turquoiseFonce },
  succes: { bg: "#dcfce7", fg: "#15803d" },
  erreur: { bg: "#fee2e2", fg: "#b91c1c" },
};

// --- En-tête dégradé (bannière de section, façon hero du web) ---
export function Entete({ titre, sousTitre, pastille, children, style }) {
  return (
    <LinearGradient
      colors={degrades.entete}
      start={degrades.debut}
      end={degrades.fin}
      style={[styles.entete, style]}
    >
      {pastille ? (
        <View style={styles.pastille}>
          <Text style={styles.pastilleTexte}>{pastille}</Text>
        </View>
      ) : null}
      <Text style={styles.enteteTitre}>{titre}</Text>
      {sousTitre ? <Text style={styles.enteteSousTitre}>{sousTitre}</Text> : null}
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  plein: { width: "100%" },
  gradientBtn: {
    borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 22,
    alignItems: "center", justifyContent: "center",
  },
  texteBtn: { color: "#fff", fontFamily: police.semi, fontSize: 15 },
  secondaire: {
    borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 22,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff", borderWidth: 2, borderColor: couleurs.brand,
  },
  texteSecondaire: { color: couleurs.brand, fontFamily: police.semi, fontSize: 15 },
  carte: {
    backgroundColor: "#fff", borderRadius: radius.xl, padding: 18,
    borderWidth: 1, borderColor: couleurs.bordure,
  },
  badge: {
    alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeTexte: { fontFamily: police.gras, fontSize: 12 },
  entete: { borderRadius: radius.xl, padding: 22 },
  enteteTitre: { color: "#fff", fontFamily: police.extra, fontSize: 22, lineHeight: 28 },
  enteteSousTitre: { color: "#dbeafe", fontFamily: police.normal, fontSize: 14, marginTop: 6, lineHeight: 20 },
  pastille: {
    alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.32)",
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: radius.pill, marginBottom: 12,
  },
  pastilleTexte: { color: "#fff", fontFamily: police.semi, fontSize: 12, letterSpacing: 0.5 },
});
