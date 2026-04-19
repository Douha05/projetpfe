import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./Login.css";
import { requestNotificationPermission } from "../firebase";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const successMsg = location.state?.message || "";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email invalide";
    if (!formData.password) newErrors.password = "Le mot de passe est requis";
    return newErrors;
  };

  // ✅ Initialiser les notifications push après connexion
  const initPush = async (token) => {
    try {
      const fcmToken = await requestNotificationPermission();
      if (!fcmToken) return;
      await fetch("http://localhost:3001/api/push/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fcmToken }),
      });
      console.log("✅ FCM Token sauvegardé");
    } catch (err) {
      console.error("Erreur FCM:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.status === "ok") {
        if (formData.rememberMe) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          sessionStorage.setItem("token", data.token);
          sessionStorage.setItem("user", JSON.stringify(data.user));
        }

        // ✅ Initialiser push après connexion réussie
        await initPush(data.token);

        // Première connexion → changer mot de passe
        if (data.user.mustChangePassword) {
          navigate("/change-password");
          return;
        }

        navigate("/client/dashboard");
      } else {
        setServerError(data.msg || "Email ou mot de passe incorrect");
      }
    } catch (err) {
      setServerError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="brand-logo">
          <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        </div>
        <h1 className="brand-title">Portail Client</h1>
        <p className="brand-subtitle">Gestion des tickets</p>
      </div>

      <div className="login-card">
        <div className="login-header">
          <h2>Connexion</h2>
          <p>Entrez vos identifiants pour accéder à votre compte</p>
        </div>

        {successMsg && <div className="alert alert-success">{successMsg}</div>}
        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Adresse e-mail</label>
            <div className={`input-box ${errors.email ? "input-box--error" : ""}`}>
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                type="email"
                name="email"
                placeholder="nom@entreprise.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <div className={`input-box ${errors.password ? "input-box--error" : ""}`}>
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
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
            {errors.password && <span className="error-msg">{errors.password}</span>}
          </div>

          <div className="login-options">
            <label className="remember-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <span>Se souvenir de moi</span>
            </label>
            <Link to="/forgot-password" className="forgot-link">
              Mot de passe oublié ?
            </Link>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="divider">
          <span>NOUVEAU CLIENT ?</span>
        </div>

        <p className="contact-admin-client">
          Pour créer un compte, contactez votre administrateur.
        </p>
      </div>

      <div className="login-footer">
        <p>
          Besoin d'aide ?{" "}
          <a href="mailto:support@devapp.com" className="footer-link">
            Contactez le support
          </a>
        </p>
        <p>© 2026 Portail Client. Tous droits réservés.</p>
      </div>
    </div>
  );
};

export default Login;