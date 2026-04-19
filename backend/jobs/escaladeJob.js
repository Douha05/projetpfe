const cron = require("node-cron");
const Ticket = require("../models/Ticket");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Workflow = require("../models/Workflow");
const { sendPushNotification, sendPushToMany } = require("../config/webpush");

const pushAudit = async (ticketId, action, details = "") => {
  try {
    await Ticket.findByIdAndUpdate(ticketId, {
      $push: {
        historique: {
          action, auteur: null, auteurNom: "Système automatique",
          details, createdAt: new Date(),
        },
      },
    });
  } catch (e) {
    console.error("❌ Erreur audit log :", e.message);
  }
};

const lancerEscaladeAuto = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const workflow = await Workflow.findOne();
      if (!workflow) return;

      // ════════════════════════════════════════════════════════
      // 1. FERMETURE AUTOMATIQUE
      // ════════════════════════════════════════════════════════
      const DELAI_FERMETURE_JOURS = 7;
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - DELAI_FERMETURE_JOURS);

      const ticketsAFermer = await Ticket.find({
        statut: "ready_for_customer",
        statutChangedAt: { $lte: dateLimit },
        "feedback.note": null,
        bloque: { $ne: true },
      });

      if (ticketsAFermer.length > 0)
        console.log(`🔒 ${ticketsAFermer.length} ticket(s) à fermer automatiquement...`);

      for (const ticket of ticketsAFermer) {
        console.log(`🔒 FERMETURE AUTO : "${ticket.titre}"`);
        await Ticket.findByIdAndUpdate(ticket._id, { statut: "solved", statutChangedAt: new Date() });
        await pushAudit(ticket._id, "auto_closed", `Fermé automatiquement — client sans réponse depuis ${DELAI_FERMETURE_JOURS} jours`);

        await Notification.create({ destinataire: ticket.reporter, ticket: ticket._id, message: `✅ Votre ticket "${ticket.titre}" a été résolu automatiquement.`, type: "ticket_resolu", lu: false });
        // ✅ Push au client
        await sendPushNotification(ticket.reporter, `✅ Ticket résolu`, `"${ticket.titre}" résolu automatiquement`);

        if (ticket.assignee) {
          await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `✅ Le ticket "${ticket.titre}" a été résolu automatiquement.`, type: "ticket_resolu", lu: false });
          await sendPushNotification(ticket.assignee, `✅ Ticket résolu auto`, `"${ticket.titre}"`);
        }

        const teamLeads = await User.find({ role: "team_lead", isActive: true });
        if (teamLeads.length > 0) {
          await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `✅ Ticket "${ticket.titre}" résolu automatiquement.`, type: "ticket_resolu", lu: false })));
          await sendPushToMany(teamLeads.map(tl => tl._id), `✅ Ticket résolu auto`, `"${ticket.titre}"`);
        }
        console.log(`✅ Ticket "${ticket.titre}" fermé automatiquement`);
      }

      const maintenant = new Date();

      // ════════════════════════════════════════════════════════
      // 2. NOTIFICATION SLA EXPIRE BIENTÔT (< 1h)
      // ════════════════════════════════════════════════════════
      const dans1h = new Date(maintenant.getTime() + 60 * 60 * 1000);

      const ticketsSlaEnDanger = await Ticket.find({
        statut: { $nin: ["solved", "closed", "cancelled", "escalated"] },
        slaDeadline: { $lte: dans1h, $gte: maintenant },
        assignee: { $ne: null },
        bloque: { $ne: true },
      });

      for (const ticket of ticketsSlaEnDanger) {
        const restantMinutes = Math.round((new Date(ticket.slaDeadline) - maintenant) / 60000);
        const labelPriorite = { critical:"Critique", high:"Haute", medium:"Moyen", low:"Faible" }[ticket.priorite] || ticket.priorite;

        const dejaNotifie = await Notification.findOne({
          destinataire: ticket.assignee, ticket: ticket._id, type: "sla_warning",
          createdAt: { $gte: new Date(maintenant.getTime() - 60 * 60 * 1000) },
        });

        if (!dejaNotifie) {
          await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `⏰ SLA expire dans ${restantMinutes} min — "${ticket.titre}" [${labelPriorite}]`, type: "sla_warning", lu: false });
          // ✅ Push à l'agent
          await sendPushNotification(ticket.assignee, `⏰ SLA expire bientôt`, `"${ticket.titre}" — ${restantMinutes}min restantes !`);

          const teamLeads = await User.find({ role: "team_lead", isActive: true });
          if (teamLeads.length > 0) {
            await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `⏰ SLA expire dans ${restantMinutes} min — "${ticket.titre}" [${labelPriorite}]`, type: "sla_warning", lu: false })));
            // ✅ Push aux chefs d'équipe
            await sendPushToMany(teamLeads.map(tl => tl._id), `⏰ SLA en danger`, `"${ticket.titre}" — ${restantMinutes}min restantes`);
          }

          await pushAudit(ticket._id, "sla_warning", `SLA expire dans ${restantMinutes} min`);
          console.log(`⏰ SLA EN DANGER : "${ticket.titre}" — ${restantMinutes}min restantes`);
        }
      }

      // ════════════════════════════════════════════════════════
      // 3. MARQUER SLA DÉPASSÉ
      // ════════════════════════════════════════════════════════
      const ticketsSlaDepasses = await Ticket.find({
        statut: { $nin: ["solved", "closed", "cancelled"] },
        slaDeadline: { $lt: maintenant },
        slaRespect: null,
        bloque: { $ne: true },
      });

      for (const ticket of ticketsSlaDepasses) {
        const depassementMinutes = Math.round((maintenant - new Date(ticket.slaDeadline)) / 60000);
        const labelPriorite = { critical:"Critique", high:"Haute", medium:"Moyen", low:"Faible" }[ticket.priorite] || ticket.priorite;

        await Ticket.findByIdAndUpdate(ticket._id, { slaBreached: true, slaRespect: false });

        const dejaNotifie = await Notification.findOne({
          ticket: ticket._id, type: "sla_breach",
          createdAt: { $gte: new Date(maintenant.getTime() - 2 * 60 * 60 * 1000) },
        });

        if (!dejaNotifie) {
          if (ticket.assignee) {
            await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `❌ SLA dépassé de ${depassementMinutes} min — "${ticket.titre}" [${labelPriorite}]`, type: "sla_breach", lu: false });
            // ✅ Push à l'agent
            await sendPushNotification(ticket.assignee, `❌ SLA dépassé`, `"${ticket.titre}" — ${depassementMinutes}min de retard`);
          }

          const teamLeads = await User.find({ role: "team_lead", isActive: true });
          if (teamLeads.length > 0) {
            await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `❌ SLA dépassé de ${depassementMinutes} min — "${ticket.titre}" [${labelPriorite}]`, type: "sla_breach", lu: false })));
            // ✅ Push aux chefs d'équipe
            await sendPushToMany(teamLeads.map(tl => tl._id), `❌ SLA dépassé`, `"${ticket.titre}" — ${depassementMinutes}min de retard`);
          }

          await pushAudit(ticket._id, "sla_breach", `SLA dépassé de ${depassementMinutes} min`);
          console.log(`❌ SLA DÉPASSÉ : "${ticket.titre}" — ${depassementMinutes}min de retard`);
        }
      }

      // ════════════════════════════════════════════════════════
      // 4. RAPPEL + ESCALADE AUTOMATIQUE (inactivité)
      // ════════════════════════════════════════════════════════
      const tickets = await Ticket.find({
        statut: { $nin: ["escalated", "solved", "closed", "cancelled"] },
        bloque: { $ne: true },
      });

      if (tickets.length === 0) {
        console.log("📭 Aucun ticket actif à vérifier.");
        return;
      }

      console.log(`🔄 Vérification de ${tickets.length} ticket(s)...`);

      for (const ticket of tickets) {
        const transition = workflow.transitions.find((t) => t.de === ticket.statut && t.active);
        if (!transition) { console.log(`⏭️ "${ticket.titre}" — aucune transition active`); continue; }

        const delaiMinutes = transition.delaiEscaladeMinutes ||
          (transition.delaiEscaladeHeures ? Math.round(transition.delaiEscaladeHeures * 60)
            : workflow.slaConfig && ticket.priorite && workflow.slaConfig[ticket.priorite]
              ? workflow.slaConfig[ticket.priorite] * 60 : null);

        const delaiRappelMinutes = delaiMinutes ? Math.floor(delaiMinutes / 2) : 24 * 60;
        const reference = ticket.statutChangedAt || ticket.createdAt;
        const depuisMinutes = (maintenant - new Date(reference)) / 1000 / 60;
        const slaPourcentage = delaiMinutes ? Math.min(Math.round((depuisMinutes / delaiMinutes) * 100), 100) : null;
        const slaDepasse = delaiMinutes && depuisMinutes >= delaiMinutes;

        if (ticket.slaBreached !== slaDepasse || ticket.slaPourcentage !== slaPourcentage) {
          await Ticket.findByIdAndUpdate(ticket._id, { slaBreached: slaDepasse, slaPourcentage, slaDelaiMinutes: delaiMinutes, slaDepuisMinutes: Math.round(depuisMinutes) });
        }

        console.log(`🔍 "${ticket.titre}" — statut: ${ticket.statut} — depuis: ${depuisMinutes.toFixed(1)}min — délai: ${delaiMinutes || "N/A"}min — SLA: ${slaPourcentage || "N/A"}%`);

        const dejàRappele = ticket.rappelInactiviteAt &&
          new Date() - new Date(ticket.rappelInactiviteAt) < delaiRappelMinutes * 60 * 1000 * 2;

        // ── RAPPEL D'INACTIVITÉ ──────────────────────────────
        if (depuisMinutes >= delaiRappelMinutes && depuisMinutes < (delaiMinutes || Infinity) && !dejàRappele) {
          console.log(`🔔 RAPPEL INACTIVITÉ : "${ticket.titre}"`);
          await Ticket.findByIdAndUpdate(ticket._id, { rappelInactiviteAt: new Date() });
          await pushAudit(ticket._id, "sla_warning", `Rappel inactivité — ${Math.round(depuisMinutes)}min`);

          if (ticket.assignee) {
            await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `⏰ Rappel : ticket "${ticket.titre}" inactif depuis ${Math.round(depuisMinutes)} min.`, type: "statut_change", lu: false });
            // ✅ Push à l'agent
            await sendPushNotification(ticket.assignee, `⏰ Rappel inactivité`, `"${ticket.titre}" — ${Math.round(depuisMinutes)}min sans action`);
            console.log(`✅ Rappel envoyé à l'agent`);
          }

          const teamLeads = await User.find({ role: "team_lead", isActive: true });
          if (teamLeads.length > 0) {
            await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `⚠️ Ticket "${ticket.titre}" inactif depuis ${Math.round(depuisMinutes)} min.`, type: "statut_change", lu: false })));
            // ✅ Push aux chefs d'équipe
            await sendPushToMany(teamLeads.map(tl => tl._id), `⚠️ Ticket inactif`, `"${ticket.titre}" — ${Math.round(depuisMinutes)}min`);
            console.log(`✅ ${teamLeads.length} chef(s) notifié(s)`);
          }
        }

        // ── ESCALADE AUTOMATIQUE ─────────────────────────────
        if (delaiMinutes && depuisMinutes >= delaiMinutes) {
          console.log(`⚠️ ESCALADE AUTO : "${ticket.titre}"`);
          const ancienStatut = ticket.statut;

          await Ticket.findByIdAndUpdate(ticket._id, {
            statut: "escalated", statutChangedAt: new Date(),
            rappelInactiviteAt: null, slaBreached: true,
            escalade: { raison: `Escalade automatique — ${delaiMinutes}min sans action`, urgence: "urgent", escaladeAt: new Date() },
          });

          await pushAudit(ticket._id, "auto_escalated", `Escalade automatique — ${Math.round(depuisMinutes)}min / ${delaiMinutes}min`);
          await pushAudit(ticket._id, "sla_breach", `SLA dépassé de ${Math.round(depuisMinutes - delaiMinutes)}min`);

          const teamLeads = await User.find({ role: "team_lead", isActive: true });
          if (teamLeads.length > 0) {
            await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `⏱️ Escalade automatique [URGENT] : "${ticket.titre}"`, type: "ticket_escalade", lu: false })));
            // ✅ Push aux chefs d'équipe
            await sendPushToMany(teamLeads.map(tl => tl._id), `⚠️ Escalade automatique`, `"${ticket.titre}" — inactif depuis ${delaiMinutes}min`);
            console.log(`✅ ${teamLeads.length} chef(s) notifié(s)`);
          }

          await Notification.create({ destinataire: ticket.reporter, ticket: ticket._id, message: `Votre ticket "${ticket.titre}" a été transmis au chef d'équipe.`, type: "ticket_escalade", lu: false });
          // ✅ Push au client
          await sendPushNotification(ticket.reporter, `⚠️ Ticket escaladé`, `"${ticket.titre}" transmis au chef d'équipe`);

          if (ticket.assignee) {
            await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `⏱️ Ticket "${ticket.titre}" escaladé automatiquement.`, type: "ticket_escalade", lu: false });
            // ✅ Push à l'agent
            await sendPushNotification(ticket.assignee, `⚠️ Ticket escaladé auto`, `"${ticket.titre}"`);
          }
        }

        // ── RAPPEL 24H PAR DÉFAUT ────────────────────────────
        if (!delaiMinutes && depuisMinutes >= delaiRappelMinutes && !dejàRappele) {
          console.log(`🔔 RAPPEL (défaut 24h) : "${ticket.titre}"`);
          await Ticket.findByIdAndUpdate(ticket._id, { rappelInactiviteAt: new Date() });
          await pushAudit(ticket._id, "sla_warning", `Rappel inactivité (défaut 24h)`);

          if (ticket.assignee) {
            await Notification.create({ destinataire: ticket.assignee, ticket: ticket._id, message: `⏰ Rappel : ticket "${ticket.titre}" inactif depuis 24h.`, type: "statut_change", lu: false });
            await sendPushNotification(ticket.assignee, `⏰ Rappel 24h`, `"${ticket.titre}" inactif depuis 24h`);
          }

          const teamLeads = await User.find({ role: "team_lead", isActive: true });
          if (teamLeads.length > 0) {
            await Notification.insertMany(teamLeads.map((tl) => ({ destinataire: tl._id, ticket: ticket._id, message: `⚠️ Ticket "${ticket.titre}" inactif depuis 24h.`, type: "statut_change", lu: false })));
            await sendPushToMany(teamLeads.map(tl => tl._id), `⚠️ Ticket inactif 24h`, `"${ticket.titre}"`);
          }
        }
      }
    } catch (err) {
      console.error("❌ Erreur escalade automatique :", err.message);
    }
  });

  console.log("✅ Job escalade automatique démarré");
};

module.exports = lancerEscaladeAuto;