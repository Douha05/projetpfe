import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const API = "http://localhost:3001/api";

const COLORS = {
  blue:   "#2563eb",
  green:  "#16a34a",
  red:    "#dc2626",
  orange: "#d97706",
  purple: "#7c3aed",
  gray:   "#6b7280",
  teal:   "#0891b2",
  pink:   "#db2777",
};

const PERIODE_OPTIONS = [
  { value: "semaine", label: "7 jours" },
  { value: "mois",    label: "30 jours" },
  { value: "3mois",   label: "3 mois" },
  { value: "annee",   label: "1 an" },
  { value: "tous",    label: "Tout" },
];

const TrendBadge = ({ trend }) => {
  if (!trend || trend.sens === "stable") return null;
  const isHausse = trend.sens === "hausse";
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 20,
      background: isHausse ? "#f0fdf4" : "#fef2f2",
      color: isHausse ? "#15803d" : "#b91c1c",
      marginLeft: 6
    }}>
      {isHausse ? "▲" : "▼"} {Math.abs(trend.pct)}%
    </span>
  );
};

const KpiCard = ({ label, value, unit, color, trend, icon }) => (
  <div style={{
    background: "#fff", border: "1px solid #f0f0ed", borderRadius: 12,
    padding: "16px 20px", borderTop: `3px solid ${color}`,
    display: "flex", flexDirection: "column", gap: 6
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 18 }}>{icon}</span>
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
      <span style={{ fontSize: 28, fontWeight: 700, color }}>{value ?? "—"}</span>
      {unit && <span style={{ fontSize: 13, color: "#9ca3af" }}>{unit}</span>}
      {trend && <TrendBadge trend={trend} />}
    </div>
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 style={{
    fontSize: 13, fontWeight: 600, color: "#374151",
    margin: "24px 0 12px", textTransform: "uppercase",
    letterSpacing: "0.05em", borderLeft: "3px solid #2563eb",
    paddingLeft: 10
  }}>{children}</h3>
);

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "#fff", border: "1px solid #f0f0ed",
    borderRadius: 12, padding: "16px 20px", ...style
  }}>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
      padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
    }}>
      <p style={{ fontWeight: 600, color: "#111827", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "2px 0" }}>
          {p.name} : <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsDashboard({ token }) {
  const [data,    setData]    = useState(null);
  const [periode, setPeriode] = useState("mois");
  const [loading, setLoading] = useState(true);
  const [agentId, setAgentId] = useState("tous");
  const [agents,  setAgents]  = useState([]);

  useEffect(() => {
    fetchData();
  }, [periode, agentId]);

  useEffect(() => {
    fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.status === "ok") setAgents(d.users.filter(u => u.role === "support" && u.isActive)); })
      .catch(() => {});
  }, []);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams({ periode, agentId });
    fetch(`${API}/bi/dashboard?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.status === "ok") setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
        <p style={{ color: "#9ca3af", fontSize: 13 }}>Chargement des analytiques...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ textAlign: "center", padding: 80 }}>
      <p style={{ color: "#9ca3af" }}>Impossible de charger les données</p>
      <button onClick={fetchData} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", cursor: "pointer" }}>
        Réessayer
      </button>
    </div>
  );

  const { kpis, parJour, parType, parPriorite, parStatut, parAgent, backlogAge } = data;

  // Données graphe tickets par jour
  const parJourData = (parJour || []).slice(-30).map(j => ({
    date: new Date(j.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
    Créés: j.crees,
    Résolus: j.resolus,
  }));

  // Données donut priorité
  const prioData = (parPriorite || []).filter(p => p.count > 0).map(p => ({
    name: p.label, value: p.count,
    color: { Critique: COLORS.red, Haute: COLORS.orange, Moyen: COLORS.blue, Faible: COLORS.green }[p.label] || COLORS.gray,
  }));

  // Données donut type
  const typeData = (parType || []).filter(t => t.count > 0).map(t => ({
    name: t.label, value: t.count,
    color: { Bug: COLORS.red, Feature: COLORS.purple, Consultancy: COLORS.teal }[t.label] || COLORS.gray,
  }));

  // Données statut
  const statutData = (parStatut || []).filter(s => s.count > 0).map(s => ({
    name: s.label, value: s.count,
  }));

  // Données radar agents
  const radarData = parAgent?.length > 0 ? [
    { critere: "Résolution", ...Object.fromEntries(parAgent.map(a => [`${a.agent.prenom}`, a.tauxResolution])) },
    { critere: "SLA",        ...Object.fromEntries(parAgent.map(a => [`${a.agent.prenom}`, a.tauxSla])) },
    { critere: "Satisfaction", ...Object.fromEntries(parAgent.map(a => [`${a.agent.prenom}`, (a.satisfaction || 0) * 20])) },
    { critere: "Charge",     ...Object.fromEntries(parAgent.map(a => [`${a.agent.prenom}`, Math.min(a.total * 5, 100)])) },
  ] : [];

  const agentColors = [COLORS.blue, COLORS.purple, COLORS.teal, COLORS.pink, COLORS.orange];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ── Filtres ── */}
      <div style={{
        display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
        marginBottom: 20, padding: "12px 16px", background: "#fff",
        border: "1px solid #f0f0ed", borderRadius: 12
      }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>Période :</span>
        <div style={{ display: "flex", gap: 6 }}>
          {PERIODE_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setPeriode(opt.value)} style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500,
              border: "1px solid", cursor: "pointer", transition: "all .15s",
              borderColor: periode === opt.value ? COLORS.blue : "#e5e7eb",
              background: periode === opt.value ? "#eff6ff" : "#fff",
              color: periode === opt.value ? COLORS.blue : "#6b7280",
            }}>{opt.label}</button>
          ))}
        </div>
        {agents.length > 0 && (
          <>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginLeft: 8 }}>Agent :</span>
            <select value={agentId} onChange={e => setAgentId(e.target.value)} style={{
              padding: "5px 10px", borderRadius: 8, fontSize: 12, border: "1px solid #e5e7eb",
              background: "#fff", color: "#374151", cursor: "pointer"
            }}>
              <option value="tous">Tous les agents</option>
              {agents.map(a => <option key={a._id} value={a._id}>{a.prenom} {a.nom}</option>)}
            </select>
          </>
        )}
      </div>

      {/* ── KPIs principaux ── */}
      <SectionTitle>Indicateurs clés</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 4 }}>
        <KpiCard label="Total tickets"      value={kpis.total?.valeur}          color={COLORS.purple} trend={kpis.total?.trend}          icon="🎫" />
        <KpiCard label="Taux de résolution" value={kpis.tauxResolution?.valeur} color={COLORS.green}  trend={kpis.tauxResolution?.trend} icon="✅" unit="%" />
        <KpiCard label="Respect SLA"        value={kpis.tauxSla?.valeur}        color={COLORS.blue}   trend={kpis.tauxSla?.trend}        icon="⏱️" unit="%" />
        <KpiCard label="Satisfaction"       value={kpis.satisfaction?.valeur}   color={COLORS.orange} trend={kpis.satisfaction?.trend}   icon="⭐" unit="/5" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 4 }}>
        <KpiCard label="Temps moyen résolution" value={kpis.tempsMoyen?.valeur}     color={COLORS.teal}   trend={kpis.tempsMoyen?.trend}     icon="⚡" unit="min" />
        <KpiCard label="Escalades"              value={kpis.escalades?.valeur}      color={COLORS.red}    trend={kpis.escalades?.trend}      icon="🚨" />
        <KpiCard label="Backlog ratio"          value={kpis.backlogRatio?.valeur}   color={COLORS.orange} icon="📦" unit="j" />
        <KpiCard label="Taux réouverture"       value={kpis.tauxReouverture?.valeur} color={COLORS.pink}  icon="🔄" unit="%" />
      </div>

      {/* ── Évolution tickets ── */}
      <SectionTitle>Évolution des tickets</SectionTitle>
      <Card>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={parJourData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCrees" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={COLORS.blue}  stopOpacity={0.15} />
                <stop offset="95%" stopColor={COLORS.blue}  stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradResolus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={COLORS.green} stopOpacity={0.15} />
                <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="Créés"   stroke={COLORS.blue}  strokeWidth={2} fill="url(#gradCrees)"   dot={false} />
            <Area type="monotone" dataKey="Résolus" stroke={COLORS.green} strokeWidth={2} fill="url(#gradResolus)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Distribution ── */}
      <SectionTitle>Distribution</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

        {/* Donut priorité */}
        <Card>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 12 }}>Par priorité</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={prioData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {prioData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {prioData.map((p, i) => (
              <span key={i} style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
                {p.name} ({p.value})
              </span>
            ))}
          </div>
        </Card>

        {/* Donut type */}
        <Card>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 12 }}>Par type</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {typeData.map((t, i) => (
              <span key={i} style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, display: "inline-block" }} />
                {t.name} ({t.value})
              </span>
            ))}
          </div>
        </Card>

        {/* Barres statut */}
        <Card>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 12 }}>Par statut</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statutData} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {statutData.map((entry, i) => (
                  <Cell key={i} fill={[COLORS.orange, COLORS.blue, COLORS.purple, COLORS.red, COLORS.green, COLORS.gray, COLORS.gray][i % 7]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Backlog âge ── */}
      {backlogAge?.length > 0 && (
        <>
          <SectionTitle>Âge du backlog</SectionTitle>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {backlogAge.map((b, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{
                    height: 6, borderRadius: 3, background: [COLORS.green, COLORS.blue, COLORS.orange, COLORS.red][i],
                    marginBottom: 8, width: `${b.pct || 5}%`, maxWidth: "100%", margin: "0 auto 8px"
                  }} />
                  <p style={{ fontSize: 20, fontWeight: 700, color: [COLORS.green, COLORS.blue, COLORS.orange, COLORS.red][i], margin: 0 }}>{b.count}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>{b.label}</p>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", margin: 0 }}>{b.pct}%</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ── Performance agents ── */}
      {parAgent?.length > 0 && (
        <>
          <SectionTitle>Performance des agents</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Barres groupées */}
            <Card>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 12 }}>Total vs Résolus</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={parAgent.map(a => ({
                  name: a.agent.prenom,
                  Total: a.total,
                  Résolus: a.resolus,
                }))} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Total"   fill={COLORS.blue}  radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Résolus" fill={COLORS.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Radar */}
            {radarData.length > 0 && (
              <Card>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 12 }}>Analyse multi-critères</p>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#f3f4f6" />
                    <PolarAngleAxis dataKey="critere" tick={{ fontSize: 10, fill: "#6b7280" }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "#9ca3af" }} />
                    {parAgent.map((a, i) => (
                      <Radar key={a.agent._id} name={a.agent.prenom} dataKey={a.agent.prenom}
                        stroke={agentColors[i % agentColors.length]} fill={agentColors[i % agentColors.length]}
                        fillOpacity={0.1} strokeWidth={2} />
                    ))}
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>

          {/* Tableau récap agents */}
          <Card style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 12 }}>Récapitulatif agents</p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {["Agent", "Total", "Résolus", "Taux résol.", "SLA %", "Tps moyen", "Satisfaction", "Réouvertures"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parAgent.map((a, i) => (
                  <tr key={a.agent._id} style={{ borderBottom: "1px solid #f9fafb" }}>
                    <td style={{ padding: "10px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: agentColors[i % agentColors.length] + "22",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 600, color: agentColors[i % agentColors.length]
                        }}>
                          {a.agent.prenom?.[0]}{a.agent.nom?.[0]}
                        </div>
                        <span style={{ fontWeight: 500, color: "#111827" }}>{a.agent.prenom} {a.agent.nom}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px", color: "#374151", fontWeight: 600 }}>{a.total}</td>
                    <td style={{ padding: "10px" }}>
                      <span style={{ color: COLORS.green, fontWeight: 600 }}>{a.resolus}</span>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: a.tauxResolution >= 70 ? "#f0fdf4" : a.tauxResolution >= 40 ? "#fefce8" : "#fef2f2",
                        color: a.tauxResolution >= 70 ? COLORS.green : a.tauxResolution >= 40 ? COLORS.orange : COLORS.red,
                      }}>{a.tauxResolution}%</span>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: a.tauxSla >= 80 ? "#f0fdf4" : "#fef2f2",
                        color: a.tauxSla >= 80 ? COLORS.green : COLORS.red,
                      }}>{a.tauxSla}%</span>
                    </td>
                    <td style={{ padding: "10px", color: "#6b7280" }}>{a.tempsMoyen} min</td>
                    <td style={{ padding: "10px" }}>
                      {a.satisfaction ? (
                        <span style={{ color: COLORS.orange, fontWeight: 600 }}>⭐ {a.satisfaction}/5</span>
                      ) : <span style={{ color: "#d1d5db" }}>—</span>}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span style={{ color: a.tauxReouverture > 0 ? COLORS.red : COLORS.green, fontWeight: 600 }}>
                        {a.tauxReouverture}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

    </div>
  );
}