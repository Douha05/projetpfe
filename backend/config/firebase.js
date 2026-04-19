const admin = require("firebase-admin");
const serviceAccount = require("./firebase-admin.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data,
      webpush: {
        fcmOptions: { link: "http://localhost:3000" },
        notification: { title, body, icon: "/logo192.png" },
      },
    });
    console.log(`✅ Push envoyé : ${title}`);
  } catch (err) {
    console.error("❌ Erreur push:", err.message);
  }
};

const sendPushToMany = async (fcmTokens, title, body, data = {}) => {
  const tokens = fcmTokens.filter(Boolean);
  if (tokens.length === 0) return;
  try {
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data,
      webpush: {
        fcmOptions: { link: "http://localhost:3000" },
        notification: { title, body, icon: "/logo192.png" },
      },
    });
    console.log(`✅ Push envoyé à ${tokens.length} utilisateurs`);
  } catch (err) {
    console.error("❌ Erreur push multiple:", err.message);
  }
};

module.exports = { sendPushNotification, sendPushToMany };