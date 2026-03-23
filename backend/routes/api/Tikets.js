const router = require("express").Router();
const Ticket = require("../../models/Ticket");
const User = require("../../models/User");
const Notification = require("../../models/Notification");
const authMiddleware = require("../../middleware/authMiddlware");
const sendEmail = require("../../utils/sendEmail");

const notifier = async ({ destinataireId, ticketId, message, type }) => {
  try {
    await Notification.create({ destinataire: destinataireId, ticket: ticketId, message, type });
    const user = await User.findById(destinataireId).select("email prenom nom");
    if (user) {
      await sendEmail({
        to: user.email,
        subject: `devapp — ${message}`,
        html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
          <h2 style="color:#111827">Portail devapp</h2>
          <p>Bonjour <strong>${user.prenom}</strong>,</p>
          <p>${message}</p>
          <a href="http://localhost:3000/client/dashboard" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#22c55e;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Voir mon ticket</a>
        </div>`,
      });
    }
  } catch (err) {
    console.error("Erreur notification:", err.message);
  }
};

// ============================================================
// POST /api/tickets — Créer un ticket (client)
// ============================================================
router.post("/", authMiddleware, (req, res) => {
  const { titre, description, type, priorite } = req.body;
  if (!titre || !description || !type) {
    return res.status(400).json({ status: "notok", msg: "Titre, description et type sont obligatoires" });
  }
  const ticket = new Ticket({
    titre, description, type,
    priorite: priorite || "medium",
    reporter: req.user.id,
    statut: "ready_for_support",
  });
  ticket.save()
    .then((t) => res.status(201).json({ status: "ok", msg: "Ticket créé avec succès", ticket: t }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// ============================================================
// GET /api/tickets/mes-tickets — Tickets du client connecté
// ============================================================
router.get("/mes-tickets", authMiddleware, (req, res) => {
  Ticket.find({ reporter: req.user.id })
    .populate("assignee", "nom prenom email")
    .sort({ createdAt: -1 })
    .then((tickets) => res.status(200).json({ status: "ok", tickets }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// ============================================================
// GET /api/tickets/tous — Tous les tickets (team_lead + admin)
// ============================================================
router.get("/tous", authMiddleware, async (req, res) => {
  if (!["team_lead", "admin"].includes(req.user.role)) {
    return res.status(403).json({ status: "notok", msg: "Accès refusé" });
  }
  try {
    const tickets = await Ticket.find()
      .populate("reporter", "nom prenom email")
      .populate("assignee", "nom prenom email departement")
      .sort({ createdAt: -1 });
    res.status(200).json({ status: "ok", tickets });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// GET /api/tickets/assignes — Tickets assignés à l'agent
// ============================================================
router.get("/assignes", authMiddleware, async (req, res) => {
  if (req.user.role !== "support") {
    return res.status(403).json({ status: "notok", msg: "Accès refusé" });
  }
  try {
    const tickets = await Ticket.find({ assignee: req.user.id })
      .populate("reporter", "nom prenom email")
      .sort({ createdAt: -1 });
    res.status(200).json({ status: "ok", tickets });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// GET /api/tickets/stats — Statistiques (team_lead + admin)
// ============================================================
router.get("/stats", authMiddleware, async (req, res) => {
  if (!["team_lead", "admin"].includes(req.user.role)) {
    return res.status(403).json({ status: "notok", msg: "Accès refusé" });
  }
  try {
    const total = await Ticket.countDocuments();
    const enAttente = await Ticket.countDocuments({ statut: "ready_for_support" });
    const enCours = await Ticket.countDocuments({ statut: "in_progress" });
    const resolus = await Ticket.countDocuments({ statut: { $in: ["solved", "closed"] } });
    const escalades = await Ticket.countDocuments({ statut: "escalated" });
    const nonAssignes = await Ticket.countDocuments({ assignee: null });

    // Stats par agent
    const agents = await User.find({ role: "support" }).select("nom prenom email");
    const statsByAgent = await Promise.all(agents.map(async (agent) => {
      const assigned = await Ticket.countDocuments({ assignee: agent._id });
      const resolved = await Ticket.countDocuments({ assignee: agent._id, statut: { $in: ["solved", "closed"] } });
      const inProgress = await Ticket.countDocuments({ assignee: agent._id, statut: "in_progress" });
      return { agent, assigned, resolved, inProgress };
    }));

    res.status(200).json({
      status: "ok",
      stats: { total, enAttente, enCours, resolus, escalades, nonAssignes },
      statsByAgent,
    });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// GET /api/tickets/:id — Voir un ticket
// ============================================================
router.get("/:id", authMiddleware, (req, res) => {
  Ticket.findById(req.params.id)
    .populate("reporter", "nom prenom email")
    .populate("assignee", "nom prenom email")
    .populate("commentaires.auteur", "nom prenom role")
    .then((ticket) => {
      if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
      res.status(200).json({ status: "ok", ticket });
    })
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// ============================================================
// PUT /api/tickets/:id/assigner — Assigner à un agent (team_lead)
// ============================================================
router.put("/:id/assigner", authMiddleware, async (req, res) => {
  if (!["team_lead", "admin"].includes(req.user.role)) {
    return res.status(403).json({ status: "notok", msg: "Accès refusé" });
  }
  const { assigneeId } = req.body;
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });

    ticket.assignee = assigneeId;
    ticket.statut = "in_progress";
    await ticket.save();

    // Notifier l'agent
    await notifier({
      destinataireId: assigneeId,
      ticketId: ticket._id,
      message: `Un ticket vous a été assigné : "${ticket.titre}"`,
      type: "ticket_assigne",
    });

    // Notifier le client
    await notifier({
      destinataireId: ticket.reporter,
      ticketId: ticket._id,
      message: `Votre ticket "${ticket.titre}" est maintenant en cours de traitement`,
      type: "ticket_assigne",
    });

    res.status(200).json({ status: "ok", msg: "Ticket assigné avec succès", ticket });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/priorite — Changer priorité (team_lead)
// ============================================================
router.put("/:id/priorite", authMiddleware, async (req, res) => {
  if (!["team_lead", "admin"].includes(req.user.role)) {
    return res.status(403).json({ status: "notok", msg: "Accès refusé" });
  }
  const { priorite } = req.body;
  if (!["low", "medium", "high", "critical"].includes(priorite)) {
    return res.status(400).json({ status: "notok", msg: "Priorité invalide" });
  }
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { priorite }, { new: true });
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    res.status(200).json({ status: "ok", msg: "Priorité mise à jour", ticket });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/statut — Mettre à jour statut (support)
// ============================================================
router.put("/:id/statut", authMiddleware, async (req, res) => {
  if (!["support", "team_lead", "admin"].includes(req.user.role)) {
    return res.status(403).json({ status: "notok", msg: "Accès refusé" });
  }
  const { statut } = req.body;
  const statutsValides = ["in_progress", "ready_for_customer", "solved", "escalated", "cancelled"];
  if (!statutsValides.includes(statut)) {
    return res.status(400).json({ status: "notok", msg: "Statut invalide" });
  }
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });

    ticket.statut = statut;
    await ticket.save();

    // Notifier le client si solution proposée
    if (statut === "ready_for_customer") {
      await notifier({
        destinataireId: ticket.reporter,
        ticketId: ticket._id,
        message: `Une solution a été proposée pour votre ticket "${ticket.titre}". Veuillez confirmer.`,
        type: "confirmation_demandee",
      });
    }

    // Notifier si résolu
    if (statut === "solved") {
      await notifier({
        destinataireId: ticket.reporter,
        ticketId: ticket._id,
        message: `Votre ticket "${ticket.titre}" a été résolu !`,
        type: "ticket_resolu",
      });
    }

    res.status(200).json({ status: "ok", msg: "Statut mis à jour", ticket });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/temps — Enregistrer temps passé (support)
// ============================================================
router.put("/:id/temps", authMiddleware, async (req, res) => {
  if (req.user.role !== "support") {
    return res.status(403).json({ status: "notok", msg: "Accès refusé" });
  }
  const { temps } = req.body;
  if (!temps || temps < 0) {
    return res.status(400).json({ status: "notok", msg: "Temps invalide" });
  }
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { tempsPassé: temps },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    res.status(200).json({ status: "ok", msg: "Temps enregistré", ticket });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// POST /api/tickets/:id/commentaires — Ajouter commentaire
// ============================================================
router.post("/:id/commentaires", authMiddleware, async (req, res) => {
  const { contenu } = req.body;
  if (!contenu || !contenu.trim()) return res.status(400).json({ status: "notok", msg: "Commentaire vide" });
  try {
    let ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    ticket.commentaires.push({ auteur: req.user.id, contenu: contenu.trim() });
    await ticket.save();
    ticket = await Ticket.findById(ticket._id).populate("commentaires.auteur", "nom prenom role");

    if (req.user.id !== ticket.reporter.toString()) {
      await notifier({
        destinataireId: ticket.reporter,
        ticketId: ticket._id,
        message: `Une réponse a été ajoutée à votre ticket : "${ticket.titre}"`,
        type: "nouveau_commentaire",
      });
    }
    res.status(200).json({ status: "ok", msg: "Commentaire ajouté", ticket });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/fermer — Fermer (client)
// ============================================================
router.put("/:id/fermer", authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (ticket.reporter.toString() !== req.user.id) return res.status(403).json({ status: "notok", msg: "Accès refusé" });
    ticket.statut = "closed";
    await ticket.save();
    res.status(200).json({ status: "ok", msg: "Ticket fermé", ticket });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/confirmer — Confirmer solution (client)
// ============================================================
router.put("/:id/confirmer", authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (ticket.reporter.toString() !== req.user.id) return res.status(403).json({ status: "notok", msg: "Accès refusé" });
    if (ticket.statut !== "ready_for_customer") return res.status(400).json({ status: "notok", msg: "Le ticket n'est pas en attente de confirmation" });
    ticket.statut = "solved";
    await ticket.save();
    if (ticket.assignee) {
      await notifier({ destinataireId: ticket.assignee, ticketId: ticket._id, message: `Le client a confirmé la solution du ticket : "${ticket.titre}"`, type: "ticket_resolu" });
    }
    res.status(200).json({ status: "ok", msg: "Solution confirmée", ticket });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// POST /api/tickets/:id/feedback — Feedback (client)
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
    res.status(200).json({ status: "ok", msg: "Feedback enregistré", ticket });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

module.exports = router;