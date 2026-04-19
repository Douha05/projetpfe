const webpush = require("web-push");
const User = require("../models/User");

webpush.setVapidDetails(
  "mailto:support@devapp.com",
  "BCYQWkzdfm6R4Eagw2u9IZm8qFJgbPoRaCxLsFcELMN9-hAPA--WVzThYBnFwKdaD_eyIMtl8fTJ9TPYxntLysI",
  "Z7I1oTud3JItI4GFlgXbg2ZR_K7uPcJwJcvtkFug0LU"
);

const sendPushNotification = async (userId, title, body) => {
  try {
    const user = await User.findById(userId);
    if (!user?.fcmToken) return;
    const subscription = JSON.parse(user.fcmToken);
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body })
    );
    console.log(`✅ Push envoyé à ${user.prenom} ${user.nom} : ${title}`);
  } catch (err) {
    console.error("❌ Erreur push:", err.message);
  }
};

const sendPushToMany = async (userIds, title, body) => {
  for (const userId of userIds) {
    await sendPushNotification(userId, title, body);
  }
};

module.exports = { sendPushNotification, sendPushToMany };