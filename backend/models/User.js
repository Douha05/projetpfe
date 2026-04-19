const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    telephone: { type: String, required: true },
    departement: { type: String, default: "" },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["client", "support", "team_lead", "admin"],
      default: "client",
      // ── IA ──────────────────────────────────────────────────
    specialites: {
      type: [String],   // ex: ["réseau", "facturation", "bug"]
      default: []
    },
    workloadActuel: {
      type: Number,
      default: 0        // nombre de tickets ouverts assignés à cet agent
    },
    },
    isActive: { type: Boolean, default: true },
    fcmToken: { type: String, default: null },
    mustChangePassword: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);