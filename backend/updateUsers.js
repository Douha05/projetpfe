const mongoose = require("mongoose");
const config = require("config");
const User = require("./models/User");

mongoose.connect(config.get("mongoURI")).then(async () => {
  const result = await User.updateMany(
    { role: { $in: ["support", "team_lead"] } },
    { $set: { mustChangePassword: true } }
  );
  console.log("Mis a jour:", result.modifiedCount, "comptes");
  mongoose.disconnect();
});