// Page d'accueil — reprise fidèle du web : hero maritime (image + voile dégradé),
// section « atouts », bandeau d'appel à l'action. Personnalisée si connecté.
import { View, Text, ScrollView, ImageBackground, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { couleurs, radius, ombre, police, imageHero } from "../theme";
import { Bouton, Carte } from "../components/ui";
import { Apparition, cascade } from "../components/animations";

// Les 3 piliers présentés sur l'accueil du web
const ATOUTS = [
  { icone: "🎯", titre: "Parcours adaptatif", texte: "Le contenu et les quiz s'ajustent à votre niveau de maîtrise, quiz après quiz." },
  { icone: "🤖", titre: "Assistant IA", texte: "Un chatbot qui répond uniquement à partir des documents Marsa Maroc et des normes ISO." },
  { icone: "📊", titre: "Suivi de progression", texte: "Visualisez vos scores, vos compétences et recevez des recommandations personnalisées." },
];

export default function AccueilScreen({ navigation }) {
  const { utilisateur } = useAuth();
  const insets = useSafeAreaInsets();
  const prenom = utilisateur?.nom?.split(" ")[0] || "";

  // Navigation inter-onglets (le Catalogue est dans la pile de l'onglet Formations)
  const versCatalogue = () => navigation.navigate("Formations", { screen: "Liste" });
  const versProfil = () => navigation.navigate("Profil");

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* ---- Hero : image de port + voile dégradé bleu (comme le web) ---- */}
      <ImageBackground source={imageHero} style={styles.hero} resizeMode="cover">
        <LinearGradient
          colors={["rgba(30,58,138,0.94)", "rgba(37,99,235,0.78)", "rgba(6,182,212,0.55)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.heroContenu, { paddingTop: insets.top + 24 }]}>
          <View style={styles.pastille}>
            <Text style={styles.pastilleTexte}>
              {utilisateur ? `Bonjour, ${utilisateur.nom} 👋` : "FORMATION · NORMES ISO"}
            </Text>
          </View>
          <Text style={styles.heroTitre}>
            {utilisateur
              ? "Bon retour ! Poursuivez votre progression"
              : "Montez en compétence sur les normes ISO, à votre rythme"}
          </Text>
          <Text style={styles.heroTexte}>
            La plateforme de formation adaptative de Marsa Maroc : des parcours qui
            s'ajustent à votre niveau et un assistant IA fondé sur les documents
            internes et les normes ISO (27001, 9001…).
          </Text>
          <View style={styles.heroActions}>
            <Bouton titre="Découvrir le catalogue →" onPress={versCatalogue} plein={false} />
            <Bouton titre="Mon profil" variante="secondaire" onPress={versProfil} plein={false} />
          </View>
        </View>
      </ImageBackground>

      {/* ---- Section « atouts » ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Une formation nouvelle génération</Text>
        <Text style={styles.sectionSousTitre}>
          Trois piliers pour progresser efficacement sur les normes ISO.
        </Text>

        {ATOUTS.map((a, i) => (
          <Apparition key={a.titre} delay={cascade(i)}>
            <Carte style={styles.atout}>
              <View style={styles.atoutIcone}><Text style={{ fontSize: 26 }}>{a.icone}</Text></View>
              <Text style={styles.atoutTitre}>{a.titre}</Text>
              <Text style={styles.atoutTexte}>{a.texte}</Text>
            </Carte>
          </Apparition>
        ))}

        {/* ---- Bandeau d'appel à l'action ---- */}
        <LinearGradient
          colors={[couleurs.navyProfond, couleurs.brand]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          <Text style={styles.ctaTitre}>
            {utilisateur ? `Content de vous revoir, ${prenom} !` : "Prêt à commencer ?"}
          </Text>
          <Text style={styles.ctaTexte}>
            {utilisateur
              ? "Reprenez votre formation aux normes ISO là où vous en étiez."
              : "Rejoignez les collaborateurs déjà formés aux normes ISO."}
          </Text>
          <Bouton titre="Reprendre une formation →" onPress={versCatalogue} style={{ marginTop: 14 }} />
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  hero: { minHeight: 380, justifyContent: "center", overflow: "hidden" },
  heroContenu: { padding: 24 },
  pastille: {
    alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.32)",
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill, marginBottom: 16,
  },
  pastilleTexte: { color: "#fff", fontFamily: police.semi, fontSize: 12, letterSpacing: 0.5 },
  heroTitre: { color: "#fff", fontSize: 28, lineHeight: 34, fontFamily: police.extra },
  heroTexte: { color: "#eff6ff", fontSize: 15, lineHeight: 22, marginTop: 14, fontFamily: police.normal },
  heroActions: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 22 },
  section: { padding: 20 },
  sectionTitre: { fontSize: 20, fontFamily: police.extra, color: couleurs.ink, textAlign: "center", marginTop: 8 },
  sectionSousTitre: { color: couleurs.muted, textAlign: "center", marginTop: 6, marginBottom: 18, fontFamily: police.normal, lineHeight: 20 },
  atout: { alignItems: "center", marginBottom: 14 },
  atoutIcone: {
    width: 60, height: 60, borderRadius: radius.lg, backgroundColor: couleurs.brandClair,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  atoutTitre: { fontSize: 16, fontFamily: police.gras, color: couleurs.ink, textAlign: "center" },
  atoutTexte: { color: couleurs.muted, textAlign: "center", marginTop: 6, fontFamily: police.normal, lineHeight: 20 },
  cta: { borderRadius: radius.xl, padding: 26, marginTop: 12, ...ombre.carte },
  ctaTitre: { color: "#fff", fontSize: 19, fontFamily: police.extra, textAlign: "center" },
  ctaTexte: { color: "#dbe7f2", textAlign: "center", marginTop: 8, fontFamily: police.normal, lineHeight: 20 },
});
