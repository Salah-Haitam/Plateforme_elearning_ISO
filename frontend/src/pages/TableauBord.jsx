// Tableau de bord (Admin / RH) : statistiques avec graphiques Recharts.
import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList,
} from "recharts";
import { Users, BookOpen, ClipboardCheck, TrendingUp } from "lucide-react";
import api from "../api";

// Tuile d'indicateur avec icône colorée
function Tuile({ icon: Icon, valeur, libelle, couleur }) {
  return (
    <div className="carte" style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, display: "grid", placeItems: "center",
        background: `${couleur}1a`, color: couleur, flexShrink: 0 }}>
        <Icon size={26} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", lineHeight: 1.1 }}>{valeur}</div>
        <div className="muted" style={{ fontSize: 14 }}>{libelle}</div>
      </div>
    </div>
  );
}

// Infobulle personnalisée
function Info({ active, payload, suffixe }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f172a", color: "#fff", padding: "6px 10px", borderRadius: 8, fontSize: 13 }}>
      {payload[0].payload.label} : <strong>{payload[0].value}{suffixe}</strong>
    </div>
  );
}

function GraphBarres({ donnees, couleur, suffixe = "%" }) {
  const hauteur = Math.max(160, donnees.length * 46 + 20);
  return (
    <ResponsiveContainer width="100%" height={hauteur}>
      <BarChart data={donnees} layout="vertical" margin={{ left: 8, right: 44, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#eef2f7" />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}${suffixe}`}
          tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" width={150}
          tick={{ fill: "#1e293b", fontSize: 13 }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: "#f1f5f9" }} content={<Info suffixe={suffixe} />} />
        <Bar dataKey="valeur" fill={couleur} radius={[0, 6, 6, 0]} barSize={22}>
          <LabelList dataKey="valeur" position="right" formatter={(v) => `${v}${suffixe}`}
            style={{ fill: "#0f172a", fontSize: 12, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function TableauBord() {
  const [stats, setStats] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    api.get("/statistiques/").then((r) => setStats(r.data))
      .catch(() => setErreur("Impossible de charger les statistiques."));
  }, []);

  if (erreur) return <div className="page"><div className="message erreur">{erreur}</div></div>;
  if (!stats) return <div className="page"><p className="muted">Chargement…</p></div>;

  const parNorme = stats.taux_reussite_par_norme.map((n) => ({
    label: `${n.norme}`, valeur: n.score_moyen,
  }));
  const clauses = stats.clauses_les_plus_ratees.map((c) => ({
    label: c.clause, valeur: c.taux_echec,
  }));

  return (
    <div className="page">
      <h1>Tableau de bord</h1>
      <p className="muted">Vue d'ensemble de la progression des apprenants.</p>

      {/* Tuiles */}
      <div className="grille" style={{ margin: "24px 0 28px", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        <Tuile icon={Users} valeur={stats.compteurs.nb_apprenants} libelle="Apprenants" couleur="#2563eb" />
        <Tuile icon={BookOpen} valeur={stats.compteurs.nb_cours} libelle="Cours" couleur="#06b6d4" />
        <Tuile icon={ClipboardCheck} valeur={stats.compteurs.nb_quiz_passes} libelle="Quiz passés" couleur="#f59e0b" />
        <Tuile icon={TrendingUp} valeur={`${stats.progression_moyenne}%`} libelle="Progression moyenne" couleur="#22c55e" />
      </div>

      {/* Graphique : taux de réussite par norme */}
      <div className="carte" style={{ marginBottom: 24 }}>
        <h3>Taux de réussite par norme</h3>
        {parNorme.length === 0 ? (
          <p className="muted">Pas encore de données.</p>
        ) : (
          <GraphBarres donnees={parNorme} couleur="#2563eb" />
        )}
      </div>

      {/* Graphique : clauses les plus ratées */}
      <div className="carte">
        <h3>Clauses les plus ratées</h3>
        {clauses.length === 0 ? (
          <p className="muted">Pas encore de données.</p>
        ) : (
          <GraphBarres donnees={clauses} couleur="#f59e0b" />
        )}
      </div>
    </div>
  );
}
