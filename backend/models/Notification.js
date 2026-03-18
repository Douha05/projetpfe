const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    destinataire: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["ticket_resolu", "nouveau_commentaire", "ticket_assigne", "confirmation_demandee"],
      required: true,
    },
    lu: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);