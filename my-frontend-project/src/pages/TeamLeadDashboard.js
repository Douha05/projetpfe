import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./TeamLeadDashboard.css";

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

const TeamLeadDashboard = () => {
  const navigate = useNavigate();
  const user = getUser();
  const token = getToken();

  const [activeTab, setActiveTab] = useState("overview");
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [statsByAgent, setStatsByAgent] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState("tous");
  const [assignModal, setAssignModal] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token || !user || user.role !== "team_lead") { navigate("/login-personnel"); return; }
    fetchStats();
    fetchTickets();
    fetchAgents();
  }, []);

  const fetchStats = () => {
    fetch(`${API}/tickets/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "ok") {
          setStats(data.stats);
          setStatsByAgent(data.statsByAgent);
        }
      });
  };

  const fetchTickets = () => {
    setLoading(true);
    fetch(`${API}/tickets/tous`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.status === "ok") setTickets(data.tickets); })
      .finally(() => setLoading(false));
  };

  const fetchAgents = () => {
    fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "ok") {
          setAgents(data.users.filter((u) => u.role === "support" && u.isActive));
        }
      });
  };

  const fetchTicketDetail = (id) => {
    fetch(`${API}/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.status === "ok") setSelectedTicket(data.ticket); });
  };

  const handleAssigner = async () => {
    if (!selectedAgent) { alert("Choisissez un agent"); return; }
    try {
      const res = await fetch(`${API}/tickets/${assignModal._id}/assigner`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assigneeId: selectedAgent }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setMsg("✅ Ticket assigné !");
        setAssignModal(null);
        setSelectedAgent("");
        fetchTickets();
        fetchStats();
        setTimeout(() => setMsg(""), 2000);
      }
    } catch {}
  };

  const handleChangePriorite = async (ticketId, priorite) => {
    try {
      const res = await fetch(`${API}/tickets/${ticketId}/priorite`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ priorite }),
      });
      const data = await res.json();
      if (data.status === "ok") { fetchTickets(); if (selectedTicket?._id === ticketId) fetchTicketDetail(ticketId); }
    } catch {}
  };

  const ticketsFiltres = filterStatut === "tous" ? tickets : tickets.filter((t) => t.statut === filterStatut);
  const typeIcon = (type) => type === "bug" ? "🐛" : type === "feature" ? "✨" : "💬";

  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); navigate("/login-personnel"); };

  return (
    <div className="tl-layout">

      {/* ---- SIDEBAR ---- */}
      <aside className="tl-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">👑</div>
          <span>Chef d'équipe</span>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === "overview" ? "active" : ""}`} onClick={() => { setActiveTab("overview"); setSelectedTicket(null); }}>
            <span>📊</span> Vue d'ensemble
          </button>
          <button className={`nav-item ${activeTab === "tickets" ? "active" : ""}`} onClick={() => { setActiveTab("tickets"); setSelectedTicket(null); }}>
            <span>🎫</span> Tous les tickets
          </button>
          <button className={`nav-item ${activeTab === "agents" ? "active" : ""}`} onClick={() => setActiveTab("agents")}>
            <span>👥</span> Agents support
          </button>
        </nav>
        <div className="sidebar-user">
          <div className="user-avatar">{user?.prenom?.[0]}{user?.nom?.[0]}</div>
          <div className="user-info">
            <span className="user-name">{user?.prenom} {user?.nom}</span>
            <span className="user-role">Chef d'équipe</span>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Déconnexion">⏻</button>
        </div>
      </aside>

      {/* ---- MAIN ---- */}
      <main className="tl-main">

        {msg && <div className="global-msg">{msg}</div>}

        {/* ---- MODAL ASSIGNATION ---- */}
        {assignModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>👤 Assigner le ticket</h3>
              <p className="modal-ticket-title">{assignModal.titre}</p>
              <div className="form-group">
                <label>Choisir un agent support</label>
                <select className="form-select" value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
                  <option value="">-- Sélectionner --</option>
                  {agents.map((a) => (
                    <option key={a._id} value={a._id}>{a.prenom} {a.nom} — {a.departement || "Support"}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => { setAssignModal(null); setSelectedAgent(""); }}>Annuler</button>
                <button className="btn-assign" onClick={handleAssigner}>✅ Assigner</button>
              </div>
            </div>
          </div>
        )}

        {/* ---- VUE D'ENSEMBLE ---- */}
        {activeTab === "overview" && stats && (
          <>
            <div className="stats-grid">
              <div className="stat-card stat-total"><span className="stat-number">{stats.total}</span><span className="stat-label">Total tickets</span></div>
              <div className="stat-card stat-waiting"><span className="stat-number">{stats.enAttente}</span><span className="stat-label">En attente</span></div>
              <div className="stat-card stat-progress"><span className="stat-number">{stats.enCours}</span><span className="stat-label">En cours</span></div>
              <div className="stat-card stat-solved"><span className="stat-number">{stats.resolus}</span><span className="stat-label">Résolus</span></div>
              <div className="stat-card stat-escalated"><span className="stat-number">{stats.escalades}</span><span className="stat-label">Escaladés</span></div>
              <div className="stat-card stat-unassigned"><span className="stat-number">{stats.nonAssignes}</span><span className="stat-label">Non assignés</span></div>
            </div>

            {/* Tickets non assignés */}
            {stats.nonAssignes > 0 && (
              <div className="tl-card">
                <h2 className="card-title">⚡ Tickets en attente d'assignation</h2>
                <div className="tickets-list">
                  {tickets.filter((t) => !t.assignee).map((ticket) => (
                    <div key={ticket._id} className="ticket-row">
                      <div className="ticket-row-left">
                        <span className="ticket-type-icon">{typeIcon(ticket.type)}</span>
                        <div>
                          <p className="ticket-titre">{ticket.titre}</p>
                          <p className="ticket-meta">{ticket.reporter?.prenom} {ticket.reporter?.nom} · {new Date(ticket.createdAt).toLocaleDateString("fr-FR")}</p>
                        </div>
                      </div>
                      <div className="ticket-row-right">
                        <PrioriteBadge priorite={ticket.priorite} />
                        <button className="btn-assign-quick" onClick={() => setAssignModal(ticket)}>👤 Assigner</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ---- TOUS LES TICKETS ---- */}
        {activeTab === "tickets" && !selectedTicket && (
          <div className="tl-card">
            <div className="card-header">
              <h2 className="card-title">🎫 Tous les tickets</h2>
              <select className="filter-select" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
                <option value="tous">Tous les statuts</option>
                <option value="ready_for_support">En attente</option>
                <option value="in_progress">En cours</option>
                <option value="ready_for_customer">À confirmer</option>
                <option value="solved">Résolus</option>
                <option value="escalated">Escaladés</option>
              </select>
            </div>

            {loading ? <div className="loading">Chargement...</div> : (
              <div className="tickets-list">
                {ticketsFiltres.map((ticket) => (
                  <div key={ticket._id} className="ticket-row" onClick={() => { setSelectedTicket(ticket); fetchTicketDetail(ticket._id); }}>
                    <div className="ticket-row-left">
                      <span className="ticket-type-icon">{typeIcon(ticket.type)}</span>
                      <div>
                        <p className="ticket-titre">{ticket.titre}</p>
                        <p className="ticket-meta">
                          {ticket.reporter?.prenom} {ticket.reporter?.nom} ·
                          {ticket.assignee ? ` Assigné à ${ticket.assignee.prenom} ${ticket.assignee.nom}` : " Non assigné"}
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

        {/* ---- DETAIL TICKET ---- */}
        {activeTab === "tickets" && selectedTicket && (
          <div className="tl-card">
            <button className="btn-back" onClick={() => setSelectedTicket(null)}>← Retour</button>

            <div className="ticket-detail-header">
              <h2>{selectedTicket.titre}</h2>
              <div className="ticket-detail-badges">
                <StatutBadge statut={selectedTicket.statut} />
                <PrioriteBadge priorite={selectedTicket.priorite} />
              </div>
            </div>

            <div className="ticket-detail-body">
              <p className="ticket-description">{selectedTicket.description}</p>
              <p className="ticket-meta">
                Client : <strong>{selectedTicket.reporter?.prenom} {selectedTicket.reporter?.nom}</strong> ·
                Créé le {new Date(selectedTicket.createdAt).toLocaleDateString("fr-FR")}
              </p>
              {selectedTicket.assignee && (
                <p className="ticket-meta">Assigné à : <strong>{selectedTicket.assignee.prenom} {selectedTicket.assignee.nom}</strong></p>
              )}
              {selectedTicket.tempsPassé > 0 && (
                <p className="ticket-meta">⏱️ Temps passé : <strong>{selectedTicket.tempsPassé} minutes</strong></p>
              )}
            </div>

            {/* Actions Team Lead */}
            <div className="tl-actions">
              <div className="action-group">
                <label>Priorité</label>
                <select className="form-select" value={selectedTicket.priorite}
                  onChange={(e) => handleChangePriorite(selectedTicket._id, e.target.value)}>
                  <option value="low">Faible</option>
                  <option value="medium">Moyen</option>
                  <option value="high">Haute</option>
                  <option value="critical">Critique</option>
                </select>
              </div>
              <button className="btn-assign-quick" onClick={() => setAssignModal(selectedTicket)}>
                👤 {selectedTicket.assignee ? "Réassigner" : "Assigner"}
              </button>
            </div>

            {/* Commentaires */}
            <div className="commentaires-section">
              <h3>💬 Commentaires ({selectedTicket.commentaires?.length || 0})</h3>
              <div className="commentaires-list">
                {selectedTicket.commentaires?.length === 0 && <p className="no-comment">Aucun commentaire</p>}
                {selectedTicket.commentaires?.map((c, i) => (
                  <div key={i} className="commentaire-item">
                    <div className="comment-avatar">{c.auteur?.prenom?.[0]}{c.auteur?.nom?.[0]}</div>
                    <div className="comment-body">
                      <p className="comment-author">{c.auteur?.prenom} {c.auteur?.nom} <span className="comment-role">· {c.auteur?.role}</span></p>
                      <p className="comment-text">{c.contenu}</p>
                      <p className="comment-date">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---- AGENTS SUPPORT ---- */}
        {activeTab === "agents" && (
          <div className="tl-card">
            <h2 className="card-title">👥 Performance des agents support</h2>
            <div className="agents-grid">
              {statsByAgent.map(({ agent, assigned, resolved, inProgress }) => (
                <div key={agent._id} className="agent-card">
                  <div className="agent-avatar">{agent.prenom?.[0]}{agent.nom?.[0]}</div>
                  <div className="agent-info">
                    <p className="agent-name">{agent.prenom} {agent.nom}</p>
                    <p className="agent-email">{agent.email}</p>
                  </div>
                  <div className="agent-stats">
                    <div className="agent-stat"><span className="agent-stat-num">{assigned}</span><span className="agent-stat-lbl">Assignés</span></div>
                    <div className="agent-stat"><span className="agent-stat-num">{inProgress}</span><span className="agent-stat-lbl">En cours</span></div>
                    <div className="agent-stat"><span className="agent-stat-num">{resolved}</span><span className="agent-stat-lbl">Résolus</span></div>
                  </div>
                </div>
              ))}
              {statsByAgent.length === 0 && <p className="no-comment">Aucun agent support</p>}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default TeamLeadDashboard;