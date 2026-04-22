// services/ia/assignationTicket.js
const { callLLMWithValidation, parseJSON } = require('../../config/openrouter');
const User = require('../../models/User');

const assignerTicket = async (ticket, classification) => {

  // --- Récupérer les agents disponibles avec leur score ---
  const agents = await User.find(
    { role: 'support', isActive: true },
    'prenom nom specialites workloadActuel departement scoreCompetence'
  );

  if (agents.length === 0) {
    throw new Error("Aucun agent support disponible");
  }

  const systemPrompt = `
    Tu es un système d'assignation intelligente de tickets de support.
    Tu choisis le meilleur agent selon ces critères dans l'ordre de priorité :
      1. Score de compétence global (plus il est élevé, mieux c'est)
      2. Spécialités de l'agent vs catégorie du ticket
      3. Workload actuel (moins il a de tickets, mieux c'est)
      4. Taux de résolution historique
      5. Satisfaction client historique
    Tu réponds UNIQUEMENT en JSON valide, sans texte avant ou après.
    Format exact :
    {
      "agentId": "id de l'agent choisi",
      "agentNom": "prénom nom de l'agent",
      "raison": "explication courte du choix",
      "scoreSpecialite": 0.90,
      "scoreWorkload": 0.80,
      "scoreConfiance": 0.88
    }
  `;

  const userPrompt = `
    TICKET À ASSIGNER :
    Titre      : ${ticket.titre}
    Catégorie  : ${classification.categorie}
    Priorité   : ${classification.priorite}
    Complexité : ${classification.complexite}
    Tags       : ${(classification.tags || []).join(', ')}

    AGENTS DISPONIBLES :
    ${agents.map(a => {
      const sc = a.scoreCompetence;
      return `
      - ID              : ${a._id}
        Nom             : ${a.prenom} ${a.nom}
        Workload actuel : ${a.workloadActuel || 0} tickets en cours
        Spécialités     : ${a.specialites && a.specialites.length > 0 ? a.specialites.join(', ') : 'Généraliste'}
        Département     : ${a.departement || 'Non défini'}
        Score global    : ${sc?.scoreGlobal ?? 50}/100
        Taux résolution : ${sc?.tauxResolution ?? 0}%
        Satisfaction    : ${sc?.satisfaction ?? 0}/5
        Taux SLA        : ${sc?.tauxSla ?? 50}%
        Temps moyen     : ${sc?.tempsMoyen ?? 0} min
        Tickets traités : ${sc?.nbTickets ?? 0}
      `;
    }).join('\n')}
  `;

  const llmResult = await callLLMWithValidation(
    systemPrompt,
    userPrompt,
    "Vérifie ton choix : l'agent a-t-il le meilleur score de compétence pour ce type de ticket ? JSON valide uniquement."
  );

  const assignation = parseJSON(llmResult.reponse);

  // Vérifier que agentId est présent
  if (!assignation.agentId) {
    // Fallback : prendre l'agent avec le meilleur score global
    const meilleurAgent = agents.reduce((best, a) => {
      const scoreA    = a.scoreCompetence?.scoreGlobal ?? 50;
      const scoreBest = best.scoreCompetence?.scoreGlobal ?? 50;
      return scoreA > scoreBest ? a : best;
    }, agents[0]);

    assignation.agentId        = meilleurAgent._id;
    assignation.agentNom       = `${meilleurAgent.prenom} ${meilleurAgent.nom}`;
    assignation.raison         = `Assignation par score (${meilleurAgent.scoreCompetence?.scoreGlobal ?? 50}/100)`;
    assignation.scoreConfiance = 0.5;
  }

  // Incrémenter le workload de l'agent choisi
  await User.findByIdAndUpdate(
    assignation.agentId,
    { $inc: { workloadActuel: 1 } }
  );

  return {
    data:         assignation,
    raisonnement: llmResult.raisonnement,
    dureeMs:      llmResult.dureeMs
  };
};

module.exports = { assignerTicket };