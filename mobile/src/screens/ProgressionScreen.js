// Tableau de bord de l'apprenant : niveaux de maîtrise (graphique), recommandations
// du moteur adaptatif et derniers résultats de quiz.
// Données 100 % apprenant : /profils-competence/, /recommandations/, /resultats/.
import { useCallback, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Dimensions, RefreshControl, TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { BarChart } from "react-native-chart-kit";
import api from "../services/api";
import { couleurs, radius, ombre, police } from "../theme";
import { Apparition, cascade, Pop, Squelette } from "../components/animations";

const LARGEUR = Dimensions.get("window").width - 32; // marge de 16 de chaque côté

export default function ProgressionScreen({ navigation }) {
  const [cours, setCours] = useState([]);
  const [competences, setCompetences] = useState([]);
  const [recommandations, setRecommandations] = useState([]);
  const [resultats, setResultats] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichit, setRafraichit] = useState(false);

  const charger = useCallback(() => {
    // On lance les 4 requêtes en parallèle ; chacune échoue silencieusement.
    return Promise.all([
      api.get("/cours/").then((r) => setCours(r.data)).catch(() => {}),
      api.get("/profils-competence/").then((r) => setCompetences(r.data)).catch(() => {}),
      api.get("/recommandations/").then((r) => setRecommandations(r.data)).catch(() => {}),
      api.get("/resultats/").then((r) => setResultats(r.data)).catch(() => {}),
    ]);
  }, []);

  useFocusEffect(useCallback(() => {
    setChargement(true);
    charger().finally(() => setChargement(false));
  }, [charger]));

  function rafraichir() {
    setRafraichit(true);
    charger().finally(() => setRafraichit(false));
  }

  // Associe un id de cours à son titre (les profils ne renvoient qu'un id)
  const titreCours = (id) => cours.find((c) => c.id === id)?.titre || `Cours #${id}`;

  // Chargement : squelettes plutôt qu'un spinner
  if (chargement) {
    return (
      <ScrollView style={styles.conteneur} contentContainerStyle={{ padding: 16 }}>
        <Squelette largeur={180} hauteur={26} />
        <View style={[styles.rangeeTuiles, { marginTop: 16 }]}>
          <Squelette hauteur={82} rayon={radius.lg} style={{ flex: 1 }} />
          <Squelette hauteur={82} rayon={radius.lg} style={{ flex: 1 }} />
          <Squelette hauteur={82} rayon={radius.lg} style={{ flex: 1 }} />
        </View>
        <Squelette largeur={200} hauteur={18} style={{ marginTop: 26 }} />
        <Squelette hauteur={220} rayon={radius.lg} style={{ marginTop: 12 }} />
        <Squelette largeur={160} hauteur={18} style={{ marginTop: 26 }} />
        <Squelette hauteur={90} rayon={radius.lg} style={{ marginTop: 12 }} />
      </ScrollView>
    );
  }

  // Données du graphique : maîtrise (%) par cours
  const donneesGraphe = {
    labels: competences.map((c) => raccourci(titreCours(c.cours))),
    datasets: [{ data: competences.map((c) => Math.round(c.niveau_maitrise * 100)) }],
  };

  return (
    <ScrollView
      style={styles.conteneur}
      contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
      refreshControl={<RefreshControl refreshing={rafraichit} onRefresh={rafraichir} />}
    >
      <Text style={styles.titre}>Ma progression</Text>

      {/* --- Cartes de synthèse (apparition en rebond) --- */}
      <View style={styles.rangeeTuiles}>
        <Pop style={{ flex: 1 }}><Tuile valeur={competences.length} label="Cours suivis" couleur={couleurs.brand} /></Pop>
        <Pop delay={80} style={{ flex: 1 }}><Tuile valeur={resultats.length} label="Quiz passés" couleur={couleurs.turquoise} /></Pop>
        <Pop delay={160} style={{ flex: 1 }}><Tuile valeur={`${moyenneMaitrise(competences)}%`} label="Maîtrise moy." couleur={couleurs.vert} /></Pop>
      </View>

      {/* --- Graphique de maîtrise par cours --- */}
      <Text style={styles.sousTitre}>Niveau de maîtrise par cours</Text>
      {competences.length === 0 ? (
        <Text style={styles.vide}>Passez des quiz pour voir évoluer vos compétences.</Text>
      ) : (
        <View style={styles.carteGraphe}>
          <BarChart
            data={donneesGraphe}
            width={LARGEUR - 24}
            height={220}
            fromZero
            showValuesOnTopOfBars
            withInnerLines={false}
            yAxisSuffix="%"
            chartConfig={{
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: (o = 1) => `rgba(37, 99, 235, ${o})`,     // brand
              labelColor: () => couleurs.muted,
              barPercentage: 0.6,
            }}
            style={{ borderRadius: 12 }}
          />
        </View>
      )}

      {/* --- Recommandations du moteur adaptatif --- */}
      {recommandations.length > 0 && (
        <>
          <Text style={styles.sousTitre}>Recommandations pour vous</Text>
          {recommandations.map((reco, i) => {
            const remed = reco.type === "remediation";
            return (
              <Apparition key={i} delay={cascade(i)}>
              <TouchableOpacity
                activeOpacity={0.7}
                // Mène au cours recommandé (dans la pile de l'onglet Formations)
                onPress={() => navigation.navigate("Formations", {
                  screen: "CoursDetail",
                  params: { coursId: reco.cours_suggere, titre: titreCours(reco.cours_suggere) },
                })}
                style={[styles.carteReco, { borderLeftColor: remed ? couleurs.erreur : couleurs.succes }]}
              >
                <View style={[styles.badge, { backgroundColor: remed ? "#fee2e2" : "#dcfce7" }]}>
                  <Text style={{ color: remed ? "#b91c1c" : "#15803d", fontFamily: police.gras, fontSize: 12 }}>
                    {remed ? "Remédiation" : "Approfondissement"}
                  </Text>
                </View>
                <Text style={styles.recoRaison}>{reco.raison}</Text>
                <Text style={styles.recoSuggere}>👉 {reco.titre_suggere} →</Text>
              </TouchableOpacity>
              </Apparition>
            );
          })}
        </>
      )}

      {/* --- Derniers résultats --- */}
      <Text style={styles.sousTitre}>Mes derniers résultats</Text>
      {resultats.length === 0 ? (
        <Text style={styles.vide}>Aucun résultat pour l'instant.</Text>
      ) : (
        resultats.slice(0, 8).map((r) => (
          <View key={r.id} style={styles.ligneRes}>
            <Text style={styles.resQuiz}>Quiz #{r.quiz}</Text>
            <Text style={[styles.resScore, { color: r.score >= 60 ? couleurs.succes : couleurs.erreur }]}>
              {Math.round(r.score)}%
            </Text>
            <Text style={styles.resDate}>
              {new Date(r.date_passage).toLocaleDateString("fr-FR")}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// Tuile de synthèse colorée
function Tuile({ valeur, label, couleur }) {
  return (
    <View style={styles.tuile}>
      <Text style={[styles.tuileValeur, { color: couleur }]}>{valeur}</Text>
      <Text style={styles.tuileLabel}>{label}</Text>
    </View>
  );
}

// Moyenne des maîtrises (0..1) -> pourcentage entier
function moyenneMaitrise(competences) {
  if (!competences.length) return 0;
  const somme = competences.reduce((s, c) => s + c.niveau_maitrise, 0);
  return Math.round((somme / competences.length) * 100);
}

// Raccourcit un titre trop long pour les étiquettes du graphique
function raccourci(titre) {
  return titre.length > 10 ? titre.slice(0, 9) + "…" : titre;
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: couleurs.fond },
  titre: { fontSize: 22, fontFamily: police.extra, color: couleurs.ink, marginBottom: 14 },
  sousTitre: { fontSize: 16, fontFamily: police.gras, color: couleurs.ink, marginTop: 24, marginBottom: 10 },
  rangeeTuiles: { flexDirection: "row", gap: 10 },
  tuile: { flex: 1, backgroundColor: "#fff", borderRadius: radius.lg, padding: 14, alignItems: "center", borderWidth: 1, borderColor: couleurs.bordure, ...ombre.carte },
  tuileValeur: { fontSize: 24, fontFamily: police.extra },
  tuileLabel: { color: couleurs.muted, fontSize: 12, marginTop: 4, textAlign: "center", fontFamily: police.normal },
  carteGraphe: { backgroundColor: "#fff", borderRadius: radius.lg, padding: 12, borderWidth: 1, borderColor: couleurs.bordure, alignItems: "center", ...ombre.carte },
  carteReco: { backgroundColor: "#fff", borderRadius: radius.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: couleurs.bordure, borderLeftWidth: 4, ...ombre.carte },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, marginBottom: 8 },
  recoRaison: { color: couleurs.texte, fontSize: 14, lineHeight: 20, fontFamily: police.normal },
  recoSuggere: { color: couleurs.brandFonce, fontFamily: police.gras, marginTop: 8 },
  ligneRes: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: radius.md, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: couleurs.bordure },
  resQuiz: { flex: 1, color: couleurs.ink, fontFamily: police.semi },
  resScore: { fontFamily: police.extra, fontSize: 16, width: 60, textAlign: "right" },
  resDate: { color: couleurs.muted, fontSize: 12, width: 90, textAlign: "right", fontFamily: police.normal },
  vide: { color: couleurs.muted, textAlign: "center", paddingVertical: 16, fontFamily: police.normal },
});
