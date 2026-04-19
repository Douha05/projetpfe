import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import "./SupportDashboard.css";

const API = "http://localhost:3001/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const getUser = () => { const u = localStorage.getItem("user") || sessionStorage.getItem("user"); return u ? JSON.parse(u) : null; };

const checkIsMine = (ticket, userId) => {
  if (!ticket || !userId) return false;
  const aid = ticket.assignee?._id ?? ticket.assignee;
  if (!aid) return false;
  return String(aid) === String(userId);
};

const Ico = ({ d, size = 14 }) => <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d={d} /></svg>;
const D = {
  ticket:   "M1.5 3.5A1.5 1.5 0 0 1 3 2h9.982a1.5 1.5 0 0 1 1.498 1.5v2.5a.5.5 0 0 1-.5.5 1 1 0 0 0 0 2 .5.5 0 0 1 .5.5v2.5A1.5 1.5 0 0 1 12.982 13H3A1.5 1.5 0 0 1 1.5 11.5V8a.5.5 0 0 1 .5-.5 1 1 0 1 0 0-2 .5.5 0 0 1-.5-.5V3.5z",
  bell:     "M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z",
  logout:   "M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2zM15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z",
  escalate: "M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z",
  cancel:   "M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z",
  check:    "M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z",
  warning:  "M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z",
  trash:    "M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6zM14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z",
  back:     "M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z",
  devapp:   "M1.5 3.5A1.5 1.5 0 0 1 3 2h9.982a1.5 1.5 0 0 1 1.498 1.5v2.5a.5.5 0 0 1-.5.5 1 1 0 0 0 0 2 .5.5 0 0 1 .5.5v2.5A1.5 1.5 0 0 1 12.982 13H3A1.5 1.5 0 0 1 1.5 11.5V8a.5.5 0 0 1 .5-.5 1 1 0 1 0 0-2 .5.5 0 0 1-.5-.5V3.5z",
  team:     "M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  edit:     "M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z",
  search:   "M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z",
  dashboard:"M0 1.5A1.5 1.5 0 0 1 1.5 0h5A1.5 1.5 0 0 1 8 1.5v5A1.5 1.5 0 0 1 6.5 8h-5A1.5 1.5 0 0 1 0 6.5v-5zm8 0A1.5 1.5 0 0 1 9.5 0h5A1.5 1.5 0 0 1 16 1.5v5A1.5 1.5 0 0 1 14.5 8h-5A1.5 1.5 0 0 1 8 6.5v-5zm-8 8A1.5 1.5 0 0 1 1.5 8h5A1.5 1.5 0 0 1 8 9.5v5A1.5 1.5 0 0 1 6.5 16h-5A1.5 1.5 0 0 1 0 14.5v-5zm8 0A1.5 1.5 0 0 1 9.5 8h5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 14.5v-5z",
  palette:  "M8 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm4 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm.5 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M16 8c0 3.15-1.866 2.585-3.567 2.07C11.42 9.763 10.465 9.473 10 10c-.603.683-.475 1.819-.351 2.92C9.826 14.495 9.996 16 8 16a8 8 0 1 1 8-8z",
  // ── Ajouts pour l'onglet IA ──────────────────────────────
  ia_cpu:   "M5 0a.5.5 0 0 1 .5.5V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2A2.5 2.5 0 0 1 14 4.5h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14A2.5 2.5 0 0 1 11.5 14v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14A2.5 2.5 0 0 1 2 11.5H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2A2.5 2.5 0 0 1 4.5 2V.5A.5.5 0 0 1 5 0zm-.5 3A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 11.5 3h-7z",
  ia_chart: "M0 0h1v15h15v1H0V0zm14.5 3a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0V5.707L7.354 11.354a.5.5 0 0 1-.708 0L5 9.707l-3.646 3.647a.5.5 0 0 1-.708-.708l4-4a.5.5 0 0 1 .708 0L7 10.293l6.646-6.647a.5.5 0 0 1 .854.354z",
  ia_star:  "M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z",
  ia_person:"M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.029 10 8 10c-2.029 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z",
  ia_chat:  "M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z",
  ia_copy:  "M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z",
  ia_send:  "M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z",
  ia_x:     "M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z",
  ia_info:  "M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z",
};

const PrioBadge = ({ p }) => { const m={low:["Faible","prio-low"],medium:["Moyen","prio-medium"],high:["Haute","prio-high"],critical:["Critique","prio-critical"]}; const [label,cls]=m[p]||["—","prio-medium"]; return <span className={`prio-badge ${cls}`}>{label}</span>; };
const TypeBadge = ({ t }) => { const m={bug:["Bug","type-bug"],feature:["Feature","type-feat"],consultancy:["Consultancy","type-cons"]}; const [label,cls]=m[t]||[t,"type-badge"]; return <span className={`type-badge ${cls}`}>{label}</span>; };

const STEPS = [
  { key:"ready_for_support",  label:"À faire",          next:"in_progress" },
  { key:"in_progress",        label:"En cours",         next:"ready_for_customer" },
  { key:"ready_for_customer", label:"Solution envoyée", next:null },
  { key:"solved",             label:"Résolu",           next:null },
];
const IDX  = { ready_for_support:0, in_progress:1, ready_for_customer:2, solved:3, closed:3, escalated:-1, cancelled:-1 };
const COLS = [
  { statut:"ready_for_support",  label:"À faire",     cls:"col-todo",    accent:"#d97706" },
  { statut:"in_progress",        label:"En cours",    cls:"col-prog",    accent:"#2563eb" },
  { statut:"ready_for_customer", label:"À confirmer", cls:"col-confirm", accent:"#7c3aed" },
  { statut:"escalated",          label:"Escaladé",    cls:"col-esc",     accent:"#dc2626" },
  { statut:"solved",             label:"Résolu",      cls:"col-done",    accent:"#16a34a" },
];
const DRAG_ALLOWED = {
  ready_for_support:  ["in_progress", "ready_for_customer"],
  in_progress:        ["ready_for_customer", "ready_for_support"],
  ready_for_customer: ["in_progress", "ready_for_support"],
};

const initials   = (p,n) => `${p?.[0]||""}${n?.[0]||""}`.toUpperCase();
const ticketRef  = id => id?`#${id.slice(-5).toUpperCase()}`:"";
const fmtDate    = d => new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});
const fmtTime    = d => new Date(d).toLocaleString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const lastUpdate = () => { const n=new Date(); return `${n.getHours()}h${String(n.getMinutes()).padStart(2,"0")}`; };
const typeLabel  = t => t==="bug"?"Bug":t==="feature"?"Feature":"Consultancy";

/* ════════════════════════════════════════════════════════════
   NOUVEAU — Onglet Analyse IA
════════════════════════════════════════════════════════════ */

const IA_SUG_CFG = {
  analyse:      { iconD:"ia_chart",  label:"Analyse client",      accent:"#1d4ed8", bg:"#eff6ff", border:"#bfdbfe" },
  priorite:     { iconD:"ia_star",   label:"Priorité suggérée",   accent:"#a16207", bg:"#fefce8", border:"#fde68a" },
  assignation:  { iconD:"ia_person", label:"Agent recommandé",    accent:"#15803d", bg:"#f0fdf4", border:"#bbf7d0" },
  reponse_auto: { iconD:"ia_chat",   label:"Réponse automatique", accent:"#6d28d9", bg:"#fdf4ff", border:"#e9d5ff" },
};

const sentimentLabel = s => s==="frustre"?"Frustré":s==="desespere"?"Désespéré":s==="calme"?"Calme":s||"—";
const sentimentStyle = s => s==="frustre"
  ? { background:"#fef2f2", color:"#b91c1c", border:"1px solid #fecaca" }
  : s==="desespere"
  ? { background:"#450a0a", color:"#fff", border:"1px solid #7f1d1d" }
  : { background:"#f0fdf4", color:"#15803d", border:"1px solid #bbf7d0" };

function IaAnalyseTab({ ticket }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [copied,      setCopied]      = useState(false);
  const [validating,  setValidating]  = useState(null);

  useEffect(() => {
    if (!ticket || !ticket.iaTraite) { setLoading(false); return; }
    const token = getToken();
    setLoading(true);
    setError("");
    fetch(API + "/ia/suggestions/" + ticket._id, { headers: { Authorization: "Bearer " + token } })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var list = d.suggestions || d.data || [];
        setSuggestions(list);
        if (list.length === 0) setError("Aucune suggestion disponible.");
      })
      .catch(function() { setError("Impossible de charger les suggestions IA."); })
      .finally(function() { setLoading(false); });
  }, [ticket && ticket._id]);

  var valider = function(suggestionId, statut) {
    var token = getToken();
    setValidating(suggestionId);
    fetch(API + "/ia/suggestion/" + suggestionId, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ statut: statut }),
    })
    .then(function() {
      setSuggestions(function(prev) {
        return prev.map(function(s) { return s._id === suggestionId ? Object.assign({}, s, { statut: statut }) : s; });
      });
      setValidating(null);
    })
    .catch(function() { setValidating(null); });
  };

  /* Tente de parser le contenu JSON, retourne l'objet ou null */
  var tryParse = function(contenu) {
    if (!contenu) return null;
    if (typeof contenu === "object") return contenu;
    if (typeof contenu !== "string") return null;
    var s = contenu.trim();
    if (s[0] !== "{" && s[0] !== "[") return null;
    try { return JSON.parse(s); } catch(e) { return null; }
  };

  /* Copie uniquement le texte de réponse */
  var copierReponse = function(contenu) {
    var obj = tryParse(contenu);
    var texte = (obj && obj.reponse) ? obj.reponse : contenu;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texte).then(function() {
        setCopied(true);
        setTimeout(function() { setCopied(false); }, 2000);
      });
    }
  };

  /* Rendu du contenu d'une suggestion selon son type */
  var renderContenu = function(contenu, type, accent, bgColor) {
    var obj = tryParse(contenu);

    if (!obj) {
      return React.createElement("p", { style:{ fontSize:13, color:"#374151", margin:0, lineHeight:1.7, whiteSpace:"pre-wrap", wordBreak:"break-word" } }, contenu);
    }

    var prio_colors = { low:"#15803d", medium:"#a16207", high:"#c2410c", critical:"#b91c1c" };

    var row = function(label, value, valueColor) {
      if (!value && value !== 0) return null;
      return React.createElement("div", { style:{ display:"flex", gap:10, padding:"5px 0", borderBottom:"1px solid #f3f4f6", alignItems:"flex-start" } },
        React.createElement("span", { style:{ fontSize:11, fontWeight:600, color:"#9ca3af", minWidth:110, flexShrink:0, textTransform:"uppercase", letterSpacing:".04em", paddingTop:1 } }, label),
        React.createElement("span", { style:{ fontSize:13, color: valueColor || "#374151", fontWeight: valueColor ? 600 : 400, lineHeight:1.5, wordBreak:"break-word" } }, String(value))
      );
    };

    if (type === "reponse_auto") {
      return React.createElement("div", null,
        obj.reponse && React.createElement("div", { style:{ background:"#f9fafb", borderRadius:8, padding:"10px 14px", marginBottom:10, fontSize:13, color:"#374151", lineHeight:1.7, whiteSpace:"pre-wrap", border:"1px solid #f1f5f9" } }, obj.reponse),
        row("Ton", obj.ton),
        row("Délai estimé", obj.delaiEstime, accent),
        row("Prochaine étape", obj.prochaineEtape)
      );
    }

    if (type === "priorite") {
      return React.createElement("div", null,
        row("Catégorie", obj.categorie),
        row("Sous-catégorie", obj.sousCategorie),
        obj.priorite && React.createElement("div", { style:{ display:"flex", gap:10, padding:"5px 0", borderBottom:"1px solid #f3f4f6", alignItems:"center" } },
          React.createElement("span", { style:{ fontSize:11, fontWeight:600, color:"#9ca3af", minWidth:110, flexShrink:0, textTransform:"uppercase", letterSpacing:".04em" } }, "Priorité"),
          React.createElement("span", { style:{ fontSize:13, fontWeight:700, color: prio_colors[obj.priorite] || accent, background:(prio_colors[obj.priorite] || accent)+"18", padding:"2px 10px", borderRadius:6 } }, obj.priorite.charAt(0).toUpperCase() + obj.priorite.slice(1))
        ),
        row("Complexité", obj.complexite),
        obj.tags && obj.tags.length > 0 && React.createElement("div", { style:{ display:"flex", gap:10, padding:"5px 0", alignItems:"flex-start" } },
          React.createElement("span", { style:{ fontSize:11, fontWeight:600, color:"#9ca3af", minWidth:110, flexShrink:0, textTransform:"uppercase", letterSpacing:".04em", paddingTop:4 } }, "Tags"),
          React.createElement("div", { style:{ display:"flex", gap:4, flexWrap:"wrap" } },
            obj.tags.map(function(t, i) {
              return React.createElement("span", { key:i, style:{ fontSize:11, background:bgColor, color:accent, padding:"2px 8px", borderRadius:4, fontWeight:500, border:"1px solid "+accent+"44" } }, t);
            })
          )
        )
      );
    }

    if (type === "assignation") {
      var agentInitials = obj.agentNom ? obj.agentNom.split(" ").map(function(n){ return n[0]||""; }).slice(0,2).join("").toUpperCase() : "?";
      return React.createElement("div", null,
        obj.agentNom && React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:10, padding:"6px 0 10px", borderBottom:"1px solid #f3f4f6", marginBottom:6 } },
          React.createElement("div", { style:{ width:36, height:36, borderRadius:"50%", background:"#2563eb", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:600, flexShrink:0 } }, agentInitials),
          React.createElement("div", null,
            React.createElement("p", { style:{ fontSize:13, fontWeight:600, color:"#111827", margin:0 } }, obj.agentNom),
            obj.agentId && React.createElement("p", { style:{ fontSize:11, color:"#9ca3af", margin:"2px 0 0", fontFamily:"monospace" } }, "ID: " + obj.agentId.slice(-8))
          )
        ),
        row("Raison", obj.raison),
        obj.scoreSpecialite != null && row("Score spécialité", Math.round(obj.scoreSpecialite * 100) + "%", accent),
        obj.scoreWorkload  != null && row("Score charge",      Math.round(obj.scoreWorkload  * 100) + "%")
      );
    }

    if (type === "analyse") {
      return React.createElement("div", null,
        obj.resume && React.createElement("div", { style:{ background:"#f9fafb", borderRadius:8, padding:"10px 12px", marginBottom:10, fontSize:13, color:"#374151", lineHeight:1.6, border:"1px solid #f1f5f9" } }, obj.resume),
        obj.sentiment && row("Sentiment", sentimentLabel(obj.sentiment)),
        row("Niveau urgence",  obj.niveauUrgence),
        row("Contexte client", obj.contexteClient),
        obj.problemesRecurrents && obj.problemesRecurrents.length > 0 && React.createElement("div", { style:{ display:"flex", gap:10, padding:"5px 0", alignItems:"flex-start" } },
          React.createElement("span", { style:{ fontSize:11, fontWeight:600, color:"#9ca3af", minWidth:110, flexShrink:0, textTransform:"uppercase", letterSpacing:".04em", paddingTop:4 } }, "Récurrents"),
          React.createElement("div", { style:{ display:"flex", flexDirection:"column", gap:3 } },
            obj.problemesRecurrents.map(function(p, i) {
              return React.createElement("span", { key:i, style:{ fontSize:12, color:"#374151" } }, "• " + p);
            })
          )
        )
      );
    }

    /* Fallback générique */
    return React.createElement("div", null,
      Object.entries(obj).filter(function(e) { return e[1] && typeof e[1] !== "object"; }).map(function(e, i) {
        return row(e[0], String(e[1]));
      })
    );
  };

  if (!ticket || !ticket.iaTraite) {
    return (
      <div style={{ padding:"32px 0", textAlign:"center" }}>
        <div style={{ width:48, height:48, borderRadius:12, background:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
          <svg width="22" height="22" viewBox="0 0 16 16" fill="#9ca3af"><path fillRule="evenodd" d={D.ia_cpu}/></svg>
        </div>
        <p style={{ fontSize:14, fontWeight:500, color:"#374151", margin:"0 0 6px" }}>Ce ticket n'a pas encore été analysé</p>
        <p style={{ fontSize:12, color:"#9ca3af", margin:0 }}>L'analyse IA sera disponible après le traitement par le Team Lead.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding:"32px 0", textAlign:"center" }}>
        <svg width="24" height="24" viewBox="0 0 16 16" fill="#2563eb" style={{ animation:"ia-spin 1s linear infinite", display:"block", margin:"0 auto 10px" }}>
          <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
        </svg>
        <p style={{ fontSize:13, color:"#9ca3af", margin:0 }}>Chargement des suggestions IA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding:"20px 0" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"14px 16px", borderRadius:10, background:"#fef2f2", border:"1px solid #fecaca" }}>
          <div><p style={{ fontSize:13, fontWeight:500, color:"#b91c1c", margin:"0 0 4px" }}>Erreur</p><p style={{ fontSize:12, color:"#b91c1c", margin:0 }}>{error}</p></div>
        </div>
      </div>
    );
  }

  var reponseAuto = suggestions.find(function(s) { return s.type === "reponse_auto"; });

  return (
    <div style={{ paddingTop:16, display:"flex", flexDirection:"column", gap:14 }}>
      <style>{`@keyframes ia-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Résumé */}
      {ticket.resumeIa && (
        <div style={{ background:"#f5f3ff", border:"1px solid #e9d5ff", borderRadius:10, padding:"12px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="#6d28d9"><path fillRule="evenodd" d={D.ia_cpu}/></svg>
            <span style={{ fontSize:11, fontWeight:700, color:"#6d28d9", textTransform:"uppercase", letterSpacing:".06em" }}>Résumé IA</span>
          </div>
          <p style={{ fontSize:13, color:"#374151", margin:0, lineHeight:1.6 }}>{ticket.resumeIa}</p>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10 }}>
            {ticket.sentimentClient && <span style={{ fontSize:11, fontWeight:500, padding:"2px 10px", borderRadius:6, ...sentimentStyle(ticket.sentimentClient) }}>{sentimentLabel(ticket.sentimentClient)}</span>}
            {ticket.categorieIa && <span style={{ fontSize:11, fontWeight:500, padding:"2px 10px", borderRadius:6, background:"#eff6ff", color:"#1d4ed8", border:"1px solid #bfdbfe" }}>{ticket.categorieIa}</span>}
            {ticket.prioriteIa && <span style={{ fontSize:11, fontWeight:500, padding:"2px 10px", borderRadius:6, background:"#f5f3ff", color:"#6d28d9", border:"1px solid #ede9fe" }}>IA · {ticket.prioriteIa}</span>}
            {ticket.assigneAutomatiquement && <span style={{ fontSize:11, fontWeight:500, padding:"2px 10px", borderRadius:6, background:"#f0fdf4", color:"#15803d", border:"1px solid #bbf7d0" }}>Auto-assigné</span>}
          </div>
        </div>
      )}

      {/* Réponse automatique */}
      {reponseAuto && (
        <div style={{ border:"1px solid #e9d5ff", borderRadius:12, overflow:"hidden" }}>
          <div style={{ background:"#fdf4ff", padding:"10px 16px", borderBottom:"1px solid #e9d5ff", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:26, height:26, borderRadius:7, background:"#fff", border:"1px solid #e9d5ff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="#6d28d9"><path fillRule="evenodd" d={D.ia_chat}/></svg>
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:"#6d28d9", textTransform:"uppercase", letterSpacing:".05em" }}>Réponse automatique suggérée</span>
            </div>
            {reponseAuto.scoreConfiance != null && (
              <span style={{ fontSize:11, fontWeight:600, color:"#6d28d9", background:"#fff", padding:"2px 8px", borderRadius:20, border:"1px solid #e9d5ff" }}>
                {Math.round(reponseAuto.scoreConfiance * 100)}% confiance
              </span>
            )}
          </div>
          <div style={{ padding:"14px 16px", background:"#fff" }}>
            {renderContenu(reponseAuto.contenu, "reponse_auto", "#6d28d9", "#f5f3ff")}
            <div style={{ display:"flex", gap:8, marginTop:14 }}>
              <button onClick={() => copierReponse(reponseAuto.contenu)}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", border:"1px solid #e5e7eb", borderRadius:8, background:"#f9fafb", color:"#374151", fontSize:12, fontWeight:500, cursor:"pointer" }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d={D.ia_copy}/></svg>
                {copied ? "Copié !" : "Copier"}
              </button>
              {reponseAuto.statut === "en_attente" && (
                <>
                  <button onClick={() => valider(reponseAuto._id, "acceptee")} disabled={validating === reponseAuto._id}
                    style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px", border:"none", borderRadius:8, background:"#16a34a", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d={D.check}/></svg>
                    Utiliser comme réponse
                  </button>
                  <button onClick={() => valider(reponseAuto._id, "rejetee")} disabled={validating === reponseAuto._id}
                    style={{ padding:"8px 12px", border:"1px solid #fecaca", borderRadius:8, background:"#fef2f2", color:"#b91c1c", fontSize:12, cursor:"pointer" }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d={D.ia_x}/></svg>
                  </button>
                </>
              )}
              {reponseAuto.statut !== "en_attente" && (
                <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:8, background:reponseAuto.statut==="acceptee"?"#f0fdf4":"#fef2f2", border:`1px solid ${reponseAuto.statut==="acceptee"?"#bbf7d0":"#fecaca"}`, fontSize:12, fontWeight:500, color:reponseAuto.statut==="acceptee"?"#15803d":"#b91c1c" }}>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d={reponseAuto.statut==="acceptee"?D.check:D.ia_x}/></svg>
                  {reponseAuto.statut==="acceptee" ? "Acceptée" : "Rejetée"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Autres suggestions */}
      {suggestions.filter(s => s.type !== "reponse_auto").map(sug => {
        const cfg = IA_SUG_CFG[sug.type] || { iconD:"ia_info", label:sug.type, accent:"#374151", bg:"#f9fafb", border:"#e5e7eb" };
        const isAccepted = sug.statut === "acceptee";
        const isRejected = sug.statut === "rejetee";
        return (
          <div key={sug._id} style={{ border:`1px solid ${cfg.border}`, borderRadius:12, overflow:"hidden", opacity:isRejected?0.6:1 }}>
            <div style={{ background:cfg.bg, padding:"10px 16px", borderBottom:`1px solid ${cfg.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:26, height:26, borderRadius:7, background:"#fff", border:`1px solid ${cfg.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill={cfg.accent}><path fillRule="evenodd" d={D[cfg.iconD]}/></svg>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:cfg.accent, textTransform:"uppercase", letterSpacing:".05em" }}>{cfg.label}</span>
              </div>
              {sug.scoreConfiance != null && (
                <span style={{ fontSize:11, fontWeight:600, color:cfg.accent, background:"#fff", padding:"2px 8px", borderRadius:20, border:`1px solid ${cfg.border}` }}>
                  {Math.round(sug.scoreConfiance * 100)}% confiance
                </span>
              )}
            </div>
            <div style={{ padding:"14px 16px", background:"#fff" }}>
              {renderContenu(sug.contenu, sug.type, cfg.accent, cfg.bg)}
              <div style={{ marginTop:14 }}>
                {!isAccepted && !isRejected ? (
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => valider(sug._id, "acceptee")} disabled={validating===sug._id}
                      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px", border:"none", borderRadius:8, background:"#16a34a", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d={D.check}/></svg> Accepter
                    </button>
                    <button onClick={() => valider(sug._id, "rejetee")} disabled={validating===sug._id}
                      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px", border:`1px solid ${cfg.border}`, borderRadius:8, background:cfg.bg, color:cfg.accent, fontSize:12, fontWeight:500, cursor:"pointer" }}>
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d={D.ia_x}/></svg> Rejeter
                    </button>
                  </div>
                ) : (
                  <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:8, background:isAccepted?"#f0fdf4":"#fef2f2", border:`1px solid ${isAccepted?"#bbf7d0":"#fecaca"}`, fontSize:12, fontWeight:500, color:isAccepted?"#15803d":"#b91c1c" }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d={isAccepted?D.check:D.ia_x}/></svg>
                    {isAccepted ? "Suggestion acceptée" : "Suggestion rejetée"}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const PALETTE = ["#2563eb","#16a34a","#dc2626","#d97706","#7c3aed","#0891b2","#db2777","#65a30d","#ea580c","#059669","#9333ea","#374151","#0284c7","#b91c1c","#c2410c","#f59e0b"];

function ColorPicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top:0, left:0 });
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h); };
  }, [open]);

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    const dropW = 172;
    const left  = Math.min(r.right - dropW, window.innerWidth - dropW - 8);
    setPos({ top: r.bottom + 6, left: Math.max(8, left) });
    setOpen(o => !o);
  };

  const dropdown = (
    <div
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      style={{
        position:"fixed",
        top: pos.top,
        left: pos.left,
        zIndex:999999,
        background:"#fff",
        border:"1px solid #e2e8f0",
        borderRadius:12,
        padding:"12px",
        boxShadow:"0 16px 40px rgba(0,0,0,.22)",
        width:172,
      }}
    >
      <p style={{ fontSize:10, color:"#64748b", margin:"0 0 8px", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>{label}</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:5, marginBottom:8 }}>
        {PALETTE.map(c => (
          <button key={c} type="button"
            onClick={e => { e.stopPropagation(); onChange(c); setOpen(false); }}
            style={{ width:24, height:24, borderRadius:5, background:c, padding:0, cursor:"pointer", border:value===c?"3px solid #0f172a":"2px solid transparent" }}
          />
        ))}
      </div>
      <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:8 }}>
        <p style={{ fontSize:10, color:"#94a3b8", margin:"0 0 4px" }}>Couleur libre</p>
        <input type="color" value={value}
          onChange={e => onChange(e.target.value)}
          onMouseDown={e => e.stopPropagation()}
          style={{ width:"100%", height:28, border:"1px solid #e2e8f0", borderRadius:6, cursor:"pointer", padding:2 }}
        />
      </div>
    </div>
  );

  return (
    <div ref={ref} style={{ position:"relative", display:"inline-flex", alignItems:"center", flexShrink:0 }}>
      <button type="button"
        onClick={handleClick}
        title={"Couleur : " + label}
        style={{
          width:16, height:16, borderRadius:4, background:value,
          border:"2px solid rgba(0,0,0,0.2)", cursor:"pointer", padding:0, outline:"none",
          boxShadow: open ? "0 0 0 3px rgba(37,99,235,.3)" : "none",
        }}
      />
      {open && ReactDOM.createPortal(dropdown, document.body)}
    </div>
  );
}

const BG_PRESETS = [
  { label:"Blanc",         value:"#f6f8fa" }, { label:"Ardoise",      value:"#f1f5f9" },
  { label:"Zinc",          value:"#f4f4f5" }, { label:"Bleu pâle",    value:"#eff6ff" },
  { label:"Vert pâle",     value:"#f0fdf4" }, { label:"Violet pâle",  value:"#f5f3ff" },
  { label:"Rose pâle",     value:"#fff1f2" }, { label:"Ambre pâle",   value:"#fffbeb" },
  { label:"Gris perle",    value:"#e2e8f0" }, { label:"Lavande",      value:"#e0e7ff" },
  { label:"Menthe",        value:"#d1fae5" }, { label:"Pêche",        value:"#fde8d8" },
  { label:"Gris moyen",    value:"#94a3b8" }, { label:"Acier",        value:"#64748b" },
  { label:"Gris foncé",    value:"#334155" }, { label:"Ardoise foncé",value:"#1e293b" },
  { label:"Bleu marine",   value:"#0f172a" }, { label:"Indigo foncé", value:"#1e1b4b" },
  { label:"Violet foncé",  value:"#2e1065" }, { label:"Vert foncé",   value:"#052e16" },
  { label:"Teal foncé",    value:"#042f2e" }, { label:"Rouge foncé",  value:"#450a0a" },
  { label:"Brun foncé",    value:"#1c0a00" }, { label:"Noir",         value:"#09090b" },
];

const TEXT_PRESETS = [
  {label:"Noir",value:"#111827"},{label:"Gris foncé",value:"#374151"},{label:"Ardoise",value:"#475569"},
  {label:"Blanc",value:"#ffffff"},{label:"Gris clair",value:"#e5e7eb"},{label:"Bleu",value:"#1d4ed8"},
  {label:"Vert",value:"#15803d"},{label:"Violet",value:"#6d28d9"},{label:"Rouge",value:"#b91c1c"},
  {label:"Orange",value:"#c2410c"},{label:"Indigo",value:"#3730a3"},{label:"Teal",value:"#0f766e"},
];
const CARD_PRESETS = [
  {label:"Blanc",value:"#ffffff"},{label:"Gris très clair",value:"#f9fafb"},{label:"Bleu clair",value:"#eff6ff"},
  {label:"Vert clair",value:"#f0fdf4"},{label:"Violet clair",value:"#f5f3ff"},{label:"Ambre clair",value:"#fffbeb"},
  {label:"Gris perle",value:"#f1f5f9"},{label:"Rose clair",value:"#fff1f2"},{label:"Gris moyen",value:"#e2e8f0"},
  {label:"Ardoise",value:"#1e293b"},{label:"Gris foncé",value:"#1f2937"},{label:"Noir",value:"#111827"},
];

function BgPanel({ bg, onChangeBg, textColor, onChangeText, cardColor, onChangeCard, onClose }) {
  const [activeTab, setActiveTab] = useState("bg");
  const presets    = activeTab==="bg" ? BG_PRESETS : activeTab==="text" ? TEXT_PRESETS : CARD_PRESETS;
  const currentVal = activeTab==="bg" ? bg : activeTab==="text" ? textColor : cardColor;
  const onChange   = activeTab==="bg" ? onChangeBg : activeTab==="text" ? onChangeText : onChangeCard;

  const TABS = [
    {id:"bg",   label:"Fond de page"},
    {id:"text", label:"Couleur texte"},
    {id:"card", label:"Fond des cartes"},
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:8000, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#fff", borderRadius:16, width:520, maxWidth:"92vw", maxHeight:"88vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 60px rgba(0,0,0,.22)", overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <span style={{ fontSize:15, fontWeight:600, color:"#111827" }}>Apparence du tableau de bord</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, color:"#9ca3af", lineHeight:1, padding:"0 4px" }}>×</button>
        </div>
        <div style={{ display:"flex", borderBottom:"1px solid #f1f5f9", background:"#f9fafb", flexShrink:0 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{ flex:1, padding:"11px 8px", border:"none", background:"none", fontSize:12, fontWeight:activeTab===t.id?600:400, color:activeTab===t.id?"#2563eb":"#6b7280", borderBottom:activeTab===t.id?"2px solid #2563eb":"2px solid transparent", cursor:"pointer", transition:"all .15s" }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ padding:"16px 20px", overflowY:"auto", flex:1 }}>
          <div style={{ marginBottom:16, padding:"12px 16px", borderRadius:10, border:"1px solid #e5e7eb", background:bg, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:cardColor, border:"1px solid rgba(0,0,0,.1)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:16, fontWeight:700, color:textColor }}>A</span>
            </div>
            <div>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:textColor }}>Aperçu en direct</p>
              <p style={{ margin:"2px 0 0", fontSize:11, color:textColor, opacity:.6 }}>Fond · Texte · Cartes</p>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
              {[bg, textColor, cardColor].map((c,i)=>(
                <div key={i} style={{ width:20, height:20, borderRadius:4, background:c, border:"1px solid rgba(0,0,0,.12)" }} title={["Fond","Texte","Cartes"][i]}/>
              ))}
            </div>
          </div>
          <p style={{ fontSize:11, color:"#6b7280", margin:"0 0 10px", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>
            {activeTab==="bg"?"Couleurs du fond":activeTab==="text"?"Couleurs du texte":"Couleurs des cartes"}
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:16 }}>
            {presets.map(p=>(
              <button key={p.value} onClick={()=>onChange(p.value)}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 9px", border:currentVal===p.value?"2px solid #2563eb":"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer", fontSize:11, color:"#374151", textAlign:"left", transition:"border .1s" }}>
                <div style={{ width:18, height:18, borderRadius:4, background:p.value, border:"1px solid rgba(0,0,0,.12)", flexShrink:0 }}/>
                <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.label}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize:11, color:"#6b7280", margin:"0 0 8px", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>Couleur personnalisée</p>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <input type="color" value={currentVal} onChange={e=>onChange(e.target.value)}
              style={{ width:48, height:40, border:"1px solid #e2e8f0", borderRadius:8, cursor:"pointer", padding:3, flexShrink:0 }}/>
            <div style={{ flex:1, padding:"10px 14px", borderRadius:8, background:currentVal, border:"1px solid rgba(0,0,0,.1)", fontSize:12, fontWeight:500, color:"#374151" }}>
              {currentVal}
            </div>
          </div>
        </div>
        <div style={{ padding:"12px 20px", borderTop:"1px solid #f1f5f9", display:"flex", gap:8, flexShrink:0 }}>
          <button onClick={()=>{ onChangeBg("#f6f8fa"); onChangeText("#111827"); onChangeCard("#ffffff"); }}
            style={{ flex:1, padding:"9px", border:"1px solid #e2e8f0", borderRadius:8, background:"#f9fafb", cursor:"pointer", fontSize:12, color:"#6b7280" }}>
            Tout réinitialiser
          </button>
          <button onClick={onClose}
            style={{ flex:1, padding:"9px", border:"none", borderRadius:8, background:"#2563eb", cursor:"pointer", fontSize:12, color:"#fff", fontWeight:500 }}>
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}

function DateRangePicker({ range, setRange, compareMode, setCompareMode }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState("preset");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const t = setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h); };
  }, [open]);

  const PRESETS = [
    { label:"Aujourd'hui",        value:"today"  },
    { label:"Cette semaine",      value:"week"   },
    { label:"Ce mois",            value:"month"  },
    { label:"Cette année",        value:"year"   },
    { label:"7 derniers jours",   value:"last7"  },
    { label:"30 derniers jours",  value:"last30" },
    { label:"90 derniers jours",  value:"last90" },
  ];

  const COMPARE_OPTS = [
    { label:"Semaine dernière",   value:"prev_week"   },
    { label:"Mois dernier",       value:"prev_month"  },
    { label:"Année dernière",     value:"prev_year"   },
    { label:"Période précédente", value:"prev_period" },
  ];

  const activeLabel = range?.preset
    ? PRESETS.find(p => p.value === range.preset)?.label
    : range?.from && range?.to
      ? `${range.from} → ${range.to}`
      : "Choisir une période";

  const compareLabel = compareMode
    ? COMPARE_OPTS.find(c => c.value === compareMode)?.label
    : null;

  const checkIcon = color => (
    <svg width="11" height="11" viewBox="0 0 16 16" fill={color}>
      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
    </svg>
  );

  return (
    <div ref={ref} style={{ position:"relative", display:"inline-block" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:"flex", alignItems:"center", gap:6,
          padding:"7px 12px", border:"1px solid #e2e8f0", borderRadius:8,
          background:"#fff", cursor:"pointer", fontSize:12, color:"#374151", fontWeight:500,
          boxShadow: open ? "0 0 0 3px rgba(37,99,235,.15)" : "none",
          transition:"box-shadow .15s",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="#6b7280">
          <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
        </svg>
        <span>{activeLabel}</span>
        {compareLabel && (
          <span style={{ background:"#eff6ff", color:"#1d4ed8", padding:"1px 6px", borderRadius:4, fontSize:10, fontWeight:600 }}>
            vs {compareLabel}
          </span>
        )}
        <svg width="8" height="5" viewBox="0 0 8 5" fill="#9ca3af"><path d="M0 0l4 5 4-5z"/></svg>
      </button>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position:"absolute", top:"calc(100% + 8px)", right:0, zIndex:9999,
            background:"#fff", border:"1px solid #e5e7eb", borderRadius:12,
            boxShadow:"0 16px 40px rgba(0,0,0,.14)", width:290, overflow:"hidden",
          }}
        >
          <div style={{ display:"flex", borderBottom:"1px solid #f1f5f9" }}>
            {[
              { id:"preset",  label:"Période"    },
              { id:"custom",  label:"Calendrier" },
              { id:"compare", label:"Comparer"   },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  flex:1, padding:"9px 4px", border:"none", background:"none",
                  fontSize:11, fontWeight: tab===t.id ? 600 : 400,
                  color: tab===t.id ? "#2563eb" : "#6b7280",
                  borderBottom: tab===t.id ? "2px solid #2563eb" : "2px solid transparent",
                  cursor:"pointer", transition:"all .15s",
                }}
              >{t.label}</button>
            ))}
          </div>

          {tab === "preset" && (
            <div style={{ padding:12 }}>
              <p style={{ fontSize:10, color:"#9ca3af", margin:"0 0 8px", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>
                Sélectionner une période
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                {PRESETS.map(p => (
                  <button key={p.value}
                    onClick={() => { setRange({ preset:p.value, from:null, to:null }); setOpen(false); }}
                    style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"8px 10px", border:"none", borderRadius:7, cursor:"pointer",
                      background: range?.preset===p.value ? "#eff6ff" : "none",
                      color:       range?.preset===p.value ? "#1d4ed8"  : "#374151",
                      fontSize:12, fontWeight: range?.preset===p.value ? 600 : 400,
                    }}
                  >
                    {p.label}
                    {range?.preset===p.value && checkIcon("#2563eb")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "custom" && (
            <div style={{ padding:12 }}>
              <p style={{ fontSize:10, color:"#9ca3af", margin:"0 0 10px", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>
                Plage personnalisée
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <div>
                  <label style={{ fontSize:11, color:"#6b7280", display:"block", marginBottom:4 }}>Date de début</label>
                  <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                    style={{ width:"100%", padding:"7px 10px", border:"1px solid #e2e8f0", borderRadius:7, fontSize:12, color:"#374151", outline:"none", boxSizing:"border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize:11, color:"#6b7280", display:"block", marginBottom:4 }}>Date de fin</label>
                  <input type="date" value={customTo} min={customFrom} onChange={e => setCustomTo(e.target.value)}
                    style={{ width:"100%", padding:"7px 10px", border:"1px solid #e2e8f0", borderRadius:7, fontSize:12, color:"#374151", outline:"none", boxSizing:"border-box" }}
                  />
                </div>
                <button
                  disabled={!customFrom || !customTo}
                  onClick={() => { if (customFrom && customTo) { setRange({ preset:null, from:customFrom, to:customTo }); setOpen(false); } }}
                  style={{
                    padding:"9px", border:"none", borderRadius:8, marginTop:2,
                    background: customFrom && customTo ? "#2563eb" : "#e5e7eb",
                    color:      customFrom && customTo ? "#fff"    : "#9ca3af",
                    cursor:     customFrom && customTo ? "pointer" : "not-allowed",
                    fontSize:12, fontWeight:500,
                  }}
                >
                  Appliquer la plage
                </button>
              </div>
            </div>
          )}

          {tab === "compare" && (
            <div style={{ padding:12 }}>
              <p style={{ fontSize:10, color:"#9ca3af", margin:"0 0 8px", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>
                Comparer avec
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                <button
                  onClick={() => { setCompareMode(null); setOpen(false); }}
                  style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"8px 10px", border:"none", borderRadius:7, cursor:"pointer",
                    background: !compareMode ? "#fef2f2" : "none",
                    color:      !compareMode ? "#b91c1c"  : "#374151",
                    fontSize:12, fontWeight: !compareMode ? 600 : 400,
                  }}
                >
                  Désactiver la comparaison
                  {!compareMode && checkIcon("#dc2626")}
                </button>
                <div style={{ height:1, background:"#f3f4f6", margin:"4px 0" }}/>
                {COMPARE_OPTS.map(c => (
                  <button key={c.value}
                    onClick={() => { setCompareMode(c.value); setOpen(false); }}
                    style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"8px 10px", border:"none", borderRadius:7, cursor:"pointer",
                      background: compareMode===c.value ? "#eff6ff" : "none",
                      color:       compareMode===c.value ? "#1d4ed8"  : "#374151",
                      fontSize:12, fontWeight: compareMode===c.value ? 600 : 400,
                    }}
                  >
                    {c.label}
                    {compareMode===c.value && checkIcon("#2563eb")}
                  </button>
                ))}
              </div>
              {compareMode && (
                <div style={{ marginTop:10, padding:"8px 10px", background:"#eff6ff", borderRadius:8, fontSize:11, color:"#1d4ed8" }}>
                  Les graphiques afficheront la période actuelle <strong>vs</strong> {COMPARE_OPTS.find(c=>c.value===compareMode)?.label?.toLowerCase()}.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GraphCard({ id, title, colorPickers, onDragStart, onDragOver, onDrop, isDragging, isDragOver, children, cardColor, textColor }) {
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed="move"; e.dataTransfer.setData("text/plain",id); onDragStart(id); }}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect="move"; onDragOver(id); }}
      onDrop={e => { e.preventDefault(); e.stopPropagation(); onDrop(id); }}
      onDragEnter={e => { e.preventDefault(); onDragOver(id); }}
      onDragEnd={() => onDrop(null)}
      style={{
        background: cardColor || "#fff",
        borderRadius:12, padding:"14px 16px",
        border: isDragOver ? "2px dashed #93c5fd" : "1px solid #e5e7eb",
        opacity: isDragging ? 0.4 : 1,
        boxShadow: isDragOver ? "0 0 0 2px #93c5fd, 0 4px 12px rgba(0,0,0,.1)" : "none",
        transition:"opacity .2s, box-shadow .15s, border .15s",
        cursor:"grab", userSelect:"none",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, gap:8, pointerEvents:"none" }}>
        <span style={{ fontSize:13, fontWeight:600, color: textColor || "#111827" }}>{title}</span>
        <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0, pointerEvents:"auto" }}
          onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
          {colorPickers}
          <svg width="10" height="14" viewBox="0 0 10 14" fill="#94a3b8" style={{ flexShrink:0, marginLeft:2, opacity:.6, pointerEvents:"none" }}>
            <circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/>
            <circle cx="2" cy="7" r="1.5"/><circle cx="8" cy="7" r="1.5"/>
            <circle cx="2" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/>
          </svg>
        </div>
      </div>
      <div style={{ pointerEvents:"none" }}>{children}</div>
    </div>
  );
}

function KpiCard({ id, label, value, delta, sub, color, pct, warn, onColorChange, onDragStart, onDragOver, onDrop, isDragging, isDragOver, cardColor, textColor }) {
  const isPos = delta && !delta.startsWith("▼");
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed="move"; onDragStart(id); }}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect="move"; onDragOver(id); }}
      onDrop={e => { e.preventDefault(); onDrop(id); }}
      onDragEnd={() => onDrop(null)}
      style={{
        background: cardColor || "#fff",
        border: isDragOver ? "2px dashed #93c5fd" : warn ? "1px solid #fecaca" : "1px solid #e5e7eb",
        borderTop: `2.5px solid ${color}`, borderRadius:10, padding:"12px 13px",
        opacity: isDragging ? 0.4 : 1, cursor:"grab",
        boxShadow: isDragOver ? "0 0 0 2px #93c5fd, 0 4px 12px rgba(0,0,0,.1)" : "none",
        transition:"opacity .2s, box-shadow .2s",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
        <div style={{ fontSize:10, fontWeight:600, color: textColor ? textColor+"99" : "#94a3b8", textTransform:"uppercase", letterSpacing:".06em", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{label}</div>
        {onColorChange && (
          <div onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()} style={{flexShrink:0,marginLeft:4}}>
            <ColorPicker value={color} onChange={onColorChange} label={label}/>
          </div>
        )}
      </div>
      <div style={{ fontSize:21, fontWeight:700, color, lineHeight:1.1 }}>{value}</div>
      {delta && <div style={{ fontSize:10, fontWeight:500, color: isPos ? "#059669" : "#dc2626", marginTop:3 }}>{delta}</div>}
      {sub && !delta && <div style={{ fontSize:10, color: textColor ? textColor+"88" : "#94a3b8", marginTop:3 }}>{sub}</div>}
      {pct !== undefined && (
        <div style={{ height:3, borderRadius:2, background:"#f1f5f9", marginTop:6, overflow:"hidden" }}>
          <div style={{ height:"100%", width:Math.min(pct,100)+"%", background:color, borderRadius:2 }}/>
        </div>
      )}
    </div>
  );
}

const MiniLineChart = ({ data, keys, colors, height=60, textColor="#9ca3af" }) => {
  const all = data.flatMap(d => keys.map(k => d[k]||0));
  const max = Math.max(...all, 1);
  const W=340, H=height, PL=28, PB=20, PT=6, PR=6;
  const cW=W-PL-PR, cH=H-PT-PB;
  const xP = i => PL + (i/Math.max(data.length-1,1))*cW;
  const yP = v => PT + cH - (v/max)*cH;
  return (
    <svg viewBox={"0 0 "+W+" "+H} style={{ width:"100%", height:"auto", display:"block", pointerEvents:"none" }}>
      {[0,.25,.5,.75,1].map((r,i) => <line key={i} x1={PL} y1={PT+cH*r} x2={W-PR} y2={PT+cH*r} stroke="#f3f4f6" strokeWidth="0.5"/>)}
      {keys.map((k,ki) => {
        const pts = data.map((d,i) => xP(i)+","+yP(d[k]||0)).join(" ");
        const area = xP(0)+","+yP((data[0]&&data[0][k])||0)+" "+pts+" "+xP(data.length-1)+","+(H-PB)+" "+xP(0)+","+(H-PB);
        return <g key={k}><polygon points={area} fill={colors[ki]} fillOpacity="0.08"/><polyline points={pts} fill="none" stroke={colors[ki]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>{data.map((d,i) => <circle key={i} cx={xP(i)} cy={yP(d[k]||0)} r="2.5" fill={colors[ki]}/>)}</g>;
      })}
      {data.map((d,i) => (data.length<=14||(i%2===0)) && <text key={i} x={xP(i)} y={H-4} textAnchor="middle" fontSize="8" fill={textColor}>{d.lbl}</text>)}
      {[max,Math.round(max/2),0].map((v,i) => <text key={i} x={PL-3} y={i===0?PT+6:i===1?PT+cH/2+3:PT+cH+3} textAnchor="end" fontSize="8" fill={textColor}>{v}</text>)}
    </svg>
  );
};

const MiniBarChart = ({ data, color, height=110, textColor="#9ca3af" }) => {
  const max = Math.max(...data.map(d=>d.val), 1);
  const W=260, H=height, PL=22, PB=18, PT=18, PR=4;
  const cW=W-PL-PR, cH=H-PT-PB;
  const bW = Math.max(8, cW/data.length-6);
  return (
    <svg viewBox={"0 0 "+W+" "+H} style={{ width:"100%", height:"auto", pointerEvents:"none" }}>
      {[0,.5,1].map((r,i) => <line key={i} x1={PL} y1={PT+cH*r} x2={W-PR} y2={PT+cH*r} stroke="#f3f4f6" strokeWidth="0.5"/>)}
      {data.map((d,i) => {
        const x = PL+(i/data.length)*cW+(cW/data.length-bW)/2;
        const bH = (d.val/max)*cH; const y = PT+cH-bH;
        return <g key={i}><rect x={x} y={y} width={bW} height={Math.max(bH,0)} rx="2" fill={color} fillOpacity="0.85"/><text x={x+bW/2} y={H-4} textAnchor="middle" fontSize="8" fill={textColor}>{d.lbl}</text>{d.val>0&&<text x={x+bW/2} y={y-3} textAnchor="middle" fontSize="8" fill={color} fontWeight="600">{d.val}</text>}</g>;
      })}
      {[max,0].map((v,i) => <text key={i} x={PL-2} y={i===0?PT+8:PT+cH+3} textAnchor="end" fontSize="8" fill={textColor}>{v}</text>)}
    </svg>
  );
};

const DonutChart = ({ segments, size=100 }) => {
  const total = segments.reduce((s,x)=>s+x.val,0)||1;
  const r = size * 0.36;
  const sw = size * 0.18;
  const cx=size/2, cy=size/2, circ=2*Math.PI*r;
  let cum=0;
  return (
    <svg width={size} height={size} viewBox={"0 0 "+size+" "+size} style={{pointerEvents:"none", flexShrink:0}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={sw}/>
      {segments.map((seg,i) => {
        const pct=seg.val/total; const dash=pct*circ; const off=-(cum*circ);
        cum+=pct;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={sw} strokeDasharray={dash+" "+(circ-dash)} strokeDashoffset={off} transform={"rotate(-90 "+cx+" "+cy+")"}/>;
      })}
    </svg>
  );
};

function AgentDashboard({ tickets, user, bgColor, setBgColor }) {
  const [showBgPanel, setShowBgPanel] = useState(false);
  const [textColor,   setTextColor]   = useState(() => localStorage.getItem("agent_text_color") || "#111827");
  const [cardColor,   setCardColor]   = useState(() => localStorage.getItem("agent_card_color") || "#ffffff");
  useEffect(() => { localStorage.setItem("agent_text_color", textColor); }, [textColor]);
  useEffect(() => { localStorage.setItem("agent_card_color", cardColor); }, [cardColor]);

  const [dateRange,   setDateRange]   = useState({ preset:"week", from:null, to:null });
  const [compareMode, setCompareMode] = useState(null);

  const [col, setCol] = useState({
    lineC:"#2563eb", lineR:"#16a34a",
    barVelo:"#2563eb",
    dStatut1:"#16a34a", dStatut2:"#2563eb", dStatut3:"#d97706", dStatut4:"#dc2626",
    dType1:"#dc2626", dType2:"#2563eb", dType3:"#7c3aed",
    barNote:"#d97706",
    scoreRing:"#0891b2",
  });
  const sc = k => v => setCol(c => ({ ...c, [k]:v }));

  const [kpiColors, setKpiColors] = useState({
    kpiAssignes:"#2563eb", kpiResolution:"#16a34a", kpiSLA:"#16a34a",
    kpiSatisf:"#d97706",   kpiTemps:"#7c3aed",      kpiScore:"#0891b2",
    kpiToday:"#16a34a",    kpiRisque:"#dc2626",     kpiPremier:"#d97706", kpiVieux:"#6b7280",
  });
  const skc = k => v => setKpiColors(c => ({ ...c, [k]:v }));

  const KPI_DEFAULT = ["kpiAssignes","kpiResolution","kpiSLA","kpiSatisf","kpiTemps","kpiScore","kpiToday","kpiRisque","kpiPremier","kpiVieux"];
  const [kpiOrder, setKpiOrder] = useState(KPI_DEFAULT);
  const [kpiDragging, setKpiDragging] = useState(null);
  const [kpiOver, setKpiOver] = useState(null);
  const kpiDragId = useRef(null);

  const onKpiDS  = id => { kpiDragId.current=id; setKpiDragging(id); };
  const onKpiDO  = id => setKpiOver(id);
  const onKpiDrop= id => {
    if(id===null){ setKpiDragging(null); setKpiOver(null); kpiDragId.current=null; return; }
    if(!kpiDragId.current||kpiDragId.current===id){ setKpiDragging(null); setKpiOver(null); return; }
    const from=kpiDragId.current;
    setKpiOrder(prev=>{ const n=[...prev],fi=n.indexOf(from),ti=n.indexOf(id);if(fi===-1||ti===-1)return prev;n.splice(fi,1);n.splice(ti,0,from);return n; });
    kpiDragId.current=null; setKpiDragging(null); setKpiOver(null);
  };

  const GRAPH_DEFAULT = ["evolution","velociite","statuts","types","satisfaction","flux"];
  const [graphOrder, setGraphOrder] = useState(GRAPH_DEFAULT);
  const [gDragging, setGDragging] = useState(null);
  const [gOver, setGOver] = useState(null);
  const gDragId = useRef(null);

  const onGDS  = id => { gDragId.current = id; setGDragging(id); };
  const onGDO  = id => { if (gDragId.current && gDragId.current !== id) setGOver(id); };
  const onGDrop= id => {
    if (id === null) { setGDragging(null); setGOver(null); gDragId.current = null; return; }
    const from = gDragId.current;
    if (!from || from === id) { setGDragging(null); setGOver(null); gDragId.current = null; return; }
    setGraphOrder(prev => {
      const n = [...prev];
      const fi = n.indexOf(from);
      const ti = n.indexOf(id);
      if (fi === -1 || ti === -1) return prev;
      n.splice(fi, 1);
      n.splice(ti, 0, from);
      return n;
    });
    gDragId.current = null;
    setGDragging(null);
    setGOver(null);
  };

  const uid = user?._id || user?.id;

  const getRangeBounds = (range) => {
    const now = new Date();
    const bod = d => { const x=new Date(d); x.setHours(0,0,0,0); return x; };
    const eod = d => { const x=new Date(d); x.setHours(23,59,59,999); return x; };
    if (range?.from && range?.to) {
      return { from: bod(range.from), to: eod(range.to) };
    }
    switch(range?.preset) {
      case "today":  return { from: bod(now), to: eod(now) };
      case "week":   { const m=new Date(now); m.setDate(now.getDate()-now.getDay()+1); return { from:bod(m), to:eod(now) }; }
      case "month":  { const m=new Date(now.getFullYear(),now.getMonth(),1); return { from:bod(m), to:eod(now) }; }
      case "year":   { const m=new Date(now.getFullYear(),0,1); return { from:bod(m), to:eod(now) }; }
      case "last7":  { const m=new Date(now); m.setDate(now.getDate()-6); return { from:bod(m), to:eod(now) }; }
      case "last30": { const m=new Date(now); m.setDate(now.getDate()-29); return { from:bod(m), to:eod(now) }; }
      case "last90": { const m=new Date(now); m.setDate(now.getDate()-89); return { from:bod(m), to:eod(now) }; }
      default:       { const m=new Date(now); m.setDate(now.getDate()-6); return { from:bod(m), to:eod(now) }; }
    }
  };

  const getCompareBounds = (range, compareMode) => {
    const { from, to } = getRangeBounds(range);
    const diff = to - from;
    switch(compareMode) {
      case "prev_week":   { const f=new Date(from); f.setDate(f.getDate()-7); const t2=new Date(to); t2.setDate(t2.getDate()-7); return { from:f, to:t2 }; }
      case "prev_month":  { const f=new Date(from); f.setMonth(f.getMonth()-1); const t2=new Date(to); t2.setMonth(t2.getMonth()-1); return { from:f, to:t2 }; }
      case "prev_year":   { const f=new Date(from); f.setFullYear(f.getFullYear()-1); const t2=new Date(to); t2.setFullYear(t2.getFullYear()-1); return { from:f, to:t2 }; }
      case "prev_period": { const f=new Date(from.getTime()-diff-1); const t2=new Date(from.getTime()-1); return { from:f, to:t2 }; }
      default: return null;
    }
  };

  const { from: rangeFrom, to: rangeTo } = getRangeBounds(dateRange);
  const compareBounds = compareMode ? getCompareBounds(dateRange, compareMode) : null;

  const inRange = (t, bounds) => {
    const c = new Date(t.createdAt);
    return c >= bounds.from && c <= bounds.to;
  };

  const allMine  = tickets.filter(t => checkIsMine(t, uid));
  const myTickets= allMine.filter(t => inRange(t, { from: rangeFrom, to: rangeTo }));
  const myTicketsPrev = compareBounds ? allMine.filter(t => inRange(t, compareBounds)) : [];

  const resolved = myTickets.filter(t => ["solved","closed"].includes(t.statut));
  const escalated= myTickets.filter(t => t.statut==="escalated");
  const inProg   = myTickets.filter(t => t.statut==="in_progress");
  const atFaire  = myTickets.filter(t => t.statut==="ready_for_support");
  const slaRisk  = myTickets.filter(t => t.slaBreached || (t.slaPourcentage>=75&&!["solved","closed","cancelled"].includes(t.statut)));

  const tauxRes  = myTickets.length>0 ? Math.round((resolved.length/myTickets.length)*100) : 0;
  const tauxSLA  = myTickets.length>0 ? Math.round(((myTickets.length-slaRisk.length)/myTickets.length)*100) : 100;
  const withFb   = myTickets.filter(t => t.feedback&&t.feedback.note>0);
  const avgSat   = withFb.length>0 ? (withFb.reduce((s,t)=>s+t.feedback.note,0)/withFb.length).toFixed(1) : "—";
  const avgH     = resolved.length>0 ? Math.round(resolved.reduce((s,t)=>s+(new Date(t.updatedAt)-new Date(t.createdAt)),0)/resolved.length/3600000) : 0;
  const score    = Math.round(tauxRes*0.35 + tauxSLA*0.35 + (avgSat!=="—"?parseFloat(avgSat)/5*100*0.30:50*0.30));

  const today    = new Date(); today.setHours(0,0,0,0);
  const resolvedToday = resolved.filter(t => new Date(t.updatedAt)>=today).length;
  const firstContact = myTickets.length>0 ? Math.round((myTickets.filter(t=>["solved","closed"].includes(t.statut)&&(t.commentaires?.length||0)<=2).length/myTickets.length)*100) : 0;
  const oldest   = allMine.filter(t=>!["solved","closed","cancelled"].includes(t.statut)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt))[0];
  const oldestDays = oldest ? Math.floor((Date.now()-new Date(oldest.createdAt))/86400000) : 0;

  const days7 = Array.from({length:7}, (_,i) => {
    const totalMs = rangeTo - rangeFrom;
    const sliceMs = totalMs / 7;
    const sliceFrom = new Date(rangeFrom.getTime() + i * sliceMs);
    const sliceTo   = new Date(rangeFrom.getTime() + (i+1) * sliceMs - 1);
    const midDay = new Date(sliceFrom.getTime() + sliceMs/2);
    const lbl = totalMs <= 14*86400000
      ? ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][midDay.getDay()]
      : midDay.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"});
    return {
      lbl,
      crees:  allMine.filter(t=>{ const c=new Date(t.createdAt); return c>=sliceFrom&&c<=sliceTo; }).length,
      resolus: allMine.filter(t=>["solved","closed"].includes(t.statut)&&(()=>{ const u=new Date(t.updatedAt); return u>=sliceFrom&&u<=sliceTo; })()).length,
      creesP:  compareBounds ? allMine.filter(t=>{ const c=new Date(t.createdAt); const f=new Date(compareBounds.from.getTime()+i*sliceMs); const tt=new Date(compareBounds.from.getTime()+(i+1)*sliceMs-1); return c>=f&&c<=tt; }).length : 0,
      resolusP:compareBounds ? allMine.filter(t=>["solved","closed"].includes(t.statut)&&(()=>{ const u=new Date(t.updatedAt); const f=new Date(compareBounds.from.getTime()+i*sliceMs); const tt=new Date(compareBounds.from.getTime()+(i+1)*sliceMs-1); return u>=f&&u<=tt; })()).length : 0,
    };
  });

  const donutStatuts = [
    { color:col.dStatut1, val:resolved.length },
    { color:col.dStatut2, val:inProg.length },
    { color:col.dStatut3, val:atFaire.length },
    { color:col.dStatut4, val:escalated.length },
  ];

  const donutTypes = [
    { color:col.dType1, val:myTickets.filter(t=>t.type==="bug").length },
    { color:col.dType2, val:myTickets.filter(t=>t.type==="feature").length },
    { color:col.dType3, val:myTickets.filter(t=>t.type==="consultancy").length },
  ];

  const notesDist = [5,4,3,2,1].map(n=>({
    lbl:n+"★", val:withFb.filter(t=>Math.round(t.feedback.note)===n).length,
    color:n>=4?"#16a34a":n===3?"#d97706":n===2?"#ea580c":"#dc2626"
  }));

  const totalMy  = myTickets.length;

  const prevResolved = myTicketsPrev.filter(t => ["solved","closed"].includes(t.statut));
  const prevTauxRes  = myTicketsPrev.length>0 ? Math.round((prevResolved.length/myTicketsPrev.length)*100) : null;
  const deltaRes = prevTauxRes !== null ? (tauxRes - prevTauxRes) : null;

  const KPI_DATA = {
    kpiAssignes:  { label:"Tickets assignés",    value:myTickets.length, pct:Math.min(myTickets.length/30*100,100), color:kpiColors.kpiAssignes,
                    delta: compareMode && myTicketsPrev.length>0 ? (myTickets.length>=myTicketsPrev.length?"▲ ":"▼ ")+(Math.abs(myTickets.length-myTicketsPrev.length))+" vs préc." : "▲ ce mois" },
    kpiResolution:{ label:"Taux résolution",     value:tauxRes+"%", pct:tauxRes, color:kpiColors.kpiResolution,
                    delta: deltaRes!==null ? (deltaRes>=0?"▲ +":"▼ ")+deltaRes+"% vs préc." : tauxRes>=70?"▲ Bon":"▼ À améliorer" },
    kpiSLA:       { label:"Conformité SLA",      value:tauxSLA+"%", pct:tauxSLA, color:kpiColors.kpiSLA, delta:tauxSLA>=80?"▲ OK":"▼ obj. 80%", warn:tauxSLA<80 },
    kpiSatisf:    { label:"Satisfaction",        value:(avgSat==="—"?"—":avgSat+"/5"), pct:avgSat!=="—"?parseFloat(avgSat)/5*100:0, color:kpiColors.kpiSatisf, sub:withFb.length+" avis" },
    kpiTemps:     { label:"Temps moyen rés.",    value:avgH+"h", color:kpiColors.kpiTemps, sub:"par ticket résolu" },
    kpiScore:     { label:"Score qualité",       value:score+"/100", color:kpiColors.kpiScore, pct:score, delta:score>=70?"▲ Bon niveau":"▼ En progression" },
    kpiToday:     { label:"Tickets résolus",     value:resolved.length,   color:kpiColors.kpiToday, sub:"sur "+myTickets.length+" assignés" },
    kpiRisque:    { label:"Tickets SLA à risque",value:slaRisk.length, color:kpiColors.kpiRisque, warn:slaRisk.length>0, delta:slaRisk.length>0?"▼ Action requise":"▲ RAS" },
    kpiPremier:   { label:"Taux 1er contact",    value:firstContact+"%", pct:firstContact, color:kpiColors.kpiPremier, sub:"résolus dès 1er échange" },
    kpiVieux:     { label:"Ticket le + vieux",   value:oldest?oldestDays+"j":"—", color:kpiColors.kpiVieux, sub:oldest?ticketRef(oldest._id):"Aucun ouvert" },
  };

  const renderGraph = id => {
    const gp = {
      id,
      isDragging: gDragging === id,
      isDragOver: gOver === id && gDragging !== id,
      onDragStart: onGDS,
      onDragOver:  onGDO,
      onDrop:      onGDrop,
      cardColor,
      textColor,
    };

    switch(id) {
      case "evolution": return (
        <GraphCard key={id} {...gp}
          title="Évolution — créés vs résolus"
          colorPickers={<>
            <span style={{display:"flex",alignItems:"center",gap:3,fontSize:11,color:col.lineC}}>
              <ColorPicker value={col.lineC} onChange={sc("lineC")} label="Créés"/>Créés
            </span>
            <span style={{display:"flex",alignItems:"center",gap:3,fontSize:11,color:col.lineR}}>
              <ColorPicker value={col.lineR} onChange={sc("lineR")} label="Résolus"/>Résolus
            </span>
          </>}>
          <div style={{width:"70%"}}>
            <MiniLineChart
              data={days7}
              keys={compareMode ? ["crees","resolus","creesP","resolusP"] : ["crees","resolus"]}
              colors={compareMode
                ? [col.lineC, col.lineR, col.lineC+"88", col.lineR+"88"]
                : [col.lineC, col.lineR]}
              height={75}
              textColor={textColor}
            />
          </div>
          {compareMode && (
            <div style={{display:"flex",gap:12,marginTop:4,fontSize:10,color:textColor,opacity:.7}}>
              <span style={{opacity:.6}}>— — Période précédente</span>
              <span style={{color:col.lineC+"88"}}>Créés (préc.)</span>
              <span style={{color:col.lineR+"88"}}>Résolus (préc.)</span>
            </div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6,paddingTop:6,borderTop:"1px solid #f3f4f6",fontSize:10,color:textColor,opacity:.7}}>
            <span>Total créés : <strong style={{color:textColor}}>{days7.reduce((s,d)=>s+d.crees,0)}</strong></span>
            <span>Total résolus : <strong style={{color:col.lineR}}>{days7.reduce((s,d)=>s+d.resolus,0)}</strong></span>
            <span>Moy./jour : <strong style={{color:col.lineC}}>{(days7.reduce((s,d)=>s+d.crees,0)/7).toFixed(1)}</strong></span>
          </div>
        </GraphCard>
      );

      case "velociite": return (
        <GraphCard key={id} {...gp} title="Vélocité — tickets résolus / jour"
          colorPickers={<ColorPicker value={col.barVelo} onChange={sc("barVelo")} label="Barres"/>}>
          <div style={{minHeight:148, display:"flex", flexDirection:"column", justifyContent:"space-between"}}>
            <MiniBarChart data={days7.map(d=>({lbl:d.lbl,val:d.resolus}))} color={col.barVelo} height={110} textColor={textColor}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:10,color:textColor,opacity:.7}}>
              <span>Total : <strong style={{color:textColor}}>{days7.reduce((s,d)=>s+d.resolus,0)}</strong></span>
              <span>Max : <strong style={{color:col.barVelo}}>{Math.max(...days7.map(d=>d.resolus))}</strong></span>
            </div>
          </div>
        </GraphCard>
      );

      case "statuts": return (
        <GraphCard key={id} {...gp} title="Mes tickets — statuts"
          colorPickers={<>
            <ColorPicker value={col.dStatut1} onChange={sc("dStatut1")} label="Résolus"/>
            <ColorPicker value={col.dStatut2} onChange={sc("dStatut2")} label="En cours"/>
            <ColorPicker value={col.dStatut3} onChange={sc("dStatut3")} label="À faire"/>
            <ColorPicker value={col.dStatut4} onChange={sc("dStatut4")} label="Escaladé"/>
          </>}>
          <div style={{minHeight:148, display:"flex", alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:14,width:"100%"}}>
              <DonutChart segments={donutStatuts} size={100}/>
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
                {[
                  {lbl:"Résolus",  i:0, val:resolved.length},
                  {lbl:"En cours", i:1, val:inProg.length},
                  {lbl:"À faire",  i:2, val:atFaire.length},
                  {lbl:"Escaladé", i:3, val:escalated.length},
                ].map(r => {
                  const pct = myTickets.length ? Math.round(r.val/myTickets.length*100) : 0;
                  return (
                    <div key={r.lbl} style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:8,height:8,borderRadius:2,background:donutStatuts[r.i].color,flexShrink:0}}/>
                      <span style={{fontSize:12,color:"#374151",flex:1}}>{r.lbl}</span>
                      <span style={{fontSize:12,fontWeight:600,color:donutStatuts[r.i].color}}>{r.val}</span>
                      <span style={{fontSize:11,color:"#9ca3af",minWidth:28}}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </GraphCard>
      );

      case "types": return (
        <GraphCard key={id} {...gp} title="Mes tickets — types"
          colorPickers={<>
            <ColorPicker value={col.dType1} onChange={sc("dType1")} label="Bug"/>
            <ColorPicker value={col.dType2} onChange={sc("dType2")} label="Feature"/>
            <ColorPicker value={col.dType3} onChange={sc("dType3")} label="Consult."/>
          </>}>
          <div style={{minHeight:148, display:"flex", alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:14,width:"100%"}}>
              <DonutChart segments={donutTypes} size={100}/>
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
                {[{lbl:"Bug",i:0},{lbl:"Feature",i:1},{lbl:"Consultancy",i:2}].map(r => {
                  const val = donutTypes[r.i].val;
                  const pct = myTickets.length ? Math.round(val/myTickets.length*100) : 0;
                  return (
                    <div key={r.lbl} style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:8,height:8,borderRadius:2,background:donutTypes[r.i].color,flexShrink:0}}/>
                      <span style={{fontSize:12,color:"#374151",flex:1}}>{r.lbl}</span>
                      <span style={{fontSize:12,fontWeight:600,color:donutTypes[r.i].color}}>{val}</span>
                      <span style={{fontSize:11,color:"#9ca3af",minWidth:28}}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </GraphCard>
      );

      case "satisfaction": return (
        <GraphCard key={id} {...gp} title="Satisfaction client reçue"
          colorPickers={<ColorPicker value={col.barNote} onChange={sc("barNote")} label="Barres notes"/>}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,paddingBottom:10,borderBottom:"1px solid #f3f4f6"}}>
            <div style={{fontSize:28,fontWeight:700,color:col.barNote}}>{avgSat}</div>
            <div>
              <div style={{display:"flex",gap:2,marginBottom:3}}>{[1,2,3,4,5].map(s=><div key={s} style={{width:12,height:12,borderRadius:2,background:avgSat!=="—"&&s<=Math.round(parseFloat(avgSat))?"#f59e0b":"#e5e7eb"}}/>)}</div>
              <div style={{fontSize:10,color:"#9ca3af"}}>{withFb.length} avis reçus</div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {notesDist.map(n=>{
              const pct=withFb.length?Math.round(n.val/withFb.length*100):0;
              return <div key={n.lbl} style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:10,color:"#6b7280",minWidth:24}}>{n.lbl}</span>
                <div style={{flex:1,height:12,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:pct+"%",background:n.color,borderRadius:3,display:"flex",alignItems:"center",paddingLeft:4}}>
                    {pct>15&&<span style={{fontSize:8,color:"#fff",fontWeight:600}}>{n.val}</span>}
                  </div>
                </div>
                <span style={{fontSize:10,color:"#9ca3af",minWidth:24}}>{pct}%</span>
              </div>;
            })}
          </div>
          {withFb.length>0&&(()=>{
            const worst=myTickets.filter(t=>t.feedback&&t.feedback.note>0).sort((a,b)=>a.feedback.note-b.feedback.note)[0];
            return worst&&worst.feedback.note<3&&<div style={{marginTop:10,padding:"6px 10px",background:"#fef2f2",borderRadius:7,fontSize:11,color:"#b91c1c"}}>Note la plus basse : {ticketRef(worst._id)} — {worst.feedback.note}/5</div>;
          })()}
        </GraphCard>
      );

      case "flux": return (
        <GraphCard key={id} {...gp} title="Flux de traitement — mes tickets"
          colorPickers={<span style={{fontSize:11,color:"#9ca3af"}}>De la création à la clôture</span>}>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {[
              {label:"Total assignés",total:totalMy,segs:[{pct:100,bg:"#bfdbfe",c:"#1d4ed8",txt:totalMy+" tickets"}]},
              {label:"En traitement",total:totalMy,segs:[
                {pct:totalMy>0?Math.round((inProg.length/totalMy)*100):0,bg:"#6ee7b7",c:"#065f46",txt:inProg.length+" en cours"},
                {pct:totalMy>0?Math.round((atFaire.length/totalMy)*100):0,bg:"#fde68a",c:"#92400e",txt:atFaire.length+" à faire"},
                {pct:totalMy>0?Math.round((escalated.length/totalMy)*100):0,bg:"#fca5a5",c:"#991b1b",txt:escalated.length+" esc."},
              ]},
              {label:"Clôturés",total:resolved.length,segs:[{pct:100,bg:"#bbf7d0",c:"#14532d",txt:resolved.length+" résolus"}]},
            ].map((row,ri)=>(
              <React.Fragment key={ri}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:11,color:"#6b7280",minWidth:80,fontWeight:500}}>{row.label}</span>
                  <div style={{flex:1,height:24,borderRadius:5,overflow:"hidden",display:"flex"}}>
                    {row.segs.map((seg,si)=>seg.pct>0&&<div key={si} style={{width:seg.pct+"%",background:seg.bg,color:seg.c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600,overflow:"hidden",whiteSpace:"nowrap",padding:"0 4px"}}>{seg.txt}</div>)}
                  </div>
                  <span style={{fontSize:11,fontWeight:600,color:"#475569",minWidth:20,textAlign:"right"}}>{row.total}</span>
                </div>
                {ri<2&&<div style={{paddingLeft:90,fontSize:12,color:"#d1d5db",lineHeight:1.2}}>↓</div>}
              </React.Fragment>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:8,borderTop:"1px solid #f3f4f6",fontSize:11,color:"#6b7280"}}>
            <span>Taux résolution <strong style={{color:"#16a34a"}}>{tauxRes}%</strong></span>
            <span>Conformité SLA <strong style={{color:tauxSLA>=80?"#16a34a":"#dc2626"}}>{tauxSLA}%</strong></span>
            <span>Escaladés <strong style={{color:"#dc2626"}}>{escalated.length}</strong></span>
          </div>
        </GraphCard>
      );

      default: return null;
    }
  };

  const buildGraphRows = () => {
    const GROUPS = [["evolution"],["velociite","statuts","types"],["satisfaction","flux"]];
    const rows=[]; const done=new Set();
    for(const g of GROUPS){
      const inOrd=g.filter(id=>graphOrder.includes(id)&&!done.has(id));
      if(inOrd.length>0){ rows.push(inOrd); inOrd.forEach(id=>done.add(id)); }
    }
    graphOrder.filter(id=>!done.has(id)).forEach(id=>{ rows.push([id]); done.add(id); });
    return rows;
  };

  return (
    <div style={{ padding:"18px 24px", background:bgColor, minHeight:"100%", display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:600, color:"#111827", margin:0 }}>Mon tableau de bord</h2>
          <p style={{ fontSize:12, color:"#9ca3af", margin:"3px 0 0" }}>{user?.prenom} {user?.nom} · {myTickets.length} tickets · {new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <DateRangePicker range={dateRange} setRange={setDateRange} compareMode={compareMode} setCompareMode={setCompareMode}/>
          <button onClick={() => setShowBgPanel(true)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px", border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer", fontSize:12, color:"#374151", fontWeight:500 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="#374151"><path d="M8 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm4 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm.5 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M16 8c0 3.15-1.866 2.585-3.567 2.07C11.42 9.763 10.465 9.473 10 10c-.603.683-.475 1.819-.351 2.92C9.826 14.495 9.996 16 8 16a8 8 0 1 1 8-8z"/></svg>
            Personnaliser le fond
            <div style={{ width:14, height:14, borderRadius:3, background:bgColor, border:"1px solid rgba(0,0,0,.15)", flexShrink:0 }}/>
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,minmax(0,1fr))", gap:10 }}>
        {kpiOrder.slice(0,5).map(id => {
          const k = KPI_DATA[id];
          return <KpiCard key={id} id={id} {...k} onColorChange={skc(id)} onDragStart={onKpiDS} onDragOver={onKpiDO} onDrop={onKpiDrop} isDragging={kpiDragging===id} isDragOver={kpiOver===id&&kpiDragging!==id} cardColor={cardColor} textColor={textColor}/>;
        })}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,minmax(0,1fr))", gap:10 }}>
        {kpiOrder.slice(5,10).map(id => {
          const k = KPI_DATA[id];
          return <KpiCard key={id} id={id} {...k} onColorChange={skc(id)} onDragStart={onKpiDS} onDragOver={onKpiDO} onDrop={onKpiDrop} isDragging={kpiDragging===id} isDragOver={kpiOver===id&&kpiDragging!==id} cardColor={cardColor} textColor={textColor}/>;
        })}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(6, minmax(0,1fr))", gap:14, alignItems:"stretch" }}>
        {graphOrder.map(id => {
          const spanMap = { evolution:6, velociite:2, statuts:2, types:2, satisfaction:3, flux:3 };
          const span = spanMap[id] || 2;
          return (
            <div key={id} style={{ gridColumn:`span ${span}` }}>
              {renderGraph(id)}
            </div>
          );
        })}
      </div>

      {showBgPanel && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:7999, background:"rgba(0,0,0,.4)" }} onClick={() => setShowBgPanel(false)}/>
          <BgPanel bg={bgColor} onChangeBg={setBgColor} textColor={textColor} onChangeText={setTextColor} cardColor={cardColor} onChangeCard={setCardColor} onClose={() => setShowBgPanel(false)}/>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   RESTE DU CODE — INCHANGÉ
════════════════════════════════════════════════════════════ */

const Highlight = ({ text, query }) => {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi'));
  return <>{parts.map((p,i) => p.toLowerCase()===query.toLowerCase()
    ? <mark key={i} style={{background:"#fef08a",color:"inherit",borderRadius:2,padding:"0 1px"}}>{p}</mark>
    : p
  )}</>;
};

const HIST_CONFIG = {
  ticket_created: { label:"Ticket créé",             bg:"#EAF3DE", border:"#C0DD97", color:"#3B6D11", dotBg:"#EAF3DE", dotBorder:"#C0DD97" },
  auto_assigned:  { label:"Assignation automatique", bg:"#EEEDFE", border:"#AFA9EC", color:"#534AB7", dotBg:"#EEEDFE", dotBorder:"#AFA9EC" },
  statut_change:  { label:"Changement de statut",    bg:"#E6F1FB", border:"#B5D4F4", color:"#0C447C", dotBg:"#E6F1FB", dotBorder:"#B5D4F4" },
  comment_added:  { label:"Message(s) échangé(s)",   bg:"#FAEEDA", border:"#FAC775", color:"#854F0B", dotBg:"#FAEEDA", dotBorder:"#FAC775" },
  escalated:      { label:"Ticket escaladé",         bg:"#FCEBEB", border:"#F7C1C1", color:"#A32D2D", dotBg:"#FCEBEB", dotBorder:"#F7C1C1" },
  auto_escalated: { label:"Escalade automatique",    bg:"#FCEBEB", border:"#F7C1C1", color:"#791F1F", dotBg:"#FCEBEB", dotBorder:"#F7C1C1" },
  sla_breach:     { label:"SLA dépassé",             bg:"#FCEBEB", border:"#F7C1C1", color:"#791F1F", dotBg:"#FCEBEB", dotBorder:"#F7C1C1" },
  sla_warning:    { label:"Rappel inactivité",       bg:"#FAEEDA", border:"#FAC775", color:"#633806", dotBg:"#FAEEDA", dotBorder:"#FAC775" },
  auto_closed:    { label:"Fermeture automatique",   bg:"#EAF3DE", border:"#C0DD97", color:"#27500A", dotBg:"#EAF3DE", dotBorder:"#C0DD97" },
  solved:         { label:"Ticket résolu",           bg:"#EAF3DE", border:"#C0DD97", color:"#3B6D11", dotBg:"#EAF3DE", dotBorder:"#C0DD97" },
  ticket_bloque:  { label:"Ticket bloqué",           bg:"#FCEBEB", border:"#F7C1C1", color:"#A32D2D", dotBg:"#FCEBEB", dotBorder:"#F7C1C1" },
  force_resolu:   { label:"Résolution forcée",       bg:"#EAF3DE", border:"#C0DD97", color:"#27500A", dotBg:"#EAF3DE", dotBorder:"#C0DD97" },
  default:        { label:"Action",                  bg:"#E6F1FB", border:"#B5D4F4", color:"#0C447C", dotBg:"#E6F1FB", dotBorder:"#B5D4F4" },
};

function HistoriqueSection({ ticket }) {
  if (!ticket.historique || ticket.historique.length === 0) {
    return (<div style={{ textAlign:"center", padding:"32px 0", color:"#9ca3af" }}><p style={{ fontSize:13 }}>Aucune action enregistrée pour ce ticket.</p><p style={{ fontSize:11, marginTop:4 }}>Les actions futures apparaîtront ici automatiquement.</p></div>);
  }
  return (
    <div style={{ position:"relative" }}>
      <div style={{ position:"absolute", left:13, top:0, bottom:0, width:1, background:"#f3f4f6" }} />
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {[...ticket.historique].reverse().map((h, i) => {
          const cfg = HIST_CONFIG[h.action] || HIST_CONFIG.default;
          return (
            <div key={i} style={{ display:"flex", gap:12 }}>
              <div style={{ width:26, height:26, borderRadius:"50%", background:cfg.dotBg, border:`0.5px solid ${cfg.dotBorder}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, zIndex:1, fontSize:10, color:cfg.color, fontWeight:500 }}>{ticket.historique.length - i}</div>
              <div style={{ flex:1, background:cfg.bg, border:`0.5px solid ${cfg.border}`, borderRadius:8, padding:"8px 12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:3 }}>
                  <span style={{ fontSize:12, fontWeight:500, color:cfg.color }}>{cfg.label}</span>
                  <span style={{ fontSize:10, color:"#9ca3af", flexShrink:0, marginLeft:8 }}>{fmtTime(h.createdAt)}</span>
                </div>
                {h.details && <p style={{ fontSize:11, color:cfg.color, margin:0, opacity:0.85 }}>{h.details}</p>}
                <p style={{ fontSize:10, color:"#9ca3af", margin:h.details?"3px 0 0":0 }}>Par : {h.auteurNom || "Système automatique"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlaMiniBar({ ticket }) {
  const pct = ticket.slaPourcentage;
  if (pct === null || pct === undefined) return null;
  const color = pct >= 100 ? "#E24B4A" : pct >= 75 ? "#EF9F27" : "#1D9E75";
  const label = pct >= 100 ? `✕ SLA dépassé (${ticket.slaDepuisMinutes}min)` : pct >= 75 ? `⚠ ${ticket.slaDepuisMinutes}min / ${ticket.slaDelaiMinutes}min` : `${ticket.slaDepuisMinutes}min / ${ticket.slaDelaiMinutes}min`;
  return (
    <div style={{ marginTop:6 }}>
      <div style={{ height:4, borderRadius:2, background:"rgba(0,0,0,0.08)", overflow:"hidden" }}><div style={{ height:"100%", width:`${Math.min(pct,100)}%`, background:color, borderRadius:2, transition:"width .3s" }} /></div>
      <div style={{ fontSize:9, color, marginTop:2, fontWeight:pct>=75?500:400 }}>{label}</div>
    </div>
  );
}

const REACTIONS = [{ type:"like", emoji:"👍", label:"J'aime" }, { type:"love", emoji:"❤️", label:"J'adore" }];
function ReactionBar({ commentaire, userId, onReact }) {
  const [showPicker, setShowPicker] = useState(false);
  const counts = REACTIONS.reduce((acc,r) => { acc[r.type]=commentaire.reactions?.filter(rx=>rx.type===r.type).length||0; return acc; },{});
  const myReaction = commentaire.reactions?.find(r=>String(r.auteur?._id||r.auteur)===String(userId))?.type||null;
  return (
    <div style={{ position:"relative", display:"inline-flex", alignItems:"center", gap:4, marginTop:4 }}>
      <button onClick={()=>setShowPicker(p=>!p)} style={{ background:"none", border:"1px solid #e5e7eb", borderRadius:12, padding:"2px 7px", fontSize:12, cursor:"pointer", color:"#6b7280" }}>😊 +</button>
      {showPicker&&(<div style={{ position:"absolute", bottom:"calc(100% + 6px)", left:0, background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, boxShadow:"0 4px 16px rgba(0,0,0,0.12)", padding:"6px 8px", display:"flex", gap:6, zIndex:100 }}>
        {REACTIONS.map(r=>(<button key={r.type} onClick={()=>{onReact(commentaire._id,r.type);setShowPicker(false);}} style={{ background:myReaction===r.type?"#eff6ff":"none", border:myReaction===r.type?"1px solid #bfdbfe":"1px solid transparent", borderRadius:8, padding:"4px 8px", fontSize:18, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>{r.emoji}<span style={{ fontSize:9, color:"#6b7280" }}>{r.label}</span></button>))}
      </div>)}
      {REACTIONS.map(r=>counts[r.type]>0&&(<button key={r.type} onClick={()=>onReact(commentaire._id,r.type)} style={{ background:myReaction===r.type?"#eff6ff":"#f9fafb", border:`1px solid ${myReaction===r.type?"#bfdbfe":"#e5e7eb"}`, borderRadius:12, padding:"2px 8px", fontSize:12, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4, color:"#374151", fontWeight:myReaction===r.type?600:400 }}>{r.emoji} {counts[r.type]}</button>))}
    </div>
  );
}

function MiniKanban({ selected, onStepClick, isMine=true }) {
  return (
    <div className="mini-kanban-section">
      <p className="mini-kanban-title">Progression</p>
      {!isMine&&!["solved","closed","cancelled","escalated"].includes(selected.statut)&&(<div className="step-blocked-warning">⚠️ Prenez ce ticket en charge pour modifier son statut.</div>)}
      <div className="mini-kanban-steps">
        {STEPS.map((step,i)=>{
          const cur=IDX[selected.statut]??-1, done=i<=cur, esc=selected.statut==="escalated";
          const canClick=(selected.statut==="ready_for_support"&&i===1&&isMine)||(selected.statut==="in_progress"&&i===2&&isMine);
          return (
            <React.Fragment key={step.key}>
              <div className="mini-kanban-step">
                <div className={`step-circle ${done?"step-done":esc?"step-escalated":"step-pending"} ${canClick?"step-clickable":""}`} onClick={()=>canClick&&onStepClick(step,i)}>
                  {done?<Ico d={D.check} size={10}/>:i+1}
                </div>
                <p className={`step-label ${done?"step-label-done":""}`}>{step.label}</p>
                {canClick&&<span className="step-hint">Cliquer</span>}
              </div>
              {i<STEPS.length-1&&<div className={`step-line ${done&&i<cur?"step-line-done":"step-line-pending"}`}/>}
            </React.Fragment>
          );
        })}
      </div>
      {selected.statut==="escalated"&&<div className="escalated-banner"><Ico d={D.warning} size={13}/><p>Ticket escaladé au chef d'équipe.</p></div>}
      {selected.statut==="ready_for_customer"&&<div className="solution-sent-banner"><span>⏳</span><p>Solution envoyée — en attente de confirmation du client.</p></div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TicketDetail — AJOUT de l'onglet Analyse IA
   (seul changement : +1 tab button + +1 tab content)
════════════════════════════════════════════════════════════ */
function TicketDetail({ selected, user, isMine, msg, err, comment, temps, lightbox, setLightbox, setComment, setTemps, setMsg, setErr, setSelected, onChangeStatut, onPrendre, onStepClick, onAddComment, onDelComment, onEditComment, onSaveTime, onEscalade, onReact, showEscBtn=true }) {
  const convBottomRef = useRef(null);
  const [sendingComment,setSC] = useState(false);
  const [editingId,setEditingId] = useState(null);
  const [editingText,setET] = useState("");
  const [savingEdit,setSavingEdit] = useState(false);
  const [activeTab,setActiveTab] = useState("detail");
  useEffect(()=>{ setActiveTab("detail"); },[selected?._id]);
  useEffect(()=>{ if(activeTab==="conversation"&&selected?.commentaires?.length>0) convBottomRef.current?.scrollIntoView({behavior:"smooth"}); },[selected?.commentaires?.length,activeTab]);
  const handleSend = async () => { if(!comment.trim()||sendingComment) return; setSC(true); await onAddComment(selected._id); setSC(false); };
  const startEdit = c => { setEditingId(c._id); setET(c.contenu); };
  const cancelEdit = () => { setEditingId(null); setET(""); };
  const saveEdit = async (ticketId,commentId) => { if(!editingText.trim()) return; setSavingEdit(true); await onEditComment(ticketId,commentId,editingText); setEditingId(null); setET(""); setSavingEdit(false); };

  // ── Style onglet (identique à l'original) ──
  const tabSt = id => ({
    padding:"10px 16px", fontSize:12,
    fontWeight: activeTab===id ? 500 : 400,
    color: activeTab===id ? "#185FA5" : "#888",
    background:"none", border:"none",
    borderBottom: activeTab===id ? "2px solid #378ADD" : "2px solid transparent",
    cursor:"pointer", transition:"all .15s", whiteSpace:"nowrap"
  });

  return (
    <div className="sp-card">
      <button className="btn-back" onClick={()=>{setSelected(null);setMsg("");setErr("");}}>
        <Ico d={D.back} size={12}/> Retour au tableau
      </button>
      <div className="ticket-pro-header">
        <div className={`ticket-status-dot ${["solved","closed"].includes(selected.statut)?"status-done":selected.statut==="escalated"?"status-escalated":""}`}>{["solved","closed"].includes(selected.statut)&&<Ico d={D.check} size={8}/>}</div>
        <div className="ticket-pro-info">
          <h2 className="ticket-pro-titre">{selected.titre}</h2>
          <div className="ticket-pro-meta">
            <span className="ticket-meta-chip" style={{fontFamily:"monospace",fontSize:11}}>{ticketRef(selected._id)}</span>
            <span className="ticket-meta-sep">·</span><TypeBadge t={selected.type}/><span className="ticket-meta-sep">·</span><PrioBadge p={selected.priorite}/><span className="ticket-meta-sep">·</span>
            <span className="ticket-meta-chip">{selected.reporter?.prenom} {selected.reporter?.nom}</span><span className="ticket-meta-sep">·</span>
            <span className="ticket-meta-chip">{fmtDate(selected.createdAt)}</span>
            {selected.tempsPassé>0&&<><span className="ticket-meta-sep">·</span><span className="ticket-meta-chip">{selected.tempsPassé} min</span></>}
          </div>
          <div style={{marginTop:6}}>
            {selected.assignee?(<span style={{display:"inline-flex",alignItems:"center",gap:6,background:isMine?"#eff6ff":"#f5f3ff",color:isMine?"#1d4ed8":"#6d28d9",padding:"3px 10px",borderRadius:20,border:`1px solid ${isMine?"#bfdbfe":"#ddd6fe"}`,fontSize:12}}>👤 {isMine?"Assigné à moi":`Assigné à ${selected.assignee.prenom} ${selected.assignee.nom}`}</span>):(<span style={{display:"inline-flex",alignItems:"center",gap:6,background:"#fef2f2",color:"#b91c1c",padding:"3px 10px",borderRadius:20,border:"1px solid #fecaca",fontSize:12}}>⚠️ Non assigné</span>)}
          </div>
        </div>
        {showEscBtn&&!["solved","closed","cancelled"].includes(selected.statut)&&(
          <div className="ticket-icon-actions">
            <button className="icon-action-btn icon-escalade" title="Escalader" onClick={onEscalade}><Ico d={D.escalate} size={12}/></button>
            <button className="icon-action-btn icon-cancel" title="Annuler" onClick={()=>{if(window.confirm("Annuler ce ticket ?"))onChangeStatut(selected._id,"cancelled");}}><Ico d={D.cancel} size={12}/></button>
          </div>
        )}
      </div>
      {msg&&<div className="alert alert-success">{msg}</div>}
      {err&&<div className="alert alert-error">{err}</div>}
      {onPrendre&&!["solved","closed","cancelled"].includes(selected.statut)&&!isMine&&(
        <div className="prise-en-charge-banner">
          <span className="prise-en-charge-text">{selected.assignee?`Ce ticket est assigné à ${selected.assignee.prenom} ${selected.assignee.nom}. Prenez-le en charge pour agir dessus.`:"Ce ticket n'est pas encore assigné. Prenez-le en charge pour commencer."}</span>
          <button className="btn-prendre-charge" onClick={()=>onPrendre(selected._id)}>✋ Prendre en charge</button>
        </div>
      )}

      {/* ── Onglets — AJOUT de "Analyse IA" ── */}
      <div style={{ display:"flex", borderBottom:"0.5px solid #f0f0ed", marginTop:12, overflowX:"auto" }}>
        <button style={tabSt("detail")} onClick={()=>setActiveTab("detail")}>Détails</button>
        <button style={tabSt("progression")} onClick={()=>setActiveTab("progression")}>Progression</button>
        <button style={tabSt("conversation")} onClick={()=>setActiveTab("conversation")}>Conversation ({selected.commentaires?.length||0})</button>
        <button style={tabSt("historique")} onClick={()=>setActiveTab("historique")}>Historique ({selected.historique?.length||0})</button>
        {/* ── NOUVEAU : onglet IA ── */}
        <button style={{
          ...tabSt("ia"),
          display:"flex", alignItems:"center", gap:5,
          color: activeTab==="ia" ? "#6d28d9" : "#888",
          borderBottom: activeTab==="ia" ? "2px solid #6d28d9" : "2px solid transparent",
        }} onClick={()=>setActiveTab("ia")}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill={activeTab==="ia"?"#6d28d9":"#9ca3af"}>
            <path fillRule="evenodd" d={D.ia_cpu}/>
          </svg>
          Analyse IA
          {selected.iaTraite && (
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#16a34a", flexShrink:0 }}/>
          )}
        </button>
      </div>

      {/* ── Contenu des onglets (inchangés) ── */}
      {activeTab==="detail"&&(
        <div style={{padding:"16px 0"}}>
          <div className="ticket-detail-body"><p className="ticket-description">{selected.description}</p></div>
          {selected.fichiers?.length>0&&(<div className="ticket-fichiers-section"><p className="ticket-fichiers-title">📎 Pièces jointes ({selected.fichiers.length})</p><div className="ticket-fichiers-grid">{selected.fichiers.map((f,i)=>(<div key={i} className="ticket-fichier-item" onClick={()=>setLightbox({src:`http://localhost:3001${f.chemin}`,type:f.type})}>{f.type==="image"?<img src={`http://localhost:3001${f.chemin}`} alt={f.nom} className="fichier-thumb"/>:<div className="fichier-video-thumb"><video src={`http://localhost:3001${f.chemin}`} className="fichier-thumb"/><div className="fichier-video-overlay">▶</div></div>}<p className="fichier-name">{f.nom}</p></div>))}</div></div>)}
          {!["solved","closed","cancelled"].includes(selected.statut)&&(<div className="temps-section"><h3>Temps passé</h3><div className="temps-input"><input type="number" placeholder="Minutes" value={temps} onChange={e=>setTemps(e.target.value)} className="form-input" min="1"/><button className="btn-temps" onClick={()=>onSaveTime(selected._id)}>Enregistrer</button></div></div>)}
        </div>
      )}
      {activeTab==="progression"&&selected.statut!=="cancelled"&&(<div style={{padding:"16px 0"}}><MiniKanban selected={selected} onStepClick={onStepClick} isMine={isMine}/></div>)}
      {activeTab==="conversation"&&(
        <div className="commentaires-section" style={{paddingTop:16}}>
          <div className="conversation-list">
            {selected.commentaires?.length===0&&<p className="no-comment">Aucun message pour le moment. Écrivez un message au client.</p>}
            {selected.commentaires?.map((c,i)=>{
              const isClient=c.auteur?.role==="client", isMe=String(c.auteur?._id)===String(user?._id||user?.id);
              const initiales=`${c.auteur?.prenom?.[0]||""}${c.auteur?.nom?.[0]||""}`, showRight=!isClient, isEditing=editingId===c._id;
              return (
                <div key={c._id||i} className={`conv-row ${showRight?"conv-row-agent-right":"conv-row-client-left"}`}>
                  {isClient&&<div className="conv-avatar conv-avatar-client">{initiales}</div>}
                  <div className="conv-bubble-wrap">
                    <div className={`conv-meta ${showRight?"conv-meta-right":""}`}><span className="conv-author">{c.auteur?.prenom} {c.auteur?.nom}</span><span className="conv-role">{isClient?"Client":isMe?"Vous":"Support"}</span><span className="conv-time">{fmtTime(c.createdAt)}</span>{c.modifie&&<span className="conv-edited">(modifié)</span>}</div>
                    {isEditing?(<div className="conv-edit-inline"><textarea className="conv-edit-textarea" value={editingText} onChange={e=>setET(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();saveEdit(selected._id,c._id);}if(e.key==="Escape")cancelEdit();}} autoFocus rows={2}/><div className="conv-edit-actions"><button className="conv-edit-cancel" onClick={cancelEdit}>Annuler</button><button className="conv-edit-save" onClick={()=>saveEdit(selected._id,c._id)} disabled={savingEdit||!editingText.trim()}>{savingEdit?"...":"Enregistrer"}</button></div></div>):(<div className={`conv-bubble ${isClient?"conv-bubble-client-view":"conv-bubble-agent-view"}`}>{c.contenu}</div>)}
                    {!isEditing&&(<div style={{display:"flex",justifyContent:showRight?"flex-end":"flex-start",marginTop:2}}><ReactionBar commentaire={c} userId={user?._id||user?.id} onReact={(cid,type)=>onReact(selected._id,cid,type)}/></div>)}
                    {isMe&&!isEditing&&(<div className="conv-actions" style={{justifyContent:"flex-end"}}><button className="conv-btn-edit" onClick={()=>startEdit(c)}><Ico d={D.edit} size={10}/> Modifier</button><button className="conv-btn-delete" onClick={()=>onDelComment(selected._id,c._id)}><Ico d={D.trash} size={10}/> Supprimer</button></div>)}
                  </div>
                  {!isClient&&(<div className="conv-avatar conv-avatar-agent" style={{background:isMe?"#dbeafe":"#ede9fe",color:isMe?"#1d4ed8":"#6d28d9"}}>{initiales}</div>)}
                </div>
              );
            })}
            <div ref={convBottomRef}/>
          </div>
          {!["closed","cancelled"].includes(selected.statut)&&(<div className="add-comment"><textarea placeholder="Répondre au client... (Entrée pour envoyer)" value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}} className="form-textarea" rows={3}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}><span style={{fontSize:11,color:"#8c959f"}}>Entrée pour envoyer · Shift+Entrée pour nouvelle ligne</span><button className="btn-primary" onClick={handleSend} disabled={sendingComment||!comment.trim()} style={{opacity:sendingComment||!comment.trim()?0.6:1}}>{sendingComment?"Envoi...":"Répondre"}</button></div></div>)}
        </div>
      )}
      {activeTab==="historique"&&(<div style={{paddingTop:16}}><HistoriqueSection ticket={selected}/></div>)}

      {/* ── NOUVEAU : Contenu onglet Analyse IA ── */}
      {activeTab==="ia"&&(
        <IaAnalyseTab ticket={selected}/>
      )}
    </div>
  );
}

function useTicketPage(token, apiUrl) {
  const [tickets,setTickets] = useState([]);
  const [selected,setSelected] = useState(null);
  const [loading,setLoading] = useState(true);
  const [comment,setComment] = useState("");
  const [temps,setTemps] = useState("");
  const [msg,setMsg] = useState("");
  const [err,setErr] = useState("");
  const [notifs,setNotifs] = useState([]);
  const [notifCount,setNotifCount] = useState(0);
  const [showNotifs,setShowNotifs] = useState(false);
  const [workflow,setWorkflow] = useState(null);
  const [filtre,setFiltre] = useState("tous");
  const [showEsc,setShowEsc] = useState(false);
  const [escRaison,setEscRaison] = useState("");
  const [escUrgence,setEscUrgence] = useState("normal");
  const [escErr,setEscErr] = useState("");
  const [lightbox,setLightbox] = useState(null);
  useEffect(()=>{ load(); fetchNotifCount(); fetchWorkflow(); const iv=setInterval(()=>{load();fetchNotifCount();fetchWorkflow();},15000); return ()=>clearInterval(iv); },[]);
  const load = () => { setLoading(true); fetch(apiUrl,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setTickets(d.tickets);}).finally(()=>setLoading(false)); };
  const fetchWorkflow = () => fetch(`${API}/workflow`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setWorkflow(d.workflow);}).catch(()=>{});
  const fetchNotifCount = () => fetch(`${API}/notifications/non-lues`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setNotifCount(d.count);}).catch(()=>{});
  const fetchNotifs = () => fetch(`${API}/notifications`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setNotifs(d.notifications);}).catch(()=>{});
  const toggleNotifs = () => { if(!showNotifs){fetchNotifs();fetch(`${API}/notifications/lire-tout`,{method:"PUT",headers:{Authorization:`Bearer ${token}`}}).then(()=>setNotifCount(0)).catch(()=>{});} setShowNotifs(!showNotifs); };
  const loadDetail = id => fetch(`${API}/tickets/${id}`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setSelected(d.ticket);});
  const checkWF = (de,vers) => { if(!workflow) return null; const t=workflow.transitions.find(t=>t.de===de&&t.vers===vers); if(!t) return null; if(!t.active) return "Cette transition est désactivée."; if(!t.rolesAutorises.includes("support")) return "Non autorisé."; return null; };
  const changeStatut = async (ticketId,statut,currentStatut) => { setMsg(""); setErr(""); const e=checkWF(currentStatut,statut); if(e){setErr(e);return;} const res=await fetch(`${API}/tickets/${ticketId}/statut`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({statut})}); const data=await res.json(); if(data.status==="ok"){const lm={in_progress:"✅ Ticket En cours.",ready_for_customer:"✅ Solution envoyée.",cancelled:"Ticket annulé.",ready_for_support:"↩ Remis en attente."};setMsg(lm[statut]||"Statut mis à jour.");load();if(selected?._id===ticketId)loadDetail(ticketId);setTimeout(()=>setMsg(""),3000);}else setErr(data.msg); };
  const addComment = async id => { if(!comment.trim())return; const res=await fetch(`${API}/tickets/${id}/commentaires`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({contenu:comment})}); const d=await res.json(); if(d.status==="ok"){setComment("");loadDetail(id);load();} };
  const delComment = async (tid,cid) => { if(!window.confirm("Supprimer ce message ?"))return; const res=await fetch(`${API}/tickets/${tid}/commentaires/${cid}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}}); const d=await res.json(); if(d.status==="ok")loadDetail(tid); else alert(d.msg); };
  const editComment = async (tid,cid,contenu) => { const res=await fetch(`${API}/tickets/${tid}/commentaires/${cid}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({contenu})}); const d=await res.json(); if(d.status==="ok")loadDetail(tid); else alert(d.msg); };
  const reactComment = async (tid,cid,type) => { const res=await fetch(`${API}/tickets/${tid}/commentaires/${cid}/reaction`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({type})}); const d=await res.json(); if(d.status==="ok")loadDetail(tid); };
  const saveTime = async id => { if(!temps||isNaN(temps)||temps<=0){setErr("Entrez un nombre de minutes valide.");return;} const res=await fetch(`${API}/tickets/${id}/temps`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({temps:parseInt(temps)})}); const d=await res.json(); if(d.status==="ok"){setMsg("Temps enregistré.");setTemps("");loadDetail(id);setTimeout(()=>setMsg(""),2000);} };
  const confirmEsc = async () => { setEscErr(""); if(!escRaison.trim()){setEscErr("La raison est obligatoire.");return;} const res=await fetch(`${API}/tickets/${selected._id}/escalader`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({raison:escRaison,urgence:escUrgence})}); const data=await res.json(); if(data.status==="ok"){setShowEsc(false);setMsg("Ticket escaladé.");load();loadDetail(selected._id);setTimeout(()=>setMsg(""),3000);}else setEscErr(data.msg); };
  return { tickets,selected,setSelected,loading,comment,setComment,temps,setTemps,msg,setMsg,err,setErr,notifs,notifCount,showNotifs,filtre,setFiltre,showEsc,setShowEsc,escRaison,setEscRaison,escUrgence,setEscUrgence,escErr,lightbox,setLightbox,load,loadDetail,changeStatut,addComment,delComment,editComment,reactComment,saveTime,confirmEsc,toggleNotifs };
}

function ModalEscalade({selected,showEsc,setShowEsc,escRaison,setEscRaison,escUrgence,setEscUrgence,escErr,confirmEsc}) {
  if(!showEsc||!selected) return null;
  return (<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowEsc(false)}><div className="modal-box"><p className="modal-title">Escalader le ticket</p><p className="modal-subtitle">Le chef d'équipe sera notifié immédiatement.</p><div className="escalade-ticket-box"><p className="escalade-ticket-label">Ticket concerné</p><p className="escalade-ticket-titre">{selected.titre}</p></div>{escErr&&<div className="alert alert-error" style={{marginBottom:12}}>{escErr}</div>}<div className="form-group"><label>Raison <span className="req">*</span></label><textarea className="form-textarea" rows={4} value={escRaison} onChange={e=>setEscRaison(e.target.value)} placeholder="Décrivez pourquoi..."/></div><div className="form-group"><label>Niveau d'urgence</label><div className="urgence-grid">{["normal","urgent","critique"].map(u=>(<button key={u} type="button" className={`urgence-btn urgence-${u} ${escUrgence===u?"urgence-active":""}`} onClick={()=>setEscUrgence(u)}>{u==="normal"?"Normal":u==="urgent"?"Urgent":"Critique"}</button>))}</div></div><div className="modal-actions"><button className="btn-cancel" onClick={()=>setShowEsc(false)}>Annuler</button><button className="btn-escalade-confirm" onClick={confirmEsc}>Escalader</button></div></div></div>);
}

function PageHeader({ title, subtitle, notifCount, showNotifs, toggleNotifs, notifs, loadDetail, tickets, onSelectTicket, onSelectClient, token }) {
  const searchRef = useRef(null), debounceRef = useRef(null);
  const [searchQuery,setSQ] = useState(""), [searchOpen,setSO] = useState(false);
  const [searchResults,setSR] = useState([]), [clientResults,setCR] = useState([]), [searchingClients,setSC] = useState(false);
  useEffect(()=>{ const h=e=>{ if(e.key==="Escape"){setSO(false);setSQ("");} if((e.ctrlKey||e.metaKey)&&e.key==="k"){e.preventDefault();setSO(true);setTimeout(()=>searchRef.current?.focus(),50);} }; window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h); },[]);
  useEffect(()=>{
    if(!searchQuery.trim()){setSR([]);setCR([]);return;}
    const q=searchQuery.toLowerCase();
    setSR((tickets||[]).filter(t=>t.titre?.toLowerCase().includes(q)||t._id?.slice(-5).toLowerCase().includes(q)||t.reporter?.prenom?.toLowerCase().includes(q)||t.reporter?.nom?.toLowerCase().includes(q)).slice(0,6));
    clearTimeout(debounceRef.current);
    if(searchQuery.trim().length>=2){setSC(true);debounceRef.current=setTimeout(async()=>{try{const res=await fetch(`${API}/tickets/clients/search?q=${encodeURIComponent(searchQuery.trim())}`,{headers:{Authorization:`Bearer ${token}`}});const d=await res.json();if(d.status==="ok")setCR(d.clients||[]);}catch{}finally{setSC(false);}},400);}else{setCR([]);setSC(false);}
  },[searchQuery,tickets]);
  const hasResults=searchResults.length>0||clientResults.length>0||searchingClients;
  return (
    <div className="page-header">
      <div className="page-header-left"><div className="page-header-title">{title}</div><div className="page-header-subtitle">{subtitle}</div></div>
      <div className="page-header-right">
        <div className="search-wrapper">
          <div className={`search-bar-global ${searchOpen?"search-open":""}`}><Ico d={D.search} size={13}/><input ref={searchRef} type="text" className="search-input-global" placeholder={searchOpen?"Rechercher...":"Rechercher... (Ctrl+K)"} value={searchQuery} onChange={e=>setSQ(e.target.value)} onFocus={()=>setSO(true)}/>{searchQuery&&<button className="search-clear" onClick={()=>{setSQ("");searchRef.current?.focus();}}><Ico d={D.cancel} size={10}/></button>}</div>
          {searchOpen&&searchQuery.trim()&&(<div className="search-dropdown">{clientResults.length>0&&(<>{<div className="search-section-label">{searchingClients?"Recherche clients...":`Clients (${clientResults.length})`}</div>}{clientResults.map(c=>(<div key={c._id} onClick={()=>{onSelectClient(c);setSO(false);setSQ("");}} style={{padding:"8px 12px",borderBottom:"0.5px solid #f0f0f0",cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:28,height:28,borderRadius:"50%",background:"#EAF3DE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:500,color:"#3B6D11",flexShrink:0}}>{`${c.prenom?.[0]||""}${c.nom?.[0]||""}`.toUpperCase()}</div><div style={{flex:1}}><p style={{fontSize:12,fontWeight:500,color:"var(--color-text-primary)",marginBottom:2}}><Highlight text={`${c.prenom} ${c.nom}`} query={searchQuery}/></p><p style={{fontSize:11,color:"var(--color-text-secondary)"}}>{c.email}</p></div></div></div>))}</>)}
          {searchResults.length>0&&(<>{<div className="search-section-label">Tickets ({searchResults.length})</div>}{searchResults.map(t=>(<div key={t._id} className="search-result-item" onClick={()=>{onSelectTicket(t);setSO(false);setSQ("");}}><div className="search-result-left"><span className="search-result-id">{ticketRef(t._id)}</span><div><div className="search-result-title"><Highlight text={t.titre} query={searchQuery}/></div><div className="search-result-meta">{t.reporter?.prenom} {t.reporter?.nom} · {fmtDate(t.createdAt)}</div></div></div><div className="search-result-right"><PrioBadge p={t.priorite}/><TypeBadge t={t.type}/></div></div>))}</>)}
          {!hasResults&&<div className="search-no-results">Aucun résultat pour "{searchQuery}"</div>}</div>)}
          {searchOpen&&<div className="search-overlay" onClick={()=>{setSO(false);setSQ("");}}/>}
        </div>
        <div className="notif-wrapper">
          <button className="notif-btn" onClick={toggleNotifs}><Ico d={D.bell} size={13}/> Notifications{notifCount>0&&<span className="notif-badge">{notifCount}</span>}</button>
          {showNotifs&&(<div className="notif-dropdown"><p className="notif-header">Notifications</p>{notifs.length===0?<p className="notif-empty">Aucune notification</p>:notifs.map(n=>(<div key={n._id} className={`notif-item ${n.lu?"":"notif-unread"}`} onClick={()=>{if(n.ticket)loadDetail(n.ticket._id);}}><p className="notif-msg">{n.message}</p><p className="notif-date">{fmtDate(n.createdAt)}</p></div>))}</div>)}
        </div>
      </div>
    </div>
  );
}

function ClientFilterBanner({ client, onClear }) {
  if (!client) return null;
  return (<div style={{display:"flex",alignItems:"center",gap:10,background:"#EAF3DE",border:"0.5px solid #c0dd97",borderRadius:8,padding:"8px 14px",marginBottom:12}}><div style={{width:28,height:28,borderRadius:"50%",background:"#3B6D11",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:500,color:"#fff",flexShrink:0}}>{`${client.prenom?.[0]||""}${client.nom?.[0]||""}`.toUpperCase()}</div><div><p style={{fontSize:12,fontWeight:500,color:"#3B6D11"}}>Tickets de {client.prenom} {client.nom}</p><p style={{fontSize:11,color:"#639922"}}>{client.email}</p></div><button onClick={onClear} style={{marginLeft:"auto",background:"none",border:"0.5px solid #3B6D11",borderRadius:6,fontSize:11,color:"#3B6D11",cursor:"pointer",padding:"3px 10px"}}>✕ Voir tous</button></div>);
}

function KanbanCard({ t, onClick, showAssignee=false, isMyTicket=false, canDrag=false, onDragStart, onDragEnd, isDragging=false }) {
  return (
    <div className="kanban-card" draggable={canDrag} onDragStart={canDrag?onDragStart:undefined} onDragEnd={canDrag?onDragEnd:undefined} onClick={onClick}
      style={{ borderLeft:t.slaBreached?"3px solid #E24B4A":t.slaPourcentage>=75?"3px solid #EF9F27":"none", opacity:isDragging?0.3:1, cursor:canDrag?"grab":"pointer", transition:"opacity 0.2s", userSelect:"none" }}>
      {canDrag&&(<div style={{fontSize:10,color:"#b0b8c8",marginBottom:4,display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:13,lineHeight:1,letterSpacing:1}}>⠿</span><span>Glisser pour déplacer</span></div>)}
      <div className="kanban-card-top"><span className="kanban-card-id">{ticketRef(t._id)}</span><PrioBadge p={t.priorite}/></div>
      <p className="kanban-card-titre">{t.titre}</p>
      <div className="kanban-card-tags"><TypeBadge t={t.type}/>{t.fichiers?.length>0&&<span className="kanban-card-attachment">📎 {t.fichiers.length}</span>}</div>
      {!["solved","closed","cancelled"].includes(t.statut)&&<SlaMiniBar ticket={t}/>}
      <div className="kanban-card-footer">
        <span className="kanban-card-date">{fmtDate(t.createdAt)}</span>
        {showAssignee?(t.assignee?<div className="kanban-card-avatar" style={{background:isMyTicket?"#2563eb":"#7c3aed"}}>{initials(t.assignee.prenom,t.assignee.nom)}</div>:<span style={{fontSize:10,color:"#b91c1c",background:"#fef2f2",padding:"1px 6px",borderRadius:4,border:"1px solid #fecaca"}}>Non assigné</span>):(<div className="kanban-card-avatar">{initials(t.reporter?.prenom,t.reporter?.nom)}</div>)}
      </div>
    </div>
  );
}

function KanbanBoard({ cols, ticketsFiltres, filtre, onCardClick, onDrop, showAssignee=false, userId="" }) {
  const draggingRef = useRef(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [dragTick, setDragTick] = useState(null);
  const handleDragStart = ticket => e => { draggingRef.current=ticket; setDragTick(ticket._id); e.dataTransfer.effectAllowed="move"; e.dataTransfer.setData("text/plain",ticket._id); };
  const handleDragEnd = () => { draggingRef.current=null; setDragTick(null); setDragOverCol(null); };
  const handleDragOver = targetStatut => e => { const drag=draggingRef.current; if(!drag) return; if(!DRAG_ALLOWED[drag.statut]?.includes(targetStatut)) return; e.preventDefault(); e.dataTransfer.dropEffect="move"; setDragOverCol(targetStatut); };
  const handleDragLeave = targetStatut => e => { if(e.currentTarget.contains(e.relatedTarget)) return; setDragOverCol(prev=>prev===targetStatut?null:prev); };
  const handleDrop = targetStatut => e => { e.preventDefault(); const drag=draggingRef.current; draggingRef.current=null; setDragTick(null); setDragOverCol(null); if(!drag||drag.statut===targetStatut) return; if(!DRAG_ALLOWED[drag.statut]?.includes(targetStatut)) return; onDrop(drag,targetStatut); };
  return (
    <div className="kanban-board">
      {cols.map(col=>{
        const ct=filtre==="sla"?ticketsFiltres.filter(t=>t.statut===col.statut&&t.slaBreached):ticketsFiltres.filter(t=>t.statut===col.statut);
        const drag=draggingRef.current, canReceive=drag&&DRAG_ALLOWED[drag.statut]?.includes(col.statut), isOver=dragOverCol===col.statut&&canReceive, isSource=drag&&col.statut===drag.statut, isBlocked=drag&&!canReceive&&!isSource;
        return (
          <div key={col.statut} className={`kanban-col ${col.cls}`} onDragOver={handleDragOver(col.statut)} onDragLeave={handleDragLeave(col.statut)} onDrop={handleDrop(col.statut)}
            style={{ borderTop:`2.5px solid ${col.accent}`, outline:isOver?`2px dashed ${col.accent}`:"none", background:isOver?`${col.accent}12`:undefined, transition:"background 0.15s, outline 0.15s", borderRadius:isOver?10:undefined }}>
            <div className="kanban-col-header"><span className="kanban-col-title">{col.label}</span><span className="kanban-col-count">{ct.length}</span></div>
            {isOver&&(<div style={{margin:"6px 0 2px",padding:"10px 0",border:`2px dashed ${col.accent}`,borderRadius:8,textAlign:"center",fontSize:12,color:col.accent,fontWeight:600,background:"rgba(255,255,255,0.9)"}}>↓ Déposer ici</div>)}
            {isBlocked&&drag&&(<div style={{margin:"4px 0",padding:"6px",textAlign:"center",fontSize:11,color:"#9ca3af",opacity:0.7}}>🚫 Non autorisé</div>)}
            <div className="kanban-col-body">
              {ct.length===0&&!isOver?(<div className="kanban-empty">Aucun ticket</div>):ct.map(t=>{
                const canDrag=!!DRAG_ALLOWED[t.statut]?.length&&checkIsMine(t,userId);
                return <KanbanCard key={t._id} t={t} onClick={()=>{if(!draggingRef.current)onCardClick(t);}} showAssignee={showAssignee} isMyTicket={checkIsMine(t,userId)} canDrag={canDrag} isDragging={dragTick===t._id} onDragStart={handleDragStart(t)} onDragEnd={handleDragEnd}/>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MesTicketsPage({ user, token, allTickets }) {
  const state = useTicketPage(token, `${API}/tickets/assignes`);
  const { tickets,selected,setSelected,loading,comment,setComment,temps,setTemps,msg,setMsg,err,setErr,notifs,notifCount,showNotifs,filtre,setFiltre,showEsc,setShowEsc,escRaison,setEscRaison,escUrgence,setEscUrgence,escErr,lightbox,setLightbox,load,loadDetail,changeStatut,addComment,delComment,editComment,reactComment,saveTime,confirmEsc,toggleNotifs } = state;
  const [filtreClient,setFiltreClient] = useState(null);
  const [dragMsg,setDragMsg] = useState("");
  const handleSelectClient = c => { setFiltreClient(c); setSelected(null); setFiltre("tous"); setMsg(""); setErr(""); };
  const ticketsFiltres = filtreClient ? tickets.filter(t=>String(t.reporter?._id||t.reporter)===String(filtreClient._id)) : tickets;
  const stepClick = (step,idx) => { if(!selected) return; if(selected.statut==="ready_for_support"&&idx===1) changeStatut(selected._id,"in_progress","ready_for_support"); else if(selected.statut==="in_progress"&&idx===2) changeStatut(selected._id,"ready_for_customer","in_progress"); };
  const stats = { total:ticketsFiltres.length, prog:ticketsFiltres.filter(t=>t.statut==="in_progress").length, wait:ticketsFiltres.filter(t=>t.statut==="ready_for_support").length, done:ticketsFiltres.filter(t=>["solved","closed"].includes(t.statut)).length, slaBreached:ticketsFiltres.filter(t=>t.slaBreached===true).length };
  const cols = filtre==="tous"?COLS:filtre==="in_progress"?COLS.filter(c=>c.statut==="in_progress"):filtre==="ready_for_support"?COLS.filter(c=>c.statut==="ready_for_support"):filtre==="resolus"?COLS.filter(c=>c.statut==="solved"):filtre==="sla"?COLS.filter(c=>["in_progress","ready_for_support"].includes(c.statut)):COLS;
  const handleSelectFromSearch = t => { setSelected(t); loadDetail(t._id); setMsg(""); setErr(""); };
  const handleDrop = async (ticket, targetStatut) => { await changeStatut(ticket._id, targetStatut, ticket.statut); const msgs={in_progress:"✅ Ticket passé En cours.",ready_for_customer:"✅ Solution envoyée.",ready_for_support:"↩ Remis en attente."};setDragMsg(msgs[targetStatut]||"Statut mis à jour.");setTimeout(()=>setDragMsg(""),3000); };
  return (
    <>
      {lightbox&&(<div className="lightbox-overlay" onClick={()=>setLightbox(null)}><button className="lightbox-close" onClick={()=>setLightbox(null)}>✕</button>{lightbox.type==="image"?<img src={lightbox.src} alt="preview" className="lightbox-img" onClick={e=>e.stopPropagation()}/>:<video src={lightbox.src} controls autoPlay className="lightbox-video" onClick={e=>e.stopPropagation()}/>}</div>)}
      <ModalEscalade selected={selected} showEsc={showEsc} setShowEsc={setShowEsc} escRaison={escRaison} setEscRaison={setEscRaison} escUrgence={escUrgence} setEscUrgence={setEscUrgence} escErr={escErr} confirmEsc={confirmEsc}/>
      <PageHeader title="Mes tickets" subtitle={`${filtreClient?ticketsFiltres.length:tickets.length} tickets assignés · Actualisé à ${lastUpdate()}`} notifCount={notifCount} showNotifs={showNotifs} toggleNotifs={toggleNotifs} notifs={notifs} loadDetail={loadDetail} tickets={tickets} onSelectTicket={handleSelectFromSearch} onSelectClient={handleSelectClient} token={token}/>
      <div className="sp-content">
        {!selected&&<ClientFilterBanner client={filtreClient} onClear={()=>setFiltreClient(null)}/>}
        <div className="stats-grid" style={{gridTemplateColumns:"repeat(5,1fr)"}}>
          {[{label:"Total",val:stats.total,key:"tous",cls:"stat-total"},{label:"En cours",val:stats.prog,key:"in_progress",cls:"stat-progress"},{label:"En attente",val:stats.wait,key:"ready_for_support",cls:"stat-waiting"},{label:"Résolus",val:stats.done,key:"resolus",cls:"stat-solved"},{label:"SLA dépassés",val:stats.slaBreached,key:"sla",cls:"stat-sla"}].map(s=>(
            <div key={s.key} className={`stat-card ${s.cls} ${filtre===s.key?"stat-active":""}`} style={s.key==="sla"&&stats.slaBreached>0?{borderColor:"#E24B4A",background:"#fff8f8"}:{}} onClick={()=>{setFiltre(s.key);setSelected(null);}}>
              <span className="stat-number" style={s.key==="sla"&&stats.slaBreached>0?{color:"#E24B4A"}:{}}>{s.val}</span>
              <span className="stat-label" style={s.key==="sla"&&stats.slaBreached>0?{color:"#A32D2D",fontWeight:500}:{}}>{s.label}</span>
            </div>
          ))}
        </div>
        {dragMsg&&<div className="alert alert-success" style={{marginBottom:8}}>{dragMsg}</div>}
        {!selected&&(<div className="kanban-wrapper">{loading?<div className="loading">Chargement...</div>:(<><KanbanBoard cols={cols} ticketsFiltres={ticketsFiltres} filtre={filtre} onCardClick={t=>{setSelected(t);loadDetail(t._id);setMsg("");setErr("");}} onDrop={handleDrop} showAssignee={false} userId={user?._id||user?.id}/></>)}</div>)}
        {selected&&(<TicketDetail selected={selected} user={user} isMine={true} msg={msg} err={err} comment={comment} temps={temps} lightbox={lightbox} setLightbox={setLightbox} setComment={setComment} setTemps={setTemps} setMsg={setMsg} setErr={setErr} setSelected={setSelected} onChangeStatut={(id,statut)=>changeStatut(id,statut,selected.statut)} onPrendre={null} onStepClick={stepClick} onAddComment={addComment} onDelComment={delComment} onEditComment={editComment} onReact={reactComment} onSaveTime={saveTime} onEscalade={()=>{setEscRaison("");setEscUrgence("normal");setShowEsc(true);}}/>)}
      </div>
    </>
  );
}

function TicketsEquipePage({ user, token }) {
  const state = useTicketPage(token, `${API}/tickets/equipe`);
  const { tickets,selected,setSelected,loading,comment,setComment,temps,setTemps,msg,setMsg,err,setErr,notifs,notifCount,showNotifs,filtre,setFiltre,showEsc,setShowEsc,escRaison,setEscRaison,escUrgence,setEscUrgence,escErr,lightbox,setLightbox,load,loadDetail,changeStatut,addComment,delComment,editComment,reactComment,saveTime,confirmEsc,toggleNotifs } = state;
  const tookChargeRef = useRef(null);
  const isMineFromServer = checkIsMine(selected,user?._id||user?.id);
  const isMine = isMineFromServer||(tookChargeRef.current===selected?._id);
  const [filtreClient,setFiltreClient] = useState(null);
  const [dragMsg,setDragMsg] = useState("");
  const handleSelectClient = c => { setFiltreClient(c); tookChargeRef.current=null; setSelected(null); setFiltre("tous"); setMsg(""); setErr(""); };
  const ticketsFiltres = filtreClient ? tickets.filter(t=>String(t.reporter?._id||t.reporter)===String(filtreClient._id)) : tickets;
  const prendreTicket = async ticketId => { setMsg(""); setErr(""); const res=await fetch(`${API}/tickets/${ticketId}/prendre`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`}}); const data=await res.json(); if(data.status==="ok"){tookChargeRef.current=ticketId;setMsg("✅ Ticket pris en charge !");load();loadDetail(ticketId);setTimeout(()=>setMsg(""),3000);}else setErr(data.msg); };
  const handleSetSelected = val => { if(!val||String(val?._id)!==String(tookChargeRef.current)) tookChargeRef.current=null; setSelected(val); };
  const stepClick = (step,idx) => { if(!selected) return; if(selected.statut==="ready_for_support"&&idx===1) changeStatut(selected._id,"in_progress","ready_for_support"); else if(selected.statut==="in_progress"&&idx===2) changeStatut(selected._id,"ready_for_customer","in_progress"); };
  const stats = { total:ticketsFiltres.length, nonAssigns:ticketsFiltres.filter(t=>!t.assignee).length, prog:ticketsFiltres.filter(t=>t.statut==="in_progress").length, done:ticketsFiltres.filter(t=>["solved","closed"].includes(t.statut)).length, slaBreached:ticketsFiltres.filter(t=>t.slaBreached===true).length };
  const cols = filtre==="tous"?COLS:filtre==="in_progress"?COLS.filter(c=>c.statut==="in_progress"):filtre==="ready_for_support"?COLS.filter(c=>c.statut==="ready_for_support"):filtre==="resolus"?COLS.filter(c=>c.statut==="solved"):filtre==="sla"?COLS.filter(c=>["in_progress","ready_for_support"].includes(c.statut)):COLS;
  const handleSelectFromSearch = t => { handleSetSelected(t); loadDetail(t._id); setMsg(""); setErr(""); };
  const handleDrop = async (ticket, targetStatut) => { if(!checkIsMine(ticket,user?._id||user?.id)) return; await changeStatut(ticket._id,targetStatut,ticket.statut); const msgs={in_progress:"✅ Ticket passé En cours.",ready_for_customer:"✅ Solution envoyée.",ready_for_support:"↩ Remis en attente."};setDragMsg(msgs[targetStatut]||"Statut mis à jour.");setTimeout(()=>setDragMsg(""),3000); };
  return (
    <>
      {lightbox&&(<div className="lightbox-overlay" onClick={()=>setLightbox(null)}><button className="lightbox-close" onClick={()=>setLightbox(null)}>✕</button>{lightbox.type==="image"?<img src={lightbox.src} alt="preview" className="lightbox-img" onClick={e=>e.stopPropagation()}/>:<video src={lightbox.src} controls autoPlay className="lightbox-video" onClick={e=>e.stopPropagation()}/>}</div>)}
      <ModalEscalade selected={selected} showEsc={showEsc} setShowEsc={setShowEsc} escRaison={escRaison} setEscRaison={setEscRaison} escUrgence={escUrgence} setEscUrgence={setEscUrgence} escErr={escErr} confirmEsc={confirmEsc}/>
      <PageHeader title="Tickets de l'équipe" subtitle={`${filtreClient?ticketsFiltres.length:tickets.length} tickets au total · Actualisé à ${lastUpdate()}`} notifCount={notifCount} showNotifs={showNotifs} toggleNotifs={toggleNotifs} notifs={notifs} loadDetail={loadDetail} tickets={tickets} onSelectTicket={handleSelectFromSearch} onSelectClient={handleSelectClient} token={token}/>
      <div className="sp-content">
        {!selected&&<ClientFilterBanner client={filtreClient} onClear={()=>setFiltreClient(null)}/>}
        <div className="stats-grid" style={{gridTemplateColumns:"repeat(5,1fr)"}}>
          {[{label:"Total équipe",val:stats.total,key:"tous",cls:"stat-total"},{label:"Non assignés",val:stats.nonAssigns,key:"ready_for_support",cls:"stat-waiting"},{label:"En cours",val:stats.prog,key:"in_progress",cls:"stat-progress"},{label:"Résolus",val:stats.done,key:"resolus",cls:"stat-solved"},{label:"SLA dépassés",val:stats.slaBreached,key:"sla",cls:"stat-sla"}].map(s=>(
            <div key={s.key} className={`stat-card ${s.cls} ${filtre===s.key?"stat-active":""}`} style={s.key==="sla"&&stats.slaBreached>0?{borderColor:"#E24B4A",background:"#fff8f8"}:{}} onClick={()=>{setFiltre(s.key);handleSetSelected(null);}}>
              <span className="stat-number" style={s.key==="sla"&&stats.slaBreached>0?{color:"#E24B4A"}:{}}>{s.val}</span>
              <span className="stat-label" style={s.key==="sla"&&stats.slaBreached>0?{color:"#A32D2D",fontWeight:500}:{}}>{s.label}</span>
            </div>
          ))}
        </div>
        {dragMsg&&<div className="alert alert-success" style={{marginBottom:8}}>{dragMsg}</div>}
        {!selected&&(<div className="kanban-wrapper">{loading?<div className="loading">Chargement...</div>:(<KanbanBoard cols={cols} ticketsFiltres={ticketsFiltres} filtre={filtre} onCardClick={t=>{handleSetSelected(t);loadDetail(t._id);setMsg("");setErr("");}} onDrop={handleDrop} showAssignee={true} userId={user?._id||user?.id}/>)}</div>)}
        {selected&&(<TicketDetail selected={selected} user={user} isMine={isMine} msg={msg} err={err} comment={comment} temps={temps} lightbox={lightbox} setLightbox={setLightbox} setComment={setComment} setTemps={setTemps} setMsg={setMsg} setErr={setErr} setSelected={handleSetSelected} onChangeStatut={(id,statut)=>changeStatut(id,statut,selected.statut)} onPrendre={prendreTicket} onStepClick={stepClick} onAddComment={addComment} onDelComment={delComment} onEditComment={editComment} onReact={reactComment} onSaveTime={saveTime} onEscalade={()=>{setEscRaison("");setEscUrgence("normal");setShowEsc(true);}}/>)}
      </div>
    </>
  );
}

export default function SupportDashboard() {
  const navigate = useNavigate();
  const user=getUser(), token=getToken();
  const [activePage,setActivePage] = useState("dashboard");
  const [countMes,setCountMes] = useState(0);
  const [countEquipe,setCountEquipe] = useState(0);
  const [allTickets,setAllTickets] = useState([]);
  const [bgColor, setBgColor] = useState(() => localStorage.getItem("dashboard_bg") || "#f6f8fa");

  useEffect(() => {
    localStorage.setItem("dashboard_bg", bgColor);
  }, [bgColor]);

  useEffect(()=>{
    if(!token||!user||user.role!=="support"){navigate("/login-personnel");return;}
    loadCounts();
    const iv=setInterval(loadCounts,15000);
    return ()=>clearInterval(iv);
  },[]);

  const loadCounts = () => {
    fetch(`${API}/tickets/assignes`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok"){setCountMes(d.tickets.length);setAllTickets(d.tickets);}}).catch(()=>{});
    fetch(`${API}/tickets/equipe`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setCountEquipe(d.tickets.length);}).catch(()=>{});
  };

  const logout = () => { localStorage.clear(); sessionStorage.clear(); navigate("/login-personnel"); };

  return (
    <div className="sp-layout" style={{ background:bgColor }}>
      <aside className="sp-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><Ico d={D.devapp} size={14}/></div>
          <span className="sidebar-brand-name">DevApp</span>
        </div>
        <nav className="sidebar-nav">
          <span className="nav-section-label">Support</span>
          <button className={`nav-item ${activePage==="mes-tickets"?"active":""}`} onClick={()=>setActivePage("mes-tickets")}>
            <Ico d={D.ticket} size={14}/> Mes tickets <span className="nav-badge">{countMes}</span>
          </button>
          <button className={`nav-item ${activePage==="dashboard"?"active":""}`} onClick={()=>setActivePage("dashboard")}>
            <Ico d={D.dashboard} size={14}/> Mon dashboard
          </button>
          <button className={`nav-item ${activePage==="tickets-equipe"?"active":""}`} onClick={()=>setActivePage("tickets-equipe")}>
            <Ico d={D.team} size={14}/> Tickets équipe <span className="nav-badge">{countEquipe}</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{user?.prenom?.[0]}{user?.nom?.[0]}</div>
            <div className="user-info">
              <span className="user-name">{user?.prenom} {user?.nom}</span>
              <span className="user-role">Agent support</span>
            </div>
            <button className="btn-logout" onClick={logout} title="Déconnexion"><Ico d={D.logout} size={13}/></button>
          </div>
        </div>
      </aside>

      <main className="sp-main">
        {activePage==="dashboard" && (
          <AgentDashboard tickets={allTickets} user={user} bgColor={bgColor} setBgColor={setBgColor}/>
        )}
        {activePage==="mes-tickets" && (
          <MesTicketsPage user={user} token={token} allTickets={allTickets}/>
        )}
        {activePage==="tickets-equipe" && (
          <TicketsEquipePage user={user} token={token}/>
        )}
      </main>
    </div>
  );
}