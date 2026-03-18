import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./RegisterPersonnel.css";

const RegisterPersonnel = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    departement: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est requis";
    if (!formData.nom.trim()) newErrors.nom = "Le nom est requis";
    if (!formData.email.trim()) newErrors.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email invalide";
    if (!formData.telephone.trim())
      newErrors.telephone = "Le téléphone est requis";
    if (!formData.password) newErrors.password = "Le mot de passe est requis";
    else if (formData.password.length < 8)
      newErrors.password = "Minimum 8 caractères";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Veuillez confirmer le mot de passe";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMsg("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/personnel/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: formData.prenom,
          nom: formData.nom,
          email: formData.email,
          telephone: formData.telephone,
          departement: formData.departement,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.status === "ok") {
        setSuccessMsg("Compte créé avec succès ! Redirection...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setServerError(data.msg || "Une erreur est survenue");
      }
    } catch (err) {
      setServerError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rp-page">
      <div className="rp-card">

        <div className="rp-header">
          <h1>Inscription Personnel</h1>
          <p>Créez votre compte pour accéder au système de gestion</p>
        </div>

        {serverError && <div className="alert alert-error">{serverError}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        <form onSubmit={handleSubmit} noValidate>

          {/* Prénom + Nom */}
          <div className="form-row">
            <div className="form-group">
              <label>Prénom <span className="required">*</span></label>
              <div className={`input-box ${errors.prenom ? "input-box--error" : ""}`}>
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  type="text"
                  name="prenom"
                  placeholder="Prénom"
                  value={formData.prenom}
                  onChange={handleChange}
                />
              </div>
              {errors.prenom && <span className="error-msg">{errors.prenom}</span>}
            </div>

            <div className="form-group">
              <label>Nom <span className="required">*</span></label>
              <div className={`input-box ${errors.nom ? "input-box--error" : ""}`}>
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  type="text"
                  name="nom"
                  placeholder="Nom"
                  value={formData.nom}
                  onChange={handleChange}
                />
              </div>
              {errors.nom && <span className="error-msg">{errors.nom}</span>}
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Adresse e-mail professionnelle <span className="required">*</span></label>
            <div className={`input-box ${errors.email ? "input-box--error" : ""}`}>
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                type="email"
                name="email"
                placeholder="prenom.nom@entreprise.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>

          {/* Téléphone */}
          <div className="form-group">
            <label>Numéro de téléphone <span className="required">*</span></label>
            <div className={`input-box ${errors.telephone ? "input-box--error" : ""}`}>
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6 6l1.06-.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/>
              </svg>
              <input
                type="tel"
                name="telephone"
                placeholder="+33 6 12 34 56 78"
                value={formData.telephone}
                onChange={handleChange}
              />
            </div>
            {errors.telephone && <span className="error-msg">{errors.telephone}</span>}
          </div>

          {/* Département (optionnel) */}
          <div className="form-group">
            <label>
              Département <span className="optional">(optionnel)</span>
            </label>
            <div className="input-box">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              <input
                type="text"
                name="departement"
                placeholder="ex: Support Technique, Commercial..."
                value={formData.departement}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="form-group">
            <label>Mot de passe <span className="required">*</span></label>
            <div className={`input-box ${errors.password ? "input-box--error" : ""}`}>
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type="password"
                name="password"
                placeholder="Minimum 8 caractères"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            {errors.password && <span className="error-msg">{errors.password}</span>}
          </div>

          {/* Confirmer mot de passe */}
          <div className="form-group">
            <label>Confirmer le mot de passe <span className="required">*</span></label>
            <div className={`input-box ${errors.confirmPassword ? "input-box--error" : ""}`}>
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirmez votre mot de passe"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            {errors.confirmPassword && <span className="error-msg">{errors.confirmPassword}</span>}
          </div>

          {/* Bouton */}
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Création en cours..." : "Créer mon compte →"}
          </button>

        </form>

        <div className="rp-footer">
          <p>Vous avez déjà un compte ?</p>
          <Link to="/login" className="btn-login">Se connecter</Link>
        </div>

      </div>
    </div>
  );
};

export default RegisterPersonnel;