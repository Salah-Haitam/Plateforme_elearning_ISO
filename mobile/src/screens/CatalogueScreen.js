// Catalogue des cours : bannière hero + cartes illustrées (image par norme),
// badge ambre, bouton dégradé « Consulter » — reprise du design web.
import { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet, RefreshControl, Image, ScrollView,
} from "react-native";
import api from "../services/api";
import { couleurs, radius, ombre, police, imageCours } from "../theme";
import { Bouton, Badge, Entete } from "../components/ui";
import { Apparition, cascade, SqueletteCarteCours } from "../components/animations";

export default function CatalogueScreen({ navigation }) {
  const [cours, setCours] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  function charger() {
    setErreur(null);
    api.get("/cours/")
      .then((r) => setCours(r.data))
      .catch(() => setErreur("Impossible de charger le catalogue."))
      .finally(() => setChargement(false));
  }

  useEffect(() => { charger(); }, []);

  const entete = (
    <View style={{ marginBottom: 16 }}>
      <Entete
        pastille="FORMATION · NORMES ISO"
        titre="Catalogue des formations"
        sousTitre="Choisissez une norme et progressez à votre rythme."
      />
      {erreur && <Text style={styles.erreur}>{erreur}</Text>}
    </View>
  );

  // Chargement : on montre la FORME du contenu à venir (skeletons), pas un spinner
  if (chargement) {
    return (
      <ScrollView style={styles.conteneur} contentContainerStyle={{ padding: 16 }}>
        {entete}
        <SqueletteCarteCours />
        <SqueletteCarteCours />
      </ScrollView>
    );
  }

  return (
    <View style={styles.conteneur}>
      <FlatList
        data={cours}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={false} onRefresh={charger} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={entete}
        ListEmptyComponent={<Text style={styles.vide}>Aucun cours disponible.</Text>}
        renderItem={({ item, index }) => (
          // Apparition en cascade : chaque carte entre avec un léger décalage
          <Apparition delay={cascade(index)}>
            <View style={styles.carte}>
              <Image source={imageCours(item.norme)} style={styles.image} />
              <View style={styles.corps}>
                <Badge variante="orange">{item.norme}</Badge>
                <Text style={styles.carteTitre}>{item.titre}</Text>
                <Text style={styles.carteDesc} numberOfLines={2}>
                  {item.description || "Formation aux exigences de la norme."}
                </Text>
                <Text style={styles.niveau}>Niveau : {item.niveau_difficulte}</Text>
                <Bouton
                  titre="Consulter →"
                  onPress={() => navigation.navigate("CoursDetail", { coursId: item.id, titre: item.titre })}
                  style={{ marginTop: 14 }}
                />
              </View>
            </View>
          </Apparition>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: couleurs.fond },
  carte: {
    backgroundColor: "#fff", borderRadius: radius.xl, marginBottom: 16, overflow: "hidden",
    borderWidth: 1, borderColor: couleurs.bordure, ...ombre.carte,
  },
  image: { width: "100%", height: 150 },
  corps: { padding: 16 },
  carteTitre: { fontSize: 17, fontFamily: police.gras, color: couleurs.ink, marginTop: 10 },
  carteDesc: { color: couleurs.muted, marginTop: 6, fontFamily: police.normal, lineHeight: 20 },
  niveau: { color: couleurs.muted, fontSize: 13, marginTop: 8, fontFamily: police.moyen },
  erreur: {
    backgroundColor: "#fee2e2", color: "#b91c1c", padding: 12, borderRadius: radius.md,
    marginTop: 12, fontFamily: police.moyen,
  },
  vide: { color: couleurs.muted, textAlign: "center", marginTop: 40, fontFamily: police.normal },
});
