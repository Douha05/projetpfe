const router = require("express").Router();
const Ticket = require("../../models/Ticket");
const authMiddleware = require("../../middleware/authMiddlware");

router.post("/", authMiddleware, (req, res) => {
  const { titre, description, type, priorite } = req.body;
  if (!titre || !description || !type) {
    return res.status(400).json({ status: "notok", msg: "Titre, description et type sont obligatoires" });
  }
  const ticket = new Ticket({ titre, description, type, priorite: priorite || "medium", reporter: req.user.id, statut: "ready_for_support" });
  ticket.save()
    .then((t) => res.status(201).json({ status: "ok", msg: "Ticket créé avec succès", ticket: t }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

router.get("/mes-tickets", authMiddleware, (req, res) => {
  Ticket.find({ reporter: req.user.id })
    .populate("assignee", "nom prenom email")
    .sort({ createdAt: -1 })
    .then((tickets) => res.status(200).json({ status: "ok", tickets }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

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

router.post("/:id/commentaires", authMiddleware, (req, res) => {
  const { contenu } = req.body;
  if (!contenu || !contenu.trim()) return res.status(400).json({ status: "notok", msg: "Commentaire vide" });
  Ticket.findById(req.params.id)
    .then((ticket) => {
      if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
      ticket.commentaires.push({ auteur: req.user.id, contenu: contenu.trim() });
      return ticket.save();
    })
    .then((ticket) => Ticket.findById(ticket._id).populate("commentaires.auteur", "nom prenom role"))
    .then((ticket) => res.status(200).json({ status: "ok", msg: "Commentaire ajouté", ticket }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

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

router.post("/:id/feedback", authMiddleware, (req, res) => {
  const { note, message } = req.body;
  if (!note || note < 1 || note > 5) return res.status(400).json({ status: "notok", msg: "Note invalide (1 à 5)" });
  Ticket.findById(req.params.id)
    .then((ticket) => {
      if (!ticket) return res.status(404).json({ status: "notok", msg: "Ticket non trouvé" });
      if (ticket.reporter.toString() !== req.user.id) return res.status(403).json({ status: "notok", msg: "Accès refusé" });
      if (!["solved", "closed"].includes(ticket.statut)) return res.status(400).json({ status: "notok", msg: "Feedback uniquement sur ticket résolu ou fermé" });
      ticket.feedback = { note, message: message || "" };
      return ticket.save();
    })
    .then((ticket) => res.status(200).json({ status: "ok", msg: "Feedback enregistré", ticket }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

module.exports = router;