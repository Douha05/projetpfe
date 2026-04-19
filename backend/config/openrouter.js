const fetch  = require('node-fetch');
const config = require('config');

const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const API_KEY = config.get('openRouterKey');

// ─────────────────────────────────────────
// Fetch avec retry automatique (3 tentatives)
// ─────────────────────────────────────────
const fetchAvecRetry = async (body, maxTentatives = 3) => {
  for (let i = 1; i <= maxTentatives; i++) {
    console.log(`   🔄 Tentative ${i}/${maxTentatives}...`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!result.error) return result;

    console.log(`   ⚠️  Erreur tentative ${i} : ${result.error.message}`);
    console.log(`   🔴 Détail complet : ${JSON.stringify(result.error, null, 2)}`);

    if (i === maxTentatives) {
      throw new Error(`OpenRouter error: ${result.error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }
};

// ─────────────────────────────────────────
// Appel simple — 1 seul tour
// ─────────────────────────────────────────
const callLLM = async (systemPrompt, userPrompt) => {
  const debut = Date.now();

  const result = await fetchAvecRetry({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt }
    ]
  });

  const assistantMsg = result.choices[0].message;

  return {
    reponse:      assistantMsg.content,
    raisonnement: null,
    dureeMs:      Date.now() - debut
  };
};

// ─────────────────────────────────────────
// Double tour — 2 appels avec validation
// ─────────────────────────────────────────
const callLLMWithValidation = async (systemPrompt, userPrompt, questionValidation) => {
  const debut = Date.now();

  // --- Tour 1 ---
  const result1 = await fetchAvecRetry({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt }
    ]
  });

  const assistantMsg = result1.choices[0].message;

  // --- Tour 2 ---
  const result2 = await fetchAvecRetry({
    model: MODEL,
    messages: [
      { role: "system",    content: systemPrompt      },
      { role: "user",      content: userPrompt        },
      { role: "assistant", content: assistantMsg.content },
      { role: "user",      content: questionValidation }
    ]
  });

  return {
    reponse:      result2.choices[0].message.content,
    raisonnement: null,
    dureeMs:      Date.now() - debut
  };
};

// ─────────────────────────────────────────
// Parser le JSON retourné par le LLM
// ─────────────────────────────────────────
const parseJSON = (texte) => {
  // Nettoyer les balises markdown
  let propre = texte
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // Extraire uniquement le bloc JSON entre { et }
  const debut = propre.indexOf('{');
  const fin   = propre.lastIndexOf('}');

  if (debut === -1 || fin === -1) {
    throw new Error(`Aucun JSON trouvé dans la réponse : ${propre.substring(0, 100)}`);
  }

  propre = propre.substring(debut, fin + 1);

  return JSON.parse(propre);
};
module.exports = { callLLM, callLLMWithValidation, parseJSON };