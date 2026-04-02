import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const API = "http://localhost:3001/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const getUser = () => {
  const u = localStorage.getItem("user") || sessionStorage.getItem("user");
  return u ? JSON.parse(u) : null;
};

const initials = (p, n) => `${p?.[0] || ""}${n?.[0] || ""}`.toUpperCase();

const RoleBadge = ({ role }) => {
  const map = {
    admin:     { label: "Admin",         cls: "role-admin" },
    team_lead: { label: "Chef d'équipe", cls: "role-lead" },
    support:   { label: "Support",       cls: "role-support" },
    client:    { label: "Client",        cls: "role-client" },
  };
  const r = map[role] || { label: role, cls: "role-client" };
  return <span className={`role-badge ${r.cls}`}>{r.label}</span>;
};

const STATUT_LABELS = {
  ready_for_support: "En attente", in_progress: "En cours",
  ready_for_customer: "À confirmer", solved: "Résolu",
  closed: "Fermé", cancelled: "Annulé", escalated: "Escaladé",
};

const ROLE_LABELS = {
  admin: "Admin", team_lead: "Chef d'équipe", support: "Agent support", client: "Client",
};

const ALL_ROLES = ["admin", "team_lead", "support", "client"];

const PRIO_MAP = {
  low:      { label: "Faible",   cls: "prio-low" },
  medium:   { label: "Moyen",    cls: "prio-medium" },
  high:     { label: "Haute",    cls: "prio-high" },
  critical: { label: "Critique", cls: "prio-critical" },
};

const TYPE_ICON = { bug: "🐛", feature: "✨", consultancy: "💬" };

// ---- SVG ICONS (14x14 comme chef d'équipe) ----
const IconApp = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1.5 3.5A1.5 1.5 0 0 1 3 2h9.982a1.5 1.5 0 0 1 1.498 1.5v2.5a.5.5 0 0 1-.5.5 1 1 0 0 0 0 2 .5.5 0 0 1 .5.5v2.5A1.5 1.5 0 0 1 12.982 13H3A1.5 1.5 0 0 1 1.5 11.5V8a.5.5 0 0 1 .5-.5 1 1 0 1 0 0-2 .5.5 0 0 1-.5-.5V3.5z"/>
  </svg>
);

const IconUserPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" y1="8" x2="19" y2="14"/>
    <line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
);

const IconClientAdd = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
    <line x1="19" y1="3" x2="19" y2="9"/>
    <line x1="22" y1="6" x2="16" y2="6"/>
  </svg>
);

const IconUsers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconWorkflow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="5" height="5" rx="1"/>
    <rect x="16" y="3" width="5" height="5" rx="1"/>
    <rect x="9.5" y="16" width="5" height="5" rx="1"/>
    <path d="M5.5 8v3a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8"/>
    <line x1="12" y1="13" x2="12" y2="16"/>
  </svg>
);

const IconBell = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const IconLogout = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const NAV_ITEMS = [
  { id: "creer-personnel", label: "Créer personnel", Icon: IconUserPlus },
  { id: "creer-client",    label: "Créer client",    Icon: IconClientAdd },
  { id: "users",           label: "Utilisateurs",    Icon: IconUsers },
  { id: "workflow",        label: "Workflow",         Icon: IconWorkflow },
  { id: "demandes",        label: "Demandes reset",   Icon: IconBell, badge: true },
];

const PAGE_TITLES = {
  "creer-personnel": { title: "Administration", sub: "Créer un compte personnel" },
  "creer-client":    { title: "Administration", sub: "Créer un compte client" },
  "users":           { title: "Utilisateurs",   sub: "Gestion des comptes" },
  "workflow":        { title: "Workflow",        sub: "Configuration des transitions" },
  "demandes":        { title: "Demandes reset",  sub: "Réinitialisation de mots de passe" },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = getUser();
  const token = getToken();

  const [activeTab, setActiveTab] = useState("creer-personnel");
  const [users, setUsers] = useState([]);
  const [searchUsers, setSearchUsers] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverMsg, setServerMsg] = useState("");
  const [serverError, setServerError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editMsg, setEditMsg] = useState("");
  const [editError, setEditError] = useState("");
  const [demandes, setDemandes] = useState([]);
  const [demandesCount, setDemandesCount] = useState(0);

  const [workflow, setWorkflow] = useState(null);
  const [wfTickets, setWfTickets] = useState([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowMsg, setWorkflowMsg] = useState("");
  const [workflowError, setWorkflowError] = useState("");
  const [editingTransition, setEditingTransition] = useState(null);
  const [transitionForm, setTransitionForm] = useState({});

  const [formPersonnel, setFormPersonnel] = useState({
    nom: "", prenom: "", email: "", telephone: "", departement: "", role: "support",
  });
  const [formClient, setFormClient] = useState({
    nom: "", prenom: "", email: "", telephone: "",
  });

  useEffect(() => {
    if (!token || !user || user.role !== "admin") { navigate("/login"); return; }
    if (activeTab === "users") fetchUsers();
    if (activeTab === "workflow") { fetchWorkflow(); fetchWfTickets(); }
    fetchDemandes();
    const interval = setInterval(() => {
      if (activeTab === "users") fetchUsers();
      fetchDemandes();
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchUsers = () => {
    setLoading(true);
    fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setUsers(d.users); })
      .finally(() => setLoading(false));
  };

  const fetchDemandes = () => {
    fetch(`${API}/users/demandes-reset`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        if (d.status === "ok") { setDemandes(d.demandes); setDemandesCount(d.demandes.length); }
      });
  };

  const fetchWorkflow = () => {
    setWorkflowLoading(true);
    fetch(`${API}/workflow`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        if (d.status === "ok") setWorkflow(d.workflow);
        else setWorkflowError(d.msg || "Erreur chargement");
      }).catch(() => setWorkflowError("Erreur de connexion"))
      .finally(() => setWorkflowLoading(false));
  };

  const fetchWfTickets = () => {
    fetch(`${API}/tickets/tous`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.status === "ok") setWfTickets(d.tickets); }).catch(() => {});
  };

  const handleSaveTransition = async () => {
    setWorkflowMsg(""); setWorkflowError("");
    try {
      const res = await fetch(`${API}/workflow/transitions/${editingTransition._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(transitionForm),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setWorkflowMsg("Transition mise à jour.");
        setWorkflow(data.workflow); setEditingTransition(null);
        setTimeout(() => setWorkflowMsg(""), 2000);
      } else { setWorkflowError(data.msg); }
    } catch { setWorkflowError("Erreur de connexion"); }
  };

  const handleResetWorkflow = async () => {
    if (!window.confirm("Réinitialiser le workflow aux valeurs par défaut ?")) return;
    setWorkflowMsg(""); setWorkflowError("");
    try {
      const res = await fetch(`${API}/workflow/reset`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status === "ok") {
        setWorkflow(data.workflow); setWorkflowMsg("Workflow réinitialisé.");
        setTimeout(() => setWorkflowMsg(""), 2000);
      } else { setWorkflowError(data.msg || "Erreur"); }
    } catch { setWorkflowError("Erreur de connexion"); }
  };

  const openEditTransition = (t) => {
    setEditingTransition(t);
    setTransitionForm({
      rolesAutorises: [...t.rolesAutorises], active: t.active,
      delaiEscaladeHeures: t.delaiEscaladeHeures || "", notifierRoles: [...t.notifierRoles],
    });
  };

  const toggleRole = (field, role) => {
    setTransitionForm(prev => {
      const arr = prev[field] || [];
      return { ...prev, [field]: arr.includes(role) ? arr.filter(r => r !== role) : [...arr, role] };
    });
  };

  const handleCreatePersonnel = async (e) => {
    e.preventDefault(); setServerError(""); setServerMsg("");
    if (!formPersonnel.nom || !formPersonnel.prenom || !formPersonnel.email || !formPersonnel.telephone) {
      setServerError("Tous les champs obligatoires doivent être remplis"); return;
    }
    try {
      const res = await fetch(`${API}/admin/create-user`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formPersonnel),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setServerMsg(`Compte créé ! Email envoyé à ${formPersonnel.email}`);
        setFormPersonnel({ nom: "", prenom: "", email: "", telephone: "", departement: "", role: "support" });
      } else { setServerError(data.msg); }
    } catch { setServerError("Erreur de connexion"); }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault(); setServerError(""); setServerMsg("");
    if (!formClient.nom || !formClient.prenom || !formClient.email || !formClient.telephone) {
      setServerError("Tous les champs sont obligatoires"); return;
    }
    try {
      const res = await fetch(`${API}/admin/create-client`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formClient),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setServerMsg(`Compte client créé ! Email envoyé à ${formClient.email}`);
        setFormClient({ nom: "", prenom: "", email: "", telephone: "" });
      } else { setServerError(data.msg); }
    } catch { setServerError("Erreur de connexion"); }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const res = await fetch(`${API}/admin/users/${userId}/role`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.status === "ok") fetchUsers();
    } catch {}
  };

  const handleToggle = async (userId) => {
    try {
      const res = await fetch(`${API}/admin/users/${userId}/toggle`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status === "ok") fetchUsers();
    } catch {}
  };

  const handleDelete = async (userId) => {
    try {
      const res = await fetch(`${API}/admin/users/${userId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status === "ok") { setDeleteConfirm(null); fetchUsers(); }
      else alert(data.msg);
    } catch {}
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ nom: u.nom, prenom: u.prenom, email: u.email, telephone: u.telephone, departement: u.departement || "" });
    setEditMsg(""); setEditError("");
  };

  const handleEditSave = async () => {
    setEditMsg(""); setEditError("");
    try {
      const res = await fetch(`${API}/admin/users/${editUser._id}/edit`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.status === "ok") { setEditMsg("Modifications enregistrées !"); fetchUsers(); setTimeout(() => setEditUser(null), 1500); }
      else { setEditError(data.msg); }
    } catch { setEditError("Erreur de connexion"); }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm("Réinitialiser le mot de passe ?")) return;
    try {
      const res = await fetch(`${API}/admin/users/${userId}/reset-password`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status === "ok") setEditMsg("Mot de passe réinitialisé et envoyé par email !");
      else setEditError(data.msg);
    } catch { setEditError("Erreur de connexion"); }
  };

  const handleResetPasswordDirect = async (email) => {
    let foundUser = users.find(u => u.email === email);
    if (!foundUser) {
      const res = await fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status === "ok") { setUsers(data.users); foundUser = data.users.find(u => u.email === email); }
    }
    if (!foundUser) { alert("Utilisateur introuvable"); return; }
    try {
      const res = await fetch(`${API}/admin/users/${foundUser._id}/reset-password`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status === "ok") { alert("Mot de passe réinitialisé et envoyé par email !"); fetchDemandes(); }
      else { alert(data.msg); }
    } catch { alert("Erreur de connexion"); }
  };

  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); navigate("/login"); };

  const usersFiltres = users.filter(u => {
    const q = searchUsers.toLowerCase();
    return (
      u.prenom?.toLowerCase().includes(q) ||
      u.nom?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.departement?.toLowerCase().includes(q)
    );
  });

  const pageInfo = PAGE_TITLES[activeTab] || { title: "Administration", sub: "" };

  return (
    <div className="ad-layout">

      {/* ---- SIDEBAR ---- */}
      <aside className="ad-sidebar">
        <div className="ad-brand">
          <div className="ad-brand-icon">
            <IconApp />
          </div>
          <span className="ad-brand-name">DevApp</span>
        </div>

        <div className="ad-nav-label">Gestion</div>

        <nav className="ad-nav">
          {NAV_ITEMS.map(n => (
            <button
              key={n.id}
              className={`ad-nav-item ${activeTab === n.id ? "ad-nav-active" : ""}`}
              onClick={() => { setActiveTab(n.id); setServerMsg(""); setServerError(""); }}
            >
              <span className="ad-nav-icon"><n.Icon /></span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge && demandesCount > 0 && (
                <span className="ad-nav-badge">{demandesCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="ad-sidebar-user">
          <div className="ad-user-avatar">{user?.prenom?.[0]}{user?.nom?.[0]}</div>
          <div className="ad-user-info">
            <span className="ad-user-name">{user?.prenom} {user?.nom}</span>
            <span className="ad-user-role">Administrateur</span>
          </div>
          <button className="ad-logout-btn" onClick={handleLogout} title="Déconnexion">
            <IconLogout />
          </button>
        </div>
      </aside>

      <main className="ad-main">

        {/* ---- MODAL SUPPRESSION ---- */}
        {deleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-icon">🗑️</div>
              <h3>Supprimer cet utilisateur ?</h3>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
                Voulez-vous vraiment supprimer <strong>{deleteConfirm.prenom} {deleteConfirm.nom}</strong> ? Cette action est irréversible.
              </p>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Annuler</button>
                <button className="btn-delete-confirm" onClick={() => handleDelete(deleteConfirm._id)}>Supprimer définitivement</button>
              </div>
            </div>
          </div>
        )}

        {/* ---- MODAL MODIFICATION USER ---- */}
        {editUser && (
          <div className="modal-overlay">
            <div className="modal-box modal-edit">
              <h3>Modifier — {editUser.prenom} {editUser.nom}</h3>
              {editError && <div className="alert alert-error">{editError}</div>}
              {editMsg && <div className="alert alert-success">{editMsg}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom</label>
                  <input type="text" className="form-input" value={editForm.prenom} onChange={e => setEditForm({ ...editForm, prenom: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Nom</label>
                  <input type="text" className="form-input" value={editForm.nom} onChange={e => setEditForm({ ...editForm, nom: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-input" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone</label>
                  <input type="text" className="form-input" value={editForm.telephone} onChange={e => setEditForm({ ...editForm, telephone: e.target.value })} />
                </div>
                {editUser.role !== "client" && (
                  <div className="form-group">
                    <label>Département</label>
                    <input type="text" className="form-input" value={editForm.departement} onChange={e => setEditForm({ ...editForm, departement: e.target.value })} />
                  </div>
                )}
              </div>
              <div className="reset-password-box">
                <p>🔐 Mot de passe</p>
                <button className="btn-reset-password" onClick={() => handleResetPassword(editUser._id)}>Réinitialiser</button>
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setEditUser(null)}>Annuler</button>
                <button className="btn-save" onClick={handleEditSave}>Enregistrer</button>
              </div>
            </div>
          </div>
        )}

        {/* ---- MODAL TRANSITION ---- */}
        {editingTransition && (
          <div className="modal-overlay">
            <div className="modal-box modal-edit">
              <h3>Configurer la transition</h3>
              <p className="modal-ticket-title">
                {STATUT_LABELS[editingTransition.de]} → {STATUT_LABELS[editingTransition.vers]}
              </p>
              <div className="workflow-toggle-row">
                <span className="wf-label">Transition active</span>
                <label className="wf-switch">
                  <input type="checkbox" checked={transitionForm.active} onChange={e => setTransitionForm({ ...transitionForm, active: e.target.checked })} />
                  <span className="wf-slider"></span>
                </label>
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label>Qui peut faire cette transition ?</label>
                <div className="role-checks">
                  {ALL_ROLES.map(role => (
                    <label key={role} className="role-check-item">
                      <input type="checkbox" checked={transitionForm.rolesAutorises?.includes(role)} onChange={() => toggleRole("rolesAutorises", role)} />
                      {ROLE_LABELS[role]}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Délai avant escalade automatique (heures)</label>
                <input type="number" className="form-input" placeholder="Laisser vide = pas d'escalade auto"
                  value={transitionForm.delaiEscaladeHeures}
                  onChange={e => setTransitionForm({ ...transitionForm, delaiEscaladeHeures: e.target.value })} min="1" />
              </div>
              <div className="form-group">
                <label>Notifier lors de cette transition</label>
                <div className="role-checks">
                  {ALL_ROLES.map(role => (
                    <label key={role} className="role-check-item">
                      <input type="checkbox" checked={transitionForm.notifierRoles?.includes(role)} onChange={() => toggleRole("notifierRoles", role)} />
                      {ROLE_LABELS[role]}
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setEditingTransition(null)}>Annuler</button>
                <button className="btn-save" onClick={handleSaveTransition}>Enregistrer</button>
              </div>
            </div>
          </div>
        )}

        {/* ---- TOPBAR ---- */}
        <div className="ad-topbar">
          <div>
            <h1 className="ad-page-title">{pageInfo.title}</h1>
            <p className="ad-page-subtitle">{pageInfo.sub}</p>
          </div>
        </div>

        <div className="ad-content">

          {/* ---- CRÉER PERSONNEL ---- */}
          {activeTab === "creer-personnel" && (
            <div className="ad-card">
              <h2 className="ad-card-title">Créer un compte personnel</h2>
              <p className="ad-card-subtitle">Un mot de passe temporaire sera généré automatiquement et envoyé par email.</p>
              {serverError && <div className="alert alert-error">{serverError}</div>}
              {serverMsg && <div className="alert alert-success">{serverMsg}</div>}
              <form onSubmit={handleCreatePersonnel} noValidate>
                <div className="form-row">
                  <div className="form-group">
                    <label>Prénom <span className="req">*</span></label>
                    <input type="text" placeholder="Prénom" className="form-input" value={formPersonnel.prenom} onChange={e => setFormPersonnel({ ...formPersonnel, prenom: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Nom <span className="req">*</span></label>
                    <input type="text" placeholder="Nom" className="form-input" value={formPersonnel.nom} onChange={e => setFormPersonnel({ ...formPersonnel, nom: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email professionnel <span className="req">*</span></label>
                  <input type="email" placeholder="prenom.nom@entreprise.com" className="form-input" value={formPersonnel.email} onChange={e => setFormPersonnel({ ...formPersonnel, email: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Téléphone <span className="req">*</span></label>
                    <input type="text" placeholder="+216 XX XXX XXX" className="form-input" value={formPersonnel.telephone} onChange={e => setFormPersonnel({ ...formPersonnel, telephone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Département</label>
                    <input type="text" placeholder="Support Technique" className="form-input" value={formPersonnel.departement} onChange={e => setFormPersonnel({ ...formPersonnel, departement: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Rôle <span className="req">*</span></label>
                  <div className="role-selector">
                    <button type="button" className={`role-btn ${formPersonnel.role === "support" ? "role-btn-active" : ""}`} onClick={() => setFormPersonnel({ ...formPersonnel, role: "support" })}>
                      <span className="role-icon">🎧</span>
                      <span className="role-name">Agent Support</span>
                      <span className="role-desc">Traite les tickets clients</span>
                    </button>
                    <button type="button" className={`role-btn ${formPersonnel.role === "team_lead" ? "role-btn-active" : ""}`} onClick={() => setFormPersonnel({ ...formPersonnel, role: "team_lead" })}>
                      <span className="role-icon">👑</span>
                      <span className="role-name">Chef d'équipe</span>
                      <span className="role-desc">Supervise et assigne les tickets</span>
                    </button>
                  </div>
                </div>
                <div className="info-box">
                  <span>🔐</span>
                  <p>Un mot de passe temporaire de 10 caractères sera généré automatiquement.</p>
                </div>
                <button type="submit" className="btn-primary">Créer le compte et envoyer l'email</button>
              </form>
            </div>
          )}

          {/* ---- CRÉER CLIENT ---- */}
          {activeTab === "creer-client" && (
            <div className="ad-card">
              <h2 className="ad-card-title">Créer un compte client</h2>
              <p className="ad-card-subtitle">Un mot de passe temporaire sera envoyé au client par email.</p>
              {serverError && <div className="alert alert-error">{serverError}</div>}
              {serverMsg && <div className="alert alert-success">{serverMsg}</div>}
              <form onSubmit={handleCreateClient} noValidate>
                <div className="form-row">
                  <div className="form-group">
                    <label>Prénom <span className="req">*</span></label>
                    <input type="text" placeholder="Prénom" className="form-input" value={formClient.prenom} onChange={e => setFormClient({ ...formClient, prenom: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Nom <span className="req">*</span></label>
                    <input type="text" placeholder="Nom" className="form-input" value={formClient.nom} onChange={e => setFormClient({ ...formClient, nom: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email <span className="req">*</span></label>
                  <input type="email" placeholder="client@exemple.com" className="form-input" value={formClient.email} onChange={e => setFormClient({ ...formClient, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Téléphone <span className="req">*</span></label>
                  <input type="text" placeholder="+216 XX XXX XXX" className="form-input" value={formClient.telephone} onChange={e => setFormClient({ ...formClient, telephone: e.target.value })} />
                </div>
                <div className="info-box"><span>🔐</span><p>Un mot de passe temporaire sera généré et envoyé au client. Il devra le changer à sa première connexion.</p></div>
                <button type="submit" className="btn-primary">Créer le compte client</button>
              </form>
            </div>
          )}

          {/* ---- UTILISATEURS ---- */}
          {activeTab === "users" && (
            <div className="ad-card">
              <div className="ad-card-header">
                <div>
                  <h2 className="ad-card-title">Utilisateurs</h2>
                  <p className="ad-card-subtitle" style={{ marginBottom: 0 }}>Gestion de tous les comptes de la plateforme.</p>
                </div>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{usersFiltres.length} utilisateur{usersFiltres.length !== 1 ? "s" : ""}</span>
              </div>
              <input
                className="ad-search-input"
                placeholder="Rechercher par nom, email ou département..."
                value={searchUsers}
                onChange={e => setSearchUsers(e.target.value)}
              />
              {loading ? <div className="loading">Chargement...</div> : (
                <div className="users-table-wrapper">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Utilisateur</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersFiltres.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: "center", color: "#9ca3af", padding: 24, fontSize: 13 }}>Aucun utilisateur trouvé</td></tr>
                      ) : usersFiltres.map(u => (
                        <tr key={u._id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-cell-avatar">{initials(u.prenom, u.nom)}</div>
                              <div>
                                <p className="user-cell-name">{u.prenom} {u.nom}</p>
                                <p className="user-cell-dept">{u.departement || "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="email-cell">{u.email}</td>
                          <td>
                            {u.role !== "admin" && u.role !== "client" ? (
                              <select className="role-select" value={u.role} onChange={e => handleChangeRole(u._id, e.target.value)}>
                                <option value="support">Support</option>
                                <option value="team_lead">Chef d'équipe</option>
                              </select>
                            ) : <RoleBadge role={u.role} />}
                          </td>
                          <td>
                            <span className={`status-badge ${u.isActive ? "status-active" : "status-inactive"}`}>
                              {u.isActive ? "Actif" : "Inactif"}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-edit" onClick={() => openEdit(u)}>Modifier</button>
                              {u.role !== "admin" && (
                                <button className={u.isActive ? "btn-toggle-off" : "btn-toggle-on"} onClick={() => handleToggle(u._id)}>
                                  {u.isActive ? "Désactiver" : "Activer"}
                                </button>
                              )}
                              {u.role !== "admin" && (
                                <button className="btn-delete" onClick={() => setDeleteConfirm(u)}>Supprimer</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ---- WORKFLOW ---- */}
          {activeTab === "workflow" && (
            <div className="ad-card">
              <div className="ad-card-header">
                <div>
                  <h2 className="ad-card-title">Workflow</h2>
                  <p className="ad-card-subtitle" style={{ marginBottom: 0 }}>Configurez les transitions, rôles autorisés et notifications.</p>
                </div>
                <button className="btn-reset-workflow" onClick={handleResetWorkflow}>Réinitialiser</button>
              </div>
              {workflowMsg && <div className="alert alert-success" style={{ marginTop: 16 }}>{workflowMsg}</div>}
              {workflowError && <div className="alert alert-error" style={{ marginTop: 16 }}>{workflowError}</div>}
              {workflowLoading ? <div className="loading">Chargement...</div> : workflow ? (
                <div className="workflow-list" style={{ marginTop: 16 }}>
                  {workflow.transitions.map(t => {
                    const tix = wfTickets.filter(tk => tk.statut === t.vers);
                    return (
                      <div key={t._id} className={`workflow-row-card ${!t.active ? "workflow-row-inactive" : ""}`}>
                        <div className="wf-card-header">
                          <div className="wf-card-left">
                            <div className="workflow-transition">
                              <span className="wf-statut">{STATUT_LABELS[t.de]}</span>
                              <span className="wf-arrow">→</span>
                              <span className="wf-statut">{STATUT_LABELS[t.vers]}</span>
                            </div>
                            <div className="workflow-meta">
                              <span className="wf-roles">👤 {t.rolesAutorises.map(r => ROLE_LABELS[r]).join(", ")}</span>
                              {t.delaiEscaladeHeures && <span className="wf-delai">⏱️ Escalade après {t.delaiEscaladeHeures}h</span>}
                              {t.notifierRoles.length > 0 && <span className="wf-notif">🔔 {t.notifierRoles.map(r => ROLE_LABELS[r]).join(", ")}</span>}
                            </div>
                          </div>
                          <div className="wf-card-right">
                            <span className={`wf-ticket-count ${tix.length > 0 ? "wf-count-active" : "wf-count-empty"}`}>
                              {tix.length} ticket{tix.length !== 1 ? "s" : ""}
                            </span>
                            <span className={`wf-status-badge ${t.active ? "wf-active" : "wf-inactive"}`}>
                              {t.active ? "Active" : "Inactive"}
                            </span>
                            <button className="btn-edit" onClick={() => openEditTransition(t)}>Modifier</button>
                          </div>
                        </div>
                        {tix.length > 0 && (
                          <div className="wf-tickets-list">
                            {tix.map(tk => (
                              <div key={tk._id} className="wf-ticket-row">
                                <div className="wf-ticket-left">
                                  <span style={{ fontSize: 14 }}>{TYPE_ICON[tk.type] || "💬"}</span>
                                  <div>
                                    <p className="wf-ticket-titre">{tk.titre}</p>
                                    <p className="wf-ticket-meta">
                                      Client : <strong>{tk.reporter?.prenom} {tk.reporter?.nom}</strong>
                                      {" · "}Agent : <strong>{tk.assignee ? `${tk.assignee.prenom} ${tk.assignee.nom}` : "Non assigné"}</strong>
                                    </p>
                                  </div>
                                </div>
                                <span className={`prio-badge-wf prio-${tk.priorite}`}>
                                  {PRIO_MAP[tk.priorite]?.label || tk.priorite}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : <div className="empty-state">Aucun workflow configuré.</div>}
            </div>
          )}

          {/* ---- DEMANDES RESET ---- */}
          {activeTab === "demandes" && (
            <div className="ad-card">
              <h2 className="ad-card-title">Demandes de réinitialisation</h2>
              <p className="ad-card-subtitle">Demandes de réinitialisation de mot de passe en attente.</p>
              {demandes.length === 0 ? (
                <div className="empty-demandes">Aucune demande en attente.</div>
              ) : (
                <div className="demandes-list">
                  {demandes.map((d, i) => (
                    <div key={i} className="demande-item">
                      <div className="demande-info">
                        <div className="ad-user-avatar" style={{ flexShrink: 0 }}>{d.prenom?.[0]}{d.nom?.[0]}</div>
                        <div>
                          <p className="demande-name">{d.prenom} {d.nom}</p>
                          <p className="demande-email">{d.email}</p>
                          <p className="demande-role">{d.role === "team_lead" ? "Chef d'équipe" : "Agent Support"}</p>
                          <p className="demande-date">
                            {new Date(d.createdAt).toLocaleDateString("fr-FR")} à {new Date(d.createdAt).toLocaleTimeString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      <button className="btn-reset-now" onClick={() => handleResetPasswordDirect(d.email)}>
                        Réinitialiser le mot de passe
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;