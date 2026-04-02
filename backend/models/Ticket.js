const mongoose = require("mongoose");

const CommentaireSchema = new mongoose.Schema(
  {
    auteur: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contenu: { type: String, required: true },
  },
  { timestamps: true }
);

const TicketSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: ["bug", "feature", "consultancy"], required: true },
    statut: {
      type: String,
      enum: ["ready_for_support", "in_progress", "ready_for_customer", "solved", "closed", "cancelled", "escalated"],
      default: "ready_for_support",
    },
    priorite: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    commentaires: [CommentaireSchema],
    fichiers: [{ nom: { type: String }, chemin: { type: String }, type: { type: String }, taille: { type: Number } }],
    feedback: {
      note: { type: Number, min: 1, max: 5 },
      message: { type: String },
    },
    tempsPassé: { type: Number, default: 0 },
    escalade: {
      raison: { type: String, default: "" },
      urgence: { type: String, enum: ["normal", "urgent", "critique"], default: "normal" },
      escaladePar: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      escaladeAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", TicketSchema);