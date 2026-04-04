import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./TeamLeadDashboard.css";

const API = "http://localhost:3001/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const getUser  = () => { const u = localStorage.getItem("user") || sessionStorage.getItem("user"); return u ? JSON.parse(u) : null; };

const fmtDate   = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
const ticketRef = (id) => id ? `#${id.slice(-6).toUpperCase()}` : "";
const initials  = (p, n) => `${p?.[0] || ""}${n?.[0] || ""}`.toUpperCase();
const now       = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const Ico = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <path fillRule="evenodd" d={d} />
  </svg>
);
const D = {
  overview: "M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146z",
  tickets:  "M1.5 3.5A1.5 1.5 0 0 1 3 2h9.982a1.5 1.5 0 0 1 1.498 1.5v2.5a.5.5 0 0 1-.5.5 1 1 0 0 0 0 2 .5.5 0 0 1 .5.5v2.5A1.5 1.5 0 0 1 12.982 13H3A1.5 1.5 0 0 1 1.5 11.5V8a.5.5 0 0 1 .5-.5 1 1 0 1 0 0-2 .5.5 0 0 1-.5-.5V3.5z",
  agents:   "M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  clients:  "M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  create:   "M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16zM8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z",
  suivi:    "M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383-4.708 2.825L15 11.105V5.383zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741zM1 11.105l4.708-2.897L1 5.383v5.722z",
  logout:   "M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z",
  brand:    "M1.5 3.5A1.5 1.5 0 0 1 3 2h9.982a1.5 1.5 0 0 1 1.498 1.5v2.5a.5.5 0 0 1-.5.5 1 1 0 0 0 0 2 .5.5 0 0 1 .5.5v2.5A1.5 1.5 0 0 1 12.982 13H3A1.5 1.5 0 0 1 1.5 11.5V8a.5.5 0 0 1 .5-.5 1 1 0 1 0 0-2 .5.5 0 0 1-.5-.5V3.5z",
  bell:     "M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.491-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.921L8 1.918zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z",
  back:     "M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z",
};

const NAV_ITEMS = [
  { id: "overview",     label: "Vue d'ensemble",  icon: D.overview  },
  { id: "tickets",      label: "Tous les tickets", icon: D.tickets   },
  { id: "agents",       label: "Agents support",   icon: D.agents    },
  { id: "clients",      label: "Clients",          icon: D.clients   },
  { id: "suivi",        label: "Suivi clients",    icon: D.suivi     },
  { id: "creer-client", label: "Créer client",     icon: D.create    },
];

const PRIO_MAP = {
  low:      { label: "Faible",   bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  medium:   { label: "Moyen",    bg: "#fefce8", color: "#a16207", border: "#fde68a" },
  high:     { label: "Haute",    bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  critical: { label: "Critique", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
};

const STATUT_MAP = {
  ready_for_support:  { label: "À faire",     bg: "#fefce8", color: "#a16207" },
  in_progress:        { label: "En cours",     bg: "#eff6ff", color: "#1d4ed8" },
  ready_for_customer: { label: "À confirmer",  bg: "#f5f3ff", color: "#6d28d9" },
  solved:             { label: "Résolu",       bg: "#f0fdf4", color: "#15803d" },
  closed:             { label: "Fermé",        bg: "#f9fafb", color: "#6b7280" },
  cancelled:          { label: "Annulé",       bg: "#f9fafb", color: "#6b7280" },
  escalated:          { label: "Escaladé",     bg: "#fef2f2", color: "#b91c1c" },
};

const PRIO_LABELS = { low: "Faible", medium: "Moyen", high: "Haute", critical: "Critique" };

const PrioBadge = ({ p }) => {
  const c = PRIO_MAP[p] || PRIO_MAP.medium;
  return <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 6 }}>{c.label}</span>;
};

const StatutBadge = ({ s }) => {
  const m = STATUT_MAP[s] || { label: s, bg: "#f9fafb", color: "#6b7280" };
  return <span style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 6 }}>{m.label}</span>;
};

const KANBAN_COLS = [
  { statut: "ready_for_support",  label: "À faire",     accent: "#d97706", countBg: "#fefce8", countColor: "#a16207" },
  { statut: "in_progress",        label: "En cours",    accent: "#2563eb", countBg: "#eff6ff", countColor: "#1d4ed8" },
  { statut: "ready_for_customer", label: "À confirmer", accent: "#7c3aed", countBg: "#f5f3ff", countColor: "#6d28d9" },
  { statut: "escalated",          label: "Escaladé",    accent: "#dc2626", countBg: "#fef2f2", countColor: "#b91c1c" },
  { statut: "solved",             label: "Résolu",      accent: "#16a34a", countBg: "#f0fdf4", countColor: "#15803d" },
];

const ticketProgress = (statut) => {
  const map = { ready_for_support: 0, in_progress: 33, ready_for_customer: 66, solved: 100, closed: 100, cancelled: 0, escalated: 20 };
  return map[statut] ?? 0;
};

const progressColor = (pct) => {
  if (pct === 100) return "#16a34a";
  if (pct >= 66)   return "#7c3aed";
  if (pct >= 33)   return "#2563eb";
  return "#d97706";
};

export default function TeamLeadDashboard() {
  const navigate = useNavigate();
  const user = getUser(), token = getToken();

  const [tab, setTab]           = useState("overview");
  const [tickets, setTickets]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [statsByAgent, setSBA]  = useState([]);
  const [agents, setAgents]     = useState([]);
  const [selTicket, setSel]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [filterStatut, setFS]   = useState("tous");
  const [assignModal, setAM]    = useState(null);
  const [selAgent, setSA]       = useState("");
  const [globalMsg, setGMsg]    = useState("");
  const [notifs, setNotifs]     = useState([]);
  const [notifCount, setNC]     = useState(0);
  const [showNotifs, setShowN]  = useState(false);
  const [clients, setClients]   = useState([]);
  const [searchClient, setSC]   = useState("");
  const [deleteConfirm, setDC]  = useState(null);
  const [editClient, setEC]     = useState(null);
  const [editForm, setEF]       = useState({});
  const [editMsg, setEM]        = useState("");
  const [editErr, setEE]        = useState("");
  const [formClient, setFC]     = useState({ nom: "", prenom: "", email: "", telephone: "" });
  const [serverMsg, setSM]      = useState("");
  const [serverErr, setSE]      = useState("");
  const [currentTime, setTime]  = useState(now());
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchSuivi, setSearchSuivi]       = useState("");

  useEffect(() => {
    if (!token || !user || user.role !== "team_lead") { navigate("/login-personnel"); return; }
    loadAll();
    const iv = setInterval(() => { loadAll(); setTime(now()); }, 15000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { if (tab === "clients" || tab === "suivi") fetchClients(); }, [tab]);

  const loadAll = () => { fetchStats(); fetchTickets(); fetchAgents(); fetchNotifCount(); };

  const fetchStats = () =>
    fetch(`${API}/tickets/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") { setStats(d.stats); setSBA(d.statsByAgent); } });

  const fetchTickets = () => {
    setLoading(true);
    fetch(`${API}/tickets/tous`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setTickets(d.tickets); })
      .finally(() => setLoading(false));
  };

  const fetchAgents = () =>
    fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setAgents(d.users.filter(u => u.role === "support" && u.isActive)); });

  const fetchNotifCount = () =>
    fetch(`${API}/notifications/non-lues`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setNC(d.count); }).catch(() => {});

  const fetchNotifList = () =>
    fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setNotifs(d.notifications); }).catch(() => {});

  const fetchClients = () =>
    fetch(`${API}/admin/clients`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setClients(d.clients); }).catch(() => {});

  const fetchTicketDetail = (id) =>
    fetch(`${API}/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setSel(d.ticket); });

  const toggleNotifs = () => {
    if (!showNotifs) {
      fetchNotifList();
      fetch(`${API}/notifications/lire-tout`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } })
        .then(() => setNC(0)).catch(() => {});
    }
    setShowN(!showNotifs);
  };

  const assigner = async () => {
    if (!selAgent) { alert("Choisissez un agent"); return; }
    const res = await fetch(`${API}/tickets/${assignModal._id}/assigner`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ assigneeId: selAgent }),
    });
    const d = await res.json();
    if (d.status === "ok") {
      setGMsg("Ticket assigné avec succès."); setAM(null); setSA(""); fetchTickets(); fetchStats();
      setTimeout(() => setGMsg(""), 3000);
    }
  };

  const changePrio = async (id, p) => {
    await fetch(`${API}/tickets/${id}/priorite`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ priorite: p }),
    });
    fetchTickets(); if (selTicket?._id === id) fetchTicketDetail(id);
  };

  const createClient = async (e) => {
    e.preventDefault(); setSE(""); setSM("");
    if (!formClient.nom || !formClient.prenom || !formClient.email || !formClient.telephone) { setSE("Tous les champs sont obligatoires"); return; }
    const res = await fetch(`${API}/admin/create-client`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(formClient),
    });
    const d = await res.json();
    if (d.status === "ok") { setSM(`Compte créé, email envoyé à ${formClient.email}`); setFC({ nom: "", prenom: "", email: "", telephone: "" }); fetchClients(); }
    else setSE(d.msg);
  };

  const toggleClient = async (id) => {
    await fetch(`${API}/admin/clients/${id}/toggle`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
    fetchClients();
  };

  const deleteClient = async (id) => {
    const res = await fetch(`${API}/admin/clients/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    if (d.status === "ok") { setDC(null); fetchClients(); }
  };

  const saveClient = async () => {
    setEM(""); setEE("");
    const res = await fetch(`${API}/admin/clients/${editClient._id}/edit`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(editForm),
    });
    const d = await res.json();
    if (d.status === "ok") { setEM("Modifications enregistrées."); fetchClients(); setTimeout(() => setEC(null), 1500); }
    else setEE(d.msg);
  };

  const logout = () => { localStorage.clear(); sessionStorage.clear(); navigate("/login-personnel"); };

  const ticketsFiltres = filterStatut === "tous" ? tickets
    : filterStatut === "non_assignes" ? tickets.filter(t => !t.assignee)
    : tickets.filter(t => t.statut === filterStatut);

  const clientsFiltres = clients.filter(c => {
    const q = searchClient.toLowerCase();
    return c.prenom?.toLowerCase().includes(q) || c.nom?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
  });

  const clientsAvecStats = clients
    .filter(c => {
      const q = searchSuivi.toLowerCase();
      return c.prenom?.toLowerCase().includes(q) || c.nom?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
    })
    .map(c => {
      const ticketsClient = tickets.filter(t => t.reporter?._id === c._id || t.reporter === c._id);
      const total    = ticketsClient.length;
      const resolus  = ticketsClient.filter(t => ["solved","closed"].includes(t.statut)).length;
      const enCours  = ticketsClient.filter(t => t.statut === "in_progress").length;
      const attente  = ticketsClient.filter(t => t.statut === "ready_for_support").length;
      const escalade = ticketsClient.filter(t => t.statut === "escalated").length;
      const pct      = total > 0 ? Math.round((resolus / total) * 100) : 0;
      const feedbacks = ticketsClient.filter(t => t.feedback?.note > 0);
      const avgNote  = feedbacks.length > 0
        ? (feedbacks.reduce((s, t) => s + t.feedback.note, 0) / feedbacks.length).toFixed(1)
        : null;
      return { ...c, ticketsClient, total, resolus, enCours, attente, escalade, pct, avgNote };
    });

  const pageTitle = {
    overview: "Vue d'ensemble", tickets: "Tous les tickets",
    agents: "Agents support", clients: "Clients",
    suivi: "Suivi clients", "creer-client": "Créer un client"
  };

  return (
    <div className="tl-layout">

      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><Ico d={D.brand} size={14} /></div>
          <span className="sidebar-brand-name">TicketFlow</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(n => (
            <button key={n.id} className={`nav-item ${tab === n.id ? "active" : ""}`}
              onClick={() => { setTab(n.id); setSel(null); setSelectedClient(null); }}>
              <Ico d={n.icon} size={14} />{n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{user?.prenom?.[0]}{user?.nom?.[0]}</div>
            <div className="user-info">
              <span className="user-name">{user?.prenom} {user?.nom}</span>
              <span className="user-role">Chef d'équipe</span>
            </div>
            <button className="btn-logout" onClick={logout} title="Déconnexion"><Ico d={D.logout} size={13} /></button>
          </div>
        </div>
      </aside>

      <main className="tl-main">

        {deleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Supprimer ce client ?</h3>
              <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>Cette action est irréversible.</p>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setDC(null)}>Annuler</button>
                <button className="btn-delete-confirm" onClick={() => deleteClient(deleteConfirm._id)}>Supprimer</button>
              </div>
            </div>
          </div>
        )}

        {editClient && (
          <div className="modal-overlay">
            <div className="modal-box modal-edit">
              <h3>Modifier — {editClient.prenom} {editClient.nom}</h3>
              {editErr && <div className="alert alert-error">{editErr}</div>}
              {editMsg && <div className="alert alert-success">{editMsg}</div>}
              <div className="form-row">
                <div className="form-group"><label>Prénom</label><input className="form-input" value={editForm.prenom} onChange={e => setEF({ ...editForm, prenom: e.target.value })} /></div>
                <div className="form-group"><label>Nom</label><input className="form-input" value={editForm.nom} onChange={e => setEF({ ...editForm, nom: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Email</label><input type="email" className="form-input" value={editForm.email} onChange={e => setEF({ ...editForm, email: e.target.value })} /></div>
              <div className="form-group"><label>Téléphone</label><input className="form-input" value={editForm.telephone} onChange={e => setEF({ ...editForm, telephone: e.target.value })} /></div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setEC(null)}>Annuler</button>
                <button className="btn-save" onClick={saveClient}>Enregistrer</button>
              </div>
            </div>
          </div>
        )}

        {assignModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Assigner le ticket</h3>
              <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>{ticketRef(assignModal._id)} — {assignModal.titre}</p>
              <div className="form-group">
                <label>Agent support</label>
                <select className="form-input" value={selAgent} onChange={e => setSA(e.target.value)}>
                  <option value="">Sélectionner un agent</option>
                  {agents.map(a => <option key={a._id} value={a._id}>{a.prenom} {a.nom}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => { setAM(null); setSA(""); }}>Annuler</button>
                <button className="tl-btn-assign" onClick={assigner}>Assigner</button>
              </div>
            </div>
          </div>
        )}

        <div className="tl-topbar">
          <div>
            <h1 className="tl-page-title">{pageTitle[tab] || "Chef d'équipe"}</h1>
            <p className="tl-page-subtitle">{stats ? `${stats.total} tickets · mis à jour à ${currentTime}` : "Chargement..."}</p>
          </div>
          <div className="notif-wrapper">
            <button className="tl-notif-btn" onClick={toggleNotifs}>
              <svg width={13} height={13} viewBox="0 0 16 16" style={{ fill: "#57606a" }}><path d={D.bell} /></svg>
              Notifications
              {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
            </button>
            {showNotifs && (
              <div className="notif-dropdown">
                <p className="notif-header">Notifications</p>
                {notifs.length === 0 ? <p className="notif-empty">Aucune notification</p> : notifs.map(n => (
                  <div key={n._id} className={`notif-item ${n.lu ? "" : "notif-unread"}`}
                    onClick={() => { setShowN(false); setTab("tickets"); if (n.ticket) fetchTicketDetail(n.ticket._id); }}>
                    <p className="notif-msg">{n.message}</p>
                    <p className="notif-date">{fmtDate(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="tl-content">
          {globalMsg && <div className="alert alert-success">{globalMsg}</div>}

          {/* ---- OVERVIEW ---- */}
          {tab === "overview" && stats && (
            <>
              <div className="tl-stats-grid">
                {[
                  { label: "Total",        value: stats.total,       accent: "#8b5cf6", f: "tous" },
                  { label: "En attente",   value: stats.enAttente,   accent: "#d97706", f: "ready_for_support" },
                  { label: "En cours",     value: stats.enCours,     accent: "#2563eb", f: "in_progress" },
                  { label: "Résolus",      value: stats.resolus,     accent: "#16a34a", f: "solved" },
                  { label: "Escaladés",    value: stats.escalades,   accent: "#dc2626", f: "escalated" },
                  { label: "Non assignés", value: stats.nonAssignes, accent: "#6b7280", f: "non_assignes" },
                ].map(s => (
                  <div key={s.f} className="tl-stat-card" style={{ borderTop: `2.5px solid ${s.accent}` }}
                    onClick={() => { setTab("tickets"); setFS(s.f); setSel(null); }}>
                    <div className="tl-stat-number" style={{ color: s.accent }}>{s.value}</div>
                    <div className="tl-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
              {stats.nonAssignes > 0 && (
                <div className="tl-card">
                  <div className="tl-card-header">
                    <span className="tl-card-title">Tickets en attente d'assignation</span>
                    <span className="tl-badge-warning">{stats.nonAssignes} tickets</span>
                  </div>
                  <div className="tl-ticket-list">
                    {tickets.filter(t => !t.assignee).map(t => (
                      <div key={t._id} className="tl-ticket-row">
                        <div className="tl-ticket-left">
                          <span className="tl-ticket-id">{ticketRef(t._id)}</span>
                          <div>
                            <p className="tl-ticket-title">{t.titre}</p>
                            <p className="tl-ticket-meta">{t.reporter?.prenom} {t.reporter?.nom} · {fmtDate(t.createdAt)}</p>
                          </div>
                        </div>
                        <div className="tl-ticket-right">
                          <PrioBadge p={t.priorite} />
                          <button className="tl-btn-assign" onClick={() => setAM(t)}>Assigner</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ---- TICKETS ---- */}
          {tab === "tickets" && !selTicket && (
            <div className="tl-card">
              <div className="tl-card-header">
                <span className="tl-card-title">Tous les tickets</span>
                <select className="tl-filter-select" value={filterStatut} onChange={e => setFS(e.target.value)}>
                  <option value="tous">Tous les statuts</option>
                  <option value="ready_for_support">À faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="ready_for_customer">À confirmer</option>
                  <option value="solved">Résolus</option>
                  <option value="escalated">Escaladés</option>
                  <option value="non_assignes">Non assignés</option>
                </select>
              </div>
              {loading ? <div className="loading">Chargement...</div> : (
                filterStatut === "tous" ? (
                  <div className="tl-kanban-wrapper">
                    <div className="tl-kanban-board">
                      {KANBAN_COLS.map(col => {
                        const colTickets = tickets.filter(t => t.statut === col.statut);
                        return (
                          <div key={col.statut} className="tl-kanban-col" style={{ borderTop: `2.5px solid ${col.accent}` }}>
                            <div className="tl-kanban-col-header">
                              <span style={{ fontSize: 12, fontWeight: 500, color: col.accent }}>{col.label}</span>
                              <span style={{ background: col.countBg, color: col.countColor, fontSize: 11, fontWeight: 500, padding: "1px 7px", borderRadius: 20 }}>{colTickets.length}</span>
                            </div>
                            <div className="tl-kanban-col-body">
                              {colTickets.length === 0 ? (
                                <div className="tl-kanban-empty">Aucun ticket</div>
                              ) : colTickets.map(t => (
                                <div key={t._id} className="tl-kanban-card" onClick={() => { setSel(t); fetchTicketDetail(t._id); }}>
                                  <div className="tl-kanban-card-top">
                                    <span className="tl-ticket-id" style={{ fontSize: 10 }}>{ticketRef(t._id)}</span>
                                    <PrioBadge p={t.priorite} />
                                  </div>
                                  <p className="tl-kanban-card-title">{t.titre}</p>
                                  <p className="tl-kanban-card-type">{t.type === "bug" ? "Bug" : t.type === "feature" ? "Feature" : "Consultancy"}</p>
                                  <div className="tl-kanban-card-footer">
                                    <span className="tl-kanban-card-date">{fmtDate(t.createdAt)}</span>
                                    {t.assignee ? (
                                      <div className="tl-avatar-chip">{initials(t.assignee.prenom, t.assignee.nom)}</div>
                                    ) : (
                                      <span style={{ fontSize: 10, color: "#b91c1c", background: "#fef2f2", padding: "1px 6px", borderRadius: 4, border: "1px solid #fecaca" }}>Non assigné</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="tl-ticket-list">
                    {ticketsFiltres.length === 0 ? <p className="no-comment">Aucun ticket pour ce filtre.</p> : ticketsFiltres.map(t => (
                      <div key={t._id} className="tl-ticket-row" onClick={() => { setSel(t); fetchTicketDetail(t._id); }}>
                        <div className="tl-ticket-left">
                          <span className="tl-ticket-id">{ticketRef(t._id)}</span>
                          <div>
                            <p className="tl-ticket-title">{t.titre}</p>
                            <p className="tl-ticket-meta">{t.reporter?.prenom} {t.reporter?.nom} · {t.assignee ? `→ ${t.assignee.prenom} ${t.assignee.nom}` : "Non assigné"} · {fmtDate(t.createdAt)}</p>
                          </div>
                        </div>
                        <div className="tl-ticket-right">
                          <PrioBadge p={t.priorite} />
                          <StatutBadge s={t.statut} />
                          {!t.assignee && <button className="tl-btn-assign" onClick={e => { e.stopPropagation(); setAM(t); }}>Assigner</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* ---- DETAIL TICKET ---- */}
          {tab === "tickets" && selTicket && (
            <div className="tl-card">
              <button className="btn-back" onClick={() => setSel(null)}>← Retour</button>
              <div className="tl-detail-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span className="tl-ticket-id">{ticketRef(selTicket._id)}</span>
                  <StatutBadge s={selTicket.statut} />
                  <PrioBadge p={selTicket.priorite} />
                </div>
                <h2 className="tl-detail-title">{selTicket.titre}</h2>
                <p className="tl-ticket-meta">
                  Client : <strong>{selTicket.reporter?.prenom} {selTicket.reporter?.nom}</strong> · {fmtDate(selTicket.createdAt)}
                  {selTicket.assignee && <> · Assigné à <strong>{selTicket.assignee.prenom} {selTicket.assignee.nom}</strong></>}
                </p>
              </div>
              <div className="tl-detail-desc">{selTicket.description}</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Priorité</label>
                  <select className="tl-filter-select" value={selTicket.priorite} onChange={e => changePrio(selTicket._id, e.target.value)}>
                    {Object.entries(PRIO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <button className="tl-btn-assign" onClick={() => setAM(selTicket)}>
                  {selTicket.assignee ? "Réassigner" : "Assigner"} l'agent
                </button>
              </div>
              <div className="commentaires-section">
                <h3>Commentaires ({selTicket.commentaires?.length || 0})</h3>
                <div className="commentaires-list">
                  {selTicket.commentaires?.length === 0 && <p className="no-comment">Aucun commentaire</p>}
                  {selTicket.commentaires?.map(c => (
                    <div key={c._id} className="commentaire-item">
                      <div className={`comment-avatar ${c.auteur?.role === "client" ? "avatar-client" : "avatar-support"}`}>
                        {c.auteur?.prenom?.[0]}{c.auteur?.nom?.[0]}
                      </div>
                      <div className="comment-body">
                        <div className="comment-header">
                          <p className="comment-author">{c.auteur?.prenom} {c.auteur?.nom}
                            <span className="comment-role"> · {c.auteur?.role === "client" ? "Client" : "Support"}</span>
                          </p>
                        </div>
                        <p className="comment-text">{c.contenu}</p>
                        <p className="comment-date">{fmtDate(c.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---- AGENTS ---- */}
          {tab === "agents" && (
            <div className="tl-card">
              <span className="tl-card-title" style={{ display: "block", marginBottom: 16 }}>Performance des agents</span>
              <div className="tl-agents-grid">
                {statsByAgent.map(({ agent, assigned, inProgress, resolved }) => (
                  <div key={agent._id} className="tl-agent-card">
                    <div className="tl-agent-header">
                      <div className="tl-agent-avatar">{initials(agent.prenom, agent.nom)}</div>
                      <div>
                        <p className="tl-agent-name">{agent.prenom} {agent.nom}</p>
                        <p className="tl-agent-email">{agent.email}</p>
                      </div>
                    </div>
                    <div className="tl-agent-stats">
                      <div className="tl-agent-stat"><span className="tl-agent-stat-num">{assigned}</span><span className="tl-agent-stat-lbl">Assignés</span></div>
                      <div className="tl-agent-stat"><span className="tl-agent-stat-num" style={{ color: "#2563eb" }}>{inProgress}</span><span className="tl-agent-stat-lbl">En cours</span></div>
                      <div className="tl-agent-stat"><span className="tl-agent-stat-num" style={{ color: "#16a34a" }}>{resolved}</span><span className="tl-agent-stat-lbl">Résolus</span></div>
                    </div>
                  </div>
                ))}
                {statsByAgent.length === 0 && <p className="no-comment">Aucun agent actif.</p>}
              </div>
            </div>
          )}

          {/* ---- CLIENTS ---- */}
          {tab === "clients" && (
            <div className="tl-card">
              <div className="tl-card-header">
                <span className="tl-card-title">Clients</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{clientsFiltres.length} client{clientsFiltres.length !== 1 ? "s" : ""}</span>
              </div>
              <input className="tl-clients-search" placeholder="Rechercher par nom ou email..." value={searchClient} onChange={e => setSC(e.target.value)} />
              <table className="tl-clients-table">
                <thead>
                  <tr><th>Client</th><th>Email</th><th>Téléphone</th><th>Statut</th><th>Créé le</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {clientsFiltres.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", color: "#9ca3af", padding: 24, fontSize: 13 }}>Aucun client trouvé</td></tr>
                  ) : clientsFiltres.map(c => (
                    <tr key={c._id}>
                      <td><div className="tl-client-cell"><div className="tl-client-avatar">{initials(c.prenom, c.nom)}</div><div><div className="tl-client-name">{c.prenom} {c.nom}</div></div></div></td>
                      <td><span className="tl-client-email">{c.email}</span></td>
                      <td><span className="tl-client-phone">{c.telephone || "—"}</span></td>
                      <td><span className={c.isActive ? "tl-status-active" : "tl-status-inactive"}>{c.isActive ? "Actif" : "Inactif"}</span></td>
                      <td><span className="tl-client-date">{fmtDate(c.createdAt)}</span></td>
                      <td>
                        <div className="tl-action-btns">
                          <button className="tl-btn-edit" onClick={() => { setEC(c); setEF({ nom: c.nom, prenom: c.prenom, email: c.email, telephone: c.telephone }); setEM(""); setEE(""); }}>Modifier</button>
                          <button className={c.isActive ? "tl-btn-toggle-off" : "tl-btn-toggle-on"} onClick={() => toggleClient(c._id)}>{c.isActive ? "Désactiver" : "Activer"}</button>
                          <button className="tl-btn-delete" onClick={() => setDC(c)}>Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ---- SUIVI CLIENTS ---- */}
          {tab === "suivi" && !selectedClient && (
            <div className="tl-card">
              <div className="tl-card-header">
                <span className="tl-card-title">Suivi des clients</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{clientsAvecStats.length} client{clientsAvecStats.length !== 1 ? "s" : ""}</span>
              </div>
              <input className="tl-clients-search" placeholder="Rechercher un client..." value={searchSuivi} onChange={e => setSearchSuivi(e.target.value)} />
              {clientsAvecStats.length === 0 ? (
                <p className="no-comment">Aucun client trouvé.</p>
              ) : (
                <div className="suivi-clients-list">
                  {clientsAvecStats.map(c => (
                    <div key={c._id} className="suivi-client-card" onClick={() => setSelectedClient(c)}>
                      <div className="suivi-client-header">
                        <div className="suivi-client-left">
                          <div className="tl-client-avatar">{initials(c.prenom, c.nom)}</div>
                          <div>
                            <div className="suivi-client-name">{c.prenom} {c.nom}</div>
                            <div className="suivi-client-email">{c.email}</div>
                          </div>
                        </div>
                        <div className="suivi-client-right">
                          {c.avgNote && <span className="suivi-note">⭐ {c.avgNote}/5</span>}
                          <span className="suivi-total">{c.total} ticket{c.total !== 1 ? "s" : ""}</span>
                          <span className="suivi-pct" style={{ color: progressColor(c.pct) }}>{c.pct}%</span>
                        </div>
                      </div>
                      <div className="suivi-progress-bar-bg">
                        <div className="suivi-progress-bar-fill" style={{ width: `${c.pct}%`, background: progressColor(c.pct) }} />
                      </div>
                      <div className="suivi-mini-stats">
                        <span style={{ color: "#16a34a" }}>✅ {c.resolus} résolus</span>
                        <span style={{ color: "#2563eb" }}>🔵 {c.enCours} en cours</span>
                        <span style={{ color: "#d97706" }}>⏳ {c.attente} en attente</span>
                        {c.escalade > 0 && <span style={{ color: "#dc2626" }}>⚠️ {c.escalade} escaladés</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---- SUIVI DETAIL CLIENT ---- */}
          {tab === "suivi" && selectedClient && (
            <div className="tl-card">
              <button className="btn-back" onClick={() => setSelectedClient(null)}>← Retour au suivi</button>
              <div className="suivi-detail-header">
                <div className="tl-client-avatar" style={{ width: 48, height: 48, fontSize: 16 }}>
                  {initials(selectedClient.prenom, selectedClient.nom)}
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: 0 }}>{selectedClient.prenom} {selectedClient.nom}</h2>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: "2px 0 0" }}>{selectedClient.email}</p>
                </div>
                <div className="suivi-detail-stats">
                  <div className="suivi-detail-stat"><span style={{ fontSize: 22, fontWeight: 700, color: progressColor(selectedClient.pct) }}>{selectedClient.pct}%</span><span style={{ fontSize: 11, color: "#9ca3af" }}>Résolution</span></div>
                  <div className="suivi-detail-stat"><span style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{selectedClient.total}</span><span style={{ fontSize: 11, color: "#9ca3af" }}>Total</span></div>
                  <div className="suivi-detail-stat"><span style={{ fontSize: 22, fontWeight: 700, color: "#16a34a" }}>{selectedClient.resolus}</span><span style={{ fontSize: 11, color: "#9ca3af" }}>Résolus</span></div>
                  {selectedClient.avgNote && <div className="suivi-detail-stat"><span style={{ fontSize: 22, fontWeight: 700, color: "#d97706" }}>⭐ {selectedClient.avgNote}</span><span style={{ fontSize: 11, color: "#9ca3af" }}>Satisfaction</span></div>}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                  <span>Avancement global</span>
                  <span style={{ fontWeight: 600, color: progressColor(selectedClient.pct) }}>{selectedClient.pct}%</span>
                </div>
                <div className="suivi-progress-bar-bg" style={{ height: 10 }}>
                  <div className="suivi-progress-bar-fill" style={{ width: `${selectedClient.pct}%`, background: progressColor(selectedClient.pct) }} />
                </div>
              </div>

              <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 12 }}>
                Tickets ({selectedClient.ticketsClient.length})
              </p>

              {selectedClient.ticketsClient.length === 0 ? (
                <p className="no-comment">Aucun ticket pour ce client.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {selectedClient.ticketsClient.map(t => {
                    const pct = ticketProgress(t.statut);
                    const color = progressColor(pct);
                    return (
                      <div key={t._id} className="suivi-ticket-item">
                        <div className="suivi-ticket-top">
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span className="tl-ticket-id">{ticketRef(t._id)}</span>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{t.titre}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <PrioBadge p={t.priorite} />
                            <StatutBadge s={t.statut} />
                            <span style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%</span>
                          </div>
                        </div>

                        <div className="suivi-progress-bar-bg" style={{ marginTop: 8 }}>
                          <div className="suivi-progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
                        </div>

                        <div className="suivi-ticket-steps">
                          {[
                            { label: "À faire",  statuts: ["ready_for_support"] },
                            { label: "En cours", statuts: ["in_progress"] },
                            { label: "Solution", statuts: ["ready_for_customer"] },
                            { label: "Résolu",   statuts: ["solved","closed"] },
                          ].map((step, i) => {
                            const done = step.statuts.includes(t.statut) ||
                              (i === 0 && ["in_progress","ready_for_customer","solved","closed"].includes(t.statut)) ||
                              (i === 1 && ["ready_for_customer","solved","closed"].includes(t.statut)) ||
                              (i === 2 && ["solved","closed"].includes(t.statut));
                            const active = step.statuts.includes(t.statut);
                            return (
                              <div key={i} className="suivi-step">
                                <div className="suivi-step-dot" style={{
                                  background: done ? color : "#e5e7eb",
                                  border: active ? `2px solid ${color}` : "none",
                                  transform: active ? "scale(1.2)" : "scale(1)",
                                }} />
                                <span className="suivi-step-label" style={{ color: done ? color : "#9ca3af", fontWeight: active ? 600 : 400 }}>{step.label}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* ← OPTION 2 : feedback en ligne séparée */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid #f3f4f6", flexWrap: "wrap", gap: 6 }}>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>
                            Créé le {fmtDate(t.createdAt)}
                            {t.assignee && <> · Agent : <strong>{t.assignee.prenom} {t.assignee.nom}</strong></>}
                          </div>
                          {t.feedback?.note > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "4px 10px" }}>
                              <span style={{ fontSize: 12 }}>⭐</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#854d0e" }}>{t.feedback.note}/5</span>
                              <span style={{ fontSize: 11, color: "#a16207" }}>Satisfaction client</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ---- CREER CLIENT ---- */}
          {tab === "creer-client" && (
            <div className="tl-card">
              <span className="tl-card-title" style={{ display: "block", marginBottom: 4 }}>Créer un compte client</span>
              <p className="card-subtitle">Un mot de passe temporaire sera envoyé par email.</p>
              {serverErr && <div className="alert alert-error">{serverErr}</div>}
              {serverMsg && <div className="alert alert-success">{serverMsg}</div>}
              <form onSubmit={createClient} noValidate>
                <div className="form-row">
                  <div className="form-group"><label>Prénom <span className="req">*</span></label><input className="form-input" placeholder="Prénom" value={formClient.prenom} onChange={e => setFC({ ...formClient, prenom: e.target.value })} /></div>
                  <div className="form-group"><label>Nom <span className="req">*</span></label><input className="form-input" placeholder="Nom" value={formClient.nom} onChange={e => setFC({ ...formClient, nom: e.target.value })} /></div>
                </div>
                <div className="form-group"><label>Email <span className="req">*</span></label><input type="email" className="form-input" placeholder="client@exemple.com" value={formClient.email} onChange={e => setFC({ ...formClient, email: e.target.value })} /></div>
                <div className="form-group"><label>Téléphone <span className="req">*</span></label><input className="form-input" placeholder="+216 XX XXX XXX" value={formClient.telephone} onChange={e => setFC({ ...formClient, telephone: e.target.value })} /></div>
                <div className="info-box"><span>🔐</span><p>Un mot de passe temporaire sera généré et envoyé au client.</p></div>
                <button type="submit" className="btn-primary">Créer le compte client</button>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}