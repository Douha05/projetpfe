import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./ClientHome.css";

const API = "http://localhost:3001/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const getUser = () => {
  const u = localStorage.getItem("user") || sessionStorage.getItem("user");
  return u ? JSON.parse(u) : null;
};

const StatutBadge = ({ statut }) => {
  const map = {
    ready_for_support: { label: "En attente", color: "badge-waiting" },
    in_progress: { label: "En cours", color: "badge-progress" },
    ready_for_customer: { label: "À confirmer", color: "badge-validate" },
    solved: { label: "Résolu", color: "badge-solved" },
    closed: { label: "Fermé", color: "badge-closed" },
    cancelled: { label: "Annulé", color: "badge-cancelled" },
    escalated: { label: "Escaladé", color: "badge-escalated" },
  };
  const s = map[statut] || { label: statut, color: "badge-waiting" };
  return <span className={`badge ${s.color}`}>{s.label}</span>;
};

const PrioriteBadge = ({ priorite }) => {
  const map = {
    low: { label: "Faible", color: "prio-low" },
    medium: { label: "Moyen", color: "prio-medium" },
    high: { label: "Haute", color: "prio-high" },
    critical: { label: "Critique", color: "prio-critical" },
  };
  const p = map[priorite] || { label: priorite, color: "prio-medium" };
  return <span className={`prio-badge ${p.color}`}>{p.label}</span>;
};

const ClientHome = () => {
  const navigate = useNavigate();
  const user = getUser();
  const token = getToken();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("liste");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [commentaire, setCommentaire] = useState("");
  const [feedback, setFeedback] = useState({ note: 0, message: "" });
  const [serverMsg, setServerMsg] = useState("");
  const [serverError, setServerError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [form, setForm] = useState({ titre: "", description: "", type: "bug", priorite: "medium" });

  useEffect(() => {
    if (!token || !user) { navigate("/login"); return; }
    fetchTickets();
    fetchNotifCount();
    const interval = setInterval(fetchNotifCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTickets = () => {
    setLoading(true);
    fetch(`${API}/tickets/mes-tickets`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.status === "ok") setTickets(data.tickets); })
      .finally(() => setLoading(false));
  };

  const fetchNotifCount = () => {
    fetch(`${API}/notifications/non-lues`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.status === "ok") setNotifCount(data.count); });
  };

  const fetchNotifications = () => {
    fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.status === "ok") setNotifications(data.notifications); });
  };

  const fetchTicketDetail = (id) => {
    fetch(`${API}/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.status === "ok") setSelectedTicket(data.ticket); });
  };

  const handleToggleNotifs = () => {
    if (!showNotifs) {
      fetchNotifications();
      fetch(`${API}/notifications/lire-tout`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } })
        .then(() => setNotifCount(0));
    }
    setShowNotifs(!showNotifs);
  };

  const stats = {
    total: tickets.length,
    enAttente: tickets.filter((t) => t.statut === "ready_for_support").length,
    enCours: tickets.filter((t) => t.statut === "in_progress").length,
    resolus: tickets.filter((t) => ["solved", "closed"].includes(t.statut)).length,
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setServerError(""); setServerMsg("");
    if (!form.titre || !form.description) { setServerError("Titre et description sont obligatoires"); return; }
    try {
      const res = await fetch(`${API}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setServerMsg("✅ Ticket créé avec succès !");
        setForm({ titre: "", description: "", type: "bug", priorite: "medium" });
        fetchTickets();
        setTimeout(() => { setServerMsg(""); setActiveTab("liste"); }, 1500);
      } else { setServerError(data.msg); }
    } catch { setServerError("Erreur de connexion au serveur"); }
  };

  const handleAddCommentaire = async (ticketId) => {
    if (!commentaire.trim()) return;
    try {
      const res = await fetch(`${API}/tickets/${ticketId}/commentaires`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenu: commentaire }),
      });
      const data = await res.json();
      if (data.status === "ok") { setCommentaire(""); fetchTicketDetail(ticketId); fetchTickets(); }
    } catch {}
  };

  const handleConfirmerSolution = async (ticketId) => {
    if (!window.confirm("Confirmez-vous que le problème est résolu ?")) return;
    try {
      const res = await fetch(`${API}/tickets/${ticketId}/confirmer`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "ok") {
        fetchTickets();
        fetchTicketDetail(ticketId);
      } else { alert(data.msg); }
    } catch {}
  };

  const handleFermerTicket = async (ticketId) => {
    if (!window.confirm("Voulez-vous fermer ce ticket ?")) return;
    try {
      const res = await fetch(`${API}/tickets/${ticketId}/fermer`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "ok") { fetchTickets(); fetchTicketDetail(ticketId); }
    } catch {}
  };

  const handleFeedback = async (ticketId) => {
    if (!feedback.note) { alert("Veuillez choisir une note"); return; }
    try {
      const res = await fetch(`${API}/tickets/${ticketId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(feedback),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setFeedback({ note: 0, message: "" });
        fetchTicketDetail(ticketId);
        fetchTickets();
      } else { alert(data.msg); }
    } catch {}
  };

  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); navigate("/login"); };

  const typeIcon = (type) => type === "bug" ? "🐛" : type === "feature" ? "✨" : "💬";
  const typeLabel = (type) => type === "bug" ? "🐛 Bug" : type === "feature" ? "✨ Feature" : "💬 Consultancy";

  return (
    <div className="ch-layout">

      {/* ---- SIDEBAR ---- */}
      <aside className="ch-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">🎫</div>
          <span>Portail Client</span>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === "liste" ? "active" : ""}`}
            onClick={() => { setActiveTab("liste"); setSelectedTicket(null); }}>
            <span className="nav-icon">📋</span> Mes tickets
          </button>
          <button className={`nav-item ${activeTab === "creer" ? "active" : ""}`}
            onClick={() => { setActiveTab("creer"); setSelectedTicket(null); }}>
            <span className="nav-icon">➕</span> Créer un ticket
          </button>
        </nav>
        <div className="sidebar-user">
          <div className="user-avatar">{user?.prenom?.[0]}{user?.nom?.[0]}</div>
          <div className="user-info">
            <span className="user-name">{user?.prenom} {user?.nom}</span>
            <span className="user-role">Client</span>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Déconnexion">⏻</button>
        </div>
      </aside>

      {/* ---- MAIN ---- */}
      <main className="ch-main">

        {/* ---- TOPBAR avec notifications ---- */}
        <div className="topbar">
          <h1 className="topbar-title">
            {activeTab === "creer" ? "Créer un ticket" : selectedTicket ? selectedTicket.titre : "Mes tickets"}
          </h1>
          <div className="notif-wrapper">
            <button className="notif-btn" onClick={handleToggleNotifs}>
              🔔
              {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
            </button>
            {showNotifs && (
              <div className="notif-dropdown">
                <p className="notif-header">Notifications</p>
                {notifications.length === 0 ? (
                  <p className="notif-empty">Aucune notification</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} className={`notif-item ${n.lu ? "" : "notif-unread"}`}
                      onClick={() => {
                        setShowNotifs(false);
                        setActiveTab("liste");
                        if (n.ticket) fetchTicketDetail(n.ticket._id);
                      }}>
                      <p className="notif-msg">{n.message}</p>
                      <p className="notif-date">{new Date(n.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ---- STATS ---- */}
        <div className="stats-grid">
          <div className="stat-card stat-total"><span className="stat-number">{stats.total}</span><span className="stat-label">Total tickets</span></div>
          <div className="stat-card stat-waiting"><span className="stat-number">{stats.enAttente}</span><span className="stat-label">En attente</span></div>
          <div className="stat-card stat-progress"><span className="stat-number">{stats.enCours}</span><span className="stat-label">En cours</span></div>
          <div className="stat-card stat-solved"><span className="stat-number">{stats.resolus}</span><span className="stat-label">Résolus</span></div>
        </div>

        {/* ---- CRÉER TICKET ---- */}
        {activeTab === "creer" && (
          <div className="ch-card">
            {serverError && <div className="alert alert-error">{serverError}</div>}
            {serverMsg && <div className="alert alert-success">{serverMsg}</div>}
            <form onSubmit={handleCreateTicket} noValidate>
              <div className="form-group">
                <label>Titre <span className="req">*</span></label>
                <input type="text" placeholder="Décrivez brièvement le problème" value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })} className="form-input" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type <span className="req">*</span></label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="form-select">
                    <option value="bug">Bug</option>
<option value="feature">Feature</option>
<option value="consultancy">Consultancy</option>                  </select>
                </div>
                <div className="form-group">
                  <label>Priorité</label>
                  <select value={form.priorite} onChange={(e) => setForm({ ...form, priorite: e.target.value })} className="form-select">
                    <option value="low">🟢 Faible</option>
                    <option value="medium">🟡 Moyen</option>
                    <option value="high">🟠 Haute</option>
                    <option value="critical">🔴 Critique</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description <span className="req">*</span></label>
                <textarea placeholder="Décrivez le problème en détail..." value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} className="form-textarea" rows={5} />
              </div>
              <button type="submit" className="btn-primary">🎫 Soumettre le ticket</button>
            </form>
          </div>
        )}

        {/* ---- LISTE TICKETS ---- */}
        {activeTab === "liste" && !selectedTicket && (
          <div className="ch-card">
            {loading ? (
              <div className="loading">Chargement...</div>
            ) : tickets.length === 0 ? (
              <div className="empty-state">
                <span>🎫</span>
                <p>Aucun ticket pour l'instant</p>
                <button className="btn-primary" onClick={() => setActiveTab("creer")}>Créer mon premier ticket</button>
              </div>
            ) : (
              <div className="tickets-list">
                {tickets.map((ticket) => (
                  <div key={ticket._id} className="ticket-row"
                    onClick={() => { setSelectedTicket(ticket); fetchTicketDetail(ticket._id); }}>
                    <div className="ticket-row-left">
                      <span className="ticket-type-icon">{typeIcon(ticket.type)}</span>
                      <div>
                        <p className="ticket-titre">{ticket.titre}</p>
                        <p className="ticket-date">{new Date(ticket.createdAt).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>
                    <div className="ticket-row-right">
                      <PrioriteBadge priorite={ticket.priorite} />
                      <StatutBadge statut={ticket.statut} />
                      {ticket.statut === "ready_for_customer" && (
                        <span className="confirm-hint">⚡ Action requise</span>
                      )}
                      <span className="ticket-arrow">→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---- DETAIL TICKET ---- */}
        {activeTab === "liste" && selectedTicket && (
          <div className="ch-card">
            <button className="btn-back" onClick={() => setSelectedTicket(null)}>← Retour</button>

            <div className="ticket-detail-header">
              <h2>{selectedTicket.titre}</h2>
              <div className="ticket-detail-badges">
                <StatutBadge statut={selectedTicket.statut} />
                <PrioriteBadge priorite={selectedTicket.priorite} />
                <span className="type-badge">{typeLabel(selectedTicket.type)}</span>
              </div>
            </div>

            <div className="ticket-detail-body">
              <p className="ticket-description">{selectedTicket.description}</p>
              <p className="ticket-meta">
                Créé le {new Date(selectedTicket.createdAt).toLocaleDateString("fr-FR")}
                {selectedTicket.assignee && (
                  <> · Assigné à <strong>{selectedTicket.assignee.prenom} {selectedTicket.assignee.nom}</strong></>
                )}
              </p>
            </div>

            {/* ---- ACTIONS ---- */}
            <div className="ticket-actions">
              {/* Confirmer la solution */}
              {selectedTicket.statut === "ready_for_customer" && (
                <div className="confirm-box">
                  <p className="confirm-text">
                    ⚡ Le support a proposé une solution. Confirmez-vous que votre problème est résolu ?
                  </p>
                  <div className="confirm-buttons">
                    <button className="btn-confirm" onClick={() => handleConfirmerSolution(selectedTicket._id)}>
                      ✅ Confirmer la solution
                    </button>
                    <button className="btn-reopen" onClick={() => setCommentaire("La solution proposée ne résout pas mon problème : ")}>
                      ❌ Pas encore résolu
                    </button>
                  </div>
                </div>
              )}

              {/* Fermer le ticket */}
              {!["closed", "cancelled", "solved"].includes(selectedTicket.statut) && (
                <button className="btn-danger" onClick={() => handleFermerTicket(selectedTicket._id)}>
                  🔒 Fermer ce ticket
                </button>
              )}
            </div>

            {/* ---- COMMENTAIRES ---- */}
            <div className="commentaires-section">
              <h3>💬 Commentaires ({selectedTicket.commentaires?.length || 0})</h3>
              <div className="commentaires-list">
                {selectedTicket.commentaires?.length === 0 && (
                  <p className="no-comment">Aucun commentaire pour l'instant</p>
                )}
                {selectedTicket.commentaires?.map((c, i) => (
                  <div key={i} className="commentaire-item">
                    <div className={`comment-avatar ${c.auteur?.role !== "client" ? "avatar-support" : ""}`}>
                      {c.auteur?.prenom?.[0]}{c.auteur?.nom?.[0]}
                    </div>
                    <div className="comment-body">
                      <p className="comment-author">
                        {c.auteur?.prenom} {c.auteur?.nom}
                        <span className="comment-role"> · {c.auteur?.role === "client" ? "Vous" : "Support"}</span>
                      </p>
                      <p className="comment-text">{c.contenu}</p>
                      <p className="comment-date">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                ))}
              </div>

              {!["closed", "cancelled"].includes(selectedTicket.statut) && (
                <div className="add-comment">
                  <textarea placeholder="Ajouter une information ou répondre au support..."
                    value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
                    className="form-textarea" rows={3} />
                  <button className="btn-primary" onClick={() => handleAddCommentaire(selectedTicket._id)}>
                    Envoyer
                  </button>
                </div>
              )}
            </div>

            {/* ---- FEEDBACK ---- */}
            {["solved", "closed"].includes(selectedTicket.statut) && !selectedTicket.feedback?.note && (
              <div className="feedback-section">
                <h3>⭐ Donnez votre avis sur la résolution</h3>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} className={`star ${feedback.note >= n ? "star-active" : ""}`}
                      onClick={() => setFeedback({ ...feedback, note: n })}>★</button>
                  ))}
                </div>
                <textarea placeholder="Votre commentaire (optionnel)..." value={feedback.message}
                  onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
                  className="form-textarea" rows={3} />
                <button className="btn-primary" onClick={() => handleFeedback(selectedTicket._id)}>
                  ⭐ Envoyer le feedback
                </button>
              </div>
            )}

            {selectedTicket.feedback?.note > 0 && (
              <div className="feedback-done">
                <p>⭐ Vous avez donné une note de <strong>{selectedTicket.feedback.note}/5</strong></p>
                {selectedTicket.feedback.message && <p>"{selectedTicket.feedback.message}"</p>}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientHome;