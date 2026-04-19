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
  delaiEscaladeHeures:  { type: Number, default: null },
  delaiEscaladeMinutes: { type: Number, default: null },
  notifierRoles: {
    type: [String],
    enum: ["admin", "team_lead", "support", "client"],
    default: [],
  },
});

const SlaConfigSchema = new mongoose.Schema({
  critical: { type: Number, default: 4  },
  high:     { type: Number, default: 8  },
  medium:   { type: Number, default: 24 },
  low:      { type: Number, default: 72 },
}, { _id: false });

const WorkflowSchema = new mongoose.Schema(
  {
    nom:         { type: String, default: "Workflow principal" },
    transitions: [ TransitionSchema ],
    slaConfig:   { type: SlaConfigSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workflow", WorkflowSchema);