import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SupportDashboard.css";

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

const SupportDashboard = () => {
  const navigate = useNavigate();
  const user = getUser();
  const token = getToken();

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentaire, setCommentaire] = useState("");
  const [temps, setTemps] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !user || user.role !== "support") { navigate("/login-personnel"); return; }
    fetchTickets();
  }, []);

  const fetchTickets = () => {
    setLoading(true);
    fetch(`${API}/tickets/assignes`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.status === "ok") setTickets(data.tickets); })
      .finally(() => setLoading(false));
  };

  const fetchTicketDetail = (id) => {
    fetch(`${API}/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.status === "ok") setSelectedTicket(data.ticket); });
  };

  const handleChangeStatut = async (ticketId, statut) => {
    setMsg(""); setError("");
    try {
      const res = await fetch(`${API}/tickets/${ticketId}/statut`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setMsg("✅ Statut mis à jour !");
        fetchTickets();
        fetchTicketDetail(ticketId);
        setTimeout(() => setMsg(""), 2000);
      } else { setError(data.msg); }
    } catch { setError("Erreur de connexion"); }
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
      if (data.status === "ok") {
        setCommentaire("");
        fetchTicketDetail(ticketId);
        fetchTickets();
      }
    } catch {}
  };

  const handleEnregistrerTemps = async (ticketId) => {
    if (!temps || isNaN(temps) || temps <= 0) { setError("Entrez un temps valide en minutes"); return; }
    try {
      const res = await fetch(`${API}/tickets/${ticketId}/temps`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ temps: parseInt(temps) }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setMsg("✅ Temps enregistré !");
        setTemps("");
        fetchTicketDetail(ticketId);
        setTimeout(() => setMsg(""), 2000);
      }
    } catch {}
  };

  const stats = {
    total: tickets.length,
    enCours: tickets.filter((t) => t.statut === "in_progress").length,
    resolus: tickets.filter((t) => ["solved", "closed"].includes(t.statut)).length,
    enAttente: tickets.filter((t) => t.statut === "ready_for_support").length,
  };

  const typeIcon = (type) => type === "bug" ? "🐛" : type === "feature" ? "✨" : "💬";

  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); navigate("/login-personnel"); };

  return (
    <div className="sp-layout">

      {/* ---- SIDEBAR ---- */}
      <aside className="sp-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">🎧</div>
          <span>Agent Support</span>
        </div>
        <div className="sidebar-nav">
          <button className="nav-item active"><span>🎫</span> Mes tickets</button>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{user?.prenom?.[0]}{user?.nom?.[0]}</div>
          <div className="user-info">
            <span className="user-name">{user?.prenom} {user?.nom}</span>
            <span className="user-role">Agent Support</span>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Déconnexion">⏻</button>
        </div>
      </aside>

      {/* ---- MAIN ---- */}
      <main className="sp-main">

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card stat-total"><span className="stat-number">{stats.total}</span><span className="stat-label">Mes tickets</span></div>
          <div className="stat-card stat-progress"><span className="stat-number">{stats.enCours}</span><span className="stat-label">En cours</span></div>
          <div className="stat-card stat-waiting"><span className="stat-number">{stats.enAttente}</span><span className="stat-label">En attente</span></div>
          <div className="stat-card stat-solved"><span className="stat-number">{stats.resolus}</span><span className="stat-label">Résolus</span></div>
        </div>

        {/* Liste tickets */}
        {!selectedTicket && (
          <div className="sp-card">
            <h2 className="card-title">🎫 Mes tickets assignés</h2>
            {loading ? <div className="loading">Chargement...</div> :
              tickets.length === 0 ? (
                <div className="empty-state">
                  <span>🎫</span>
                  <p>Aucun ticket assigné pour l'instant</p>
                </div>
              ) : (
                <div className="tickets-list">
                  {tickets.map((ticket) => (
                    <div key={ticket._id} className="ticket-row"
                      onClick={() => { setSelectedTicket(ticket); fetchTicketDetail(ticket._id); setMsg(""); setError(""); }}>
                      <div className="ticket-row-left">
                        <span className="ticket-type-icon">{typeIcon(ticket.type)}</span>
                        <div>
                          <p className="ticket-titre">{ticket.titre}</p>
                          <p className="ticket-meta">
                            {ticket.reporter?.prenom} {ticket.reporter?.nom} · {new Date(ticket.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      <div className="ticket-row-right">
                        <PrioriteBadge priorite={ticket.priorite} />
                        <StatutBadge statut={ticket.statut} />
                        <span className="ticket-arrow">→</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* Detail ticket */}
        {selectedTicket && (
          <div className="sp-card">
            <button className="btn-back" onClick={() => { setSelectedTicket(null); setMsg(""); setError(""); }}>← Retour</button>

            <div className="ticket-detail-header">
              <h2>{selectedTicket.titre}</h2>
              <div className="ticket-detail-badges">
                <StatutBadge statut={selectedTicket.statut} />
                <PrioriteBadge priorite={selectedTicket.priorite} />
                <span className="type-badge">
                  {selectedTicket.type === "bug" ? "🐛 Bug" : selectedTicket.type === "feature" ? "✨ Feature" : "💬 Consultancy"}
                </span>
              </div>
            </div>

            {msg && <div className="alert alert-success">{msg}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div className="ticket-detail-body">
              <p className="ticket-description">{selectedTicket.description}</p>
              <p className="ticket-meta">
                Client : <strong>{selectedTicket.reporter?.prenom} {selectedTicket.reporter?.nom}</strong> ·
                Créé le {new Date(selectedTicket.createdAt).toLocaleDateString("fr-FR")}
              </p>
              {selectedTicket.tempsPassé > 0 && (
                <p className="ticket-meta">⏱️ Temps passé : <strong>{selectedTicket.tempsPassé} minutes</strong></p>
              )}
            </div>

            {/* Actions support */}
            {!["solved", "closed", "cancelled"].includes(selectedTicket.statut) && (
              <div className="support-actions">
                <h3>⚡ Actions</h3>
                <div className="actions-grid">
                  <button className="action-btn btn-in-progress"
                    onClick={() => handleChangeStatut(selectedTicket._id, "in_progress")}>
                    🔄 Marquer En cours
                  </button>
                  <button className="action-btn btn-ready"
                    onClick={() => handleChangeStatut(selectedTicket._id, "ready_for_customer")}>
                    ✅ Solution proposée
                  </button>
                  <button className="action-btn btn-escalate"
                    onClick={() => handleChangeStatut(selectedTicket._id, "escalated")}>
                    ⬆️ Escalader
                  </button>
                  <button className="action-btn btn-cancel-ticket"
                    onClick={() => handleChangeStatut(selectedTicket._id, "cancelled")}>
                    ❌ Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Enregistrer temps */}
            {!["solved", "closed", "cancelled"].includes(selectedTicket.statut) && (
              <div className="temps-section">
                <h3>⏱️ Enregistrer le temps passé</h3>
                <div className="temps-input">
                  <input type="number" placeholder="Minutes" value={temps}
                    onChange={(e) => setTemps(e.target.value)} className="form-input" min="1" />
                  <button className="btn-temps" onClick={() => handleEnregistrerTemps(selectedTicket._id)}>
                    Enregistrer
                  </button>
                </div>
              </div>
            )}

            {/* Commentaires */}
            <div className="commentaires-section">
              <h3>💬 Commentaires ({selectedTicket.commentaires?.length || 0})</h3>
              <div className="commentaires-list">
                {selectedTicket.commentaires?.length === 0 && <p className="no-comment">Aucun commentaire</p>}
                {selectedTicket.commentaires?.map((c, i) => (
                  <div key={i} className="commentaire-item">
                    <div className={`comment-avatar ${c.auteur?.role === "client" ? "avatar-client" : "avatar-support"}`}>
                      {c.auteur?.prenom?.[0]}{c.auteur?.nom?.[0]}
                    </div>
                    <div className="comment-body">
                      <p className="comment-author">
                        {c.auteur?.prenom} {c.auteur?.nom}
                        <span className="comment-role"> · {c.auteur?.role === "client" ? "Client" : "Support"}</span>
                      </p>
                      <p className="comment-text">{c.contenu}</p>
                      <p className="comment-date">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                ))}
              </div>

              {!["closed", "cancelled"].includes(selectedTicket.statut) && (
                <div className="add-comment">
                  <textarea placeholder="Ajouter un commentaire technique..."
                    value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
                    className="form-textarea" rows={3} />
                  <button className="btn-primary" onClick={() => handleAddCommentaire(selectedTicket._id)}>
                    Envoyer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SupportDashboard;