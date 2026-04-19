const router = require("express").Router();
const Ticket = require("../../models/Ticket");
const User   = require("../../models/User");
const authMiddleware = require("../../middleware/authMiddlware");

function getDateRange(periode) {
  const now = new Date();
  let debut;

  switch (periode) {
    case "tous":
      debut = new Date(Date.UTC(2000, 0, 1));
      break;
    case "semaine":
      debut = new Date(now);
      debut.setUTCDate(now.getUTCDate() - 7);
      debut.setUTCHours(0, 0, 0, 0);
      break;
    case "mois":
      debut = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      break;
    case "3mois":
      debut = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));
      break;
    case "annee":
      debut = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      break;
    default:
      debut = new Date(now);
      debut.setUTCDate(now.getUTCDate() - 7);
      debut.setUTCHours(0, 0, 0, 0);
  }

  return { debut, fin: now };
}

function getPreviousDateRange(periode) {
  if (periode === "tous") return { debut: new Date(Date.UTC(1999, 0, 1)), fin: new Date(Date.UTC(2000, 0, 1)) };
  const { debut, fin } = getDateRange(periode);
  const diff = fin - debut;
  return { debut: new Date(debut - diff), fin: new Date(debut) };
}

function getNbJours(periode) {
  switch (periode) {
    case "semaine": return 7;
    case "mois":    return 30;
    case "3mois":   return 90;
    case "annee":   return 365;
    default:        return 30;
  }
}

function ticketsParJour(tickets, debut, fin) {
  const jours   = [];
  const current = new Date(debut);
  while (current <= fin) {
    const dateStr = current.toISOString().split("T")[0];
    const crees   = tickets.filter(t => t.createdAt.toISOString().split("T")[0] === dateStr).length;
    const resolus = tickets.filter(t => t.resolvedAt && t.resolvedAt.toISOString().split("T")[0] === dateStr).length;
    jours.push({ date: dateStr, crees, resolus });
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return jours;
}

function calcTaux(resolus, total) {
  return total > 0 ? Math.round((resolus / total) * 100) : 0;
}

function calcTrend(valeur, valeurPrev) {
  if (!valeurPrev || valeurPrev === 0) return { diff: 0, pct: 0, sens: "stable" };
  const diff = valeur - valeurPrev;
  const pct  = Math.round((diff / valeurPrev) * 100);
  return { diff, pct, sens: diff > 0 ? "hausse" : diff < 0 ? "baisse" : "stable" };
}

router.get("/dashboard", authMiddleware, async (req, res) => {
  const { periode = "mois", agentId } = req.query;
  const { role, id: userId } = req.user;

  try {
    const { debut, fin }                     = getDateRange(periode);
    const { debut: debutPrev, fin: finPrev } = getPreviousDateRange(periode);

    let filtreAgent = {};
    if (role === "support") {
      filtreAgent = { assignee: userId };
    } else if (agentId && agentId !== "tous") {
      filtreAgent = { assignee: agentId };
    }

    // ── Tickets de la période ────────────────────────────────
    const tickets = await Ticket.find({
      createdAt: { $gte: debut, $lte: fin },
      ...filtreAgent,
    }).populate("assignee", "nom prenom")
      .populate("reporter", "nom prenom");

    const ticketsPrev = await Ticket.find({
      createdAt: { $gte: debutPrev, $lte: finPrev },
      ...filtreAgent,
    });

    const total       = tickets.length;
    const resolus     = tickets.filter(t => ["solved", "closed"].includes(t.statut));
    const escalades   = tickets.filter(t => t.statut === "escalated");
    const nonAssignes = tickets.filter(t => !t.assignee);

    const slaRespectes   = resolus.filter(t => t.slaRespect === true);
    const tauxSla        = calcTaux(slaRespectes.length, resolus.length);
    const tauxResolution = calcTaux(resolus.length, total);

    const tempsMoyen = resolus.length > 0
      ? Math.round(resolus.reduce((s, t) => s + (t.slaTempsReel || 0), 0) / resolus.length)
      : 0;

    const feedbacks    = tickets.filter(t => t.feedback && t.feedback.note);
    const satisfaction = feedbacks.length > 0
      ? Math.round((feedbacks.reduce((s, t) => s + t.feedback.note, 0) / feedbacks.length) * 10) / 10
      : null;

    // ── Période précédente ───────────────────────────────────
    const totalPrev    = ticketsPrev.length;
    const resolusPrev  = ticketsPrev.filter(t => ["solved", "closed"].includes(t.statut));
    const slaRespPrev  = resolusPrev.filter(t => t.slaRespect === true);
    const tauxSlaPrev  = calcTaux(slaRespPrev.length, resolusPrev.length);
    const tauxResPrev  = calcTaux(resolusPrev.length, totalPrev);
    const tempsMoyPrev = resolusPrev.length > 0
      ? Math.round(resolusPrev.reduce((s, t) => s + (t.slaTempsReel || 0), 0) / resolusPrev.length)
      : 0;
    const feedbacksPrev = ticketsPrev.filter(t => t.feedback && t.feedback.note);
    const satisfPrev    = feedbacksPrev.length > 0
      ? Math.round((feedbacksPrev.reduce((s, t) => s + t.feedback.note, 0) / feedbacksPrev.length) * 10) / 10
      : null;

    // ── KPI Tier 1 nouveaux ──────────────────────────────────

    // 1. Backlog ratio = tickets ouverts actuels ÷ créés par jour sur la période
    const statutsOuverts = ["ready_for_support", "in_progress", "ready_for_customer"];
    const ticketsOuverts = await Ticket.find({
      statut: { $in: statutsOuverts },
      ...filtreAgent,
    }).select("createdAt");

    const nbJours      = getNbJours(periode);
    const creesParJour = total > 0 ? total / nbJours : 0;
    const backlogRatio = creesParJour > 0
      ? +((ticketsOuverts.length / creesParJour).toFixed(1))
      : 0;

    // 2. Âge moyen backlog = moyenne de (maintenant - createdAt) en jours pour tickets ouverts
    const now = Date.now();
    const ageMoyenBacklog = ticketsOuverts.length > 0
      ? +((ticketsOuverts.reduce((s, t) => s + (now - new Date(t.createdAt).getTime()) / 86400000, 0) / ticketsOuverts.length).toFixed(1))
      : 0;

    // 3. Backlog age — distribution par tranche d'ancienneté
    const tranches = [
      { label: "< 1 jour",    min: 0, max: 1    },
      { label: "1 – 3 jours", min: 1, max: 3    },
      { label: "3 – 7 jours", min: 3, max: 7    },
      { label: "> 7 jours",   min: 7, max: 99999 },
    ];
    const backlogAge = tranches.map(tr => {
      const count = ticketsOuverts.filter(t => {
        const age = (now - new Date(t.createdAt).getTime()) / 86400000;
        return age >= tr.min && age < tr.max;
      }).length;
      return {
        label: tr.label,
        count,
        pct: ticketsOuverts.length > 0 ? Math.round((count / ticketsOuverts.length) * 100) : 0,
      };
    });

    // 4. Taux de réouverture global = tickets rouverts ÷ résolus × 100
    // (nécessite le champ reouverts: Boolean dans le modèle Ticket)
    const reouvertsCount = resolus.filter(t => t.reouverts && t.reouverts > 0).length;
    const tauxReouverture = resolus.length > 0
      ? Math.round((reouvertsCount / resolus.length) * 100)
      : 0;

    // ── KPIs ─────────────────────────────────────────────────
    const kpis = {
      total:          { valeur: total,              trend: calcTrend(total,            totalPrev) },
      resolus:        { valeur: resolus.length,     trend: calcTrend(resolus.length,   resolusPrev.length) },
      tauxResolution: { valeur: tauxResolution,     trend: calcTrend(tauxResolution,   tauxResPrev) },
      tauxSla:        { valeur: tauxSla,            trend: calcTrend(tauxSla,          tauxSlaPrev) },
      tempsMoyen:     { valeur: tempsMoyen,         trend: calcTrend(tempsMoyen,       tempsMoyPrev) },
      satisfaction:   { valeur: satisfaction,       trend: calcTrend(satisfaction,     satisfPrev) },
      escalades:      { valeur: escalades.length,   trend: calcTrend(escalades.length, ticketsPrev.filter(t => t.statut === "escalated").length) },
      nonAssignes:    { valeur: nonAssignes.length, trend: calcTrend(nonAssignes.length, ticketsPrev.filter(t => !t.assignee).length) },
      // ── Nouveaux KPI Tier 1 ──────────────────────────────
      backlogRatio:    { valeur: backlogRatio },
      ageMoyenBacklog: { valeur: ageMoyenBacklog },
      tauxReouverture: { valeur: tauxReouverture },
    };

    // ── Par jour ─────────────────────────────────────────────
    const parJour = ticketsParJour(tickets, debut, fin);

    // ── Par type ─────────────────────────────────────────────
    const parType = ["bug", "feature", "consultancy"].map(type => ({
      type,
      label: type === "bug" ? "Bug" : type === "feature" ? "Feature" : "Consultancy",
      count: tickets.filter(t => t.type === type).length,
      pct:   calcTaux(tickets.filter(t => t.type === type).length, total),
    }));

    // ── Par priorité ─────────────────────────────────────────
    const parPriorite = ["critical", "high", "medium", "low"].map(p => ({
      priorite: p,
      label: { critical: "Critique", high: "Haute", medium: "Moyen", low: "Faible" }[p],
      count: tickets.filter(t => t.priorite === p).length,
      pct:   calcTaux(tickets.filter(t => t.priorite === p).length, total),
    }));

    // ── Par statut ───────────────────────────────────────────
    const parStatut = [
      { statut: "ready_for_support",  label: "En attente" },
      { statut: "in_progress",        label: "En cours" },
      { statut: "ready_for_customer", label: "À confirmer" },
      { statut: "escalated",          label: "Escaladé" },
      { statut: "solved",             label: "Résolu" },
      { statut: "closed",             label: "Fermé" },
      { statut: "cancelled",          label: "Annulé" },
    ].map(s => ({ ...s, count: tickets.filter(t => t.statut === s.statut).length }));

    // ── Par agent ────────────────────────────────────────────
    let parAgent = [];
    if (["team_lead", "admin"].includes(role)) {
      const agents = await User.find({ role: "support", isActive: true });
      parAgent = await Promise.all(agents.map(async agent => {
        const ticketsAgent = tickets.filter(t =>
          String(t.assignee?._id || t.assignee) === String(agent._id)
        );
        const resAgent  = ticketsAgent.filter(t => ["solved", "closed"].includes(t.statut));
        const slaAgent  = resAgent.filter(t => t.slaRespect === true);
        const fbAgent   = ticketsAgent.filter(t => t.feedback?.note);
        const tempAgent = resAgent.length > 0
          ? Math.round(resAgent.reduce((s, t) => s + (t.slaTempsReel || 0), 0) / resAgent.length)
          : 0;

        const ticketsAgentPrev = ticketsPrev.filter(t =>
          String(t.assignee) === String(agent._id)
        );

        // Taux de réouverture par agent
        const reouvertsAgent = resAgent.filter(t => t.reouverts && t.reouverts > 0).length;
        const tauxReouvertureAgent = resAgent.length > 0
          ? Math.round((reouvertsAgent / resAgent.length) * 100)
          : 0;

        return {
          agent:              { _id: agent._id, nom: agent.nom, prenom: agent.prenom },
          total:              ticketsAgent.length,
          resolus:            resAgent.length,
          tauxSla:            calcTaux(slaAgent.length, resAgent.length),
          tauxResolution:     calcTaux(resAgent.length, ticketsAgent.length),
          tempsMoyen:         tempAgent,
          nbFeedbacks:        fbAgent.length,
          satisfaction:       fbAgent.length > 0
            ? Math.round((fbAgent.reduce((s, t) => s + t.feedback.note, 0) / fbAgent.length) * 10) / 10
            : null,
          tauxReouverture:    tauxReouvertureAgent,
          trend:              calcTrend(ticketsAgent.length, ticketsAgentPrev.length),
        };
      }));
    }

    // ── Classement (rôle support) ────────────────────────────
    let classement = null;
    if (role === "support") {
      const tousAgents = await User.find({ role: "support", isActive: true });
      const scores = await Promise.all(tousAgents.map(async agent => {
        const t = await Ticket.find({ assignee: agent._id, createdAt: { $gte: debut, $lte: fin } });
        const r = t.filter(x => ["solved", "closed"].includes(x.statut));
        return { agentId: String(agent._id), score: r.length };
      }));
      scores.sort((a, b) => b.score - a.score);
      const pos = scores.findIndex(s => s.agentId === String(userId));
      classement = { position: pos + 1, total: scores.length };
    }

    res.status(200).json({
      status: "ok",
      periode,
      dateRange: { debut, fin, debutPrev, finPrev },
      kpis,
      parJour,
      parType,
      parPriorite,
      parStatut,
      parAgent,
      classement,
      backlogAge,
    });

  } catch (err) {
    console.error("ERREUR BI:", err.message);
    res.status(500).json({ status: "error", msg: "Erreur serveur" });
  }
});

module.exports = router;