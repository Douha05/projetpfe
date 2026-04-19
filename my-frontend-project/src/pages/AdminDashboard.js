import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import BIDashboard from "./BIDashboard";

const API = "http://localhost:3001/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const getUser = () => { const u = localStorage.getItem("user") || sessionStorage.getItem("user"); return u ? JSON.parse(u) : null; };
const initials = (p, n) => `${p?.[0] || ""}${n?.[0] || ""}`.toUpperCase();
const fmtDate = (d) => { if (!d) return "—"; return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) + " · " + new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); };
const RoleBadge = ({ role }) => { const map = { admin: { label: "Admin", cls: "role-admin" }, team_lead: { label: "Chef d'équipe", cls: "role-lead" }, support: { label: "Support", cls: "role-support" }, client: { label: "Client", cls: "role-client" } }; const r = map[role] || { label: role, cls: "role-client" }; return <span className={`role-badge ${r.cls}`}>{r.label}</span>; };

const STATUT_LABELS = { ready_for_support: "En attente", in_progress: "En cours", ready_for_customer: "À confirmer", solved: "Résolu", closed: "Fermé", cancelled: "Annulé", escalated: "Escaladé" };
const ROLE_LABELS   = { admin: "Admin", team_lead: "Chef d'équipe", support: "Agent support", client: "Client" };
const ALL_ROLES     = ["admin", "team_lead", "support", "client"];
const PRIO_MAP      = { low: { label: "Faible" }, medium: { label: "Moyen" }, high: { label: "Haute" }, critical: { label: "Critique" } };

const minutesToHM = (t) => { if (!t && t !== 0) return { heures: "", minutes: "" }; return { heures: Math.floor(t/60)>0?String(Math.floor(t/60)):"", minutes: t%60>0?String(t%60):"" }; };
const hmToMinutes = (h, m) => { const hh=parseInt(h)||0, mm=parseInt(m)||0; if(hh===0&&mm===0) return null; return hh*60+mm; };
const formatDelai = (t) => { if (!t) return null; const h=Math.floor(t/60), m=t%60; if(h>0&&m>0) return `${h}h ${m}min`; if(h>0) return `${h}h`; return `${m}min`; };
const getFeedbackStyle = (n) => { if(n>=4) return {background:"#EAF3DE",color:"#3B6D11",border:"2px solid #639922"}; if(n===3) return {background:"#FAEEDA",color:"#854F0B",border:"2px solid #EF9F27"}; return {background:"#FCEBEB",color:"#A32D2D",border:"2px solid #E24B4A"}; };

const SLA_DEFAUTS = { critical: 4, high: 8, medium: 24, low: 72 };

const HIST_CONFIG = {
  auto_escalated: { label: "Escalade automatique", bg: "#FCEBEB", border: "#F7C1C1", color: "#791F1F", dotBg: "#FCEBEB", dotBorder: "#F7C1C1" },
  sla_breach:     { label: "SLA dépassé",          bg: "#FCEBEB", border: "#F7C1C1", color: "#791F1F", dotBg: "#FCEBEB", dotBorder: "#F7C1C1" },
  sla_warning:    { label: "Rappel inactivité",     bg: "#FAEEDA", border: "#FAC775", color: "#633806", dotBg: "#FAEEDA", dotBorder: "#FAC775" },
  auto_closed:    { label: "Fermeture automatique", bg: "#EAF3DE", border: "#C0DD97", color: "#27500A", dotBg: "#EAF3DE", dotBorder: "#C0DD97" },
  default:        { label: "Action",                bg: "#E6F1FB", border: "#B5D4F4", color: "#0C447C", dotBg: "#E6F1FB", dotBorder: "#B5D4F4" },
};

const IconApp      = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.5A1.5 1.5 0 0 1 3 2h9.982a1.5 1.5 0 0 1 1.498 1.5v2.5a.5.5 0 0 1-.5.5 1 1 0 0 0 0 2 .5.5 0 0 1 .5.5v2.5A1.5 1.5 0 0 1 12.982 13H3A1.5 1.5 0 0 1 1.5 11.5V8a.5.5 0 0 1 .5-.5 1 1 0 1 0 0-2 .5.5 0 0 1-.5-.5V3.5z"/></svg>;
const IconUserPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>;
const IconClientAdd= () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="3" x2="19" y2="9"/><line x1="22" y1="6" x2="16" y2="6"/></svg>;
const IconUsers    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconWorkflow = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="9.5" y="16" width="5" height="5" rx="1"/><path d="M5.5 8v3a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8"/><line x1="12" y1="13" x2="12" y2="16"/></svg>;
const IconBell     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IconSla      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconLogout   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconAnalytics = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>);
const IconIA       = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="3"/></svg>);

const NAV_ITEMS = [
  { id: "creer-personnel", label: "Créer personnel", Icon: IconUserPlus },
  { id: "creer-client",    label: "Créer client",    Icon: IconClientAdd },
  { id: "users",           label: "Utilisateurs",    Icon: IconUsers },
  { id: "workflow",        label: "Workflow",         Icon: IconWorkflow },
  { id: "sla",             label: "SLA",              Icon: IconSla },
  { id: "analytics",       label: "Analytics",        Icon: IconAnalytics },
  { id: "ia-admin",        label: "Analyse IA",       Icon: IconIA },
  { id: "demandes",        label: "Demandes reset",   Icon: IconBell, badge: true },
];

const PAGE_TITLES = {
  "creer-personnel": { title: "Administration", sub: "Créer un compte personnel" },
  "creer-client":    { title: "Administration", sub: "Créer un compte client" },
  "users":           { title: "Utilisateurs",   sub: "Gestion des comptes" },
  "workflow":        { title: "Workflow",        sub: "Configuration des transitions" },
  "sla":             { title: "SLA",             sub: "Configuration & suivi des délais de résolution" },
  "analytics":       { title: "Analytics",       sub: "Tableau de bord & statistiques" },
  "ia-admin":        { title: "Analyse IA",      sub: "Tableau de bord IA global — Suggestions — Monitoring" },
  "demandes":        { title: "Demandes reset",  sub: "Réinitialisation de mots de passe" },
};

// ============================================================
// COMPOSANT SLA (inchangé)
// ============================================================
function SlaPage({ token }) {
  const [tickets,setTickets]=useState([]); const [loading,setLoading]=useState(true);
  const [slaConfig,setSlaConfig]=useState({...SLA_DEFAUTS}); const [saveMsg,setSaveMsg]=useState(""); const [saveErr,setSaveErr]=useState("");
  const [kpiActif,setKpiActif]=useState(null); const [showTous,setShowTous]=useState(false);

  useEffect(()=>{fetchTickets();fetchSlaConfig();},[]);
  const fetchTickets = () => { setLoading(true); fetch(`${API}/tickets/tous`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setTickets(d.tickets);}).finally(()=>setLoading(false)); };
  const fetchSlaConfig = () => { fetch(`${API}/workflow/sla-config`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setSlaConfig(d.slaConfig);}).catch(()=>{}); };

  const maintenant=new Date();
  const actifs=tickets.filter(t=>!["solved","closed","cancelled"].includes(t.statut));
  const resolus=tickets.filter(t=>["solved","closed"].includes(t.statut));
  const respectes=resolus.filter(t=>t.slaRespect===true);
  const depasses=actifs.filter(t=>t.slaBreached===true);
  const enDanger=actifs.filter(t=>{if(!t.slaDeadline)return false;const r=(new Date(t.slaDeadline)-maintenant)/60000;return r>0&&r<=60;});
  const tauxSla=resolus.length>0?Math.round((respectes.length/resolus.length)*100):null;
  const ticketsDepasses=actifs.filter(t=>t.slaBreached).sort((a,b)=>(b.slaPourcentage||0)-(a.slaPourcentage||0));
  const ticketsFiltresKpi=kpiActif==="depasses"?ticketsDepasses:kpiActif==="danger"?enDanger:kpiActif==="actifs"?actifs:kpiActif==="resolus"?resolus:null;

  const handleSaveSla=async()=>{setSaveMsg("");setSaveErr("");for(const[k,v]of Object.entries(slaConfig)){if(!v||isNaN(v)||v<=0){setSaveErr(`Le délai pour "${k}" doit être supérieur à 0.`);return;}}try{const res=await fetch(`${API}/workflow/sla-config`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(slaConfig)});const data=await res.json();if(data.status==="ok"){setSaveMsg("✅ Configuration SLA enregistrée !");setTimeout(()=>setSaveMsg(""),2000);}else setSaveErr(data.msg||"Erreur lors de la sauvegarde.");}catch{setSaveErr("Erreur de connexion au serveur.");}};

  const PRIO_CONFIG=[{key:"critical",label:"Critique",color:"#A32D2D",bg:"#FCEBEB",desc:"Bloque complètement le travail"},{key:"high",label:"Haute",color:"#854F0B",bg:"#FAEEDA",desc:"Problème urgent"},{key:"medium",label:"Moyen",color:"#0C447C",bg:"#E6F1FB",desc:"Problème normal"},{key:"low",label:"Faible",color:"#3B6D11",bg:"#EAF3DE",desc:"Amélioration mineure"}];
  const kpiCards=[{id:"resolus",label:"Taux SLA global",val:tauxSla!==null?`${tauxSla}%`:"—",color:tauxSla>=80?"#3B6D11":tauxSla>=60?"#854F0B":"#A32D2D",borderColor:tauxSla>=80?"#16a34a":tauxSla>=60?"#d97706":"#dc2626",sub:`${respectes.length}/${resolus.length} tickets résolus`},{id:"depasses",label:"SLA dépassés actifs",val:depasses.length,color:depasses.length>0?"#A32D2D":"#3B6D11",borderColor:depasses.length>0?"#dc2626":"#16a34a",sub:"tickets en retard"},{id:"danger",label:"Tickets en danger",val:enDanger.length,color:enDanger.length>0?"#854F0B":"#3B6D11",borderColor:enDanger.length>0?"#d97706":"#16a34a",sub:"expire dans < 1h"},{id:"actifs",label:"Total tickets actifs",val:actifs.length,color:"#1d4ed8",borderColor:"#2563eb",sub:"en cours de traitement"}];
  const ticketsAffiches=showTous?ticketsDepasses:ticketsDepasses.slice(0,6);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {kpiCards.map(k=>(
          <div key={k.id} onClick={()=>setKpiActif(kpiActif===k.id?null:k.id)} style={{background:"var(--color-background-primary)",border:kpiActif===k.id?`2px solid ${k.borderColor}`:"0.5px solid var(--color-border-tertiary)",borderRadius:8,padding:14,cursor:"pointer",transition:"all 0.15s",boxShadow:kpiActif===k.id?`0 0 0 3px ${k.borderColor}22`:"none"}}>
            <p style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:4}}>{k.label}</p>
            <p style={{fontSize:24,fontWeight:500,color:k.color}}>{k.val}</p>
            <p style={{fontSize:10,color:"var(--color-text-secondary)",marginTop:2}}>{k.sub}</p>
            <p style={{fontSize:10,color:k.borderColor,marginTop:4,fontWeight:500}}>{kpiActif===k.id?"▲ Cliquer pour fermer":"▼ Cliquer pour voir"}</p>
          </div>
        ))}
      </div>
      {kpiActif&&ticketsFiltresKpi&&(
        <div className="ad-card" style={{margin:0}}>
          <div className="ad-card-header">
            <div><h2 className="ad-card-title">{kpiActif==="depasses"&&`Tickets SLA dépassés (${ticketsFiltresKpi.length})`}{kpiActif==="danger"&&`Tickets en danger (${ticketsFiltresKpi.length})`}{kpiActif==="actifs"&&`Tous les tickets actifs (${ticketsFiltresKpi.length})`}{kpiActif==="resolus"&&`Tickets résolus (${ticketsFiltresKpi.length})`}</h2>
            <p className="ad-card-subtitle" style={{marginBottom:0}}>{kpiActif==="depasses"&&"Tickets dont le SLA est dépassé"}{kpiActif==="danger"&&"Tickets dont le SLA expire dans moins d'1h"}{kpiActif==="actifs"&&"Tickets en cours de traitement"}{kpiActif==="resolus"&&"Tickets résolus ou fermés"}</p></div>
            <button className="btn-cancel" onClick={()=>setKpiActif(null)}>Fermer ✕</button>
          </div>
          {ticketsFiltresKpi.length===0?<p style={{fontSize:13,color:"#3B6D11",marginTop:16}}>✅ Aucun ticket dans cette catégorie.</p>:(
            <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:8}}>
              {ticketsFiltresKpi.map(t=>{const prio=PRIO_MAP[t.priorite]||{label:t.priorite};const pc=PRIO_CONFIG.find(p=>p.key===t.priorite);return(
                <div key={t._id} style={{padding:"10px 14px",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                  <div style={{flex:1}}><p style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)",marginBottom:2}}>{t.titre}</p><p style={{fontSize:11,color:"var(--color-text-secondary)"}}>{t.reporter?.prenom} {t.reporter?.nom}{t.assignee?` · ${t.assignee.prenom} ${t.assignee.nom}`:" · Non assigné"}{t.slaDepuisMinutes?` · ${t.slaDepuisMinutes}min`:""}</p></div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                    <span style={{fontSize:10,padding:"2px 7px",borderRadius:4,background:pc?.bg||"#f3f4f6",color:pc?.color||"#374151",fontWeight:500}}>{prio.label}</span>
                    <span style={{fontSize:10,padding:"2px 7px",borderRadius:4,background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",color:"var(--color-text-secondary)"}}>{STATUT_LABELS[t.statut]||t.statut}</span>
                  </div>
                </div>
              );})}
            </div>
          )}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div className="ad-card" style={{margin:0}}>
          <div className="ad-card-header"><div><h2 className="ad-card-title">Configuration des délais SLA</h2><p className="ad-card-subtitle" style={{marginBottom:0}}>Délai maximum de résolution par priorité</p></div><button className="btn-save" onClick={handleSaveSla}>Enregistrer</button></div>
          {saveMsg&&<div className="alert alert-success" style={{marginTop:12}}>{saveMsg}</div>}
          {saveErr&&<div className="alert alert-error" style={{marginTop:12}}>{saveErr}</div>}
          <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:12}}>
            {PRIO_CONFIG.map(p=>(
              <div key={p.key} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"var(--color-background-secondary)",borderRadius:8,border:"0.5px solid var(--color-border-tertiary)"}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:p.color,flexShrink:0}}/>
                <div style={{flex:1}}><p style={{fontSize:12,fontWeight:500,color:"var(--color-text-primary)"}}>{p.label}</p><p style={{fontSize:11,color:"var(--color-text-secondary)"}}>{p.desc}</p></div>
                <input type="number" min="1" value={slaConfig[p.key]||""} onChange={e=>setSlaConfig({...slaConfig,[p.key]:parseInt(e.target.value)||""})} style={{width:64,border:"0.5px solid var(--color-border-secondary)",borderRadius:6,padding:"4px 8px",fontSize:13,color:"var(--color-text-primary)",background:"var(--color-background-primary)",textAlign:"center"}}/>
                <span style={{fontSize:11,color:"var(--color-text-secondary)",minWidth:32}}>heures</span>
              </div>
            ))}
          </div>
        </div>
        <div className="ad-card" style={{margin:0}}>
          <div className="ad-card-header"><div><h2 className="ad-card-title">Tickets SLA dépassés</h2><p className="ad-card-subtitle" style={{marginBottom:0}}>{ticketsDepasses.length} ticket{ticketsDepasses.length!==1?"s":""} en retard</p></div></div>
          {loading?<div className="loading">Chargement...</div>:ticketsDepasses.length===0?(<div className="empty-state" style={{marginTop:16}}><p style={{fontSize:13,color:"#3B6D11"}}>✅ Aucun ticket SLA dépassé !</p></div>):(
            <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:8}}>
              {ticketsAffiches.map(t=>{const prio=PRIO_MAP[t.priorite]||{label:t.priorite};const depassMin=t.slaDepuisMinutes&&t.slaDelaiMinutes?Math.max(0,t.slaDepuisMinutes-t.slaDelaiMinutes):null;return(
                <div key={t._id} style={{padding:"10px 12px",background:"#fff8f8",border:"0.5px solid #fecaca",borderRadius:8,borderLeft:"3px solid #E24B4A"}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                    <div style={{flex:1}}><p style={{fontSize:12,fontWeight:500,color:"var(--color-text-primary)",marginBottom:2}}>{t.titre}</p><p style={{fontSize:11,color:"var(--color-text-secondary)"}}>{t.reporter?.prenom} {t.reporter?.nom}{t.assignee?` · ${t.assignee.prenom} ${t.assignee.nom}`:" · Non assigné"}</p></div>
                    <span style={{fontSize:10,padding:"2px 7px",borderRadius:4,background:PRIO_CONFIG.find(p=>p.key===t.priorite)?.bg||"#f3f4f6",color:PRIO_CONFIG.find(p=>p.key===t.priorite)?.color||"#374151",fontWeight:500,flexShrink:0}}>{prio.label}</span>
                  </div>
                  <div style={{marginTop:8}}><div style={{height:4,borderRadius:2,background:"rgba(0,0,0,0.08)",overflow:"hidden"}}><div style={{height:"100%",width:"100%",background:"#E24B4A",borderRadius:2}}/></div><p style={{fontSize:10,color:"#A32D2D",marginTop:3,fontWeight:500}}>✕ SLA dépassé{depassMin?` de ${depassMin}min`:""}</p></div>
                </div>
              );})}
              {ticketsDepasses.length>6&&(<button onClick={()=>setShowTous(!showTous)} style={{width:"100%",padding:"8px 0",fontSize:12,fontWeight:500,color:"#2563eb",background:"#eff6ff",border:"0.5px solid #bfdbfe",borderRadius:8,cursor:"pointer",marginTop:4}}>{showTous?"▲ Réduire la liste":`▼ Voir les ${ticketsDepasses.length-6} autres tickets dépassés`}</button>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// NOUVEAU COMPOSANT : PAGE ANALYSE IA ADMIN (Option D)
// ============================================================
function IaAdminPage({ token }) {
  const [iaStats,      setIaStats]      = useState(null);
  const [tickets,      setTickets]      = useState([]);
  const [suggestions,  setSuggestions]  = useState([]);
  const [logs,         setLogs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [iaMsg,        setIaMsg]        = useState("");
  const [filterSug,    setFilterSug]    = useState("tous");
  const [filterType,   setFilterType]   = useState("tous");
  const [iaLoadingId,  setIaLoadingId]  = useState(null);
  const [section,      setSection]      = useState("dashboard");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        fetch(`${API}/ia/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/tickets/tous`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const statsData   = await statsRes.json();
      const ticketsData = await ticketsRes.json();
      if (statsData)          setIaStats(statsData);
      if (ticketsData.status === "ok") setTickets(ticketsData.tickets);

      // Fetch suggestions pour tous les tickets analysés
      const ticketsAnalyses = (ticketsData.tickets || []).filter(t => t.iaTraite);
      const allSuggestions = [];
      const allLogs = [];
      await Promise.all(ticketsAnalyses.slice(0, 20).map(async (t) => {
        try {
          const sugRes = await fetch(`${API}/ia/suggestions/${t._id}`, { headers: { Authorization: `Bearer ${token}` } });
          const sugData = await sugRes.json();
          if (sugData.suggestions) {
            sugData.suggestions.forEach(s => allSuggestions.push({ ...s, ticket: t }));
          }
        } catch {}
        try {
          const logRes = await fetch(`${API}/ia/logs/${t._id}`, { headers: { Authorization: `Bearer ${token}` } });
          const logData = await logRes.json();
          if (logData.logs) {
            logData.logs.forEach(l => allLogs.push({ ...l, ticket: t }));
          }
        } catch {}
      }));
      setSuggestions(allSuggestions);
      setLogs(allLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch {}
    finally { setLoading(false); }
  };

  const lancerAnalyse = async (ticketId) => {
    setIaLoadingId(ticketId);
    setIaMsg("");
    try {
      const res = await fetch(`${API}/ia/analyser/${ticketId}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      if (d.succes || d.analyse) {
        setIaMsg("✅ Analyse terminée !");
        fetchAll();
      } else {
        setIaMsg("❌ Erreur : " + (d.message || d.erreur || "Inconnue"));
      }
    } catch { setIaMsg("❌ Erreur réseau"); }
    finally {
      setIaLoadingId(null);
      setTimeout(() => setIaMsg(""), 4000);
    }
  };

  const ticketsAnalyses    = tickets.filter(t => t.iaTraite);
  const ticketsNonAnalyses = tickets.filter(t => !t.iaTraite);
  const totalSug           = suggestions.length;
  const acceptees          = suggestions.filter(s => s.statut === "acceptee").length;
  const rejetees           = suggestions.filter(s => s.statut === "rejetee").length;
  const enAttente          = suggestions.filter(s => s.statut === "en_attente").length;
  const ignorees           = suggestions.filter(s => !s.statut || s.statut === "ignoree").length;
  const tauxAcceptation    = totalSug > 0 ? Math.round((acceptees / totalSug) * 100) : 0;
  const tempsMoyen         = iaStats?.performance?.tempsMoyenMs ? Math.round(iaStats.performance.tempsMoyenMs / 1000) : null;

  const SUG_TYPES = { analyse: "Analyse", priorite: "Priorité", assignation: "Assignation", reponse_auto: "Réponse auto" };
  const SUG_COLORS = {
    analyse:      { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    priorite:     { bg: "#fefce8", color: "#a16207", border: "#fde68a" },
    assignation:  { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
    reponse_auto: { bg: "#fdf4ff", color: "#7e22ce", border: "#e9d5ff" },
  };

  const sugsFiltrees = suggestions.filter(s => {
    const matchStatut = filterSug === "tous" ? true
      : filterSug === "ignorees" ? (!s.statut || s.statut === "ignoree")
      : s.statut === filterSug;
    const matchType = filterType === "tous" ? true : s.type === filterType;
    return matchStatut && matchType;
  });

  // Performance par type
  const perfParType = Object.keys(SUG_TYPES).map(type => {
    const total  = suggestions.filter(s => s.type === type).length;
    const acc    = suggestions.filter(s => s.type === type && s.statut === "acceptee").length;
    const taux   = total > 0 ? Math.round((acc / total) * 100) : 0;
    return { type, label: SUG_TYPES[type], total, acc, taux };
  });

  const SECTIONS = [
    { id: "dashboard", label: "A — Tableau de bord" },
    { id: "suggestions", label: "B — Suggestions" },
    { id: "monitoring", label: "C — Monitoring" },
  ];

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
      <p style={{ fontSize: 32, marginBottom: 12 }}>🤖</p>
      <p style={{ fontSize: 13 }}>Chargement des données IA...</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {iaMsg && (
        <div className={`alert ${iaMsg.startsWith("✅") ? "alert-success" : "alert-error"}`}>{iaMsg}</div>
      )}

      {/* Tabs sections */}
      <div style={{ display: "flex", gap: 4, borderBottom: "0.5px solid var(--color-border-tertiary)", marginBottom: 4 }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            padding: "10px 16px", fontSize: 12, fontWeight: section === s.id ? 500 : 400,
            color: section === s.id ? "#185FA5" : "#888",
            background: "none", border: "none",
            borderBottom: section === s.id ? "2px solid #378ADD" : "2px solid transparent",
            cursor: "pointer", transition: "all .15s"
          }}>{s.label}</button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
          <button onClick={fetchAll} style={{
            fontSize: 11, padding: "5px 12px", borderRadius: 20,
            border: "0.5px solid var(--color-border-tertiary)",
            background: "var(--color-background-secondary)",
            color: "var(--color-text-secondary)", cursor: "pointer"
          }}>🔄 Actualiser</button>
        </div>
      </div>

      {/* ══ SECTION A — TABLEAU DE BORD ══ */}
      {section === "dashboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Total analyses IA", value: ticketsAnalyses.length, color: "#7c3aed", sub: `sur ${tickets.length} tickets` },
              { label: "Taux acceptation",  value: `${tauxAcceptation}%`,  color: "#16a34a", sub: `${acceptees} suggestions` },
              { label: "Taux rejet",        value: totalSug > 0 ? `${Math.round((rejetees/totalSug)*100)}%` : "—", color: "#dc2626", sub: `${rejetees} rejetées` },
              { label: "Temps moyen",       value: tempsMoyen ? `${tempsMoyen}s` : "—", color: "#2563eb", sub: "par analyse" },
            ].map((k, i) => (
              <div key={i} style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "14px 16px", borderTop: `3px solid ${k.color}` }}>
                <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 6px" }}>{k.label}</p>
                <p style={{ fontSize: 24, fontWeight: 500, margin: 0, color: k.color }}>{k.value}</p>
                <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "4px 0 0" }}>{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Graphe évolution + Performance par type */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

            {/* Mini stats suggestions */}
            <div className="ad-card" style={{ margin: 0 }}>
              <h2 className="ad-card-title">Répartition des suggestions</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                {[
                  { label: "En attente", value: enAttente, color: "#d97706", bg: "#fefce8" },
                  { label: "Acceptées",  value: acceptees, color: "#16a34a", bg: "#f0fdf4" },
                  { label: "Rejetées",   value: rejetees,  color: "#dc2626", bg: "#fef2f2" },
                  { label: "Ignorées",   value: ignorees,  color: "#6b7280", bg: "#f9fafb" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "var(--color-text-secondary)", minWidth: 80 }}>{s.label}</span>
                    <div style={{ flex: 1, height: 8, background: "var(--color-background-secondary)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: totalSug > 0 ? `${Math.round((s.value/totalSug)*100)}%` : "0%", height: "100%", background: s.color, borderRadius: 4, transition: "width .3s" }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: s.color, minWidth: 28, textAlign: "right" }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance par type */}
            <div className="ad-card" style={{ margin: 0 }}>
              <h2 className="ad-card-title">Acceptation par type</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                {perfParType.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "var(--color-text-secondary)", minWidth: 90 }}>{p.label}</span>
                    <div style={{ flex: 1, height: 8, background: "var(--color-background-secondary)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${p.taux}%`, height: "100%", background: Object.values(SUG_COLORS)[i]?.color || "#2563eb", borderRadius: 4, transition: "width .3s" }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)", minWidth: 32, textAlign: "right" }}>{p.taux}%</span>
                    <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", minWidth: 40 }}>{p.acc}/{p.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tickets non analysés */}
          {ticketsNonAnalyses.length > 0 && (
            <div className="ad-card" style={{ margin: 0 }}>
              <div className="ad-card-header">
                <div>
                  <h2 className="ad-card-title">⚠️ Tickets non analysés</h2>
                  <p className="ad-card-subtitle" style={{ marginBottom: 0 }}>Ces tickets n'ont pas encore été traités par l'IA</p>
                </div>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", fontWeight: 500 }}>
                  {ticketsNonAnalyses.length} tickets
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {ticketsNonAnalyses.slice(0, 8).map(t => (
                  <div key={t._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--color-background-secondary)", borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)" }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>{t.titre}</p>
                      <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "2px 0 0" }}>{t.reporter?.prenom} {t.reporter?.nom} · {fmtDate(t.createdAt)}</p>
                    </div>
                    <button
                      disabled={iaLoadingId === t._id}
                      onClick={() => lancerAnalyse(t._id)}
                      style={{
                        fontSize: 11, padding: "6px 14px", borderRadius: 8,
                        background: iaLoadingId === t._id ? "#9ca3af" : "#7c3aed",
                        color: "#fff", border: "none", cursor: iaLoadingId === t._id ? "not-allowed" : "pointer",
                        fontWeight: 500, flexShrink: 0
                      }}>
                      {iaLoadingId === t._id ? "⏳..." : "🤖 Analyser"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ SECTION B — GESTION SUGGESTIONS ══ */}
      {section === "suggestions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Filtres */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500 }}>Statut :</span>
            {[
              { value: "tous",       label: `Tous (${totalSug})` },
              { value: "en_attente", label: `En attente (${enAttente})` },
              { value: "acceptee",   label: `Acceptées (${acceptees})` },
              { value: "rejetee",    label: `Rejetées (${rejetees})` },
              { value: "ignorees",   label: `Ignorées (${ignorees})` },
            ].map(f => (
              <button key={f.value} onClick={() => setFilterSug(f.value)} style={{
                fontSize: 11, padding: "4px 12px", borderRadius: 20, cursor: "pointer",
                border: "0.5px solid", transition: "all .15s",
                borderColor: filterSug === f.value ? "#2563eb" : "var(--color-border-tertiary)",
                background: filterSug === f.value ? "#eff6ff" : "var(--color-background-secondary)",
                color: filterSug === f.value ? "#2563eb" : "var(--color-text-secondary)",
              }}>{f.label}</button>
            ))}
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500, marginLeft: 8 }}>Type :</span>
            {[{ value: "tous", label: "Tous" }, ...Object.entries(SUG_TYPES).map(([k, v]) => ({ value: k, label: v }))].map(f => (
              <button key={f.value} onClick={() => setFilterType(f.value)} style={{
                fontSize: 11, padding: "4px 12px", borderRadius: 20, cursor: "pointer",
                border: "0.5px solid", transition: "all .15s",
                borderColor: filterType === f.value ? "#7c3aed" : "var(--color-border-tertiary)",
                background: filterType === f.value ? "#f5f3ff" : "var(--color-background-secondary)",
                color: filterType === f.value ? "#7c3aed" : "var(--color-text-secondary)",
              }}>{f.label}</button>
            ))}
          </div>

          {/* Table suggestions */}
          <div className="ad-card" style={{ margin: 0 }}>
            <h2 className="ad-card-title">{sugsFiltrees.length} suggestion{sugsFiltrees.length !== 1 ? "s" : ""}</h2>
            {sugsFiltrees.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", textAlign: "center", padding: "24px 0" }}>Aucune suggestion pour ces filtres.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {sugsFiltrees.slice(0, 30).map((s, i) => {
                  const cfg = SUG_COLORS[s.type] || { bg: "#f9fafb", color: "#374151", border: "#e5e7eb" };
                  const statutStyle =
                    s.statut === "acceptee" ? { bg: "#f0fdf4", color: "#15803d", label: "✅ Acceptée" }
                    : s.statut === "rejetee" ? { bg: "#fef2f2", color: "#b91c1c", label: "❌ Rejetée" }
                    : { bg: "#fefce8", color: "#a16207", label: "⏳ En attente" };
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, background: "var(--color-background-primary)" }}>
                      <div style={{ flex: 2 }}>
                        <p style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>{s.ticket?.titre || "—"}</p>
                        <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "2px 0 0" }}>
                          {s.ticket?.reporter?.prenom} {s.ticket?.reporter?.nom}
                          {s.ticket?.assignee && ` · ${s.ticket.assignee.prenom} ${s.ticket.assignee.nom}`}
                        </p>
                      </div>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: cfg.bg, color: cfg.color, border: `0.5px solid ${cfg.border}`, flexShrink: 0 }}>
                        {SUG_TYPES[s.type] || s.type}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", flexShrink: 0, minWidth: 80 }}>
                        {s.scoreConfiance ? `${Math.round(s.scoreConfiance * 100)}% conf.` : "—"}
                      </span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: statutStyle.bg, color: statutStyle.color, flexShrink: 0 }}>
                        {statutStyle.label}
                      </span>
                    </div>
                  );
                })}
                {sugsFiltrees.length > 30 && (
                  <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", textAlign: "center", padding: "8px 0" }}>
                    + {sugsFiltrees.length - 30} autres suggestions
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ SECTION C — MONITORING ══ */}
      {section === "monitoring" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Santé système */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Tickets analysés",     value: ticketsAnalyses.length,    color: "#16a34a" },
              { label: "Non analysés",          value: ticketsNonAnalyses.length, color: ticketsNonAnalyses.length > 0 ? "#d97706" : "#16a34a" },
              { label: "Taux de succès",        value: tickets.length > 0 ? `${Math.round((ticketsAnalyses.length / tickets.length) * 100)}%` : "—", color: "#2563eb" },
              { label: "Suggestions ignorées",  value: ignorees, color: ignorees > 0 ? "#6b7280" : "#16a34a" },
            ].map((k, i) => (
              <div key={i} style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "14px 16px" }}>
                <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 6px" }}>{k.label}</p>
                <p style={{ fontSize: 24, fontWeight: 500, margin: 0, color: k.color }}>{k.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

            {/* Logs récents */}
            <div className="ad-card" style={{ margin: 0 }}>
              <h2 className="ad-card-title">Logs d'analyses récents</h2>
              {logs.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", textAlign: "center", padding: "24px 0" }}>
                  Aucun log disponible.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  {logs.slice(0, 10).map((l, i) => {
                    const isOk = l.statut === "succes" || l.succes === true;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: isOk ? "#16a34a" : "#dc2626", border: `1.5px solid ${isOk ? "#bbf7d0" : "#fecaca"}`, flexShrink: 0, marginTop: 3 }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>
                            {l.ticket?.titre || "Ticket inconnu"}
                          </p>
                          <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "2px 0 0" }}>
                            {isOk ? "Succès" : "Échec"} · {l.dureeMs ? `${Math.round(l.dureeMs / 1000)}s` : ""} · {fmtDate(l.createdAt)}
                          </p>
                          {l.erreur && <p style={{ fontSize: 11, color: "#dc2626", margin: "2px 0 0", fontStyle: "italic" }}>{l.erreur}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tickets analysés récemment */}
            <div className="ad-card" style={{ margin: 0 }}>
              <h2 className="ad-card-title">Tickets analysés récemment</h2>
              {ticketsAnalyses.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", textAlign: "center", padding: "24px 0" }}>
                  Aucun ticket analysé.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  {ticketsAnalyses.slice(0, 10).map(t => (
                    <div key={t._id} style={{ padding: "8px 10px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>{t.titre}</p>
                      <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                        {t.sentimentClient && (
                          <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: t.sentimentClient === "frustre" ? "#fef2f2" : "#f0fdf4", color: t.sentimentClient === "frustre" ? "#b91c1c" : "#15803d" }}>
                            {t.sentimentClient === "frustre" ? "😤 Frustré" : "😊 Calme"}
                          </span>
                        )}
                        {t.categorieIa && (
                          <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#eff6ff", color: "#1d4ed8" }}>🏷️ {t.categorieIa}</span>
                        )}
                        {t.prioriteIa && (
                          <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#f5f3ff", color: "#7c3aed" }}>⭐ {t.prioriteIa}</span>
                        )}
                        {t.assigneAutomatiquement && (
                          <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#f0fdf4", color: "#15803d" }}>🤖 Auto-assigné</span>
                        )}
                      </div>
                      {t.resumeIa && (
                        <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "4px 0 0", fontStyle: "italic" }}>💡 {t.resumeIa}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ADMIN DASHBOARD (ton code original — inchangé)
// ============================================================
const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = getUser(), token = getToken();

  const [activeTab,setActiveTab]           = useState("creer-personnel");
  const [users,setUsers]                   = useState([]);
  const [agents,setAgents]                 = useState([]);
  const [searchUsers,setSearchUsers]       = useState("");
  const [loading,setLoading]               = useState(false);
  const [serverMsg,setServerMsg]           = useState("");
  const [serverError,setServerError]       = useState("");
  const [deleteConfirm,setDeleteConfirm]   = useState(null);
  const [editUser,setEditUser]             = useState(null);
  const [editForm,setEditForm]             = useState({});
  const [editMsg,setEditMsg]               = useState("");
  const [editError,setEditError]           = useState("");
  const [demandes,setDemandes]             = useState([]);
  const [demandesCount,setDemandesCount]   = useState(0);
  const [workflow,setWorkflow]             = useState(null);
  const [wfTickets,setWfTickets]           = useState([]);
  const [workflowLoading,setWorkflowLoading] = useState(false);
  const [workflowMsg,setWorkflowMsg]       = useState("");
  const [workflowError,setWorkflowError]   = useState("");
  const [editingTransition,setEditingTransition] = useState(null);
  const [transitionForm,setTransitionForm] = useState({});
  const [delaiHeures,setDelaiHeures]       = useState("");
  const [delaiMinutes,setDelaiMinutes]     = useState("");
  const [editTicket,setEditTicket]         = useState(null);
  const [editTicketForm,setEditTicketForm] = useState({priorite:"",assigneeId:"",action:"aucun",bloqueRaison:""});
  const [editTicketMsg,setEditTicketMsg]   = useState("");
  const [editTicketErr,setEditTicketErr]   = useState("");
  const [histTicket,setHistTicket]         = useState(null);
  const [histLoading,setHistLoading]       = useState(false);
  const [formPersonnel,setFormPersonnel]   = useState({nom:"",prenom:"",email:"",telephone:"",departement:"",role:"support"});
  const [formClient,setFormClient]         = useState({nom:"",prenom:"",email:"",telephone:""});

  useEffect(()=>{
    if(!token||!user||user.role!=="admin"){navigate("/login");return;}
    if(activeTab==="users") fetchUsers();
    if(activeTab==="workflow"){fetchWorkflow();fetchWfTickets();fetchAgents();}
    fetchDemandes();
    const iv=setInterval(()=>{if(activeTab==="users")fetchUsers();if(activeTab==="workflow")fetchWfTickets();fetchDemandes();},10000);
    return ()=>clearInterval(iv);
  },[activeTab]);

  const fetchUsers    = ()=>{setLoading(true);fetch(`${API}/admin/users`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setUsers(d.users);}).finally(()=>setLoading(false));};
  const fetchAgents   = ()=>{fetch(`${API}/admin/users`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setAgents(d.users.filter(u=>u.role==="support"&&u.isActive));});};
  const fetchDemandes = ()=>{fetch(`${API}/users/demandes-reset`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok"){setDemandes(d.demandes);setDemandesCount(d.demandes.length);}});};
  const fetchWorkflow = ()=>{setWorkflowLoading(true);fetch(`${API}/workflow`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setWorkflow(d.workflow);else setWorkflowError(d.msg||"Erreur chargement");}).catch(()=>setWorkflowError("Erreur de connexion")).finally(()=>setWorkflowLoading(false));};
  const fetchWfTickets= ()=>{fetch(`${API}/tickets/tous`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setWfTickets(d.tickets);}).catch(()=>{});};

  const ouvrirHistorique = async (tk) => {
    setHistLoading(true);
    setHistTicket(tk);
    try {
      const res  = await fetch(`${API}/tickets/${tk._id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status === "ok") setHistTicket(data.ticket);
    } catch {}
    setHistLoading(false);
  };

  const handleSaveTransition=async()=>{setWorkflowMsg("");setWorkflowError("");const m=parseInt(delaiMinutes)||0;if(m>=60){setWorkflowError("Les minutes doivent être inférieures à 60.");return;}const totalMinutes=hmToMinutes(delaiHeures,delaiMinutes);const payload={...transitionForm,delaiEscaladeMinutes:totalMinutes,delaiEscaladeHeures:totalMinutes?(totalMinutes/60):null};try{const res=await fetch(`${API}/workflow/transitions/${editingTransition._id}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(payload)});const data=await res.json();if(data.status==="ok"){setWorkflowMsg("Transition mise à jour.");setWorkflow(data.workflow);setEditingTransition(null);setTimeout(()=>setWorkflowMsg(""),2000);}else setWorkflowError(data.msg);}catch{setWorkflowError("Erreur de connexion");}};
  const handleResetWorkflow=async()=>{if(!window.confirm("Réinitialiser le workflow aux valeurs par défaut ?"))return;setWorkflowMsg("");setWorkflowError("");try{const res=await fetch(`${API}/workflow/reset`,{method:"POST",headers:{Authorization:`Bearer ${token}`}});const data=await res.json();if(data.status==="ok"){setWorkflow(data.workflow);setWorkflowMsg("Workflow réinitialisé.");setTimeout(()=>setWorkflowMsg(""),2000);}else setWorkflowError(data.msg||"Erreur");}catch{setWorkflowError("Erreur de connexion");}};
  const openEditTransition=(t)=>{setEditingTransition(t);setTransitionForm({rolesAutorises:[...t.rolesAutorises],active:t.active,notifierRoles:[...t.notifierRoles]});const total=t.delaiEscaladeMinutes||(t.delaiEscaladeHeures?Math.round(t.delaiEscaladeHeures*60):null);const hm=minutesToHM(total);setDelaiHeures(hm.heures);setDelaiMinutes(hm.minutes);setWorkflowMsg("");setWorkflowError("");};
  const toggleRole=(field,role)=>{setTransitionForm(prev=>{const arr=prev[field]||[];return{...prev,[field]:arr.includes(role)?arr.filter(r=>r!==role):[...arr,role]};});};
  const openEditTicket=(tk)=>{setEditTicket(tk);setEditTicketForm({priorite:tk.priorite,assigneeId:"",action:"aucun",bloqueRaison:""});setEditTicketMsg("");setEditTicketErr("");};

  const handleSaveTicket=async()=>{setEditTicketMsg("");setEditTicketErr("");try{if(editTicketForm.priorite!==editTicket.priorite){const r=await fetch(`${API}/tickets/${editTicket._id}/priorite`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({priorite:editTicketForm.priorite})});const d=await r.json();if(d.status!=="ok"){setEditTicketErr(d.msg);return;}}if(editTicketForm.assigneeId){const r=await fetch(`${API}/tickets/${editTicket._id}/assigner`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({assigneeId:editTicketForm.assigneeId})});const d=await r.json();if(d.status!=="ok"){setEditTicketErr(d.msg);return;}}if(editTicketForm.action==="bloquer"){const r=await fetch(`${API}/tickets/${editTicket._id}/bloquer`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({bloquer:true,raison:editTicketForm.bloqueRaison})});const d=await r.json();if(d.status!=="ok"){setEditTicketErr(d.msg);return;}}else if(editTicketForm.action==="debloquer"){const r=await fetch(`${API}/tickets/${editTicket._id}/bloquer`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({bloquer:false})});const d=await r.json();if(d.status!=="ok"){setEditTicketErr(d.msg);return;}}else if(editTicketForm.action==="forcer-resolu"){const r=await fetch(`${API}/tickets/${editTicket._id}/forcer-resolu`,{method:"PUT",headers:{Authorization:`Bearer ${token}`}});const d=await r.json();if(d.status!=="ok"){setEditTicketErr(d.msg);return;}}else if(editTicketForm.action==="reuvrir"){const r=await fetch(`${API}/tickets/${editTicket._id}/reuvrir`,{method:"PUT",headers:{Authorization:`Bearer ${token}`}});const d=await r.json();if(d.status!=="ok"){setEditTicketErr(d.msg);return;}}setEditTicketMsg("✅ Ticket mis à jour !");fetchWfTickets();setTimeout(()=>{setEditTicket(null);setEditTicketMsg("");},1500);}catch{setEditTicketErr("Erreur de connexion");}};

  const handleCreatePersonnel=async(e)=>{e.preventDefault();setServerError("");setServerMsg("");if(!formPersonnel.nom||!formPersonnel.prenom||!formPersonnel.email||!formPersonnel.telephone){setServerError("Tous les champs obligatoires doivent être remplis");return;}try{const res=await fetch(`${API}/admin/create-user`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(formPersonnel)});const data=await res.json();if(data.status==="ok"){setServerMsg(`Compte créé ! Email envoyé à ${formPersonnel.email}`);setFormPersonnel({nom:"",prenom:"",email:"",telephone:"",departement:"",role:"support"});}else setServerError(data.msg);}catch{setServerError("Erreur de connexion");}};
  const handleCreateClient=async(e)=>{e.preventDefault();setServerError("");setServerMsg("");if(!formClient.nom||!formClient.prenom||!formClient.email||!formClient.telephone){setServerError("Tous les champs sont obligatoires");return;}try{const res=await fetch(`${API}/admin/create-client`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(formClient)});const data=await res.json();if(data.status==="ok"){setServerMsg(`Compte client créé ! Email envoyé à ${formClient.email}`);setFormClient({nom:"",prenom:"",email:"",telephone:""});}else setServerError(data.msg);}catch{setServerError("Erreur de connexion");}};
  const handleChangeRole=async(userId,newRole)=>{try{const res=await fetch(`${API}/admin/users/${userId}/role`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({role:newRole})});const data=await res.json();if(data.status==="ok")fetchUsers();}catch{}};
  const handleToggle=async(userId)=>{try{const res=await fetch(`${API}/admin/users/${userId}/toggle`,{method:"PUT",headers:{Authorization:`Bearer ${token}`}});const data=await res.json();if(data.status==="ok")fetchUsers();}catch{}};
  const handleDelete=async(userId)=>{try{const res=await fetch(`${API}/admin/users/${userId}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});const data=await res.json();if(data.status==="ok"){setDeleteConfirm(null);fetchUsers();}else alert(data.msg);}catch{}};
  const openEdit=(u)=>{setEditUser(u);setEditForm({nom:u.nom,prenom:u.prenom,email:u.email,telephone:u.telephone,departement:u.departement||""});setEditMsg("");setEditError("");};
  const handleEditSave=async()=>{setEditMsg("");setEditError("");try{const res=await fetch(`${API}/admin/users/${editUser._id}/edit`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(editForm)});const data=await res.json();if(data.status==="ok"){setEditMsg("Modifications enregistrées !");fetchUsers();setTimeout(()=>setEditUser(null),1500);}else setEditError(data.msg);}catch{setEditError("Erreur de connexion");}};
  const handleResetPassword=async(userId)=>{if(!window.confirm("Réinitialiser le mot de passe ?"))return;try{const res=await fetch(`${API}/admin/users/${userId}/reset-password`,{method:"POST",headers:{Authorization:`Bearer ${token}`}});const data=await res.json();if(data.status==="ok")setEditMsg("Mot de passe réinitialisé et envoyé par email !");else setEditError(data.msg);}catch{setEditError("Erreur de connexion");}};
  const handleResetPasswordDirect=async(email)=>{let foundUser=users.find(u=>u.email===email);if(!foundUser){const res=await fetch(`${API}/admin/users`,{headers:{Authorization:`Bearer ${token}`}});const data=await res.json();if(data.status==="ok"){setUsers(data.users);foundUser=data.users.find(u=>u.email===email);}}if(!foundUser){alert("Utilisateur introuvable");return;}try{const res=await fetch(`${API}/admin/users/${foundUser._id}/reset-password`,{method:"POST",headers:{Authorization:`Bearer ${token}`}});const data=await res.json();if(data.status==="ok"){alert("Mot de passe réinitialisé et envoyé par email !");fetchDemandes();}else alert(data.msg);}catch{alert("Erreur de connexion");}};
  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); navigate("/login-personnel"); };
  const usersFiltres=users.filter(u=>{const q=searchUsers.toLowerCase();return u.prenom?.toLowerCase().includes(q)||u.nom?.toLowerCase().includes(q)||u.email?.toLowerCase().includes(q)||u.departement?.toLowerCase().includes(q);});
  const pageInfo=PAGE_TITLES[activeTab]||{title:"Administration",sub:""};
  const getActionsDisponibles=(tk)=>{const a=[{value:"aucun",label:"— Aucune action admin —"}];if(!tk.bloque)a.push({value:"bloquer",label:"🔒 Bloquer ce ticket"});if(tk.bloque)a.push({value:"debloquer",label:"🔓 Débloquer ce ticket"});if(!["solved","closed","cancelled"].includes(tk.statut))a.push({value:"forcer-resolu",label:"✅ Forcer la résolution"});if(["solved","closed","cancelled"].includes(tk.statut))a.push({value:"reuvrir",label:"🔄 Réouvrir ce ticket"});return a;};

  return (
    <div className="ad-layout">
      <aside className="ad-sidebar">
        <div className="ad-brand"><div className="ad-brand-icon"><IconApp/></div><span className="ad-brand-name">DevApp</span></div>
        <div className="ad-nav-label">Gestion</div>
        <nav className="ad-nav">
          {NAV_ITEMS.map(n=>(
            <button key={n.id} className={`ad-nav-item ${activeTab===n.id?"ad-nav-active":""}`} onClick={()=>{setActiveTab(n.id);setServerMsg("");setServerError("");}}>
              <span className="ad-nav-icon"><n.Icon/></span><span style={{flex:1}}>{n.label}</span>
              {n.badge&&demandesCount>0&&<span className="ad-nav-badge">{demandesCount}</span>}
            </button>
          ))}
        </nav>
        <div className="ad-sidebar-user">
          <div className="ad-user-avatar">{user?.prenom?.[0]}{user?.nom?.[0]}</div>
          <div className="ad-user-info"><span className="ad-user-name">{user?.prenom} {user?.nom}</span><span className="ad-user-role">Administrateur</span></div>
          <button className="ad-logout-btn" onClick={handleLogout} title="Déconnexion"><IconLogout/></button>
        </div>
      </aside>

      <main className="ad-main">

        {deleteConfirm&&(<div className="modal-overlay"><div className="modal-box"><div className="modal-icon">🗑️</div><h3>Supprimer cet utilisateur ?</h3><p style={{fontSize:13,color:"#6b7280",marginBottom:20}}>Voulez-vous vraiment supprimer <strong>{deleteConfirm.prenom} {deleteConfirm.nom}</strong> ? Cette action est irréversible.</p><div className="modal-actions"><button className="btn-cancel" onClick={()=>setDeleteConfirm(null)}>Annuler</button><button className="btn-delete-confirm" onClick={()=>handleDelete(deleteConfirm._id)}>Supprimer définitivement</button></div></div></div>)}
        {editUser&&(<div className="modal-overlay"><div className="modal-box modal-edit"><h3>Modifier — {editUser.prenom} {editUser.nom}</h3>{editError&&<div className="alert alert-error">{editError}</div>}{editMsg&&<div className="alert alert-success">{editMsg}</div>}<div className="form-row"><div className="form-group"><label>Prénom</label><input type="text" className="form-input" value={editForm.prenom} onChange={e=>setEditForm({...editForm,prenom:e.target.value})}/></div><div className="form-group"><label>Nom</label><input type="text" className="form-input" value={editForm.nom} onChange={e=>setEditForm({...editForm,nom:e.target.value})}/></div></div><div className="form-group"><label>Email</label><input type="email" className="form-input" value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})}/></div><div className="form-row"><div className="form-group"><label>Téléphone</label><input type="text" className="form-input" value={editForm.telephone} onChange={e=>setEditForm({...editForm,telephone:e.target.value})}/></div>{editUser.role!=="client"&&<div className="form-group"><label>Département</label><input type="text" className="form-input" value={editForm.departement} onChange={e=>setEditForm({...editForm,departement:e.target.value})}/></div>}</div><div className="reset-password-box"><p>🔐 Mot de passe</p><button className="btn-reset-password" onClick={()=>handleResetPassword(editUser._id)}>Réinitialiser</button></div><div className="modal-actions"><button className="btn-cancel" onClick={()=>setEditUser(null)}>Annuler</button><button className="btn-save" onClick={handleEditSave}>Enregistrer</button></div></div></div>)}
        {editingTransition&&(<div className="modal-overlay"><div className="modal-box modal-edit"><h3>Configurer la transition</h3><p className="modal-ticket-title">{STATUT_LABELS[editingTransition.de]} → {STATUT_LABELS[editingTransition.vers]}</p>{workflowError&&<div className="alert alert-error" style={{marginBottom:12}}>{workflowError}</div>}<div className="workflow-toggle-row"><span className="wf-label">Transition active</span><label className="wf-switch"><input type="checkbox" checked={transitionForm.active} onChange={e=>setTransitionForm({...transitionForm,active:e.target.checked})}/><span className="wf-slider"></span></label></div><div className="form-group" style={{marginTop:16}}><label>Qui peut faire cette transition ?</label><div className="role-checks">{ALL_ROLES.map(role=>(<label key={role} className="role-check-item"><input type="checkbox" checked={transitionForm.rolesAutorises?.includes(role)} onChange={()=>toggleRole("rolesAutorises",role)}/>{ROLE_LABELS[role]}</label>))}</div></div><div className="form-group"><label>Délai avant escalade automatique</label><div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{flex:1}}><input type="number" className="form-input" placeholder="0" min="0" value={delaiHeures} onChange={e=>setDelaiHeures(e.target.value)} style={{textAlign:"center"}}/><p style={{fontSize:11,color:"#9ca3af",marginTop:4,textAlign:"center"}}>Heures</p></div><span style={{fontSize:18,color:"#9ca3af",paddingBottom:18}}>:</span><div style={{flex:1}}><input type="number" className="form-input" placeholder="0" min="0" max="59" value={delaiMinutes} onChange={e=>setDelaiMinutes(e.target.value)} style={{textAlign:"center"}}/><p style={{fontSize:11,color:"#9ca3af",marginTop:4,textAlign:"center"}}>Minutes</p></div></div>{(delaiHeures||delaiMinutes)&&(()=>{const total=hmToMinutes(delaiHeures,delaiMinutes);if(!total)return null;const m=parseInt(delaiMinutes)||0;if(m>=60)return<p style={{fontSize:11,color:"#ef4444",marginTop:6}}>⚠️ Les minutes doivent être inférieures à 60.</p>;return<p style={{fontSize:11,color:"#2563eb",marginTop:6,background:"#eff6ff",padding:"4px 10px",borderRadius:6,display:"inline-block"}}>⏱️ Escalade après <strong>{formatDelai(total)}</strong> sans action</p>;})()}<p style={{fontSize:11,color:"#9ca3af",marginTop:6}}>Laisser à 0 = pas d'escalade automatique</p></div><div className="form-group"><label>Notifier lors de cette transition</label><div className="role-checks">{ALL_ROLES.map(role=>(<label key={role} className="role-check-item"><input type="checkbox" checked={transitionForm.notifierRoles?.includes(role)} onChange={()=>toggleRole("notifierRoles",role)}/>{ROLE_LABELS[role]}</label>))}</div></div><div className="modal-actions"><button className="btn-cancel" onClick={()=>setEditingTransition(null)}>Annuler</button><button className="btn-save" onClick={handleSaveTransition}>Enregistrer</button></div></div></div>)}
        {editTicket&&(<div className="modal-overlay"><div className="modal-box modal-edit"><h3>Modifier le ticket</h3><p className="modal-ticket-title">{editTicket.titre}</p><p style={{fontSize:12,color:"#6b7280",marginBottom:16}}>Client : <strong>{editTicket.reporter?.prenom} {editTicket.reporter?.nom}</strong>{editTicket.assignee&&<> · Agent : <strong>{editTicket.assignee.prenom} {editTicket.assignee.nom}</strong></>}{editTicket.bloque&&<span style={{marginLeft:8,background:"#fef2f2",color:"#b91c1c",fontSize:11,padding:"2px 8px",borderRadius:6}}>🔒 Bloqué</span>}</p>{editTicketErr&&<div className="alert alert-error">{editTicketErr}</div>}{editTicketMsg&&<div className="alert alert-success">{editTicketMsg}</div>}<div className="form-group"><label>Priorité</label><select className="form-input" value={editTicketForm.priorite} onChange={e=>setEditTicketForm({...editTicketForm,priorite:e.target.value})}><option value="low">Faible</option><option value="medium">Moyen</option><option value="high">Haute</option><option value="critical">Critique</option></select></div><div className="form-group"><label>Réassigner à</label><select className="form-input" value={editTicketForm.assigneeId} onChange={e=>setEditTicketForm({...editTicketForm,assigneeId:e.target.value})}><option value="">— Garder l'agent actuel —</option>{agents.map(a=><option key={a._id} value={a._id}>{a.prenom} {a.nom}</option>)}</select></div><div style={{borderTop:"1px solid #f3f4f6",margin:"16px 0",paddingTop:16}}><p style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:10}}>Actions administrateur</p><div className="form-group"><label>Action</label><select className="form-input" value={editTicketForm.action} onChange={e=>setEditTicketForm({...editTicketForm,action:e.target.value,bloqueRaison:""})} style={{borderColor:editTicketForm.action==="bloquer"?"#fca5a5":editTicketForm.action==="forcer-resolu"?"#bbf7d0":editTicketForm.action==="reuvrir"?"#bfdbfe":editTicketForm.action==="debloquer"?"#6ee7b7":undefined}}>{getActionsDisponibles(editTicket).map(a=><option key={a.value} value={a.value}>{a.label}</option>)}</select></div>{editTicketForm.action==="bloquer"&&<div className="form-group"><label>Raison du blocage</label><input type="text" className="form-input" placeholder="Ex: Litige en cours..." value={editTicketForm.bloqueRaison} onChange={e=>setEditTicketForm({...editTicketForm,bloqueRaison:e.target.value})} style={{borderColor:"#fca5a5"}}/></div>}{editTicketForm.action==="bloquer"&&<div className="info-box" style={{background:"#fef2f2",border:"1px solid #fecaca"}}><span>🔒</span><p style={{color:"#b91c1c"}}>L'agent ne pourra plus modifier ce ticket.</p></div>}{editTicketForm.action==="debloquer"&&<div className="info-box" style={{background:"#f0fdf4",border:"1px solid #bbf7d0"}}><span>🔓</span><p style={{color:"#15803d"}}>Le ticket reprend son traitement normal.</p></div>}{editTicketForm.action==="forcer-resolu"&&<div className="info-box" style={{background:"#f0fdf4",border:"1px solid #bbf7d0"}}><span>✅</span><p style={{color:"#15803d"}}>Le ticket sera marqué comme résolu.</p></div>}{editTicketForm.action==="reuvrir"&&<div className="info-box" style={{background:"#eff6ff",border:"1px solid #bfdbfe"}}><span>🔄</span><p style={{color:"#1d4ed8"}}>Le ticket retourne en "En attente".</p></div>}</div><div className="modal-actions"><button className="btn-cancel" onClick={()=>setEditTicket(null)}>Annuler</button><button className="btn-save" onClick={handleSaveTicket}>Enregistrer</button></div></div></div>)}

        {histTicket && (
          <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setHistTicket(null)}>
            <div className="modal-box modal-edit" style={{maxHeight:"80vh",overflowY:"auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div><h3 style={{margin:0}}>Historique des actions</h3><p style={{fontSize:12,color:"#6b7280",margin:"4px 0 0",fontWeight:500}}>{histTicket.titre}</p><p style={{fontSize:11,color:"#9ca3af",margin:"2px 0 0"}}>Client : {histTicket.reporter?.prenom} {histTicket.reporter?.nom}{histTicket.assignee&&` · Agent : ${histTicket.assignee.prenom} ${histTicket.assignee.nom}`}</p></div>
                <button className="btn-cancel" onClick={()=>setHistTicket(null)} style={{flexShrink:0}}>✕</button>
              </div>
              {histLoading ? (<div className="loading">Chargement de l'historique...</div>) : !histTicket.historique||histTicket.historique.length===0 ? (<div style={{textAlign:"center",padding:"32px 0",color:"#9ca3af"}}><p style={{fontSize:13}}>Aucune action enregistrée pour ce ticket.</p><p style={{fontSize:11,marginTop:4}}>Les actions futures apparaîtront ici automatiquement.</p></div>) : (
                <div style={{position:"relative"}}><div style={{position:"absolute",left:13,top:0,bottom:0,width:1,background:"#f3f4f6"}}/><div style={{display:"flex",flexDirection:"column",gap:12}}>{[...histTicket.historique].reverse().map((h,i)=>{const cfg=HIST_CONFIG[h.action]||HIST_CONFIG.default;return(<div key={i} style={{display:"flex",gap:12}}><div style={{width:26,height:26,borderRadius:"50%",background:cfg.dotBg,border:`0.5px solid ${cfg.dotBorder}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,zIndex:1,fontSize:10,color:cfg.color,fontWeight:500}}>{histTicket.historique.length-i}</div><div style={{flex:1,background:cfg.bg,border:`0.5px solid ${cfg.border}`,borderRadius:8,padding:"8px 12px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}><span style={{fontSize:12,fontWeight:500,color:cfg.color}}>{cfg.label}</span><span style={{fontSize:10,color:"#9ca3af",flexShrink:0,marginLeft:8}}>{fmtDate(h.createdAt)}</span></div>{h.details&&<p style={{fontSize:11,color:cfg.color,margin:0,opacity:0.85}}>{h.details}</p>}<p style={{fontSize:10,color:"#9ca3af",margin:h.details?"3px 0 0":0}}>Par : {h.auteurNom||"Système automatique"}</p></div></div>);})}</div></div>
              )}
              <div style={{marginTop:16,paddingTop:12,borderTop:"1px solid #f3f4f6"}}><button className="btn-cancel" onClick={()=>setHistTicket(null)} style={{width:"100%"}}>Fermer</button></div>
            </div>
          </div>
        )}

        <div className="ad-topbar">
          <div><h1 className="ad-page-title">{pageInfo.title}</h1><p className="ad-page-subtitle">{pageInfo.sub}</p></div>
        </div>

        <div className="ad-content">

          {activeTab==="creer-personnel"&&(<div className="ad-card"><h2 className="ad-card-title">Créer un compte personnel</h2><p className="ad-card-subtitle">Un mot de passe temporaire sera généré automatiquement et envoyé par email.</p>{serverError&&<div className="alert alert-error">{serverError}</div>}{serverMsg&&<div className="alert alert-success">{serverMsg}</div>}<form onSubmit={handleCreatePersonnel} noValidate><div className="form-row"><div className="form-group"><label>Prénom <span className="req">*</span></label><input type="text" placeholder="Prénom" className="form-input" value={formPersonnel.prenom} onChange={e=>setFormPersonnel({...formPersonnel,prenom:e.target.value})}/></div><div className="form-group"><label>Nom <span className="req">*</span></label><input type="text" placeholder="Nom" className="form-input" value={formPersonnel.nom} onChange={e=>setFormPersonnel({...formPersonnel,nom:e.target.value})}/></div></div><div className="form-group"><label>Email professionnel <span className="req">*</span></label><input type="email" placeholder="prenom.nom@entreprise.com" className="form-input" value={formPersonnel.email} onChange={e=>setFormPersonnel({...formPersonnel,email:e.target.value})}/></div><div className="form-row"><div className="form-group"><label>Téléphone <span className="req">*</span></label><input type="text" placeholder="+216 XX XXX XXX" className="form-input" value={formPersonnel.telephone} onChange={e=>setFormPersonnel({...formPersonnel,telephone:e.target.value})}/></div><div className="form-group"><label>Département</label><input type="text" placeholder="Support Technique" className="form-input" value={formPersonnel.departement} onChange={e=>setFormPersonnel({...formPersonnel,departement:e.target.value})}/></div></div><div className="form-group"><label>Rôle <span className="req">*</span></label><div className="role-selector"><button type="button" className={`role-btn ${formPersonnel.role==="support"?"role-btn-active":""}`} onClick={()=>setFormPersonnel({...formPersonnel,role:"support"})}><span className="role-icon">🎧</span><span className="role-name">Agent Support</span><span className="role-desc">Traite les tickets clients</span></button><button type="button" className={`role-btn ${formPersonnel.role==="team_lead"?"role-btn-active":""}`} onClick={()=>setFormPersonnel({...formPersonnel,role:"team_lead"})}><span className="role-icon">👑</span><span className="role-name">Chef d'équipe</span><span className="role-desc">Supervise et assigne les tickets</span></button></div></div><div className="info-box"><span>🔐</span><p>Un mot de passe temporaire de 10 caractères sera généré automatiquement.</p></div><button type="submit" className="btn-primary">Créer le compte et envoyer l'email</button></form></div>)}
          {activeTab==="creer-client"&&(<div className="ad-card"><h2 className="ad-card-title">Créer un compte client</h2><p className="ad-card-subtitle">Un mot de passe temporaire sera envoyé au client par email.</p>{serverError&&<div className="alert alert-error">{serverError}</div>}{serverMsg&&<div className="alert alert-success">{serverMsg}</div>}<form onSubmit={handleCreateClient} noValidate><div className="form-row"><div className="form-group"><label>Prénom <span className="req">*</span></label><input type="text" placeholder="Prénom" className="form-input" value={formClient.prenom} onChange={e=>setFormClient({...formClient,prenom:e.target.value})}/></div><div className="form-group"><label>Nom <span className="req">*</span></label><input type="text" placeholder="Nom" className="form-input" value={formClient.nom} onChange={e=>setFormClient({...formClient,nom:e.target.value})}/></div></div><div className="form-group"><label>Email <span className="req">*</span></label><input type="email" placeholder="client@exemple.com" className="form-input" value={formClient.email} onChange={e=>setFormClient({...formClient,email:e.target.value})}/></div><div className="form-group"><label>Téléphone <span className="req">*</span></label><input type="text" placeholder="+216 XX XXX XXX" className="form-input" value={formClient.telephone} onChange={e=>setFormClient({...formClient,telephone:e.target.value})}/></div><div className="info-box"><span>🔐</span><p>Un mot de passe temporaire sera généré et envoyé au client.</p></div><button type="submit" className="btn-primary">Créer le compte client</button></form></div>)}
          {activeTab==="users"&&(<div className="ad-card"><div className="ad-card-header"><div><h2 className="ad-card-title">Utilisateurs</h2><p className="ad-card-subtitle" style={{marginBottom:0}}>Gestion de tous les comptes de la plateforme.</p></div><span style={{fontSize:12,color:"#9ca3af"}}>{usersFiltres.length} utilisateur{usersFiltres.length!==1?"s":""}</span></div><input className="ad-search-input" placeholder="Rechercher par nom, email ou département..." value={searchUsers} onChange={e=>setSearchUsers(e.target.value)}/>{loading?<div className="loading">Chargement...</div>:(<div className="users-table-wrapper"><table className="users-table"><thead><tr><th>Utilisateur</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr></thead><tbody>{usersFiltres.length===0?(<tr><td colSpan={5} style={{textAlign:"center",color:"#9ca3af",padding:24,fontSize:13}}>Aucun utilisateur trouvé</td></tr>):usersFiltres.map(u=>(<tr key={u._id}><td><div className="user-cell"><div className="user-cell-avatar">{initials(u.prenom,u.nom)}</div><div><p className="user-cell-name">{u.prenom} {u.nom}</p><p className="user-cell-dept">{u.departement||"—"}</p></div></div></td><td className="email-cell">{u.email}</td><td>{u.role!=="admin"&&u.role!=="client"?(<select className="role-select" value={u.role} onChange={e=>handleChangeRole(u._id,e.target.value)}><option value="support">Support</option><option value="team_lead">Chef d'équipe</option></select>):<RoleBadge role={u.role}/>}</td><td><span className={`status-badge ${u.isActive?"status-active":"status-inactive"}`}>{u.isActive?"Actif":"Inactif"}</span></td><td><div className="action-buttons"><button className="btn-edit" onClick={()=>openEdit(u)}>Modifier</button>{u.role!=="admin"&&<button className={u.isActive?"btn-toggle-off":"btn-toggle-on"} onClick={()=>handleToggle(u._id)}>{u.isActive?"Désactiver":"Activer"}</button>}{u.role!=="admin"&&<button className="btn-delete" onClick={()=>setDeleteConfirm(u)}>Supprimer</button>}</div></td></tr>))}</tbody></table></div>)}</div>)}

          {activeTab==="workflow"&&(
            <div className="ad-card">
              <div className="ad-card-header"><div><h2 className="ad-card-title">Workflow</h2><p className="ad-card-subtitle" style={{marginBottom:0}}>Configurez les transitions, rôles autorisés et notifications.</p></div><button className="btn-reset-workflow" onClick={handleResetWorkflow}>Réinitialiser</button></div>
              {workflowMsg&&<div className="alert alert-success" style={{marginTop:16}}>{workflowMsg}</div>}
              {workflowError&&!editingTransition&&<div className="alert alert-error" style={{marginTop:16}}>{workflowError}</div>}
              {workflowLoading?<div className="loading">Chargement...</div>:workflow?(
                <div className="workflow-list" style={{marginTop:16}}>
                  {workflow.transitions.map(t=>{
                    const tix=wfTickets.filter(tk=>tk.statut===t.vers);
                    const totalMin=t.delaiEscaladeMinutes||(t.delaiEscaladeHeures?Math.round(t.delaiEscaladeHeures*60):null);
                    return (
                      <div key={t._id} className={`workflow-row-card ${!t.active?"workflow-row-inactive":""}`}>
                        <div className="wf-card-header">
                          <div className="wf-card-left">
                            <div className="workflow-transition"><span className="wf-statut">{STATUT_LABELS[t.de]}</span><span className="wf-arrow">→</span><span className="wf-statut">{STATUT_LABELS[t.vers]}</span></div>
                            <div className="workflow-meta"><span className="wf-roles">👤 {t.rolesAutorises.map(r=>ROLE_LABELS[r]).join(", ")}</span>{totalMin&&<span className="wf-delai">⏱️ Escalade après {formatDelai(totalMin)}</span>}{t.notifierRoles.length>0&&<span className="wf-notif">🔔 {t.notifierRoles.map(r=>ROLE_LABELS[r]).join(", ")}</span>}</div>
                          </div>
                          <div className="wf-card-right"><span className={`wf-ticket-count ${tix.length>0?"wf-count-active":"wf-count-empty"}`}>{tix.length} ticket{tix.length!==1?"s":""}</span><span className={`wf-status-badge ${t.active?"wf-active":"wf-inactive"}`}>{t.active?"Active":"Inactive"}</span><button className="btn-edit" onClick={()=>openEditTransition(t)}>Modifier</button></div>
                        </div>
                        {tix.length>0&&(
                          <div className="wf-tickets-list">
                            {tix.map(tk=>{
                              const hasFeedback=tk.feedback&&tk.feedback.note;
                              const fbStyle=hasFeedback?getFeedbackStyle(tk.feedback.note):null;
                              return (
                                <div key={tk._id} className="wf-ticket-row" style={{background:tk.bloque?"#fef2f2":undefined,borderLeft:hasFeedback?fbStyle.border:undefined,paddingLeft:hasFeedback?10:undefined,cursor:"pointer"}} onClick={()=>ouvrirHistorique(tk)}>
                                  <div className="wf-ticket-left">
                                    <div><p className="wf-ticket-titre" style={{color:"#0C447C",textDecoration:"underline",textDecorationStyle:"dotted",textUnderlineOffset:3}}>{tk.bloque&&<span style={{marginRight:6}}>🔒</span>}{tk.titre}</p><p className="wf-ticket-meta">Client : <strong>{tk.reporter?.prenom} {tk.reporter?.nom}</strong>{" · "}Agent : <strong>{tk.assignee?`${tk.assignee.prenom} ${tk.assignee.nom}`:"Non assigné"}</strong></p></div>
                                  </div>
                                  <div style={{display:"flex",alignItems:"center",gap:8}} onClick={e=>e.stopPropagation()}>
                                    <span className={`prio-badge-wf prio-${tk.priorite}`}>{PRIO_MAP[tk.priorite]?.label||tk.priorite}</span>
                                    {hasFeedback&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:6,fontWeight:500,background:fbStyle.background,color:fbStyle.color}}>⭐ {tk.feedback.note}/5</span>}
                                    <button className="btn-edit" onClick={()=>openEditTicket(tk)}>Modifier</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ):<div className="empty-state">Aucun workflow configuré.</div>}
            </div>
          )}

          {activeTab==="sla"&&<SlaPage token={token}/>}

          {activeTab==="analytics"&&(
            <div className="ad-card">
              <h2 className="ad-card-title">Analytics</h2>
              <p className="ad-card-subtitle" style={{marginBottom:16}}>Statistiques et performances de l'équipe</p>
              <BIDashboard role="admin" token={token}/>
            </div>
          )}

          {/* ── NOUVEL ONGLET ANALYSE IA ── */}
          {activeTab==="ia-admin"&&(
            <div className="ad-card">
              <IaAdminPage token={token}/>
            </div>
          )}

          {activeTab==="demandes"&&(<div className="ad-card"><h2 className="ad-card-title">Demandes de réinitialisation</h2><p className="ad-card-subtitle">Demandes de réinitialisation de mot de passe en attente.</p>{demandes.length===0?(<div className="empty-demandes">Aucune demande en attente.</div>):(<div className="demandes-list">{demandes.map((d,i)=>(<div key={i} className="demande-item"><div className="demande-info"><div className="ad-user-avatar" style={{flexShrink:0}}>{d.prenom?.[0]}{d.nom?.[0]}</div><div><p className="demande-name">{d.prenom} {d.nom}</p><p className="demande-email">{d.email}</p><p className="demande-role">{d.role==="team_lead"?"Chef d'équipe":"Agent Support"}</p><p className="demande-date">{new Date(d.createdAt).toLocaleDateString("fr-FR")} à {new Date(d.createdAt).toLocaleTimeString("fr-FR")}</p></div></div><button className="btn-reset-now" onClick={()=>handleResetPasswordDirect(d.email)}>Réinitialiser le mot de passe</button></div>))}</div>)}</div>)}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;