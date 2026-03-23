import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPasswordPersonnel.css";

const ForgotPasswordPersonnel = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverMsg, setServerMsg] = useState("");
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(""); setServerMsg("");
    if (!email.trim()) { setServerError("Email requis"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setServerError("Email invalide"); return; }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/users/demande-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setServerMsg("✅ " + data.msg);
        setEmail("");
      } else {
        setServerError(data.msg);
      }
    } catch {
      setServerError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fpp-page">
      <div className="fpp-brand">
        <div className="brand-logo">
          <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h1 className="brand-title">Portail Personnel</h1>
        <p className="brand-subtitle">Réinitialisation du mot de passe</p>
      </div>

      <div className="fpp-card">
        <div className="fpp-header">
          <h2>Mot de passe oublié ?</h2>
          <p>Entrez votre email — l'administrateur recevra une notification et réinitialisera votre mot de passe.</p>
        </div>

        {serverError && <div className="alert alert-error">{serverError}</div>}
        {serverMsg && (
          <div className="alert alert-success">
            {serverMsg}
            <p style={{marginTop: "8px", fontSize: "13px"}}>L'admin vous enverra un nouveau mot de passe par email.</p>
          </div>
        )}

        {!serverMsg && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>Adresse e-mail professionnelle</label>
              <div className="input-box">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input type="email" placeholder="prenom.nom@entreprise.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Envoi en cours..." : "Envoyer la demande à l'admin"}
            </button>
          </form>
        )}

        <button className="btn-back" onClick={() => navigate("/login-personnel")}>
          ← Retour à la connexion
        </button>
      </div>

      <div className="fpp-footer">
        <p>© 2026 devapp. Tous droits réservés.</p>
      </div>
    </div>
  );
};

export default ForgotPasswordPersonnel;