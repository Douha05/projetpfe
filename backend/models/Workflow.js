const mongoose = require("mongoose");

const TransitionSchema = new mongoose.Schema({
  de: {
    type: String,
    enum: ["ready_for_support", "in_progress", "ready_for_customer", "solved", "closed", "cancelled", "escalated"],
    required: true,
  },
  vers: {
    type: String,
    enum: ["ready_for_support", "in_progress", "ready_for_customer", "solved", "closed", "cancelled", "escalated"],
    required: true,
  },
  rolesAutorises: {
    type: [String],
    enum: ["admin", "team_lead", "support", "client"],
    default: ["support"],
  },
  active: { type: Boolean, default: true },
  delaiEscaladeHeures: { type: Number, default: null }, // null = pas d'escalade auto
  notifierRoles: {
    type: [String],
    enum: ["admin", "team_lead", "support", "client"],
    default: [],
  },
});

const WorkflowSchema = new mongoose.Schema(
  {
    nom: { type: String, default: "Workflow principal" },
    transitions: [TransitionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workflow", WorkflowSchema);