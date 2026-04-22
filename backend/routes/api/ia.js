// routes/api/ia.js
const express        = require('express');
const router         = express.Router();
const { lancerAnalyseComplete } = require('../../services/ia/indexIA');
const IaSuggestion   = require('../../models/IaSuggestion');
const IaLog          = require('../../models/IaLog');
const authMiddleware = require('../../middleware/authmiddleware');

// ──────────────────────────────────────────────────────────
// POST /api/ia/analyser/:ticketId
// Lancer l'analyse complète d'un ticket
//
// PROTECTION : avant de créer les nouvelles suggestions,
// on supprime les anciennes pour éviter les doublons.
// Résultat : 1 ticket = exactement 4 suggestions (une par type).
// ──────────────────────────────────────────────────────────
router.post('/analyser/:ticketId', authMiddleware, async (req, res) => {
  try {
    const { ticketId } = req.params;

    // ─── NETTOYAGE AVANT ANALYSE ───
    // On supprime les anciennes suggestions et logs de succès
    // de ce ticket avant de lancer la nouvelle analyse.
    // Ça garantit qu'un ticket n'aura jamais plus de 4 suggestions.
    const [suggestionsSupprimees, logsSupprimes] = await Promise.all([
      IaSuggestion.deleteMany({ ticketId }),
      IaLog.deleteMany({ ticketId, statut: 'succes' })
    ]);

    if (suggestionsSupprimees.deletedCount > 0) {
      console.log(`[IA] Ticket ${ticketId} : ${suggestionsSupprimees.deletedCount} anciennes suggestions supprimées avant ré-analyse`);
    }
    if (logsSupprimes.deletedCount > 0) {
      console.log(`[IA] Ticket ${ticketId} : ${logsSupprimes.deletedCount} anciens logs de succès supprimés`);
    }

    // ─── Lancer l'analyse IA complète ───
    const resultat = await lancerAnalyseComplete(ticketId);

    if (!resultat.succes) {
      return res.status(500).json({
        succes:  false,
        message: resultat.erreur
      });
    }

    res.json({
      succes:         true,
      message:        "Analyse IA terminée avec succès",
      analyse:        resultat.analyse,
      classification: resultat.classification,
      assignation:    resultat.assignation,
      reponse:        resultat.reponse
    });

  } catch (err) {
    console.error(`[IA] Erreur analyse ticket ${req.params.ticketId}:`, err);
    res.status(500).json({
      succes:  false,
      message: err.message
    });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/ia/suggestions/:ticketId
// Récupérer toutes les suggestions IA d'un ticket
// ──────────────────────────────────────────────────────────
router.get('/suggestions/:ticketId', authMiddleware, async (req, res) => {
  try {
    const suggestions = await IaSuggestion.find({
      ticketId: req.params.ticketId
    })
    .sort({ createdAt: -1 });

    res.json({ suggestions });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ──────────────────────────────────────────────────────────
// PATCH /api/ia/suggestion/:id
// Accepter ou rejeter une suggestion IA
// ──────────────────────────────────────────────────────────
router.patch('/suggestion/:id', authMiddleware, async (req, res) => {
  try {
    const { statut } = req.body;

    // Vérifier que le statut est valide
    if (!['acceptee', 'rejetee'].includes(statut)) {
      return res.status(400).json({
        message: "Statut invalide — utiliser 'acceptee' ou 'rejetee'"
      });
    }

    const suggestion = await IaSuggestion.findByIdAndUpdate(
      req.params.id,
      {
        statut,
        valideParId: req.user.id
      },
      { new: true }
    );

    if (!suggestion) {
      return res.status(404).json({ message: "Suggestion introuvable" });
    }

    res.json({
      message:    `Suggestion ${statut} avec succès`,
      suggestion
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/ia/logs/:ticketId
// Récupérer les logs IA d'un ticket
// ──────────────────────────────────────────────────────────
router.get('/logs/:ticketId', authMiddleware, async (req, res) => {
  try {
    const logs = await IaLog.find({
      ticketId: req.params.ticketId
    })
    .sort({ createdAt: -1 });

    res.json({ logs });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/ia/stats
// Statistiques globales du module IA (pour dashboard BI)
// ──────────────────────────────────────────────────────────
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [
      totalLogs,
      totalSucces,
      totalErreurs,
      totalSuggestions,
      totalAcceptees,
      totalRejetees
    ] = await Promise.all([
      IaLog.countDocuments(),
      IaLog.countDocuments({ statut: 'succes' }),
      IaLog.countDocuments({ statut: 'erreur' }),
      IaSuggestion.countDocuments(),
      IaSuggestion.countDocuments({ statut: 'acceptee' }),
      IaSuggestion.countDocuments({ statut: 'rejetee' })
    ]);

    // Temps de réponse moyen du LLM
    const moyenneDuree = await IaLog.aggregate([
      { $match: { statut: 'succes', dureeMs: { $ne: null } } },
      { $group: { _id: null, moyenne: { $avg: '$dureeMs' } } }
    ]);

    res.json({
      logs: {
        total:   totalLogs,
        succes:  totalSucces,
        erreurs: totalErreurs
      },
      suggestions: {
        total:    totalSuggestions,
        acceptees: totalAcceptees,
        rejetees:  totalRejetees,
        enAttente: totalSuggestions - totalAcceptees - totalRejetees
      },
      performance: {
        tempsMoyenMs: moyenneDuree[0]?.moyenne
          ? Math.round(moyenneDuree[0].moyenne)
          : 0
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;