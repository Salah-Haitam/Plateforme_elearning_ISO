// Quiz de découverte (VISITEUR, public — accessible sans compte, comme le web).
// Étapes : 1) prénom + nom  ->  2) quiz 50 Q  ->  3) résultat (rouge si < seuil).
import { useState } from "react";
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import { couleurs, degrades, radius, ombre, police } from "../theme";
import { Bouton } from "../components/ui";
import { Apparition, cascade, Pop, Confettis, ScoreAnime } from "../components/animations";

export default function DecouverteScreen({ navigation }) {
  const [etape, setEtape] = useState("form");     // form | quiz | resultat
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [choix, setChoix] = useState({});          // { questionId: reponseId }
  const [resultat, setResultat] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  const total = quiz?.questions?.length || 0;
  const repondues = Object.keys(choix).length;

  // Étape 1 -> charge le quiz de découverte
  async function commencer() {
    if (!nom.trim() || !prenom.trim()) {
      setErreur("Veuillez saisir votre nom et votre prénom.");
      return;
    }
    setErreur(null);
    setChargement(true);
    try {
      const { data } = await api.get("/quiz-decouverte/");
      setQuiz(data);
      setEtape("quiz");
    } catch {
      setErreur("Le quiz de découverte n'est pas encore disponible.");
    } finally {
      setChargement(false);
    }
  }

  // Étape 2 -> soumission
  async function soumettre() {
    setChargement(true);
    try {
      const reponses = Object.entries(choix).map(([question, reponse]) => ({
        question: Number(question), reponse: Number(reponse),
      }));
      const { data } = await api.post("/quiz-decouverte/soumettre/", {
        nom: nom.trim(), prenom: prenom.trim(), reponses,
      });
      setResultat(data);
      setEtape("resultat");
    } catch {
      setErreur("Erreur lors de l'envoi de vos réponses.");
    } finally {
      setChargement(false);
    }
  }

  // ----- Écran de chargement -----
  if (chargement) {
    return (
      <View style={styles.centre}>
        <Ionicons name="sparkles" size={44} color={couleurs.brand} />
        <Text style={styles.chargeTexte}>Un instant…</Text>
        <ActivityIndicator color={couleurs.brand} style={{ marginTop: 12 }} />
      </View>
    );
  }

  // ----- Étape 1 : formulaire prénom + nom -----
  if (etape === "form") {
    return (
      <LinearGradient colors={degrades.hero} start={degrades.debut} end={degrades.fin} style={styles.fond}>
        <ScrollView contentContainerStyle={styles.formConteneur}>
          <View style={styles.logo}><Ionicons name="sparkles" size={34} color="#fff" /></View>
          <Text style={styles.titre}>Quiz de découverte</Text>
          <Text style={styles.sousTitre}>
            Testez vos connaissances des normes ISO (50 questions). Renseignez votre
            identité pour commencer.
          </Text>

          <View style={styles.carte}>
            {erreur && <Text style={styles.erreur}>{erreur}</Text>}

            <Text style={styles.label}>Prénom</Text>
            <TextInput style={styles.input} value={prenom} onChangeText={setPrenom} placeholder="Votre prénom" placeholderTextColor="#94a3b8" />

            <Text style={styles.label}>Nom</Text>
            <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Votre nom" placeholderTextColor="#94a3b8" />

            <Bouton titre="Commencer le quiz →" onPress={commencer} style={{ marginTop: 20 }} />

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.lien}>← Retour</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // ----- Étape 3 : résultat (message ROUGE si < seuil) -----
  if (etape === "resultat" && resultat) {
    const reussi = resultat.reussi;
    return (
      <ScrollView style={styles.conteneur} contentContainerStyle={{ padding: 20 }}>
        <View style={[styles.carteResultat, { borderTopColor: reussi ? couleurs.succes : couleurs.erreur }]}>
          <Confettis actif={reussi} />
          <Pop><Text style={{ fontSize: 48 }}>{reussi ? "🎉" : "📚"}</Text></Pop>
          <View style={styles.ligneScore}>
            <ScoreAnime valeur={resultat.nb_correctes} style={styles.score} />
            <Text style={styles.score}> / {resultat.nb_questions}</Text>
          </View>
          <Text style={styles.pourcent}>
            Score : {resultat.score}% · seuil de réussite : {resultat.seuil} bonnes réponses
          </Text>
          <View style={[styles.bandeau, { backgroundColor: reussi ? "#dcfce7" : "#fee2e2" }]}>
            <Text style={{ color: reussi ? "#15803d" : "#b91c1c", fontFamily: police.semi }}>{resultat.message}</Text>
          </View>
          <Bouton titre="Créer un compte" onPress={() => navigation.navigate("Inscription")} style={{ marginTop: 20 }} />
          <Bouton titre="Retour à la connexion" variante="secondaire" onPress={() => navigation.navigate("Connexion")} style={{ marginTop: 10 }} />
        </View>
      </ScrollView>
    );
  }

  // ----- Étape 2 : le quiz -----
  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={styles.quizTitre}>{quiz.titre}</Text>
      <Text style={styles.quizIntro}>Bonne chance, {prenom} ! Répondez aux {total} questions.</Text>
      {erreur && <Text style={styles.erreur}>{erreur}</Text>}

      <View style={styles.progression}>
        <Text style={styles.progressionTexte}>{repondues} / {total} questions répondues</Text>
      </View>

      {quiz.questions.map((q, index) => (
        <Apparition key={q.id} delay={cascade(index)}>
          <View style={styles.carteQuestion}>
            <Text style={styles.enonce}>{index + 1}. {q.enonce}</Text>
            {q.reponses.map((rep) => {
              const choisi = choix[q.id] === rep.id;
              return (
                <TouchableOpacity
                  key={rep.id}
                  activeOpacity={0.8}
                  style={[styles.option, choisi && styles.optionChoisie]}
                  onPress={() => setChoix((p) => ({ ...p, [q.id]: rep.id }))}
                >
                  <Text style={[styles.optionTexte, choisi && styles.optionTexteChoisi]}>{rep.texte}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Apparition>
      ))}

      <Bouton
        titre={`Valider mes réponses (${repondues}/${total})`}
        onPress={soumettre}
        disabled={repondues < total}
        style={{ marginTop: 6 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1 },
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: couleurs.fond, padding: 24 },
  chargeTexte: { color: couleurs.muted, marginTop: 12, fontFamily: police.moyen },
  formConteneur: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  logo: {
    width: 76, height: 76, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  titre: { color: "#fff", fontSize: 25, fontFamily: police.extra, textAlign: "center" },
  sousTitre: { color: "#bfdbfe", marginTop: 8, marginBottom: 24, fontFamily: police.normal, textAlign: "center", lineHeight: 20, paddingHorizontal: 10 },
  carte: {
    backgroundColor: "#fff", borderRadius: radius.xl, padding: 24, width: "100%", maxWidth: 420,
    borderTopWidth: 4, borderTopColor: couleurs.ambre, ...ombre.carte,
  },
  label: { fontFamily: police.semi, color: couleurs.ink, marginBottom: 6, marginTop: 12, fontSize: 14 },
  input: {
    borderWidth: 1, borderColor: couleurs.bordure, borderRadius: radius.md, padding: 12,
    fontSize: 15, color: couleurs.ink, fontFamily: police.normal,
  },
  lien: { color: couleurs.brand, textAlign: "center", marginTop: 18, fontFamily: police.semi },
  quizTitre: { fontSize: 20, fontFamily: police.extra, color: couleurs.ink },
  quizIntro: { color: couleurs.muted, marginTop: 4, marginBottom: 12, fontFamily: police.normal },
  progression: { backgroundColor: couleurs.brandClair, padding: 12, borderRadius: radius.md, marginBottom: 14 },
  progressionTexte: { color: couleurs.brandFonce, fontFamily: police.semi, textAlign: "center" },
  carteQuestion: { backgroundColor: "#fff", borderRadius: radius.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: couleurs.bordure, ...ombre.carte },
  enonce: { fontFamily: police.gras, color: couleurs.ink, fontSize: 15, marginBottom: 10, lineHeight: 22 },
  option: { borderWidth: 2, borderColor: couleurs.bordure, borderRadius: radius.md, padding: 14, marginTop: 8 },
  optionChoisie: { borderColor: couleurs.brand, backgroundColor: couleurs.brandClair },
  optionTexte: { color: couleurs.texte, fontSize: 15, fontFamily: police.normal },
  optionTexteChoisi: { color: couleurs.brandFonce, fontFamily: police.semi },
  carteResultat: { backgroundColor: "#fff", borderRadius: radius.xl, padding: 26, alignItems: "center", borderTopWidth: 5, borderWidth: 1, borderColor: couleurs.bordure, overflow: "hidden", ...ombre.carte },
  ligneScore: { flexDirection: "row", alignItems: "baseline", marginTop: 8 },
  score: { fontSize: 34, fontFamily: police.extra, color: couleurs.ink },
  pourcent: { color: couleurs.muted, marginTop: 4, fontFamily: police.normal, textAlign: "center" },
  bandeau: { padding: 12, borderRadius: radius.md, marginTop: 16, width: "100%" },
  erreur: { backgroundColor: "#fee2e2", color: "#b91c1c", padding: 10, borderRadius: radius.md, marginBottom: 6, fontFamily: police.moyen },
});
