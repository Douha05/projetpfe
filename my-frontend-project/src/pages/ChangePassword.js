import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ChangePassword.css";

const API = "http://localhost:3001/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const getUser = () => {
  const u = localStorage.getItem("user") || sessionStorage.getItem("user");
  return u ? JSON.parse(u) : null;
};

const ChangePassword = () => {
  const navigate = useNavigate();
  const user = getUser();
  const token = getToken();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMsg("");
    if (!newPassword || !confirmPassword) { setError("Tous les champs sont obligatoires"); return; }
    if (newPassword.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères"); return; }
    if (newPassword !== confirmPassword) { setError("Les mots de passe ne correspondent pas"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/users/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setMsg("✅ Mot de passe changé avec succès !");

        // Mettre à jour le user en storage
        const updatedUser = { ...user, mustChangePassword: false };
        if (localStorage.getItem("token")) {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } else {
          sessionStorage.setItem("user", JSON.stringify(updatedUser));
        }

        // Rediriger selon le rôle
        setTimeout(() => {
          if (user.role === "admin") navigate("/admin/dashboard");
          else if (user.role === "team_lead") navigate("/team-lead/dashboard");
          else if (user.role === "support") navigate("/support/dashboard");
          else navigate("/client/dashboard");
        }, 1500);
      } else {
        setError(data.msg);
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-page">
      <div className="cp-brand">
        <div className="brand-logo">
          <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h1 className="brand-title">Portail Personnel</h1>
        <p className="brand-subtitle">Première connexion</p>
      </div>

      <div className="cp-card">
        <div className="cp-header">
          <h2>🔐 Changez votre mot de passe</h2>
          <p>Bonjour <strong>{user?.prenom} {user?.nom}</strong>, pour votre sécurité vous devez créer un nouveau mot de passe avant de continuer.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Nouveau mot de passe <span className="req">*</span></label>
            <div className="input-box">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input type={showNew ? "text" : "password"} placeholder="Minimum 8 caractères"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <button type="button" className="eye-btn" onClick={() => setShowNew(!showNew)}>
                {showNew ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirmer le mot de passe <span className="req">*</span></label>
            <div className="input-box">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input type={showConfirm ? "text" : "password"} placeholder="Répétez le mot de passe"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <button type="button" className="eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="password-rules">
            <p>Le mot de passe doit contenir :</p>
            <ul>
              <li className={newPassword.length >= 8 ? "rule-ok" : ""}>✓ Au moins 8 caractères</li>
            </ul>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer mon mot de passe"}
          </button>
        </form>
      </div>

      <div className="cp-footer">
        <p>© 2026 devapp. Tous droits réservés.</p>
      </div>
    </div>
  );
};

export default ChangePassword;