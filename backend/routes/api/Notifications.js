const router = require("express").Router();
const Notification = require("../../models/Notification");
const authMiddleware = require("../../middleware/authMiddlware");

// GET toutes mes notifications
router.get("/", authMiddleware, (req, res) => {
  Notification.find({ destinataire: req.user.id })
    .populate("ticket", "titre statut")
    .sort({ createdAt: -1 })
    .limit(20)
    .then((notifs) => res.status(200).json({ status: "ok", notifications: notifs }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// GET nombre non lues
router.get("/non-lues", authMiddleware, (req, res) => {
  Notification.countDocuments({ destinataire: req.user.id, lu: false })
    .then((count) => res.status(200).json({ status: "ok", count }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// PUT marquer toutes comme lues
router.put("/lire-tout", authMiddleware, (req, res) => {
  Notification.updateMany({ destinataire: req.user.id, lu: false }, { lu: true })
    .then(() => res.status(200).json({ status: "ok", msg: "Toutes les notifications marquées comme lues" }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

// PUT marquer une notification comme lue
router.put("/:id/lire", authMiddleware, (req, res) => {
  Notification.findByIdAndUpdate(req.params.id, { lu: true }, { new: true })
    .then((notif) => res.status(200).json({ status: "ok", notification: notif }))
    .catch(() => res.status(500).json({ status: "error", msg: "Erreur serveur" }));
});

module.exports = router;