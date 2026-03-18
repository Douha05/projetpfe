const router = require("express").Router();
const Ticket = require("../../models/Ticket");
const User = require("../../models/User");
const Notification = require("../../models/Notification");
const authMiddleware = require("../../middleware/authMiddlware");
const sendEmail = require("../../utils/sendEmail");

// Helper — créer notif + envoyer email
const notifier = async ({ destinataireId, ticketId, message, type }) => {
  try {
    await Notification.create({ destinataire: destinataireId, ticket: ticketId, message, type });
    const user = await User.findById(destinataireId).select("email prenom nom");
    if (user) {
      await sendEmail({
        to: user.email,
        subject: `devapp — ${message}`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
            <h2 style="color:#111827">Portail Client devapp</h2>
            <p style="color:#374151;font-size:15px">Bonjour <strong>${user.prenom}</strong>,</p>
            <p style="color:#374151;font-size:15px">${message}</p>
            <a href="http://localhost:3000/client/dashboard"
               style="display:inline-block;margin-top:16px;padding:12px 24px;background:#22c55e;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
              Voir mon ticket
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px">© 2026 devapp</p>
          </div>
        `,
      });
    }
  } catch (err) {
    console.error("Erreur notification:", err.message);
  }
};

// ============================================================
// POST /api/tickets — Créer un ticket
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
// GET /api/tickets/mes-tickets — Voir mes tickets
// ============================================================
router.get("/mes-tickets", authMiddleware, (req, res) => {
  Ticket.find({ reporter: req.user.id })
    .populate("assignee", "nom prenom email")
    .sort({ createdAt: -1 })
    .then((tickets) => res.status(200).json({ status: "ok", tickets }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
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
// POST /api/tickets/:id/commentaires — Ajouter commentaire
// ============================================================
router.post("/:id/commentaires", authMiddleware, async (req, res) => {
  const { contenu } = req.body;
  if (!contenu || !contenu.trim()) {
    return res.status(400).json({ status: "notok", msg: "Commentaire vide" });
  }
  try {
    let ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });

    ticket.commentaires.push({ auteur: req.user.id, contenu: contenu.trim() });
    await ticket.save();

    ticket = await Ticket.findById(ticket._id).populate("commentaires.auteur", "nom prenom role");

    // Notifier le client si c'est le support qui répond
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
// PUT /api/tickets/:id/fermer — Fermer un ticket
// ============================================================
router.put("/:id/fermer", authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (ticket.reporter.toString() !== req.user.id) {
      return res.status(403).json({ status: "notok", msg: "Accès refusé" });
    }
    ticket.statut = "closed";
    await ticket.save();
    res.status(200).json({ status: "ok", msg: "Ticket fermé", ticket });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/tickets/:id/confirmer — Confirmer la solution
// ============================================================
router.put("/:id/confirmer", authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (ticket.reporter.toString() !== req.user.id) {
      return res.status(403).json({ status: "notok", msg: "Accès refusé" });
    }
    if (ticket.statut !== "ready_for_customer") {
      return res.status(400).json({ status: "notok", msg: "Le ticket n'est pas en attente de confirmation" });
    }
    ticket.statut = "solved";
    await ticket.save();

    // Notifier le support que la solution est confirmée
    if (ticket.assignee) {
      await notifier({
        destinataireId: ticket.assignee,
        ticketId: ticket._id,
        message: `Le client a confirmé la solution du ticket : "${ticket.titre}"`,
        type: "ticket_resolu",
      });
    }

    res.status(200).json({ status: "ok", msg: "Solution confirmée — ticket résolu", ticket });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// POST /api/tickets/:id/feedback — Feedback
// ============================================================
router.post("/:id/feedback", authMiddleware, async (req, res) => {
  const { note, message } = req.body;
  if (!note || note < 1 || note > 5) {
    return res.status(400).json({ status: "notok", msg: "Note invalide (1 à 5)" });
  }
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
    if (ticket.reporter.toString() !== req.user.id) {
      return res.status(403).json({ status: "notok", msg: "Accès refusé" });
    }
    if (!["solved", "closed"].includes(ticket.statut)) {
      return res.status(400).json({ status: "notok", msg: "Feedback uniquement sur ticket résolu ou fermé" });
    }
    ticket.feedback = { note, message: message || "" };
    await ticket.save();
    res.status(200).json({ status: "ok", msg: "Feedback enregistré", ticket });
  } catch {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

module.exports = router;