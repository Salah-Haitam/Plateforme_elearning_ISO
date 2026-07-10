// Détail d'un cours : affiche le parcours (chapitres -> sous-parties) avec
// leur statut (verrouillé / en cours / validé), et le quiz final de chapitre.
import { useCallback, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";
import { couleurs, radius, ombre, police } from "../theme";
import { Bouton } from "../components/ui";
import { Apparition, cascade, BarreProgression, Squelette } from "../components/animations";

const ICONE = { VERROUILLE: "🔒", EN_COURS: "📖", VALIDE: "✅" };

// Part des sous-parties validées d'un chapitre (0 -> 1)
function avancement(chap) {
  const sous = chap.sous_parties || [];
  if (!sous.length) return 0;
  return sous.filter((s) => s.statut === "VALIDE").length / sous.length;
}

export default function CoursDetailScreen({ route, navigation }) {
  // Paramètres défensifs : évite un crash si l'écran est ouvert sans params
  const { coursId } = route.params || {};
  const [parcours, setParcours] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [generation, setGeneration] = useState(false);

  const charger = useCallback(() => {
    if (!coursId) { setChargement(false); return; }
    api.get(`/cours/${coursId}/parcours/`)
      .then((r) => setParcours(r.data))
      .catch(() => {})
      .finally(() => setChargement(false));
  }, [coursId]);

  // Recharge à chaque fois que l'écran redevient visible (après un quiz)
  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  // Génère le quiz final d'un chapitre (appel IA -> peut prendre ~15-20 s)
  async function lancerQuizFinal(chap) {
    setGeneration(true);
    try {
      const { data } = await api.post(`/chapitres/${chap.id}/quiz-final/`);
      navigation.navigate("Quiz", { quiz: data, mode: "final", coursId, titre: "Quiz final" });
    } catch (e) {
      const msg = e?.response?.data?.detail || "Échec de la génération du quiz final.";
      alert(msg);
    } finally {
      setGeneration(false);
    }
  }

  // Écran ouvert sans cours (ex : après un rechargement de dev)
  if (!coursId) {
    return (
      <View style={styles.centre}>
        <Text style={{ fontSize: 40 }}>📚</Text>
        <Text style={styles.genTitre}>Choisissez un cours dans le catalogue.</Text>
        <Bouton titre="Retour au catalogue" onPress={() => navigation.navigate("Liste")} plein={false} style={{ marginTop: 16 }} />
      </View>
    );
  }

  // Chargement : squelettes des cartes de chapitre
  if (chargement || !parcours) {
    return (
      <ScrollView style={styles.conteneur} contentContainerStyle={{ padding: 16 }}>
        <Squelette largeur="80%" hauteur={14} />
        {[0, 1, 2].map((i) => (
          <Squelette key={i} hauteur={150} rayon={radius.lg} style={{ marginTop: 14 }} />
        ))}
      </ScrollView>
    );
  }

  if (generation) {
    return (
      <View style={styles.centre}>
        <Text style={{ fontSize: 44 }}>🤖</Text>
        <Text style={styles.genTitre}>L'agent IA prépare le quiz final…</Text>
        <Text style={styles.genTexte}>50 questions — cela peut prendre quelques secondes.</Text>
        <ActivityIndicator color={couleurs.brand} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <Text style={styles.entete}>Progressez dans l'ordre. Chaque partie se débloque quand la précédente est validée.</Text>

      {parcours.chapitres.map((chap, iChap) => (
        <Apparition key={chap.id} delay={cascade(iChap)}>
        <View style={styles.carteChap}>
          <Text style={styles.chapTitre}>
            {ICONE[chap.statut]} Chapitre {chap.ordre} — {chap.titre}
          </Text>

          {/* Avancement du chapitre : barre qui se remplit au ressort */}
          <View style={styles.ligneAvancement}>
            <BarreProgression valeur={avancement(chap)} hauteur={8} style={{ flex: 1 }} />
            <Text style={styles.pourcentAvancement}>{Math.round(avancement(chap) * 100)}%</Text>
          </View>

          {chap.sous_parties.map((sp) => {
            const verrou = sp.statut === "VERROUILLE";
            return (
              <TouchableOpacity
                key={sp.id}
                disabled={verrou}
                activeOpacity={0.7}
                style={[styles.sp, verrou && { opacity: 0.45 }]}
                onPress={() => navigation.navigate("Lecture", { sousId: sp.id, titre: sp.titre, coursId })}
              >
                <Text style={styles.spTexte}>{ICONE[sp.statut]} {sp.titre}</Text>
                <Text style={styles.spAction}>
                  {verrou ? "Verrouillé" : sp.statut === "VALIDE" ? "Revoir" : "Étudier →"}
                </Text>
              </TouchableOpacity>
            );
          })}

          {chap.statut === "VALIDE" ? (
            <Text style={styles.chapValide}>Chapitre validé ✅</Text>
          ) : chap.quiz_final_debloque ? (
            <TouchableOpacity style={styles.btnFinal} onPress={() => lancerQuizFinal(chap)} activeOpacity={0.85}>
              <Text style={styles.btnFinalTexte}>🏁 Passer le quiz final (50 questions)</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.hint}>Validez toutes les sous-parties pour débloquer le quiz final.</Text>
          )}
        </View>
        </Apparition>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: couleurs.fond, padding: 24 },
  entete: { color: couleurs.muted, marginBottom: 14, fontFamily: police.normal, lineHeight: 20 },
  carteChap: { backgroundColor: "#fff", borderRadius: radius.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: couleurs.bordure, ...ombre.carte },
  chapTitre: { fontSize: 16, fontFamily: police.gras, color: couleurs.ink, marginBottom: 8 },
  ligneAvancement: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  pourcentAvancement: { fontFamily: police.semi, fontSize: 12, color: couleurs.muted, width: 38, textAlign: "right" },
  sp: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: couleurs.bordure },
  spTexte: { flex: 1, color: couleurs.ink, fontSize: 14, paddingRight: 10, fontFamily: police.moyen },
  spAction: { color: couleurs.brand, fontFamily: police.gras, fontSize: 13 },
  chapValide: { color: "#15803d", backgroundColor: "#dcfce7", padding: 10, borderRadius: radius.sm, marginTop: 12, textAlign: "center", fontFamily: police.semi },
  btnFinal: { backgroundColor: couleurs.ambre, padding: 14, borderRadius: radius.md, marginTop: 12, alignItems: "center", ...ombre.carte },
  btnFinalTexte: { color: "#fff", fontFamily: police.gras },
  hint: { color: couleurs.muted, fontSize: 12, marginTop: 12, fontFamily: police.normal, fontStyle: "italic" },
  genTitre: { fontSize: 18, fontFamily: police.gras, color: couleurs.ink, marginTop: 14, textAlign: "center" },
  genTexte: { color: couleurs.muted, marginTop: 6, textAlign: "center", fontFamily: police.normal },
});
