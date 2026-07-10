// Composant racine : mise en page (sidebar) + définition des routes (pages).
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import RoutePrivee from "./components/RoutePrivee";
import ChatWidget from "./components/ChatWidget";

import Accueil from "./pages/Accueil";
import Connexion from "./pages/Connexion";
import Inscription from "./pages/Inscription";
import Catalogue from "./pages/Catalogue";
import CoursDetail from "./pages/CoursDetail";
import Quiz from "./pages/Quiz";
import Profil from "./pages/Profil";
import TableauBord from "./pages/TableauBord";
import Parcours from "./pages/Parcours";
import Decouverte from "./pages/Decouverte";

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* Pages publiques (visiteur non connecté) */}
        <Route path="/" element={<Accueil />} />
        <Route path="/connexion" element={<Connexion />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/decouverte" element={<Decouverte />} />

        {/* Contenu de formation : réservé aux utilisateurs connectés */}
        <Route
          path="/catalogue"
          element={
            <RoutePrivee>
              <Catalogue />
            </RoutePrivee>
          }
        />
        <Route
          path="/cours/:id"
          element={
            <RoutePrivee>
              <CoursDetail />
            </RoutePrivee>
          }
        />
        <Route
          path="/quiz/:id"
          element={
            <RoutePrivee>
              <Quiz />
            </RoutePrivee>
          }
        />
        {/* Parcours adaptatif guidé (apprenant connecté) */}
        <Route
          path="/cours/:id/parcours"
          element={
            <RoutePrivee>
              <Parcours />
            </RoutePrivee>
          }
        />

        {/* Pages protégées : nécessitent d'être connecté */}
        <Route
          path="/profil"
          element={
            <RoutePrivee>
              <Profil />
            </RoutePrivee>
          }
        />
        {/* Réservé aux administrateurs et RH */}
        <Route
          path="/tableau-de-bord"
          element={
            <RoutePrivee roles={["ADMIN", "RH"]}>
              <TableauBord />
            </RoutePrivee>
          }
        />
      </Routes>
      {/* Widget de chatbot flottant (bas à droite), visible si connecté */}
      <ChatWidget />
    </Layout>
  );
}
