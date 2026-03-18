const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const config = require("config");

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

mongoose.connect(config.get("mongoURI"))
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => { console.error("❌ Erreur MongoDB :", err.message); process.exit(1); });

app.use("/api/users", require("./routes/api/users"));
app.use("/api/personnel", require("./routes/api/personnel"));
app.use("/api/tickets", require("./routes/api/tickets"));
app.use("/api/notifications", require("./routes/api/notifications"));

app.get("/", (req, res) => res.json({ status: "ok", msg: "🚀 devapp API is running" }));

const PORT = config.get("port") || 3001;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));