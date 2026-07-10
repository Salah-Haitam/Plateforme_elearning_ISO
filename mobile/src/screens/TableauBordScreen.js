// Tableau de bord (ADMIN / RH) : statistiques globales + graphiques.
// Données : GET /api/statistiques/ (réservé Admin/RH côté backend).
import { useCallback, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Dimensions, RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { BarChart } from "react-native-chart-kit";
import api from "../services/api";
import { couleurs, radius, ombre, police } from "../theme";
import { Apparition, cascade, Pop, Squelette } from "../components/animations";

const LARGEUR = Dimensions.get("window").width - 32;

export default function TableauBordScreen() {
  const [stats, setStats] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [rafraichit, setRafraichit] = useState(false);

  const charger = useCallback(() => {
    setErreur(null);
    return api.get("/statistiques/")
      .then((r) => setStats(r.data))
      .catch(() => setErreur("Impossible de charger les statistiques."));
  }, []);

  useFocusEffect(useCallback(() => {
    setChargement(true);
    charger().finally(() => setChargement(false));
  }, [charger]));

  function rafraichir() {
    setRafraichit(true);
    charger().finally(() => setRafraichit(false));
  }

  if (chargement) {
    return (
      <ScrollView style={styles.conteneur} contentContainerStyle={{ padding: 16 }}>
        <Squelette largeur={190} hauteur={26} />
        <Squelette largeur={260} hauteur={14} style={{ marginTop: 8, marginBottom: 18 }} />
        <View style={styles.grilleTuiles}>
          {[0, 1, 2, 3].map((i) => (
            <Squelette key={i} hauteur={70} rayon={radius.lg} style={{ width: (LARGEUR - 10) / 2 }} />
          ))}
        </View>
        <Squelette largeur={210} hauteur={18} style={{ marginTop: 26 }} />
        <Squelette hauteur={220} rayon={radius.lg} style={{ marginTop: 12 }} />
        <Squelette largeur={180} hauteur={18} style={{ marginTop: 26 }} />
        <Squelette hauteur={220} rayon={radius.lg} style={{ marginTop: 12 }} />
      </ScrollView>
    );
  }
  if (erreur) {
    return <View style={styles.centre}><Text style={styles.erreur}>{erreur}</Text></View>;
  }

  const parNorme = {
    labels: stats.taux_reussite_par_norme.map((n) => raccourci(n.norme)),
    datasets: [{ data: stats.taux_reussite_par_norme.map((n) => Math.round(n.score_moyen)) }],
  };
  const clauses = {
    labels: stats.clauses_les_plus_ratees.map((c) => String(c.clause)),
    datasets: [{ data: stats.clauses_les_plus_ratees.map((c) => Math.round(c.taux_echec)) }],
  };

  return (
    <ScrollView
      style={styles.conteneur}
      contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
      refreshControl={<RefreshControl refreshing={rafraichit} onRefresh={rafraichir} />}
    >
      <Text style={styles.titre}>Tableau de bord</Text>
      <Text style={styles.sousTitre}>Vue d'ensemble de la progression des apprenants.</Text>

      {/* --- Tuiles indicateurs (apparition en rebond, en cascade) --- */}
      <View style={styles.grilleTuiles}>
        <Pop><Tuile icone="people" valeur={stats.compteurs.nb_apprenants} libelle="Apprenants" couleur={couleurs.brand} /></Pop>
        <Pop delay={70}><Tuile icone="book" valeur={stats.compteurs.nb_cours} libelle="Cours" couleur={couleurs.turquoise} /></Pop>
        <Pop delay={140}><Tuile icone="checkmark-done" valeur={stats.compteurs.nb_quiz_passes} libelle="Quiz passés" couleur={couleurs.ambre} /></Pop>
        <Pop delay={210}><Tuile icone="trending-up" valeur={`${stats.progression_moyenne}%`} libelle="Progression moy." couleur={couleurs.succes} /></Pop>
      </View>

      {/* --- Taux de réussite par norme --- */}
      <Text style={styles.sectionTitre}>Taux de réussite par norme</Text>
      {stats.taux_reussite_par_norme.length === 0 ? (
        <Text style={styles.vide}>Pas encore de données.</Text>
      ) : (
        <Apparition delay={cascade(1)}><Graphe data={parNorme} couleur="37, 99, 235" /></Apparition>
      )}

      {/* --- Clauses les plus ratées --- */}
      <Text style={styles.sectionTitre}>Clauses les plus ratées</Text>
      {stats.clauses_les_plus_ratees.length === 0 ? (
        <Text style={styles.vide}>Pas encore de données.</Text>
      ) : (
        <Apparition delay={cascade(2)}><Graphe data={clauses} couleur="245, 158, 11" /></Apparition>
      )}
    </ScrollView>
  );
}

function Graphe({ data, couleur }) {
  return (
    <View style={styles.carteGraphe}>
      <BarChart
        data={data}
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
          color: (o = 1) => `rgba(${couleur}, ${o})`,
          labelColor: () => couleurs.muted,
          barPercentage: 0.6,
        }}
        style={{ borderRadius: 12 }}
      />
    </View>
  );
}

function Tuile({ icone, valeur, libelle, couleur }) {
  return (
    <View style={styles.tuile}>
      <View style={[styles.tuileIcone, { backgroundColor: couleur + "1a" }]}>
        <Ionicons name={icone} size={22} color={couleur} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.tuileValeur}>{valeur}</Text>
        <Text style={styles.tuileLabel}>{libelle}</Text>
      </View>
    </View>
  );
}

function raccourci(t = "") {
  return t.length > 10 ? t.slice(0, 9) + "…" : t;
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: couleurs.fond, padding: 24 },
  titre: { fontSize: 22, fontFamily: police.extra, color: couleurs.ink },
  sousTitre: { color: couleurs.muted, marginTop: 4, marginBottom: 16, fontFamily: police.normal },
  grilleTuiles: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tuile: {
    flexDirection: "row", alignItems: "center", gap: 12, width: (LARGEUR - 10) / 2,
    backgroundColor: "#fff", borderRadius: radius.lg, padding: 12, borderWidth: 1, borderColor: couleurs.bordure, ...ombre.carte,
  },
  tuileIcone: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tuileValeur: { fontSize: 20, fontFamily: police.extra, color: couleurs.ink },
  tuileLabel: { color: couleurs.muted, fontSize: 12, fontFamily: police.normal },
  sectionTitre: { fontSize: 16, fontFamily: police.gras, color: couleurs.ink, marginTop: 24, marginBottom: 10 },
  carteGraphe: { backgroundColor: "#fff", borderRadius: radius.lg, padding: 12, borderWidth: 1, borderColor: couleurs.bordure, alignItems: "center", ...ombre.carte },
  vide: { color: couleurs.muted, paddingVertical: 12, fontFamily: police.normal },
  erreur: { color: "#b91c1c", fontFamily: police.moyen, textAlign: "center" },
});
