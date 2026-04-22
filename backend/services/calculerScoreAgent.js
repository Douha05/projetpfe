// services/calculerScoreAgent.js
const User   = require('../models/User');
const Ticket = require('../models/Ticket');

/**
 * Calcule le score de compétence de tous les agents
 * et met à jour leur profil en base.
 */
const calculerScoresTousAgents = async () => {
  console.log('📊 Calcul des scores de compétence agents...');

  const agents = await User.find({ role: 'support', isActive: true });

  for (const agent of agents) {
    try {
      const score = await calculerScoreAgent(agent._id);
      await User.findByIdAndUpdate(agent._id, { scoreCompetence: score });
      console.log(`✅ Score agent ${agent.prenom} ${agent.nom} : ${score.scoreGlobal}/100`);
    } catch (err) {
      console.error(`❌ Erreur score agent ${agent._id} :`, err.message);
    }
  }

  console.log('📊 Scores mis à jour.');
};

/**
 * Calcule le score d'un agent spécifique
 */
const calculerScoreAgent = async (agentId) => {
  const tickets = await Ticket.find({ assignee: agentId });

  if (tickets.length === 0) {
    return {
      tauxResolution: 0,
      tempsMoyen:     0,
      satisfaction:   0,
      tauxSla:        0,
      scoreGlobal:    50, // score neutre si pas de données
      nbTickets:      0,
      updatedAt:      new Date()
    };
  }

  const resolus  = tickets.filter(t => ['solved', 'closed'].includes(t.statut));
  const avecSla  = tickets.filter(t => t.slaRespect !== undefined && t.slaRespect !== null);
  const slsOk    = avecSla.filter(t => t.slaRespect === true);
  const avecFb   = tickets.filter(t => t.feedback?.note > 0);

  // ── Taux de résolution (0-100) ──────────────────────────
  const tauxResolution = tickets.length > 0
    ? Math.round((resolus.length / tickets.length) * 100)
    : 0;

  // ── Temps moyen de résolution en minutes (moins = mieux) ─
  const tempsMoyen = resolus.length > 0
    ? Math.round(
        resolus.reduce((sum, t) => {
          const duree = (new Date(t.updatedAt) - new Date(t.createdAt)) / 60000;
          return sum + duree;
        }, 0) / resolus.length
      )
    : 0;

  // ── Satisfaction client (0-5) ────────────────────────────
  const satisfaction = avecFb.length > 0
    ? parseFloat(
        (avecFb.reduce((sum, t) => sum + t.feedback.note, 0) / avecFb.length).toFixed(2)
      )
    : 0;

  // ── Taux SLA respecté (0-100) ───────────────────────────
  const tauxSla = avecSla.length > 0
    ? Math.round((slsOk.length / avecSla.length) * 100)
    : 50; // neutre si pas de données SLA

  // ── Score global pondéré (0-100) ────────────────────────
  // Poids : résolution 35%, SLA 25%, satisfaction 25%, temps 15%
  const scoreResolution  = tauxResolution;                          // déjà 0-100
  const scoreSla         = tauxSla;                                 // déjà 0-100
  const scoreSatisfaction = satisfaction > 0 ? (satisfaction / 5) * 100 : 50;
  // Pour le temps : 0 min = 100 pts, 480 min (8h) = 0 pts
  const scoreTempsMoyen  = tempsMoyen > 0
    ? Math.max(0, Math.round(100 - (tempsMoyen / 480) * 100))
    : 50;

  const scoreGlobal = Math.round(
    scoreResolution  * 0.35 +
    scoreSla         * 0.25 +
    scoreSatisfaction * 0.25 +
    scoreTempsMoyen  * 0.15
  );

  return {
    tauxResolution,
    tempsMoyen,
    satisfaction,
    tauxSla,
    scoreGlobal: Math.min(100, Math.max(0, scoreGlobal)),
    nbTickets:   tickets.length,
    updatedAt:   new Date()
  };
};

module.exports = { calculerScoresTousAgents, calculerScoreAgent };