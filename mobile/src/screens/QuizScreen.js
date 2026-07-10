// Écran de quiz tactile (micro-quiz ou quiz final).
// - Pendant la réponse : aucune animation (la concentration prime).
// - Après validation : score animé, confettis si réussi, secousse si échoué,
//   puis correction question par question (vert = bonne réponse, rouge = erreur).
import { useEffect, useMemo, useState } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
} from "react-native";
import Animated from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import { couleurs, radius, ombre, police } from "../theme";
import { Bouton, Badge } from "../components/ui";
import {
  Apparition, cascade, Pop, Confettis, ScoreAnime, useSecousse,
} from "../components/animations";

export default function QuizScreen({ route, navigation }) {
  // Paramètres défensifs : évite un crash si l'écran est ouvert sans quiz
  const { quiz, mode, sousId, coursId, titre } = route.params || {};
  const [choix, setChoix] = useState({});          // { questionId: reponseId }
  const [resultat, setResultat] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  const total = quiz?.questions?.length || 0;
  const repondues = Object.keys(choix).length;

  // Correction indexée par question : { [questionId]: {choisie, correcte, juste} }
  const parQuestion = useMemo(() => {
    const m = {};
    (resultat?.corrections || []).forEach((c) => { m[c.question] = c; });
    return m;
  }, [resultat]);

  async function soumettre() {
    setEnvoi(true);
    try {
      const reponses = Object.entries(choix).map(([question, reponse]) => ({
        question: Number(question),
        reponse: Number(reponse),
      }));
      const url = mode === "micro"
        ? `/quiz/${quiz.id}/soumettre-micro/`
        : `/quiz/${quiz.id}/soumettre-final/`;
      const { data } = await api.post(url, { reponses });
      setResultat(data);
    } catch {
      alert("Erreur lors de l'envoi des réponses.");
    } finally {
      setEnvoi(false);
    }
  }

  // --- Enchaînement automatique après un micro-quiz ---
  function continuerApresReussite() {
    const suivante = resultat?.sous_partie_suivante;
    if (suivante) {
      navigation.replace("Lecture", { sousId: suivante.id, titre: suivante.titre, coursId });
    } else {
      navigation.navigate("CoursDetail", { coursId });
    }
  }
  function relireApresEchec() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace("Lecture", { sousId, titre, coursId });
  }

  // Écran ouvert sans quiz (ex : après un rechargement de dev)
  if (!quiz) {
    return (
      <View style={styles.centreVide}>
        <Text style={{ fontSize: 40 }}>📚</Text>
        <Text style={styles.videTitre}>Aucun quiz en cours.</Text>
        <Bouton titre="Retour au catalogue" onPress={() => navigation.navigate("Liste")} plein={false} style={{ marginTop: 16 }} />
      </View>
    );
  }

  // ---------- Écran de résultat + correction ----------
  if (resultat) {
    const reussi = resultat.reussi;
    return (
      <ScrollView style={styles.conteneur} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <CarteResultat resultat={resultat} />

        <Text style={styles.titreCorrection}>Correction</Text>
        {quiz.questions.map((q, index) => (
          <QuestionCorrigee
            key={q.id}
            question={q}
            index={index}
            correction={parQuestion[q.id]}
          />
        ))}

        <View style={{ marginTop: 8 }}>
          {mode === "micro" && reussi ? (
            <Bouton
              titre={resultat.sous_partie_suivante ? "Partie suivante →" : "Passer au quiz final →"}
              onPress={continuerApresReussite}
            />
          ) : mode === "micro" ? (
            <Bouton titre="Relire (version simplifiée) →" onPress={relireApresEchec} />
          ) : (
            <Bouton titre="Voir le parcours →" onPress={() => navigation.navigate("CoursDetail", { coursId })} />
          )}
        </View>
      </ScrollView>
    );
  }

  // ---------- Écran du quiz (aucune animation pendant qu'on répond) ----------
  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
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
                <Pressable
                  key={rep.id}
                  style={[styles.option, choisi && styles.optionChoisie]}
                  onPress={() => setChoix((p) => ({ ...p, [q.id]: rep.id }))}
                >
                  <Text style={[styles.optionTexte, choisi && styles.optionTexteChoisi]}>{rep.texte}</Text>
                </Pressable>
              );
            })}
          </View>
        </Apparition>
      ))}

      <Bouton
        titre={`Valider mes réponses (${repondues}/${total})`}
        onPress={soumettre}
        chargement={envoi}
        disabled={repondues < total}
        style={{ marginTop: 6 }}
      />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Carte de résultat : badge qui « pop », score qui s'incrémente,
// confettis si réussi / secousse si échoué.
// ---------------------------------------------------------------------------
function CarteResultat({ resultat }) {
  const reussi = resultat.reussi;
  const { styleSecousse, secouer } = useSecousse();

  useEffect(() => {
    if (!reussi) secouer();
    // secouer() est stable pour la durée de vie de l'écran
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={styleSecousse}>
      <View style={[styles.carteResultat, { borderTopColor: reussi ? couleurs.succes : couleurs.erreur }]}>
        {/* Confettis uniquement en cas de réussite (et jamais si mouvement réduit) */}
        <Confettis actif={reussi} />

        <Pop>
          <View style={[styles.pastilleResultat, { backgroundColor: reussi ? "#dcfce7" : "#fee2e2" }]}>
            <Ionicons
              name={reussi ? "trophy" : "barbell"}
              size={38}
              color={reussi ? "#15803d" : "#b91c1c"}
            />
          </View>
        </Pop>

        <View style={styles.ligneScore}>
          <ScoreAnime valeur={resultat.nb_correctes} style={styles.score} />
          <Text style={styles.score}> / {resultat.nb_questions}</Text>
        </View>
        <ScoreAnime valeur={Math.round(resultat.score)} suffixe=" %" style={styles.pourcent} />

        <View style={[styles.bandeau, { backgroundColor: reussi ? "#dcfce7" : "#fee2e2" }]}>
          <Text style={{ color: reussi ? "#15803d" : "#b91c1c", fontFamily: police.semi, textAlign: "center" }}>
            {resultat.message}
          </Text>
        </View>

        {/* Micro-quiz échoué : version simplifiée générée par l'IA */}
        {!reussi && resultat.contenu_simplifie ? (
          <View style={styles.carteSimpl}>
            <Badge variante="orange">🤖 Version simplifiée</Badge>
            <Text style={styles.texteSimpl}>{resultat.contenu_simplifie}</Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Une question corrigée : options en vert (bonne réponse) / rouge (erreur).
// La carte se secoue une fois si l'apprenant s'est trompé.
// ---------------------------------------------------------------------------
function QuestionCorrigee({ question, index, correction }) {
  const juste = correction?.juste;
  const { styleSecousse, secouer } = useSecousse();

  useEffect(() => {
    if (correction && !juste) secouer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Apparition delay={cascade(index)}>
      <Animated.View style={styleSecousse}>
        <View style={[
          styles.carteQuestion,
          { borderLeftWidth: 4, borderLeftColor: juste ? couleurs.succes : couleurs.erreur },
        ]}>
          <Text style={styles.enonce}>{index + 1}. {question.enonce}</Text>

          {question.reponses.map((rep) => {
            const estBonne = correction?.correcte === rep.id;
            const estMonErreur = correction?.choisie === rep.id && !juste;

            let styleOption = styles.option;
            let styleTexte = styles.optionTexte;
            let icone = null;

            if (estBonne) {
              styleOption = [styles.option, styles.optionBonne];
              styleTexte = [styles.optionTexte, styles.optionTexteBonne];
              icone = <Ionicons name="checkmark-circle" size={20} color={couleurs.succes} />;
            } else if (estMonErreur) {
              styleOption = [styles.option, styles.optionErreur];
              styleTexte = [styles.optionTexte, styles.optionTexteErreur];
              icone = <Ionicons name="close-circle" size={20} color={couleurs.erreur} />;
            } else {
              styleOption = [styles.option, { opacity: 0.55 }];
            }

            return (
              <View key={rep.id} style={[styleOption, styles.optionCorrigee]}>
                <Text style={[styleTexte, { flex: 1 }]}>{rep.texte}</Text>
                {icone}
              </View>
            );
          })}
        </View>
      </Animated.View>
    </Apparition>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  progression: { backgroundColor: couleurs.brandClair, padding: 12, borderRadius: radius.md, marginBottom: 14 },
  progressionTexte: { color: couleurs.brandFonce, fontFamily: police.semi, textAlign: "center" },
  carteQuestion: { backgroundColor: "#fff", borderRadius: radius.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: couleurs.bordure, ...ombre.carte },
  enonce: { fontFamily: police.gras, color: couleurs.ink, fontSize: 15, marginBottom: 10, lineHeight: 22 },
  option: { borderWidth: 2, borderColor: couleurs.bordure, borderRadius: radius.md, padding: 14, marginTop: 8 },
  optionCorrigee: { flexDirection: "row", alignItems: "center", gap: 10 },
  optionChoisie: { borderColor: couleurs.brand, backgroundColor: couleurs.brandClair },
  optionBonne: { borderColor: couleurs.succes, backgroundColor: "#dcfce7" },
  optionErreur: { borderColor: couleurs.erreur, backgroundColor: "#fee2e2" },
  optionTexte: { color: couleurs.texte, fontSize: 15, fontFamily: police.normal },
  optionTexteChoisi: { color: couleurs.brandFonce, fontFamily: police.semi },
  optionTexteBonne: { color: "#15803d", fontFamily: police.semi },
  optionTexteErreur: { color: "#b91c1c", fontFamily: police.semi },
  carteResultat: { backgroundColor: "#fff", borderRadius: radius.xl, padding: 24, alignItems: "center", borderTopWidth: 5, borderWidth: 1, borderColor: couleurs.bordure, overflow: "hidden", ...ombre.carte },
  pastilleResultat: { width: 78, height: 78, borderRadius: 39, alignItems: "center", justifyContent: "center" },
  ligneScore: { flexDirection: "row", alignItems: "baseline", marginTop: 12 },
  score: { fontSize: 34, fontFamily: police.extra, color: couleurs.ink },
  pourcent: { color: couleurs.muted, marginTop: 2, fontFamily: police.moyen },
  bandeau: { padding: 12, borderRadius: radius.md, marginTop: 16, width: "100%" },
  carteSimpl: { backgroundColor: "#fff7ed", borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: "#fed7aa", marginTop: 16, width: "100%" },
  texteSimpl: { color: couleurs.texte, lineHeight: 22, marginTop: 8, fontFamily: police.normal },
  titreCorrection: { fontSize: 17, fontFamily: police.gras, color: couleurs.ink, marginTop: 24, marginBottom: 12 },
  centreVide: { flex: 1, backgroundColor: couleurs.fond, alignItems: "center", justifyContent: "center", padding: 30 },
  videTitre: { fontSize: 18, fontFamily: police.gras, color: couleurs.ink, marginTop: 12, textAlign: "center" },
});
