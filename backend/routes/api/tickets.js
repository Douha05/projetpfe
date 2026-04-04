const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Ticket = require("../../models/Ticket");
const Notification = require("../../models/Notification");
const User = require("../../models/User");
const Workflow = require("../../models/Workflow");
const authMiddleware = require("../../middleware/authMiddlware");

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
  else cb(new Error("Format non supporté."));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

// POST /api/tickets
router.post("/", authMiddleware, upload.array("fichiers", 5), async (req, res) => {
  const { titre, description, type, priorite } = req.body;
  if (!titre || !description || !type)
    return res.status(400).json({ status: "notok", msg: "Titre, description et type sont obligatoires" });
  try {
    const fichiers = (req.files || []).map((f) => ({
      nom: f.originalname, chemin: `/uploads/${f.filename}`,
      type: f.mimetype.startsWith("video") ? "video" : "image", taille: f.size,
    }));
    const ticket = new Ticket({ titre, description, type, priorite: priorite || "medium", reporter: req.user.id, statut: "ready_for_support", fichiers });
    await ticket.save();
    const teamLeads = await User.find({ role: "team_lead", isActive: true });
    if (teamLeads.length > 0) {
      await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `Nouveau ticket : "${titre}"`, type: "nouveau_ticket", lu: false })));
    }
    return res.status(201).json({ status: "ok", msg: "Ticket créé avec succès", ticket });
  } catch (err) {
    console.error("ERREUR:", err);
    return res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// GET /api/tickets/mes-tickets
router.get("/mes-tickets", authMiddleware, (req, res) => {
  Ticket.find({ reporter: req.user.id })
    .populate("assignee", "nom prenom email").sort({ createdAt: -1 })
    .then((tickets) => res.status(200).json({ status: "ok", tickets }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// GET /api/tickets/assignes
router.get("/assignes", authMiddleware, (req, res) => {
  Ticket.find({ assignee: req.user.id })
    .populate("reporter", "nom prenom email").populate("assignee", "nom prenom email").sort({ createdAt: -1 })
    .then((tickets) => res.status(200).json({ status: "ok", tickets }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// GET /api/tickets/equipe
router.get("/equipe", authMiddleware, (req, res) => {
  Ticket.find({ statut: { $nin: ["cancelled"] } })
    .populate("reporter", "nom prenom email").populate("assignee", "nom prenom email").sort({ createdAt: -1 })
    .then((tickets) => res.status(200).json({ status: "ok", tickets }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// GET /api/tickets/tous
router.get("/tous", authMiddleware, (req, res) => {
  Ticket.find()
    .populate("reporter", "nom prenom email").populate("assignee", "nom prenom email").sort({ createdAt: -1 })
    .then((tickets) => res.status(200).json({ status: "ok", tickets }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// GET /api/tickets/stats
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
      bloques: tous.filter((t) => t.bloque).length,
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

// GET /api/tickets/:id
router.get("/:id", authMiddleware, (req, res) => {
  Ticket.findById(req.params.id)
    .populate("reporter", "nom prenom email").populate("assignee", "nom prenom email")
    .populate("commentaires.auteur", "nom prenom role").populate("escalade.escaladePar", "nom prenom")
    .populate("bloquePar", "nom prenom").populate("forcedResoluPar", "nom prenom").populate("dernierReouvertPar", "nom prenom")
    .then((ticket) => {
      if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
      res.status(200).json({ status: "ok", ticket });
    })
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// POST /api/tickets/:id/commentaires
router.post("/:id/commentaires", authMiddleware, async (req, res) => {
  const { contenu } = req.body;
  if (!contenu || !contenu.trim()) return res.status(400).json({ status: "notok", msg: "Commentaire vide" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    ticket.commentaires.push({ auteur: req.user.id, contenu: contenu.trim() });
    await ticket.save();
    if (ticket.reporter.toString() === req.user.id && ticket.assignee)
      await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `Le client a ajouté un commentaire sur : "${ticket.titre}"`, type: "nouveau_commentaire", lu: false });
    if (ticket.reporter.toString() !== req.user.id)
      await Notification.create({ destinataire: ticket.reporter, ticket: ticket._id, message: `Nouveau commentaire sur votre ticket : "${ticket.titre}"`, type: "nouveau_commentaire", lu: false });
    const populated = await Ticket.findById(ticket._id).populate("commentaires.auteur", "nom prenom role");
    res.status(200).json({ status: "ok", msg: "Commentaire ajouté", ticket: populated });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// DELETE /api/tickets/:id/commentaires/:commentId
router.delete("/:id/commentaires/:commentId", authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    const commentaire = ticket.commentaires.id(req.params.commentId);
    if (!commentaire) return res.status(404).json({ status: "notok", msg: "Commentaire non trouvé" });
    if (commentaire.auteur.toString() !== req.user.id) return res.status(403).json({ status: "notok", msg: "Accès refusé" });
    ticket.commentaires.pull({ _id: req.params.commentId });
    await ticket.save();
    const populated = await Ticket.findById(ticket._id).populate("commentaires.auteur", "nom prenom role");
    res.status(200).json({ status: "ok", msg: "Commentaire supprimé", ticket: populated });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// PUT /api/tickets/:id/statut
router.put("/:id/statut", authMiddleware, async (req, res) => {
  const { statut } = req.body;
  const valides = ["in_progress", "ready_for_customer", "cancelled"];
  if (!valides.includes(statut)) return res.status(400).json({ status: "notok", msg: "Statut invalide" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (ticket.bloque && req.user.role !== "admin")
      return res.status(403).json({ status: "notok", msg: "🔒 Ce ticket est bloqué par l'administrateur." });
    const workflowDoc = await Workflow.findOne();
    if (workflowDoc) {
      const transition = workflowDoc.transitions.find((t) => t.de === ticket.statut && t.vers === statut);
      if (transition) {
        if (!transition.active) return res.status(403).json({ status: "notok", msg: "Cette transition est désactivée par l'administrateur." });
        if (!transition.rolesAutorises.includes(req.user.role)) return res.status(403).json({ status: "notok", msg: "Vous n'êtes pas autorisé à effectuer cette transition." });
      }
    }
    ticket.statut = statut;
    await ticket.save();
    if (statut === "in_progress") {
      await Notification.create({ destinataire: ticket.reporter, ticket: ticket._id, message: `Votre ticket "${ticket.titre}" est en cours de traitement par notre équipe.`, type: "statut_change", lu: false });
    }
    if (statut === "ready_for_customer") {
      await Notification.create({ destinataire: ticket.reporter, ticket: ticket._id, message: `Une solution a été proposée pour votre ticket : "${ticket.titre}". Veuillez confirmer si le problème est résolu.`, type: "confirmation_demandee", lu: false });
    }
    res.status(200).json({ status: "ok", msg: "Statut mis à jour", ticket });
  } catch (err) {
    console.error("ERREUR STATUT:", err.message);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// PUT /api/tickets/:id/bloquer
router.put("/:id/bloquer", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ status: "notok", msg: "Accès refusé — admin uniquement" });
  const { bloquer, raison } = req.body;
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (bloquer) {
      ticket.bloque = true; ticket.bloqueRaison = raison || "";
      ticket.bloqueAt = new Date(); ticket.bloquePar = req.user.id;
    } else {
      ticket.bloque = false; ticket.bloqueRaison = "";
      ticket.bloqueAt = null; ticket.bloquePar = null;
    }
    await ticket.save();
    // Notifier l'agent
    if (ticket.assignee) {
      await Notification.create({
        destinataire: ticket.assignee, ticket: ticket._id,
        message: bloquer
          ? `🔒 Votre ticket "${ticket.titre}" a été bloqué par l'administrateur${raison ? ` : ${raison}` : ""}.`
          : `🔓 Votre ticket "${ticket.titre}" a été débloqué par l'administrateur.`,
        type: "statut_change", lu: false,
      });
    }
    // Notifier le client
    await Notification.create({
      destinataire: ticket.reporter, ticket: ticket._id,
      message: bloquer
        ? `Votre ticket "${ticket.titre}" est temporairement bloqué en attente d'investigation.`
        : `Votre ticket "${ticket.titre}" est débloqué et reprend son traitement normal.`,
      type: "statut_change", lu: false,
    });
    // Notifier les chefs d'équipe
    const teamLeads = await User.find({ role: "team_lead", isActive: true });
    if (teamLeads.length > 0) {
      await Notification.insertMany(teamLeads.map((tl) => ({
        destinataire: tl._id, ticket: ticket._id,
        message: bloquer
          ? `🔒 Admin a bloqué le ticket : "${ticket.titre}"${raison ? ` — ${raison}` : ""}`
          : `🔓 Admin a débloqué le ticket : "${ticket.titre}"`,
        type: "statut_change", lu: false,
      })));
    }
    res.status(200).json({ status: "ok", msg: bloquer ? "Ticket bloqué" : "Ticket débloqué", ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// PUT /api/tickets/:id/forcer-resolu
router.put("/:id/forcer-resolu", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ status: "notok", msg: "Accès refusé — admin uniquement" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (["solved", "closed", "cancelled"].includes(ticket.statut))
      return res.status(400).json({ status: "notok", msg: "Ce ticket est déjà résolu ou fermé" });
    ticket.statut = "solved"; ticket.forcedResolu = true;
    ticket.forcedResoluAt = new Date(); ticket.forcedResoluPar = req.user.id; ticket.bloque = false;
    await ticket.save();
    if (ticket.assignee) {
      await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `✅ L'admin a forcé la résolution du ticket : "${ticket.titre}"`, type: "ticket_resolu", lu: false });
    }
    await Notification.create({ destinataire: ticket.reporter, ticket: ticket._id, message: `Votre ticket "${ticket.titre}" a été marqué comme résolu par l'administrateur.`, type: "ticket_resolu", lu: false });
    const teamLeads = await User.find({ role: "team_lead", isActive: true });
    if (teamLeads.length > 0) {
      await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `✅ Admin a forcé la résolution du ticket : "${ticket.titre}"`, type: "ticket_resolu", lu: false })));
    }
    res.status(200).json({ status: "ok", msg: "Ticket forcé comme résolu", ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// PUT /api/tickets/:id/reuvrir
router.put("/:id/reuvrir", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ status: "notok", msg: "Accès refusé — admin uniquement" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (!["solved", "closed", "cancelled"].includes(ticket.statut))
      return res.status(400).json({ status: "notok", msg: "Seuls les tickets résolus, fermés ou annulés peuvent être réouverts" });
    ticket.statut = "ready_for_support"; ticket.bloque = false; ticket.forcedResolu = false;
    ticket.reouverts = (ticket.reouverts || 0) + 1;
    ticket.dernierReouvertAt = new Date(); ticket.dernierReouvertPar = req.user.id;
    await ticket.save();
    if (ticket.assignee) {
      await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `🔄 Le ticket "${ticket.titre}" a été réouvert par l'administrateur.`, type: "nouveau_ticket", lu: false });
    }
    await Notification.create({ destinataire: ticket.reporter, ticket: ticket._id, message: `Votre ticket "${ticket.titre}" a été réouvert. Notre équipe va reprendre le traitement.`, type: "nouveau_ticket", lu: false });
    const teamLeads = await User.find({ role: "team_lead", isActive: true });
    if (teamLeads.length > 0) {
      await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `🔄 Admin a réouvert le ticket : "${ticket.titre}"`, type: "nouveau_ticket", lu: false })));
    }
    res.status(200).json({ status: "ok", msg: "Ticket réouvert avec succès", ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// PUT /api/tickets/:id/prendre
router.put("/:id/prendre", authMiddleware, async (req, res) => {
  if (req.user.role !== "support") return res.status(403).json({ status: "notok", msg: "Accès refusé" });
  try {
    const ticket = await Ticket.findById(req.params.id).populate("assignee", "nom prenom email").populate("reporter", "nom prenom email");
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (ticket.bloque) return res.status(403).json({ status: "notok", msg: "🔒 Ce ticket est bloqué par l'administrateur." });
    const agentActuel = await User.findById(req.user.id);
    const ancienAssignee = ticket.assignee;
    if (ancienAssignee && ancienAssignee._id.toString() === req.user.id)
      return res.status(400).json({ status: "notok", msg: "Ce ticket vous est déjà assigné" });
    ticket.assignee = req.user.id;
    if (ticket.statut === "escalated") ticket.statut = "ready_for_support";
    await ticket.save();
    const teamLeads = await User.find({ role: "team_lead", isActive: true });
    if (ancienAssignee) {
      if (teamLeads.length > 0) {
        await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `🔄 ${agentActuel.prenom} ${agentActuel.nom} a pris le ticket "${ticket.titre}" assigné à ${ancienAssignee.prenom} ${ancienAssignee.nom}`, type: "ticket_assigne", lu: false })));
      }
      await Notification.create({ destinataire: ancienAssignee._id, ticket: ticket._id, message: `🔄 ${agentActuel.prenom} ${agentActuel.nom} a pris votre ticket : "${ticket.titre}"`, type: "ticket_assigne", lu: false });
    } else {
      if (teamLeads.length > 0) {
        await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `✅ ${agentActuel.prenom} ${agentActuel.nom} s'est auto-assigné le ticket : "${ticket.titre}"`, type: "ticket_assigne", lu: false })));
      }
    }
    res.status(200).json({ status: "ok", msg: "Ticket pris en charge", ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// PUT /api/tickets/:id/escalader
router.put("/:id/escalader", authMiddleware, async (req, res) => {
  if (req.user.role !== "support") return res.status(403).json({ status: "notok", msg: "Accès refusé" });
  const { raison, urgence } = req.body;
  if (!raison || !raison.trim()) return res.status(400).json({ status: "notok", msg: "La raison est obligatoire" });
  if (!["normal", "urgent", "critique"].includes(urgence)) return res.status(400).json({ status: "notok", msg: "Niveau d'urgence invalide" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (ticket.bloque) return res.status(403).json({ status: "notok", msg: "🔒 Ce ticket est bloqué par l'administrateur." });
    ticket.statut = "escalated";
    ticket.escalade = { raison: raison.trim(), urgence, escaladePar: req.user.id, escaladeAt: new Date() };
    await ticket.save();
    const teamLeads = await User.find({ role: "team_lead", isActive: true });
    if (teamLeads.length > 0) {
      await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `⚠️ Ticket escaladé [${urgence.toUpperCase()}] : "${ticket.titre}" — ${raison.substring(0, 60)}`, type: "ticket_escalade", lu: false })));
    }
    await Notification.create({ destinataire: ticket.reporter, ticket: ticket._id, message: `Votre ticket "${ticket.titre}" a été transmis au chef d'équipe.`, type: "ticket_escalade", lu: false });
    res.status(200).json({ status: "ok", msg: "Ticket escaladé avec succès", ticket });
  } catch (err) {
    console.error(err); res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// PUT /api/tickets/:id/temps
router.put("/:id/temps", authMiddleware, async (req, res) => {
  const { temps } = req.body;
  if (!temps || isNaN(temps) || temps <= 0) return res.status(400).json({ status: "notok", msg: "Temps invalide" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    ticket.tempsPassé = (ticket.tempsPassé || 0) + parseInt(temps);
    await ticket.save();
    res.status(200).json({ status: "ok", msg: "Temps enregistré", ticket });
  } catch { res.status(500).json({ status: "error", msg: "Erreur serveur" }); }
});

// PUT /api/tickets/:id/assigner
router.put("/:id/assigner", authMiddleware, async (req, res) => {
  const { assigneeId } = req.body;
  if (!assigneeId) return res.status(400).json({ status: "notok", msg: "Agent requis" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    ticket.assignee = assigneeId;
    if (ticket.statut === "escalated") ticket.statut = "ready_for_support";
    await ticket.save();
    await Notification.create({ destinataire: assigneeId, ticket: ticket._id, message: `Un ticket vous a été assigné : "${ticket.titre}"`, type: "ticket_assigne", lu: false });
    res.status(200).json({ status: "ok", msg: "Ticket assigné", ticket });
  } catch { res.status(500).json({ status: "error", msg: "Erreur serveur" }); }
});

// PUT /api/tickets/:id/priorite
router.put("/:id/priorite", authMiddleware, async (req, res) => {
  const { priorite } = req.body;
  if (!["low", "medium", "high", "critical"].includes(priorite))
    return res.status(400).json({ status: "notok", msg: "Priorité invalide" });
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { priorite }, { new: true });
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    res.status(200).json({ status: "ok", msg: "Priorité mise à jour", ticket });
  } catch { res.status(500).json({ status: "error", msg: "Erreur serveur" }); }
});

// PUT /api/tickets/:id/confirmer
router.put("/:id/confirmer", authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (ticket.statut !== "ready_for_customer")
      return res.status(400).json({ status: "notok", msg: "Le ticket n'est pas en attente de confirmation" });
    ticket.statut = "solved";
    await ticket.save();
    if (ticket.assignee)
      await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `Le client a confirmé la solution du ticket : "${ticket.titre}"`, type: "ticket_resolu", lu: false });
    const teamLeads = await User.find({ role: "team_lead", isActive: true });
    if (teamLeads.length > 0) {
      await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `Ticket résolu — le client a confirmé : "${ticket.titre}"`, type: "ticket_resolu", lu: false })));
    }
    res.status(200).json({ status: "ok", msg: "Solution confirmée", ticket });
  } catch { res.status(500).json({ status: "error", msg: "Erreur serveur" }); }
});

// PUT /api/tickets/:id/fermer
router.put("/:id/fermer", authMiddleware, (req, res) => {
  Ticket.findById(req.params.id)
    .then((ticket) => {
      if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
      if (ticket.reporter.toString() !== req.user.id) return res.status(403).json({ status: "notok", msg: "Accès refusé" });
      ticket.statut = "closed";
      return ticket.save();
    })
    .then((ticket) => res.status(200).json({ status: "ok", msg: "Ticket fermé", ticket }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// POST /api/tickets/:id/feedback
router.post("/:id/feedback", authMiddleware, async (req, res) => {
  const { note, message } = req.body;
  if (!note || note < 1 || note > 5) return res.status(400).json({ status: "notok", msg: "Note invalide (1 à 5)" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (ticket.reporter.toString() !== req.user.id) return res.status(403).json({ status: "notok", msg: "Accès refusé" });
    if (!["solved", "closed"].includes(ticket.statut)) return res.status(400).json({ status: "notok", msg: "Feedback uniquement sur ticket résolu ou fermé" });
    ticket.feedback = { note, message: message || "" };
    await ticket.save();
    const adminsEtChefs = await User.find({ role: { $in: ["admin", "team_lead"] }, isActive: true });
    if (adminsEtChefs.length > 0) {
      await Notification.insertMany(adminsEtChefs.map(u => ({ destinataire: u._id, ticket: ticket._id, message: `⭐ Feedback reçu (${note}/5) sur : "${ticket.titre}"${message ? ` — "${message}"` : ""}`, type: "nouveau_commentaire", lu: false })));
    }
    if (ticket.assignee) {
      await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `⭐ Le client a donné ${note}/5 sur : "${ticket.titre}"`, type: "nouveau_commentaire", lu: false });
    }
    res.status(200).json({ status: "ok", msg: "Feedback enregistré", ticket });
  } catch (err) {
    console.error(err); res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// PUT /api/tickets/:id/modifier
router.put("/:id/modifier", authMiddleware, upload.array("fichiers", 5), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (ticket.reporter.toString() !== req.user.id) return res.status(403).json({ status: "notok", msg: "Accès refusé" });
    if (ticket.statut !== "ready_for_support" || ticket.assignee)
      return res.status(400).json({ status: "notok", msg: "Ce ticket ne peut plus être modifié." });
    const { titre, description, type, priorite } = req.body;
    if (!titre || !description || !type) return res.status(400).json({ status: "notok", msg: "Champs obligatoires manquants" });
    ticket.titre = titre; ticket.description = description; ticket.type = type;
    ticket.priorite = priorite || ticket.priorite;
    if (req.files && req.files.length > 0) {
      const newFichiers = req.files.map((f) => ({ nom: f.originalname, chemin: `/uploads/${f.filename}`, type: f.mimetype.startsWith("video") ? "video" : "image", taille: f.size }));
      ticket.fichiers = [...(ticket.fichiers || []), ...newFichiers].slice(0, 5);
    }
    await ticket.save();
    res.status(200).json({ status: "ok", msg: "Ticket modifié avec succès", ticket });
  } catch (err) {
    console.error(err); res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// DELETE /api/tickets/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (ticket.reporter.toString() !== req.user.id) return res.status(403).json({ status: "notok", msg: "Accès refusé" });
    if (ticket.statut !== "ready_for_support" || ticket.assignee)
      return res.status(400).json({ status: "notok", msg: "Ce ticket ne peut plus être supprimé." });
    await Ticket.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: "ok", msg: "Ticket supprimé avec succès" });
  } catch (err) {
    console.error(err); res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

module.exports = router;