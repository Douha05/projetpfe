const mongoose = require("mongoose");

const CommentaireSchema = new mongoose.Schema({
  auteur: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  contenu: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
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
      enum: [
        "ready_for_support",
        "in_progress",
        "ready_for_customer",
        "solved",
        "closed",
        "cancelled",
        "escalated",
      ],
      default: "ready_for_support",
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    commentaires: [CommentaireSchema],
    feedback: {
      note: { type: Number, min: 1, max: 5, default: null },
      message: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", TicketSchema);