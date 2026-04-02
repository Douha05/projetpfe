const router = require("express").Router();
const Workflow = require("../../models/Workflow");
const adminMiddleware = require("../../middleware/adminMiddleware");
const authMiddleware = require("../../middleware/authMiddlware");

// Transitions par défaut du système
const defaultTransitions = [
  { de: "ready_for_support",  vers: "in_progress",        rolesAutorises: ["support", "team_lead"], active: true, delaiEscaladeHeures: null, notifierRoles: ["team_lead"] },
  { de: "in_progress",        vers: "ready_for_customer", rolesAutorises: ["support"],              active: true, delaiEscaladeHeures: null, notifierRoles: ["client"] },
  { de: "in_progress",        vers: "escalated",          rolesAutorises: ["support", "team_lead"], active: true, delaiEscaladeHeures: 48,   notifierRoles: ["team_lead", "admin"] },
  { de: "in_progress",        vers: "cancelled",          rolesAutorises: ["support", "team_lead"], active: true, delaiEscaladeHeures: null, notifierRoles: ["client"] },
  { de: "ready_for_customer", vers: "solved",             rolesAutorises: ["client"],               active: true, delaiEscaladeHeures: null, notifierRoles: ["support", "team_lead"] },
  { de: "ready_for_customer", vers: "in_progress",        rolesAutorises: ["client"],               active: true, delaiEscaladeHeures: null, notifierRoles: ["support"] },
  { de: "solved",             vers: "closed",             rolesAutorises: ["client"],               active: true, delaiEscaladeHeures: null, notifierRoles: [] },
];

// ============================================================
// GET /api/workflow — Récupérer le workflow
// ============================================================
router.get("/", authMiddleware, async (req, res) => {
  try {
    let workflow = await Workflow.findOne();
    if (!workflow) {
      workflow = await Workflow.create({ nom: "Workflow principal", transitions: defaultTransitions });
    }
    res.status(200).json({ status: "ok", workflow });
  } catch (err) {
    console.error("ERREUR GET WORKFLOW:", err.message);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/workflow/transitions/:id — Modifier une transition
// ============================================================
router.put("/transitions/:id", adminMiddleware, async (req, res) => {
  const { rolesAutorises, active, delaiEscaladeHeures, notifierRoles } = req.body;
  try {
    const workflow = await Workflow.findOne();
    if (!workflow) return res.status(404).json({ status: "notok", msg: "Workflow introuvable" });

    const transition = workflow.transitions.id(req.params.id);
    if (!transition) return res.status(404).json({ status: "notok", msg: "Transition introuvable" });

    if (rolesAutorises !== undefined) transition.rolesAutorises = rolesAutorises;
    if (active !== undefined) transition.active = active;
    if (delaiEscaladeHeures !== undefined) transition.delaiEscaladeHeures = delaiEscaladeHeures;
    if (notifierRoles !== undefined) transition.notifierRoles = notifierRoles;

    await workflow.save();
    res.status(200).json({ status: "ok", msg: "Transition mise à jour", workflow });
  } catch (err) {
    console.error("ERREUR PUT TRANSITION:", err.message);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// POST /api/workflow/reset — Réinitialiser le workflow par défaut
// ============================================================
router.post("/reset", adminMiddleware, async (req, res) => {
  try {
    await Workflow.deleteMany();
    const workflow = await Workflow.create({ nom: "Workflow principal", transitions: defaultTransitions });
    res.status(200).json({ status: "ok", msg: "Workflow réinitialisé", workflow });
  } catch (err) {
    console.error("ERREUR RESET WORKFLOW:", err.message);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

module.exports = router;