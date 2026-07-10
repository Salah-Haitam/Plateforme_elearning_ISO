// Écran d'inscription — même identité que la connexion (dégradé + carte + bouton dégradé).
import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { sInscrire } from "../services/auth";
import { useAuth } from "../context/AuthContext";
import { couleurs, degrades, radius, police } from "../theme";
import { Bouton } from "../components/ui";

export default function InscriptionScreen({ navigation }) {
  const { connexion } = useAuth();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  async function inscrire() {
    setErreur(null);
    setChargement(true);
    try {
      await sInscrire(nom.trim(), email.trim(), motDePasse);
      await connexion(email.trim(), motDePasse); // connexion auto après inscription
    } catch (e) {
      const detail = e?.response?.data?.email?.[0];
      setErreur(detail || "Inscription impossible. Vérifiez vos informations.");
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
        <View style={styles.logo}><Ionicons name="school" size={36} color="#fff" /></View>
        <Text style={styles.titre}>Créer un compte</Text>
        <Text style={styles.sousTitre}>Rejoignez la plateforme de formation ISO</Text>

        <View style={styles.carte}>
          {erreur && <Text style={styles.erreur}>{erreur}</Text>}

          <Text style={styles.label}>Nom complet</Text>
          <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Votre nom" placeholderTextColor="#94a3b8" />

          <Text style={styles.label}>Adresse email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="exemple@marsamaroc.ma" placeholderTextColor="#94a3b8" />

          <Text style={styles.label}>Mot de passe (6 caractères min.)</Text>
          <TextInput style={styles.input} value={motDePasse} onChangeText={setMotDePasse} secureTextEntry placeholder="••••••••" placeholderTextColor="#94a3b8" />

          <Bouton titre="S'inscrire" onPress={inscrire} chargement={chargement} style={{ marginTop: 20 }} />

          <TouchableOpacity onPress={() => navigation.navigate("Connexion")}>
            <Text style={styles.lien}>Déjà un compte ? Se connecter</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  conteneur: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  logo: {
    width: 76, height: 76, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  titre: { color: "#fff", fontSize: 25, fontFamily: police.extra },
  sousTitre: { color: "#bfdbfe", marginTop: 4, marginBottom: 24, fontFamily: police.normal },
  carte: {
    backgroundColor: "#fff", borderRadius: radius.xl, padding: 24, width: "100%", maxWidth: 420,
    borderTopWidth: 4, borderTopColor: couleurs.ambre,
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8,
  },
  label: { fontFamily: police.semi, color: couleurs.ink, marginBottom: 6, marginTop: 12, fontSize: 14 },
  input: {
    borderWidth: 1, borderColor: couleurs.bordure, borderRadius: radius.md, padding: 12,
    fontSize: 15, color: couleurs.ink, fontFamily: police.normal, backgroundColor: "#fff",
  },
  lien: { color: couleurs.brand, textAlign: "center", marginTop: 18, fontFamily: police.semi },
  erreur: {
    backgroundColor: "#fee2e2", color: "#b91c1c", padding: 10, borderRadius: radius.md,
    marginBottom: 6, fontFamily: police.moyen,
  },
});
