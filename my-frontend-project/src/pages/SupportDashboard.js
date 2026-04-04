import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SupportDashboard.css";

const API = "http://localhost:3001/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const getUser = () => {
  const u = localStorage.getItem("user") || sessionStorage.getItem("user");
  return u ? JSON.parse(u) : null;
};

const Ico = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <path fillRule="evenodd" d={d} />
  </svg>
);
const D = {
  ticket:   "M1.5 3.5A1.5 1.5 0 0 1 3 2h9.982a1.5 1.5 0 0 1 1.498 1.5v2.5a.5.5 0 0 1-.5.5 1 1 0 0 0 0 2 .5.5 0 0 1 .5.5v2.5A1.5 1.5 0 0 1 12.982 13H3A1.5 1.5 0 0 1 1.5 11.5V8a.5.5 0 0 1 .5-.5 1 1 0 1 0 0-2 .5.5 0 0 1-.5-.5V3.5z",
  bell:     "M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z",
  logout:   "M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2zM15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z",
  escalate: "M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z",
  cancel:   "M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z",
  check:    "M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z",
  warning:  "M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z",
  trash:    "M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6zM14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z",
  back:     "M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z",
  devapp:   "M1.5 3.5A1.5 1.5 0 0 1 3 2h9.982a1.5 1.5 0 0 1 1.498 1.5v2.5a.5.5 0 0 1-.5.5 1 1 0 0 0 0 2 .5.5 0 0 1 .5.5v2.5A1.5 1.5 0 0 1 12.982 13H3A1.5 1.5 0 0 1 1.5 11.5V8a.5.5 0 0 1 .5-.5 1 1 0 1 0 0-2 .5.5 0 0 1-.5-.5V3.5z",
  team:     "M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275zM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
};

const PrioBadge = ({ p }) => {
  const m = { low:["Faible","prio-low"], medium:["Moyen","prio-medium"], high:["Haute","prio-high"], critical:["Critique","prio-critical"] };
  const [label, cls] = m[p] || ["—","prio-medium"];
  return <span className={`prio-badge ${cls}`}>{label}</span>;
};

const TypeBadge = ({ t }) => {
  const m = { bug:["Bug","type-bug"], feature:["Feature","type-feat"], consultancy:["Consultancy","type-cons"] };
  const [label, cls] = m[t] || [t,"type-badge"];
  return <span className={`type-badge ${cls}`}>{label}</span>;
};

const STEPS = [
  { key:"ready_for_support",  label:"À faire",          next:"in_progress" },
  { key:"in_progress",        label:"En cours",         next:"ready_for_customer" },
  { key:"ready_for_customer", label:"Solution envoyée", next:null },
  { key:"solved",             label:"Résolu",           next:null },
];
const IDX = { ready_for_support:0, in_progress:1, ready_for_customer:2, solved:3, closed:3, escalated:-1, cancelled:-1 };

const COLS = [
  { statut:"ready_for_support",  label:"À faire",     cls:"col-todo" },
  { statut:"in_progress",        label:"En cours",    cls:"col-prog" },
  { statut:"ready_for_customer", label:"À confirmer", cls:"col-confirm" },
  { statut:"escalated",          label:"Escaladé",    cls:"col-esc" },
  { statut:"solved",             label:"Résolu",      cls:"col-done" },
];

const initials = (p, n) => `${p?.[0]||""}${n?.[0]||""}`.toUpperCase();
const ticketRef = (id) => id ? `#${id.slice(-5).toUpperCase()}` : "";
const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });

// ─────────────────────────────────────────────────────────────
// PAGE : MES TICKETS (tickets assignés à moi uniquement)
// ─────────────────────────────────────────────────────────────
function MesTicketsPage({ user, token, navigate, activePage, setActivePage }) {
  const [tickets, setTickets]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [comment, setComment]       = useState("");
  const [temps, setTemps]           = useState("");
  const [msg, setMsg]               = useState("");
  const [err, setErr]               = useState("");
  const [notifs, setNotifs]         = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [workflow, setWorkflow]     = useState(null);
  const [filtre, setFiltre]         = useState("tous");
  const [showEsc, setShowEsc]       = useState(false);
  const [escRaison, setEscRaison]   = useState("");
  const [escUrgence, setEscUrgence] = useState("normal");
  const [escErr, setEscErr]         = useState("");
  const [lightbox, setLightbox]     = useState(null);

  useEffect(() => {
    load(); fetchNotifCount(); fetchWorkflow();
    const iv = setInterval(() => { load(); fetchNotifCount(); fetchWorkflow(); }, 15000);
    return () => clearInterval(iv);
  }, []);

  const load = () => {
    setLoading(true);
    fetch(`${API}/tickets/assignes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setTickets(d.tickets); }).finally(() => setLoading(false));
  };
  const fetchWorkflow = () =>
    fetch(`${API}/workflow`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setWorkflow(d.workflow); }).catch(() => {});
  const fetchNotifCount = () =>
    fetch(`${API}/notifications/non-lues`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setNotifCount(d.count); }).catch(() => {});
  const fetchNotifs = () =>
    fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setNotifs(d.notifications); }).catch(() => {});
  const toggleNotifs = () => {
    if (!showNotifs) {
      fetchNotifs();
      fetch(`${API}/notifications/lire-tout`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } })
        .then(() => setNotifCount(0)).catch(() => {});
    }
    setShowNotifs(!showNotifs);
  };
  const loadDetail = (id) =>
    fetch(`${API}/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setSelected(d.ticket); });

  const checkWF = (de, vers) => {
    if (!workflow) return null;
    const t = workflow.transitions.find(t => t.de === de && t.vers === vers);
    if (!t) return null;
    if (!t.active) return "Cette transition est désactivée par l'administrateur.";
    if (!t.rolesAutorises.includes("support")) return "Vous n'êtes pas autorisé à effectuer cette transition.";
    return null;
  };

  const changeStatut = async (ticketId, statut) => {
    setMsg(""); setErr("");
    const e = checkWF(selected.statut, statut);
    if (e) { setErr(e); return; }
    const res = await fetch(`${API}/tickets/${ticketId}/statut`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ statut }),
    });
    const data = await res.json();
    if (data.status === "ok") {
      let msgNotif = null;
      if (statut === "in_progress") {
        msgNotif = "Votre ticket est maintenant en cours de traitement par notre équipe support.";
      } else if (statut === "ready_for_customer") {
        msgNotif = "Une solution a été envoyée pour votre ticket. Merci de vérifier et confirmer la résolution.";
      }
      if (msgNotif) {
        fetch(`${API}/tickets/${ticketId}/notifier-client`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: msgNotif, statut }),
        }).catch(() => {});
      }
      const labelMap = {
        in_progress: "Ticket passé En cours — client notifié.",
        ready_for_customer: "Solution envoyée — client notifié.",
        cancelled: "Ticket annulé.",
      };
      setMsg(labelMap[statut] || "Statut mis à jour.");
      load(); loadDetail(ticketId);
      setTimeout(() => setMsg(""), 3000);
    } else {
      setErr(data.msg);
    }
  };

  const stepClick = (step, idx) => {
    if (!selected) return;
    if (selected.statut === "ready_for_support" && idx === 1)
      changeStatut(selected._id, "in_progress");
    else if (selected.statut === "in_progress" && idx === 2)
      changeStatut(selected._id, "ready_for_customer");
  };

  const confirmEsc = async () => {
    setEscErr("");
    if (!escRaison.trim()) { setEscErr("La raison est obligatoire."); return; }
    const res = await fetch(`${API}/tickets/${selected._id}/escalader`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ raison: escRaison, urgence: escUrgence }),
    });
    const data = await res.json();
    if (data.status === "ok") {
      setShowEsc(false); setMsg("Ticket escaladé au chef d'équipe.");
      load(); loadDetail(selected._id); setTimeout(() => setMsg(""), 3000);
    } else setEscErr(data.msg);
  };

  const addComment = async (id) => {
    if (!comment.trim()) return;
    const res = await fetch(`${API}/tickets/${id}/commentaires`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ contenu: comment }),
    });
    const d = await res.json();
    if (d.status === "ok") { setComment(""); loadDetail(id); load(); }
  };

  const delComment = async (ticketId, cId) => {
    if (!window.confirm("Supprimer ce commentaire ?")) return;
    const res = await fetch(`${API}/tickets/${ticketId}/commentaires/${cId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    if (d.status === "ok") loadDetail(ticketId);
  };

  const saveTime = async (id) => {
    if (!temps || isNaN(temps) || temps <= 0) { setErr("Entrez un nombre de minutes valide."); return; }
    const res = await fetch(`${API}/tickets/${id}/temps`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ temps: parseInt(temps) }),
    });
    const d = await res.json();
    if (d.status === "ok") { setMsg("Temps enregistré."); setTemps(""); loadDetail(id); setTimeout(() => setMsg(""), 2000); }
  };

  const stats = {
    total: tickets.length,
    prog:  tickets.filter(t => t.statut === "in_progress").length,
    wait:  tickets.filter(t => t.statut === "ready_for_support").length,
    done:  tickets.filter(t => ["solved","closed"].includes(t.statut)).length,
  };

  const cols = filtre === "tous" ? COLS
    : filtre === "in_progress"       ? COLS.filter(c => c.statut === "in_progress")
    : filtre === "ready_for_support" ? COLS.filter(c => c.statut === "ready_for_support")
    : filtre === "resolus"           ? COLS.filter(c => c.statut === "solved")
    : COLS;

  const lastUpdate = () => { const n = new Date(); return `${n.getHours()}h${String(n.getMinutes()).padStart(2,"0")}`; };

  return (
    <>
      {/* LIGHTBOX */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
          {lightbox.type === "image"
            ? <img src={lightbox.src} alt="preview" className="lightbox-img" onClick={e => e.stopPropagation()} />
            : <video src={lightbox.src} controls autoPlay className="lightbox-video" onClick={e => e.stopPropagation()} />
          }
        </div>
      )}

      {/* MODAL ESCALADE */}
      {showEsc && selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowEsc(false)}>
          <div className="modal-box">
            <p className="modal-title">Escalader le ticket</p>
            <p className="modal-subtitle">Le chef d'équipe sera notifié immédiatement.</p>
            <div className="escalade-ticket-box">
              <p className="escalade-ticket-label">Ticket concerné</p>
              <p className="escalade-ticket-titre">{selected.titre}</p>
            </div>
            {escErr && <div className="alert alert-error" style={{ marginBottom: 12 }}>{escErr}</div>}
            <div className="form-group">
              <label>Raison <span className="req">*</span></label>
              <textarea className="form-textarea" rows={4} placeholder="Décrivez pourquoi vous escaladez ce ticket..."
                value={escRaison} onChange={e => setEscRaison(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Niveau d'urgence</label>
              <div className="urgence-grid">
                {["normal","urgent","critique"].map(u => (
                  <button key={u} type="button"
                    className={`urgence-btn urgence-${u} ${escUrgence === u ? "urgence-active" : ""}`}
                    onClick={() => setEscUrgence(u)}>
                    {u === "normal" ? "Normal" : u === "urgent" ? "Urgent" : "Critique"}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowEsc(false)}>Annuler</button>
              <button className="btn-escalade-confirm" onClick={confirmEsc}>Escalader</button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-title">Mes tickets</div>
          <div className="page-header-subtitle">{stats.total} tickets assignés · Actualisé à {lastUpdate()}</div>
        </div>
        <div className="page-header-right">
          <div className="notif-wrapper">
            <button className="notif-btn" onClick={toggleNotifs}>
              <Ico d={D.bell} size={13} /> Notifications
              {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
            </button>
            {showNotifs && (
              <div className="notif-dropdown">
                <p className="notif-header">Notifications</p>
                {notifs.length === 0
                  ? <p className="notif-empty">Aucune notification</p>
                  : notifs.map(n => (
                    <div key={n._id} className={`notif-item ${n.lu ? "" : "notif-unread"}`}
                      onClick={() => { setShowNotifs(false); if (n.ticket) loadDetail(n.ticket._id); }}>
                      <p className="notif-msg">{n.message}</p>
                      <p className="notif-date">{fmtDate(n.createdAt)}</p>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sp-content">
        {/* STATS */}
        <div className="stats-grid">
          {[
            { label:"Total",      val:stats.total, key:"tous",              cls:"stat-total" },
            { label:"En cours",   val:stats.prog,  key:"in_progress",       cls:"stat-progress" },
            { label:"En attente", val:stats.wait,  key:"ready_for_support", cls:"stat-waiting" },
            { label:"Résolus",    val:stats.done,  key:"resolus",           cls:"stat-solved" },
          ].map(s => (
            <div key={s.key} className={`stat-card ${s.cls} ${filtre === s.key ? "stat-active" : ""}`}
              onClick={() => { setFiltre(s.key); setSelected(null); }}>
              <span className="stat-number">{s.val}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* KANBAN */}
        {!selected && (
          <div className="kanban-wrapper">
            {loading ? <div className="loading">Chargement...</div> : (
              <div className="kanban-board">
                {cols.map(col => {
                  const ct = tickets.filter(t => t.statut === col.statut);
                  return (
                    <div key={col.statut} className={`kanban-col ${col.cls}`}>
                      <div className="kanban-col-header">
                        <span className="kanban-col-title">{col.label}</span>
                        <span className="kanban-col-count">{ct.length}</span>
                      </div>
                      <div className="kanban-col-body">
                        {ct.length === 0
                          ? <div className="kanban-empty">Aucun ticket</div>
                          : ct.map(t => (
                            <div key={t._id} className="kanban-card"
                              onClick={() => { setSelected(t); loadDetail(t._id); setMsg(""); setErr(""); }}>
                              <div className="kanban-card-top">
                                <span className="kanban-card-id">{ticketRef(t._id)}</span>
                                <PrioBadge p={t.priorite} />
                              </div>
                              <p className="kanban-card-titre">{t.titre}</p>
                              <div className="kanban-card-tags">
                                <TypeBadge t={t.type} />
                                {t.fichiers?.length > 0 && (
                                  <span className="kanban-card-attachment">📎 {t.fichiers.length}</span>
                                )}
                              </div>
                              <div className="kanban-card-footer">
                                <span className="kanban-card-date">{fmtDate(t.createdAt)}</span>
                                <div className="kanban-card-avatar" title={`${t.reporter?.prenom} ${t.reporter?.nom}`}>
                                  {initials(t.reporter?.prenom, t.reporter?.nom)}
                                </div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* DETAIL */}
        {selected && (
          <div className="sp-card">
            <button className="btn-back" onClick={() => { setSelected(null); setMsg(""); setErr(""); }}>
              <Ico d={D.back} size={12} /> Retour au tableau
            </button>

            <div className="ticket-pro-header">
              <div className={`ticket-status-dot ${["solved","closed"].includes(selected.statut) ? "status-done" : selected.statut === "escalated" ? "status-escalated" : ""}`}>
                {["solved","closed"].includes(selected.statut) && <Ico d={D.check} size={8} />}
              </div>
              <div className="ticket-pro-info">
                <h2 className="ticket-pro-titre">{selected.titre}</h2>
                <div className="ticket-pro-meta">
                  <span className="ticket-meta-chip" style={{ fontFamily:"monospace", fontSize:11 }}>{ticketRef(selected._id)}</span>
                  <span className="ticket-meta-sep">·</span>
                  <TypeBadge t={selected.type} />
                  <span className="ticket-meta-sep">·</span>
                  <PrioBadge p={selected.priorite} />
                  <span className="ticket-meta-sep">·</span>
                  <span className="ticket-meta-chip">{selected.reporter?.prenom} {selected.reporter?.nom}</span>
                  <span className="ticket-meta-sep">·</span>
                  <span className="ticket-meta-chip">{fmtDate(selected.createdAt)}</span>
                  {selected.tempsPassé > 0 && (
                    <><span className="ticket-meta-sep">·</span><span className="ticket-meta-chip">{selected.tempsPassé} min</span></>
                  )}
                </div>
              </div>
              {!["solved","closed","cancelled"].includes(selected.statut) && (
                <div className="ticket-icon-actions">
                  <button className="icon-action-btn icon-escalade" title="Escalader le ticket"
                    onClick={() => { setEscRaison(""); setEscUrgence("normal"); setEscErr(""); setShowEsc(true); }}>
                    <Ico d={D.escalate} size={12} />
                  </button>
                  <button className="icon-action-btn icon-cancel" title="Annuler le ticket"
                    onClick={() => { if (window.confirm("Annuler ce ticket ?")) changeStatut(selected._id, "cancelled"); }}>
                    <Ico d={D.cancel} size={12} />
                  </button>
                </div>
              )}
            </div>

            {msg && <div className="alert alert-success">{msg}</div>}
            {err && <div className="alert alert-error">{err}</div>}

            <div className="ticket-detail-body">
              <p className="ticket-description">{selected.description}</p>
            </div>

            {selected.fichiers?.length > 0 && (
              <div className="ticket-fichiers-section">
                <p className="ticket-fichiers-title">📎 Pièces jointes ({selected.fichiers.length})</p>
                <div className="ticket-fichiers-grid">
                  {selected.fichiers.map((f, i) => (
                    <div key={i} className="ticket-fichier-item"
                      onClick={() => setLightbox({ src: `http://localhost:3001${f.chemin}`, type: f.type })}>
                      {f.type === "image" ? (
                        <img src={`http://localhost:3001${f.chemin}`} alt={f.nom} className="fichier-thumb" />
                      ) : (
                        <div className="fichier-video-thumb">
                          <video src={`http://localhost:3001${f.chemin}`} className="fichier-thumb" />
                          <div className="fichier-video-overlay">▶</div>
                        </div>
                      )}
                      <p className="fichier-name">{f.nom}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.statut !== "cancelled" && (
              <div className="mini-kanban-section">
                <p className="mini-kanban-title">Progression</p>
                <div className="mini-kanban-steps">
                  {STEPS.map((step, i) => {
                    const cur = IDX[selected.statut] ?? -1;
                    const done = i <= cur;
                    const esc  = selected.statut === "escalated";
                    const canClick =
                      (selected.statut === "ready_for_support" && i === 1) ||
                      (selected.statut === "in_progress" && i === 2);
                    return (
                      <React.Fragment key={step.key}>
                        <div className="mini-kanban-step">
                          <div
                            className={`step-circle ${done ? "step-done" : esc ? "step-escalated" : "step-pending"} ${canClick ? "step-clickable" : ""}`}
                            onClick={() => canClick && stepClick(step, i)}
                            title={canClick ? `Cliquer pour passer à "${step.label}"` : step.label}
                          >
                            {done ? <Ico d={D.check} size={10} /> : i + 1}
                          </div>
                          <p className={`step-label ${done ? "step-label-done" : ""}`}>{step.label}</p>
                          {canClick && <span className="step-hint">Cliquer</span>}
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`step-line ${done && i < cur ? "step-line-done" : "step-line-pending"}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                {selected.statut === "escalated" && (
                  <div className="escalated-banner">
                    <Ico d={D.warning} size={13} />
                    <p>Ticket escaladé au chef d'équipe — en attente de prise en charge.</p>
                  </div>
                )}
              </div>
            )}

            {!["solved","closed","cancelled"].includes(selected.statut) && (
              <div className="temps-section">
                <h3>Temps passé</h3>
                <div className="temps-input">
                  <input type="number" placeholder="Minutes" value={temps} onChange={e => setTemps(e.target.value)} className="form-input" min="1" />
                  <button className="btn-temps" onClick={() => saveTime(selected._id)}>Enregistrer</button>
                </div>
              </div>
            )}

            <div className="commentaires-section">
              <h3>Commentaires ({selected.commentaires?.length || 0})</h3>
              <div className="commentaires-list">
                {selected.commentaires?.length === 0 && <p className="no-comment">Aucun commentaire pour le moment.</p>}
                {selected.commentaires?.map(c => (
                  <div key={c._id} className="commentaire-item">
                    <div className={`comment-avatar ${c.auteur?.role === "client" ? "avatar-client" : "avatar-support"}`}>
                      {c.auteur?.prenom?.[0]}{c.auteur?.nom?.[0]}
                    </div>
                    <div className="comment-body">
                      <div className="comment-header">
                        <span className="comment-author">
                          {c.auteur?.prenom} {c.auteur?.nom}
                          <span className="comment-role"> · {c.auteur?.role === "client" ? "Client" : "Support"}</span>
                        </span>
                        {c.auteur?.role === "support" && (
                          <button className="btn-delete-comment" onClick={() => delComment(selected._id, c._id)} title="Supprimer">
                            <Ico d={D.trash} size={11} />
                          </button>
                        )}
                      </div>
                      <p className="comment-text">{c.contenu}</p>
                      <p className="comment-date">{fmtDate(c.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {!["closed","cancelled"].includes(selected.statut) && (
                <div className="add-comment">
                  <textarea placeholder="Laisser un commentaire..." value={comment} onChange={e => setComment(e.target.value)} className="form-textarea" rows={3} />
                  <button className="btn-primary" onClick={() => addComment(selected._id)}>Commenter</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : TICKETS D'ÉQUIPE (tous les tickets de l'équipe)
// Philosophie Jira : le travail appartient à l'équipe,
// n'importe qui peut prendre le relai
// ─────────────────────────────────────────────────────────────
function TicketsEquipePage({ user, token, navigate }) {
  const [tickets, setTickets]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [comment, setComment]       = useState("");
  const [temps, setTemps]           = useState("");
  const [msg, setMsg]               = useState("");
  const [err, setErr]               = useState("");
  const [notifs, setNotifs]         = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [workflow, setWorkflow]     = useState(null);
  const [filtre, setFiltre]         = useState("tous");
  const [showEsc, setShowEsc]       = useState(false);
  const [escRaison, setEscRaison]   = useState("");
  const [escUrgence, setEscUrgence] = useState("normal");
  const [escErr, setEscErr]         = useState("");
  const [lightbox, setLightbox]     = useState(null);

  useEffect(() => {
    load(); fetchNotifCount(); fetchWorkflow();
    const iv = setInterval(() => { load(); fetchNotifCount(); fetchWorkflow(); }, 15000);
    return () => clearInterval(iv);
  }, []);

  // Charge TOUS les tickets de l'équipe (pas seulement les miens)
  const load = () => {
    setLoading(true);
    fetch(`${API}/tickets/equipe`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setTickets(d.tickets); }).finally(() => setLoading(false));
  };
  const fetchWorkflow = () =>
    fetch(`${API}/workflow`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setWorkflow(d.workflow); }).catch(() => {});
  const fetchNotifCount = () =>
    fetch(`${API}/notifications/non-lues`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setNotifCount(d.count); }).catch(() => {});
  const fetchNotifs = () =>
    fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setNotifs(d.notifications); }).catch(() => {});
  const toggleNotifs = () => {
    if (!showNotifs) {
      fetchNotifs();
      fetch(`${API}/notifications/lire-tout`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } })
        .then(() => setNotifCount(0)).catch(() => {});
    }
    setShowNotifs(!showNotifs);
  };
  const loadDetail = (id) =>
    fetch(`${API}/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setSelected(d.ticket); });

  const checkWF = (de, vers) => {
    if (!workflow) return null;
    const t = workflow.transitions.find(t => t.de === de && t.vers === vers);
    if (!t) return null;
    if (!t.active) return "Cette transition est désactivée par l'administrateur.";
    if (!t.rolesAutorises.includes("support")) return "Vous n'êtes pas autorisé à effectuer cette transition.";
    return null;
  };

  const changeStatut = async (ticketId, statut) => {
    setMsg(""); setErr("");
    const e = checkWF(selected.statut, statut);
    if (e) { setErr(e); return; }
    const res = await fetch(`${API}/tickets/${ticketId}/statut`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ statut }),
    });
    const data = await res.json();
    if (data.status === "ok") { setMsg("Statut mis à jour."); load(); loadDetail(ticketId); setTimeout(() => setMsg(""), 2000); }
    else setErr(data.msg);
  };

  // ✅ Prendre en charge un ticket (auto-assignation Jira-style)
  const prendreTicket = async (ticketId) => {
    setMsg(""); setErr("");
    const res = await fetch(`${API}/tickets/${ticketId}/prendre`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.status === "ok") {
      setMsg("Ticket pris en charge !");
      load(); loadDetail(ticketId);
      setTimeout(() => setMsg(""), 3000);
    } else setErr(data.msg);
  };

  const stepClick = (step, idx) => {
    if (!selected) return;
    if (selected.statut === "ready_for_support" && idx === 1)
      changeStatut(selected._id, "in_progress");
    else if (selected.statut === "in_progress" && idx === 2)
      changeStatut(selected._id, "ready_for_customer");
  };

  const confirmEsc = async () => {
    setEscErr("");
    if (!escRaison.trim()) { setEscErr("La raison est obligatoire."); return; }
    const res = await fetch(`${API}/tickets/${selected._id}/escalader`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ raison: escRaison, urgence: escUrgence }),
    });
    const data = await res.json();
    if (data.status === "ok") {
      setShowEsc(false); setMsg("Ticket escaladé au chef d'équipe.");
      load(); loadDetail(selected._id); setTimeout(() => setMsg(""), 3000);
    } else setEscErr(data.msg);
  };

  const addComment = async (id) => {
    if (!comment.trim()) return;
    const res = await fetch(`${API}/tickets/${id}/commentaires`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ contenu: comment }),
    });
    const d = await res.json();
    if (d.status === "ok") { setComment(""); loadDetail(id); load(); }
  };

  const delComment = async (ticketId, cId) => {
    if (!window.confirm("Supprimer ce commentaire ?")) return;
    const res = await fetch(`${API}/tickets/${ticketId}/commentaires/${cId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    if (d.status === "ok") loadDetail(ticketId);
  };

  const saveTime = async (id) => {
    if (!temps || isNaN(temps) || temps <= 0) { setErr("Entrez un nombre de minutes valide."); return; }
    const res = await fetch(`${API}/tickets/${id}/temps`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ temps: parseInt(temps) }),
    });
    const d = await res.json();
    if (d.status === "ok") { setMsg("Temps enregistré."); setTemps(""); loadDetail(id); setTimeout(() => setMsg(""), 2000); }
  };

  // Stats équipe
  const stats = {
    total:      tickets.length,
    nonAssigns: tickets.filter(t => !t.assignee).length,
    prog:       tickets.filter(t => t.statut === "in_progress").length,
    done:       tickets.filter(t => ["solved","closed"].includes(t.statut)).length,
  };

  const cols = filtre === "tous" ? COLS
    : filtre === "in_progress"       ? COLS.filter(c => c.statut === "in_progress")
    : filtre === "ready_for_support" ? COLS.filter(c => c.statut === "ready_for_support")
    : filtre === "resolus"           ? COLS.filter(c => c.statut === "solved")
    : COLS;

  const lastUpdate = () => { const n = new Date(); return `${n.getHours()}h${String(n.getMinutes()).padStart(2,"0")}`; };

  // Est-ce que l'agent connecté est l'assignee du ticket sélectionné ?
  const isMine = selected && (selected.assignee?._id === user._id || selected.assignee === user._id);

  return (
    <>
      {/* LIGHTBOX */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
          {lightbox.type === "image"
            ? <img src={lightbox.src} alt="preview" className="lightbox-img" onClick={e => e.stopPropagation()} />
            : <video src={lightbox.src} controls autoPlay className="lightbox-video" onClick={e => e.stopPropagation()} />
          }
        </div>
      )}

      {/* MODAL ESCALADE */}
      {showEsc && selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowEsc(false)}>
          <div className="modal-box">
            <p className="modal-title">Escalader le ticket</p>
            <p className="modal-subtitle">Le chef d'équipe sera notifié immédiatement.</p>
            <div className="escalade-ticket-box">
              <p className="escalade-ticket-label">Ticket concerné</p>
              <p className="escalade-ticket-titre">{selected.titre}</p>
            </div>
            {escErr && <div className="alert alert-error" style={{ marginBottom: 12 }}>{escErr}</div>}
            <div className="form-group">
              <label>Raison <span className="req">*</span></label>
              <textarea className="form-textarea" rows={4} placeholder="Décrivez pourquoi vous escaladez ce ticket..."
                value={escRaison} onChange={e => setEscRaison(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Niveau d'urgence</label>
              <div className="urgence-grid">
                {["normal","urgent","critique"].map(u => (
                  <button key={u} type="button"
                    className={`urgence-btn urgence-${u} ${escUrgence === u ? "urgence-active" : ""}`}
                    onClick={() => setEscUrgence(u)}>
                    {u === "normal" ? "Normal" : u === "urgent" ? "Urgent" : "Critique"}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowEsc(false)}>Annuler</button>
              <button className="btn-escalade-confirm" onClick={confirmEsc}>Escalader</button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-title">Tickets de l'équipe</div>
          <div className="page-header-subtitle">{stats.total} tickets au total · Actualisé à {lastUpdate()}</div>
        </div>
        <div className="page-header-right">
          <div className="notif-wrapper">
            <button className="notif-btn" onClick={toggleNotifs}>
              <Ico d={D.bell} size={13} /> Notifications
              {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
            </button>
            {showNotifs && (
              <div className="notif-dropdown">
                <p className="notif-header">Notifications</p>
                {notifs.length === 0
                  ? <p className="notif-empty">Aucune notification</p>
                  : notifs.map(n => (
                    <div key={n._id} className={`notif-item ${n.lu ? "" : "notif-unread"}`}
                      onClick={() => { setShowNotifs(false); if (n.ticket) loadDetail(n.ticket._id); }}>
                      <p className="notif-msg">{n.message}</p>
                      <p className="notif-date">{fmtDate(n.createdAt)}</p>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sp-content">
        {/* STATS ÉQUIPE */}
        <div className="stats-grid">
          {[
            { label:"Total équipe",   val:stats.total,      key:"tous",              cls:"stat-total" },
            { label:"Non assignés",   val:stats.nonAssigns, key:"ready_for_support", cls:"stat-waiting" },
            { label:"En cours",       val:stats.prog,       key:"in_progress",       cls:"stat-progress" },
            { label:"Résolus",        val:stats.done,       key:"resolus",           cls:"stat-solved" },
          ].map(s => (
            <div key={s.key} className={`stat-card ${s.cls} ${filtre === s.key ? "stat-active" : ""}`}
              onClick={() => { setFiltre(s.key); setSelected(null); }}>
              <span className="stat-number">{s.val}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* KANBAN ÉQUIPE */}
        {!selected && (
          <div className="kanban-wrapper">
            {loading ? <div className="loading">Chargement...</div> : (
              <div className="kanban-board">
                {cols.map(col => {
                  const ct = tickets.filter(t => t.statut === col.statut);
                  return (
                    <div key={col.statut} className={`kanban-col ${col.cls}`}>
                      <div className="kanban-col-header">
                        <span className="kanban-col-title">{col.label}</span>
                        <span className="kanban-col-count">{ct.length}</span>
                      </div>
                      <div className="kanban-col-body">
                        {ct.length === 0
                          ? <div className="kanban-empty">Aucun ticket</div>
                          : ct.map(t => {
                            const isMyTicket = t.assignee?._id === user._id || t.assignee === user._id;
                            return (
                              <div key={t._id} className="kanban-card"
                                onClick={() => { setSelected(t); loadDetail(t._id); setMsg(""); setErr(""); }}>
                                <div className="kanban-card-top">
                                  <span className="kanban-card-id">{ticketRef(t._id)}</span>
                                  <PrioBadge p={t.priorite} />
                                </div>
                                <p className="kanban-card-titre">{t.titre}</p>
                                <div className="kanban-card-tags">
                                  <TypeBadge t={t.type} />
                                  {t.fichiers?.length > 0 && (
                                    <span className="kanban-card-attachment">📎 {t.fichiers.length}</span>
                                  )}
                                </div>
                                <div className="kanban-card-footer">
                                  <span className="kanban-card-date">{fmtDate(t.createdAt)}</span>
                                  {t.assignee ? (
                                    <div
                                      className="kanban-card-avatar"
                                      style={{ background: isMyTicket ? "#2563eb" : "#7c3aed" }}
                                      title={`${t.assignee.prenom} ${t.assignee.nom}${isMyTicket ? " (moi)" : ""}`}>
                                      {initials(t.assignee.prenom, t.assignee.nom)}
                                    </div>
                                  ) : (
                                    <span style={{ fontSize:10, color:"#b91c1c", background:"#fef2f2", padding:"1px 6px", borderRadius:4, border:"1px solid #fecaca" }}>
                                      Non assigné
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* DETAIL */}
        {selected && (
          <div className="sp-card">
            <button className="btn-back" onClick={() => { setSelected(null); setMsg(""); setErr(""); }}>
              <Ico d={D.back} size={12} /> Retour au tableau
            </button>

            <div className="ticket-pro-header">
              <div className={`ticket-status-dot ${["solved","closed"].includes(selected.statut) ? "status-done" : selected.statut === "escalated" ? "status-escalated" : ""}`}>
                {["solved","closed"].includes(selected.statut) && <Ico d={D.check} size={8} />}
              </div>
              <div className="ticket-pro-info">
                <h2 className="ticket-pro-titre">{selected.titre}</h2>
                <div className="ticket-pro-meta">
                  <span className="ticket-meta-chip" style={{ fontFamily:"monospace", fontSize:11 }}>{ticketRef(selected._id)}</span>
                  <span className="ticket-meta-sep">·</span>
                  <TypeBadge t={selected.type} />
                  <span className="ticket-meta-sep">·</span>
                  <PrioBadge p={selected.priorite} />
                  <span className="ticket-meta-sep">·</span>
                  <span className="ticket-meta-chip">{selected.reporter?.prenom} {selected.reporter?.nom}</span>
                  <span className="ticket-meta-sep">·</span>
                  <span className="ticket-meta-chip">{fmtDate(selected.createdAt)}</span>
                  {selected.tempsPassé > 0 && (
                    <><span className="ticket-meta-sep">·</span><span className="ticket-meta-chip">{selected.tempsPassé} min</span></>
                  )}
                </div>
                {/* Assignee actuel */}
                <div style={{ marginTop: 6 }}>
                  {selected.assignee ? (
                    <span style={{ display:"inline-flex", alignItems:"center", gap:6, background: isMine ? "#eff6ff" : "#f5f3ff", color: isMine ? "#1d4ed8" : "#6d28d9", padding:"3px 10px", borderRadius:20, border:`1px solid ${isMine ? "#bfdbfe" : "#ddd6fe"}`, fontSize:12 }}>
                      👤 {isMine ? "Assigné à moi" : `Assigné à ${selected.assignee.prenom} ${selected.assignee.nom}`}
                    </span>
                  ) : (
                    <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#fef2f2", color:"#b91c1c", padding:"3px 10px", borderRadius:20, border:"1px solid #fecaca", fontSize:12 }}>
                      ⚠️ Non assigné
                    </span>
                  )}
                </div>
              </div>
              {!["solved","closed","cancelled"].includes(selected.statut) && (
                <div className="ticket-icon-actions">
                  <button className="icon-action-btn icon-escalade" title="Escalader"
                    onClick={() => { setEscRaison(""); setEscUrgence("normal"); setEscErr(""); setShowEsc(true); }}>
                    <Ico d={D.escalate} size={12} />
                  </button>
                  <button className="icon-action-btn icon-cancel" title="Annuler le ticket"
                    onClick={() => { if (window.confirm("Annuler ce ticket ?")) changeStatut(selected._id, "cancelled"); }}>
                    <Ico d={D.cancel} size={12} />
                  </button>
                </div>
              )}
            </div>

            {msg && <div className="alert alert-success">{msg}</div>}
            {err && <div className="alert alert-error">{err}</div>}

            {/* ✅ BANNIÈRE PRENDRE EN CHARGE (Jira-style) */}
            {!["solved","closed","cancelled"].includes(selected.statut) && !isMine && (
              <div style={{ marginBottom:16, padding:"12px 16px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, color:"#15803d" }}>
                  {selected.assignee
                    ? `Ce ticket est assigné à ${selected.assignee.prenom} ${selected.assignee.nom}. Vous pouvez le prendre en charge.`
                    : "Ce ticket n'est pas encore assigné. Vous pouvez le prendre en charge."
                  }
                </span>
                <button
                  onClick={() => prendreTicket(selected._id)}
                  style={{ padding:"8px 16px", background:"#16a34a", color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", marginLeft:12 }}>
                  ✋ Prendre en charge
                </button>
              </div>
            )}

            <div className="ticket-detail-body">
              <p className="ticket-description">{selected.description}</p>
            </div>

            {selected.fichiers?.length > 0 && (
              <div className="ticket-fichiers-section">
                <p className="ticket-fichiers-title">📎 Pièces jointes ({selected.fichiers.length})</p>
                <div className="ticket-fichiers-grid">
                  {selected.fichiers.map((f, i) => (
                    <div key={i} className="ticket-fichier-item"
                      onClick={() => setLightbox({ src: `http://localhost:3001${f.chemin}`, type: f.type })}>
                      {f.type === "image" ? (
                        <img src={`http://localhost:3001${f.chemin}`} alt={f.nom} className="fichier-thumb" />
                      ) : (
                        <div className="fichier-video-thumb">
                          <video src={`http://localhost:3001${f.chemin}`} className="fichier-thumb" />
                          <div className="fichier-video-overlay">▶</div>
                        </div>
                      )}
                      <p className="fichier-name">{f.nom}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.statut !== "cancelled" && (
              <div className="mini-kanban-section">
                <p className="mini-kanban-title">Progression</p>
                <div className="mini-kanban-steps">
                  {STEPS.map((step, i) => {
                    const cur = IDX[selected.statut] ?? -1;
                    const done = i < cur;
                    const active = i === cur;
                    const esc = selected.statut === "escalated";
                    const canClick =
                      (selected.statut === "ready_for_support" && i === 1) ||
                      (selected.statut === "in_progress" && i === 2);
                    return (
                      <React.Fragment key={step.key}>
                        <div className="mini-kanban-step">
                          <div
                            className={`step-circle ${done ? "step-done" : active ? "step-active" : esc ? "step-escalated" : "step-pending"} ${canClick ? "step-clickable" : ""}`}
                            onClick={() => canClick && stepClick(step, i)}
                            title={canClick ? `Passer à "${step.label}"` : step.label}
                          >
                            {done ? <Ico d={D.check} size={10} /> : i + 1}
                          </div>
                          <p className={`step-label ${done ? "step-label-done" : active ? "step-label-active" : ""}`}>{step.label}</p>
                          {canClick && <span className="step-hint">Cliquer</span>}
                        </div>
                        {i < STEPS.length - 1 && <div className={`step-line ${done ? "step-line-done" : "step-line-pending"}`} />}
                      </React.Fragment>
                    );
                  })}
                </div>
                {selected.statut === "escalated" && (
                  <div className="escalated-banner">
                    <Ico d={D.warning} size={13} />
                    <p>Ticket escaladé au chef d'équipe — en attente de prise en charge.</p>
                  </div>
                )}
              </div>
            )}

            {!["solved","closed","cancelled"].includes(selected.statut) && (
              <div className="temps-section">
                <h3>Temps passé</h3>
                <div className="temps-input">
                  <input type="number" placeholder="Minutes" value={temps} onChange={e => setTemps(e.target.value)} className="form-input" min="1" />
                  <button className="btn-temps" onClick={() => saveTime(selected._id)}>Enregistrer</button>
                </div>
              </div>
            )}

            <div className="commentaires-section">
              <h3>Commentaires ({selected.commentaires?.length || 0})</h3>
              <div className="commentaires-list">
                {selected.commentaires?.length === 0 && <p className="no-comment">Aucun commentaire pour le moment.</p>}
                {selected.commentaires?.map(c => (
                  <div key={c._id} className="commentaire-item">
                    <div className={`comment-avatar ${c.auteur?.role === "client" ? "avatar-client" : "avatar-support"}`}>
                      {c.auteur?.prenom?.[0]}{c.auteur?.nom?.[0]}
                    </div>
                    <div className="comment-body">
                      <div className="comment-header">
                        <span className="comment-author">
                          {c.auteur?.prenom} {c.auteur?.nom}
                          <span className="comment-role"> · {c.auteur?.role === "client" ? "Client" : "Support"}</span>
                        </span>
                        {c.auteur?.role === "support" && (
                          <button className="btn-delete-comment" onClick={() => delComment(selected._id, c._id)} title="Supprimer">
                            <Ico d={D.trash} size={11} />
                          </button>
                        )}
                      </div>
                      <p className="comment-text">{c.contenu}</p>
                      <p className="comment-date">{fmtDate(c.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {!["closed","cancelled"].includes(selected.statut) && (
                <div className="add-comment">
                  <textarea placeholder="Laisser un commentaire..." value={comment} onChange={e => setComment(e.target.value)} className="form-textarea" rows={3} />
                  <button className="btn-primary" onClick={() => addComment(selected._id)}>Commenter</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL — Gère la sidebar + navigation entre pages
// ─────────────────────────────────────────────────────────────
export default function SupportDashboard() {
  const navigate = useNavigate();
  const user = getUser(), token = getToken();

  // "mes-tickets" | "tickets-equipe"
  const [activePage, setActivePage] = useState("mes-tickets");

  // Compteurs sidebar (rechargés indépendamment)
  const [countMes,    setCountMes]    = useState(0);
  const [countEquipe, setCountEquipe] = useState(0);

  useEffect(() => {
    if (!token || !user || user.role !== "support") { navigate("/login-personnel"); return; }
    loadCounts();
    const iv = setInterval(loadCounts, 15000);
    return () => clearInterval(iv);
  }, []);

  const loadCounts = () => {
    // Mes tickets
    fetch(`${API}/tickets/assignes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setCountMes(d.tickets.length); }).catch(() => {});
    // Tickets équipe
    fetch(`${API}/tickets/equipe`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setCountEquipe(d.tickets.length); }).catch(() => {});
  };

  const logout = () => { localStorage.clear(); sessionStorage.clear(); navigate("/login-personnel"); };

  return (
    <div className="sp-layout">
      {/* SIDEBAR */}
      <aside className="sp-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><Ico d={D.devapp} size={14} /></div>
          <span className="sidebar-brand-name">DevApp</span>
        </div>
        <nav className="sidebar-nav">
          <span className="nav-section-label">Support</span>

          {/* Item 1 : Mes tickets */}
          <button
            className={`nav-item ${activePage === "mes-tickets" ? "active" : ""}`}
            onClick={() => setActivePage("mes-tickets")}>
            <Ico d={D.ticket} size={14} /> Mes tickets
            <span className="nav-badge">{countMes}</span>
          </button>

          {/* Item 2 : Tickets d'équipe */}
          <button
            className={`nav-item ${activePage === "tickets-equipe" ? "active" : ""}`}
            onClick={() => setActivePage("tickets-equipe")}>
            <Ico d={D.team} size={14} /> Tickets équipe
            <span className="nav-badge">{countEquipe}</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{user?.prenom?.[0]}{user?.nom?.[0]}</div>
            <div className="user-info">
              <span className="user-name">{user?.prenom} {user?.nom}</span>
              <span className="user-role">Agent support</span>
            </div>
            <button className="btn-logout" onClick={logout} title="Déconnexion">
              <Ico d={D.logout} size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN — affiche la page active */}
      <main className="sp-main">
        {activePage === "mes-tickets" && (
          <MesTicketsPage
            user={user} token={token} navigate={navigate}
            activePage={activePage} setActivePage={setActivePage}
          />
        )}
        {activePage === "tickets-equipe" && (
          <TicketsEquipePage
            user={user} token={token} navigate={navigate}
          />
        )}
      </main>
    </div>
  );
}