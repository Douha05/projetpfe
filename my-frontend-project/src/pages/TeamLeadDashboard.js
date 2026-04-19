import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import "./TeamLeadDashboard.css";

const API = "http://localhost:3001/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const getUser  = () => { const u = localStorage.getItem("user") || sessionStorage.getItem("user"); return u ? JSON.parse(u) : null; };

const fmtDate   = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime   = (d) => new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const ticketRef = (id) => id ? `#${id.slice(-6).toUpperCase()}` : "";
const initials  = (p, n) => `${p?.[0] || ""}${n?.[0] || ""}`.toUpperCase();
const now       = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const Ico = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <path fillRule="evenodd" d={d} />
  </svg>
);

/* ── SVG icons paths ─────────────────────────────────────── */
const D = {
  overview:  "M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146z",
  tickets:   "M1.5 3.5A1.5 1.5 0 0 1 3 2h9.982a1.5 1.5 0 0 1 1.498 1.5v2.5a.5.5 0 0 1-.5.5 1 1 0 0 0 0 2 .5.5 0 0 1 .5.5v2.5A1.5 1.5 0 0 1 12.982 13H3A1.5 1.5 0 0 1 1.5 11.5V8a.5.5 0 0 1 .5-.5 1 1 0 1 0 0-2 .5.5 0 0 1-.5-.5V3.5z",
  agents:    "M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  clients:   "M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  create:    "M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16zM8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z",
  suivi:     "M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383-4.708 2.825L15 11.105V5.383zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741zM1 11.105l4.708-2.897L1 5.383v5.722z",
  logout:    "M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2zM15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z",
  brand:     "M1.5 3.5A1.5 1.5 0 0 1 3 2h9.982a1.5 1.5 0 0 1 1.498 1.5v2.5a.5.5 0 0 1-.5.5 1 1 0 0 0 0 2 .5.5 0 0 1 .5.5v2.5A1.5 1.5 0 0 1 12.982 13H3A1.5 1.5 0 0 1 1.5 11.5V8a.5.5 0 0 1 .5-.5 1 1 0 1 0 0-2 .5.5 0 0 1-.5-.5V3.5z",
  bell:      "M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.491-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.921L8 1.918zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z",
  analytics: "M2 11h2v2H2v-2zm3-4h2v6H5V7zm3-4h2v10H8V3zm3 7h2v3h-2v-3zM1 1v13h13V1H1zm0-1h13a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V1a1 1 0 0 1 1-1z",
  ia:        "M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1a6 6 0 1 1 0 12A6 6 0 0 1 8 2zm0 2.5a.5.5 0 0 1 .5.5v2.5H11a.5.5 0 0 1 0 1H8.5V11a.5.5 0 0 1-1 0V8.5H5a.5.5 0 0 1 0-1h2.5V5a.5.5 0 0 1 .5-.5z",
  check:     "M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z",
  x:         "M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z",
  calendar:  "M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z",
  cpu:       "M5 0a.5.5 0 0 1 .5.5V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2A2.5 2.5 0 0 1 14 4.5h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14A2.5 2.5 0 0 1 11.5 14v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14A2.5 2.5 0 0 1 2 11.5H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2A2.5 2.5 0 0 1 4.5 2V.5A.5.5 0 0 1 5 0zm-.5 3A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 11.5 3h-7zM5 6.5A1.5 1.5 0 0 1 6.5 5h3A1.5 1.5 0 0 1 11 6.5v3A1.5 1.5 0 0 1 9.5 11h-3A1.5 1.5 0 0 1 5 9.5v-3z",
  lightning: "M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z",
  star:      "M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.950l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.950l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z",
  person:    "M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.029 10 8 10c-2.029 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z",
  chart:     "M0 0h1v15h15v1H0V0zm14.5 3a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0V5.707L7.354 11.354a.5.5 0 0 1-.708 0L5 9.707l-3.646 3.647a.5.5 0 0 1-.708-.708l4-4a.5.5 0 0 1 .708 0L7 10.293l6.646-6.647a.5.5 0 0 1 .854.354z",
  tag:       "M2 1a1 1 0 0 0-1 1v4.586a1 1 0 0 0 .293.707l7 7a1 1 0 0 0 1.414 0l4.586-4.586a1 1 0 0 0 0-1.414l-7-7A1 1 0 0 0 6.586 1H2zm4 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z",
  chat:      "M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z",
  info:      "M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z",
};

const NAV_ITEMS = [
  { id: "overview",     label: "Vue d'ensemble",  icon: D.overview  },
  { id: "tickets",      label: "Tous les tickets", icon: D.tickets   },
  { id: "agents",       label: "Agents support",   icon: D.agents    },
  { id: "clients",      label: "Clients",          icon: D.clients   },
  { id: "suivi",        label: "Suivi clients",    icon: D.suivi     },
  { id: "analytics",    label: "Analytiques",      icon: D.analytics },
  { id: "ia",           label: "Analyse IA",       icon: D.ia        },
  { id: "creer-client", label: "Créer client",     icon: D.create    },
];

const PRIO_MAP = {
  low:      { label: "Faible",   bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  medium:   { label: "Moyen",    bg: "#fefce8", color: "#a16207", border: "#fde68a" },
  high:     { label: "Haute",    bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  critical: { label: "Critique", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
};
const STATUT_MAP = {
  ready_for_support:  { label: "À faire",     bg: "#fefce8", color: "#a16207" },
  in_progress:        { label: "En cours",    bg: "#eff6ff", color: "#1d4ed8" },
  ready_for_customer: { label: "À confirmer", bg: "#f5f3ff", color: "#6d28d9" },
  solved:             { label: "Résolu",      bg: "#f0fdf4", color: "#15803d" },
  closed:             { label: "Fermé",       bg: "#f9fafb", color: "#6b7280" },
  cancelled:          { label: "Annulé",      bg: "#f9fafb", color: "#6b7280" },
  escalated:          { label: "Escaladé",    bg: "#fef2f2", color: "#b91c1c" },
};
const PRIO_LABELS = { low: "Faible", medium: "Moyen", high: "Haute", critical: "Critique" };
const PRIO_COLORS = { low: "#16a34a", medium: "#d97706", high: "#ea580c", critical: "#dc2626" };
const PALETTE     = ["#2563eb","#16a34a","#dc2626","#d97706","#7c3aed","#0891b2","#db2777","#65a30d","#ea580c","#059669","#9333ea","#374151","#0284c7","#b91c1c","#c2410c","#f59e0b"];

const PrioBadge   = ({ p }) => { const c = PRIO_MAP[p] || PRIO_MAP.medium; return <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 6 }}>{c.label}</span>; };
const StatutBadge = ({ s }) => { const m = STATUT_MAP[s] || { label: s, bg: "#f9fafb", color: "#6b7280" }; return <span style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 6 }}>{m.label}</span>; };

const KANBAN_COLS = [
  { statut: "ready_for_support",  label: "À faire",     accent: "#d97706", countBg: "#fefce8", countColor: "#a16207" },
  { statut: "in_progress",        label: "En cours",    accent: "#2563eb", countBg: "#eff6ff", countColor: "#1d4ed8" },
  { statut: "ready_for_customer", label: "À confirmer", accent: "#7c3aed", countBg: "#f5f3ff", countColor: "#6d28d9" },
  { statut: "escalated",          label: "Escaladé",    accent: "#dc2626", countBg: "#fef2f2", countColor: "#b91c1c" },
  { statut: "solved",             label: "Résolu",      accent: "#16a34a", countBg: "#f0fdf4", countColor: "#15803d" },
];
const ticketProgress = (s) => ({ ready_for_support:0, in_progress:33, ready_for_customer:66, solved:100, closed:100, cancelled:0, escalated:20 }[s]??0);
const progressColor  = (p) => p===100?"#16a34a":p>=66?"#7c3aed":p>=33?"#2563eb":"#d97706";

const HIST_CONFIG = {
  ticket_created: {label:"Ticket créé",bg:"#EAF3DE",border:"#C0DD97",color:"#3B6D11",dotBg:"#EAF3DE",dotBorder:"#C0DD97"},
  auto_assigned:  {label:"Assigné automatiquement",bg:"#EEEDFE",border:"#AFA9EC",color:"#534AB7",dotBg:"#EEEDFE",dotBorder:"#AFA9EC"},
  statut_change:  {label:"Changement de statut",bg:"#E6F1FB",border:"#B5D4F4",color:"#0C447C",dotBg:"#E6F1FB",dotBorder:"#B5D4F4"},
  comment_added:  {label:"Message échangé",bg:"#FAEEDA",border:"#FAC775",color:"#854F0B",dotBg:"#FAEEDA",dotBorder:"#FAC775"},
  escalated:      {label:"Ticket escaladé",bg:"#FCEBEB",border:"#F7C1C1",color:"#A32D2D",dotBg:"#FCEBEB",dotBorder:"#F7C1C1"},
  solved:         {label:"Ticket résolu",bg:"#EAF3DE",border:"#C0DD97",color:"#3B6D11",dotBg:"#EAF3DE",dotBorder:"#C0DD97"},
  default:        {label:"Action",bg:"#E6F1FB",border:"#B5D4F4",color:"#0C447C",dotBg:"#E6F1FB",dotBorder:"#B5D4F4"},
};

/* ── ColorPicker ────────────────────────────────────────── */
function ColorPicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top:0, left:0 });
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const t = setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h); };
  }, [open]);
  const handleClick = (e) => {
    e.stopPropagation(); e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    const left = Math.min(r.right - 172, window.innerWidth - 180);
    setPos({ top: r.bottom + 6, left: Math.max(8, left) });
    setOpen(o => !o);
  };
  const dropdown = (
    <div onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}
      style={{position:"fixed",top:pos.top,left:pos.left,zIndex:999999,background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"12px",boxShadow:"0 16px 40px rgba(0,0,0,.22)",width:172}}>
      <p style={{fontSize:10,color:"#64748b",margin:"0 0 8px",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>{label}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5,marginBottom:8}}>
        {PALETTE.map(c=><button key={c} type="button" onClick={e=>{e.stopPropagation();onChange(c);setOpen(false);}} style={{width:24,height:24,borderRadius:5,background:c,padding:0,cursor:"pointer",border:value===c?"3px solid #0f172a":"2px solid transparent"}}/>)}
      </div>
      <div style={{borderTop:"1px solid #f1f5f9",paddingTop:8}}>
        <input type="color" value={value} onChange={e=>onChange(e.target.value)} onMouseDown={e=>e.stopPropagation()}
          style={{width:"100%",height:28,border:"1px solid #e2e8f0",borderRadius:6,cursor:"pointer",padding:2}}/>
      </div>
    </div>
  );
  return (
    <div ref={ref} style={{position:"relative",display:"inline-flex",alignItems:"center",flexShrink:0}}>
      <button type="button" onClick={handleClick}
        style={{width:16,height:16,borderRadius:4,background:value,border:"2px solid rgba(0,0,0,0.2)",cursor:"pointer",padding:0,outline:"none"}}/>
      {open && ReactDOM.createPortal(dropdown, document.body)}
    </div>
  );
}

/* ── BgPanel ────────────────────────────────────────────── */
const BG_PRE   = [{label:"Blanc",value:"#f6f8fa"},{label:"Ardoise",value:"#f1f5f9"},{label:"Bleu pâle",value:"#eff6ff"},{label:"Vert pâle",value:"#f0fdf4"},{label:"Violet pâle",value:"#f5f3ff"},{label:"Ambre",value:"#fffbeb"},{label:"Perle",value:"#e2e8f0"},{label:"Lavande",value:"#e0e7ff"},{label:"Gris foncé",value:"#334155"},{label:"Marine",value:"#0f172a"},{label:"Indigo",value:"#1e1b4b"},{label:"Noir",value:"#09090b"}];
const TEXT_PRE = [{label:"Noir",value:"#111827"},{label:"Gris foncé",value:"#374151"},{label:"Ardoise",value:"#475569"},{label:"Blanc",value:"#ffffff"},{label:"Gris clair",value:"#e5e7eb"},{label:"Bleu",value:"#1d4ed8"},{label:"Vert",value:"#15803d"},{label:"Violet",value:"#6d28d9"},{label:"Rouge",value:"#b91c1c"},{label:"Orange",value:"#c2410c"},{label:"Indigo",value:"#3730a3"},{label:"Teal",value:"#0f766e"}];
const CARD_PRE = [{label:"Blanc",value:"#ffffff"},{label:"Gris clair",value:"#f9fafb"},{label:"Bleu clair",value:"#eff6ff"},{label:"Vert clair",value:"#f0fdf4"},{label:"Violet clair",value:"#f5f3ff"},{label:"Ambre clair",value:"#fffbeb"},{label:"Perle",value:"#f1f5f9"},{label:"Rose clair",value:"#fff1f2"},{label:"Gris moyen",value:"#e2e8f0"},{label:"Ardoise foncé",value:"#1e293b"},{label:"Gris foncé",value:"#1f2937"},{label:"Noir",value:"#111827"}];

function BgPanel({ bg, onChangeBg, textColor, onChangeText, cardColor, onChangeCard, onClose }) {
  const [activeTab, setActiveTab] = useState("bg");
  const presets  = activeTab==="bg"?BG_PRE:activeTab==="text"?TEXT_PRE:CARD_PRE;
  const cur      = activeTab==="bg"?bg:activeTab==="text"?textColor:cardColor;
  const onChange = activeTab==="bg"?onChangeBg:activeTab==="text"?onChangeText:onChangeCard;
  return (
    <div style={{position:"fixed",inset:0,zIndex:8000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#fff",borderRadius:16,width:520,maxWidth:"92vw",maxHeight:"88vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,.22)",overflow:"hidden"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:15,fontWeight:600,color:"#111827"}}>Apparence du tableau de bord</span>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:"#9ca3af"}}>×</button>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid #f1f5f9",background:"#f9fafb"}}>
          {[{id:"bg",label:"Fond de page"},{id:"text",label:"Couleur texte"},{id:"card",label:"Fond des cartes"}].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{flex:1,padding:"11px 8px",border:"none",background:"none",fontSize:12,fontWeight:activeTab===t.id?600:400,color:activeTab===t.id?"#2563eb":"#6b7280",borderBottom:activeTab===t.id?"2px solid #2563eb":"2px solid transparent",cursor:"pointer"}}>{t.label}</button>
          ))}
        </div>
        <div style={{padding:"16px 20px",overflowY:"auto",flex:1}}>
          <div style={{marginBottom:16,padding:"12px 16px",borderRadius:10,border:"1px solid #e5e7eb",background:bg,display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:8,background:cardColor,border:"1px solid rgba(0,0,0,.1)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16,fontWeight:700,color:textColor}}>A</span></div>
            <p style={{margin:0,fontSize:13,fontWeight:600,color:textColor}}>Aperçu en direct</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:16}}>
            {presets.map(p=><button key={p.value} onClick={()=>onChange(p.value)} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 9px",border:cur===p.value?"2px solid #2563eb":"1px solid #e2e8f0",borderRadius:8,background:"#fff",cursor:"pointer",fontSize:11,color:"#374151"}}><div style={{width:18,height:18,borderRadius:4,background:p.value,border:"1px solid rgba(0,0,0,.12)",flexShrink:0}}/><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.label}</span></button>)}
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <input type="color" value={cur} onChange={e=>onChange(e.target.value)} style={{width:48,height:40,border:"1px solid #e2e8f0",borderRadius:8,cursor:"pointer",padding:3,flexShrink:0}}/>
            <div style={{flex:1,padding:"10px 14px",borderRadius:8,background:cur,border:"1px solid rgba(0,0,0,.1)",fontSize:12,fontWeight:500,color:"#374151"}}>{cur}</div>
          </div>
        </div>
        <div style={{padding:"12px 20px",borderTop:"1px solid #f1f5f9",display:"flex",gap:8}}>
          <button onClick={()=>{onChangeBg("#f6f8fa");onChangeText("#111827");onChangeCard("#ffffff");}} style={{flex:1,padding:"9px",border:"1px solid #e2e8f0",borderRadius:8,background:"#f9fafb",cursor:"pointer",fontSize:12,color:"#6b7280"}}>Réinitialiser</button>
          <button onClick={onClose} style={{flex:1,padding:"9px",border:"none",borderRadius:8,background:"#2563eb",cursor:"pointer",fontSize:12,color:"#fff",fontWeight:500}}>Appliquer</button>
        </div>
      </div>
    </div>
  );
}

/* ── DateRangePicker ────────────────────────────────────── */
function DateRangePicker({ range, setRange, compareMode, setCompareMode }) {
  const [open, setOpen]           = useState(false);
  const [tab,  setTab]            = useState("preset");
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
    {label:"Aujourd'hui",     value:"today"},
    {label:"Cette semaine",   value:"week"},
    {label:"Ce mois",         value:"month"},
    {label:"Cette année",     value:"year"},
    {label:"7 derniers jours",value:"last7"},
    {label:"30 derniers jours",value:"last30"},
  ];
  const COMPARE_OPTS = [
    {label:"Semaine précédente",  value:"prev_week"},
    {label:"Mois précédent",      value:"prev_month"},
    {label:"Année précédente",    value:"prev_year"},
    {label:"Période précédente",  value:"prev_period"},
  ];

  const activeLabel = range?.preset
    ? PRESETS.find(p=>p.value===range.preset)?.label
    : range?.from && range?.to ? `${range.from} → ${range.to}` : "Période";

  return (
    <div ref={ref} style={{position:"relative",display:"inline-block"}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",border:"1px solid #e2e8f0",borderRadius:8,background:"#fff",cursor:"pointer",fontSize:12,color:"#374151",fontWeight:500,boxShadow:open?"0 0 0 3px rgba(37,99,235,.15)":"none"}}>
        <Ico d={D.calendar} size={12}/>
        <span>{activeLabel}</span>
        {compareMode && (
          <span style={{background:"#eff6ff",color:"#1d4ed8",padding:"1px 6px",borderRadius:4,fontSize:10,fontWeight:600}}>vs</span>
        )}
        <svg width="8" height="5" viewBox="0 0 8 5" fill="#9ca3af"><path d="M0 0l4 5 4-5z"/></svg>
      </button>

      {open && (
        <div onClick={e=>e.stopPropagation()}
          style={{position:"absolute",top:"calc(100% + 8px)",left:0,zIndex:9999,background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,boxShadow:"0 16px 40px rgba(0,0,0,.14)",width:280,overflow:"hidden"}}>

          {/* Tabs */}
          <div style={{display:"flex",borderBottom:"1px solid #f1f5f9"}}>
            {[{id:"preset",label:"Période"},{id:"custom",label:"Calendrier"},{id:"compare",label:"Comparer"}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{flex:1,padding:"9px 4px",border:"none",background:"none",fontSize:11,fontWeight:tab===t.id?600:400,color:tab===t.id?"#2563eb":"#6b7280",borderBottom:tab===t.id?"2px solid #2563eb":"2px solid transparent",cursor:"pointer"}}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Période presets */}
          {tab==="preset" && (
            <div style={{padding:10}}>
              {PRESETS.map(p=>(
                <button key={p.value} onClick={()=>{setRange({preset:p.value,from:null,to:null});setOpen(false);}}
                  style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"8px 10px",border:"none",borderRadius:7,cursor:"pointer",background:range?.preset===p.value?"#eff6ff":"none",color:range?.preset===p.value?"#1d4ed8":"#374151",fontSize:12,fontWeight:range?.preset===p.value?600:400,marginBottom:2}}>
                  {p.label}
                  {range?.preset===p.value&&<Ico d={D.check} size={11}/>}
                </button>
              ))}
            </div>
          )}

          {/* Calendrier custom */}
          {tab==="custom" && (
            <div style={{padding:12,display:"flex",flexDirection:"column",gap:8}}>
              <div>
                <label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:4}}>Date de début</label>
                <input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)}
                  style={{width:"100%",padding:"7px 10px",border:"1px solid #e2e8f0",borderRadius:7,fontSize:12,color:"#374151",outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:4}}>Date de fin</label>
                <input type="date" value={customTo} min={customFrom} onChange={e=>setCustomTo(e.target.value)}
                  style={{width:"100%",padding:"7px 10px",border:"1px solid #e2e8f0",borderRadius:7,fontSize:12,color:"#374151",outline:"none",boxSizing:"border-box"}}/>
              </div>
              <button disabled={!customFrom||!customTo} onClick={()=>{if(customFrom&&customTo){setRange({preset:null,from:customFrom,to:customTo});setOpen(false);}}}
                style={{padding:"9px",border:"none",borderRadius:8,background:customFrom&&customTo?"#2563eb":"#e5e7eb",color:customFrom&&customTo?"#fff":"#9ca3af",cursor:customFrom&&customTo?"pointer":"not-allowed",fontSize:12,fontWeight:500}}>
                Appliquer la plage
              </button>
            </div>
          )}

          {/* Comparer */}
          {tab==="compare" && (
            <div style={{padding:10}}>
              <p style={{fontSize:11,color:"#9ca3af",margin:"0 0 8px 10px",fontWeight:500}}>Comparer avec</p>
              {/* Désactiver */}
              <button onClick={()=>{setCompareMode&&setCompareMode(null);setOpen(false);}}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"8px 10px",border:"none",borderRadius:7,cursor:"pointer",background:!compareMode?"#fef2f2":"none",color:!compareMode?"#b91c1c":"#374151",fontSize:12,fontWeight:!compareMode?600:400,marginBottom:4}}>
                Désactiver la comparaison
                {!compareMode&&<Ico d={D.check} size={11}/>}
              </button>
              <div style={{height:1,background:"#f3f4f6",margin:"4px 0"}}/>
              {COMPARE_OPTS.map(c=>(
                <button key={c.value} onClick={()=>{setCompareMode&&setCompareMode(c.value);setOpen(false);}}
                  style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"8px 10px",border:"none",borderRadius:7,cursor:"pointer",background:compareMode===c.value?"#eff6ff":"none",color:compareMode===c.value?"#1d4ed8":"#374151",fontSize:12,fontWeight:compareMode===c.value?600:400,marginBottom:2}}>
                  {c.label}
                  {compareMode===c.value&&<Ico d={D.check} size={11}/>}
                </button>
              ))}
              {compareMode && (
                <div style={{margin:"8px 10px 4px",padding:"8px 10px",background:"#eff6ff",borderRadius:8,border:"1px solid #bfdbfe"}}>
                  <p style={{fontSize:11,color:"#1d4ed8",margin:0,fontWeight:500}}>
                    Mode actif : {COMPARE_OPTS.find(c=>c.value===compareMode)?.label}
                  </p>
                  <p style={{fontSize:10,color:"#6b7280",margin:"2px 0 0"}}>Les données sont comparées à la période sélectionnée</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Charts ─────────────────────────────────────────────── */
const MiniLineChart = ({ data, keys, colors, height=110 }) => {  const all=data.flatMap(d=>keys.map(k=>d[k]||0));
  const max=Math.max(...all,1);
  const W=340,H=height,PL=28,PB=20,PT=6,PR=6;
  const cW=W-PL-PR,cH=H-PT-PB;
  const xP=(i)=>PL+(i/Math.max(data.length-1,1))*cW;
  const yP=(v)=>PT+cH-(v/max)*cH;
  return(
    <svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",height:"auto"}}>
      {[0,.25,.5,.75,1].map((r,i)=><line key={i} x1={PL} y1={PT+cH*r} x2={W-PR} y2={PT+cH*r} stroke="#f3f4f6" strokeWidth="0.5"/>)}
      {keys.map((k,ki)=>{
        const pts=data.map((d,i)=>xP(i)+","+yP(d[k]||0)).join(" ");
        const area=xP(0)+","+yP(data[0]&&data[0][k]||0)+" "+pts+" "+xP(data.length-1)+","+(H-PB)+" "+xP(0)+","+(H-PB);
        return(<g key={k}><polygon points={area} fill={colors[ki]} fillOpacity="0.08"/><polyline points={pts} fill="none" stroke={colors[ki]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>{data.map((d,i)=><circle key={i} cx={xP(i)} cy={yP(d[k]||0)} r="2.5" fill={colors[ki]}/>)}</g>);
      })}
      {data.map((d,i)=>(data.length<=14||(i%2===0))&&<text key={i} x={xP(i)} y={H-4} textAnchor="middle" fontSize="8" fill="#9ca3af">{d.lbl}</text>)}
      {[max,Math.round(max/2),0].map((v,i)=><text key={i} x={PL-3} y={i===0?PT+6:i===1?PT+cH/2+3:PT+cH+3} textAnchor="end" fontSize="8" fill="#9ca3af">{v}</text>)}
    </svg>
  );
};
const MiniLineChartCompare = ({ evol, cmpEvol, colorC, colorR, cmpLabel, height=120 }) => {
  const allVals=[...evol.flatMap(d=>[d.crees,d.resolus]),...cmpEvol.flatMap(d=>[d.crees,d.resolus])];
  const max=Math.max(...allVals,1);
  const W=340,H=height,PL=28,PB=28,PT=8,PR=6;
  const cW=W-PL-PR,cH=H-PT-PB;
  const xP=(i,len)=>PL+(i/Math.max(len-1,1))*cW;
  const yP=(v)=>PT+cH-(v/max)*cH;
  const colorCFaded=colorC+"66", colorRFaded=colorR+"66";
  const ptsCurC=evol.map((d,i)=>xP(i,evol.length)+","+yP(d.crees)).join(" ");
  const ptsCurR=evol.map((d,i)=>xP(i,evol.length)+","+yP(d.resolus)).join(" ");
  const ptsCmpC=cmpEvol.map((d,i)=>xP(i,cmpEvol.length)+","+yP(d.crees)).join(" ");
  const ptsCmpR=cmpEvol.map((d,i)=>xP(i,cmpEvol.length)+","+yP(d.resolus)).join(" ");
  return(
    <div>
      <div style={{display:"flex",gap:16,marginBottom:8,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:20,height:2.5,background:colorC,borderRadius:2}}/><span style={{fontSize:10,color:"#374151"}}>Créés (actuel)</span></div>
        <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:20,height:2.5,background:colorR,borderRadius:2}}/><span style={{fontSize:10,color:"#374151"}}>Résolus (actuel)</span></div>
        <div style={{display:"flex",alignItems:"center",gap:6}}><svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke={colorCFaded} strokeWidth="2" strokeDasharray="4 2"/></svg><span style={{fontSize:10,color:"#9ca3af"}}>Créés ({cmpLabel})</span></div>
        <div style={{display:"flex",alignItems:"center",gap:6}}><svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke={colorRFaded} strokeWidth="2" strokeDasharray="4 2"/></svg><span style={{fontSize:10,color:"#9ca3af"}}>Résolus ({cmpLabel})</span></div>
      </div>
      <svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",height:"auto"}}>
        {[0,.25,.5,.75,1].map((r,i)=><line key={i} x1={PL} y1={PT+cH*r} x2={W-PR} y2={PT+cH*r} stroke="#f3f4f6" strokeWidth="0.5"/>)}
        {[max,Math.round(max/2),0].map((v,i)=><text key={i} x={PL-3} y={i===0?PT+6:i===1?PT+cH/2+3:PT+cH+3} textAnchor="end" fontSize="8" fill="#9ca3af">{v}</text>)}
        {/* Lignes comparaison (pointillées, atténuées) */}
        <polyline points={ptsCmpC} fill="none" stroke={colorCFaded} strokeWidth="1.5" strokeDasharray="4,3" strokeLinejoin="round" strokeLinecap="round"/>
        <polyline points={ptsCmpR} fill="none" stroke={colorRFaded} strokeWidth="1.5" strokeDasharray="4,3" strokeLinejoin="round" strokeLinecap="round"/>
        {/* Lignes actuelles (pleines, plus épaisses) */}
        <polyline points={ptsCurC} fill="none" stroke={colorC} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        <polyline points={ptsCurR} fill="none" stroke={colorR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        {evol.map((d,i)=><circle key={i} cx={xP(i,evol.length)} cy={yP(d.crees)} r="2.5" fill={colorC}/>)}
        {evol.map((d,i)=><circle key={i} cx={xP(i,evol.length)} cy={yP(d.resolus)} r="2.5" fill={colorR}/>)}
        {evol.map((d,i)=>(evol.length<=14||(i%2===0))&&<text key={i} x={xP(i,evol.length)} y={H-4} textAnchor="middle" fontSize="8" fill="#9ca3af">{d.lbl}</text>)}
      </svg>
    </div>
  );
};

const MiniBarChartMultiColor = ({ data, height=82 }) => {
  const max=Math.max(...data.map(d=>d.val),1);
  const W=280,H=height,PL=22,PB=18,PT=18,PR=4;
  const cW=W-PL-PR,cH=H-PT-PB;
  const bW=Math.max(8,cW/data.length-6);
  return(
    <svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",height:"auto"}}>
      {[0,.5,1].map((r,i)=><line key={i} x1={PL} y1={PT+cH*r} x2={W-PR} y2={PT+cH*r} stroke="#f3f4f6" strokeWidth="0.5"/>)}
      {data.map((d,i)=>{const x=PL+(i/data.length)*cW+(cW/data.length-bW)/2;const bH=(d.val/max)*cH;const y=PT+cH-bH;return(<g key={i}><rect x={x} y={y} width={bW} height={Math.max(bH,0)} rx="2" fill={d.color} fillOpacity="0.85"/><text x={x+bW/2} y={H-4} textAnchor="middle" fontSize="8" fill="#9ca3af">{d.lbl}</text>{d.val>0&&<text x={x+bW/2} y={y-3} textAnchor="middle" fontSize="8" fill={d.color} fontWeight="600">{d.val}</text>}</g>);})}
      {[max,0].map((v,i)=><text key={i} x={PL-2} y={i===0?PT+8:PT+cH+3} textAnchor="end" fontSize="8" fill="#9ca3af">{v}</text>)}
    </svg>
  );
};
const DonutChart = ({ segments, size=90 }) => {
  const total=segments.reduce((s,x)=>s+x.val,0)||1;
  const r=size*0.36,sw=size*0.18,cx=size/2,cy=size/2,circ=2*Math.PI*r;let cum=0;
  return(<svg width={size} height={size} viewBox={"0 0 "+size+" "+size} style={{flexShrink:0}}><circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={sw}/>{segments.map((seg,i)=>{const pct=seg.val/total;const dash=pct*circ;const off=-(cum*circ);cum+=pct;return<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={sw} strokeDasharray={dash+" "+(circ-dash)} strokeDashoffset={off} transform={"rotate(-90 "+cx+" "+cy+")"}/>;})}</svg>);
};
const RadarChart = ({ axes, datasets, size=200 }) => {
  const pad=40;const vSize=size+pad*2;const cx=vSize/2,cy=vSize/2,r=size/2-10;
  const angle=(i)=>(i/axes.length)*2*Math.PI-Math.PI/2;
  const pt=(i,sc)=>[cx+r*sc*Math.cos(angle(i)),cy+r*sc*Math.sin(angle(i))];
  return(<svg width={vSize} height={vSize} viewBox={"0 0 "+vSize+" "+vSize} style={{overflow:"visible"}}>{[25,50,75,100].map((lv,li)=>(<polygon key={li} points={axes.map((_,i)=>pt(i,lv/100).join(",")).join(" ")} fill="none" stroke={li===3?"#d1d5db":"#f0f0f0"} strokeWidth={li===3?"1":"0.5"}/>))}{axes.map((_,i)=>{const[x,y]=pt(i,1);return<line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e5e7eb" strokeWidth="0.7"/>;})}{[25,50,75,100].map((v,i)=>{const[x,y]=pt(0,v/100);return<text key={i} x={cx+3} y={y+3} fontSize="8" fill="#9ca3af" textAnchor="start">{v}</text>;})}{datasets.map((ds,di)=>(<polygon key={di} points={axes.map((ax,i)=>pt(i,(ds.data[ax]||0)/100).join(",")).join(" ")} fill={ds.color} fillOpacity=".12" stroke={ds.color} strokeWidth="2" strokeDasharray={di===1?"5 3":"none"}/>))}{datasets.map((ds,di)=>axes.map((ax,i)=>{const[x,y]=pt(i,(ds.data[ax]||0)/100);return(<circle key={di+"-"+i} cx={x} cy={y} r="3.5" fill={ds.color} stroke="#fff" strokeWidth="1.5"/>);}))}{axes.map((ax,i)=>{const a=angle(i);const lx=cx+(r+28)*Math.cos(a);const ly=cy+(r+28)*Math.sin(a);const anchor=Math.cos(a)>0.15?"start":Math.cos(a)<-0.15?"end":"middle";const baseline=Math.sin(a)>0.15?"hanging":Math.sin(a)<-0.15?"auto":"middle";return(<text key={i} x={lx} y={ly} textAnchor={anchor} dominantBaseline={baseline} fontSize="11" fontWeight="600" fill="#1f2937">{ax}</text>);})}</svg>);
};
function BubbleActivityChart({ tickets, colorLow, colorMid, colorPeak, textColor }) {
  const canvasRef=useRef(null);const chartRef=useRef(null);
  useEffect(()=>{
    const DAYS=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];const HOURS=[9,11,13,15,17];const counts={};
    tickets.forEach(t=>{const d=new Date(t.createdAt);const day=(d.getDay()+6)%7;const hour=d.getHours();const slot=HOURS.reduce((prev,h)=>Math.abs(h-hour)<Math.abs(prev-hour)?h:prev,HOURS[0]);const key=`${day}-${slot}`;counts[key]=(counts[key]||0)+1;});
    const maxVal=Math.max(...Object.values(counts),1);const low=[],mid=[],peak=[];
    DAYS.forEach((_,di)=>{HOURS.forEach(h=>{const v=counts[`${di}-${h}`]||0;if(!v)return;const pct=v/maxVal;const rr=Math.max(4,Math.round(pct*18));const pp={x:di,y:h,r:rr,v};if(pct<0.33)low.push(pp);else if(pct<0.66)mid.push(pp);else peak.push(pp);});});
    const init=()=>{const canvas=canvasRef.current;if(!canvas)return;if(chartRef.current){chartRef.current.destroy();}const tc=textColor||"#9ca3af";const gc="rgba(0,0,0,0.06)";chartRef.current=new window.Chart(canvas,{type:"bubble",data:{datasets:[{label:"Faible",data:low,backgroundColor:colorLow+"88",borderColor:colorLow,borderWidth:1.5},{label:"Moyen",data:mid,backgroundColor:colorMid+"88",borderColor:colorMid,borderWidth:1.5},{label:"Pic",data:peak,backgroundColor:colorPeak+"88",borderColor:colorPeak,borderWidth:1.5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>{const d=ctx.raw;return ` ${DAYS[d.x]}  ${d.y}h — ${d.v} ticket${d.v>1?"s":""}`;},}}},scales:{x:{min:-0.5,max:6.5,ticks:{color:tc,font:{size:11},callback:v=>DAYS[Math.round(v)]||"",stepSize:1},grid:{color:gc}},y:{min:7,max:19,ticks:{color:tc,font:{size:11},callback:v=>HOURS.includes(v)?v+"h":"",stepSize:2},grid:{color:gc}}}}});};
    if(window.Chart){init();}else{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";s.onload=init;document.head.appendChild(s);}
    return()=>{if(chartRef.current){chartRef.current.destroy();chartRef.current=null;}};
  },[tickets,colorLow,colorMid,colorPeak,textColor]);
  return(<div><div style={{position:"relative",height:220}}><canvas ref={canvasRef}/></div><div style={{display:"flex",gap:16,marginTop:10,flexWrap:"wrap",alignItems:"center"}}>{[{r:5,label:"Faible",color:colorLow},{r:10,label:"Moyen",color:colorMid},{r:16,label:"Pic",color:colorPeak}].map((b,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:b.r*2,height:b.r*2,borderRadius:"50%",background:b.color+"88",border:`1.5px solid ${b.color}`,flexShrink:0}}/><span style={{fontSize:11,color:textColor||"#9ca3af"}}>{b.label}</span></div>))}</div></div>);
}

/* ── Drag & Drop cards ──────────────────────────────────── */
function GraphCard({ id, title, colorPickers, onDragStart, onDragOver, onDrop, isDragging, isDragOver, children, cardColor, textColor }) {
  return(
    <div draggable onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",id);onDragStart(id);}} onDragOver={e=>{e.preventDefault();e.stopPropagation();onDragOver(id);}} onDrop={e=>{e.preventDefault();e.stopPropagation();onDrop(id);}} onDragEnd={()=>onDrop(null)}
      style={{background:cardColor||"#fff",border:isDragOver?"2px dashed #93c5fd":"1px solid #e5e7eb",borderRadius:12,padding:"14px 16px",opacity:isDragging?0.4:1,boxShadow:isDragOver?"0 0 0 2px #93c5fd":"none",transition:"opacity .2s,box-shadow .15s",cursor:"grab",userSelect:"none"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,gap:8,pointerEvents:"none"}}>
        <span style={{fontSize:13,fontWeight:600,color:textColor||"#111827"}}>{title}</span>
        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0,pointerEvents:"auto"}} onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
          {colorPickers}
          <svg width="10" height="14" viewBox="0 0 10 14" fill="#94a3b8" style={{opacity:.6,pointerEvents:"none"}}><circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/><circle cx="2" cy="7" r="1.5"/><circle cx="8" cy="7" r="1.5"/><circle cx="2" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/></svg>
        </div>
      </div>
      <div style={{pointerEvents:"none"}}>{children}</div>
    </div>
  );
}
function KpiCard({ id, label, value, cmpValue, text, sub, color, pct, up, onColorChange, onDragStart, onDragOver, onDrop, isDragging, isDragOver, cardColor, textColor, compareMode }) {
  return(
    <div draggable onDragStart={e=>{e.dataTransfer.effectAllowed="move";onDragStart(id);}} onDragOver={e=>{e.preventDefault();onDragOver(id);}} onDrop={e=>{e.preventDefault();onDrop(id);}} onDragEnd={()=>onDrop(null)}
      style={{background:cardColor||"#fff",border:isDragOver?"2px dashed #93c5fd":"1px solid #e5e7eb",borderTop:`2.5px solid ${color}`,borderRadius:10,padding:"11px 12px",opacity:isDragging?0.4:1,cursor:"grab",boxShadow:isDragOver?"0 0 0 2px #93c5fd":"none",transition:"opacity .2s,box-shadow .2s",display:"flex",flexDirection:"column",gap:3}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:10,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",color:textColor?textColor+"99":"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{label}</span>
        <div onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()} style={{flexShrink:0,marginLeft:4}}><ColorPicker value={color} onChange={onColorChange} label={label}/></div>
      </div>
      <span style={{fontSize:20,fontWeight:700,lineHeight:1.1,color}}>{value}</span>
      {compareMode && cmpValue !== undefined ? (
        <div style={{display:"flex",alignItems:"center",gap:4,marginTop:1,flexWrap:"wrap"}}>
          <span style={{fontSize:10,color:"#9ca3af"}}>vs {sub}</span>
          {text && text!=="—" && up!==null && (
            <span style={{fontSize:10,fontWeight:700,color:up?"#059669":"#dc2626",background:up?"#f0fdf4":"#fef2f2",padding:"1px 6px",borderRadius:4,border:`1px solid ${up?"#bbf7d0":"#fecaca"}`}}>{text}</span>
          )}
        </div>
      ) : (
        <>
          {text
            ? <span style={{fontSize:10,fontWeight:500,color:up?"#059669":"#dc2626"}}>{up?"▲":"▼"} {text} {sub}</span>
            : <span style={{fontSize:10,color:textColor?textColor+"88":"#94a3b8"}}>{sub}</span>
          }
          {pct!==undefined&&<div style={{height:3,borderRadius:2,background:"#f1f5f9",marginTop:3,overflow:"hidden"}}><div style={{height:"100%",width:Math.min(pct,100)+"%",background:color,borderRadius:2}}/></div>}
        </>
      )}
    </div>
  );
}

const BurndownChart = ({ tickets }) => {
  const days=7;const today=new Date();
  const labels=Array.from({length:days},(_,i)=>{const d=new Date(today);d.setDate(today.getDate()-(days-1-i));return d;});
  const realData=labels.map((day,index)=>{if(index===labels.length-1)return tickets.filter(t=>!["solved","closed","cancelled"].includes(t.statut)).length;const eod=new Date(day);eod.setHours(23,59,59,999);return tickets.filter(t=>{const c=new Date(t.createdAt);if(c>eod)return false;if(!["solved","closed","cancelled"].includes(t.statut))return true;return new Date(t.updatedAt)>eod;}).length;});
  const maxVal=Math.max(...realData,1);const totalDepart=realData[0];
  const W=320,H=140,PL=32,PR=10,PT=10,PB=25;const chartW=W-PL-PR,chartH=H-PT-PB;
  const xPos=(i)=>PL+(i/(days-1))*chartW;const yPos=(v)=>PT+chartH-(v/maxVal)*chartH;
  const realPoints=realData.map((v,i)=>`${xPos(i)},${yPos(v)}`).join(" ");
  const realArea=`${xPos(0)},${yPos(realData[0])} ${realPoints} ${xPos(days-1)},${H-PB} ${xPos(0)},${H-PB}`;
  const dayLabels=labels.map(d=>`J${d.getDate()}`);const lastVal=realData[realData.length-1];const isRetard=lastVal>1;
  return(<div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:"14px 16px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
      <div><p style={{fontSize:13,fontWeight:600,color:"#111827",margin:0}}>Burndown — 7 derniers jours</p><p style={{fontSize:11,color:"#9ca3af",margin:"2px 0 0"}}>Tickets restants vs progression idéale</p></div>
      {isRetard?<span style={{fontSize:10,background:"#fef2f2",color:"#b91c1c",border:"1px solid #fecaca",padding:"2px 8px",borderRadius:6,fontWeight:500}}>Retard</span>:<span style={{fontSize:10,background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0",padding:"2px 8px",borderRadius:6,fontWeight:500}}>Bonne cadence</span>}
    </div>
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto"}}>
      {[0,.25,.5,.75,1].map((r,i)=><line key={i} x1={PL} y1={PT+chartH*r} x2={W-PR} y2={PT+chartH*r} stroke="#f3f4f6" strokeWidth="0.5"/>)}
      {[maxVal,Math.round(maxVal*.5),0].map((v,i)=><text key={i} x={PL-4} y={yPos(v)+3} textAnchor="end" fontSize="8" fill="#9ca3af">{v}</text>)}
      {dayLabels.map((l,i)=><text key={i} x={xPos(i)} y={H-PB+14} textAnchor="middle" fontSize="8" fill="#9ca3af">{l}</text>)}
      <polygon points={realArea} fill="#2563eb" fillOpacity="0.07"/>
      <line x1={xPos(0)} y1={yPos(totalDepart)} x2={xPos(days-1)} y2={yPos(0)} stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="5,3"/>
      <polyline points={realPoints} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      {realData.map((v,i)=><circle key={i} cx={xPos(i)} cy={yPos(v)} r="3" fill="#2563eb"/>)}
    </svg>
    <div style={{display:"flex",justifyContent:"space-between",marginTop:8,paddingTop:8,borderTop:"1px solid #f3f4f6"}}>
      <span style={{fontSize:10,color:"#9ca3af"}}>Départ : <strong style={{color:"#111827"}}>{totalDepart}</strong></span>
      <span style={{fontSize:10,color:"#9ca3af"}}>Aujourd'hui : <strong style={{color:isRetard?"#b91c1c":"#15803d"}}>{lastVal}</strong></span>
      <span style={{fontSize:10,color:"#9ca3af"}}>Objectif : <strong style={{color:"#111827"}}>0</strong></span>
    </div>
  </div>);
};

function HistoriqueTab({ticket}){
  if(!ticket.historique?.length)return(<div style={{textAlign:"center",padding:"32px 0",color:"#9ca3af"}}><p style={{fontSize:13}}>Aucune action enregistrée.</p></div>);
  return(<div style={{position:"relative"}}><div style={{position:"absolute",left:13,top:0,bottom:0,width:1,background:"#f3f4f6"}}/><div style={{display:"flex",flexDirection:"column",gap:12}}>{[...ticket.historique].reverse().map((h,i)=>{const cfg=HIST_CONFIG[h.action]||HIST_CONFIG.default;return(<div key={i} style={{display:"flex",gap:12}}><div style={{width:26,height:26,borderRadius:"50%",background:cfg.dotBg,border:`0.5px solid ${cfg.dotBorder}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,zIndex:1,fontSize:10,color:cfg.color,fontWeight:500}}>{ticket.historique.length-i}</div><div style={{flex:1,background:cfg.bg,border:`0.5px solid ${cfg.border}`,borderRadius:8,padding:"8px 12px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}><span style={{fontSize:12,fontWeight:500,color:cfg.color}}>{cfg.label}</span><span style={{fontSize:10,color:"#9ca3af",flexShrink:0,marginLeft:8}}>{fmtTime(h.createdAt)}</span></div>{h.details&&<p style={{fontSize:11,color:cfg.color,margin:0,opacity:.85}}>{h.details}</p>}<p style={{fontSize:10,color:"#9ca3af",margin:h.details?"3px 0 0":0}}>Par : {h.auteurNom||"Système automatique"}</p></div></div>);})}</div></div>);
}

/* ── getRangeBounds helper ───────────────────────────────── */
const getRangeBounds = (range) => {
  const today=new Date();
  const bod=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x;};
  const eod=d=>{const x=new Date(d);x.setHours(23,59,59,999);return x;};
  if(range?.from&&range?.to)return{from:bod(range.from),to:eod(range.to)};
  switch(range?.preset){
    case "today":  return{from:bod(today),to:eod(today)};
    case "week":   {const m=new Date(today);m.setDate(today.getDate()-today.getDay()+1);return{from:bod(m),to:eod(today)};}
    case "year":   {const m=new Date(today.getFullYear(),0,1);return{from:bod(m),to:eod(today)};}
    case "last7":  {const m=new Date(today);m.setDate(today.getDate()-6);return{from:bod(m),to:eod(today)};}
    case "last30": {const m=new Date(today);m.setDate(today.getDate()-29);return{from:bod(m),to:eod(today)};}
    default:       {const m=new Date(today.getFullYear(),today.getMonth(),1);return{from:bod(m),to:eod(today)};}
  }
};

/* ── getCompareBounds helper ─────────────────────────────── */
const getCompareBounds = (range, compareMode) => {
  const { from: rFrom, to: rTo } = getRangeBounds(range);
  const duration = rTo - rFrom; // ms
  const bod = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const eod = d => { const x = new Date(d); x.setHours(23,59,59,999); return x; };

  switch (compareMode) {
    case "prev_week": {
      const s = new Date(rFrom); s.setDate(s.getDate() - 7);
      const e = new Date(rTo);   e.setDate(e.getDate() - 7);
      return { from: bod(s), to: eod(e) };
    }
    case "prev_month": {
      const s = new Date(rFrom); s.setMonth(s.getMonth() - 1);
      const e = new Date(rTo);   e.setMonth(e.getMonth() - 1);
      return { from: bod(s), to: eod(e) };
    }
    case "prev_year": {
      const s = new Date(rFrom); s.setFullYear(s.getFullYear() - 1);
      const e = new Date(rTo);   e.setFullYear(e.getFullYear() - 1);
      return { from: bod(s), to: eod(e) };
    }
    case "prev_period":
    default: {
      const s = new Date(rFrom.getTime() - duration - 1);
      const e = new Date(rFrom.getTime() - 1);
      return { from: s, to: e };
    }
  }
};

const delta = (curr, prev) => {
  if (prev === 0) return curr > 0 ? { text: "+100%", up: true } : { text: "—", up: null };
  const pct = Math.round(((curr - prev) / prev) * 100);
  return { text: (pct > 0 ? "+" : "") + pct + "%", up: pct >= 0 };
};

/* ── AnalyticsTab ────────────────────────────────────────── */
function AnalyticsTab({ tickets: allTickets, statsByAgent, bgColor, setBgColor }) {
  const [periode,    setPeriode]    = useState("mois");
  const [agentFilter,setAgentFilter]= useState("tous");
  const [dateRange,   setDateRange]  = useState({preset:"month",from:null,to:null});
  const [compareMode, setCompareMode]= useState(null);
  const [showBgPanel, setShowBgPanel]= useState(false);
  const [textColor,  setTextColor]  = useState(()=>localStorage.getItem("tl_text_color")||"#111827");
  const [cardColor,  setCardColor]  = useState(()=>localStorage.getItem("tl_card_color")||"#ffffff");
  useEffect(()=>{localStorage.setItem("tl_text_color",textColor);},[textColor]);
  useEffect(()=>{localStorage.setItem("tl_card_color",cardColor);},[cardColor]);

  const [col,setCol]=useState({lineC:"#2563eb",lineR:"#16a34a",dT1:"#dc2626",dT2:"#2563eb",dT3:"#7c3aed",dS1:"#d97706",dS2:"#2563eb",dS3:"#16a34a",dS4:"#dc2626",rad1:"#2563eb",rad2:"#16a34a",bubbleLow:"#2563eb",bubbleMid:"#d97706",bubblePeak:"#dc2626"});
  const sc=(k)=>(v)=>setCol(c=>({...c,[k]:v}));

  const KPI_KEYS=["kpi0","kpi1","kpi2","kpi3","kpi4","kpi5","kpi6","kpi7"];
  const KPI_DEF=["#2563eb","#16a34a","#d97706","#dc2626","#7c3aed","#d97706","#dc2626","#6b7280"];
  const [kpiColors, setKpiColors] = useState(()=>Object.fromEntries(KPI_KEYS.map((k,i)=>[k,KPI_DEF[i]])));
  const [kpiOrder,  setKpiOrder]  = useState(KPI_KEYS);
  const [kpiDrag,   setKpiDrag]   = useState(null);
  const [kpiOver,   setKpiOver]   = useState(null);
  const kpiRef=useRef(null);
  const onKpiDS=id=>{kpiRef.current=id;setKpiDrag(id);};
  const onKpiDO=id=>setKpiOver(id);
  const onKpiDrop=id=>{if(id===null){setKpiDrag(null);setKpiOver(null);kpiRef.current=null;return;}if(!kpiRef.current||kpiRef.current===id){setKpiDrag(null);setKpiOver(null);return;}const from=kpiRef.current;setKpiOrder(prev=>{const n=[...prev],fi=n.indexOf(from),ti=n.indexOf(id);if(fi===-1||ti===-1)return prev;n.splice(fi,1);n.splice(ti,0,from);return n;});kpiRef.current=null;setKpiDrag(null);setKpiOver(null);};

  const GRAPH_ROWS=[["evolution","objectifs"],["donutType","barPrio","donutStatut"],["heatmap","radar"],["agentsTable"],["flux"]];
  const [order,  setOrder]  = useState(GRAPH_ROWS.flat());
  const [drag,   setDrag]   = useState(null);
  const [dOver,  setDOver]  = useState(null);
  const dragRef=useRef(null);
  const onDS=id=>{dragRef.current=id;setDrag(id);};
  const onDO=id=>{if(dragRef.current&&dragRef.current!==id)setDOver(id);};
  const onDrop2=id=>{if(id===null){setDrag(null);setDOver(null);dragRef.current=null;return;}const from=dragRef.current;if(!from||from===id){setDrag(null);setDOver(null);dragRef.current=null;return;}const fr=GRAPH_ROWS.findIndex(r=>r.includes(from));const tr=GRAPH_ROWS.findIndex(r=>r.includes(id));if(fr!==tr){setDrag(null);setDOver(null);dragRef.current=null;return;}setOrder(prev=>{const n=[...prev],fi=n.indexOf(from),ti=n.indexOf(id);if(fi===-1||ti===-1)return prev;[n[fi],n[ti]]=[n[ti],n[fi]];return n;});dragRef.current=null;setDrag(null);setDOver(null);};

  const {from:rangeFrom,to:rangeTo}=getRangeBounds(dateRange);
  const tickets=filterByAgentFn(allTickets.filter(t=>{const c=new Date(t.createdAt);return c>=rangeFrom&&c<=rangeTo;}),agentFilter);

  const resolved  =tickets.filter(t=>["solved","closed"].includes(t.statut));
  const escalated =tickets.filter(t=>t.statut==="escalated");
  const inProgress=tickets.filter(t=>t.statut==="in_progress");
  const unassigned=tickets.filter(t=>!t.assignee);
  const tauxRes=tickets.length>0?Math.round((resolved.length/tickets.length)*100):0;
  const tauxEsc=tickets.length>0?Math.round((escalated.length/tickets.length)*100):0;
  const withFb=tickets.filter(t=>t.feedback?.note>0);
  const avgSat=withFb.length>0?(withFb.reduce((s,t)=>s+t.feedback.note,0)/withFb.length).toFixed(1):"—";
  const avgH=resolved.length>0?Math.round(resolved.reduce((s,t)=>s+(new Date(t.updatedAt)-new Date(t.createdAt)),0)/resolved.length/3600000):0;

  const byPrio=["low","medium","high","critical"].map(p=>({lbl:PRIO_MAP[p].label.slice(0,4),val:tickets.filter(t=>t.priorite===p).length,color:PRIO_COLORS[p]}));
  const donutType  =[{color:col.dT1,val:tickets.filter(t=>t.type==="bug").length},{color:col.dT2,val:tickets.filter(t=>t.type==="feature").length},{color:col.dT3,val:tickets.filter(t=>t.type==="consultancy").length}];
  const donutStatut=[{color:col.dS1,val:tickets.filter(t=>t.statut==="ready_for_support").length},{color:col.dS2,val:inProgress.length},{color:col.dS3,val:resolved.length},{color:col.dS4,val:escalated.length}];

  const agentStats=statsByAgent.map(({agent,assigned,inProgress:ip,resolved:res})=>{const at=tickets.filter(t=>t.assignee&&(t.assignee._id===agent._id||t.assignee===agent._id));const af=at.filter(t=>t.feedback?.note>0);const sat=af.length>0?(af.reduce((s,t)=>s+t.feedback.note,0)/af.length).toFixed(1):"—";return{agent,assigned,inProgress:ip,resolved:res,satisfaction:sat,resolutionPct:assigned>0?Math.round((res/assigned)*100):0};});
  const radarAxes=["Résolution","SLA","Satisfaction","Réactivité","Charge"];
  const radarDS=agentStats.slice(0,2).map((a,i)=>({color:[col.rad1,col.rad2][i],label:a.agent.prenom+" "+a.agent.nom,data:{"Résolution":a.resolutionPct,"SLA":Math.max(0,100-tauxEsc),"Satisfaction":a.satisfaction!=="—"?parseFloat(a.satisfaction)*20:50,"Réactivité":Math.max(0,100-Math.min(avgH,100)),"Charge":a.assigned>0?Math.min(100,(a.inProgress/a.assigned)*100):0}}));

  const buildEvol=()=>{const count=periode==="semaine"?7:periode==="mois"?30:periode==="3 mois"?12:12;const isWeeks=periode==="3 mois",isMonths=periode==="annee";const today=new Date();return Array.from({length:count},(_,i)=>{const s=new Date(today),e=new Date(today);if(isMonths){s.setMonth(today.getMonth()-(count-1-i));s.setDate(1);s.setHours(0,0,0,0);e.setMonth(s.getMonth()+1);e.setDate(0);e.setHours(23,59,59,999);}else if(isWeeks){s.setDate(today.getDate()-(count-1-i)*7);s.setHours(0,0,0,0);e.setDate(s.getDate()+6);e.setHours(23,59,59,999);}else{s.setDate(today.getDate()-(count-1-i));s.setHours(0,0,0,0);e.setDate(s.getDate());e.setHours(23,59,59,999);}const lbl=isMonths?s.toLocaleDateString("fr-FR",{month:"short"}):isWeeks?"S"+(i+1):s.getDate()+"/"+(s.getMonth()+1);return{lbl,crees:allTickets.filter(t=>{const d=new Date(t.createdAt);return d>=s&&d<=e;}).length,resolus:allTickets.filter(t=>{const d=new Date(t.updatedAt);return["solved","closed"].includes(t.statut)&&d>=s&&d<=e;}).length};});};

  const buildCmpEvol=()=>{if(!cmpBounds)return[];const count=periode==="semaine"?7:periode==="mois"?30:periode==="3 mois"?12:12;const isWeeks=periode==="3 mois",isMonths=periode==="annee";const cmpEnd=new Date(cmpBounds.to);return Array.from({length:count},(_,i)=>{const s=new Date(cmpEnd),e=new Date(cmpEnd);if(isMonths){s.setMonth(cmpEnd.getMonth()-(count-1-i));s.setDate(1);s.setHours(0,0,0,0);e.setMonth(s.getMonth()+1);e.setDate(0);e.setHours(23,59,59,999);}else if(isWeeks){s.setDate(cmpEnd.getDate()-(count-1-i)*7);s.setHours(0,0,0,0);e.setDate(s.getDate()+6);e.setHours(23,59,59,999);}else{s.setDate(cmpEnd.getDate()-(count-1-i));s.setHours(0,0,0,0);e.setDate(s.getDate());e.setHours(23,59,59,999);}const lbl=isMonths?s.toLocaleDateString("fr-FR",{month:"short"}):isWeeks?"S"+(i+1):s.getDate()+"/"+(s.getMonth()+1);return{lbl,crees:allTickets.filter(t=>{const d=new Date(t.createdAt);return d>=s&&d<=e;}).length,resolus:allTickets.filter(t=>{const d=new Date(t.updatedAt);return["solved","closed"].includes(t.statut)&&d>=s&&d<=e;}).length};});};

  const evol=buildEvol();

  // ── Données période de comparaison ───────────────────────
  const cmpBounds    = compareMode ? getCompareBounds(dateRange, compareMode) : null;
  const cmpTickets   = cmpBounds ? filterByAgentFn(allTickets.filter(t=>{const c=new Date(t.createdAt);return c>=cmpBounds.from&&c<=cmpBounds.to;}), agentFilter) : [];
  const cmpResolved  = cmpTickets.filter(t=>["solved","closed"].includes(t.statut));
  const cmpEscalated = cmpTickets.filter(t=>t.statut==="escalated");
  const cmpUnassigned= cmpTickets.filter(t=>!t.assignee);
  const cmpTauxRes   = cmpTickets.length>0?Math.round((cmpResolved.length/cmpTickets.length)*100):0;
  const cmpTauxEsc   = cmpTickets.length>0?Math.round((cmpEscalated.length/cmpTickets.length)*100):0;
  const cmpWithFb    = cmpTickets.filter(t=>t.feedback?.note>0);
  const cmpAvgSat    = cmpWithFb.length>0?(cmpWithFb.reduce((s,t)=>s+t.feedback.note,0)/cmpWithFb.length).toFixed(1):"—";
  const cmpAvgH      = cmpResolved.length>0?Math.round(cmpResolved.reduce((s,t)=>s+(new Date(t.updatedAt)-new Date(t.createdAt)),0)/cmpResolved.length/3600000):0;
  const compareModeLabel = compareMode ? ({prev_week:"Sem. préc.",prev_month:"Mois préc.",prev_year:"An préc.",prev_period:"Pér. préc."}[compareMode]||"") : "";

  // ── KPI data ─────────────────────────────────────────────
  const mkDelta = (curr, prev) => {
    if (prev === 0) return curr > 0 ? { text:"+100%", up:true } : { text:"—", up:null };
    const pct = Math.round(((curr - prev) / prev) * 100);
    return { text:(pct>=0?"+":"")+pct+"%", up:pct>=0 };
  };

  const kpiData = compareMode ? [
    { label:"Total tickets",    value:tickets.length,        cmpValue:cmpTickets.length,    sub:cmpTickets.length+" ("+compareModeLabel+")",    ...mkDelta(tickets.length,    cmpTickets.length)    },
    { label:"Tickets résolus",  value:resolved.length,       cmpValue:cmpResolved.length,   sub:cmpResolved.length+" ("+compareModeLabel+")",   ...mkDelta(resolved.length,   cmpResolved.length)   },
    { label:"Taux résolution",  value:tauxRes+"%",           cmpValue:cmpTauxRes,           sub:cmpTauxRes+"% ("+compareModeLabel+")",          ...mkDelta(tauxRes,           cmpTauxRes)           },
    { label:"Taux SLA",         value:(100-tauxEsc)+"%",     cmpValue:100-cmpTauxEsc,       sub:(100-cmpTauxEsc)+"% ("+compareModeLabel+")",    ...mkDelta(100-tauxEsc,       100-cmpTauxEsc)       },
    { label:"Temps moyen rés.", value:avgH+"h",              cmpValue:cmpAvgH,              sub:cmpAvgH+"h ("+compareModeLabel+")",             ...(avgH>0&&cmpAvgH>0 ? mkDelta(cmpAvgH,avgH) : {text:"—",up:null}) },
    { label:"Satisfaction",     value:avgSat+"/5",           cmpValue:cmpAvgSat,            sub:(cmpAvgSat==="—"?"—":cmpAvgSat+"/5")+" ("+compareModeLabel+")", ...(avgSat!=="—"&&cmpAvgSat!=="—" ? mkDelta(Math.round(parseFloat(avgSat)*10), Math.round(parseFloat(cmpAvgSat)*10)) : {text:"—",up:null}) },
    { label:"Escaladés",        value:escalated.length,      cmpValue:cmpEscalated.length,  sub:cmpEscalated.length+" ("+compareModeLabel+")",  ...mkDelta(escalated.length,  cmpEscalated.length)  },
    { label:"Non assignés",     value:unassigned.length,     cmpValue:cmpUnassigned.length, sub:cmpUnassigned.length+" ("+compareModeLabel+")", ...mkDelta(unassigned.length, cmpUnassigned.length) },
  ] : [
    { label:"Total tickets",    value:tickets.length,     sub:"vs période préc.", text:"+12%", up:true  },
    { label:"Tickets résolus",  value:resolved.length,    sub:"vs période préc.", text:"+8%",  up:true  },
    { label:"Taux résolution",  value:tauxRes+"%",        sub:"obj. 80%",         text:"+5%",  up:true,  pct:tauxRes      },
    { label:"Taux SLA",         value:(100-tauxEsc)+"%",  sub:"obj. 90%",         text:"-2%",  up:false, pct:100-tauxEsc  },
    { label:"Temps moyen rés.", value:avgH+"h",           sub:"vs période préc.", text:"-15%", up:true  },
    { label:"Satisfaction",     value:avgSat+"/5",        sub:withFb.length+" avis", text:"+0.2", up:true },
    { label:"Escaladés",        value:escalated.length,   sub:"cette période",    text:"+3",   up:false },
    { label:"Non assignés",     value:unassigned.length,  sub:"en attente",       text:"",     up:true  },
  ];

  const gp=(id)=>({id,onDragStart:onDS,onDragOver:onDO,onDrop:onDrop2,isDragging:drag===id,isDragOver:dOver===id&&drag!==id,cardColor,textColor});

  const renderGraph=(id)=>{
    switch(id){
      case "evolution": return(<GraphCard key={id} {...gp(id)} title={compareMode?`Évolution — actuel vs ${compareModeLabel}`:"Évolution — créés vs résolus"} colorPickers={<><span style={{display:"flex",alignItems:"center",gap:3,fontSize:11,color:col.lineC}}><ColorPicker value={col.lineC} onChange={sc("lineC")} label="Créés"/>Créés</span><span style={{display:"flex",alignItems:"center",gap:3,fontSize:11,color:col.lineR}}><ColorPicker value={col.lineR} onChange={sc("lineR")} label="Résolus"/>Résolus</span><select value={periode} onChange={e=>setPeriode(e.target.value)} onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()} style={{fontSize:11,border:"1px solid #e2e8f0",borderRadius:6,padding:"2px 6px",background:"#fff",cursor:"pointer",color:"#374151"}}><option value="semaine">7 jours</option><option value="mois">30 jours</option><option value="3 mois">3 mois</option><option value="annee">1 an</option></select></>}>{compareMode&&cmpBounds?<MiniLineChartCompare evol={evol} cmpEvol={buildCmpEvol()} colorC={col.lineC} colorR={col.lineR} cmpLabel={compareModeLabel} height={120}/>:<MiniLineChart data={evol} keys={["crees","resolus"]} colors={[col.lineC,col.lineR]} height={110}/>}</GraphCard>);
      case "objectifs": return(<GraphCard key={id} {...gp(id)} title="Objectifs équipe" colorPickers={null}><div style={{display:"flex",flexDirection:"column",gap:14}}>{[{label:"Taux résolution",val:tauxRes,obj:80,color:tauxRes>=80?"#16a34a":"#d97706"},{label:"Taux SLA",val:100-tauxEsc,obj:90,color:(100-tauxEsc)>=90?"#16a34a":"#dc2626"},{label:"Satisfaction",val:avgSat!=="—"?Math.round(parseFloat(avgSat)*20):0,obj:80,color:"#d97706"}].map((g,i)=>(<div key={i}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,color:"#6b7280"}}>{g.label}</span><div style={{display:"flex",gap:6}}><span style={{fontSize:12,fontWeight:600,color:g.color}}>{g.val}%</span><span style={{fontSize:10,color:"#9ca3af"}}>obj. {g.obj}%</span></div></div><div style={{height:7,background:"#f3f4f6",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:Math.min(g.val,100)+"%",background:g.color,borderRadius:4}}/></div><span style={{fontSize:10,color:g.color,marginTop:3,display:"block"}}>{g.val>=g.obj?"✓ Objectif atteint":g.color==="#dc2626"?"✗ En dessous":"⚠ En progression"}</span></div>))}</div></GraphCard>);
      case "donutType": return(<GraphCard key={id} {...gp(id)} title="Répartition par type" colorPickers={<><ColorPicker value={col.dT1} onChange={sc("dT1")} label="Bug"/><ColorPicker value={col.dT2} onChange={sc("dT2")} label="Feature"/><ColorPicker value={col.dT3} onChange={sc("dT3")} label="Consult."/></>}><div style={{display:"flex",alignItems:"center",gap:14}}><DonutChart segments={donutType} size={90}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>{[{lbl:"Bug",i:0,type:"bug"},{lbl:"Feature",i:1,type:"feature"},{lbl:"Consultancy",i:2,type:"consultancy"}].map(r=>{const val=tickets.filter(t=>t.type===r.type).length,pct=tickets.length?Math.round(val/tickets.length*100):0,c=donutType[r.i].color;return<div key={r.lbl} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:2,background:c,flexShrink:0}}/><span style={{fontSize:12,color:"#374151",flex:1}}>{r.lbl}</span><span style={{fontSize:12,fontWeight:600,color:c}}>{val}</span><span style={{fontSize:11,color:"#9ca3af",minWidth:28}}>{pct}%</span></div>;})} </div></div></GraphCard>);
      case "barPrio": return(<GraphCard key={id} {...gp(id)} title="Répartition par priorité" colorPickers={null}><MiniBarChartMultiColor data={byPrio} height={82}/><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>{byPrio.map(p=><div key={p.lbl} style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:7,height:7,borderRadius:2,background:p.color}}/><span style={{fontSize:10,color:"#6b7280"}}>{p.lbl} ({p.val})</span></div>)}</div></GraphCard>);
      case "donutStatut": return(<GraphCard key={id} {...gp(id)} title="Distribution par statut" colorPickers={<><ColorPicker value={col.dS1} onChange={sc("dS1")} label="À faire"/><ColorPicker value={col.dS2} onChange={sc("dS2")} label="En cours"/><ColorPicker value={col.dS3} onChange={sc("dS3")} label="Résolus"/><ColorPicker value={col.dS4} onChange={sc("dS4")} label="Escaladé"/></>}><div style={{display:"flex",alignItems:"center",gap:14}}><DonutChart segments={donutStatut} size={90}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>{[{lbl:"À faire",i:0,s:"ready_for_support"},{lbl:"En cours",i:1,s:"in_progress"},{lbl:"Résolus",i:2,s:["solved","closed"]},{lbl:"Escaladé",i:3,s:"escalated"}].map(r=>{const val=Array.isArray(r.s)?tickets.filter(t=>r.s.includes(t.statut)).length:tickets.filter(t=>t.statut===r.s).length;const pct=tickets.length?Math.round(val/tickets.length*100):0,c=donutStatut[r.i].color;return<div key={r.lbl} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:2,background:c,flexShrink:0}}/><span style={{fontSize:12,color:"#374151",flex:1}}>{r.lbl}</span><span style={{fontSize:12,fontWeight:600,color:c}}>{val}</span><span style={{fontSize:11,color:"#9ca3af",minWidth:28}}>{pct}%</span></div>;})} </div></div></GraphCard>);
      case "heatmap": return(<GraphCard key={id} {...gp(id)} title="Activité — bulles heure × jour" colorPickers={<><span style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:col.bubbleLow}}><ColorPicker value={col.bubbleLow} onChange={sc("bubbleLow")} label="Faible"/>Faible</span><span style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:col.bubbleMid}}><ColorPicker value={col.bubbleMid} onChange={sc("bubbleMid")} label="Moyen"/>Moyen</span><span style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:col.bubblePeak}}><ColorPicker value={col.bubblePeak} onChange={sc("bubblePeak")} label="Pic"/>Pic</span></>}><BubbleActivityChart tickets={allTickets} colorLow={col.bubbleLow} colorMid={col.bubbleMid} colorPeak={col.bubblePeak} textColor={textColor}/></GraphCard>);
      case "radar": return(<GraphCard key={id} {...gp(id)} title="Radar multi-critères agents" colorPickers={<>{radarDS.map((ds,i)=><span key={i} style={{display:"flex",alignItems:"center",gap:3,fontSize:11,color:ds.color}}><ColorPicker value={ds.color} onChange={sc(["rad1","rad2"][i])} label={agentStats[i]?.agent.prenom||("Agent "+(i+1))}/>{agentStats[i]?.agent.prenom}</span>)}</>}>{agentStats.length<1?<p style={{fontSize:12,color:"#9ca3af",textAlign:"center",padding:"24px 0"}}>Données insuffisantes</p>:<div><div style={{display:"flex",justifyContent:"center",marginBottom:12}}><RadarChart axes={radarAxes} datasets={radarDS} size={200}/></div><div style={{display:"flex",gap:24,justifyContent:"center",marginBottom:14}}>{radarDS.map((ds,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8}}><svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke={ds.color} strokeWidth="2.5" strokeDasharray={i===1?"5 3":"none"}/></svg><span style={{fontSize:12,fontWeight:600,color:ds.color}}>{ds.label}</span></div>))}</div><div style={{border:"1px solid #e5e7eb",borderRadius:8,overflow:"hidden"}}><div style={{display:"grid",gridTemplateColumns:`1fr ${radarDS.map(()=>"100px").join(" ")}`,background:"#f3f4f6",padding:"8px 14px",gap:8,borderBottom:"1px solid #e5e7eb"}}><span style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:".05em"}}>Critère</span>{radarDS.map((ds,i)=>(<span key={i} style={{fontSize:11,fontWeight:700,color:ds.color,textAlign:"center",textTransform:"uppercase",letterSpacing:".05em"}}>{ds.label.split(" ")[0]}</span>))}</div>{radarAxes.map((ax,ai)=>(<div key={ax} style={{display:"grid",gridTemplateColumns:`1fr ${radarDS.map(()=>"100px").join(" ")}`,padding:"10px 14px",gap:8,borderBottom:ai<radarAxes.length-1?"1px solid #f3f4f6":"none",alignItems:"center",background:ai%2===0?"#fff":"#fafafa"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:"#94a3b8",flexShrink:0}}/><span style={{fontSize:13,fontWeight:500,color:"#111827"}}>{ax}</span></div>{radarDS.map((ds,di)=>{const val=Math.round(ds.data[ax]||0);const color=val>=70?"#16a34a":val>=40?"#d97706":"#dc2626";return(<div key={di} style={{textAlign:"center"}}><span style={{fontSize:15,fontWeight:700,color}}>{val}<span style={{fontSize:11,fontWeight:500,marginLeft:1}}>%</span></span></div>);})}</div>))}</div></div>}</GraphCard>);
      case "agentsTable": return(<GraphCard key={id} {...gp(id)} title="Analyse individuelle des agents" colorPickers={<span style={{fontSize:11,color:"#9ca3af"}}>{agentStats.length} agent{agentStats.length!==1?"s":""}</span>}>{agentStats.length===0?<p style={{fontSize:13,color:"#9ca3af",textAlign:"center",padding:"20px 0"}}>Aucun agent actif.</p>:<div style={{display:"flex",flexDirection:"column",gap:0}}><div style={{display:"flex",alignItems:"center",padding:"0 0 8px",borderBottom:"1px solid #f3f4f6",fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:".05em",gap:8}}><span style={{flex:2}}>Agent</span><span style={{flex:1,textAlign:"center"}}>Assignés</span><span style={{flex:1,textAlign:"center"}}>Résolus</span><span style={{flex:2}}>Taux résolution</span><span style={{flex:1,textAlign:"center"}}>Satisfaction</span><span style={{flex:1,textAlign:"center"}}>Charge</span></div>{agentStats.map(({agent,assigned,inProgress:ip,resolved:res,satisfaction,resolutionPct})=>{const cc=ip>15?"#dc2626":ip>8?"#d97706":"#16a34a";const rc=resolutionPct>=70?"#16a34a":resolutionPct>=50?"#d97706":"#dc2626";return(<div key={agent._id} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0",borderBottom:"1px solid #f9fafb"}}><div style={{flex:2,display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,borderRadius:"50%",background:"#2563eb",color:"#fff",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{initials(agent.prenom,agent.nom)}</div><div><div style={{fontSize:12,fontWeight:500,color:"#111827"}}>{agent.prenom} {agent.nom}</div><div style={{fontSize:10,color:"#9ca3af"}}>{agent.email}</div></div></div><div style={{flex:1,textAlign:"center"}}><span style={{fontSize:14,fontWeight:600,color:"#111827"}}>{assigned}</span></div><div style={{flex:1,textAlign:"center"}}><span style={{fontSize:14,fontWeight:600,color:"#16a34a"}}>{res}</span></div><div style={{flex:2,display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:6,background:"#f3f4f6",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:resolutionPct+"%",background:rc,borderRadius:3}}/></div><span style={{fontSize:11,fontWeight:600,color:rc,minWidth:32}}>{resolutionPct}%</span></div><div style={{flex:1,textAlign:"center"}}><span style={{fontSize:13,fontWeight:600,color:"#d97706"}}>{satisfaction!=="—"?"⭐ "+satisfaction:"—"}</span></div><div style={{flex:1,textAlign:"center"}}><span style={{fontSize:11,fontWeight:500,padding:"2px 8px",borderRadius:6,background:ip>15?"#fef2f2":ip>8?"#fefce8":"#f0fdf4",color:cc}}>{ip>15?"Surchargé":ip>8?"Moyen":"Normal"}</span></div></div>);})}</div>}</GraphCard>);
      case "flux": return(<GraphCard key={id} {...gp(id)} title="Flux de traitement des tickets" colorPickers={<span style={{fontSize:11,color:"#9ca3af"}}>De la création à la clôture</span>}><div style={{display:"flex",flexDirection:"column",gap:5}}>{[{label:"Entrants",segs:[{pct:100,bg:"#bfdbfe",c:"#1d4ed8",txt:tickets.length+" tickets"}],total:tickets.length},{label:"Assignés",segs:[{pct:tickets.length>0?Math.round(((tickets.length-unassigned.length)/tickets.length)*100):0,bg:"#93c5fd",c:"#1e40af",txt:(tickets.length-unassigned.length)+" assignés"},{pct:tickets.length>0?Math.round((unassigned.length/tickets.length)*100):0,bg:"#fde68a",c:"#92400e",txt:unassigned.length+" N/A"}],total:tickets.length},{label:"Traitement",segs:[{pct:tickets.length>0?Math.round((inProgress.length/tickets.length)*100):0,bg:"#6ee7b7",c:"#065f46",txt:inProgress.length+" en cours"},{pct:tickets.length>0?Math.round((resolved.length/tickets.length)*100):0,bg:"#a7f3d0",c:"#047857",txt:resolved.length+" résolus"},{pct:tickets.length>0?Math.round((escalated.length/tickets.length)*100):0,bg:"#fca5a5",c:"#991b1b",txt:escalated.length+" esc."}],total:tickets.length-unassigned.length},{label:"Clôturés",segs:[{pct:100,bg:"#bbf7d0",c:"#14532d",txt:resolved.length+" résolus"}],total:resolved.length}].map((row,ri)=>(<React.Fragment key={ri}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:11,color:"#6b7280",minWidth:72,fontWeight:500}}>{row.label}</span><div style={{flex:1,height:26,borderRadius:5,overflow:"hidden",display:"flex"}}>{row.segs.map((seg,si)=>seg.pct>0&&<div key={si} style={{width:seg.pct+"%",background:seg.bg,color:seg.c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600,overflow:"hidden",whiteSpace:"nowrap",padding:"0 4px"}}>{seg.txt}</div>)}</div><span style={{fontSize:11,fontWeight:600,color:"#475569",minWidth:20,textAlign:"right"}}>{row.total}</span></div>{ri<3&&<div style={{paddingLeft:82,fontSize:13,color:"#d1d5db"}}>↓</div>}</React.Fragment>))}</div></GraphCard>);
      default: return null;
    }
  };
  const getGridCols=(ids)=>ids.length===1?"1fr":ids.length===2?"1fr 1fr":"repeat(3,1fr)";

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <select value={agentFilter} onChange={e=>setAgentFilter(e.target.value)} style={{padding:"7px 10px",border:"1px solid #e5e7eb",borderRadius:7,fontSize:12,color:"#374151",background:"#fff",cursor:"pointer",fontFamily:"inherit",outline:"none"}}>
            <option value="tous">Tous les agents</option>
            {agentStats.map(a=><option key={a.agent._id} value={a.agent._id}>{a.agent.prenom} {a.agent.nom}</option>)}
          </select>
          <DateRangePicker range={dateRange} setRange={setDateRange} compareMode={compareMode} setCompareMode={setCompareMode}/>
        </div>
        <button onClick={()=>setShowBgPanel(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",border:"1px solid #e2e8f0",borderRadius:8,background:"#fff",cursor:"pointer",fontSize:12,color:"#374151",fontWeight:500}}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="#374151"><path d="M8 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm4 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm.5 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M16 8c0 3.15-1.866 2.585-3.567 2.07C11.42 9.763 10.465 9.473 10 10c-.603.683-.475 1.819-.351 2.92C9.826 14.495 9.996 16 8 16a8 8 0 1 1 8-8z"/></svg>
          Personnaliser le fond
          <div style={{width:14,height:14,borderRadius:3,background:bgColor,border:"1px solid rgba(0,0,0,.15)"}}/>
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(8,minmax(0,1fr))",gap:8}}>
        {kpiOrder.map(k=>{const d=kpiData[parseInt(k.replace("kpi",""))];if(!d)return null;return(<KpiCard key={k} id={k} label={d.label} value={d.value} cmpValue={d.cmpValue} text={d.text} sub={d.sub} up={d.up} pct={d.pct} color={kpiColors[k]} onColorChange={v=>setKpiColors(c=>({...c,[k]:v}))} onDragStart={onKpiDS} onDragOver={onKpiDO} onDrop={onKpiDrop} isDragging={kpiDrag===k} isDragOver={kpiOver===k&&kpiDrag!==k} cardColor={cardColor} textColor={textColor} compareMode={compareMode}/>);})}
      </div>
      {GRAPH_ROWS.map((rowIds,ri)=>{const orderedRow=order.filter(id=>rowIds.includes(id));return(<div key={ri} style={{display:"grid",gridTemplateColumns:getGridCols(rowIds),gap:14,alignItems:"stretch"}}>{orderedRow.map(id=>renderGraph(id))}</div>);})}
      {showBgPanel&&(<><div style={{position:"fixed",inset:0,zIndex:7999,background:"rgba(0,0,0,.4)"}} onClick={()=>setShowBgPanel(false)}/><BgPanel bg={bgColor} onChangeBg={setBgColor} textColor={textColor} onChangeText={setTextColor} cardColor={cardColor} onChangeCard={setCardColor} onClose={()=>setShowBgPanel(false)}/></>)}
    </div>
  );
}

/* ── helper filterByAgent ───────────────────────────────── */
const filterByAgentFn=(tickets,agentId)=>{if(!agentId||agentId==="tous")return tickets;return tickets.filter(t=>t.assignee?._id===agentId||t.assignee===agentId);};

/* ── Composant principal ─────────────────────────────────── */
export default function TeamLeadDashboard() {
  const navigate = useNavigate();
  const user = getUser(), token = getToken();

  const [bgColor,setBgColor]=useState(()=>localStorage.getItem("tl_dashboard_bg")||"#f6f8fa");
  useEffect(()=>{localStorage.setItem("tl_dashboard_bg",bgColor);},[bgColor]);

  const [tab,setTab]=useState("overview");
  const [tickets,setTickets]=useState([]);
  const [stats,setStats]=useState(null);
  const [statsByAgent,setSBA]=useState([]);
  const [agents,setAgents]=useState([]);
  const [selTicket,setSel]=useState(null);
  const [loading,setLoading]=useState(true);
  const [filterStatut,setFS]=useState("tous");
  const [assignModal,setAM]=useState(null);
  const [selAgent,setSA]=useState("");
  const [globalMsg,setGMsg]=useState("");
  const [notifs,setNotifs]=useState([]);
  const [notifCount,setNC]=useState(0);
  const [showNotifs,setShowN]=useState(false);
  const [clients,setClients]=useState([]);
  const [searchClient,setSC]=useState("");
  const [deleteConfirm,setDC]=useState(null);
  const [editClient,setEC]=useState(null);
  const [editForm,setEF]=useState({});
  const [editMsg,setEM]=useState("");
  const [editErr,setEE]=useState("");
  const [formClient,setFC]=useState({nom:"",prenom:"",email:"",telephone:""});
  const [serverMsg,setSM]=useState("");
  const [serverErr,setSE]=useState("");
  const [currentTime,setTime]=useState(now());
  const [selectedClient,setSelCl]=useState(null);
  const [searchSuivi,setSearchSuivi]=useState("");
  const [detailTab,setDetailTab]=useState("details");

  // ── États IA ──────────────────────────────────────────────
  const [iaStats,      setIaStats]      = useState(null);
  const [iaLoadingSet, setIaLoadingSet] = useState(new Set()); // par ticket
  const [iaMsg,        setIaMsg]        = useState({text:"",type:""});
  const [selIaTicket,  setSelIaTicket]  = useState(null);
  const [iaSuggestions,setIaSuggestions]= useState([]);
  const [iaSugLoading, setIaSugLoading] = useState(false);
  const [iaSugError,   setIaSugError]   = useState("");

  const SUG_CFG = {
    analyse:      { iconD: D.chart,  label: "Analyse client",      accent: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
    priorite:     { iconD: D.star,   label: "Priorité suggérée",   accent: "#a16207", bg: "#fefce8", border: "#fde68a" },
    assignation:  { iconD: D.person, label: "Agent recommandé",    accent: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
    reponse_auto: { iconD: D.chat,   label: "Réponse automatique", accent: "#6d28d9", bg: "#fdf4ff", border: "#e9d5ff" },
  };

  useEffect(()=>{
    if(!token||!user||user.role!=="team_lead"){navigate("/login-personnel");return;}
    loadAll();fetchIaStats();
    const iv=setInterval(()=>{loadAll();setTime(now());},15000);
    return()=>clearInterval(iv);
  },[]);

  useEffect(()=>{
    if(tab==="clients"||tab==="suivi")fetchClients();
    if(tab==="ia")fetchIaStats();
  },[tab]);

  useEffect(()=>{setDetailTab("details");},[selTicket?._id]);

  const loadAll=()=>{fetchStats();fetchTickets();fetchAgents();fetchNotifCount();};
  const fetchStats=()=>fetch(`${API}/tickets/stats`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok"){setStats(d.stats);setSBA(d.statsByAgent);}});
  const fetchTickets=()=>{setLoading(true);fetch(`${API}/tickets/tous`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setTickets(d.tickets);}).finally(()=>setLoading(false));};
  const fetchAgents=()=>fetch(`${API}/admin/users`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setAgents(d.users.filter(u=>u.role==="support"&&u.isActive));});
  const fetchNotifCount=()=>fetch(`${API}/notifications/non-lues`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setNC(d.count);}).catch(()=>{});
  const fetchNotifList=()=>fetch(`${API}/notifications`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setNotifs(d.notifications);}).catch(()=>{});
  const fetchClients=()=>fetch(`${API}/admin/clients`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setClients(d.clients);}).catch(()=>{});
  const fetchTicketDetail=(id)=>fetch(`${API}/tickets/${id}`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setSel(d.ticket);});

  // ── IA functions ──────────────────────────────────────────
  const fetchIaStats=()=>fetch(`${API}/ia/stats`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>setIaStats(d)).catch(()=>{});

  const lancerAnalyseIA=async(ticketId)=>{
    setIaLoadingSet(prev=>{const s=new Set(prev);s.add(ticketId);return s;});
    setIaMsg({text:"",type:""});
    try{
      const res=await fetch(`${API}/ia/analyser/${ticketId}`,{method:"POST",headers:{Authorization:`Bearer ${token}`}});
      const d=await res.json();
      if(d.succes){
        setIaMsg({text:"Analyse terminée avec succès.",type:"success"});
        fetchTickets();fetchIaStats();
      }else{
        setIaMsg({text:"Erreur : "+(d.message||d.erreur||"Inconnue"),type:"error"});
      }
    }catch{setIaMsg({text:"Erreur réseau",type:"error"});}
    finally{
      setIaLoadingSet(prev=>{const s=new Set(prev);s.delete(ticketId);return s;});
      setTimeout(()=>setIaMsg({text:"",type:""}),4000);
    }
  };

  const fetchIaSuggestions=async(ticketId)=>{
    setIaSugLoading(true);
    setIaSuggestions([]);
    setIaSugError("");
    try{
      const res=await fetch(`${API}/ia/suggestions/${ticketId}`,{headers:{Authorization:`Bearer ${token}`}});
      if(!res.ok){setIaSugError(`Erreur HTTP ${res.status}`);return;}
      const d=await res.json();
      const list=d.suggestions||d.data||[];
      setIaSuggestions(list);
      if(list.length===0)setIaSugError("Aucune suggestion trouvée pour ce ticket.");
    }catch(err){
      console.error("fetchIaSuggestions error:",err);
      setIaSugError("Impossible de charger les suggestions.");
    }finally{setIaSugLoading(false);}
  };

  const validerSuggestion=async(suggestionId,statut)=>{
    try{
      await fetch(`${API}/ia/suggestion/${suggestionId}`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({statut})});
      if(selIaTicket)fetchIaSuggestions(selIaTicket._id);
      fetchIaStats();
    }catch(err){console.error(err);}
  };

  const ouvrirPanelIA=(t)=>{setSelIaTicket(t);fetchIaSuggestions(t._id);};
  const fermerPanelIA=()=>{setSelIaTicket(null);setIaSuggestions([]);setIaSugError("");};

  const toggleNotifs=()=>{if(!showNotifs){fetchNotifList();fetch(`${API}/notifications/lire-tout`,{method:"PUT",headers:{Authorization:`Bearer ${token}`}}).then(()=>setNC(0)).catch(()=>{});}setShowN(!showNotifs);};
  const assigner=async()=>{if(!selAgent){alert("Choisissez un agent");return;}const res=await fetch(`${API}/tickets/${assignModal._id}/assigner`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({assigneeId:selAgent})});const d=await res.json();if(d.status==="ok"){setGMsg("Ticket assigné avec succès.");setAM(null);setSA("");fetchTickets();fetchStats();setTimeout(()=>setGMsg(""),3000);}};
  const changePrio=async(id,p)=>{await fetch(`${API}/tickets/${id}/priorite`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({priorite:p})});fetchTickets();if(selTicket?._id===id)fetchTicketDetail(id);};
  const createClient=async(e)=>{e.preventDefault();setSE("");setSM("");if(!formClient.nom||!formClient.prenom||!formClient.email||!formClient.telephone){setSE("Tous les champs sont obligatoires");return;}const res=await fetch(`${API}/admin/create-client`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(formClient)});const d=await res.json();if(d.status==="ok"){setSM(`Compte créé, email envoyé à ${formClient.email}`);setFC({nom:"",prenom:"",email:"",telephone:""});fetchClients();}else setSE(d.msg);};
  const toggleClient=async(id)=>{await fetch(`${API}/admin/clients/${id}/toggle`,{method:"PUT",headers:{Authorization:`Bearer ${token}`}});fetchClients();};
  const deleteClient=async(id)=>{const res=await fetch(`${API}/admin/clients/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});const d=await res.json();if(d.status==="ok"){setDC(null);fetchClients();}};
  const saveClient=async()=>{setEM("");setEE("");const res=await fetch(`${API}/admin/clients/${editClient._id}/edit`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(editForm)});const d=await res.json();if(d.status==="ok"){setEM("Modifications enregistrées.");fetchClients();setTimeout(()=>setEC(null),1500);}else setEE(d.msg);};
  const logout=()=>{localStorage.clear();sessionStorage.clear();navigate("/login-personnel");};

  const ticketsFiltres=filterStatut==="tous"?tickets:filterStatut==="non_assignes"?tickets.filter(t=>!t.assignee):tickets.filter(t=>t.statut===filterStatut);
  const clientsFiltres=clients.filter(c=>{const q=searchClient.toLowerCase();return c.prenom?.toLowerCase().includes(q)||c.nom?.toLowerCase().includes(q)||c.email?.toLowerCase().includes(q);});
  const clientsAvecStats=clients.filter(c=>{const q=searchSuivi.toLowerCase();return c.prenom?.toLowerCase().includes(q)||c.nom?.toLowerCase().includes(q)||c.email?.toLowerCase().includes(q);}).map(c=>{const tc=tickets.filter(t=>t.reporter?._id===c._id||t.reporter===c._id);const total=tc.length,resolus=tc.filter(t=>["solved","closed"].includes(t.statut)).length,enCours=tc.filter(t=>t.statut==="in_progress").length,attente=tc.filter(t=>t.statut==="ready_for_support").length,escalade=tc.filter(t=>t.statut==="escalated").length,pct=total>0?Math.round((resolus/total)*100):0,feedbacks=tc.filter(t=>t.feedback?.note>0),avgNote=feedbacks.length>0?(feedbacks.reduce((s,t)=>s+t.feedback.note,0)/feedbacks.length).toFixed(1):null;return{...c,ticketsClient:tc,total,resolus,enCours,attente,escalade,pct,avgNote};});
  const pageTitle={overview:"Vue d'ensemble",analytics:"Analytiques",tickets:"Tous les tickets",agents:"Agents support",clients:"Clients",suivi:"Suivi clients","creer-client":"Créer un client",ia:"Analyse IA"};

  /* ── Sentiment label without emoji ── */
  const sentimentLabel=(s)=>s==="frustre"?"Frustré":s==="desespere"?"Désespéré":s==="calme"?"Calme":s||"—";
  const sentimentColor=(s)=>s==="frustre"?"#b91c1c":s==="desespere"?"#7f1d1d":"#15803d";
  const sentimentBg   =(s)=>s==="frustre"?"#fef2f2":s==="desespere"?"#450a0a":"#f0fdf4";
  const sentimentFg   =(s)=>s==="desespere"?"#fff":sentimentColor(s);

  return (
    <div className="tl-layout" style={{background:bgColor}}>
      <aside className="sidebar">
        <div className="sidebar-brand"><div className="sidebar-brand-icon"><Ico d={D.brand} size={14}/></div><span className="sidebar-brand-name">Tictrack</span></div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(n=>(
            <button key={n.id} className={`nav-item ${tab===n.id?"active":""}`} onClick={()=>{setTab(n.id);setSel(null);setSelCl(null);fermerPanelIA();}}>
              <Ico d={n.icon} size={14}/>{n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{user?.prenom?.[0]}{user?.nom?.[0]}</div>
            <div className="user-info"><span className="user-name">{user?.prenom} {user?.nom}</span><span className="user-role">Chef d'équipe</span></div>
            <button className="btn-logout" onClick={logout} title="Déconnexion"><Ico d={D.logout} size={13}/></button>
          </div>
        </div>
      </aside>

      <main className="tl-main">
        {deleteConfirm&&(<div className="modal-overlay"><div className="modal-box"><h3>Supprimer ce client ?</h3><p style={{color:"#6b7280",fontSize:13,marginBottom:20}}>Cette action est irréversible.</p><div className="modal-actions"><button className="btn-cancel" onClick={()=>setDC(null)}>Annuler</button><button className="btn-delete-confirm" onClick={()=>deleteClient(deleteConfirm._id)}>Supprimer</button></div></div></div>)}
        {editClient&&(<div className="modal-overlay"><div className="modal-box modal-edit"><h3>Modifier — {editClient.prenom} {editClient.nom}</h3>{editErr&&<div className="alert alert-error">{editErr}</div>}{editMsg&&<div className="alert alert-success">{editMsg}</div>}<div className="form-row"><div className="form-group"><label>Prénom</label><input className="form-input" value={editForm.prenom} onChange={e=>setEF({...editForm,prenom:e.target.value})}/></div><div className="form-group"><label>Nom</label><input className="form-input" value={editForm.nom} onChange={e=>setEF({...editForm,nom:e.target.value})}/></div></div><div className="form-group"><label>Email</label><input type="email" className="form-input" value={editForm.email} onChange={e=>setEF({...editForm,email:e.target.value})}/></div><div className="form-group"><label>Téléphone</label><input className="form-input" value={editForm.telephone} onChange={e=>setEF({...editForm,telephone:e.target.value})}/></div><div className="modal-actions"><button className="btn-cancel" onClick={()=>setEC(null)}>Annuler</button><button className="btn-save" onClick={saveClient}>Enregistrer</button></div></div></div>)}
        {assignModal&&(<div className="modal-overlay"><div className="modal-box"><h3>Assigner le ticket</h3><p style={{color:"#6b7280",fontSize:13,marginBottom:16}}>{ticketRef(assignModal._id)} — {assignModal.titre}</p><div className="form-group"><label>Agent support</label><select className="form-input" value={selAgent} onChange={e=>setSA(e.target.value)}><option value="">Sélectionner un agent</option>{agents.map(a=><option key={a._id} value={a._id}>{a.prenom} {a.nom}</option>)}</select></div><div className="modal-actions"><button className="btn-cancel" onClick={()=>{setAM(null);setSA("");}}>Annuler</button><button className="tl-btn-assign" onClick={assigner}>Assigner</button></div></div></div>)}

        <div className="tl-topbar">
          <div><h1 className="tl-page-title">{pageTitle[tab]||"Chef d'équipe"}</h1><p className="tl-page-subtitle">{stats?`${stats.total} tickets · mis à jour à ${currentTime}`:"Chargement..."}</p></div>
          <div className="notif-wrapper">
            <button className="tl-notif-btn" onClick={toggleNotifs}><Ico d={D.bell} size={13}/>Notifications{notifCount>0&&<span className="notif-badge">{notifCount}</span>}</button>
            {showNotifs&&(<div className="notif-dropdown"><p className="notif-header">Notifications</p>{notifs.length===0?<p className="notif-empty">Aucune notification</p>:notifs.map(n=>(<div key={n._id} className={`notif-item ${n.lu?"":"notif-unread"}`} onClick={()=>{setShowN(false);setTab("tickets");if(n.ticket)fetchTicketDetail(n.ticket._id);}}><p className="notif-msg">{n.message}</p><p className="notif-date">{fmtDate(n.createdAt)}</p></div>))}</div>)}
          </div>
        </div>

        <div className="tl-content">
          {globalMsg&&<div className="alert alert-success">{globalMsg}</div>}

          {/* ── OVERVIEW ── */}
          {tab==="overview"&&stats&&(<>
            <div className="tl-stats-grid">
              {[{label:"Total",value:stats.total,accent:"#8b5cf6",f:"tous"},{label:"En attente",value:stats.enAttente,accent:"#d97706",f:"ready_for_support"},{label:"En cours",value:stats.enCours,accent:"#2563eb",f:"in_progress"},{label:"Résolus",value:stats.resolus,accent:"#16a34a",f:"solved"},{label:"Escaladés",value:stats.escalades,accent:"#dc2626",f:"escalated"},{label:"Non assignés",value:stats.nonAssignes,accent:"#6b7280",f:"non_assignes"}].map(s=>(<div key={s.f} className="tl-stat-card" style={{borderTop:`2.5px solid ${s.accent}`}} onClick={()=>{setTab("tickets");setFS(s.f);setSel(null);}}><div className="tl-stat-number" style={{color:s.accent}}>{s.value}</div><div className="tl-stat-label">{s.label}</div></div>))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              <BurndownChart tickets={tickets}/>
              {stats.nonAssignes>0?(<div className="tl-card" style={{margin:0}}><div className="tl-card-header"><span className="tl-card-title">Tickets en attente d'assignation</span><span className="tl-badge-warning">{stats.nonAssignes} tickets</span></div><div className="tl-ticket-list">{tickets.filter(t=>!t.assignee).map(t=>(<div key={t._id} className="tl-ticket-row"><div className="tl-ticket-left"><span className="tl-ticket-id">{ticketRef(t._id)}</span><div><p className="tl-ticket-title">{t.titre}</p><p className="tl-ticket-meta">{t.reporter?.prenom} {t.reporter?.nom} · {fmtDate(t.createdAt)}</p></div></div><div className="tl-ticket-right"><PrioBadge p={t.priorite}/><button className="tl-btn-assign" onClick={()=>setAM(t)}>Assigner</button></div></div>))}</div></div>):(<div className="tl-card" style={{margin:0,display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{fontSize:13,color:"#9ca3af"}}>Tous les tickets sont assignés</p></div>)}
            </div>
          </>)}

          {/* ── ANALYTICS ── */}
          {tab==="analytics"&&<AnalyticsTab tickets={tickets} statsByAgent={statsByAgent} bgColor={bgColor} setBgColor={setBgColor}/>}

          {/* ── TICKETS ── */}
          {tab==="tickets"&&!selTicket&&(
            <div className="tl-card">
              <div className="tl-card-header"><span className="tl-card-title">Tous les tickets</span><select className="tl-filter-select" value={filterStatut} onChange={e=>setFS(e.target.value)}><option value="tous">Tous les statuts</option><option value="ready_for_support">À faire</option><option value="in_progress">En cours</option><option value="ready_for_customer">À confirmer</option><option value="solved">Résolus</option><option value="escalated">Escaladés</option><option value="non_assignes">Non assignés</option></select></div>
              {loading?<div className="loading">Chargement...</div>:(filterStatut==="tous"?(
                <div className="tl-kanban-wrapper"><div className="tl-kanban-board">{KANBAN_COLS.map(col=>{const colTickets=tickets.filter(t=>t.statut===col.statut);return(<div key={col.statut} className="tl-kanban-col" style={{borderTop:`2.5px solid ${col.accent}`}}><div className="tl-kanban-col-header"><span style={{fontSize:12,fontWeight:500,color:col.accent}}>{col.label}</span><span style={{background:col.countBg,color:col.countColor,fontSize:11,fontWeight:500,padding:"1px 7px",borderRadius:20}}>{colTickets.length}</span></div><div className="tl-kanban-col-body">{colTickets.length===0?<div className="tl-kanban-empty">Aucun ticket</div>:colTickets.map(t=>(<div key={t._id} className="tl-kanban-card" onClick={()=>{setSel(t);fetchTicketDetail(t._id);}}><div className="tl-kanban-card-top"><span className="tl-ticket-id" style={{fontSize:10}}>{ticketRef(t._id)}</span><PrioBadge p={t.priorite}/></div><p className="tl-kanban-card-title">{t.titre}</p><p className="tl-kanban-card-type">{t.type==="bug"?"Bug":t.type==="feature"?"Feature":"Consultancy"}</p><div className="tl-kanban-card-footer"><span className="tl-kanban-card-date">{fmtDate(t.createdAt)}</span>{t.assignee?<div className="tl-avatar-chip">{initials(t.assignee.prenom,t.assignee.nom)}</div>:<span style={{fontSize:10,color:"#b91c1c",background:"#fef2f2",padding:"1px 6px",borderRadius:4,border:"1px solid #fecaca"}}>Non assigné</span>}</div></div>))}</div></div>);})} </div></div>
              ):(<div className="tl-ticket-list">{ticketsFiltres.length===0?<p className="no-comment">Aucun ticket.</p>:ticketsFiltres.map(t=>(<div key={t._id} className="tl-ticket-row" onClick={()=>{setSel(t);fetchTicketDetail(t._id);}}><div className="tl-ticket-left"><span className="tl-ticket-id">{ticketRef(t._id)}</span><div><p className="tl-ticket-title">{t.titre}</p><p className="tl-ticket-meta">{t.reporter?.prenom} {t.reporter?.nom} · {t.assignee?`→ ${t.assignee.prenom} ${t.assignee.nom}`:"Non assigné"} · {fmtDate(t.createdAt)}</p></div></div><div className="tl-ticket-right"><PrioBadge p={t.priorite}/><StatutBadge s={t.statut}/>{!t.assignee&&<button className="tl-btn-assign" onClick={e=>{e.stopPropagation();setAM(t);}}>Assigner</button>}</div></div>))}</div>))}
            </div>
          )}
          {tab==="tickets"&&selTicket&&(
            <div className="tl-card">
              <button className="btn-back" onClick={()=>setSel(null)}>← Retour</button>
              <div className="tl-detail-header">
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span className="tl-ticket-id">{ticketRef(selTicket._id)}</span><StatutBadge s={selTicket.statut}/><PrioBadge p={selTicket.priorite}/></div>
                <h2 className="tl-detail-title">{selTicket.titre}</h2>
                <p className="tl-ticket-meta">Client : <strong>{selTicket.reporter?.prenom} {selTicket.reporter?.nom}</strong> · {fmtDate(selTicket.createdAt)}{selTicket.assignee&&<> · Assigné à <strong>{selTicket.assignee.prenom} {selTicket.assignee.nom}</strong></>}</p>
              </div>
              <div style={{display:"flex",borderBottom:"0.5px solid #f0f0ed",marginBottom:20}}>
                {[{id:"details",label:"Détails"},{id:"commentaires",label:`Commentaires (${selTicket.commentaires?.length||0})`},{id:"historique",label:`Historique (${selTicket.historique?.length||0})`}].map(t=>(<button key={t.id} onClick={()=>setDetailTab(t.id)} style={{padding:"10px 18px",fontSize:12,fontWeight:detailTab===t.id?500:400,color:detailTab===t.id?"#185FA5":"#888",background:"none",border:"none",borderBottom:detailTab===t.id?"2px solid #378ADD":"2px solid transparent",cursor:"pointer"}}>{t.label}</button>))}
              </div>
              {detailTab==="details"&&(<><div className="tl-detail-desc">{selTicket.description}</div><div style={{display:"flex",gap:10,marginTop:20,flexWrap:"wrap"}}><div style={{display:"flex",alignItems:"center",gap:8}}><label style={{fontSize:13,fontWeight:500,color:"#374151"}}>Priorité</label><select className="tl-filter-select" value={selTicket.priorite} onChange={e=>changePrio(selTicket._id,e.target.value)}>{Object.entries(PRIO_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div><button className="tl-btn-assign" onClick={()=>setAM(selTicket)}>{selTicket.assignee?"Réassigner":"Assigner"} l'agent</button></div></>)}
              {detailTab==="commentaires"&&(<div className="commentaires-list">{selTicket.commentaires?.length===0&&<p className="no-comment">Aucun commentaire</p>}{selTicket.commentaires?.map(c=>(<div key={c._id} className="commentaire-item"><div className={`comment-avatar ${c.auteur?.role==="client"?"avatar-client":"avatar-support"}`}>{c.auteur?.prenom?.[0]}{c.auteur?.nom?.[0]}</div><div className="comment-body"><p className="comment-author">{c.auteur?.prenom} {c.auteur?.nom}<span className="comment-role"> · {c.auteur?.role==="client"?"Client":"Support"}</span></p><p className="comment-text">{c.contenu}</p><p className="comment-date">{fmtDate(c.createdAt)}</p></div></div>))}</div>)}
              {detailTab==="historique"&&<HistoriqueTab ticket={selTicket}/>}
            </div>
          )}

          {/* ── AGENTS ── */}
          {tab==="agents"&&(<div className="tl-card"><span className="tl-card-title" style={{display:"block",marginBottom:16}}>Performance des agents</span><div className="tl-agents-grid">{statsByAgent.map(({agent,assigned,inProgress,resolved})=>(<div key={agent._id} className="tl-agent-card"><div className="tl-agent-header"><div className="tl-agent-avatar">{initials(agent.prenom,agent.nom)}</div><div><p className="tl-agent-name">{agent.prenom} {agent.nom}</p><p className="tl-agent-email">{agent.email}</p></div></div><div className="tl-agent-stats"><div className="tl-agent-stat"><span className="tl-agent-stat-num">{assigned}</span><span className="tl-agent-stat-lbl">Assignés</span></div><div className="tl-agent-stat"><span className="tl-agent-stat-num" style={{color:"#2563eb"}}>{inProgress}</span><span className="tl-agent-stat-lbl">En cours</span></div><div className="tl-agent-stat"><span className="tl-agent-stat-num" style={{color:"#16a34a"}}>{resolved}</span><span className="tl-agent-stat-lbl">Résolus</span></div></div></div>))}{statsByAgent.length===0&&<p className="no-comment">Aucun agent actif.</p>}</div></div>)}

          {/* ── CLIENTS ── */}
          {tab==="clients"&&(<div className="tl-card"><div className="tl-card-header"><span className="tl-card-title">Clients</span><span style={{fontSize:12,color:"#9ca3af"}}>{clientsFiltres.length} client{clientsFiltres.length!==1?"s":""}</span></div><input className="tl-clients-search" placeholder="Rechercher par nom ou email..." value={searchClient} onChange={e=>setSC(e.target.value)}/><table className="tl-clients-table"><thead><tr><th>Client</th><th>Email</th><th>Téléphone</th><th>Statut</th><th>Créé le</th><th>Actions</th></tr></thead><tbody>{clientsFiltres.length===0?<tr><td colSpan={6} style={{textAlign:"center",color:"#9ca3af",padding:24,fontSize:13}}>Aucun client trouvé</td></tr>:clientsFiltres.map(c=>(<tr key={c._id}><td><div className="tl-client-cell"><div className="tl-client-avatar">{initials(c.prenom,c.nom)}</div><div><div className="tl-client-name">{c.prenom} {c.nom}</div></div></div></td><td><span className="tl-client-email">{c.email}</span></td><td><span className="tl-client-phone">{c.telephone||"—"}</span></td><td><span className={c.isActive?"tl-status-active":"tl-status-inactive"}>{c.isActive?"Actif":"Inactif"}</span></td><td><span className="tl-client-date">{fmtDate(c.createdAt)}</span></td><td><div className="tl-action-btns"><button className="tl-btn-edit" onClick={()=>{setEC(c);setEF({nom:c.nom,prenom:c.prenom,email:c.email,telephone:c.telephone});setEM("");setEE("");}}>Modifier</button><button className={c.isActive?"tl-btn-toggle-off":"tl-btn-toggle-on"} onClick={()=>toggleClient(c._id)}>{c.isActive?"Désactiver":"Activer"}</button><button className="tl-btn-delete" onClick={()=>setDC(c)}>Supprimer</button></div></td></tr>))}</tbody></table></div>)}

          {/* ── SUIVI ── */}
          {tab==="suivi"&&!selectedClient&&(<div className="tl-card"><div className="tl-card-header"><span className="tl-card-title">Suivi des clients</span></div><input className="tl-clients-search" placeholder="Rechercher un client..." value={searchSuivi} onChange={e=>setSearchSuivi(e.target.value)}/>{clientsAvecStats.length===0?<p className="no-comment">Aucun client trouvé.</p>:<div className="suivi-clients-list">{clientsAvecStats.map(c=>(<div key={c._id} className="suivi-client-card" onClick={()=>setSelCl(c)}><div className="suivi-client-header"><div className="suivi-client-left"><div className="tl-client-avatar">{initials(c.prenom,c.nom)}</div><div><div className="suivi-client-name">{c.prenom} {c.nom}</div><div className="suivi-client-email">{c.email}</div></div></div><div className="suivi-client-right">{c.avgNote&&<span className="suivi-note">{c.avgNote}/5</span>}<span className="suivi-total">{c.total} ticket{c.total!==1?"s":""}</span><span className="suivi-pct" style={{color:progressColor(c.pct)}}>{c.pct}%</span></div></div><div className="suivi-progress-bar-bg"><div className="suivi-progress-bar-fill" style={{width:`${c.pct}%`,background:progressColor(c.pct)}}/></div><div className="suivi-mini-stats"><span style={{color:"#16a34a"}}>{c.resolus} résolus</span><span style={{color:"#2563eb"}}>{c.enCours} en cours</span><span style={{color:"#d97706"}}>{c.attente} en attente</span>{c.escalade>0&&<span style={{color:"#dc2626"}}>{c.escalade} escaladés</span>}</div></div>))}</div>}</div>)}
          {tab==="suivi"&&selectedClient&&(<div className="tl-card"><button className="btn-back" onClick={()=>setSelCl(null)}>← Retour au suivi</button><div className="suivi-detail-header"><div className="tl-client-avatar" style={{width:48,height:48,fontSize:16}}>{initials(selectedClient.prenom,selectedClient.nom)}</div><div><h2 style={{fontSize:18,fontWeight:600,color:"#111827",margin:0}}>{selectedClient.prenom} {selectedClient.nom}</h2><p style={{fontSize:12,color:"#9ca3af",margin:"2px 0 0"}}>{selectedClient.email}</p></div><div className="suivi-detail-stats"><div className="suivi-detail-stat"><span style={{fontSize:22,fontWeight:700,color:progressColor(selectedClient.pct)}}>{selectedClient.pct}%</span><span style={{fontSize:11,color:"#9ca3af"}}>Résolution</span></div><div className="suivi-detail-stat"><span style={{fontSize:22,fontWeight:700,color:"#111827"}}>{selectedClient.total}</span><span style={{fontSize:11,color:"#9ca3af"}}>Total</span></div><div className="suivi-detail-stat"><span style={{fontSize:22,fontWeight:700,color:"#16a34a"}}>{selectedClient.resolus}</span><span style={{fontSize:11,color:"#9ca3af"}}>Résolus</span></div>{selectedClient.avgNote&&<div className="suivi-detail-stat"><span style={{fontSize:22,fontWeight:700,color:"#d97706"}}>{selectedClient.avgNote}/5</span><span style={{fontSize:11,color:"#9ca3af"}}>Satisfaction</span></div>}</div></div><div style={{marginBottom:24}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#6b7280",marginBottom:4}}><span>Avancement global</span><span style={{fontWeight:600,color:progressColor(selectedClient.pct)}}>{selectedClient.pct}%</span></div><div className="suivi-progress-bar-bg" style={{height:10}}><div className="suivi-progress-bar-fill" style={{width:`${selectedClient.pct}%`,background:progressColor(selectedClient.pct)}}/></div></div><p style={{fontSize:13,fontWeight:600,color:"#111827",marginBottom:12}}>Tickets ({selectedClient.ticketsClient.length})</p>{selectedClient.ticketsClient.length===0?<p className="no-comment">Aucun ticket.</p>:<div style={{display:"flex",flexDirection:"column",gap:12}}>{selectedClient.ticketsClient.map(t=>{const pct=ticketProgress(t.statut);const color=progressColor(pct);return(<div key={t._id} className="suivi-ticket-item"><div className="suivi-ticket-top"><div style={{display:"flex",alignItems:"center",gap:8}}><span className="tl-ticket-id">{ticketRef(t._id)}</span><span style={{fontSize:13,fontWeight:500,color:"#111827"}}>{t.titre}</span></div><div style={{display:"flex",alignItems:"center",gap:6}}><PrioBadge p={t.priorite}/><StatutBadge s={t.statut}/><span style={{fontSize:12,fontWeight:700,color}}>{pct}%</span></div></div><div className="suivi-progress-bar-bg" style={{marginTop:8}}><div className="suivi-progress-bar-fill" style={{width:`${pct}%`,background:color}}/></div></div>);})}</div>}</div>)}

          {/* ── ANALYSE IA ── */}
          {tab==="ia"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>

              {/* Alert message */}
              {iaMsg.text&&(
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:10,background:iaMsg.type==="success"?"#f0fdf4":"#fef2f2",border:`1px solid ${iaMsg.type==="success"?"#bbf7d0":"#fecaca"}`}}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill={iaMsg.type==="success"?"#15803d":"#b91c1c"}><path fillRule="evenodd" d={iaMsg.type==="success"?D.check:D.x}/></svg>
                  <span style={{fontSize:13,fontWeight:500,color:iaMsg.type==="success"?"#15803d":"#b91c1c"}}>{iaMsg.text}</span>
                </div>
              )}

              {/* KPI stats */}
              {iaStats&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                  {[
                    {label:"Total suggestions", value:iaStats.suggestions?.total||0,    color:"#2563eb", iconD:D.info},
                    {label:"Acceptées",          value:iaStats.suggestions?.acceptees||0, color:"#16a34a", iconD:D.check},
                    {label:"Rejetées",           value:iaStats.suggestions?.rejetees||0,  color:"#dc2626", iconD:D.x},
                    {label:"En attente",         value:iaStats.suggestions?.enAttente||0, color:"#d97706", iconD:D.cpu},
                  ].map((s,i)=>(
                    <div key={i} style={{background:"#fff",border:"1px solid #e5e7eb",borderTop:`2.5px solid ${s.color}`,borderRadius:10,padding:"14px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <span style={{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",color:"#94a3b8"}}>{s.label}</span>
                        <div style={{width:28,height:28,borderRadius:7,background:s.color+"15",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <svg width="13" height="13" viewBox="0 0 16 16" fill={s.color}><path fillRule="evenodd" d={s.iconD}/></svg>
                        </div>
                      </div>
                      <span style={{fontSize:26,fontWeight:700,color:s.color}}>{s.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Performance card */}
              {iaStats?.performance&&(
                <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:"20px 24px",display:"flex",alignItems:"center",gap:32,flexWrap:"wrap"}}>
                  <div style={{display:"flex",alignItems:"center",gap:16}}>
                    <div style={{width:48,height:48,borderRadius:12,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <svg width="22" height="22" viewBox="0 0 16 16" fill="#2563eb"><path fillRule="evenodd" d={D.lightning}/></svg>
                    </div>
                    <div>
                      <p style={{fontSize:12,fontWeight:500,color:"#6b7280",margin:0}}>Temps moyen de réponse IA</p>
                      <p style={{fontSize:30,fontWeight:700,color:"#2563eb",margin:"2px 0 0",lineHeight:1}}>{Math.round((iaStats.performance.tempsMoyenMs||0)/1000)}s</p>
                    </div>
                  </div>
                  <div style={{width:1,height:48,background:"#f1f5f9",flexShrink:0}}/>
                  <div>
                    <p style={{fontSize:12,fontWeight:500,color:"#6b7280",margin:0}}>Tickets traités par l'IA</p>
                    <p style={{fontSize:30,fontWeight:700,color:"#7c3aed",margin:"2px 0 0",lineHeight:1}}>{tickets.filter(t=>t.iaTraite).length} <span style={{fontSize:16,color:"#9ca3af",fontWeight:400}}>/ {tickets.length}</span></p>
                  </div>
                  <div style={{marginLeft:"auto"}}>
                    <div style={{height:8,width:200,background:"#f1f5f9",borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${tickets.length>0?Math.round((tickets.filter(t=>t.iaTraite).length/tickets.length)*100):0}%`,background:"linear-gradient(90deg,#7c3aed,#a855f7)",borderRadius:4}}/>
                    </div>
                    <p style={{fontSize:11,color:"#9ca3af",margin:"4px 0 0",textAlign:"right"}}>{tickets.length>0?Math.round((tickets.filter(t=>t.iaTraite).length/tickets.length)*100):0}% traités</p>
                  </div>
                </div>
              )}

              {/* Tickets non analysés */}
              <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"16px 20px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:32,height:32,borderRadius:8,background:"#fefce8",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="#a16207"><path fillRule="evenodd" d={D.info}/></svg>
                    </div>
                    <div>
                      <p style={{fontSize:14,fontWeight:600,color:"#111827",margin:0}}>Tickets non analysés</p>
                      <p style={{fontSize:12,color:"#9ca3af",margin:0}}>En attente d'analyse IA</p>
                    </div>
                  </div>
                  <span style={{background:"#fefce8",color:"#a16207",border:"1px solid #fde68a",fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:20}}>{tickets.filter(t=>!t.iaTraite).length} tickets</span>
                </div>
                {tickets.filter(t=>!t.iaTraite).length===0?(
                  <div style={{padding:"32px",textAlign:"center"}}>
                    <svg width="32" height="32" viewBox="0 0 16 16" fill="#16a34a" style={{marginBottom:8}}><path fillRule="evenodd" d={D.check}/></svg>
                    <p style={{fontSize:13,color:"#15803d",margin:0,fontWeight:500}}>Tous les tickets ont été analysés</p>
                  </div>
                ):(
                  <div>
                    {tickets.filter(t=>!t.iaTraite).slice(0,10).map((t,i)=>{
                      const isLoading=iaLoadingSet.has(t._id);
                      return(
                        <div key={t._id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:i<Math.min(9,tickets.filter(x=>!x.iaTraite).length-1)?"1px solid #f9fafb":"none",gap:12}}>
                          <div style={{display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0}}>
                            <span style={{fontSize:11,fontWeight:600,color:"#9ca3af",fontFamily:"monospace",flexShrink:0}}>{ticketRef(t._id)}</span>
                            <div style={{minWidth:0}}>
                              <p style={{fontSize:13,fontWeight:500,color:"#111827",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.titre}</p>
                              <p style={{fontSize:11,color:"#9ca3af",margin:"2px 0 0"}}>{t.reporter?.prenom} {t.reporter?.nom} · {fmtDate(t.createdAt)}</p>
                            </div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                            <PrioBadge p={t.priorite}/>
                            <button onClick={()=>lancerAnalyseIA(t._id)} disabled={isLoading}
                              style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",border:"none",borderRadius:8,background:isLoading?"#e5e7eb":"#1d4ed8",color:isLoading?"#9ca3af":"#fff",fontSize:12,fontWeight:600,cursor:isLoading?"not-allowed":"pointer",transition:"background .15s"}}>
                              {isLoading?(
                                <><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{animation:"spin 1s linear infinite"}}><path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>Analyse...</>
                              ):(
                                <><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d={D.cpu}/></svg>Analyser</>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tickets analysés */}
              <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"16px 20px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:32,height:32,borderRadius:8,background:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="#15803d"><path fillRule="evenodd" d={D.check}/></svg>
                    </div>
                    <div>
                      <p style={{fontSize:14,fontWeight:600,color:"#111827",margin:0}}>Tickets analysés</p>
                      <p style={{fontSize:12,color:"#9ca3af",margin:0}}>Cliquer pour voir les suggestions</p>
                    </div>
                  </div>
                  <span style={{background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0",fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:20}}>{tickets.filter(t=>t.iaTraite).length} tickets</span>
                </div>
                {tickets.filter(t=>t.iaTraite).length===0?(
                  <div style={{padding:"32px",textAlign:"center"}}><p style={{fontSize:13,color:"#9ca3af",margin:0}}>Aucun ticket analysé pour le moment</p></div>
                ):(
                  <div>
                    {tickets.filter(t=>t.iaTraite).map((t,i,arr)=>(
                      <div key={t._id} onClick={()=>ouvrirPanelIA(t)}
                        style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",padding:"14px 20px",borderBottom:i<arr.length-1?"1px solid #f9fafb":"none",gap:12,cursor:"pointer",transition:"background .12s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f8faff"}
                        onMouseLeave={e=>e.currentTarget.style.background=""}>
                        <div style={{display:"flex",alignItems:"flex-start",gap:12,flex:1,minWidth:0}}>
                          <span style={{fontSize:11,fontWeight:600,color:"#9ca3af",fontFamily:"monospace",flexShrink:0,marginTop:2}}>{ticketRef(t._id)}</span>
                          <div style={{minWidth:0}}>
                            <p style={{fontSize:13,fontWeight:500,color:"#111827",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.titre}</p>
                            <p style={{fontSize:11,color:"#9ca3af",margin:"2px 0 0"}}>{t.reporter?.prenom} {t.reporter?.nom} · {fmtDate(t.createdAt)}</p>
                            {t.resumeIa&&<p style={{fontSize:11,color:"#6b7280",margin:"4px 0 0",lineHeight:1.5,fontStyle:"italic"}}>{t.resumeIa}</p>}
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
                          <PrioBadge p={t.priorite}/>
                          {t.sentimentClient&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:6,background:sentimentBg(t.sentimentClient),color:sentimentFg(t.sentimentClient),fontWeight:500}}>{sentimentLabel(t.sentimentClient)}</span>}
                          {t.categorieIa&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:6,background:"#eff6ff",color:"#1d4ed8",border:"1px solid #bfdbfe",fontWeight:500}}>{t.categorieIa}</span>}
                          {t.prioriteIa&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:6,background:"#f5f3ff",color:"#6d28d9",border:"1px solid #ede9fe",fontWeight:500}}>IA · {t.prioriteIa}</span>}
                          {t.assigneAutomatiquement&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:6,background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0",fontWeight:500}}>Auto-assigné</span>}
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="#9ca3af"><path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Panel suggestions (drawer) ── */}
              {selIaTicket&&(
                <div style={{position:"fixed",inset:0,zIndex:9000,background:"rgba(15,23,42,0.5)",display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}
                  onClick={e=>{if(e.target===e.currentTarget)fermerPanelIA();}}>
                  <div style={{width:560,height:"100vh",background:"#fff",boxShadow:"-12px 0 48px rgba(0,0,0,0.2)",display:"flex",flexDirection:"column",animation:"slideIn .22s ease"}}>

                    {/* Header */}
                    <div style={{padding:"20px 24px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:36,height:36,borderRadius:10,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="#2563eb"><path fillRule="evenodd" d={D.cpu}/></svg>
                          </div>
                          <div>
                            <p style={{fontSize:15,fontWeight:700,color:"#111827",margin:0}}>Suggestions IA</p>
                            <p style={{fontSize:11,color:"#9ca3af",margin:0}}>{iaSuggestions.length} suggestion{iaSuggestions.length!==1?"s":""}</p>
                          </div>
                        </div>
                        <button onClick={fermerPanelIA} style={{width:32,height:32,borderRadius:8,border:"1px solid #e5e7eb",background:"#f9fafb",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="#6b7280"><path fillRule="evenodd" d={D.x}/></svg>
                        </button>
                      </div>
                      {/* Ticket info */}
                      <div style={{background:"#f9fafb",borderRadius:10,padding:"12px 14px",border:"1px solid #f1f5f9"}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                          <span style={{fontSize:11,fontFamily:"monospace",fontWeight:600,color:"#6b7280"}}>{ticketRef(selIaTicket._id)}</span>
                          <PrioBadge p={selIaTicket.priorite}/>
                          {selIaTicket.sentimentClient&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:6,background:sentimentBg(selIaTicket.sentimentClient),color:sentimentFg(selIaTicket.sentimentClient),fontWeight:500}}>{sentimentLabel(selIaTicket.sentimentClient)}</span>}
                          {selIaTicket.categorieIa&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:6,background:"#eff6ff",color:"#1d4ed8",border:"1px solid #bfdbfe",fontWeight:500}}>{selIaTicket.categorieIa}</span>}
                        </div>
                        <p style={{fontSize:13,fontWeight:600,color:"#111827",margin:"0 0 4px"}}>{selIaTicket.titre}</p>
                        {selIaTicket.resumeIa&&<p style={{fontSize:12,color:"#6b7280",margin:0,lineHeight:1.5}}>{selIaTicket.resumeIa}</p>}
                      </div>
                    </div>

                    {/* Suggestions list */}
                    <div style={{flex:1,overflowY:"auto",padding:"16px 24px",display:"flex",flexDirection:"column",gap:12}}>
                      {iaSugLoading&&(
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 0",gap:12}}>
                          <div style={{width:40,height:40,borderRadius:10,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <svg width="20" height="20" viewBox="0 0 16 16" fill="#2563eb" style={{animation:"spin 1s linear infinite"}}><path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>
                          </div>
                          <p style={{fontSize:13,color:"#9ca3af",margin:0}}>Chargement des suggestions...</p>
                        </div>
                      )}
                      {!iaSugLoading&&iaSugError&&(
                        <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"16px",borderRadius:10,background:"#fef2f2",border:"1px solid #fecaca"}}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="#b91c1c" style={{flexShrink:0,marginTop:1}}><path fillRule="evenodd" d={D.info}/></svg>
                          <div>
                            <p style={{fontSize:13,fontWeight:600,color:"#b91c1c",margin:"0 0 4px"}}>Impossible de charger les suggestions</p>
                            <p style={{fontSize:12,color:"#b91c1c",margin:0,opacity:.8}}>{iaSugError}</p>
                            <button onClick={()=>fetchIaSuggestions(selIaTicket._id)} style={{marginTop:8,padding:"6px 12px",border:"1px solid #fecaca",borderRadius:6,background:"#fff",color:"#b91c1c",fontSize:12,cursor:"pointer",fontWeight:500}}>Réessayer</button>
                          </div>
                        </div>
                      )}
                      {!iaSugLoading&&!iaSugError&&iaSuggestions.map(sug=>{
                        const cfg=SUG_CFG[sug.type]||{iconD:D.info,label:sug.type,accent:"#374151",bg:"#f9fafb",border:"#e5e7eb"};
                        const isAccepted=sug.statut==="acceptee";
                        const isRejected=sug.statut==="rejetee";
                        return(
                          <div key={sug._id} style={{border:`1px solid ${cfg.border}`,borderRadius:12,overflow:"hidden",opacity:isRejected?0.6:1,transition:"opacity .2s"}}>
                            {/* Suggestion header */}
                            <div style={{padding:"12px 16px",background:cfg.bg,borderBottom:`1px solid ${cfg.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{width:28,height:28,borderRadius:7,background:"#fff",border:`1px solid ${cfg.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                                  <svg width="13" height="13" viewBox="0 0 16 16" fill={cfg.accent}><path fillRule="evenodd" d={cfg.iconD}/></svg>
                                </div>
                                <span style={{fontSize:12,fontWeight:700,color:cfg.accent,textTransform:"uppercase",letterSpacing:".05em"}}>{cfg.label}</span>
                              </div>
                              {sug.scoreConfiance!=null&&(
                                <span style={{fontSize:11,fontWeight:600,color:cfg.accent,background:"#fff",padding:"3px 10px",borderRadius:20,border:`1px solid ${cfg.border}`}}>
                                  {Math.round(sug.scoreConfiance*100)}% confiance
                                </span>
                              )}
                            </div>
                            {/* Contenu */}
                            <div style={{padding:"14px 16px",background:"#fff"}}>
                              <p style={{fontSize:13,color:"#374151",margin:"0 0 14px",lineHeight:1.7,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{sug.contenu}</p>
                              {/* Actions */}
                              {!isAccepted&&!isRejected?(
                                <div style={{display:"flex",gap:8}}>
                                  <button onClick={()=>validerSuggestion(sug._id,"acceptee")}
                                    style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px",border:"none",borderRadius:8,background:"#16a34a",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d={D.check}/></svg>
                                    Accepter
                                  </button>
                                  <button onClick={()=>validerSuggestion(sug._id,"rejetee")}
                                    style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px",border:"1px solid #fecaca",borderRadius:8,background:"#fef2f2",color:"#b91c1c",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d={D.x}/></svg>
                                    Rejeter
                                  </button>
                                </div>
                              ):(
                                <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,background:isAccepted?"#f0fdf4":"#fef2f2",border:`1px solid ${isAccepted?"#bbf7d0":"#fecaca"}`}}>
                                  <svg width="13" height="13" viewBox="0 0 16 16" fill={isAccepted?"#15803d":"#b91c1c"}><path fillRule="evenodd" d={isAccepted?D.check:D.x}/></svg>
                                  <span style={{fontSize:12,fontWeight:600,color:isAccepted?"#15803d":"#b91c1c"}}>{isAccepted?"Suggestion acceptée":"Suggestion rejetée"}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer */}
                    <div style={{padding:"16px 24px",borderTop:"1px solid #f1f5f9",flexShrink:0}}>
                      <button onClick={fermerPanelIA} style={{width:"100%",padding:"10px",border:"1px solid #e5e7eb",borderRadius:8,background:"#f9fafb",cursor:"pointer",fontSize:13,color:"#374151",fontWeight:500}}>Fermer</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CRÉER CLIENT ── */}
          {tab==="creer-client"&&(<div className="tl-card"><span className="tl-card-title" style={{display:"block",marginBottom:4}}>Créer un compte client</span><p className="card-subtitle">Un mot de passe temporaire sera envoyé par email.</p>{serverErr&&<div className="alert alert-error">{serverErr}</div>}{serverMsg&&<div className="alert alert-success">{serverMsg}</div>}<form onSubmit={createClient} noValidate><div className="form-row"><div className="form-group"><label>Prénom <span className="req">*</span></label><input className="form-input" placeholder="Prénom" value={formClient.prenom} onChange={e=>setFC({...formClient,prenom:e.target.value})}/></div><div className="form-group"><label>Nom <span className="req">*</span></label><input className="form-input" placeholder="Nom" value={formClient.nom} onChange={e=>setFC({...formClient,nom:e.target.value})}/></div></div><div className="form-group"><label>Email <span className="req">*</span></label><input type="email" className="form-input" placeholder="client@exemple.com" value={formClient.email} onChange={e=>setFC({...formClient,email:e.target.value})}/></div><div className="form-group"><label>Téléphone <span className="req">*</span></label><input className="form-input" placeholder="+216 XX XXX XXX" value={formClient.telephone} onChange={e=>setFC({...formClient,telephone:e.target.value})}/></div><div className="info-box"><span>Sécurité</span><p>Un mot de passe temporaire sera généré et envoyé au client.</p></div><button type="submit" className="btn-primary">Créer le compte client</button></form></div>)}

        </div>
      </main>

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin    { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}