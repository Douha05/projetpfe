const mongoose = require("mongoose");
const config = require("config");
const User = require("./models/User");

mongoose.connect(config.get("mongoURI")).then(async () => {
  const users = await User.find({ role: { $in: ["support", "team_lead"] } }).select("prenom nom email role mustChangePassword");
  users.forEach(u => {
    console.log(`${u.prenom} ${u.nom} | ${u.role} | mustChangePassword: ${u.mustChangePassword}`);
  });
  mongoose.disconnect();
});