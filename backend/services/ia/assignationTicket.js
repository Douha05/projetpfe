// services/ia/assignationTicket.js
const { callLLMWithValidation, parseJSON } = require('../../config/openrouter');
const User = require('../../models/User');

const assignerTicket = async (ticket, classification) => {

  // --- Récupérer les agents disponibles (role: support) ---
  const agents = await User.find(
    { role: 'support', isActive: true },
    'id prenom nom specialites workloadActuel departement'
  );

  if (agents.length === 0) {
    throw new Error("Aucun agent support disponible");
  }

  const systemPrompt = `
    Tu es un système d'assignation intelligente de tickets de support.
    Tu choisis le meilleur agent selon ces critères dans l'ordre :
      1. Spécialités de l'agent vs catégorie du ticket
      2. Workload actuel (moins il a de tickets, mieux c'est)
      3. Département de l'agent
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
    Tags       : ${classification.tags.join(', ')}

    AGENTS DISPONIBLES :
    ${agents.map(a => `
      - ID         : ${a._id}
        Nom        : ${a.prenom} ${a.nom}
        Workload   : ${a.workloadActuel} tickets en cours
        Spécialités: ${a.specialites && a.specialites.length > 0 ? a.specialites.join(', ') : 'Généraliste'}
        Département: ${a.departement || 'Non défini'}
    `).join('\n')}
  `;

  // Double tour car assignation = décision critique
  const llmResult = await callLLMWithValidation(
    systemPrompt,
    userPrompt,
    "Vérifie ton choix : l'agent a-t-il le bon équilibre spécialité/workload ? JSON valide uniquement."
  );

  const assignation = parseJSON(llmResult.reponse);

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