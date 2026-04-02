const mongoose = require("mongoose");
const config = require("config");
const Workflow = require("./models/Workflow");

mongoose.connect(config.get("mongoURI")).then(async () => {
  await Workflow.deleteMany();
  console.log("✅ Workflow supprimé — il sera recréé automatiquement avec les valeurs par défaut");
  mongoose.disconnect();
});