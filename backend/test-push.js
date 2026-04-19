const webpush = require('web-push');
const User = require('./models/User');
const mongoose = require('mongoose');
const config = require('config');

webpush.setVapidDetails(
  'mailto:support@devapp.com',
  'BCYQWkzdfm6R4Eagw2u9IZm8qFJgbPoRaCxLsFcELMN9-hAPA--WVzThYBnFwKdaD_eyIMtl8fTJ9TPYxntLysI',
  'Z7I1oTud3JItI4GFlgXbg2ZR_K7uPcJwJcvtkFug0LU'
);

// ✅ Ajouter la clé FCM pour Chrome
webpush.setGCMAPIKey('870075698532');

mongoose.connect(config.get('mongoURI')).then(async () => {
  const user = await User.findOne({ fcmToken: { $exists: true, $ne: null } });
  if (!user) { console.log('Aucun utilisateur avec token'); process.exit(); }
  console.log('Envoi à:', user.prenom, user.nom);
  const subscription = JSON.parse(user.fcmToken);
  await webpush.sendNotification(subscription, JSON.stringify({
    title: '🔔 Test notification',
    body: 'Les notifications push fonctionnent !'
  }));
  console.log('✅ Notification envoyée !');
  process.exit();
}).catch(err => { console.error(err); process.exit(); });