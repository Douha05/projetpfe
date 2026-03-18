const router = require("express").Router();
const bcrypt = require("bcryptjs");
const config = require("config");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const sendEmail = require("../../utils/sendEmail");

// Stockage temporaire des codes (en production utiliser Redis)
const resetCodes = {};

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
    const newUser = new User({ nom, prenom, email: email.toLowerCase(), telephone, password, role: "client" });
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        newUser.password = hash;
        newUser.save().then((saved) => {
          jwt.sign({ id: saved._id, role: saved.role }, config.get("jwtSecret"), { expiresIn: config.get("tokenExpire") }, (err, token) => {
            return res.status(200).json({ status: "ok", msg: "Compte créé avec succès", token, user: { id: saved._id, nom: saved.nom, prenom: saved.prenom, email: saved.email, role: saved.role } });
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
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (!isMatch) return res.status(400).json({ status: "notok", msg: "Email ou mot de passe incorrect" });
      jwt.sign({ id: user._id, role: user.role }, config.get("jwtSecret"), { expiresIn: config.get("tokenExpire") }, (err, token) => {
        return res.status(200).json({ status: "ok", msg: "Connexion réussie", token, user: { id: user._id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role } });
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
// POST /api/users/forgot-password — Envoyer code par email
// ============================================================
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ status: "notok", msg: "Email requis" });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Sécurité : ne pas révéler si l'email existe
      return res.status(200).json({ status: "ok", msg: "Si cet email existe, un code a été envoyé" });
    }

    // Générer code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    resetCodes[email.toLowerCase()] = { code, expiry };

    // Envoyer email
    await sendEmail({
      to: user.email,
      subject: "devapp — Code de réinitialisation de mot de passe",
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
          <h2 style="color:#111827">Réinitialisation de mot de passe</h2>
          <p style="color:#374151;font-size:15px">Bonjour <strong>${user.prenom}</strong>,</p>
          <p style="color:#374151;font-size:15px">Voici votre code de vérification :</p>
          <div style="text-align:center;margin:24px 0">
            <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#111827;background:#f3f4f6;padding:16px 24px;border-radius:12px">
              ${code}
            </span>
          </div>
          <p style="color:#6b7280;font-size:13px">Ce code expire dans <strong>15 minutes</strong>.</p>
          <p style="color:#6b7280;font-size:13px">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px">© 2026 devapp</p>
        </div>
      `,
    });

    return res.status(200).json({ status: "ok", msg: "Code envoyé par email" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// POST /api/users/reset-password — Vérifier code + nouveau mdp
// ============================================================
router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ status: "notok", msg: "Tous les champs sont obligatoires" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ status: "notok", msg: "Le mot de passe doit contenir au moins 8 caractères" });
  }

  const entry = resetCodes[email.toLowerCase()];

  if (!entry) {
    return res.status(400).json({ status: "notok", msg: "Aucun code demandé pour cet email" });
  }

  if (Date.now() > entry.expiry) {
    delete resetCodes[email.toLowerCase()];
    return res.status(400).json({ status: "expired", msg: "Le code a expiré. Demandez un nouveau code." });
  }

  if (entry.code !== code) {
    return res.status(400).json({ status: "notok", msg: "Code incorrect" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ status: "notok", msg: "Utilisateur introuvable" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    user.password = hash;
    await user.save();

    delete resetCodes[email.toLowerCase()];

    return res.status(200).json({ status: "ok", msg: "Mot de passe réinitialisé avec succès" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

module.exports = router;