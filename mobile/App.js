// Point d'entrée de l'application mobile.
// Fournit : police Poppins (comme le web), zone sûre, contexte d'auth, navigation.
import { Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import { AuthProvider } from "./src/context/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { couleurs, police } from "./src/theme";

// Applique Poppins à TOUS les <Text> par défaut (équivalent du body{font-family} du web)
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [{ fontFamily: police.normal }];

export default function App() {
  const [policesPretes] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  if (!policesPretes) {
    return (
      <View style={styles.chargement}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    // GestureHandlerRootView doit envelopper toute l'app (gestes + reanimated)
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  chargement: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: couleurs.navy },
});
