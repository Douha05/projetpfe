const mongoose = require("mongoose");

const CommentaireSchema = new mongoose.Schema({
  auteur: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  contenu: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const FichierSchema = new mongoose.Schema({
  nom: { type: String },
  chemin: { type: String },
  type: { type: String, enum: ["image", "video"] },
  taille: { type: Number },
});

const TicketSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["bug", "feature", "consultancy"],
      required: true,
    },
    priorite: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    statut: {
      type: String,
      enum: ["ready_for_support", "in_progress", "ready_for_customer", "solved", "closed", "cancelled", "escalated"],
      default: "ready_for_support",
    },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    commentaires: [CommentaireSchema],
    fichiers: [FichierSchema],
    feedback: {
      note: { type: Number, min: 1, max: 5, default: null },
      message: { type: String, default: "" },
    },
    tempsPassé: { type: Number, default: 0 },
    escalade: {
      raison: { type: String, default: "" },
      urgence: { type: String, enum: ["normal", "urgent", "critique"], default: "normal" },
      escaladePar: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      escaladeAt: { type: Date, default: null },
    },

    // ---- ACTIONS ADMIN ----
    bloque: { type: Boolean, default: false },
    bloqueRaison: { type: String, default: "" },
    bloqueAt: { type: Date, default: null },
    bloquePar: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    forcedResolu: { type: Boolean, default: false },
    forcedResoluAt: { type: Date, default: null },
    forcedResoluPar: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    reouverts: { type: Number, default: 0 },
    dernierReouvertAt: { type: Date, default: null },
    dernierReouvertPar: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", TicketSchema);