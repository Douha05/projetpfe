import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const API = "http://localhost:3001/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const getUser = () => {
  const u = localStorage.getItem("user") || sessionStorage.getItem("user");
  return u ? JSON.parse(u) : null;
};

const RoleBadge = ({ role }) => {
  const map = {
    admin: { label: "Admin", color: "role-admin" },
    team_lead: { label: "Chef d'équipe", color: "role-lead" },
    support: { label: "Support", color: "role-support" },
    client: { label: "Client", color: "role-client" },
  };
  const r = map[role] || { label: role, color: "role-client" };
  return <span className={`role-badge ${r.color}`}>{r.label}</span>;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = getUser();
  const token = getToken();

  const [activeTab, setActiveTab] = useState("creer");
  const [users, setUsers] = useState([]);
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

  const [form, setForm] = useState({
    nom: "", prenom: "", email: "",
    telephone: "", departement: "", role: "support",
  });

  useEffect(() => {
    if (!token || !user || user.role !== "admin") { navigate("/login"); return; }
    if (activeTab === "users") fetchUsers();
    fetchDemandes();
    const interval = setInterval(fetchDemandes, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchUsers = () => {
    setLoading(true);
    fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.status === "ok") setUsers(data.users); })
      .finally(() => setLoading(false));
  };

  const fetchDemandes = () => {
    fetch(`${API}/users/demandes-reset`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "ok") {
          setDemandes(data.demandes);
          setDemandesCount(data.demandes.length);
        }
      });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setServerError(""); setServerMsg("");
    if (!form.nom || !form.prenom || !form.email || !form.telephone) {
      setServerError("Tous les champs obligatoires doivent être remplis");
      return;
    }
    try {
      const res = await fetch(`${API}/admin/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setServerMsg(`✅ Compte créé ! Email envoyé à ${form.email}`);
        setForm({ nom: "", prenom: "", email: "", telephone: "", departement: "", role: "support" });
      } else {
        setServerError(data.msg);
      }
    } catch { setServerError("Erreur de connexion au serveur"); }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const res = await fetch(`${API}/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.status === "ok") fetchUsers();
    } catch {}
  };

  const handleToggle = async (userId) => {
    try {
      const res = await fetch(`${API}/admin/users/${userId}/toggle`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "ok") fetchUsers();
    } catch {}
  };

  const handleDelete = async (userId) => {
    try {
      const res = await fetch(`${API}/admin/users/${userId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
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
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setEditMsg("✅ Modifications enregistrées !");
        fetchUsers();
        setTimeout(() => setEditUser(null), 1500);
      } else { setEditError(data.msg); }
    } catch { setEditError("Erreur de connexion"); }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm("Réinitialiser le mot de passe de cet utilisateur ?")) return;
    try {
      const res = await fetch(`${API}/admin/users/${userId}/reset-password`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "ok") {
        setEditMsg("✅ Mot de passe réinitialisé et envoyé par email !");
      } else { setEditError(data.msg); }
    } catch { setEditError("Erreur de connexion"); }
  };

  const handleResetPasswordDirect = async (email) => {
    // Chercher l'utilisateur dans la liste
    let foundUser = users.find((u) => u.email === email);
    if (!foundUser) {
      // Recharger la liste si pas trouvé
      const res = await fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status === "ok") {
        setUsers(data.users);
        foundUser = data.users.find((u) => u.email === email);
      }
    }
    if (!foundUser) { alert("Utilisateur introuvable — rechargez la page Utilisateurs"); return; }
    try {
      const res = await fetch(`${API}/admin/users/${foundUser._id}/reset-password`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "ok") {
        alert("✅ Mot de passe réinitialisé et envoyé par email !");
        fetchDemandes();
      } else { alert(data.msg); }
    } catch { alert("Erreur de connexion"); }
  };

  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); navigate("/login"); };

  return (
    <div className="ad-layout">
      <aside className="ad-sidebar">
        <div className="sidebar-brand"><div className="sidebar-logo">⚙️</div><span>Admin Panel</span></div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === "creer" ? "active" : ""}`} onClick={() => setActiveTab("creer")}><span>➕</span> Créer un compte</button>
          <button className={`nav-item ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}><span>👥</span> Utilisateurs</button>
          <button className={`nav-item ${activeTab === "demandes" ? "active" : ""}`} onClick={() => { setActiveTab("demandes"); fetchDemandes(); }}>
            <span>🔔</span> Demandes reset
            {demandesCount > 0 && <span className="notif-count">{demandesCount}</span>}
          </button>
        </nav>
        <div className="sidebar-user">
          <div className="user-avatar">{user?.prenom?.[0]}{user?.nom?.[0]}</div>
          <div className="user-info"><span className="user-name">{user?.prenom} {user?.nom}</span><span className="user-role">Administrateur</span></div>
          <button className="btn-logout" onClick={handleLogout} title="Déconnexion">⏻</button>
        </div>
      </aside>

      <main className="ad-main">

        {/* ---- MODAL SUPPRESSION ---- */}
        {deleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-icon">🗑️</div>
              <h3>Supprimer cet utilisateur ?</h3>
              <p>Voulez-vous vraiment supprimer <strong>{deleteConfirm.prenom} {deleteConfirm.nom}</strong> ? Cette action est irréversible.</p>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Annuler</button>
                <button className="btn-delete-confirm" onClick={() => handleDelete(deleteConfirm._id)}>Supprimer définitivement</button>
              </div>
            </div>
          </div>
        )}

        {/* ---- MODAL MODIFICATION ---- */}
        {editUser && (
          <div className="modal-overlay">
            <div className="modal-box modal-edit">
              <h3>✏️ Modifier — {editUser.prenom} {editUser.nom}</h3>
              {editError && <div className="alert alert-error">{editError}</div>}
              {editMsg && <div className="alert alert-success">{editMsg}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom</label>
                  <input type="text" className="form-input" value={editForm.prenom}
                    onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Nom</label>
                  <input type="text" className="form-input" value={editForm.nom}
                    onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-input" value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone</label>
                  <input type="text" className="form-input" value={editForm.telephone}
                    onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })} />
                </div>
                {editUser.role !== "client" && (
                  <div className="form-group">
                    <label>Département</label>
                    <input type="text" className="form-input" value={editForm.departement}
                      onChange={(e) => setEditForm({ ...editForm, departement: e.target.value })} />
                  </div>
                )}
              </div>
              <div className="reset-password-box">
                <p>🔐 Mot de passe</p>
                <button className="btn-reset-password" onClick={() => handleResetPassword(editUser._id)}>
                  Réinitialiser le mot de passe
                </button>
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setEditUser(null)}>Annuler</button>
                <button className="btn-save" onClick={handleEditSave}>💾 Enregistrer</button>
              </div>
            </div>
          </div>
        )}

        {/* ---- CRÉER COMPTE ---- */}
        {activeTab === "creer" && (
          <div className="ad-card">
            <h2 className="card-title">➕ Créer un compte personnel</h2>
            <p className="card-subtitle">Un mot de passe temporaire sera généré automatiquement et envoyé par email.</p>
            {serverError && <div className="alert alert-error">{serverError}</div>}
            {serverMsg && <div className="alert alert-success">{serverMsg}</div>}
            <form onSubmit={handleCreateUser} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom <span className="req">*</span></label>
                  <input type="text" placeholder="Prénom" className="form-input" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Nom <span className="req">*</span></label>
                  <input type="text" placeholder="Nom" className="form-input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Email professionnel <span className="req">*</span></label>
                <input type="email" placeholder="prenom.nom@entreprise.com" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone <span className="req">*</span></label>
                  <input type="text" placeholder="+216 XX XXX XXX" className="form-input" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Département</label>
                  <input type="text" placeholder="Support Technique" className="form-input" value={form.departement} onChange={(e) => setForm({ ...form, departement: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Rôle <span className="req">*</span></label>
                <div className="role-selector">
                  <button type="button" className={`role-btn ${form.role === "support" ? "role-btn-active" : ""}`} onClick={() => setForm({ ...form, role: "support" })}>
                    <span className="role-icon">🎧</span><span className="role-name">Agent Support</span><span className="role-desc">Traite les tickets clients</span>
                  </button>
                  <button type="button" className={`role-btn ${form.role === "team_lead" ? "role-btn-active" : ""}`} onClick={() => setForm({ ...form, role: "team_lead" })}>
                    <span className="role-icon">👑</span><span className="role-name">Chef d'équipe</span><span className="role-desc">Supervise et assigne les tickets</span>
                  </button>
                </div>
              </div>
              <div className="info-box"><span>🔐</span><p>Un mot de passe temporaire de 10 caractères sera généré automatiquement.</p></div>
              <button type="submit" className="btn-primary">➕ Créer le compte et envoyer l'email</button>
            </form>
          </div>
        )}

        {/* ---- LISTE UTILISATEURS ---- */}
        {activeTab === "users" && (
          <div className="ad-card">
            <h2 className="card-title">👥 Gestion des utilisateurs</h2>
            {loading ? <div className="loading">Chargement...</div> : (
              <div className="users-table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Utilisateur</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-cell-avatar">{u.prenom?.[0]}{u.nom?.[0]}</div>
                            <div>
                              <p className="user-cell-name">{u.prenom} {u.nom}</p>
                              <p className="user-cell-dept">{u.departement || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="email-cell">{u.email}</td>
                        <td>
                          {u.role !== "admin" && u.role !== "client" ? (
                            <select className="role-select" value={u.role} onChange={(e) => handleChangeRole(u._id, e.target.value)}>
                              <option value="support">Support</option>
                              <option value="team_lead">Chef d'équipe</option>
                            </select>
                          ) : <RoleBadge role={u.role} />}
                        </td>
                        <td><span className={`status-badge ${u.isActive ? "status-active" : "status-inactive"}`}>{u.isActive ? "Actif" : "Inactif"}</span></td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-edit" onClick={() => openEdit(u)}>✏️ Modifier</button>
                            {u.role !== "admin" && (
                              <button className={`btn-toggle ${u.isActive ? "btn-toggle-off" : "btn-toggle-on"}`} onClick={() => handleToggle(u._id)}>
                                {u.isActive ? "Désactiver" : "Activer"}
                              </button>
                            )}
                            {u.role !== "admin" && (
                              <button className="btn-delete" onClick={() => setDeleteConfirm(u)}>🗑️</button>
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

        {/* ---- DEMANDES RESET ---- */}
        {activeTab === "demandes" && (
          <div className="ad-card">
            <h2 className="card-title">🔔 Demandes de réinitialisation de mot de passe</h2>
            {demandes.length === 0 ? (
              <div className="empty-demandes">
                <p>✅ Aucune demande en attente</p>
              </div>
            ) : (
              <div className="demandes-list">
                {demandes.map((d, i) => (
                  <div key={i} className="demande-item">
                    <div className="demande-info">
                      <div className="user-cell-avatar">{d.prenom?.[0]}{d.nom?.[0]}</div>
                      <div>
                        <p className="demande-name">{d.prenom} {d.nom}</p>
                        <p className="demande-email">{d.email}</p>
                        <p className="demande-role">{d.role === "team_lead" ? "👑 Chef d'équipe" : "🎧 Agent Support"}</p>
                        <p className="demande-date">Demandé le {new Date(d.createdAt).toLocaleDateString("fr-FR")} à {new Date(d.createdAt).toLocaleTimeString("fr-FR")}</p>
                      </div>
                    </div>
                    <button className="btn-reset-now" onClick={() => handleResetPasswordDirect(d.email)}>
                      🔑 Réinitialiser le mot de passe
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;