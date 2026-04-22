const fetch = require('node-fetch');

const MODEL      = "llama3.2:3b";
const OLLAMA_URL = "http://localhost:11434/api/chat";

// ─────────────────────────────────────────
// Fetch avec retry automatique (3 tentatives)
// ─────────────────────────────────────────
const fetchAvecRetry = async (messages, maxTentatives = 3) => {
  for (let i = 1; i <= maxTentatives; i++) {
    console.log(`   🔄 Tentative ${i}/${maxTentatives}...`);

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model:  MODEL,
        messages,
        stream: false
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.log(`   ⚠️  Erreur tentative ${i} : ${errText}`);
      if (i === maxTentatives) throw new Error(`Ollama error: ${errText}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      continue;
    }

    const result = await response.json();
    return result;
  }
};

// ─────────────────────────────────────────
// Appel simple — 1 seul tour
// ─────────────────────────────────────────
const callLLM = async (systemPrompt, userPrompt) => {
  const debut = Date.now();

  const result = await fetchAvecRetry([
    { role: "system", content: systemPrompt },
    { role: "user",   content: userPrompt   }
  ]);

  return {
    reponse:      result.message.content,
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
  const result1 = await fetchAvecRetry([
    { role: "system", content: systemPrompt },
    { role: "user",   content: userPrompt   }
  ]);

  const assistantMsg = result1.message.content;

  // --- Tour 2 ---
  const result2 = await fetchAvecRetry([
    { role: "system",    content: systemPrompt      },
    { role: "user",      content: userPrompt        },
    { role: "assistant", content: assistantMsg      },
    { role: "user",      content: questionValidation }
  ]);

  return {
    reponse:      result2.message.content,
    raisonnement: null,
    dureeMs:      Date.now() - debut
  };
};

// ─────────────────────────────────────────
// Parser le JSON retourné par le LLM
// ─────────────────────────────────────────
const parseJSON = (texte) => {
  let propre = texte
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const debut = propre.indexOf('{');
  const fin   = propre.lastIndexOf('}');

  if (debut === -1 || fin === -1) {
    throw new Error(`Aucun JSON trouvé : ${propre.substring(0, 100)}`);
  }

  propre = propre.substring(debut, fin + 1);

  // Nettoyer les caractères problématiques
  propre = propre
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/\\'/g, "'")
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\t/g, ' ');

  try {
    return JSON.parse(propre);
  } catch (e) {
    try {
      return JSON.parse(JSON.stringify(eval('(' + propre + ')')));
    } catch {
      throw new Error(`JSON invalide : ${e.message} — ${propre.substring(0, 200)}`);
    }
  }
};

module.exports = { callLLM, callLLMWithValidation, parseJSON };