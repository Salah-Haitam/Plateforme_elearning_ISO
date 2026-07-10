// Lecture d'une sous-partie : contenu + bouton « J'ai lu » puis micro-quiz.
import { useCallback, useState } from "react";
import {
  View, Text, ScrollView, ActivityIndicator, StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";
import { couleurs, radius, ombre, police } from "../theme";
import { Bouton, Badge } from "../components/ui";
import { Apparition, Squelette } from "../components/animations";

export default function LectureScreen({ route, navigation }) {
  // Paramètres défensifs : évite un crash si l'écran est ouvert sans params
  const { sousId, coursId, titre } = route.params || {};
  const [contenu, setContenu] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [generation, setGeneration] = useState(false);

  const charger = useCallback(() => {
    if (!sousId) { setChargement(false); return; }
    api.get(`/sous-parties/${sousId}/contenu/`)
      .then((r) => setContenu(r.data))
      .catch(() => {})
      .finally(() => setChargement(false));
  }, [sousId]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  async function marquerLu() {
    await api.post(`/sous-parties/${sousId}/lu/`);
    setContenu((c) => ({ ...c, lu: true }));
  }

  async function lancerMicroQuiz() {
    setGeneration(true);
    try {
      const { data } = await api.post(`/sous-parties/${sousId}/micro-quiz/`);
      navigation.navigate("Quiz", { quiz: data, mode: "micro", sousId, coursId, titre });
    } catch (e) {
      const msg = e?.response?.data?.detail || "Impossible de générer le quiz.";
      alert(msg);
    } finally {
      setGeneration(false);
    }
  }

  // Écran ouvert sans sous-partie (ex : après un rechargement de dev)
  if (!sousId) {
    return (
      <View style={styles.centre}>
        <Text style={{ fontSize: 40 }}>📚</Text>
        <Text style={styles.genTitre}>Ouvrez une sous-partie depuis un cours.</Text>
        <Bouton titre="Retour au catalogue" onPress={() => navigation.navigate("Liste")} plein={false} style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (chargement || !contenu) {
    return (
      <ScrollView style={styles.conteneur} contentContainerStyle={{ padding: 16 }}>
        <Squelette hauteur={24} largeur="70%" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Squelette key={i} hauteur={14} largeur={i % 3 === 2 ? "80%" : "100%"} style={{ marginTop: 12 }} />
        ))}
        <Squelette hauteur={48} rayon={radius.md} style={{ marginTop: 26 }} />
      </ScrollView>
    );
  }

  if (generation) {
    return (
      <View style={styles.centre}>
        <Text style={{ fontSize: 44 }}>🤖</Text>
        <Text style={styles.genTitre}>L'agent IA prépare vos 10 questions…</Text>
        <ActivityIndicator color={couleurs.brand} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Une seule entrée en fondu : pendant la lecture, aucun mouvement. */}
      {contenu.contenu_simplifie ? (
        <Apparition>
          <View style={styles.carteSimpl}>
            <Badge variante="orange">🤖 Version simplifiée pour vous</Badge>
            <Text style={[styles.texteContenu, { marginTop: 8 }]}>{contenu.contenu_simplifie}</Text>
          </View>
        </Apparition>
      ) : null}

      <Apparition delay={contenu.contenu_simplifie ? 80 : 0}>
        <View style={styles.carte}>
          <Text style={styles.titre}>{contenu.titre}</Text>
          <Text style={styles.texteContenu}>{contenu.contenu}</Text>
        </View>
      </Apparition>

      {!contenu.lu ? (
        <Bouton titre="✔ J'ai lu cette partie" onPress={marquerLu} style={{ marginTop: 18 }} />
      ) : (
        <Text style={styles.luOk}>Partie lue ✅</Text>
      )}

      <Bouton
        titre="Passer le micro-quiz (10 questions) →"
        variante="secondaire"
        onPress={lancerMicroQuiz}
        disabled={!contenu.lu}
        style={{ marginTop: 12 }}
      />
      {!contenu.lu && <Text style={styles.hint}>Lisez la partie avant de passer le quiz.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: couleurs.fond, padding: 24 },
  carte: { backgroundColor: "#fff", borderRadius: radius.xl, padding: 18, borderWidth: 1, borderColor: couleurs.bordure, ...ombre.carte },
  carteSimpl: { backgroundColor: "#fff7ed", borderRadius: radius.xl, padding: 18, borderWidth: 1, borderColor: "#fed7aa", marginBottom: 14 },
  titre: { fontSize: 19, fontFamily: police.extra, color: couleurs.ink, marginBottom: 10 },
  texteContenu: { color: couleurs.texte, fontSize: 15, lineHeight: 25, fontFamily: police.normal },
  luOk: { color: "#15803d", backgroundColor: "#dcfce7", padding: 12, borderRadius: radius.md, textAlign: "center", marginTop: 18, fontFamily: police.semi },
  hint: { color: couleurs.muted, fontSize: 12, marginTop: 8, textAlign: "center", fontFamily: police.normal, fontStyle: "italic" },
  genTitre: { fontSize: 18, fontFamily: police.gras, color: couleurs.ink, marginTop: 14, textAlign: "center" },
});
