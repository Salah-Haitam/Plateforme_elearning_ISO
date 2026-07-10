// Écran profil : bannière dégradée avec avatar + rôle, infos, déconnexion.
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { couleurs, degrades, radius, ombre, police } from "../theme";
import { Apparition, Pop } from "../components/animations";

export default function ProfilScreen() {
  const { utilisateur, deconnexion } = useAuth();

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Bannière dégradée */}
      <LinearGradient colors={degrades.entete} start={degrades.debut} end={degrades.fin} style={styles.banniere}>
        <Pop>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexte}>
              {utilisateur?.nom?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        </Pop>
        <Text style={styles.nom}>{utilisateur?.nom}</Text>
        <Pop delay={120}>
          <View style={styles.badgeRole}><Text style={styles.badgeRoleTexte}>{utilisateur?.role}</Text></View>
        </Pop>
      </LinearGradient>

      <View style={styles.contenu}>
        <Apparition>
        <View style={styles.carte}>
          <Ligne icone="mail-outline" label="Email" valeur={utilisateur?.email} />
          <View style={styles.separateur} />
          <Ligne icone="shield-checkmark-outline" label="Rôle" valeur={utilisateur?.role} />
        </View>
        </Apparition>

        <TouchableOpacity style={styles.boutonDeco} onPress={deconnexion} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.boutonDecoTexte}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Ligne({ icone, label, valeur }) {
  return (
    <View style={styles.ligne}>
      <View style={styles.ligneIcone}>
        <Ionicons name={icone} size={20} color={couleurs.brand} />
      </View>
      <View>
        <Text style={styles.ligneLabel}>{label}</Text>
        <Text style={styles.ligneValeur}>{valeur}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  banniere: { alignItems: "center", paddingTop: 34, paddingBottom: 30, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  avatar: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.5)", alignItems: "center", justifyContent: "center",
  },
  avatarTexte: { color: "#fff", fontSize: 40, fontFamily: police.extra },
  nom: { fontSize: 22, fontFamily: police.gras, color: "#fff", marginTop: 14 },
  badgeRole: { backgroundColor: couleurs.ambre, paddingHorizontal: 14, paddingVertical: 4, borderRadius: radius.pill, marginTop: 8 },
  badgeRoleTexte: { color: "#fff", fontFamily: police.gras, fontSize: 12 },
  contenu: { padding: 20, marginTop: 4 },
  carte: { backgroundColor: "#fff", borderRadius: radius.lg, padding: 6, borderWidth: 1, borderColor: couleurs.bordure, ...ombre.carte },
  ligne: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  ligneIcone: { width: 40, height: 40, borderRadius: 12, backgroundColor: couleurs.brandClair, alignItems: "center", justifyContent: "center" },
  ligneLabel: { color: couleurs.muted, fontSize: 12, fontFamily: police.normal },
  ligneValeur: { color: couleurs.ink, fontSize: 15, fontFamily: police.semi },
  separateur: { height: 1, backgroundColor: couleurs.bordure, marginHorizontal: 14 },
  boutonDeco: {
    flexDirection: "row", gap: 8, backgroundColor: couleurs.erreur, paddingVertical: 14,
    borderRadius: radius.md, marginTop: 24, alignItems: "center", justifyContent: "center", ...ombre.carte,
  },
  boutonDecoTexte: { color: "#fff", fontFamily: police.gras, fontSize: 16 },
});
