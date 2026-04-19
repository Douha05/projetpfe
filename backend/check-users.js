const mongoose = require('mongoose');
const config   = require('config');

mongoose.connect(config.get('mongoURI')).then(async () => {
  const User = require('./models/User');
  const users = await User.find({}, 'email role isActive');
  console.log(users);
  process.exit(0);
});