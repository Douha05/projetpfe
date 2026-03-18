import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = email, 2 = code + nouveau mdp
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [serverMsg, setServerMsg] = useState("");

  // ---- Étape 1 : Envoyer le code ----
  const handleSendCode = async (e) => {
    e.preventDefault();
    setServerError(""); setServerMsg("");
    if (!email.trim()) { setServerError("Email requis"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setServerError("Email invalide"); return; }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setServerMsg("✅ Code envoyé ! Vérifiez votre boîte email.");
        setTimeout(() => { setServerMsg(""); setStep(2); }, 1500);
      } else {
        setServerError(data.msg);
      }
    } catch {
      setServerError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Étape 2 : Vérifier code + nouveau mot de passe ----
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setServerError(""); setServerMsg("");

    if (!code.trim()) { setServerError("Code requis"); return; }
    if (code.length !== 6) { setServerError("Le code doit contenir 6 chiffres"); return; }
    if (!newPassword) { setServerError("Nouveau mot de passe requis"); return; }
    if (newPassword.length < 8) { setServerError("Le mot de passe doit contenir au moins 8 caractères"); return; }
    if (newPassword !== confirmPassword) { setServerError("Les mots de passe ne correspondent pas"); return; }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setServerMsg("✅ Mot de passe réinitialisé avec succès !");
        setTimeout(() => navigate("/login", { state: { message: "Mot de passe réinitialisé ! Connectez-vous." } }), 2000);
      } else if (data.status === "expired") {
        setServerError(data.msg);
        setStep(1);
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
    <div className="fp-page">

      {/* Brand */}
      <div className="fp-brand">
        <div className="brand-logo">
          <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        </div>
        <h1 className="brand-title">Portail Client</h1>
        <p className="brand-subtitle">Réinitialisation du mot de passe</p>
      </div>

      <div className="fp-card">

        {/* Indicateur étapes */}
        <div className="steps">
          <div className={`step ${step >= 1 ? "step-active" : ""}`}>
            <div className="step-circle">1</div>
            <span>Email</span>
          </div>
          <div className="step-line" />
          <div className={`step ${step >= 2 ? "step-active" : ""}`}>
            <div className="step-circle">2</div>
            <span>Nouveau mot de passe</span>
          </div>
        </div>

        {serverError && <div className="alert alert-error">{serverError}</div>}
        {serverMsg && <div className="alert alert-success">{serverMsg}</div>}

        {/* ---- ÉTAPE 1 : Email ---- */}
        {step === 1 && (
          <>
            <div className="fp-header">
              <h2>Mot de passe oublié ?</h2>
              <p>Entrez votre email pour recevoir un code de vérification</p>
            </div>

            <form onSubmit={handleSendCode} noValidate>
              <div className="form-group">
                <label>Adresse e-mail</label>
                <div className="input-box">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input type="email" placeholder="nom@entreprise.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
              </div>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? "Envoi en cours..." : "Envoyer le code"}
              </button>
            </form>
          </>
        )}

        {/* ---- ÉTAPE 2 : Code + Nouveau mot de passe ---- */}
        {step === 2 && (
          <>
            <div className="fp-header">
              <h2>Vérification</h2>
              <p>Entrez le code reçu sur <strong>{email}</strong></p>
            </div>

            <form onSubmit={handleResetPassword} noValidate>

              {/* Code */}
              <div className="form-group">
                <label>Code de vérification</label>
                <input type="text" className="code-input" placeholder="000000"
                  maxLength={6} value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
                <span className="code-hint">Code à 6 chiffres envoyé par email — valable 15 minutes</span>
              </div>

              {/* Nouveau mot de passe */}
              <div className="form-group">
                <label>Nouveau mot de passe</label>
                <div className="input-box">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input type={showPassword ? "text" : "password"} placeholder="Minimum 8 caractères"
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
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

              {/* Confirmer mot de passe */}
              <div className="form-group">
                <label>Confirmer le mot de passe</label>
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

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
              </button>

              <button type="button" className="btn-resend"
                onClick={() => { setStep(1); setCode(""); setServerError(""); }}>
                Renvoyer le code
              </button>

            </form>
          </>
        )}

        <div className="fp-back">
          <Link to="/login">← Retour à la connexion</Link>
        </div>

      </div>

      <div className="fp-footer">
        <p>© 2026 devapp. Tous droits réservés.</p>
      </div>

    </div>
  );
};

export default ForgotPassword;