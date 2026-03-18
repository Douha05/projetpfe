const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const config = require("config");

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

const db = config.get("mongoURI");
mongoose
  .connect(db)
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => {
    console.error("❌ Erreur MongoDB :", err.message);
    process.exit(1);
  });

app.use("/api/users", require("./routes/api/users"));

app.get("/", (req, res) => {
  res.json({ status: "ok", msg: "🚀 devapp API is running" });
});

const PORT = config.get("port") || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});