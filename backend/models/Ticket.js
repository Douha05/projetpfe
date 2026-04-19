const mongoose = require("mongoose");

const ReactionSchema = new mongoose.Schema({
  auteur: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type:   { type: String, enum: ["like", "love"], required: true },
});

const CommentaireSchema = new mongoose.Schema({
  auteur:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  contenu:   { type: String, required: true, trim: true },
  modifie:   { type: Boolean, default: false },
  reactions: [ReactionSchema],
  createdAt: { type: Date, default: Date.now },
});

const FichierSchema = new mongoose.Schema({
  nom:    { type: String },
  chemin: { type: String },
  type:   { type: String, enum: ["image", "video"] },
  taille: { type: Number },
});

const HistoriqueSchema = new mongoose.Schema({
  action:    { type: String },
  auteur:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  auteurNom: { type: String, default: "Systeme" },
  details:   { type: String },
  createdAt: { type: Date, default: Date.now },
});

const TicketSchema = new mongoose.Schema(
  {
    titre:       { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, enum: ["bug", "feature", "consultancy"], required: true },
    priorite: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    statut: {
      type: String,
      enum: ["ready_for_support", "in_progress", "ready_for_customer", "solved", "closed", "cancelled", "escalated"],
      default: "ready_for_support",
    },
    statutChangedAt:    { type: Date, default: Date.now },
    rappelInactiviteAt: { type: Date, default: null },
    reporter:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignee:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    commentaires: [CommentaireSchema],
    fichiers:     [FichierSchema],
    feedback: {
      note:    { type: Number, min: 1, max: 5, default: null },
      message: { type: String, default: "" },
    },
    tempsPassé: { type: Number, default: 0 },
    escalade: {
      raison:      { type: String, default: "" },
      urgence:     { type: String, enum: ["normal", "urgent", "critique"], default: "normal" },
      escaladePar: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      escaladeAt:  { type: Date, default: null },
    },
    bloque:       { type: Boolean, default: false },
    bloqueRaison: { type: String, default: "" },
    bloqueAt:     { type: Date, default: null },
    bloquePar:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    forcedResolu:    { type: Boolean, default: false },
    forcedResoluAt:  { type: Date, default: null },
    forcedResoluPar: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // ── Réouverture ─────────────────────────────────────────
    reouverts:          { type: Number, default: 0 },
    dernierReouvertAt:  { type: Date, default: null },
    dernierReouvertPar: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // ── SLA ─────────────────────────────────────────────────
    slaBreached:      { type: Boolean, default: false },
    slaPourcentage:   { type: Number,  default: null },
    slaDelaiMinutes:  { type: Number,  default: null },
    slaDepuisMinutes: { type: Number,  default: null },
    slaDeadline:      { type: Date,    default: null },
    slaRespect:       { type: Boolean, default: null },
    slaTempsReel:     { type: Number,  default: null },
    resolvedAt:       { type: Date,    default: null },
    historique:       [HistoriqueSchema],

    // ── IA ──────────────────────────────────────────────────
    resumeIa: {
      type:    String,
      default: null,
    },
    prioriteIa: {
      type:    String,
      enum:    ["low", "medium", "high", "critical"],
      default: null,
    },
    sentimentClient: {
      type:    String,
      enum:    ["calme", "frustre", "desespere"],
      default: null,
    },
    categorieIa: {
      type:    String,
      default: null,
    },
    assigneAutomatiquement: {
      type:    Boolean,
      default: false,
    },
    iaTraite: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const SLA_DELAIS = {
  critical: 4  * 60,
  high:     8  * 60,
  medium:   24 * 60,
  low:      72 * 60,
};

const STATUTS_RESOLUS = ["solved", "closed"];
const STATUTS_ACTIFS  = ["ready_for_support", "in_progress", "ready_for_customer", "escalated"];

TicketSchema.pre("save", async function () {

  // ── SLA initial à la création ──────────────────────────────
  if (this.isNew && !this.slaDeadline) {
    const delai = SLA_DELAIS[this.priorite] || SLA_DELAIS.medium;
    this.slaDeadline     = new Date(Date.now() + delai * 60 * 1000);
    this.slaDelaiMinutes = delai;
  }

  // ── Recalcul SLA si priorité changée ──────────────────────
  if (!this.isNew && this.isModified("priorite")) {
    const delai = SLA_DELAIS[this.priorite] || SLA_DELAIS.medium;
    this.slaDeadline     = new Date(this.createdAt.getTime() + delai * 60 * 1000);
    this.slaDelaiMinutes = delai;
  }

  // ── Résolution du ticket ───────────────────────────────────
  if (this.isModified("statut") && STATUTS_RESOLUS.includes(this.statut)) {
    const maintenant    = new Date();
    this.resolvedAt     = maintenant;
    this.slaRespect     = this.slaDeadline ? maintenant <= this.slaDeadline : null;
    this.slaTempsReel   = Math.round((maintenant - this.createdAt) / 60000);
    this.slaBreached    = !this.slaRespect;
    this.slaPourcentage = this.slaDeadline
      ? Math.round(((maintenant - this.createdAt) / (this.slaDeadline - this.createdAt)) * 100)
      : null;
  }

  // ── Détection de réouverture ───────────────────────────────
  if (this.isModified("statut") && STATUTS_ACTIFS.includes(this.statut)) {
    const ancienTicket = await mongoose.model("Ticket").findById(this._id).select("statut").lean();
    if (ancienTicket && STATUTS_RESOLUS.includes(ancienTicket.statut)) {
      this.reouverts         = (this.reouverts || 0) + 1;
      this.dernierReouvertAt = new Date();
      this.resolvedAt        = null;
      this.slaRespect        = null;
    }
  }
});

TicketSchema.virtual("slaMinutesRestantes").get(function () {
  if (!this.slaDeadline) return null;
  return Math.round((this.slaDeadline - Date.now()) / 60000);
});

TicketSchema.virtual("slaEnDanger").get(function () {
  if (!this.slaDeadline || this.slaRespect !== null) return false;
  const restant = (this.slaDeadline - Date.now()) / 60000;
  return restant > 0 && restant <= 60;
});

module.exports = mongoose.model("Ticket", TicketSchema);