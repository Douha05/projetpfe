const mongoose = require("mongoose");

const IaLogSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true
    },
    action: {
      type: String,
      enum: ["analyse", "assignation", "reponse_auto", "erreur"],
      required: true
    },
    inputData:    { type: String, default: null },
    outputData:   { type: String, default: null },
    raisonnement: { type: String, default: null },
    modelUtilise: { type: String, default: "google/gemma-4-26b-a4b-it:free" },
    dureeMs:      { type: Number, default: null },
    statut:       { type: String, enum: ["succes", "erreur"], default: "succes" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("IaLog", IaLogSchema);