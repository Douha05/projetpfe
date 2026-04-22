const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    nom:         { type: String, required: true, trim: true },
    prenom:      { type: String, required: true, trim: true },
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    telephone:   { type: String, required: true },
    departement: { type: String, default: "" },
    password:    { type: String, required: true },
    role: {
      type: String,
      enum: ["client", "support", "team_lead", "admin"],
      default: "client",
    },

    // ── IA ──────────────────────────────────────────────────
    specialites: {
      type: [String],
      default: []
    },
    workloadActuel: {
      type: Number,
      default: 0
    },
    scoreCompetence: {
      tauxResolution: { type: Number, default: 0   },
      tempsMoyen:     { type: Number, default: 0   },
      satisfaction:   { type: Number, default: 0   },
      tauxSla:        { type: Number, default: 50  },
      scoreGlobal:    { type: Number, default: 50  },
      nbTickets:      { type: Number, default: 0   },
      updatedAt:      { type: Date,   default: null }
    },

    isActive:           { type: Boolean, default: true },
    fcmToken:           { type: String,  default: null },
    mustChangePassword: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);