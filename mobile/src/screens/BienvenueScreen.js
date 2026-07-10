// Page d'accueil affichée AVANT la connexion (visiteur).
// Présente la plateforme et propose : connexion, inscription, ou quiz de
// découverte accessible sans compte.
import { View, Text, ImageBackground, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { couleurs, radius, police, imageHero } from "../theme";
import { Bouton } from "../components/ui";
import { Apparition, Pop } from "../components/animations";

export default function BienvenueScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground source={imageHero} style={styles.fond} resizeMode="cover">
      {/* Voile dégradé bleu par-dessus la photo du port */}
      <LinearGradient
        colors={["rgba(30,58,138,0.95)", "rgba(37,99,235,0.85)", "rgba(6,182,212,0.6)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.contenu,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 30 },
        ]}
      >
        <Pop>
          <View style={styles.logo}>
            <Ionicons name="school" size={40} color="#fff" />
          </View>
        </Pop>

        <Apparition delay={100}>
          <Text style={styles.marque}>Marsa ISO</Text>
        </Apparition>

        <Apparition delay={180}>
          <Text style={styles.titre}>
            Bienvenue chez Marsa ISO,{"\n"}là où l'apprentissage est simple
          </Text>
        </Apparition>

        <Apparition delay={260}>
          <Text style={styles.sousTitre}>
            La plateforme de formation adaptative de Marsa Maroc : des parcours qui
            s'ajustent à votre niveau et un assistant IA fondé sur les normes ISO.
          </Text>
        </Apparition>

        {/* --- Actions --- */}
        <Apparition delay={340} style={styles.actions}>
          <View>
          <Bouton titre="Connexion" onPress={() => navigation.navigate("Connexion")} />

          <Bouton
            titre="Inscription"
            variante="secondaire"
            onPress={() => navigation.navigate("Inscription")}
            style={{ marginTop: 12 }}
          />

          <View style={styles.separateur}>
            <View style={styles.trait} />
            <Text style={styles.ou}>ou</Text>
            <View style={styles.trait} />
          </View>

          <Bouton
            titre="✨ Tester mes connaissances"
            variante="secondaire"
            onPress={() => navigation.navigate("Decouverte")}
          />
          <Text style={styles.hint}>Quiz de découverte — visiteur, sans compte</Text>
          </View>
        </Apparition>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1, backgroundColor: couleurs.navy },
  contenu: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 26 },
  logo: {
    width: 86, height: 86, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.32)",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  marque: { color: "#fff", fontSize: 30, fontFamily: police.extra, letterSpacing: 0.5 },
  titre: {
    color: "#fff", fontSize: 22, lineHeight: 30, fontFamily: police.gras,
    textAlign: "center", marginTop: 18,
  },
  sousTitre: {
    color: "#dbeafe", fontSize: 14, lineHeight: 21, fontFamily: police.normal,
    textAlign: "center", marginTop: 14, paddingHorizontal: 6,
  },
  actions: { width: "100%", maxWidth: 420, marginTop: 34 },
  separateur: { flexDirection: "row", alignItems: "center", marginVertical: 18 },
  trait: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.35)" },
  ou: { marginHorizontal: 12, color: "#dbeafe", fontFamily: police.moyen, fontSize: 13 },
  hint: {
    textAlign: "center", color: "#bfdbfe", fontFamily: police.normal,
    fontSize: 12, marginTop: 10,
  },
});
