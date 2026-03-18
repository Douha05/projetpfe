import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
    if (!formData.nom.trim()) newErrors.nom = "Le nom est requis";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est requis";
    if (!formData.email.trim()) newErrors.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Adresse email invalide";
    if (!formData.telephone.trim())
      newErrors.telephone = "Le numéro de téléphone est requis";
    if (!formData.password) newErrors.password = "Le mot de passe est requis";
    else if (formData.password.length < 8)
      newErrors.password = "Minimum 8 caractères";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Veuillez confirmer le mot de passe";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    if (!formData.acceptTerms)
      newErrors.acceptTerms = "Vous devez accepter les conditions";
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
      const response = await fetch("http://localhost:3001/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          telephone: formData.telephone,
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
    <div className="register-page">
      <div className="register-card">

        <div className="register-header">
          <h1>Créer un compte</h1>
          <p>Remplissez le formulaire pour créer votre compte client</p>
        </div>

        {serverError && <div className="alert alert-error">{serverError}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        <form onSubmit={handleSubmit} noValidate>

          <div className="form-row">
            <div className="form-group">
              <label>Nom</label>
              <div className={`input-box ${errors.nom ? "input-box--error" : ""}`}>
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  type="text"
                  name="nom"
                  placeholder="Dupont"
                  value={formData.nom}
                  onChange={handleChange}
                />
              </div>
              {errors.nom && <span className="error-msg">{errors.nom}</span>}
            </div>

            <div className="form-group">
              <label>Prénom</label>
              <div className={`input-box ${errors.prenom ? "input-box--error" : ""}`}>
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  type="text"
                  name="prenom"
                  placeholder="Jean"
                  value={formData.prenom}
                  onChange={handleChange}
                />
              </div>
              {errors.prenom && <span className="error-msg">{errors.prenom}</span>}
            </div>
          </div>

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
                placeholder="jean.dupont@exemple.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Numéro de téléphone</label>
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

          <div className="form-group">
            <label>Mot de passe</label>
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

          <div className="form-group">
            <label>Confirmer le mot de passe</label>
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

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
              />
              <span>
                J'accepte les{" "}
                <Link to="/terms" className="link-green">conditions d'utilisation</Link>
                {" "}et la{" "}
                <Link to="/privacy" className="link-green">politique de confidentialité</Link>
              </span>
            </label>
            {errors.acceptTerms && <span className="error-msg">{errors.acceptTerms}</span>}
          </div>

          <button type="submit" className="btn-create" disabled={loading}>
            {loading ? "Création en cours..." : "👤 Créer mon compte"}
          </button>

        </form>

        <div className="register-footer">
          <p>Vous avez déjà un compte ?</p>
          <Link to="/login" className="btn-login">Se connecter</Link>
        </div>

      </div>
    </div>
  );
};

export default Register;