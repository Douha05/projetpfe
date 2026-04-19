// services/ia/reponseAutomatique.js
const { callLLM, parseJSON } = require('../../config/openrouter');

const genererReponse = async (ticket, classification, analyse) => {

  const systemPrompt = `
    Tu es un agent de support client professionnel et empathique.
    Tu génères une réponse initiale adaptée au sentiment du client.
    
    Règles importantes :
    - Si sentiment "calme"     → ton professionnel et direct
    - Si sentiment "frustre"   → ton empathique et rassurant
    - Si sentiment "desespere" → ton très empathique + solution urgente
    - Si priorité "critical"   → mentionner un délai précis et rapide
    - Toujours terminer par une prochaine étape concrète
    - Répondre en français professionnel
    - Ne jamais mentionner que tu es une IA
    
    Tu réponds UNIQUEMENT en JSON valide, sans texte avant ou après.
    Format exact :
    {
      "reponse": "texte complet de la réponse au client",
      "ton": "professionnel|empathique|urgent",
      "delaiEstime": "1h|2h|4h|24h|48h",
      "prochaineEtape": "description de la prochaine action concrète",
      "scoreConfiance": 0.85
    }
  `;

  const userPrompt = `
    TICKET :
    Titre       : ${ticket.titre}
    Description : ${ticket.description}
    Type        : ${ticket.type}

    CONTEXTE ANALYSÉ PAR L'IA :
    Catégorie   : ${classification.categorie}
    Sous-cat.   : ${classification.sousCategorie}
    Priorité    : ${classification.priorite}
    Complexité  : ${classification.complexite}
    Sentiment   : ${analyse.sentiment}
    Urgence     : ${analyse.niveauUrgence}
    Résumé      : ${analyse.resume}
    
    Génère une réponse adaptée à ce contexte.
  `;

  // Appel simple — la réponse auto est juste un brouillon
  // que l'agent peut modifier avant d'envoyer
  const llmResult = await callLLM(systemPrompt, userPrompt);

  return {
    data:         parseJSON(llmResult.reponse),
    raisonnement: llmResult.raisonnement,
    dureeMs:      llmResult.dureeMs
  };
};

module.exports = { genererReponse };