const mongoose = require("mongoose");

const IaSuggestionSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true
    },
    type: {
      type: String,
      enum: ["analyse", "assignation", "reponse_auto", "priorite"],
      required: true
    },
    contenu:        { type: String,  required: true },
    scoreConfiance: { type: Number,  default: null },
    statut: {
      type: String,
      enum: ["en_attente", "acceptee", "rejetee"],
      default: "en_attente"
    },
    valideParId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("IaSuggestion", IaSuggestionSchema);