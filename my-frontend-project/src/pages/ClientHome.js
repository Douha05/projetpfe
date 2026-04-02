import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ClientHome.css";

const API = "http://localhost:3001/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const getUser  = () => { const u=localStorage.getItem("user")||sessionStorage.getItem("user"); return u?JSON.parse(u):null; };

const Ico = ({d,size=14}) => <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d={d}/></svg>;
const D = {
  tickets: "M1.5 3.5A1.5 1.5 0 0 1 3 2h9.982a1.5 1.5 0 0 1 1.498 1.5v2.5a.5.5 0 0 1-.5.5 1 1 0 0 0 0 2 .5.5 0 0 1 .5.5v2.5A1.5 1.5 0 0 1 12.982 13H3A1.5 1.5 0 0 1 1.5 11.5V8a.5.5 0 0 1 .5-.5 1 1 0 1 0 0-2 .5.5 0 0 1-.5-.5V3.5z",
  create:  "M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16zM8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z",
  bell:    "M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z",
  logout:  "M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z",
  back:    "M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z",
  trash:   "M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6zM14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z",
  upload:  "M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z",
  image:   "M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z",
  video:   "M0 1a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V1zm4 0v6h8V1H4zm8 8H4v6h8V9zM1 1v2h2V1H1zm2 3H1v2h2V4zM1 7v2h2V7H1zm2 3H1v2h2v-2zm-2 3v2h2v-2H1zM15 1h-2v2h2V1zm-2 3v2h2V4h-2zm2 3h-2v2h2V7zm-2 3v2h2v-2h-2zm2 3h-2v2h2v-2z",
  close:   "M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z",
};

const PrioBadge   = ({p}) => { const m={low:["Faible","prio-low"],medium:["Moyen","prio-medium"],high:["Haute","prio-high"],critical:["Critique","prio-critical"]}; const [l,c]=m[p]||["—","prio-medium"]; return <span className={`prio-badge ${c}`}>{l}</span>; };
const StatutBadge = ({s}) => { const m={ready_for_support:["À faire","badge-waiting"],in_progress:["En cours","badge-progress"],ready_for_customer:["À confirmer","badge-validate"],solved:["Résolu","badge-solved"],closed:["Fermé","badge-closed"],cancelled:["Annulé","badge-cancelled"],escalated:["Escaladé","badge-escalated"]}; const [l,c]=m[s]||[s,"badge-waiting"]; return <span className={`status-badge ${c}`}>{l}</span>; };

const fmtDate   = d => new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});
const ticketRef = id => id?`#${id.slice(-5).toUpperCase()}`:"";
const typeLabel = t => t==="bug"?"Bug":t==="feature"?"Nouvelle fonctionnalité":"Consultation";
const fmtSize   = b => b>1024*1024?`${(b/1024/1024).toFixed(1)} Mo`:`${(b/1024).toFixed(0)} Ko`;

export default function ClientHome() {
  const navigate = useNavigate();
  const user = getUser(), token = getToken();
  const fileInputRef = useRef(null);

  const [tickets,setTickets]       = useState([]);
  const [loading,setLoading]       = useState(true);
  const [tab,setTab]               = useState("liste");
  const [selTicket,setSelTicket]   = useState(null);
  const [commentaire,setComment]   = useState("");
  const [feedback,setFeedback]     = useState({note:0,message:""});
  const [serverMsg,setSM]          = useState("");
  const [serverErr,setSE]          = useState("");
  const [notifs,setNotifs]         = useState([]);
  const [notifCount,setNC]         = useState(0);
  const [showNotifs,setShowN]      = useState(false);
  const [form,setForm]             = useState({titre:"",description:"",type:"bug",priorite:"medium"});
  const [fichiers,setFichiers]     = useState([]); // fichiers sélectionnés
  const [previews,setPreviews]     = useState([]); // previews locaux
  const [dragOver,setDragOver]     = useState(false);
  const [filtreStatut,setFiltreStatut] = useState(null);
  const [lightbox,setLightbox]     = useState(null); // {src, type}

  useEffect(() => {
    if(!token||!user){navigate("/login");return;}
    fetchTickets(); fetchNotifCount();
    const iv = setInterval(fetchNotifCount,30000);
    return ()=>clearInterval(iv);
  },[]);

  // Nettoyer les URLs de preview quand on quitte
  useEffect(() => {
    return () => previews.forEach(p => URL.revokeObjectURL(p.url));
  }, [previews]);

  const fetchTickets    = () => { setLoading(true); fetch(`${API}/tickets/mes-tickets`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setTickets(d.tickets);}).finally(()=>setLoading(false)); };
  const fetchNotifCount = () => fetch(`${API}/notifications/non-lues`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setNC(d.count);}).catch(()=>{});
  const fetchNotifList  = () => fetch(`${API}/notifications`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setNotifs(d.notifications);}).catch(()=>{});
  const fetchDetail     = id => fetch(`${API}/tickets/${id}`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.status==="ok")setSelTicket(d.ticket);});

  const toggleNotifs = () => {
    if(!showNotifs){fetchNotifList();fetch(`${API}/notifications/lire-tout`,{method:"PUT",headers:{Authorization:`Bearer ${token}`}}).then(()=>setNC(0)).catch(()=>{});}
    setShowN(!showNotifs);
  };
  const deleteNotif = async (e,id) => { e.stopPropagation(); try{await fetch(`${API}/notifications/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});setNotifs(p=>p.filter(n=>n._id!==id));}catch{} };
  const deleteAllNotifs = async () => { try{await fetch(`${API}/notifications/tout`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});setNotifs([]);setNC(0);}catch{} };

  // ---- Gestion fichiers ----
  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles);
    const allowed = ["image/jpeg","image/jpg","image/png","image/gif","image/webp","video/mp4","video/quicktime","video/webm","video/avi"];
    const valid = arr.filter(f => {
      if(!allowed.includes(f.type)){ alert(`Format non supporté : ${f.name}`); return false; }
      if(f.size > 50*1024*1024){ alert(`Fichier trop lourd (max 50MB) : ${f.name}`); return false; }
      return true;
    });
    if(fichiers.length + valid.length > 5){ alert("Maximum 5 fichiers par ticket"); return; }
    const newPreviews = valid.map(f => ({
      url: URL.createObjectURL(f),
      type: f.type.startsWith("video") ? "video" : "image",
      name: f.name,
      size: f.size,
    }));
    setFichiers(prev => [...prev, ...valid]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (idx) => {
    URL.revokeObjectURL(previews[idx].url);
    setFichiers(prev => prev.filter((_,i)=>i!==idx));
    setPreviews(prev => prev.filter((_,i)=>i!==idx));
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const createTicket = async (e) => {
    e.preventDefault(); setSE(""); setSM("");
    if(!form.titre||!form.description){setSE("Titre et description sont obligatoires");return;}
    try {
      const formData = new FormData();
      formData.append("titre", form.titre);
      formData.append("description", form.description);
      formData.append("type", form.type);
      formData.append("priorite", form.priorite);
      fichiers.forEach(f => formData.append("fichiers", f));

      const res = await fetch(`${API}/tickets`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const d = await res.json();
      if(d.status==="ok"){
        setSM("Ticket créé avec succès.");
        setForm({titre:"",description:"",type:"bug",priorite:"medium"});
        setFichiers([]); setPreviews([]);
        fetchTickets();
        setTimeout(()=>{ setSM(""); setTab("liste"); },1500);
      } else setSE(d.msg);
    } catch { setSE("Erreur de connexion"); }
  };

  const addComment = async (id) => {
    if(!commentaire.trim()) return;
    const res=await fetch(`${API}/tickets/${id}/commentaires`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({contenu:commentaire})});
    const d=await res.json();
    if(d.status==="ok"){setComment("");fetchDetail(id);fetchTickets();}
  };

  const deleteComment = async (ticketId,cId) => {
    if(!window.confirm("Supprimer ce commentaire ?")) return;
    const res=await fetch(`${API}/tickets/${ticketId}/commentaires/${cId}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});
    const d=await res.json();
    if(d.status==="ok") fetchDetail(ticketId); else alert(d.msg);
  };

  const confirmerSolution = async (id) => {
    if(!window.confirm("Confirmez-vous que le problème est résolu ?")) return;
    const res=await fetch(`${API}/tickets/${id}/confirmer`,{method:"PUT",headers:{Authorization:`Bearer ${token}`}});
    const d=await res.json();
    if(d.status==="ok"){fetchTickets();fetchDetail(id);}else alert(d.msg);
  };

  const fermerTicket = async (id) => {
    if(!window.confirm("Voulez-vous fermer ce ticket ?")) return;
    const res=await fetch(`${API}/tickets/${id}/fermer`,{method:"PUT",headers:{Authorization:`Bearer ${token}`}});
    const d=await res.json();
    if(d.status==="ok"){fetchTickets();fetchDetail(id);}
  };

  const sendFeedback = async (id) => {
    if(!feedback.note){alert("Veuillez choisir une note");return;}
    const res=await fetch(`${API}/tickets/${id}/feedback`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(feedback)});
    const d=await res.json();
    if(d.status==="ok"){setFeedback({note:0,message:""});fetchDetail(id);fetchTickets();}else alert(d.msg);
  };

  const logout = () => { localStorage.clear(); sessionStorage.clear(); navigate("/login"); };

  const stats = {
    total:    tickets.length,
    enAttente:tickets.filter(t=>t.statut==="ready_for_support").length,
    enCours:  tickets.filter(t=>t.statut==="in_progress").length,
    resolus:  tickets.filter(t=>["solved","closed"].includes(t.statut)).length,
  };

  const ticketsFiltres = filtreStatut === null
    ? tickets
    : filtreStatut === "resolved"
      ? tickets.filter(t => ["solved","closed"].includes(t.statut))
      : tickets.filter(t => t.statut === filtreStatut);

  const handleStatCard = (filtre) => {
    setFiltreStatut(prev => filtre === null ? null : prev === filtre ? null : filtre);
    setTab("liste"); setSelTicket(null);
  };

  return (
    <div className="ch-layout">

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={()=>setLightbox(null)}>
          <button className="lightbox-close" onClick={()=>setLightbox(null)}><Ico d={D.close} size={16}/></button>
          {lightbox.type==="image"
            ? <img src={lightbox.src} alt="preview" className="lightbox-img" onClick={e=>e.stopPropagation()}/>
            : <video src={lightbox.src} controls autoPlay className="lightbox-video" onClick={e=>e.stopPropagation()}/>
          }
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><Ico d={D.tickets} size={14}/></div>
          <span className="sidebar-brand-name">TicketFlow</span>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${tab==="liste"?"active":""}`} onClick={()=>{setTab("liste");setSelTicket(null);}}>
            <Ico d={D.tickets} size={14}/> Mes tickets
          </button>
          <button className={`nav-item ${tab==="creer"?"active":""}`} onClick={()=>{setTab("creer");setSelTicket(null);}}>
            <Ico d={D.create} size={14}/> Créer un ticket
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{user?.prenom?.[0]}{user?.nom?.[0]}</div>
            <div className="user-info"><span className="user-name">{user?.prenom} {user?.nom}</span><span className="user-role">Client</span></div>
            <button className="btn-logout" onClick={logout}><Ico d={D.logout} size={13}/></button>
          </div>
        </div>
      </aside>

      <main className="ch-main">
        {/* PAGE HEADER */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-header-title">{tab==="creer"?"Créer un ticket":selTicket?selTicket.titre:"Mes tickets"}</div>
            <div className="page-header-subtitle">{stats.total} ticket{stats.total!==1?"s":""} · {stats.enCours} en cours</div>
          </div>
          <div className="page-header-right">
            <div className="notif-wrapper">
              <button className="notif-btn" onClick={toggleNotifs}><Ico d={D.bell} size={13}/> Notifications {notifCount>0&&<span className="notif-badge">{notifCount}</span>}</button>
              {showNotifs && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown-header">
                    <p className="notif-header">Notifications</p>
                    {notifs.length>0&&<button className="notif-clear-all" onClick={deleteAllNotifs}>Tout effacer</button>}
                  </div>
                  {notifs.length===0?<p className="notif-empty">Aucune notification</p>:notifs.map(n=>(
                    <div key={n._id} className={`notif-item ${n.lu?"":"notif-unread"}`}>
                      <div className="notif-item-content" onClick={()=>{setShowN(false);setTab("liste");if(n.ticket)fetchDetail(n.ticket._id);}}>
                        <p className="notif-msg">{n.message}</p>
                        <p className="notif-date">{fmtDate(n.createdAt)}</p>
                      </div>
                      <button className="notif-delete-btn" onClick={e=>deleteNotif(e,n._id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="page-content">
          {/* STATS */}
          <div className="stats-grid">
            {[
              {label:"Total",       value:stats.total,     cls:"stat-total-c", filtre:null},
              {label:"En attente",  value:stats.enAttente, cls:"stat-wait-c",  filtre:"ready_for_support"},
              {label:"En cours",    value:stats.enCours,   cls:"stat-prog-c",  filtre:"in_progress"},
              {label:"Résolus",     value:stats.resolus,   cls:"stat-done-c",  filtre:"resolved"},
            ].map(s=>(
              <div key={s.label}
                className={`stat-card ${s.cls}${filtreStatut===s.filtre?" stat-active":""}`}
                onClick={()=>handleStatCard(s.filtre)}
                style={{cursor:"pointer"}}
              >
                <span className="stat-number">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* CRÉER TICKET */}
          {tab==="creer" && (
            <div className="page-card">
              <p className="card-title">Nouveau ticket</p>
              <p className="card-subtitle">Décrivez votre problème et notre équipe vous répondra rapidement.</p>
              {serverErr&&<div className="alert alert-error">{serverErr}</div>}
              {serverMsg&&<div className="alert alert-success">{serverMsg}</div>}
              <form onSubmit={createTicket} noValidate>
                <div className="form-group">
                  <label>Titre <span className="req">*</span></label>
                  <input className="form-input" placeholder="Décrivez brièvement le problème" value={form.titre} onChange={e=>setForm({...form,titre:e.target.value})}/>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type <span className="req">*</span></label>
                    <select className="form-select" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                      <option value="bug">Bug</option>
                      <option value="feature">Nouvelle fonctionnalité</option>
                      <option value="consultancy">Consultation</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Priorité</label>
                    <select className="form-select" value={form.priorite} onChange={e=>setForm({...form,priorite:e.target.value})}>
                      <option value="low">Faible</option>
                      <option value="medium">Moyen</option>
                      <option value="high">Haute</option>
                      <option value="critical">Critique</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description <span className="req">*</span></label>
                  <textarea className="form-textarea" placeholder="Décrivez le problème en détail..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={5}/>
                </div>

                {/* ZONE UPLOAD */}
                <div className="form-group">
                  <label>
                    <Ico d={D.upload} size={12}/> Pièces jointes
                    <span style={{fontWeight:400,color:"#8c959f",marginLeft:6}}>Images ou vidéos · max 5 fichiers · 50 Mo chacun</span>
                  </label>

                  <div
                    className={`upload-zone ${dragOver?"upload-zone-drag":""}`}
                    onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                    onDragLeave={()=>setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={()=>fileInputRef.current?.click()}
                  >
                    <Ico d={D.upload} size={20}/>
                    <p className="upload-zone-text">Glissez vos fichiers ici ou <span className="upload-zone-link">parcourez</span></p>
                    <p className="upload-zone-hint">JPG, PNG, GIF, WEBP, MP4, MOV, WEBM</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    style={{display:"none"}}
                    onChange={e=>addFiles(e.target.files)}
                  />

                  {/* PREVIEWS */}
                  {previews.length > 0 && (
                    <div className="upload-previews">
                      {previews.map((p,i)=>(
                        <div key={i} className="upload-preview-item">
                          {p.type==="image"
                            ? <img src={p.url} alt={p.name} className="preview-thumb" onClick={e=>{e.stopPropagation();setLightbox({src:p.url,type:"image"});}}/>
                            : (
                              <div className="preview-video-thumb" onClick={e=>{e.stopPropagation();setLightbox({src:p.url,type:"video"});}}>
                                <video src={p.url} className="preview-thumb"/>
                                <div className="preview-video-overlay"><Ico d={D.video} size={18}/></div>
                              </div>
                            )
                          }
                          <div className="preview-info">
                            <span className="preview-name">{p.name}</span>
                            <span className="preview-size">{fmtSize(fichiers[i]?.size||0)}</span>
                          </div>
                          <button type="button" className="preview-remove" onClick={e=>{e.stopPropagation();removeFile(i);}}>
                            <Ico d={D.close} size={10}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-primary">Soumettre le ticket</button>
              </form>
            </div>
          )}

          {/* LISTE TICKETS */}
          {tab==="liste" && !selTicket && (
            <div className="page-card">
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <p className="card-title" style={{margin:0}}>Mes tickets</p>
                {filtreStatut!==null&&(
                  <button onClick={()=>setFiltreStatut(null)} style={{fontSize:12,color:"#57606a",background:"#f6f8fa",border:"1px solid #d0d7de",borderRadius:6,padding:"4px 10px",cursor:"pointer"}}>
                    ✕ Réinitialiser le filtre
                  </button>
                )}
              </div>
              {loading?<div className="loading">Chargement...</div>:ticketsFiltres.length===0?(
                <div className="empty-state">
                  <p>{filtreStatut?"Aucun ticket pour ce filtre.":"Aucun ticket pour l'instant."}</p>
                  {!filtreStatut&&<button className="btn-primary" onClick={()=>setTab("creer")}>Créer mon premier ticket</button>}
                </div>
              ):(
                <div className="tickets-list">
                  {ticketsFiltres.map(t=>(
                    <div key={t._id} className="ticket-row" onClick={()=>{setSelTicket(t);fetchDetail(t._id);}}>
                      <div className="ticket-row-left">
                        <span className="ticket-id">{ticketRef(t._id)}</span>
                        <div>
                          <div className="ticket-title">{t.titre}</div>
                          <div className="ticket-meta">
                            {typeLabel(t.type)} · {fmtDate(t.createdAt)}
                            {t.fichiers?.length>0&&<span className="ticket-attachment-badge">📎 {t.fichiers.length}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="ticket-row-right">
                        <PrioBadge p={t.priorite}/>
                        <StatutBadge s={t.statut}/>
                        {t.statut==="ready_for_customer"&&<span className="action-required">Action requise</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DETAIL TICKET */}
          {tab==="liste" && selTicket && (
            <div className="page-card">
              <button className="btn-back" onClick={()=>setSelTicket(null)}><Ico d={D.back} size={12}/> Retour</button>
              <div style={{marginBottom:16,paddingBottom:14,borderBottom:"1px solid #eaecef"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontFamily:"monospace",fontSize:11,color:"#8c959f"}}>{ticketRef(selTicket._id)}</span>
                  <StatutBadge s={selTicket.statut}/><PrioBadge p={selTicket.priorite}/>
                  <span className="type-badge">{typeLabel(selTicket.type)}</span>
                </div>
                <h2 style={{fontSize:17,fontWeight:600,color:"#1a1d23",marginBottom:6}}>{selTicket.titre}</h2>
                <div style={{fontSize:12,color:"#57606a"}}>
                  Créé le {fmtDate(selTicket.createdAt)}
                  {selTicket.assignee&&<> · Assigné à <strong>{selTicket.assignee.prenom} {selTicket.assignee.nom}</strong></>}
                </div>
              </div>

              <div style={{background:"#f6f8fa",border:"1px solid #e8eaed",borderRadius:6,padding:"12px 14px",marginBottom:14}}>
                <p style={{fontSize:13,color:"#1a1d23",lineHeight:1.7,margin:0}}>{selTicket.description}</p>
              </div>

              {/* FICHIERS JOINTS */}
              {selTicket.fichiers?.length > 0 && (
                <div className="ticket-fichiers-section">
                  <p className="ticket-fichiers-title">
                    <Ico d={D.upload} size={12}/> Pièces jointes ({selTicket.fichiers.length})
                  </p>
                  <div className="ticket-fichiers-grid">
                    {selTicket.fichiers.map((f,i)=>(
                      <div key={i} className="ticket-fichier-item"
                        onClick={()=>setLightbox({src:`http://localhost:3001${f.chemin}`,type:f.type})}
                      >
                        {f.type==="image"
                          ? <img src={`http://localhost:3001${f.chemin}`} alt={f.nom} className="fichier-thumb"/>
                          : (
                            <div className="fichier-video-thumb">
                              <video src={`http://localhost:3001${f.chemin}`} className="fichier-thumb"/>
                              <div className="fichier-video-overlay"><Ico d={D.video} size={20}/></div>
                            </div>
                          )
                        }
                        <p className="fichier-name">{f.nom}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions client */}
              {selTicket.statut==="ready_for_customer" && (
                <div className="confirm-box">
                  <p className="confirm-text">Le support a proposé une solution. Votre problème est-il résolu ?</p>
                  <div className="confirm-btns">
                    <button className="btn-confirm" onClick={()=>confirmerSolution(selTicket._id)}>Confirmer la solution</button>
                    <button className="btn-reopen" onClick={()=>setComment("La solution proposée ne résout pas mon problème : ")}>Pas encore résolu</button>
                  </div>
                </div>
              )}
              {!["closed","cancelled","solved"].includes(selTicket.statut)&&(
                <div style={{marginBottom:14}}>
                  <button className="btn-danger-outline" onClick={()=>fermerTicket(selTicket._id)}>Fermer ce ticket</button>
                </div>
              )}

              {/* Commentaires */}
              <div className="commentaires-section">
                <h3>Commentaires ({selTicket.commentaires?.length||0})</h3>
                <div className="commentaires-list">
                  {selTicket.commentaires?.length===0&&<p className="no-comment">Aucun commentaire pour l'instant.</p>}
                  {selTicket.commentaires?.map(c=>(
                    <div key={c._id} className="commentaire-item">
                      <div className={`comment-avatar ${c.auteur?.role!=="client"?"avatar-support":"avatar-client"}`}>{c.auteur?.prenom?.[0]}{c.auteur?.nom?.[0]}</div>
                      <div className="comment-body">
                        <div className="comment-header">
                          <span className="comment-author">{c.auteur?.prenom} {c.auteur?.nom}<span className="comment-role"> · {c.auteur?.role==="client"?"Vous":"Support"}</span></span>
                          {c.auteur?.role==="client"&&<button className="btn-delete-comment" onClick={()=>deleteComment(selTicket._id,c._id)} title="Supprimer"><Ico d={D.trash} size={11}/></button>}
                        </div>
                        <p className="comment-text">{c.contenu}</p>
                        <p className="comment-date">{fmtDate(c.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {!["closed","cancelled"].includes(selTicket.statut)&&(
                  <div className="add-comment">
                    <textarea className="form-textarea" placeholder="Ajouter une information ou répondre au support..." value={commentaire} onChange={e=>setComment(e.target.value)} rows={3}/>
                    <button className="btn-primary" onClick={()=>addComment(selTicket._id)}>Commenter</button>
                  </div>
                )}
              </div>

              {/* Feedback */}
              {["solved","closed"].includes(selTicket.statut)&&!selTicket.feedback?.note&&(
                <div className="feedback-section">
                  <h3>Évaluation</h3>
                  <div className="stars">
                    {[1,2,3,4,5].map(n=><button key={n} className={`star ${feedback.note>=n?"active":""}`} onClick={()=>setFeedback({...feedback,note:n})}>★</button>)}
                  </div>
                  <textarea className="form-textarea" placeholder="Votre commentaire (optionnel)..." value={feedback.message} onChange={e=>setFeedback({...feedback,message:e.target.value})} rows={3} style={{marginBottom:8}}/>
                  <button className="btn-primary" onClick={()=>sendFeedback(selTicket._id)}>Envoyer l'évaluation</button>
                </div>
              )}
              {selTicket.feedback?.note>0&&(
                <div className="feedback-done">
                  <p>Vous avez donné une note de <strong>{selTicket.feedback.note}/5</strong>{selTicket.feedback.message&&` — "${selTicket.feedback.message}"`}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}