const router = require("express").Router();
const bcrypt = require("bcryptjs");
const config = require("config");
const User = require("../../models/User");
const sendEmail = require("../../utils/sendEmail");
const adminMiddleware = require("../../middleware/adminMiddleware");

const generateTempPassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

router.post("/create-user", adminMiddleware, async (req, res) => {
  const { nom, prenom, email, telephone, departement, role } = req.body;
  if (!nom || !prenom || !email || !telephone || !role) {
    return res.status(400).json({ status: "notok", msg: "Tous les champs obligatoires doivent etre remplis" });
  }
  if (!["support", "team_lead"].includes(role)) {
    return res.status(400).json({ status: "notok", msg: "Role invalide" });
  }
  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ status: "notokmail", msg: "Un compte avec cet email existe deja" });
    }
    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);
    const newUser = new User({
      nom, prenom, email: email.toLowerCase(),
      telephone, departement: departement || "",
      password: hashedPassword, role, isActive: true, mustChangePassword: true,
    });
    await newUser.save();
    await sendEmail({
      to: email,
      subject: "devapp - Vos acces au portail personnel",
      html: `<div style="font-family:sans-serif;padding:24px">
        <h2>Bienvenue sur devapp !</h2>
        <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
        <p>Email : ${email.toLowerCase()}</p>
        <p>Mot de passe temporaire : <strong>${tempPassword}</strong></p>
        <a href="http://localhost:3000/login-personnel">Acceder au portail</a>
      </div>`,
    });
    return res.status(201).json({ status: "ok", msg: "Compte cree ! Email envoye a " + email });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

router.get("/users", adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({ status: "ok", users });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

router.put("/users/:id/role", adminMiddleware, async (req, res) => {
  const { role } = req.body;
  if (!["support", "team_lead", "client"].includes(role)) {
    return res.status(400).json({ status: "notok", msg: "Role invalide" });
  }
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ status: "notok", msg: "Utilisateur introuvable" });
    res.status(200).json({ status: "ok", msg: "Role mis a jour", user });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

router.put("/users/:id/toggle", adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: "notok", msg: "Utilisateur introuvable" });
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ status: "ok", msg: "Statut mis a jour", user });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/admin/users/:id — Modifier un utilisateur
// ============================================================
router.put("/users/:id", adminMiddleware, async (req, res) => {
  const { nom, prenom, email, telephone, departement } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: "notok", msg: "Utilisateur introuvable" });

    // Vérifier si email existe déjà pour un autre utilisateur
    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(400).json({ status: "notokmail", msg: "Cet email est deja utilise" });
    }

    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (email) user.email = email.toLowerCase();
    if (telephone) user.telephone = telephone;
    if (departement !== undefined) user.departement = departement;

    await user.save();
    const updated = await User.findById(user._id).select("-password");
    res.status(200).json({ status: "ok", msg: "Utilisateur mis a jour", user: updated });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// POST /api/admin/users/:id/reset-password — Réinitialiser mot de passe
// ============================================================
router.post("/users/:id/reset-password", adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: "notok", msg: "Utilisateur introuvable" });

    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(tempPassword, salt);
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "devapp - Reinitialisation de votre mot de passe",
      html: `<div style="font-family:sans-serif;padding:24px">
        <h2>Reinitialisation de mot de passe</h2>
        <p>Bonjour <strong>${user.prenom} ${user.nom}</strong>,</p>
        <p>Votre mot de passe a ete reinitialise par l'administrateur.</p>
        <p>Nouveau mot de passe temporaire : <strong style="background:#111827;color:#fff;padding:4px 12px;border-radius:6px;font-family:monospace">${tempPassword}</strong></p>
        <p style="color:#92400e">Changez ce mot de passe des votre prochaine connexion.</p>
        <a href="http://localhost:3000/login-personnel" style="display:inline-block;padding:12px 24px;background:#111827;color:#fff;border-radius:8px;text-decoration:none">Acceder au portail</a>
      </div>`,
    });

    res.status(200).json({ status: "ok", msg: "Mot de passe reinitialise et envoye par email" });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// DELETE /api/admin/users/:id — Supprimer un utilisateur
// ============================================================
router.delete("/users/:id", adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: "notok", msg: "Utilisateur introuvable" });
    if (user.role === "admin") {
      return res.status(403).json({ status: "notok", msg: "Impossible de supprimer un administrateur" });
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: "ok", msg: "Utilisateur supprime avec succes" });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

module.exports = router;