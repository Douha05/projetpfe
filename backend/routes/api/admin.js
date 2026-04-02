const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const sendEmail = require("../../utils/sendEmail");
const adminMiddleware = require("../../middleware/adminMiddleware");
const managerMiddleware = require("../../middleware/managerMiddleware");

const generateTempPassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// ============================================================
// POST /api/admin/create-user — Admin crée support/team_lead
// ============================================================
router.post("/create-user", adminMiddleware, async (req, res) => {
  const { nom, prenom, email, telephone, departement, role } = req.body;
  if (!nom || !prenom || !email || !telephone || !role) {
    return res.status(400).json({ status: "notok", msg: "Tous les champs obligatoires doivent être remplis" });
  }
  if (!["support", "team_lead"].includes(role)) {
    return res.status(400).json({ status: "notok", msg: "Rôle invalide" });
  }
  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ status: "notokmail", msg: "Un compte avec cet email existe déjà" });
    }
    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);
    const newUser = new User({
      nom, prenom, email: email.toLowerCase(),
      telephone, departement: departement || "",
      password: hashedPassword, role, isActive: true,
      mustChangePassword: true,
    });
    await newUser.save();
    await sendEmail({
      to: email,
      subject: "devapp - Vos accès au portail personnel",
      html: `<div style="font-family:sans-serif;padding:24px;border:1px solid #e5e7eb;border-radius:12px;max-width:500px;margin:auto">
        <h2 style="color:#111827">Bienvenue sur devapp !</h2>
        <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
        <p>Un compte a été créé avec le rôle <strong>${role === "team_lead" ? "Chef d'équipe" : "Agent Support"}</strong>.</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0">
          <p><strong>Email :</strong> ${email.toLowerCase()}</p>
          <p><strong>Mot de passe temporaire :</strong> <span style="background:#111827;color:#fff;padding:4px 12px;border-radius:6px;font-family:monospace">${tempPassword}</span></p>
        </div>
        <p style="color:#92400e;font-size:13px">⚠️ Changez ce mot de passe dès votre première connexion.</p>
        <a href="http://localhost:3000/login-personnel" style="display:inline-block;padding:12px 24px;background:#111827;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Accéder au portail →</a>
      </div>`,
    });
    return res.status(201).json({ status: "ok", msg: `Compte créé ! Email envoyé à ${email}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// POST /api/admin/create-client — Admin OU Team Lead crée un client
// ============================================================
router.post("/create-client", managerMiddleware, async (req, res) => {
  const { nom, prenom, email, telephone } = req.body;
  if (!nom || !prenom || !email || !telephone) {
    return res.status(400).json({ status: "notok", msg: "Tous les champs sont obligatoires" });
  }
  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ status: "notokmail", msg: "Un compte avec cet email existe déjà" });
    }
    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);
    const newUser = new User({
      nom, prenom, email: email.toLowerCase(),
      telephone, departement: "",
      password: hashedPassword, role: "client",
      isActive: true, mustChangePassword: true,
    });
    await newUser.save();
    await sendEmail({
      to: email,
      subject: "devapp - Vos accès au Portail Client",
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
          <h2 style="color:#111827">Bienvenue sur devapp !</h2>
          <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
          <p>Un compte client a été créé pour vous.</p>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:20px 0">
            <p><strong>Email :</strong> ${email.toLowerCase()}</p>
            <p><strong>Mot de passe temporaire :</strong>
              <span style="background:#111827;color:#fff;padding:4px 12px;border-radius:6px;font-family:monospace">${tempPassword}</span>
            </p>
          </div>
          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px;margin-bottom:20px">
            <p style="color:#92400e;font-size:13px;margin:0">⚠️ Changez ce mot de passe dès votre première connexion.</p>
          </div>
          <a href="http://localhost:3000/login" style="display:inline-block;padding:12px 28px;background:#22c55e;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Accéder au Portail Client →
          </a>
        </div>
      `,
    });
    return res.status(201).json({ status: "ok", msg: `Compte client créé ! Email envoyé à ${email}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// GET /api/admin/users — Admin ET Team Lead (pour dropdown assignation)
// ============================================================
router.get("/users", managerMiddleware, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({ status: "ok", users });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/admin/users/:id/edit
// ============================================================
router.put("/users/:id/edit", adminMiddleware, async (req, res) => {
  const { nom, prenom, email, telephone, departement } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: "notok", msg: "Utilisateur introuvable" });
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
// PUT /api/admin/users/:id/role
// ============================================================
router.put("/users/:id/role", adminMiddleware, async (req, res) => {
  const { role } = req.body;
  if (!["support", "team_lead", "client"].includes(role)) {
    return res.status(400).json({ status: "notok", msg: "Rôle invalide" });
  }
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ status: "notok", msg: "Utilisateur introuvable" });
    res.status(200).json({ status: "ok", msg: "Rôle mis à jour", user });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/admin/users/:id/toggle
// ============================================================
router.put("/users/:id/toggle", adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: "notok", msg: "Utilisateur introuvable" });
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ status: "ok", msg: "Statut mis à jour", user });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// POST /api/admin/users/:id/reset-password
// ============================================================
router.post("/users/:id/reset-password", adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: "notok", msg: "Utilisateur introuvable" });
    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(tempPassword, salt);
    user.mustChangePassword = true;
    await user.save();
    await sendEmail({
      to: user.email,
      subject: "devapp - Reinitialisation de votre mot de passe",
      html: `<div style="font-family:sans-serif;padding:24px">
        <h2>Reinitialisation de mot de passe</h2>
        <p>Bonjour <strong>${user.prenom} ${user.nom}</strong>,</p>
        <p>Nouveau mot de passe temporaire : <strong style="background:#111827;color:#fff;padding:4px 12px;border-radius:6px;font-family:monospace">${tempPassword}</strong></p>
        <p style="color:#92400e">Changez ce mot de passe dès votre prochaine connexion.</p>
        <a href="${user.role === "client" ? "http://localhost:3000/login" : "http://localhost:3000/login-personnel"}" style="display:inline-block;padding:12px 24px;background:#111827;color:#fff;border-radius:8px;text-decoration:none">Accéder au portail</a>
      </div>`,
    });
    res.status(200).json({ status: "ok", msg: "Mot de passe reinitialise et envoye par email" });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// DELETE /api/admin/users/:id
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

// ============================================================
// GET /api/admin/clients — Admin OU Team Lead
// ============================================================
router.get("/clients", managerMiddleware, async (req, res) => {
  try {
    const clients = await User.find({ role: "client" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json({ status: "ok", clients });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/admin/clients/:id/edit — Admin OU Team Lead
// ============================================================
router.put("/clients/:id/edit", managerMiddleware, async (req, res) => {
  const { nom, prenom, email, telephone } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "client")
      return res.status(404).json({ status: "notok", msg: "Client introuvable" });
    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(400).json({ status: "notokmail", msg: "Cet email est déjà utilisé" });
    }
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (email) user.email = email.toLowerCase();
    if (telephone) user.telephone = telephone;
    await user.save();
    const updated = await User.findById(user._id).select("-password");
    res.status(200).json({ status: "ok", msg: "Client mis à jour", user: updated });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/admin/clients/:id/toggle — Admin OU Team Lead
// ============================================================
router.put("/clients/:id/toggle", managerMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "client")
      return res.status(404).json({ status: "notok", msg: "Client introuvable" });
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ status: "ok", msg: "Statut mis à jour", user });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// DELETE /api/admin/clients/:id — Admin OU Team Lead
// ============================================================
router.delete("/clients/:id", managerMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "client")
      return res.status(404).json({ status: "notok", msg: "Client introuvable" });
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: "ok", msg: "Client supprimé avec succès" });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

module.exports = router;