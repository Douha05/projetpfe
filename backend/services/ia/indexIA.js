// services/ia/indexIA.js
const { analyserHistorique }  = require('./analyseHistorique');
const { classifierTicket }    = require('./classificationTicket');
const { assignerTicket }      = require('./assignationTicket');
const { genererReponse }      = require('./reponseAutomatique');
const Ticket                  = require('../../models/Ticket');
const IaLog                   = require('../../models/IaLog');
const IaSuggestion            = require('../../models/IaSuggestion');

const lancerAnalyseComplete = async (ticketId) => {
  console.log(`🤖 Début analyse IA — Ticket #${ticketId}`);

  try {
    // ── 0. Récupérer le ticket + historique client ──────────
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} introuvable`);

    const historique = await Ticket.find(
      {
        reporter: ticket.reporter,
        _id:      { $ne: ticketId }
      },
      'titre statut priorite type createdAt'
    )
    .sort({ createdAt: -1 })
    .limit(10);

    // ── 1. Analyse historique ───────────────────────────────
    console.log(`📌 Étape 1/4 — Analyse historique`);
    const analyse = await analyserHistorique(ticket, historique);

    // ── 2. Classification ───────────────────────────────────
    console.log(`🏷️  Étape 2/4 — Classification`);
    const classification = await classifierTicket(ticket);

    // ── 3. Assignation ──────────────────────────────────────
    console.log(`👤 Étape 3/4 — Assignation`);
    const assignation = await assignerTicket(ticket, classification.data);

    // ── 4. Réponse automatique ──────────────────────────────
    console.log(`💬 Étape 4/4 — Réponse automatique`);
    const reponse = await genererReponse(
      ticket,
      classification.data,
      analyse.data
    );

    // ── 5. Mettre à jour le ticket ──────────────────────────
    await Ticket.findByIdAndUpdate(ticketId, {
      resumeIa:               analyse.data.resume,
      prioriteIa:             classification.data.priorite,
      sentimentClient:        analyse.data.sentiment,
      categorieIa:            classification.data.categorie,
      assignee:               assignation.data.agentId,
      assigneAutomatiquement: true,
      iaTraite:               true
    });

    // ── 6. Sauvegarder les 4 suggestions ───────────────────
    await IaSuggestion.insertMany([
      {
        ticketId,
        type:           'analyse',
        contenu:        JSON.stringify(analyse.data),
        scoreConfiance: analyse.data.scoreConfiance,
        statut:         'en_attente'
      },
      {
        ticketId,
        type:           'priorite',
        contenu:        JSON.stringify(classification.data),
        scoreConfiance: classification.data.scoreConfiance,
        statut:         'en_attente'
      },
      {
        ticketId,
        type:           'assignation',
        contenu:        JSON.stringify(assignation.data),
        scoreConfiance: assignation.data.scoreConfiance,
        statut:         'en_attente'
      },
      {
        ticketId,
        type:           'reponse_auto',
        contenu:        JSON.stringify(reponse.data),
        scoreConfiance: reponse.data.scoreConfiance,
        statut:         'en_attente'
      }
    ]);

    // ── 7. Logger toutes les actions ────────────────────────
    await IaLog.insertMany([
      {
        ticketId,
        action:       'analyse',
        outputData:   JSON.stringify(analyse.data),
        raisonnement: analyse.raisonnement,
        dureeMs:      analyse.dureeMs,
        statut:       'succes'
      },
      {
        ticketId,
        action:       'assignation',
        outputData:   JSON.stringify(assignation.data),
        raisonnement: assignation.raisonnement,
        dureeMs:      assignation.dureeMs,
        statut:       'succes'
      },
      {
        ticketId,
        action:       'reponse_auto',
        outputData:   JSON.stringify(reponse.data),
        raisonnement: reponse.raisonnement,
        dureeMs:      reponse.dureeMs,
        statut:       'succes'
      }
    ]);

    console.log(`✅ Analyse IA complète — Ticket #${ticketId}`);

    return {
      succes:         true,
      analyse:        analyse.data,
      classification: classification.data,
      assignation:    assignation.data,
      reponse:        reponse.data
    };

  } catch (err) {
    console.error(`❌ Erreur IA — Ticket #${ticketId} :`, err.message);

    await IaLog.create({
      ticketId,
      action:     'erreur',
      outputData: err.message,
      statut:     'erreur'
    }).catch(() => {});

    return { succes: false, erreur: err.message };
  }
};

module.exports = { lancerAnalyseComplete };