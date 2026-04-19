const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const config   = require('config');

mongoose.connect(config.get('mongoURI')).then(async () => {
  const User = require('./models/User');

  const hash = await bcrypt.hash('Admin123!', 10);

  // Reset pour admin et team_lead
  await User.updateMany(
    { role: { $in: ['admin', 'team_lead', 'support'] } },
    { password: hash }
  );

  console.log('✅ Mot de passe réinitialisé pour admin, team_lead, support');
  console.log('   Nouveau mot de passe : Admin123!');
  process.exit(0);
});