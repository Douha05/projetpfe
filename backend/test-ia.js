// backend/test-ia.js
require('dotenv').config();
const mongoose = require('mongoose');
const config   = require('config');

// ── Couleurs terminal ──────────────────────────────────────
const vert    = (t) => `\x1b[32m${t}\x1b[0m`;
const rouge   = (t) => `\x1b[31m${t}\x1b[0m`;
const jaune   = (t) => `\x1b[33m${t}\x1b[0m`;
const bleu    = (t) => `\x1b[34m${t}\x1b[0m`;
const gras    = (t) => `\x1b[1m${t}\x1b[0m`;

// ── Séparateur visuel ──────────────────────────────────────
const sep = () => console.log('─'.repeat(60));

// ============================================================
// TEST 1 — Connexion OpenRouter seul (sans BDD)
// ============================================================
const testerOpenRouter = async () => {
  sep();
  console.log(bleu(gras('TEST 1 — Connexion OpenRouter')));
  sep();

  const fetch = require('node-fetch');
  const API_KEY = config.get('openRouterKey');

  console.log('🔑 Clé API :', API_KEY ? vert('✅ Trouvée') : rouge('❌ Manquante'));

  if (!API_KEY) {
    console.log(rouge('❌ Arrêt — clé API manquante dans config/default.json'));
    return false;
  }

  try {
    console.log('📡 Envoi requête vers OpenRouter...');

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model:  "openrouter/free",
        messages: [
          {
            role: "system",
            content: "Tu es un assistant de ticketing. Réponds uniquement en JSON valide, sans texte avant ou après."
          },
          {
            role: "user",
            content: `Analyse ce ticket et réponds UNIQUEMENT en JSON :
            {
              "resume": "...",
              "priorite": "low|medium|high|critical",
              "sentiment": "calme|frustre|desespere",
              "scoreConfiance": 0.90
            }
            Ticket : "Mon application ne fonctionne plus depuis ce matin, erreur 500 impossible de se connecter. C'est urgent !"`
          }
        ]
      })
    });

    const result = await response.json();

    // Vérifier erreur API
    if (result.error) {
      console.log(rouge(`❌ Erreur OpenRouter : ${result.error.message}`));
      console.log(rouge(`   Détail : ${JSON.stringify(result.error, null, 2)}`));
      return false;
    }

    const message = result.choices[0].message;

    console.log(vert('✅ Connexion réussie !'));
    console.log('📝 Réponse brute     :', message.content);
    console.log('⏱️  Tokens utilisés   :', result.usage);

    // Parser JSON
    try {
      const propre = message.content.replace(/```json/g, '').replace(/```/g, '').trim();
      const json   = JSON.parse(propre);
      console.log(vert('\n✅ JSON parsé avec succès :'));
      console.log(json);
      return true;
    } catch (e) {
      console.log(jaune('⚠️  JSON invalide — réponse brute :'), message.content);
      return false;
    }

  } catch (err) {
    console.log(rouge(`❌ Erreur réseau : ${err.message}`));
    return false;
  }
};

// ============================================================
// TEST 2 — Connexion MongoDB
// ============================================================
const testerMongoDB = async () => {
  sep();
  console.log(bleu(gras('TEST 2 — Connexion MongoDB')));
  sep();

  try {
    await mongoose.connect(config.get('mongoURI'));
    console.log(vert('✅ MongoDB connecté'));

    // Compter les collections
    const Ticket       = require('./models/Ticket');
    const User         = require('./models/User');
    const IaLog        = require('./models/IaLog');
    const IaSuggestion = require('./models/IaSuggestion');

    const [tickets, users, logs, suggestions] = await Promise.all([
      Ticket.countDocuments(),
      User.countDocuments(),
      IaLog.countDocuments(),
      IaSuggestion.countDocuments()
    ]);

    console.log(` Tickets       : ${tickets}`);
    console.log(`Users         : ${users}`);
    console.log(` IaLogs        : ${logs}`);
    console.log(` IaSuggestions : ${suggestions}`);

    // Vérifier agents disponibles
    const agents = await User.find({ role: 'support', isActive: true });
    console.log(`\n Agents support actifs : ${agents.length}`);

    if (agents.length === 0) {
      console.log(jaune('  Aucun agent support — l\'assignation IA va échouer !'));
      console.log(jaune('   Crée un user avec role: "support" et isActive: true'));
    } else {
      agents.forEach(a => {
        console.log(`   → ${a.prenom} ${a.nom} | workload: ${a.workloadActuel} | spécialités: ${a.specialites?.join(', ') || 'Aucune'}`);
      });
    }

    return tickets > 0;

  } catch (err) {
    console.log(rouge(`❌ Erreur MongoDB : ${err.message}`));
    return false;
  }
};

// ============================================================
// TEST 3 — Analyse IA complète sur un ticket réel
// ============================================================
const testerAnalyseComplete = async () => {
  sep();
  console.log(bleu(gras('TEST 3 — Analyse IA Complète')));
  sep();

  try {
    const Ticket = require('./models/Ticket');
    const indexIA = require('./services/ia/indexIA');
console.log(' Exports indexIA :', Object.keys(indexIA));
const lancerAnalyseComplete = indexIA.lancerAnalyseComplete;

    // Récupérer le dernier ticket créé
    const ticket = await Ticket.findOne().sort({ createdAt: -1 });

    if (!ticket) {
      console.log(jaune('  Aucun ticket en BDD — crée un ticket d\'abord'));
      return false;
    }

    console.log(` Ticket trouvé : ${ticket._id}`);
    console.log(`   Titre         : ${ticket.titre}`);
    console.log(`   Description   : ${ticket.description?.substring(0, 60)}...`);
    console.log(`   Statut        : ${ticket.statut}`);
    console.log('\n Lancement analyse IA...\n');

    const debut    = Date.now();
    const resultat = await lancerAnalyseComplete(ticket._id);
    const duree    = Date.now() - debut;

    if (!resultat.succes) {
      console.log(rouge(`❌ Échec : ${resultat.erreur}`));
      return false;
    }

    console.log(vert('\n✅ ANALYSE COMPLÈTE RÉUSSIE !'));
    console.log(`⏱️  Durée totale : ${duree}ms\n`);

    sep();
    console.log(bleu(' 1. Analyse Historique :'));
    console.log(`   Résumé           : ${resultat.analyse.resume}`);
    console.log(`   Sentiment        : ${resultat.analyse.sentiment}`);
    console.log(`   Urgence          : ${resultat.analyse.niveauUrgence}`);
    console.log(`   Contexte client  : ${resultat.analyse.contexteClient}`);
    console.log(`   Confiance        : ${resultat.analyse.scoreConfiance}`);

    sep();
    console.log(bleu('  2. Classification :'));
    console.log(`   Catégorie        : ${resultat.classification.categorie}`);
    console.log(`   Sous-catégorie   : ${resultat.classification.sousCategorie}`);
    console.log(`   Priorité IA      : ${resultat.classification.priorite}`);
    console.log(`   Complexité       : ${resultat.classification.complexite}`);
    console.log(`   Tags             : ${resultat.classification.tags?.join(', ')}`);
    console.log(`   Confiance        : ${resultat.classification.scoreConfiance}`);

    sep();
    console.log(bleu('👤 3. Assignation :'));
    console.log(`   Agent ID         : ${resultat.assignation.agentId}`);
    console.log(`   Agent Nom        : ${resultat.assignation.agentNom}`);
    console.log(`   Raison           : ${resultat.assignation.raison}`);
    console.log(`   Score spécialité : ${resultat.assignation.scoreSpecialite}`);
    console.log(`   Score workload   : ${resultat.assignation.scoreWorkload}`);
    console.log(`   Confiance        : ${resultat.assignation.scoreConfiance}`);

    sep();
    console.log(bleu(' 4. Réponse Automatique :'));
    console.log(`   Ton              : ${resultat.reponse.ton}`);
    console.log(`   Délai estimé     : ${resultat.reponse.delaiEstime}`);
    console.log(`   Prochaine étape  : ${resultat.reponse.prochaineEtape}`);
    console.log(`   Confiance        : ${resultat.reponse.scoreConfiance}`);
    console.log(`\n    Réponse complète :\n`);
    console.log(`   "${resultat.reponse.reponse}"`);

    return true;

  } catch (err) {
    console.log(rouge(` Erreur : ${err.message}`));
    console.error(err);
    return false;
  }
};

// ============================================================
// TEST 4 — Vérifier la sauvegarde en BDD
// ============================================================
const testerSauvegardeBDD = async () => {
  sep();
  console.log(bleu(gras('TEST 4 — Vérification Sauvegarde BDD')));
  sep();

  try {
    const IaLog        = require('./models/IaLog');
    const IaSuggestion = require('./models/IaSuggestion');
    const Ticket       = require('./models/Ticket');

    // Derniers logs
    const logs = await IaLog.find().sort({ createdAt: -1 }).limit(3);
    console.log(`📋 Derniers IaLogs (${logs.length}) :`);
    logs.forEach(l => {
      const statut = l.statut === 'succes' ? vert('✅') : rouge('❌');
      console.log(`   ${statut} ${l.action} | ${l.dureeMs}ms | ${new Date(l.createdAt).toLocaleString('fr-FR')}`);
    });

    // Dernières suggestions
    const suggestions = await IaSuggestion.find().sort({ createdAt: -1 }).limit(4);
    console.log(`\n💡 Dernières IaSuggestions (${suggestions.length}) :`);
    suggestions.forEach(s => {
      console.log(`   📌 ${s.type} | statut: ${s.statut} | confiance: ${s.scoreConfiance}`);
    });

    // Ticket mis à jour
    const ticket = await Ticket.findOne({ iaTraite: true }).sort({ createdAt: -1 });
    if (ticket) {
      console.log(vert('\n✅ Ticket mis à jour par l\'IA :'));
      console.log(`   resumeIa              : ${ticket.resumeIa}`);
      console.log(`   prioriteIa            : ${ticket.prioriteIa}`);
      console.log(`   sentimentClient       : ${ticket.sentimentClient}`);
      console.log(`   categorieIa           : ${ticket.categorieIa}`);
      console.log(`   assigneAutomatiquement: ${ticket.assigneAutomatiquement}`);
    } else {
      console.log(jaune('⚠️  Aucun ticket avec iaTraite: true'));
    }

    return true;

  } catch (err) {
    console.log(rouge(`❌ Erreur : ${err.message}`));
    return false;
  }
};

// ============================================================
// LANCER TOUS LES TESTS
// ============================================================
const lancerTousLesTests = async () => {
  console.log('\n');
  console.log(gras('═'.repeat(60)));
  console.log(gras('       🧪 TESTS MODULE IA — TICKETING SYSTEM'));
  console.log(gras('═'.repeat(60)));

  const resultats = {
    openrouter: false,
    mongodb:    false,
    analyse:    false,
    bdd:        false
  };

  // Test 1 — OpenRouter
  resultats.openrouter = await testerOpenRouter();

  if (!resultats.openrouter) {
    console.log(rouge('\n❌ Test OpenRouter échoué — arrêt des tests\n'));
    process.exit(1);
  }

  // Test 2 — MongoDB
  resultats.mongodb = await testerMongoDB();

  if (!resultats.mongodb) {
    console.log(jaune('\n⚠️  Aucun ticket en BDD — on crée un ticket de test...\n'));
    const Ticket = require('./models/Ticket');
    const User   = require('./models/User');
    const client = await User.findOne({ role: 'client' });

    if (client) {
      await Ticket.create({
        titre:       'Test IA — Application ne répond plus',
        description: 'Depuis ce matin mon application affiche une erreur 500. Impossible de se connecter. C\'est urgent car nous avons des clients qui attendent.',
        type:        'bug',
        priorite:    'high',
        reporter:    client._id,
        statut:      'ready_for_support'
      });
      console.log(vert('✅ Ticket de test créé'));
    } else {
      console.log(rouge('❌ Aucun client en BDD — impossible de créer un ticket test'));
      process.exit(1);
    }
  }

  // Test 3 — Analyse IA complète
  resultats.analyse = await testerAnalyseComplete();

  // Test 4 — Vérification BDD
  if (resultats.analyse) {
    resultats.bdd = await testerSauvegardeBDD();
  }

  // ── Résumé final ─────────────────────────────────────────
  sep();
  console.log(gras('📊 RÉSUMÉ FINAL :'));
  sep();
  console.log(`  OpenRouter   : ${resultats.openrouter ? vert('✅ OK') : rouge('❌ FAIL')}`);
  console.log(`  MongoDB      : ${resultats.mongodb    ? vert('✅ OK') : jaune('⚠️  Vide')}`);
  console.log(`  Analyse IA   : ${resultats.analyse    ? vert('✅ OK') : rouge('❌ FAIL')}`);
  console.log(`  Sauvegarde   : ${resultats.bdd        ? vert('✅ OK') : rouge('❌ FAIL')}`);
  sep();

  const tousOK = resultats.openrouter && resultats.analyse && resultats.bdd;
  if (tousOK) {
    console.log(vert(gras('\n🎉 TOUS LES TESTS PASSÉS — Module IA prêt !\n')));
  } else {
    console.log(rouge(gras('\n⚠️  Certains tests ont échoué — vérifie les erreurs ci-dessus\n')));
  }

  await mongoose.connection.close();
  process.exit(0);
};

lancerTousLesTests();