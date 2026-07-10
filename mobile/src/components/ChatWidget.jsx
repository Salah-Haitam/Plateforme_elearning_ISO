// Widget de chatbot flottant (comme le web) : un bouton rond en bas à droite
// ouvre un panneau de discussion. Le chatbot RAG répond à partir des documents
// Marsa Maroc + ISO. Affiché par-dessus toute la navigation (utilisateur connecté).
import { useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { couleurs, degrades, radius, police } from "../theme";
import { Apparition, IndicateurFrappe } from "./animations";

export default function ChatWidget() {
  const { utilisateur } = useAuth();
  const insets = useSafeAreaInsets();
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState([]);   // { role: "user"|"ia", texte, sources? }
  const [saisie, setSaisie] = useState("");
  const [chargement, setChargement] = useState(false);
  const liste = useRef(null);

  // Le widget n'apparaît que pour un utilisateur connecté (le chatbot exige l'auth)
  if (!utilisateur) return null;

  const prenom = utilisateur?.nom?.split(" ")[0] || "";

  function versLeBas() {
    setTimeout(() => liste.current?.scrollToEnd({ animated: true }), 80);
  }

  async function envoyer() {
    const question = saisie.trim();
    if (!question || chargement) return;

    setMessages((p) => [...p, { role: "user", texte: question }]);
    setSaisie("");
    setChargement(true);
    versLeBas();

    try {
      const { data } = await api.post("/chatbot/", { message: question });
      setMessages((p) => [...p, { role: "ia", texte: data.reponse, sources: data.sources }]);
    } catch {
      setMessages((p) => [...p, { role: "ia", texte: "Désolé, une erreur est survenue. Réessayez.", sources: [] }]);
    } finally {
      setChargement(false);
      versLeBas();
    }
  }

  const accueil = (
    <View style={styles.accueil}>
      <Text style={{ fontSize: 46 }}>🤖</Text>
      <Text style={styles.accueilTitre}>Assistant ISO</Text>
      <Text style={styles.accueilTexte}>
        Bonjour {prenom} 👋{"\n"}Posez une question sur les normes ISO. Je réponds
        uniquement à partir des documents Marsa Maroc + ISO.
      </Text>
    </View>
  );

  return (
    <>
      {/* ---- Bouton rond flottant (FAB) ---- */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 72 + insets.bottom }]}
        activeOpacity={0.85}
        onPress={() => setOuvert(true)}
      >
        <LinearGradient colors={degrades.bouton} start={degrades.debut} end={degrades.fin} style={styles.fabGradient}>
          <Ionicons name="chatbubbles" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* ---- Panneau de discussion ---- */}
      <Modal visible={ouvert} animationType="slide" transparent onRequestClose={() => setOuvert(false)}>
        <View style={styles.voile}>
          {/* Zone au-dessus du panneau : toucher pour fermer */}
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setOuvert(false)} />
          <View style={[styles.panneau, { paddingBottom: insets.bottom }]}>
            {/* En-tête dégradé */}
            <LinearGradient colors={degrades.entete} start={degrades.debut} end={degrades.fin} style={styles.entete}>
              <View style={styles.enteteTitre}>
                <View style={styles.avatar}><Text style={{ fontSize: 18 }}>🤖</Text></View>
                <Text style={styles.enteteTexte}>Assistant ISO</Text>
              </View>
              <TouchableOpacity onPress={() => setOuvert(false)} hitSlop={10}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <FlatList
                ref={liste}
                data={messages}
                keyExtractor={(_, i) => String(i)}
                contentContainerStyle={styles.zoneMessages}
                ListEmptyComponent={accueil}
                onContentSizeChange={versLeBas}
                renderItem={({ item }) => (
                  <Apparition>
                    <Bulle message={item} />
                  </Apparition>
                )}
                ListFooterComponent={
                  chargement ? (
                    // « L'assistant écrit… » : trois points qui pulsent
                    <View style={[styles.bulle, styles.bulleIa]}>
                      <IndicateurFrappe />
                    </View>
                  ) : null
                }
              />

              <View style={styles.barreSaisie}>
                <TextInput
                  style={styles.champ}
                  value={saisie}
                  onChangeText={setSaisie}
                  placeholder="Votre question…"
                  placeholderTextColor={couleurs.muted}
                  multiline
                  onSubmitEditing={envoyer}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  style={[styles.boutonEnvoi, (!saisie.trim() || chargement) && { opacity: 0.4 }]}
                  onPress={envoyer}
                  disabled={!saisie.trim() || chargement}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Bulle({ message }) {
  const estUser = message.role === "user";
  return (
    <View style={[styles.bulle, estUser ? styles.bulleUser : styles.bulleIa]}>
      <Text style={[styles.texte, estUser && styles.texteUser]}>{message.texte}</Text>
      {message.sources && message.sources.length > 0 && (
        <Text style={styles.sources}>📄 Sources : {message.sources.map((s) => s.titre).join(", ")}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute", right: 16, width: 60, height: 60, borderRadius: 30, zIndex: 50,
    shadowColor: "#2563eb", shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  fabGradient: { flex: 1, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  voile: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)" },
  panneau: {
    height: "85%", backgroundColor: couleurs.fond,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden",
  },
  entete: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  enteteTitre: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  enteteTexte: { color: "#fff", fontFamily: police.gras, fontSize: 16 },
  zoneMessages: { padding: 14, flexGrow: 1 },
  accueil: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  accueilTitre: { fontSize: 20, fontFamily: police.extra, color: couleurs.ink, marginTop: 12 },
  accueilTexte: { color: couleurs.muted, textAlign: "center", marginTop: 8, lineHeight: 22, fontFamily: police.normal },
  bulle: { maxWidth: "82%", padding: 12, borderRadius: radius.lg, marginBottom: 10 },
  bulleUser: { alignSelf: "flex-end", backgroundColor: couleurs.brand, borderBottomRightRadius: 4 },
  bulleIa: { alignSelf: "flex-start", backgroundColor: "#fff", borderWidth: 1, borderColor: couleurs.bordure, borderBottomLeftRadius: 4 },
  texte: { color: couleurs.ink, fontSize: 15, lineHeight: 22, fontFamily: police.normal },
  texteUser: { color: "#fff" },
  sources: { marginTop: 8, fontSize: 12, color: couleurs.muted, fontStyle: "italic", fontFamily: police.normal },
  barreSaisie: {
    flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 10,
    backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: couleurs.bordure,
  },
  champ: {
    flex: 1, maxHeight: 120, backgroundColor: couleurs.fond, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: couleurs.ink, fontFamily: police.normal,
  },
  boutonEnvoi: { width: 44, height: 44, borderRadius: 22, backgroundColor: couleurs.brand, alignItems: "center", justifyContent: "center" },
});
