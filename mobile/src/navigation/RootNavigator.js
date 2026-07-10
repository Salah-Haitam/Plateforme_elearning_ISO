// Navigation racine :
//  - non connecté  -> pile d'authentification (Connexion / Inscription)
//  - connecté      -> onglets ; l'onglet Formations contient une pile
//    (Catalogue -> Détail du cours -> Lecture -> Quiz)
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { couleurs, degrades, police } from "../theme";
import BienvenueScreen from "../screens/BienvenueScreen";
import ConnexionScreen from "../screens/ConnexionScreen";
import InscriptionScreen from "../screens/InscriptionScreen";
import DecouverteScreen from "../screens/DecouverteScreen";
import AccueilScreen from "../screens/AccueilScreen";
import CatalogueScreen from "../screens/CatalogueScreen";
import CoursDetailScreen from "../screens/CoursDetailScreen";
import LectureScreen from "../screens/LectureScreen";
import QuizScreen from "../screens/QuizScreen";
import ProgressionScreen from "../screens/ProgressionScreen";
import TableauBordScreen from "../screens/TableauBordScreen";
import ProfilScreen from "../screens/ProfilScreen";
import ChatWidget from "../components/ChatWidget";

const AuthStack = createNativeStackNavigator();
const CatalogueStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// En-tête en dégradé navy→teal (comme la sidebar du web)
function fondEntete() {
  return (
    <LinearGradient
      colors={degrades.entete}
      start={degrades.debut}
      end={degrades.fin}
      style={{ flex: 1 }}
    />
  );
}

// Options communes des en-têtes de navigation (piles ET onglets)
const optionsEntete = {
  headerBackground: fondEntete,
  headerTintColor: "#fff",
  headerTitleStyle: { fontFamily: police.gras, fontSize: 18 },
  headerShadowVisible: false,
};

// Transition d'écran d'une PILE : glissement latéral natif.
// (Les onglets utilisent leur propre animation, cf. Onglets ci-dessous.)
const TRANSITION_PILE = "slide_from_right";

// Pile d'authentification (visiteur). On démarre sur la page de BIENVENUE, qui
// propose : connexion, inscription, ou quiz de découverte (sans compte).
function PileAuth() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, animation: TRANSITION_PILE }}>
      <AuthStack.Screen name="Bienvenue" component={BienvenueScreen} />
      <AuthStack.Screen name="Connexion" component={ConnexionScreen} />
      <AuthStack.Screen name="Inscription" component={InscriptionScreen} />
      <AuthStack.Screen name="Decouverte" component={DecouverteScreen} />
    </AuthStack.Navigator>
  );
}

// Pile de l'onglet Formations
function PileCatalogue() {
  return (
    <CatalogueStack.Navigator screenOptions={{ ...optionsEntete, animation: TRANSITION_PILE }}>
      <CatalogueStack.Screen name="Liste" component={CatalogueScreen} options={{ title: "Formations" }} />
      <CatalogueStack.Screen name="CoursDetail" component={CoursDetailScreen}
        options={({ route }) => ({ title: route.params?.titre || "Cours" })} />
      <CatalogueStack.Screen name="Lecture" component={LectureScreen}
        options={({ route }) => ({ title: route.params?.titre || "Lecture" })} />
      <CatalogueStack.Screen name="Quiz" component={QuizScreen} options={{ title: "Quiz" }} />
    </CatalogueStack.Navigator>
  );
}

// Icône d'onglet (vectorielle, cohérente avec les icônes lucide du web)
const ICONES = {
  Accueil: "home",
  Formations: "library",
  Progression: "stats-chart",
  Tableau: "grid",
  Profil: "person",
};
function iconeOnglet(nom, couleur, size) {
  return <Ionicons name={ICONES[nom]} size={size} color={couleur} />;
}

function Onglets() {
  const { utilisateur } = useAuth();
  const estAdminRH = utilisateur?.role === "ADMIN" || utilisateur?.role === "RH";

  return (
    // Le widget de chatbot flotte par-dessus toute la navigation par onglets
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          ...optionsEntete,
          tabBarActiveTintColor: couleurs.brand,
          tabBarInactiveTintColor: couleurs.muted,
          tabBarLabelStyle: { fontFamily: police.semi, fontSize: 11 },
          tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6, borderTopColor: couleurs.bordure },
          // Transition entre onglets : fondu doux (option propre aux bottom-tabs)
          animation: "fade",
          tabBarIcon: ({ color, size }) => iconeOnglet(route.name, color, size),
        })}
      >
        <Tab.Screen name="Accueil" component={AccueilScreen} options={{ headerShown: false }} />
        {/* L'onglet Formations est une pile -> on masque l'en-tête de l'onglet */}
        <Tab.Screen name="Formations" component={PileCatalogue} options={{ headerShown: false }} />
        <Tab.Screen name="Progression" component={ProgressionScreen} />
        {/* Tableau de bord : réservé aux rôles Admin / RH (comme le web) */}
        {estAdminRH && (
          <Tab.Screen name="Tableau" component={TableauBordScreen} options={{ title: "Tableau de bord" }} />
        )}
        <Tab.Screen name="Profil" component={ProfilScreen} />
      </Tab.Navigator>

      {/* Bulle de chatbot flottante en bas de l'écran (comme le web) */}
      <ChatWidget />
    </View>
  );
}

export default function RootNavigator() {
  const { utilisateur, chargement } = useAuth();

  if (chargement) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return utilisateur ? <Onglets /> : <PileAuth />;
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: couleurs.navy },
});
