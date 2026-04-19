const mongoose = require("mongoose");
require("dotenv").config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/devapp";
const HistoriqueSchema = new mongoose.Schema({ action: String, auteur: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, auteurNom: { type: String, default: "Systeme" }, details: String, createdAt: { type: Date, default: Date.now } });
const TicketSchema = new mongoose.Schema({ titre: String, statut: String, priorite: String, type: String, reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, createdAt: Date, updatedAt: Date, statutChangedAt: Date, resolvedAt: Date, slaRespect: Boolean, slaTempsReel: Number, slaBreached: Boolean, slaDepuisMinutes: Number, slaDelaiMinutes: Number, escalade: { raison: String, urgence: String, escaladePar: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, escaladeAt: Date }, bloque: Boolean, bloqueRaison: String, bloqueAt: Date, bloquePar: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, forcedResolu: Boolean, forcedResoluPar: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, feedback: { note: Number, message: String }, commentaires: [{ auteur: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, contenu: String, createdAt: Date }], historique: [HistoriqueSchema] }, { timestamps: true, strict: false });
const UserSchema = new mongoose.Schema({ prenom: String, nom: String, role: String }, { strict: false });
async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connecte a MongoDB");
  const Ticket = mongoose.model("Ticket", TicketSchema);
  const User = mongoose.model("User", UserSchema);
  const tickets = await Ticket.find({}).populate("reporter", "prenom nom").populate("assignee", "prenom nom").populate("escalade.escaladePar", "prenom nom").populate("bloquePar", "prenom nom").populate("forcedResoluPar", "prenom nom");
  console.log(`${tickets.length} tickets trouves`);
  let migres = 0;
  for (const ticket of tickets) {
    if (ticket.historique && ticket.historique.length > 0) { console.log(`Ignore: ${ticket.titre}`); continue; }
    const entries = [];
    entries.push({ action: "ticket_created", auteur: ticket.reporter?._id || null, auteurNom: ticket.reporter ? `${ticket.reporter.prenom} ${ticket.reporter.nom}` : "Client", details: `Ticket cree - Priorite: ${ticket.priorite} - Type: ${ticket.type}`, createdAt: ticket.createdAt || new Date() });
    if (ticket.assignee) entries.push({ action: "auto_assigned", auteur: null, auteurNom: "Systeme IA", details: `Assigne a ${ticket.assignee.prenom} ${ticket.assignee.nom}`, createdAt: ticket.createdAt || new Date() });
    if (ticket.statut === "in_progress") entries.push({ action: "statut_change", auteur: ticket.assignee?._id || null, auteurNom: ticket.assignee ? `${ticket.assignee.prenom} ${ticket.assignee.nom}` : "Agent", details: "En attente -> En cours", createdAt: ticket.statutChangedAt || ticket.updatedAt || new Date() });
    if (ticket.statut === "ready_for_customer") entries.push({ action: "statut_change", auteur: ticket.assignee?._id || null, auteurNom: ticket.assignee ? `${ticket.assignee.prenom} ${ticket.assignee.nom}` : "Agent", details: "En cours -> Solution envoyee", createdAt: ticket.statutChangedAt || ticket.updatedAt || new Date() });
    if (ticket.statut === "escalated" || ticket.escalade?.escaladeAt) entries.push({ action: "escalated", auteur: ticket.escalade?.escaladePar?._id || null, auteurNom: ticket.escalade?.escaladePar ? `${ticket.escalade.escaladePar.prenom} ${ticket.escalade.escaladePar.nom}` : "Systeme automatique", details: ticket.escalade?.raison ? `Raison: ${ticket.escalade.raison} - Urgence: ${ticket.escalade.urgence}` : `Escalade automatique - Urgence: ${ticket.escalade?.urgence || "normal"}`, createdAt: ticket.escalade?.escaladeAt || ticket.statutChangedAt || new Date() });
    if (ticket.bloque) entries.push({ action: "ticket_bloque", auteur: ticket.bloquePar?._id || null, auteurNom: ticket.bloquePar ? `${ticket.bloquePar.prenom} ${ticket.bloquePar.nom}` : "Administrateur", details: `Ticket bloque${ticket.bloqueRaison ? ` - ${ticket.bloqueRaison}` : ""}`, createdAt: ticket.bloqueAt || new Date() });
    if (ticket.forcedResolu) entries.push({ action: "force_resolu", auteur: ticket.forcedResoluPar?._id || null, auteurNom: ticket.forcedResoluPar ? `${ticket.forcedResoluPar.prenom} ${ticket.forcedResoluPar.nom}` : "Administrateur", details: "Ticket force comme resolu", createdAt: ticket.resolvedAt || new Date() });
    if (ticket.commentaires?.length > 0) entries.push({ action: "comment_added", auteur: null, auteurNom: "Systeme", details: `${ticket.commentaires.length} message(s) echanges (donnees anterieures)`, createdAt: ticket.commentaires[0]?.createdAt || ticket.createdAt || new Date() });
    if (["solved","closed"].includes(ticket.statut) && ticket.resolvedAt) { const duree = ticket.slaTempsReel ? `Duree: ${Math.floor(ticket.slaTempsReel/60)}h${ticket.slaTempsReel%60}min` : ""; const sla = ticket.slaRespect !== null ? ` - SLA ${ticket.slaRespect ? "respecte" : "depasse"}` : ""; const csat = ticket.feedback?.note ? ` - CSAT: ${ticket.feedback.note}/5` : ""; entries.push({ action: "solved", auteur: ticket.assignee?._id || null, auteurNom: ticket.assignee ? `${ticket.assignee.prenom} ${ticket.assignee.nom}` : "Agent", details: `${duree}${sla}${csat}`.trim() || "Ticket resolu", createdAt: ticket.resolvedAt || new Date() }); }
    if (ticket.slaBreached && !["solved","closed"].includes(ticket.statut)) entries.push({ action: "sla_breach", auteur: null, auteurNom: "Systeme automatique", details: "SLA depasse", createdAt: ticket.updatedAt || new Date() });
    entries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    await Ticket.findByIdAndUpdate(ticket._id, { $set: { historique: entries } });
    migres++;
    console.log(`OK: ${ticket.titre} - ${entries.length} entrees`);
  }
  console.log(`\nMigration terminee - ${migres} tickets migres sur ${tickets.length}`);
  await mongoose.disconnect();
  process.exit(0);
}
run().catch(err => { console.error("Erreur:", err); process.exit(1); });
