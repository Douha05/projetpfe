const router = require("express").Router();
const bcrypt = require("bcryptjs");
const config = require("config");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const sendEmail = require("../../utils/sendEmail");

const resetCodes = {};
const demandesReset = {};

// ============================================================
// POST /api/users/register
// ============================================================
router.post("/register", (req, res) => {
  const { nom, prenom, email, telephone, password } = req.body;
  if (!nom || !prenom || !email || !telephone || !password) {
    return res.status(400).json({ status: "notok", msg: "Tous les champs sont obligatoires" });
  }
  User.findOne({ email: email.toLowerCase() }).then((user) => {
    if (user) return res.status(400).json({ status: "notokmail", msg: "Email déjà utilisé" });
    const newUser = new User({ nom, prenom, email: email.toLowerCase(), telephone, password, role: "client", mustChangePassword: false });
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        newUser.password = hash;
        newUser.save().then((saved) => {
          jwt.sign({ id: saved._id, role: saved.role }, config.get("jwtSecret"), { expiresIn: config.get("tokenExpire") }, (err, token) => {
            return res.status(200).json({ status: "ok", msg: "Compte créé avec succès", token, user: { id: saved._id, nom: saved.nom, prenom: saved.prenom, email: saved.email, role: saved.role, mustChangePassword: saved.mustChangePassword } });
          });
        });
      });
    });
  });
});

// ============================================================
// POST /api/users/login
// ============================================================
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ status: "notok", msg: "Email et mot de passe requis" });
  User.findOne({ email: email.toLowerCase() }).then((user) => {
    if (!user) return res.status(400).json({ status: "notok", msg: "Email ou mot de passe incorrect" });
    if (!user.isActive) {
      return res.status(403).json({ status: "notok", msg: "Votre compte a été désactivé. Contactez l'administrateur." });
    }
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (!isMatch) return res.status(400).json({ status: "notok", msg: "Email ou mot de passe incorrect" });
      jwt.sign({ id: user._id, role: user.role }, config.get("jwtSecret"), { expiresIn: config.get("tokenExpire") }, (err, token) => {
        return res.status(200).json({
          status: "ok",
          msg: "Connexion réussie",
          token,
          user: {
            id: user._id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
          }
        });
      });
    });
  });
});

// ============================================================
// GET /api/users/me
// ============================================================
router.get("/me", require("../../middleware/authMiddlware"), (req, res) => {
  User.findById(req.user.id).select("-password").then((user) => {
    return res.status(200).json({ status: "ok", user });
  });
});

// ============================================================
// POST /api/users/change-password — Changer mot de passe (première connexion)
// ============================================================
router.post("/change-password", require("../../middleware/authMiddlware"), async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  if (!newPassword || !confirmPassword) {
    return res.status(400).json({ status: "notok", msg: "Tous les champs sont obligatoires" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ status: "notok", msg: "Le mot de passe doit contenir au moins 8 caractères" });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ status: "notok", msg: "Les mots de passe ne correspondent pas" });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ status: "notok", msg: "Utilisateur introuvable" });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;
    await user.save();
    return res.status(200).json({ status: "ok", msg: "Mot de passe changé avec succès" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// POST /api/users/forgot-password — Client uniquement
// ============================================================
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ status: "notok", msg: "Email requis" });
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(200).json({ status: "ok", msg: "Si cet email existe, un code a été envoyé" });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 15 * 60 * 1000;
    resetCodes[email.toLowerCase()] = { code, expiry };
    await sendEmail({
      to: user.email,
      subject: "devapp — Code de réinitialisation de mot de passe",
      html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
        <h2 style="color:#111827">Réinitialisation de mot de passe</h2>
        <p>Bonjour <strong>${user.prenom}</strong>,</p>
        <div style="text-align:center;margin:24px 0">
          <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#111827;background:#f3f4f6;padding:16px 24px;border-radius:12px">${code}</span>
        </div>
        <p style="color:#6b7280;font-size:13px">Ce code expire dans <strong>15 minutes</strong>.</p>
      </div>`,
    });
    return res.status(200).json({ status: "ok", msg: "Code envoyé par email" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// POST /api/users/reset-password
// ============================================================
router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ status: "notok", msg: "Tous les champs sont obligatoires" });
  if (newPassword.length < 8) return res.status(400).json({ status: "notok", msg: "Le mot de passe doit contenir au moins 8 caractères" });
  const entry = resetCodes[email.toLowerCase()];
  if (!entry) return res.status(400).json({ status: "notok", msg: "Aucun code demandé pour cet email" });
  if (Date.now() > entry.expiry) {
    delete resetCodes[email.toLowerCase()];
    return res.status(400).json({ status: "expired", msg: "Le code a expiré. Demandez un nouveau code." });
  }
  if (entry.code !== code) return res.status(400).json({ status: "notok", msg: "Code incorrect" });
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ status: "notok", msg: "Utilisateur introuvable" });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    delete resetCodes[email.toLowerCase()];
    return res.status(200).json({ status: "ok", msg: "Mot de passe réinitialisé avec succès" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// POST /api/users/demande-reset — Personnel demande reset
// ============================================================
router.post("/demande-reset", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ status: "notok", msg: "Email requis" });
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(200).json({ status: "ok", msg: "Demande envoyée à l'administrateur" });
    if (!["support", "team_lead"].includes(user.role)) {
      return res.status(400).json({ status: "notok", msg: "Cette fonctionnalité est réservée au personnel" });
    }
    demandesReset[email.toLowerCase()] = {
      userId: user._id,
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      role: user.role,
      createdAt: new Date(),
    };
    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      await sendEmail({
        to: admin.email,
        subject: "devapp — Demande de réinitialisation de mot de passe",
        html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
          <h2 style="color:#111827">Demande de réinitialisation</h2>
          <p>Bonjour <strong>Administrateur</strong>,</p>
          <p><strong>${user.prenom} ${user.nom}</strong> a demandé une réinitialisation de mot de passe.</p>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0">
            <p><strong>Email :</strong> ${user.email}</p>
            <p><strong>Rôle :</strong> ${user.role === "team_lead" ? "Chef d'équipe" : "Agent Support"}</p>
          </div>
          <a href="http://localhost:3000/admin/dashboard" style="display:inline-block;padding:12px 24px;background:#111827;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Accéder au panel admin →</a>
        </div>`,
      });
    }
    return res.status(200).json({ status: "ok", msg: "Demande envoyée à l'administrateur. Il vous contactera bientôt." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// GET /api/users/demandes-reset — Admin voit les demandes
// ============================================================
router.get("/demandes-reset", require("../../middleware/authMiddlware"), async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ status: "notok", msg: "Accès refusé" });
  const demandes = Object.values(demandesReset);
  res.status(200).json({ status: "ok", demandes });
});

module.exports = router;