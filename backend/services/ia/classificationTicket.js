// services/ia/classificationTicket.js
const { callLLMWithValidation, parseJSON } = require('../../config/openrouter');

const CATEGORIES = [
  'réseau',
  'facturation',
  'bug_logiciel',
  'accès_compte',
  'performance',
  'sécurité',
  'autre'
];

const classifierTicket = async (ticket) => {

  const systemPrompt = `
    Tu es un système de classification de tickets de support.
    Tu dois classifier le ticket avec précision.
    Tu réponds UNIQUEMENT en JSON valide, sans texte avant ou après.
    Format exact :
    {
      "categorie": "une catégorie parmi la liste fournie",
      "sousCategorie": "précision sur le problème",
      "priorite": "low|medium|high|critical",
      "tags": ["tag1", "tag2", "tag3"],
      "complexite": "simple|moyen|complexe",
      "scoreConfiance": 0.92
    }
  `;

  const userPrompt = `
    TICKET À CLASSIFIER :
    Titre       : ${ticket.titre}
    Description : ${ticket.description}
    Type        : ${ticket.type}
    Priorité    : ${ticket.priorite}

    CATÉGORIES DISPONIBLES :
    ${CATEGORIES.join(', ')}

    Choisis OBLIGATOIREMENT une catégorie parmi cette liste.
    Le champ "tags" doit OBLIGATOIREMENT être un tableau JSON, même vide : []
  `;

  const llmResult = await callLLMWithValidation(
    systemPrompt,
    userPrompt,
    "Vérifie ta classification. La catégorie est-elle bien dans la liste fournie ? Le champ tags est-il bien un tableau ? Réponds uniquement en JSON valide."
  );

  const data = parseJSON(llmResult.reponse);

  // ── Sécurités ──────────────────────────────────────────
  // Catégorie hors liste → forcer "autre"
  if (!CATEGORIES.includes(data.categorie)) {
    data.categorie = 'autre';
  }

  // Tags null/undefined/pas un tableau → forcer tableau vide
  if (!Array.isArray(data.tags)) {
    data.tags = [];
  }

  // Champs obligatoires manquants → valeurs par défaut
  if (!data.sousCategorie) data.sousCategorie = 'Non précisé';
  if (!data.priorite)      data.priorite      = ticket.priorite || 'medium';
  if (!data.complexite)    data.complexite    = 'simple';
  if (!data.scoreConfiance) data.scoreConfiance = 0.5;

  return {
    data,
    raisonnement: llmResult.raisonnement,
    dureeMs:      llmResult.dureeMs
  };
};

module.exports = { classifierTicket };