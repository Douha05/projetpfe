const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Ticket = require("../../models/Ticket");
const Notification = require("../../models/Notification");
const User = require("../../models/User");
const Workflow = require("../../models/Workflow");
const authMiddleware = require("../../middleware/authMiddlware");
const { sendPushNotification, sendPushToMany } = require("../../config/webpush");
const { lancerAnalyseComplete } = require("../../services/ia/indexIA"); // 🤖 IA

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

// ============================================================
// POST /api/tickets
// ============================================================
router.post("/", authMiddleware, upload.array("fichiers", 5), async (req, res) => {
  const { titre, description, type, priorite } = req.body;
  if (!titre || !description || !type)
    return res.status(400).json({ status: "notok", msg: "Titre, description et type sont obligatoires" });
  try {
    const fichiers = (req.files || []).map((f) => ({
      nom: f.originalname, chemin: `/uploads/${f.filename}`,
      type: f.mimetype.startsWith("video") ? "video" : "image", taille: f.size,
    }));

    const ticketsOuverts = await Ticket.countDocuments({
      reporter: req.user.id,
      statut: { $in: ["ready_for_support", "in_progress", "ready_for_customer", "escalated"] },
    });

    let prioriteFinale = priorite || "medium";
    let prioriteAutoAppliquee = false;

    if (ticketsOuverts >= 5) { prioriteFinale = "critical"; prioriteAutoAppliquee = true; }
    else if (ticketsOuverts >= 3) { prioriteFinale = "high"; prioriteAutoAppliquee = true; }

    const ticket = new Ticket({
      titre, description, type,
      priorite: prioriteFinale,
      reporter: req.user.id,
      statut: "ready_for_support",
      statutChangedAt: new Date(),
      fichiers,
    });
    await ticket.save();

    // 🤖 Lancer l'analyse IA en arrière-plan (sans bloquer la réponse)
    lancerAnalyseComplete(ticket._id).catch(err =>
      console.error("❌ Erreur IA arrière-plan:", err.message)
    );

    const teamLeads = await User.find({ role: "team_lead", isActive: true });
    if (teamLeads.length > 0) {
      await Notification.insertMany(teamLeads.map((tl) => ({
        destinataire: tl._id, ticket: ticket._id,
        message: `Nouveau ticket : "${titre}"`,
        type: "nouveau_ticket", lu: false,
      })));
      await sendPushToMany(
        teamLeads.map(tl => tl._id),
        `🎫 Nouveau ticket`,
        `"${titre}" — Priorité ${prioriteFinale}`
      );
    }

    if (prioriteAutoAppliquee && teamLeads.length > 0) {
      const client = await User.findById(req.user.id);
      const labelPriorite = prioriteFinale === "critical" ? "Critique 🔴" : "Haute 🔺";
      await Notification.insertMany(teamLeads.map((tl) => ({
        destinataire: tl._id, ticket: ticket._id,
        message: `⚡ Priorité automatique — ${labelPriorite} : le client "${client.prenom} ${client.nom}" a ${ticketsOuverts} tickets ouverts.`,
        type: "nouveau_ticket", lu: false,
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
    .populate("reporter", "nom prenom email")
    .populate("assignee", "nom prenom email")
    .sort({ createdAt: -1 })
    .then((tickets) => res.status(200).json({ status: "ok", tickets }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// ============================================================
// GET /api/tickets/assignes
// ============================================================
router.get("/assignes", authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find({ assignee: req.user.id })
      .populate("reporter", "nom prenom email")
      .populate("assignee", "nom prenom email")
      .sort({ createdAt: -1 });
    res.status(200).json({ status: "ok", tickets });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// GET /api/tickets/equipe
// ============================================================
router.get("/equipe", authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find({ statut: { $nin: ["cancelled"] } })
      .populate("reporter", "nom prenom email")
      .populate("assignee", "nom prenom email")
      .sort({ createdAt: -1 });
    res.status(200).json({ status: "ok", tickets });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
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

// ============================================================
// GET /api/tickets/clients/search?q=bensalem
// ============================================================
router.get("/clients/search", authMiddleware, async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2)
    return res.status(200).json({ status: "ok", clients: [] });
  try {
    const regex = new RegExp(q.trim(), "i");
    const clients = await User.find({
      role: "client",
      $or: [{ prenom: regex }, { nom: regex }, { email: regex }],
    }).select("nom prenom email createdAt").limit(5);

    const clientsAvecStats = await Promise.all(clients.map(async c => {
      const tickets = await Ticket.find({ reporter: c._id });
      return {
        ...c.toObject(),
        stats: {
          ouverts:   tickets.filter(t => ["ready_for_support","in_progress","ready_for_customer"].includes(t.statut)).length,
          resolus:   tickets.filter(t => ["solved","closed"].includes(t.statut)).length,
          escalades: tickets.filter(t => t.statut === "escalated").length,
          total:     tickets.length,
        }
      };
    }));
    res.status(200).json({ status: "ok", clients: clientsAvecStats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// GET /api/tickets/clients/:clientId/tickets
// ============================================================
router.get("/clients/:clientId/tickets", authMiddleware, async (req, res) => {
  try {
    const client = await User.findById(req.params.clientId).select("nom prenom email createdAt");
    if (!client) return res.status(404).json({ status: "notok", msg: "Client non trouvé" });
    const tickets = await Ticket.find({ reporter: req.params.clientId })
      .populate("assignee", "nom prenom email")
      .sort({ createdAt: -1 });
    res.status(200).json({ status: "ok", client, tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// GET /api/tickets/sla/mes-stats
// ============================================================
router.get("/sla/mes-stats", authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find({ assignee: req.user.id })
      .populate("reporter", "nom prenom email")
      .sort({ createdAt: -1 });
    const maintenant = new Date();
    const resolus    = tickets.filter(t => ["solved","closed"].includes(t.statut));
    const respectes  = resolus.filter(t => t.slaRespect === true);
    const depasses   = resolus.filter(t => t.slaRespect === false);
    const enCours    = tickets.filter(t => !["solved","closed","cancelled"].includes(t.statut));
    const enDanger   = enCours.filter(t => { if (!t.slaDeadline) return false; const r = (new Date(t.slaDeadline) - maintenant) / 60000; return r > 0 && r <= 60; });
    const dejaDepasses = enCours.filter(t => { if (!t.slaDeadline) return false; return maintenant > new Date(t.slaDeadline); });
    const tempsMoyen = resolus.length > 0 ? Math.round(resolus.reduce((s, t) => s + (t.slaTempsReel || 0), 0) / resolus.length) : 0;
    const tauxRespect = resolus.length > 0 ? Math.round((respectes.length / resolus.length) * 100) : null;
    const ticketsSla = tickets.map(t => {
      const deadline = t.slaDeadline ? new Date(t.slaDeadline) : null;
      const restant  = deadline ? Math.round((deadline - maintenant) / 60000) : null;
      const pourcentage = deadline && t.createdAt ? Math.min(100, Math.round(((maintenant - new Date(t.createdAt)) / (deadline - new Date(t.createdAt))) * 100)) : null;
      return { _id: t._id, titre: t.titre, priorite: t.priorite, statut: t.statut, slaDeadline: t.slaDeadline, slaRespect: t.slaRespect, slaTempsReel: t.slaTempsReel, slaDelaiMinutes: t.slaDelaiMinutes, createdAt: t.createdAt, resolvedAt: t.resolvedAt, restantMinutes: restant, pourcentageEcoule: pourcentage, enDanger: restant !== null && restant > 0 && restant <= 60, depasse: restant !== null && restant < 0 && !["solved","closed","cancelled"].includes(t.statut), reporter: t.reporter };
    });
    res.status(200).json({ status: "ok", stats: { total: tickets.length, enCours: enCours.length, resolus: resolus.length, respectes: respectes.length, depasses: depasses.length, enDanger: enDanger.length, dejaDepasses: dejaDepasses.length, tauxRespect, tempsMoyen }, ticketsSla });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// GET /api/tickets/sla/equipe
// ============================================================
router.get("/sla/equipe", authMiddleware, async (req, res) => {
  if (!["team_lead","admin"].includes(req.user.role))
    return res.status(403).json({ status: "notok", msg: "Accès refusé" });
  try {
    const tickets  = await Ticket.find().populate("assignee", "nom prenom email").populate("reporter", "nom prenom email");
    const agents   = await User.find({ role: "support", isActive: true });
    const maintenant = new Date();
    const statsParAgent = agents.map(agent => {
      const siens    = tickets.filter(t => String(t.assignee?._id) === String(agent._id));
      const resolus  = siens.filter(t => ["solved","closed"].includes(t.statut));
      const respectes= resolus.filter(t => t.slaRespect === true);
      const depasses = resolus.filter(t => t.slaRespect === false);
      const enCours  = siens.filter(t => !["solved","closed","cancelled"].includes(t.statut));
      const enDanger = enCours.filter(t => { if (!t.slaDeadline) return false; const r = (new Date(t.slaDeadline) - maintenant) / 60000; return r > 0 && r <= 60; });
      const tempsMoyen = resolus.length > 0 ? Math.round(resolus.reduce((s,t) => s+(t.slaTempsReel||0), 0) / resolus.length) : 0;
      return { agent: { _id: agent._id, nom: agent.nom, prenom: agent.prenom, email: agent.email }, total: siens.length, enCours: enCours.length, resolus: resolus.length, respectes: respectes.length, depasses: depasses.length, enDanger: enDanger.length, tauxRespect: resolus.length > 0 ? Math.round((respectes.length / resolus.length) * 100) : null, tempsMoyen };
    });
    const resolusTotal   = tickets.filter(t => ["solved","closed"].includes(t.statut));
    const respectesTotal = resolusTotal.filter(t => t.slaRespect === true);
    res.status(200).json({ status: "ok", global: { total: tickets.length, resolus: resolusTotal.length, respectes: respectesTotal.length, depasses: resolusTotal.filter(t => t.slaRespect === false).length, tauxRespect: resolusTotal.length > 0 ? Math.round((respectesTotal.length / resolusTotal.length) * 100) : null }, statsParAgent });
  } catch (err) {
    console.error(err);
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
    .populate("commentaires.reactions.auteur", "nom prenom")
    .populate("escalade.escaladePar", "nom prenom")
    .populate("bloquePar", "nom prenom")
    .populate("forcedResoluPar", "nom prenom")
    .populate("dernierReouvertPar", "nom prenom")
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
  if (!contenu || !contenu.trim()) return res.status(400).json({ status: "notok", msg: "Commentaire vide" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    ticket.commentaires.push({ auteur: req.user.id, contenu: contenu.trim() });
    await ticket.save();
    if (ticket.reporter.toString() === req.user.id && ticket.assignee) {
      await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `Le client a ajouté un commentaire sur : "${ticket.titre}"`, type: "nouveau_commentaire", lu: false });
      await sendPushNotification(ticket.assignee, `💬 Nouveau message client`, `Sur le ticket : "${ticket.titre}"`);
    }
    if (ticket.reporter.toString() !== req.user.id) {
      await Notification.create({ destinataire: ticket.reporter, ticket: ticket._id, message: `Nouveau commentaire sur votre ticket : "${ticket.titre}"`, type: "nouveau_commentaire", lu: false });
      await sendPushNotification(ticket.reporter, `💬 Nouvelle réponse`, `Sur votre ticket : "${ticket.titre}"`);
    }
    const populated = await Ticket.findById(ticket._id)
      .populate("commentaires.auteur", "nom prenom role")
      .populate("commentaires.reactions.auteur", "nom prenom");
    res.status(200).json({ status: "ok", msg: "Commentaire ajouté", ticket: populated });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/commentaires/:commentId — Modifier
// ============================================================
router.put("/:id/commentaires/:commentId", authMiddleware, async (req, res) => {
  const { contenu } = req.body;
  if (!contenu || !contenu.trim())
    return res.status(400).json({ status: "notok", msg: "Commentaire vide" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    const commentaire = ticket.commentaires.id(req.params.commentId);
    if (!commentaire) return res.status(404).json({ status: "notok", msg: "Commentaire non trouvé" });
    if (commentaire.auteur.toString() !== req.user.id) return res.status(403).json({ status: "notok", msg: "Accès refusé" });
    commentaire.contenu = contenu.trim();
    commentaire.modifie = true;
    await ticket.save();
    const populated = await Ticket.findById(ticket._id)
      .populate("commentaires.auteur", "nom prenom role")
      .populate("commentaires.reactions.auteur", "nom prenom");
    res.status(200).json({ status: "ok", msg: "Commentaire modifié", ticket: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/commentaires/:commentId/reaction
// ============================================================
router.put("/:id/commentaires/:commentId/reaction", authMiddleware, async (req, res) => {
  const { type } = req.body;
  if (!["like", "love"].includes(type))
    return res.status(400).json({ status: "notok", msg: "Type de réaction invalide" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    const commentaire = ticket.commentaires.id(req.params.commentId);
    if (!commentaire) return res.status(404).json({ status: "notok", msg: "Commentaire non trouvé" });
    const userId = req.user.id;
    const existingIndex = commentaire.reactions.findIndex(r => String(r.auteur) === String(userId));
    let action = null;
    if (existingIndex !== -1) {
      if (commentaire.reactions[existingIndex].type === type) { action = "removed"; commentaire.reactions.splice(existingIndex, 1); }
      else { action = "changed"; commentaire.reactions[existingIndex].type = type; }
    } else { action = "added"; commentaire.reactions.push({ auteur: userId, type }); }
    await ticket.save();
    if (action !== "removed" && String(commentaire.auteur) !== String(userId)) {
      const reactor = await User.findById(userId);
      const emoji = type === "like" ? "👍" : "❤️";
      const label = type === "like" ? "aimé" : "adoré";
      await Notification.create({ destinataire: commentaire.auteur, ticket: ticket._id, message: `${emoji} ${reactor.prenom} ${reactor.nom} a ${label} votre message sur : "${ticket.titre}"`, type: "nouveau_commentaire", lu: false });
      await sendPushNotification(commentaire.auteur, `${emoji} Réaction`, `${reactor.prenom} a ${label} votre message`);
    }
    const populated = await Ticket.findById(ticket._id)
      .populate("commentaires.auteur", "nom prenom role")
      .populate("commentaires.reactions.auteur", "nom prenom");
    res.status(200).json({ status: "ok", msg: "Réaction enregistrée", ticket: populated });
  } catch (err) {
    console.error(err);
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
    if (commentaire.auteur.toString() !== req.user.id) return res.status(403).json({ status: "notok", msg: "Accès refusé" });
    ticket.commentaires.pull({ _id: req.params.commentId });
    await ticket.save();
    const populated = await Ticket.findById(ticket._id)
      .populate("commentaires.auteur", "nom prenom role")
      .populate("commentaires.reactions.auteur", "nom prenom");
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
        if (!transition.active) return res.status(403).json({ status: "notok", msg: "Cette transition est désactivée." });
        if (!transition.rolesAutorises.includes(req.user.role)) return res.status(403).json({ status: "notok", msg: "Vous n'êtes pas autorisé à effectuer cette transition." });
      }
    }
    ticket.statut = statut;
    ticket.statutChangedAt = new Date();
    await ticket.save();
    if (statut === "in_progress") {
      await Notification.create({ destinataire: ticket.reporter, ticket: ticket._id, message: `Votre ticket "${ticket.titre}" est en cours de traitement.`, type: "statut_change", lu: false });
      await sendPushNotification(ticket.reporter, `🔄 Ticket en cours`, `"${ticket.titre}" est pris en charge`);
    }
    if (statut === "ready_for_customer") {
      await Notification.create({ destinataire: ticket.reporter, ticket: ticket._id, message: `Une solution a été proposée pour : "${ticket.titre}". Veuillez confirmer.`, type: "confirmation_demandee", lu: false });
      await sendPushNotification(ticket.reporter, `✅ Solution proposée`, `Confirmez la résolution de "${ticket.titre}"`);
    }
    res.status(200).json({ status: "ok", msg: "Statut mis à jour", ticket });
  } catch (err) {
    console.error("ERREUR STATUT:", err.message);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/bloquer
// ============================================================
router.put("/:id/bloquer", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ status: "notok", msg: "Accès refusé — admin uniquement" });
  const { bloquer, raison } = req.body;
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (bloquer) { ticket.bloque = true; ticket.bloqueRaison = raison || ""; ticket.bloqueAt = new Date(); ticket.bloquePar = req.user.id; }
    else { ticket.bloque = false; ticket.bloqueRaison = ""; ticket.bloqueAt = null; ticket.bloquePar = null; }
    await ticket.save();
    if (ticket.assignee) {
      await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: bloquer ? `🔒 Ticket "${ticket.titre}" bloqué par l'admin.` : `🔓 Ticket "${ticket.titre}" débloqué.`, type: "statut_change", lu: false });
      await sendPushNotification(ticket.assignee, bloquer ? `🔒 Ticket bloqué` : `🔓 Ticket débloqué`, `"${ticket.titre}"`);
    }
    await Notification.create({ destinataire: ticket.reporter, ticket: ticket._id, message: bloquer ? `Votre ticket "${ticket.titre}" est temporairement bloqué.` : `Votre ticket "${ticket.titre}" est débloqué.`, type: "statut_change", lu: false });
    const teamLeads = await User.find({ role: "team_lead", isActive: true });
    if (teamLeads.length > 0) {
      await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: bloquer ? `🔒 Admin a bloqué : "${ticket.titre}"` : `🔓 Admin a débloqué : "${ticket.titre}"`, type: "statut_change", lu: false })));
    }
    res.status(200).json({ status: "ok", msg: bloquer ? "Ticket bloqué" : "Ticket débloqué", ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/forcer-resolu
// ============================================================
router.put("/:id/forcer-resolu", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ status: "notok", msg: "Accès refusé — admin uniquement" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (["solved", "closed", "cancelled"].includes(ticket.statut))
      return res.status(400).json({ status: "notok", msg: "Ce ticket est déjà résolu ou fermé" });
    ticket.statut = "solved"; ticket.forcedResolu = true;
    ticket.forcedResoluAt = new Date(); ticket.forcedResoluPar = req.user.id;
    ticket.bloque = false; ticket.statutChangedAt = new Date();
    await ticket.save();
    if (ticket.assignee) {
      await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `✅ Admin a forcé la résolution de "${ticket.titre}"`, type: "ticket_resolu", lu: false });
      await sendPushNotification(ticket.assignee, `✅ Ticket résolu`, `Admin a forcé la résolution de "${ticket.titre}"`);
    }
    await Notification.create({ destinataire: ticket.reporter, ticket: ticket._id, message: `Votre ticket "${ticket.titre}" a été résolu par l'administrateur.`, type: "ticket_resolu", lu: false });
    await sendPushNotification(ticket.reporter, `✅ Ticket résolu`, `"${ticket.titre}" a été résolu`);
    const teamLeads = await User.find({ role: "team_lead", isActive: true });
    if (teamLeads.length > 0) {
      await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `✅ Admin a forcé la résolution de "${ticket.titre}"`, type: "ticket_resolu", lu: false })));
    }
    res.status(200).json({ status: "ok", msg: "Ticket forcé comme résolu", ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/reuvrir
// ============================================================
router.put("/:id/reuvrir", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ status: "notok", msg: "Accès refusé — admin uniquement" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (!["solved", "closed", "cancelled"].includes(ticket.statut))
      return res.status(400).json({ status: "notok", msg: "Seuls les tickets résolus peuvent être réouverts" });
    ticket.statut = "ready_for_support"; ticket.bloque = false; ticket.forcedResolu = false;
    ticket.reouverts = (ticket.reouverts || 0) + 1;
    ticket.dernierReouvertAt = new Date(); ticket.dernierReouvertPar = req.user.id;
    ticket.statutChangedAt = new Date();
    await ticket.save();
    if (ticket.assignee) {
      await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `🔄 Ticket "${ticket.titre}" réouvert par l'admin.`, type: "nouveau_ticket", lu: false });
      await sendPushNotification(ticket.assignee, `🔄 Ticket réouvert`, `"${ticket.titre}" a été réouvert`);
    }
    await Notification.create({ destinataire: ticket.reporter, ticket: ticket._id, message: `Votre ticket "${ticket.titre}" a été réouvert.`, type: "nouveau_ticket", lu: false });
    const teamLeads = await User.find({ role: "team_lead", isActive: true });
    if (teamLeads.length > 0) {
      await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `🔄 Admin a réouvert "${ticket.titre}"`, type: "nouveau_ticket", lu: false })));
    }
    res.status(200).json({ status: "ok", msg: "Ticket réouvert avec succès", ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/prendre
// ============================================================
router.put("/:id/prendre", authMiddleware, async (req, res) => {
  if (req.user.role !== "support") return res.status(403).json({ status: "notok", msg: "Accès refusé" });
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("assignee", "nom prenom email")
      .populate("reporter", "nom prenom email");
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (ticket.bloque) return res.status(403).json({ status: "notok", msg: "🔒 Ce ticket est bloqué." });
    const agentActuel = await User.findById(req.user.id);
    const ancienAssignee = ticket.assignee;
    if (ancienAssignee && ancienAssignee._id.toString() === req.user.id)
      return res.status(400).json({ status: "notok", msg: "Ce ticket vous est déjà assigné" });
    ticket.assignee = req.user.id;
    if (ticket.statut === "escalated") { ticket.statut = "ready_for_support"; ticket.statutChangedAt = new Date(); }
    await ticket.save();
    const teamLeads = await User.find({ role: "team_lead", isActive: true });
    if (ancienAssignee) {
      if (teamLeads.length > 0) {
        await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `🔄 ${agentActuel.prenom} a pris le ticket "${ticket.titre}"`, type: "ticket_assigne", lu: false })));
      }
      await Notification.create({ destinataire: ancienAssignee._id, ticket: ticket._id, message: `🔄 ${agentActuel.prenom} a pris votre ticket "${ticket.titre}"`, type: "ticket_assigne", lu: false });
      await sendPushNotification(ancienAssignee._id, `🔄 Ticket transféré`, `${agentActuel.prenom} a pris "${ticket.titre}"`);
    } else {
      if (teamLeads.length > 0) {
        await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `✅ ${agentActuel.prenom} s'est assigné "${ticket.titre}"`, type: "ticket_assigne", lu: false })));
        await sendPushToMany(teamLeads.map(tl => tl._id), `✅ Ticket assigné`, `${agentActuel.prenom} a pris "${ticket.titre}"`);
      }
    }
    res.status(200).json({ status: "ok", msg: "Ticket pris en charge", ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/escalader
// ============================================================
router.put("/:id/escalader", authMiddleware, async (req, res) => {
  if (!["support", "admin", "team_lead"].includes(req.user.role))
    return res.status(403).json({ status: "notok", msg: "Accès refusé" });
  const { raison, urgence } = req.body;
  if (req.user.role !== "admin") {
    if (!raison || !raison.trim()) return res.status(400).json({ status: "notok", msg: "La raison est obligatoire" });
    if (!["normal", "urgent", "critique"].includes(urgence)) return res.status(400).json({ status: "notok", msg: "Niveau d'urgence invalide" });
  }
  const raisonFinale  = raison?.trim() || "Escalade manuelle par l'administrateur";
  const urgenceFinale = ["normal", "urgent", "critique"].includes(urgence) ? urgence : "urgent";
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (ticket.bloque && req.user.role !== "admin")
      return res.status(403).json({ status: "notok", msg: "🔒 Ce ticket est bloqué." });
    ticket.statut = "escalated";
    ticket.statutChangedAt = new Date();
    ticket.escalade = { raison: raisonFinale, urgence: urgenceFinale, escaladePar: req.user.id, escaladeAt: new Date() };
    await ticket.save();
    const teamLeads = await User.find({ role: "team_lead", isActive: true });
    if (teamLeads.length > 0) {
      await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `⚠️ Escalade [${urgenceFinale.toUpperCase()}] : "${ticket.titre}"`, type: "ticket_escalade", lu: false })));
      await sendPushToMany(teamLeads.map(tl => tl._id), `⚠️ Ticket escaladé [${urgenceFinale.toUpperCase()}]`, `"${ticket.titre}" — ${raisonFinale.substring(0, 50)}`);
    }
    await Notification.create({ destinataire: ticket.reporter, ticket: ticket._id, message: `Votre ticket "${ticket.titre}" a été transmis au chef d'équipe.`, type: "ticket_escalade", lu: false });
    if (ticket.assignee && ticket.assignee.toString() !== req.user.id) {
      await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `⚠️ "${ticket.titre}" a été escaladé.`, type: "ticket_escalade", lu: false });
      await sendPushNotification(ticket.assignee, `⚠️ Ticket escaladé`, `"${ticket.titre}" a été escaladé`);
    }
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
  if (!temps || isNaN(temps) || temps <= 0) return res.status(400).json({ status: "notok", msg: "Temps invalide" });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    ticket.tempsPassé = (ticket.tempsPassé || 0) + parseInt(temps);
    await ticket.save();
    res.status(200).json({ status: "ok", msg: "Temps enregistré", ticket });
  } catch { res.status(500).json({ status: "error", msg: "Erreur serveur" }); }
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
    if (ticket.statut === "escalated") { ticket.statut = "ready_for_support"; ticket.statutChangedAt = new Date(); }
    await ticket.save();
    await Notification.create({ destinataire: assigneeId, ticket: ticket._id, message: `Un ticket vous a été assigné : "${ticket.titre}"`, type: "ticket_assigne", lu: false });
    await sendPushNotification(assigneeId, `🎫 Ticket assigné`, `"${ticket.titre}" vous a été assigné`);
    res.status(200).json({ status: "ok", msg: "Ticket assigné", ticket });
  } catch { res.status(500).json({ status: "error", msg: "Erreur serveur" }); }
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
  } catch { res.status(500).json({ status: "error", msg: "Erreur serveur" }); }
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
    ticket.statutChangedAt = new Date();
    await ticket.save();

    // 🤖 Décrémenter workload de l'agent assigné
    if (ticket.assignee) {
      await User.findByIdAndUpdate(
        ticket.assignee,
        { $inc: { workloadActuel: -1 } }
      );
    }

    if (ticket.assignee) {
      await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `Le client a confirmé la solution de "${ticket.titre}"`, type: "ticket_resolu", lu: false });
      await sendPushNotification(ticket.assignee, `⭐ Solution confirmée`, `Le client a confirmé "${ticket.titre}"`);
    }
    const teamLeads = await User.find({ role: "team_lead", isActive: true });
    if (teamLeads.length > 0) {
      await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `Ticket résolu — client confirmé : "${ticket.titre}"`, type: "ticket_resolu", lu: false })));
      await sendPushToMany(teamLeads.map(tl => tl._id), `✅ Ticket résolu`, `Client a confirmé "${ticket.titre}"`);
    }
    res.status(200).json({ status: "ok", msg: "Solution confirmée", ticket });
  } catch { res.status(500).json({ status: "error", msg: "Erreur serveur" }); }
});

// ============================================================
// PUT /api/tickets/:id/fermer
// ============================================================
router.put("/:id/fermer", authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (ticket.reporter.toString() !== req.user.id) return res.status(403).json({ status: "notok", msg: "Accès refusé" });
    ticket.statut = "closed";
    ticket.statutChangedAt = new Date();
    await ticket.save();

    // 🤖 Décrémenter workload de l'agent assigné
    if (ticket.assignee) {
      await User.findByIdAndUpdate(
        ticket.assignee,
        { $inc: { workloadActuel: -1 } }
      );
    }

    res.status(200).json({ status: "ok", msg: "Ticket fermé", ticket });
  } catch { res.status(500).json({ status: "error", msg: "Erreur serveur" }); }
});

// ============================================================
// POST /api/tickets/:id/feedback
// ============================================================
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
      await Notification.insertMany(adminsEtChefs.map(u => ({ destinataire: u._id, ticket: ticket._id, message: `⭐ Feedback (${note}/5) sur "${ticket.titre}"`, type: "nouveau_commentaire", lu: false })));
      await sendPushToMany(adminsEtChefs.map(u => u._id), `⭐ Nouveau feedback`, `${note}/5 sur "${ticket.titre}"`);
    }
    if (ticket.assignee) {
      await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `⭐ ${note}/5 sur "${ticket.titre}"`, type: "nouveau_commentaire", lu: false });
      await sendPushNotification(ticket.assignee, `⭐ Feedback reçu`, `${note}/5 sur "${ticket.titre}"`);
    }
    res.status(200).json({ status: "ok", msg: "Feedback enregistré", ticket });
  } catch (err) {
    console.error(err); res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/modifier
// ============================================================
// ── 5. Mettre à jour le ticket ──────────────────────────
// ============================================================
// PUT /api/tickets/:id/modifier
// ============================================================
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

// ============================================================
// DELETE /api/tickets/:id
// ============================================================
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