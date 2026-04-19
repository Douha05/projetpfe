const router = require("express").Router();
const User = require("../../models/User");
const authMiddleware = require("../../middleware/authMiddlware");
const webpush = require("web-push");

// ✅ Configuration VAPID
webpush.setVapidDetails(
  "mailto:support@devapp.com",
  "BCYQWkzdfm6R4Eagw2u9IZm8qFJgbPoRaCxLsFcELMN9-hAPA--WVzThYBnFwKdaD_eyIMtl8fTJ9TPYxntLysI",
  "Z7I1oTud3JItI4GFlgXbg2ZR_K7uPcJwJcvtkFug0LU"
);

// ✅ Sauvegarder l'abonnement push
router.post("/token", authMiddleware, async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.status(400).json({ status: "notok", msg: "Token manquant" });
  try {
    await User.findByIdAndUpdate(req.user.id, { fcmToken });
    res.json({ status: "ok", msg: "Token sauvegardé" });
  } catch (err) {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ✅ Envoyer une notification push à un utilisateur
router.post("/send", authMiddleware, async (req, res) => {
  const { userId, title, body } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user?.fcmToken) return res.status(404).json({ status: "notok", msg: "Pas d'abonnement" });
    const subscription = JSON.parse(user.fcmToken);
    await webpush.sendNotification(subscription, JSON.stringify({ title, body }));
    res.json({ status: "ok", msg: "Notification envoyée" });
  } catch (err) {
    res.status(500).json({ status: "error", msg: err.message });
  }
});

module.exports = router;