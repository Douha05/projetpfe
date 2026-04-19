// services/ia/analyseHistorique.js
const { callLLM, parseJSON } = require('../../config/openrouter');
const Ticket                 = require('../../models/Ticket');

const analyserHistorique = async (ticket, historique) => {

  const systemPrompt = `
    Tu es un expert en analyse de tickets de support client.
    Tu analyses le ticket actuel et l'historique du client.
    Tu réponds UNIQUEMENT en JSON valide, sans texte avant ou après.
    Format exact :
    {
      "resume": "résumé du problème en 2 phrases maximum",
      "problemesRecurrents": ["problème 1", "problème 2"],
      "niveauUrgence": "faible|moyen|élevé|critique",
      "sentiment": "calme|frustre|desespere",
      "contexteClient": "nouveau client|client fidèle|client à risque",
      "scoreConfiance": 0.90
    }
  `;

  const userPrompt = `
    TICKET ACTUEL :
    Titre       : ${ticket.titre}
    Description : ${ticket.description}
    Type        : ${ticket.type}
    Priorité    : ${ticket.priorite}

    HISTORIQUE CLIENT (${historique.length} tickets précédents) :
    ${historique.length === 0
      ? "Aucun ticket précédent — nouveau client"
      : historique.map((t, i) => `
          #${i + 1} | Titre: ${t.titre}
                   | Statut: ${t.statut}
                   | Priorité: ${t.priorite}
                   | Type: ${t.type}
                   | Date: ${new Date(t.createdAt).toLocaleDateString('fr-FR')}
        `).join('\n')
    }
  `;

  const llmResult = await callLLM(systemPrompt, userPrompt);

  return {
    data:         parseJSON(llmResult.reponse),
    raisonnement: llmResult.raisonnement,
    dureeMs:      llmResult.dureeMs
  };
};

module.exports = { analyserHistorique };