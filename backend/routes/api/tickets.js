const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Ticket = require("../../models/Ticket");
const Notification = require("../../models/Notification");
const User = require("../../models/User");
const Workflow = require("../../models/Workflow");
const authMiddleware = require("../../middleware/authMiddlware");

// ============================================================
// MULTER CONFIG
// ============================================================
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|webm|avi/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error("Format non supporté. Utilisez jpg, png, gif, webp, mp4, mov, webm"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ============================================================
// POST /api/tickets — Client crée un ticket (avec fichiers)
// ============================================================
router.post("/", authMiddleware, upload.array("fichiers", 5), async (req, res) => {
  console.log("=== NOUVEAU TICKET ===");
  console.log("FILES REÇUS:", req.files);
  console.log("BODY:", req.body);

  const { titre, description, type, priorite } = req.body;
  if (!titre || !description || !type) {
    return res.status(400).json({ status: "notok", msg: "Titre, description et type sont obligatoires" });
  }
  try {
    const fichiers = (req.files || []).map((f) => ({
      nom: f.originalname,
      chemin: `/uploads/${f.filename}`,
      type: f.mimetype.startsWith("video") ? "video" : "image",
      taille: f.size,
    }));

    console.log("FICHIERS MAPPES:", fichiers);

    const ticket = new Ticket({
      titre, description, type,
      priorite: priorite || "medium",
      reporter: req.user.id,
      statut: "ready_for_support",
      fichiers,
    });
    await ticket.save();

    console.log("TICKET SAUVEGARDE, fichiers:", ticket.fichiers);

    const teamLeads = await User.find({ role: "team_lead", isActive: true });
    if (teamLeads.length > 0) {
      await Notification.insertMany(teamLeads.map((tl) => ({
        destinataire: tl._id,
        ticket: ticket._id,
        message: `Nouveau ticket : "${titre}"`,
        type: "nouveau_ticket",
        lu: false,
      })));
    }
    return res.status(201).json({ status: "ok", msg: "Ticket créé avec succès", ticket });
  } catch (err) {
    console.error("ERREUR:", err);
    return res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// GET /api/tickets/mes-tickets
// ============================================================
router.get("/mes-tickets", authMiddleware, (req, res) => {
  Ticket.find({ reporter: req.user.id })
    .populate("assignee", "nom prenom email")
    .sort({ createdAt: -1 })
    .then((tickets) => res.status(200).json({ status: "ok", tickets }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// ============================================================
// GET /api/tickets/assignes
// ============================================================
router.get("/assignes", authMiddleware, (req, res) => {
  Ticket.find({ assignee: req.user.id })
    .populate("reporter", "nom prenom email")
    .populate("assignee", "nom prenom email")
    .sort({ createdAt: -1 })
    .then((tickets) => res.status(200).json({ status: "ok", tickets }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// ============================================================
// GET /api/tickets/tous
// ============================================================
router.get("/tous", authMiddleware, (req, res) => {
  Ticket.find()
    .populate("reporter", "nom prenom email")
    .populate("assignee", "nom prenom email")
    .sort({ createdAt: -1 })
    .then((tickets) => res.status(200).json({ status: "ok", tickets }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// ============================================================
// GET /api/tickets/stats
// ============================================================
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const tous = await Ticket.find().populate("assignee", "nom prenom email");
    const stats = {
      total: tous.length,
      enAttente: tous.filter((t) => t.statut === "ready_for_support").length,
      enCours: tous.filter((t) => t.statut === "in_progress").length,
      resolus: tous.filter((t) => ["solved", "closed"].includes(t.statut)).length,
      escalades: tous.filter((t) => t.statut === "escalated").length,
      nonAssignes: tous.filter((t) => !t.assignee).length,
    };
    const agents = await User.find({ role: "support", isActive: true });
    const statsByAgent = agents.map((agent) => ({
      agent,
      assigned: tous.filter((t) => t.assignee?._id.toString() === agent._id.toString()).length,
      inProgress: tous.filter((t) => t.assignee?._id.toString() === agent._id.toString() && t.statut === "in_progress").length,
      resolved: tous.filter((t) => t.assignee?._id.toString() === agent._id.toString() && ["solved", "closed"].includes(t.statut)).length,
    }));
    res.status(200).json({ status: "ok", stats, statsByAgent });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// GET /api/tickets/:id
// ============================================================
router.get("/:id", authMiddleware, (req, res) => {
  Ticket.findById(req.params.id)
    .populate("reporter", "nom prenom email")
    .populate("assignee", "nom prenom email")
    .populate("commentaires.auteur", "nom prenom role")
    .populate("escalade.escaladePar", "nom prenom")
    .then((ticket) => {
      if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
      res.status(200).json({ status: "ok", ticket });
    })
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// ============================================================
// POST /api/tickets/:id/commentaires
// ============================================================
router.post("/:id/commentaires", authMiddleware, async (req, res) => {
  const { contenu } = req.body;
  if (!contenu || !contenu.trim())
    return res.status(400).json({ status: "notok", msg: "Commentaire vide" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    ticket.commentaires.push({ auteur: req.user.id, contenu: contenu.trim() });
    await ticket.save();
    if (ticket.reporter.toString() === req.user.id && ticket.assignee) {
      await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `Le client a ajouté un commentaire sur : "${ticket.titre}"`, type: "nouveau_commentaire", lu: false });
    }
    if (ticket.reporter.toString() !== req.user.id) {
      await Notification.create({ destinataire: ticket.reporter, ticket: ticket._id, message: `Nouveau commentaire sur votre ticket : "${ticket.titre}"`, type: "nouveau_commentaire", lu: false });
    }
    const populated = await Ticket.findById(ticket._id).populate("commentaires.auteur", "nom prenom role");
    res.status(200).json({ status: "ok", msg: "Commentaire ajouté", ticket: populated });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// DELETE /api/tickets/:id/commentaires/:commentId
// ============================================================
router.delete("/:id/commentaires/:commentId", authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    const commentaire = ticket.commentaires.id(req.params.commentId);
    if (!commentaire) return res.status(404).json({ status: "notok", msg: "Commentaire non trouvé" });
    if (commentaire.auteur.toString() !== req.user.id)
      return res.status(403).json({ status: "notok", msg: "Accès refusé" });
    ticket.commentaires.pull({ _id: req.params.commentId });
    await ticket.save();
    const populated = await Ticket.findById(ticket._id).populate("commentaires.auteur", "nom prenom role");
    res.status(200).json({ status: "ok", msg: "Commentaire supprimé", ticket: populated });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/statut
// ============================================================
router.put("/:id/statut", authMiddleware, async (req, res) => {
  const { statut } = req.body;
  const valides = ["in_progress", "ready_for_customer", "cancelled"];
  if (!valides.includes(statut))
    return res.status(400).json({ status: "notok", msg: "Statut invalide" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });

    const workflowDoc = await Workflow.findOne();
    if (workflowDoc) {
      const transition = workflowDoc.transitions.find(
        (t) => t.de === ticket.statut && t.vers === statut
      );
      if (transition) {
        if (!transition.active)
          return res.status(403).json({ status: "notok", msg: "Cette transition est désactivée par l'administrateur." });
        if (!transition.rolesAutorises.includes(req.user.role))
          return res.status(403).json({ status: "notok", msg: "Vous n'êtes pas autorisé à effectuer cette transition." });
      }
    }

    ticket.statut = statut;
    await ticket.save();

    if (statut === "ready_for_customer") {
      await Notification.create({
        destinataire: ticket.reporter, ticket: ticket._id,
        message: `Une solution a été proposée pour votre ticket : "${ticket.titre}"`,
        type: "confirmation_demandee", lu: false,
      });
    }
    res.status(200).json({ status: "ok", msg: "Statut mis à jour", ticket });
  } catch (err) {
    console.error("ERREUR STATUT:", err.message);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/escalader
// ============================================================
router.put("/:id/escalader", authMiddleware, async (req, res) => {
  if (req.user.role !== "support")
    return res.status(403).json({ status: "notok", msg: "Accès refusé" });
  const { raison, urgence } = req.body;
  if (!raison || !raison.trim())
    return res.status(400).json({ status: "notok", msg: "La raison est obligatoire" });
  if (!["normal", "urgent", "critique"].includes(urgence))
    return res.status(400).json({ status: "notok", msg: "Niveau d'urgence invalide" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    ticket.statut = "escalated";
    ticket.escalade = { raison: raison.trim(), urgence, escaladePar: req.user.id, escaladeAt: new Date() };
    await ticket.save();
    const teamLeads = await User.find({ role: "team_lead", isActive: true });
    if (teamLeads.length > 0) {
      await Notification.insertMany(teamLeads.map((tl) => ({
        destinataire: tl._id, ticket: ticket._id,
        message: `⚠️ Ticket escaladé [${urgence.toUpperCase()}] : "${ticket.titre}" — ${raison.substring(0, 60)}`,
        type: "ticket_escalade", lu: false,
      })));
    }
    await Notification.create({
      destinataire: ticket.reporter, ticket: ticket._id,
      message: `Votre ticket "${ticket.titre}" a été transmis au chef d'équipe pour traitement.`,
      type: "ticket_escalade", lu: false,
    });
    res.status(200).json({ status: "ok", msg: "Ticket escaladé avec succès", ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/temps
// ============================================================
router.put("/:id/temps", authMiddleware, async (req, res) => {
  const { temps } = req.body;
  if (!temps || isNaN(temps) || temps <= 0)
    return res.status(400).json({ status: "notok", msg: "Temps invalide" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    ticket.tempsPassé = (ticket.tempsPassé || 0) + parseInt(temps);
    await ticket.save();
    res.status(200).json({ status: "ok", msg: "Temps enregistré", ticket });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/assigner
// ============================================================
router.put("/:id/assigner", authMiddleware, async (req, res) => {
  const { assigneeId } = req.body;
  if (!assigneeId) return res.status(400).json({ status: "notok", msg: "Agent requis" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    ticket.assignee = assigneeId;
    if (ticket.statut === "escalated") ticket.statut = "ready_for_support";
    await ticket.save();
    await Notification.create({
      destinataire: assigneeId, ticket: ticket._id,
      message: `Un ticket vous a été assigné : "${ticket.titre}"`,
      type: "ticket_assigne", lu: false,
    });
    res.status(200).json({ status: "ok", msg: "Ticket assigné", ticket });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/priorite
// ============================================================
router.put("/:id/priorite", authMiddleware, async (req, res) => {
  const { priorite } = req.body;
  if (!["low", "medium", "high", "critical"].includes(priorite))
    return res.status(400).json({ status: "notok", msg: "Priorité invalide" });
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { priorite }, { new: true });
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    res.status(200).json({ status: "ok", msg: "Priorité mise à jour", ticket });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/confirmer
// ============================================================
router.put("/:id/confirmer", authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (ticket.statut !== "ready_for_customer")
      return res.status(400).json({ status: "notok", msg: "Le ticket n'est pas en attente de confirmation" });
    ticket.statut = "solved";
    await ticket.save();
    if (ticket.assignee) {
      await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `Le client a confirmé la solution du ticket : "${ticket.titre}"`, type: "ticket_resolu", lu: false });
    }
    const teamLeads = await User.find({ role: "team_lead", isActive: true });
    if (teamLeads.length > 0) {
      await Notification.insertMany(teamLeads.map((tl) => ({
        destinataire: tl._id, ticket: ticket._id,
        message: `Ticket résolu — le client a confirmé la solution : "${ticket.titre}"`,
        type: "ticket_resolu", lu: false,
      })));
    }
    res.status(200).json({ status: "ok", msg: "Solution confirmée", ticket });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/fermer
// ============================================================
router.put("/:id/fermer", authMiddleware, (req, res) => {
  Ticket.findById(req.params.id)
    .then((ticket) => {
      if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
      if (ticket.reporter.toString() !== req.user.id)
        return res.status(403).json({ status: "notok", msg: "Accès refusé" });
      ticket.statut = "closed";
      return ticket.save();
    })
    .then((ticket) => res.status(200).json({ status: "ok", msg: "Ticket fermé", ticket }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// ============================================================
// POST /api/tickets/:id/feedback
// ============================================================
router.post("/:id/feedback", authMiddleware, (req, res) => {
  const { note, message } = req.body;
  if (!note || note < 1 || note > 5)
    return res.status(400).json({ status: "notok", msg: "Note invalide (1 à 5)" });
  Ticket.findById(req.params.id)
    .then((ticket) => {
      if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
      if (ticket.reporter.toString() !== req.user.id)
        return res.status(403).json({ status: "notok", msg: "Accès refusé" });
      if (!["solved", "closed"].includes(ticket.statut))
        return res.status(400).json({ status: "notok", msg: "Feedback uniquement sur ticket résolu ou fermé" });
      ticket.feedback = { note, message: message || "" };
      return ticket.save();
    })
    .then((ticket) => res.status(200).json({ status: "ok", msg: "Feedback enregistré", ticket }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

module.exports = router;