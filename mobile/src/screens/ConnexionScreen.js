// Écran de connexion — fond dégradé maritime, carte blanche, bouton dégradé (façon web).
import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { couleurs, degrades, radius, police } from "../theme";
import { Bouton } from "../components/ui";

export default function ConnexionScreen({ navigation }) {
  const { connexion } = useAuth();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  async function seConnecter() {
    setErreur(null);
    setChargement(true);
    try {
      await connexion(email.trim(), motDePasse);
    } catch {
      setErreur("Email ou mot de passe incorrect.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <LinearGradient colors={degrades.hero} start={degrades.debut} end={degrades.fin} style={styles.fond}>
      <KeyboardAvoidingView
        style={styles.conteneur}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity style={styles.retour} onPress={() => navigation.navigate("Bienvenue")}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
          <Text style={styles.retourTexte}>Retour</Text>
        </TouchableOpacity>

        <View style={styles.logo}><Ionicons name="school" size={36} color="#fff" /></View>
        <Text style={styles.titre}>Marsa ISO</Text>
        <Text style={styles.sousTitre}>Formations aux normes ISO · Marsa Maroc</Text>

        <View style={styles.carte}>
          <Text style={styles.carteTitre}>Connexion</Text>
          {erreur && <Text style={styles.erreur}>{erreur}</Text>}

          <Text style={styles.label}>Adresse email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="exemple@marsamaroc.ma"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            value={motDePasse}
            onChangeText={setMotDePasse}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
          />

          <Bouton titre="Se connecter" onPress={seConnecter} chargement={chargement} style={{ marginTop: 20 }} />

          <TouchableOpacity onPress={() => navigation.navigate("Inscription")}>
            <Text style={styles.lien}>Pas encore de compte ? S'inscrire</Text>
          </TouchableOpacity>

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
          <Text style={styles.hintDecouverte}>Quiz de découverte — sans compte</Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  conteneur: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  retour: {
    position: "absolute", top: 50, left: 20, flexDirection: "row",
    alignItems: "center", gap: 4, padding: 6,
  },
  retourTexte: { color: "#fff", fontFamily: police.semi, fontSize: 15 },
  logo: {
    width: 80, height: 80, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  titre: { color: "#fff", fontSize: 28, fontFamily: police.extra },
  sousTitre: { color: "#bfdbfe", marginTop: 4, marginBottom: 26, fontFamily: police.normal },
  carte: {
    backgroundColor: "#fff", borderRadius: radius.xl, padding: 24, width: "100%", maxWidth: 420,
    borderTopWidth: 4, borderTopColor: couleurs.ambre,
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8,
  },
  carteTitre: { fontSize: 20, fontFamily: police.gras, color: couleurs.ink, marginBottom: 8 },
  label: { fontFamily: police.semi, color: couleurs.ink, marginBottom: 6, marginTop: 12, fontSize: 14 },
  input: {
    borderWidth: 1, borderColor: couleurs.bordure, borderRadius: radius.md, padding: 12,
    fontSize: 15, color: couleurs.ink, fontFamily: police.normal, backgroundColor: "#fff",
  },
  lien: { color: couleurs.brand, textAlign: "center", marginTop: 18, fontFamily: police.semi },
  separateur: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  trait: { flex: 1, height: 1, backgroundColor: couleurs.bordure },
  ou: { marginHorizontal: 12, color: couleurs.muted, fontFamily: police.moyen, fontSize: 13 },
  hintDecouverte: { textAlign: "center", color: couleurs.muted, fontFamily: police.normal, fontSize: 12, marginTop: 8 },
  erreur: {
    backgroundColor: "#fee2e2", color: "#b91c1c", padding: 10, borderRadius: radius.md,
    marginBottom: 6, fontFamily: police.moyen,
  },
});
