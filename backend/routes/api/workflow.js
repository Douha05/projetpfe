const router = require("express").Router();
const Workflow = require("../../models/Workflow");
const adminMiddleware = require("../../middleware/adminMiddleware");
const authMiddleware = require("../../middleware/authMiddlware");

const defaultTransitions = [
  { de: "ready_for_support",  vers: "in_progress",        rolesAutorises: ["support", "team_lead"], active: true, delaiEscaladeHeures: null, notifierRoles: ["team_lead"] },
  { de: "in_progress",        vers: "ready_for_customer", rolesAutorises: ["support"],              active: true, delaiEscaladeHeures: null, notifierRoles: ["client"] },
  { de: "in_progress",        vers: "escalated",          rolesAutorises: ["support", "team_lead"], active: true, delaiEscaladeHeures: 48,   notifierRoles: ["team_lead", "admin"] },
  { de: "in_progress",        vers: "cancelled",          rolesAutorises: ["support", "team_lead"], active: true, delaiEscaladeHeures: null, notifierRoles: ["client"] },
  { de: "ready_for_customer", vers: "solved",             rolesAutorises: ["client"],               active: true, delaiEscaladeHeures: null, notifierRoles: ["support", "team_lead"] },
  { de: "ready_for_customer", vers: "in_progress",        rolesAutorises: ["client"],               active: true, delaiEscaladeHeures: null, notifierRoles: ["support"] },
  { de: "solved",             vers: "closed",             rolesAutorises: ["client"],               active: true, delaiEscaladeHeures: null, notifierRoles: [] },
];

const defaultSlaConfig = {
  critical: 4,
  high:     8,
  medium:   24,
  low:      72,
};

// ============================================================
// GET /api/workflow
// ============================================================
router.get("/", authMiddleware, async (req, res) => {
  try {
    let workflow = await Workflow.findOne();
    if (!workflow) {
      workflow = await Workflow.create({
        nom: "Workflow principal",
        transitions: defaultTransitions,
        slaConfig: defaultSlaConfig,
      });
    }
    if (!workflow.slaConfig || !workflow.slaConfig.critical) {
      workflow.slaConfig = defaultSlaConfig;
      await workflow.save();
    }
    res.status(200).json({ status: "ok", workflow });
  } catch (err) {
    console.error("ERREUR GET WORKFLOW:", err.message);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/workflow/transitions/:id
// ============================================================
router.put("/transitions/:id", adminMiddleware, async (req, res) => {
  const { rolesAutorises, active, delaiEscaladeHeures, delaiEscaladeMinutes, notifierRoles } = req.body;
  try {
    const workflow = await Workflow.findOne();
    if (!workflow) return res.status(404).json({ status: "notok", msg: "Workflow introuvable" });

    const transition = workflow.transitions.id(req.params.id);
    if (!transition) return res.status(404).json({ status: "notok", msg: "Transition introuvable" });

    if (rolesAutorises       !== undefined) transition.rolesAutorises       = rolesAutorises;
    if (active               !== undefined) transition.active               = active;
    if (delaiEscaladeHeures  !== undefined) transition.delaiEscaladeHeures  = delaiEscaladeHeures;
    if (delaiEscaladeMinutes !== undefined) transition.delaiEscaladeMinutes = delaiEscaladeMinutes;
    if (notifierRoles        !== undefined) transition.notifierRoles        = notifierRoles;

    await workflow.save();
    res.status(200).json({ status: "ok", msg: "Transition mise à jour", workflow });
  } catch (err) {
    console.error("ERREUR PUT TRANSITION:", err.message);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// GET /api/workflow/sla-config
// ============================================================
router.get("/sla-config", authMiddleware, async (req, res) => {
  try {
    const workflow = await Workflow.findOne();
    const slaConfig = workflow?.slaConfig || defaultSlaConfig;
    res.status(200).json({ status: "ok", slaConfig });
  } catch (err) {
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// PUT /api/workflow/sla-config
// ============================================================
router.put("/sla-config", adminMiddleware, async (req, res) => {
  const raw = req.body.slaConfig || req.body;
  const { critical, high, medium, low } = raw;

  const valeurs = { critical, high, medium, low };
  for (const [k, v] of Object.entries(valeurs)) {
    if (!v || isNaN(v) || Number(v) <= 0) {
      return res.status(400).json({ status: "notok", msg: `Le délai "${k}" doit être supérieur à 0.` });
    }
  }

  try {
    let workflow = await Workflow.findOne();
    if (!workflow) {
      workflow = await Workflow.create({
        nom: "Workflow principal",
        transitions: defaultTransitions,
        slaConfig: {
          critical: Number(critical),
          high:     Number(high),
          medium:   Number(medium),
          low:      Number(low),
        },
      });
    } else {
      workflow.slaConfig = {
        critical: Number(critical),
        high:     Number(high),
        medium:   Number(medium),
        low:      Number(low),
      };
      await workflow.save();
    }
    res.status(200).json({ status: "ok", msg: "Configuration SLA sauvegardée", slaConfig: workflow.slaConfig });
  } catch (err) {
    console.error("ERREUR SLA CONFIG:", err.message);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

// ============================================================
// POST /api/workflow/reset
// ✅ CORRIGÉ : garde la slaConfig existante lors du reset
// ============================================================
router.post("/reset", adminMiddleware, async (req, res) => {
  try {
    // ✅ Sauvegarder la slaConfig avant suppression
    const existingWorkflow = await Workflow.findOne();
    const slaConfigActuelle = existingWorkflow?.slaConfig
      ? {
          critical: existingWorkflow.slaConfig.critical || defaultSlaConfig.critical,
          high:     existingWorkflow.slaConfig.high     || defaultSlaConfig.high,
          medium:   existingWorkflow.slaConfig.medium   || defaultSlaConfig.medium,
          low:      existingWorkflow.slaConfig.low      || defaultSlaConfig.low,
        }
      : defaultSlaConfig;

    await Workflow.deleteMany();

    // ✅ Recrée avec les transitions par défaut + slaConfig conservée
    const workflow = await Workflow.create({
      nom: "Workflow principal",
      transitions: defaultTransitions,
      slaConfig: slaConfigActuelle,
    });

    res.status(200).json({ status: "ok", msg: "Workflow réinitialisé", workflow });
  } catch (err) {
    console.error("ERREUR RESET WORKFLOW:", err.message);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

module.exports = router;