import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart, LabelList, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const API = "http://localhost:3001/api";

const STATUT_C = {
  ready_for_support:"#d97706", in_progress:"#1e6fd4",
  ready_for_customer:"#7c3aed", escalated:"#e03535",
  solved:"#0e9e6e", closed:"#64748b", cancelled:"#94a3b8",
};

const PALETTE = [
  "#1e6fd4","#0e9e6e","#e03535","#d97706","#7c3aed","#64748b",
  "#d4537e","#0891b2","#dc2626","#16a34a","#ea580c","#9333ea",
  "#0f172a","#374151","#f59e0b","#06b6d4","#be185d","#0369a1",
];

const AGENT_COLORS = [
  "#1e6fd4","#0e9e6e","#7c3aed","#d97706","#e03535","#0891b2",
  "#d4537e","#16a34a","#ea580c","#9333ea",
];

const DEFAULT_CARD_COLORS  = ["#1e6fd4","#0e9e6e","#0e9e6e","#e03535","#7c3aed","#1e6fd4","#e03535","#d97706"];
const DEFAULT_GAUGE_COLORS = ["#d97706","#e03535","#0e9e6e"];
const DEFAULT_TYPE_COLORS  = { bug:"#e03535", feature:"#1e6fd4", consultancy:"#0e9e6e" };
const DEFAULT_PRIO_COLORS  = { critical:"#991818", high:"#92500a", medium:"#0d4a99", low:"#076645" };
const DEFAULT_WIDGET_ORDER  = [0,1,2,3,4,5,6];
const DEFAULT_WIDGET_COLORS = {
  evolution1:"#1e6fd4", evolution2:"#0e9e6e",
  perf1:"#1e6fd4", perf2:"#0e9e6e",
  workload:"#0e9e6e",
};

const LS = {
  cardColors:"bi_card_colors2", gaugeColors:"bi_gauge_colors2",
  cardOrder:"bi_card_order2",   gaugeOrder:"bi_gauge_order2",
  typeColors:"bi_type_colors2", prioColors:"bi_prio_colors2",
  widgetOrder:"bi_widget_order2", widgetColors:"bi_widget_colors2",
};

function lsGet(k,fb){ try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;} }
function lsSet(k,v){ try{localStorage.setItem(k,JSON.stringify(v));}catch{} }

const fmtMin  = m=>{ if(!m) return "—"; const h=Math.floor(m/60),r=m%60; return h>0?(r>0?`${h}h${r}m`:`${h}h`):`${r}m`; };
const fmtDate = d=>new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"});

const PERIODES = [
  {key:"tous",   label:"Tout",         prev:""},
  {key:"semaine",label:"Cette semaine",prev:"semaine préc."},
  {key:"mois",   label:"Ce mois",      prev:"mois dernier"},
  {key:"3mois",  label:"3 mois",       prev:"trim. préc."},
  {key:"annee",  label:"Cette année",  prev:"année préc."},
];

const RADAR_AXES = [
  { key:"satisfaction", label:"Satisfaction", color:"#7c3aed" },
  { key:"tauxSla",      label:"Taux SLA",     color:"#e03535" },
  { key:"resolution",   label:"Résolution",   color:"#0e9e6e" },
  { key:"charge",       label:"Charge",       color:"#d97706" },
  { key:"escalades",    label:"Escalades",    color:"#1e6fd4" },
];

const Tip = ({active,payload,label})=>{
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:8,padding:"8px 12px",fontSize:11,minWidth:120,zIndex:999}}>
      <p style={{fontWeight:500,color:"var(--color-text-primary)",marginBottom:4}}>{label}</p>
      {payload.map((p,i)=><p key={i} style={{color:p.color,margin:"1px 0"}}>{p.name}: <b>{p.value}</b></p>)}
    </div>
  );
};

const RadarTip = ({active,payload})=>{
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:8,padding:"8px 12px",fontSize:11,zIndex:999}}>
      <p style={{fontWeight:500,color:"var(--color-text-primary)",marginBottom:4}}>{payload[0]?.payload?.axe}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{color:p.color,margin:"1px 0"}}>{p.name}: <b>{p.value}</b>/100</p>
      ))}
    </div>
  );
};

function Gauge({value,max=100,color,label,size=110}){
  const pct=Math.min(Math.max(value||0,0),max)/max;
  const R=36,cx=50,cy=56;
  const sA=(210*Math.PI)/180, tA=(240*Math.PI)/180, eA=sA-tA;
  const pt=(a,r=R)=>({x:cx+r*Math.cos(a),y:cy-r*Math.sin(a)});
  const s=pt(sA),e=pt(eA),va=sA-pct*tA,v=pt(va);
  const la=pct*tA>Math.PI?1:0;
  return (
    <svg viewBox="0 0 100 72" width={size} height={size*0.72} style={{display:"block",margin:"0 auto"}}>
      <path d={`M${s.x} ${s.y} A${R} ${R} 0 1 1 ${e.x} ${e.y}`} fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round"/>
      {pct>0&&<path d={`M${s.x} ${s.y} A${R} ${R} 0 ${la} 1 ${v.x} ${v.y}`} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"/>}
      <text x={cx} y={cy-4} textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>{value}{max===5?"/5":"%"}</text>
      <text x={cx} y={cy+10} textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">{label}</text>
    </svg>
  );
}

function Spark({data,color,w=80,h=28}){
  if(!data||data.length<2) return <div style={{width:w,height:h}}/>;
  const vals=data.map(d=>d.crees),mx=Math.max(...vals,1);
  const pts=vals.map((v,i)=>`${(i/(vals.length-1))*w},${h-(v/mx)*(h-4)+2}`).join(" ");
  return (
    <svg width={w} height={h} style={{display:"block",overflow:"visible"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".8"/>
      <circle cx={w} cy={h-(vals[vals.length-1]/mx)*(h-4)+2} r="2.5" fill={color}/>
    </svg>
  );
}

function ColorPicker({current,onSelect,onClose}){
  return (
    <div onClick={e=>e.stopPropagation()}
      style={{position:"absolute",top:"100%",right:0,zIndex:500,background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:10,padding:10,display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:5,width:148,marginTop:4,boxShadow:"0 4px 20px rgba(0,0,0,0.14)"}}>
      {PALETTE.map(c=>(
        <div key={c} onClick={()=>{onSelect(c);onClose();}}
          style={{width:18,height:18,borderRadius:"50%",background:c,cursor:"pointer",border:`2.5px solid ${c===current?"#111":"transparent"}`,transition:"transform .1s"}}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.25)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}/>
      ))}
    </div>
  );
}

function ColorDot({color,onChange,style={}}){
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    if(open)document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[open]);
  return (
    <div style={{position:"relative",...style}} ref={ref}>
      <div onClick={e=>{e.stopPropagation();setOpen(o=>!o);}} title="Changer couleur"
        style={{width:16,height:16,borderRadius:"50%",background:color,cursor:"pointer",border:"2px solid var(--color-background-primary)",boxShadow:"0 0 0 1px var(--color-border-secondary)",flexShrink:0}}/>
      {open&&<ColorPicker current={color} onSelect={c=>{onChange(c);setOpen(false);}} onClose={()=>setOpen(false)}/>}
    </div>
  );
}

function DraggableWidget({index,adminMode,dragOver,onDragStart,onDragOver,onDrop,onDragEnd,children}){
  return (
    <div draggable={true}
      onDragStart={()=>onDragStart(index)}
      onDragOver={e=>{e.preventDefault();onDragOver(index);}}
      onDrop={e=>{e.preventDefault();onDrop(index);}}
      onDragEnd={onDragEnd}
      style={{outline:dragOver===index?"2px dashed #1e6fd4":"none",borderRadius:10,cursor:adminMode?"grab":"default",position:"relative",transition:"outline .1s"}}>
      {adminMode&&<div style={{position:"absolute",top:6,left:8,fontSize:14,color:"var(--color-text-secondary)",userSelect:"none",zIndex:10,pointerEvents:"none"}}>⠿</div>}
      {children}
    </div>
  );
}

function KpiCard({label,valeur,valeurPrev,unit="",colorMain,inverse=false,showCmp=false,prevLabel="",max=null,sparkData=null,adminMode=false,onColorChange,draggable=false,onDragStart,onDragOver,onDrop,onDragEnd,isDragOver=false,cardBg,textCol}){
  const [showPicker,setShowPicker]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setShowPicker(false);};
    if(showPicker)document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[showPicker]);
  const bg   = cardBg  || "#ffffff";
  const tc   = textCol || "#111827";
  const tcsub = tc + "99";
  const nv=typeof valeur==="number"?valeur:null;
  const np=typeof valeurPrev==="number"?valeurPrev:null;
  const diff=nv!==null&&np!==null?nv-np:null;
  const pct=diff!==null&&np>0?Math.round((diff/np)*100):null;
  const good=inverse?(diff!==null&&diff<=0):(diff!==null&&diff>=0);
  const bw=max!==null&&nv!==null?Math.min(100,Math.round((nv/max)*100)):unit==="%"&&nv!==null?Math.min(100,nv):55;
  const disp=unit==="m"?fmtMin(nv):nv!==null?`${nv}${unit}`:"—";
  const dp=unit==="m"?fmtMin(np):np!==null?`${np}${unit}`:"—";
  const gc=good?"#0e9e6e":diff===0?"#64748b":"#e03535";
  const gbg=good?"#e3f7f0":diff===0?"rgba(100,116,139,.12)":"#fde8e8";
  return (
    <div draggable={draggable} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}
      style={{background:bg,border:`1px solid ${isDragOver?colorMain:"rgba(0,0,0,.1)"}`,borderRadius:12,padding:"14px 16px",position:"relative",overflow:"visible",cursor:draggable?"grab":"default",outline:isDragOver?`2px dashed ${colorMain}`:"none",transition:"outline .1s, box-shadow .15s",boxShadow:isDragOver?`0 0 0 3px ${colorMain}33, 0 4px 16px rgba(0,0,0,.08)`:"0 1px 4px rgba(0,0,0,.06), 0 2px 12px rgba(0,0,0,.04)"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:colorMain,borderRadius:"10px 10px 0 0"}}/>
      {adminMode&&<div style={{position:"absolute",top:6,left:8,fontSize:13,color:tcsub,userSelect:"none",pointerEvents:"none"}}>⠿</div>}
      {adminMode&&(
        <div style={{position:"absolute",top:6,right:6,zIndex:100}} ref={ref}>
          <div onClick={()=>setShowPicker(o=>!o)} style={{width:16,height:16,borderRadius:"50%",background:colorMain,border:`2px solid ${bg}`,cursor:"pointer",boxShadow:"0 0 0 1px rgba(0,0,0,.15)"}}/>
          {showPicker&&<ColorPicker current={colorMain} onSelect={c=>{onColorChange(c);setShowPicker(false);}} onClose={()=>setShowPicker(false)}/>}
        </div>
      )}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6,marginTop:4,paddingLeft:adminMode?14:0,paddingRight:adminMode?14:0}}>
        <p style={{fontSize:10,fontWeight:500,color:tcsub,textTransform:"uppercase",letterSpacing:".06em",margin:0}}>{label}</p>
        {sparkData&&<Spark data={sparkData} color={colorMain}/>}
      </div>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:8}}>
        <p style={{fontSize:26,fontWeight:700,color:colorMain,lineHeight:1,margin:0}}>{disp}</p>
        {showCmp&&diff!==null&&<span style={{fontSize:11,fontWeight:500,padding:"2px 8px",borderRadius:20,background:gbg,color:gc}}>{diff===0?"→":diff>0?"▲":"▼"} {pct!==null?`${Math.abs(pct)}%`:Math.abs(diff)}</span>}
        {!showCmp&&diff!==null&&pct!==null&&<span style={{fontSize:10,color:gc}}>{diff===0?"→":diff>0?"▲":"▼"} {Math.abs(pct)}%</span>}
      </div>
      <div style={{height:3,background:"rgba(0,0,0,.08)",borderRadius:2,overflow:"hidden",marginBottom:6}}>
        <div style={{height:"100%",width:`${bw}%`,background:colorMain,borderRadius:2,transition:"width .6s"}}/>
      </div>
      <p style={{fontSize:10,color:tcsub,margin:0}}>
        {showCmp&&np!==null?<>{prevLabel}: <b style={{color:tc}}>{dp}</b></>
          :diff!==null&&pct!==null?<span style={{color:gc}}>{diff===0?"stable":good?"en hausse":"en baisse"} vs {prevLabel}</span>:"—"}
      </p>
    </div>
  );
}

function GaugeCard({label,value,max,gaugeLabel,statusText,statusColor,gaugeColor,draggable=false,onDragStart,onDragOver,onDrop,onDragEnd,isDragOver=false,cardBg,textCol}){
  const bg = cardBg || "#ffffff";
  const tc = textCol || "#111827";
  return (
    <div draggable={draggable} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}
      style={{background:bg,border:`1px solid ${isDragOver?gaugeColor:"rgba(0,0,0,.1)"}`,borderRadius:12,padding:"16px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",cursor:draggable?"grab":"default",outline:isDragOver?`2px dashed ${gaugeColor}`:"none",boxShadow:isDragOver?`0 0 0 3px ${gaugeColor}33, 0 4px 16px rgba(0,0,0,.08)`:"0 1px 4px rgba(0,0,0,.06), 0 2px 12px rgba(0,0,0,.04)",transition:"box-shadow .15s"}}>
      <p style={{fontSize:10,fontWeight:500,textTransform:"uppercase",letterSpacing:".06em",color:tc+"99",marginBottom:8}}>{label}</p>
      <Gauge value={value} max={max} color={gaugeColor} label={gaugeLabel} size={120}/>
      <p style={{fontSize:11,color:statusColor,marginTop:6,textAlign:"center",fontWeight:500}}>{statusText}</p>
    </div>
  );
}

/* WidgetCard — cadre uniforme pour tous les graphes */
function WidgetCard({title,sub,adminMode,color1,color2,onColor1Change,onColor2Change,label1="Couleur 1",label2=null,isDragOver,cardBg,textCol,children}){
  const bg = cardBg || "#ffffff";
  const tc = textCol || "#111827";
  return (
    <div style={{
      background: bg,
      border:`1px solid ${isDragOver?"#1e6fd4":"rgba(0,0,0,.1)"}`,
      borderRadius:12,
      padding:"16px 18px",
      outline:isDragOver?"2px dashed #1e6fd4":"none",
      transition:"outline .1s, box-shadow .15s",
      height:"100%",
      boxShadow: isDragOver
        ? "0 0 0 3px #1e6fd433, 0 4px 16px rgba(0,0,0,.08)"
        : "0 1px 4px rgba(0,0,0,.06), 0 2px 12px rgba(0,0,0,.04)",
    }}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
        <div>
          <p style={{fontSize:12,fontWeight:600,color: tc,margin:0}}>{title}</p>
          {sub&&<p style={{fontSize:10,color: tc+"99",margin:"2px 0 0"}}>{sub}</p>}
        </div>
        {adminMode&&(
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {color1&&<div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontSize:9,color:"var(--color-text-secondary)"}}>{label1}</span>
              <ColorDot color={color1} onChange={onColor1Change}/>
            </div>}
            {color2&&label2&&<div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontSize:9,color:"var(--color-text-secondary)"}}>{label2}</span>
              <ColorDot color={color2} onChange={onColor2Change}/>
            </div>}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Presets couleurs ── */
const BG_PRESETS = [
  {label:"Blanc",value:"#f6f8fa"},{label:"Ardoise",value:"#f1f5f9"},{label:"Bleu pâle",value:"#eff6ff"},
  {label:"Vert pâle",value:"#f0fdf4"},{label:"Violet pâle",value:"#f5f3ff"},{label:"Ambre pâle",value:"#fffbeb"},
  {label:"Gris perle",value:"#e2e8f0"},{label:"Lavande",value:"#e0e7ff"},{label:"Gris foncé",value:"#334155"},
  {label:"Bleu marine",value:"#0f172a"},{label:"Indigo foncé",value:"#1e1b4b"},{label:"Noir",value:"#09090b"},
];
const TEXT_PRESETS = [
  {label:"Noir",value:"#111827"},{label:"Gris foncé",value:"#374151"},{label:"Ardoise",value:"#475569"},
  {label:"Blanc",value:"#ffffff"},{label:"Gris clair",value:"#e5e7eb"},{label:"Bleu",value:"#1d4ed8"},
  {label:"Vert",value:"#15803d"},{label:"Violet",value:"#6d28d9"},{label:"Rouge",value:"#b91c1c"},
  {label:"Orange",value:"#c2410c"},{label:"Indigo",value:"#3730a3"},{label:"Teal",value:"#0f766e"},
];
const CARD_PRESETS_BG = [
  {label:"Blanc",value:"#ffffff"},{label:"Gris très clair",value:"#f9fafb"},{label:"Bleu clair",value:"#eff6ff"},
  {label:"Vert clair",value:"#f0fdf4"},{label:"Violet clair",value:"#f5f3ff"},{label:"Ambre clair",value:"#fffbeb"},
  {label:"Gris perle",value:"#f1f5f9"},{label:"Rose clair",value:"#fff1f2"},{label:"Gris moyen",value:"#e2e8f0"},
  {label:"Ardoise",value:"#1e293b"},{label:"Gris foncé",value:"#1f2937"},{label:"Noir",value:"#111827"},
];

function BgPanel({ bg, onChangeBg, textColor, onChangeText, cardColor, onChangeCard, onClose }) {
  const [activeTab, setActiveTab] = useState("bg");
  const presets    = activeTab==="bg" ? BG_PRESETS : activeTab==="text" ? TEXT_PRESETS : CARD_PRESETS_BG;
  const currentVal = activeTab==="bg" ? bg : activeTab==="text" ? textColor : cardColor;
  const onChange   = activeTab==="bg" ? onChangeBg : activeTab==="text" ? onChangeText : onChangeCard;
  const TABS = [{id:"bg",label:"Fond de page"},{id:"text",label:"Couleur texte"},{id:"card",label:"Fond des cartes"}];
  return (
    <div style={{position:"fixed",inset:0,zIndex:8000,display:"flex",alignItems:"center",justifyContent:"center"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#fff",borderRadius:16,width:520,maxWidth:"92vw",maxHeight:"88vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,.22)",overflow:"hidden"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <span style={{fontSize:15,fontWeight:600,color:"#111827"}}>Apparence du tableau de bord</span>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:"#9ca3af"}}>×</button>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid #f1f5f9",background:"#f9fafb",flexShrink:0}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{flex:1,padding:"11px 8px",border:"none",background:"none",fontSize:12,fontWeight:activeTab===t.id?600:400,color:activeTab===t.id?"#2563eb":"#6b7280",borderBottom:activeTab===t.id?"2px solid #2563eb":"2px solid transparent",cursor:"pointer"}}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{padding:"16px 20px",overflowY:"auto",flex:1}}>
          <div style={{marginBottom:16,padding:"12px 16px",borderRadius:10,border:"1px solid #e5e7eb",background:bg,display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:8,background:cardColor,border:"1px solid rgba(0,0,0,.1)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:16,fontWeight:700,color:textColor}}>A</span>
            </div>
            <div>
              <p style={{margin:0,fontSize:13,fontWeight:600,color:textColor}}>Aperçu en direct</p>
              <p style={{margin:"2px 0 0",fontSize:11,color:textColor,opacity:.6}}>Fond · Texte · Cartes</p>
            </div>
            <div style={{marginLeft:"auto",display:"flex",gap:6}}>
              {[bg,textColor,cardColor].map((c,i)=>(<div key={i} style={{width:20,height:20,borderRadius:4,background:c,border:"1px solid rgba(0,0,0,.12)"}} title={["Fond","Texte","Cartes"][i]}/>))}
            </div>
          </div>
          <p style={{fontSize:11,color:"#6b7280",margin:"0 0 10px",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>
            {activeTab==="bg"?"Couleurs du fond":activeTab==="text"?"Couleurs du texte":"Couleurs des cartes"}
          </p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:16}}>
            {presets.map(p=>(
              <button key={p.value} onClick={()=>onChange(p.value)}
                style={{display:"flex",alignItems:"center",gap:7,padding:"7px 9px",border:currentVal===p.value?"2px solid #2563eb":"1px solid #e2e8f0",borderRadius:8,background:"#fff",cursor:"pointer",fontSize:11,color:"#374151",textAlign:"left"}}>
                <div style={{width:18,height:18,borderRadius:4,background:p.value,border:"1px solid rgba(0,0,0,.12)",flexShrink:0}}/>
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.label}</span>
              </button>
            ))}
          </div>
          <p style={{fontSize:11,color:"#6b7280",margin:"0 0 8px",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>Couleur personnalisée</p>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <input type="color" value={currentVal} onChange={e=>onChange(e.target.value)}
              style={{width:48,height:40,border:"1px solid #e2e8f0",borderRadius:8,cursor:"pointer",padding:3,flexShrink:0}}/>
            <div style={{flex:1,padding:"10px 14px",borderRadius:8,background:currentVal,border:"1px solid rgba(0,0,0,.1)",fontSize:12,fontWeight:500,color:"#374151"}}>{currentVal}</div>
          </div>
        </div>
        <div style={{padding:"12px 20px",borderTop:"1px solid #f1f5f9",display:"flex",gap:8,flexShrink:0}}>
          <button onClick={()=>{onChangeBg("#f6f8fa");onChangeText("#111827");onChangeCard("#ffffff");}}
            style={{flex:1,padding:"9px",border:"1px solid #e2e8f0",borderRadius:8,background:"#f9fafb",cursor:"pointer",fontSize:12,color:"#6b7280"}}>Tout réinitialiser</button>
          <button onClick={onClose}
            style={{flex:1,padding:"9px",border:"none",borderRadius:8,background:"#2563eb",cursor:"pointer",fontSize:12,color:"#fff",fontWeight:500}}>Appliquer</button>
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
  useEffect(()=>{
    if(!open) return;
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    const t=setTimeout(()=>document.addEventListener("mousedown",h),0);
    return()=>{clearTimeout(t);document.removeEventListener("mousedown",h);};
  },[open]);
  const PRESETS=[
    {label:"Aujourd'hui",value:"today"},{label:"Cette semaine",value:"week"},
    {label:"Ce mois",value:"month"},{label:"Cette année",value:"year"},
    {label:"7 derniers jours",value:"last7"},{label:"30 derniers jours",value:"last30"},
  ];
  const COMPARE_OPTS=[
    {label:"Semaine dernière",value:"prev_week"},{label:"Mois dernier",value:"prev_month"},
    {label:"Année dernière",value:"prev_year"},{label:"Période précédente",value:"prev_period"},
  ];
  const activeLabel=range?.preset?PRESETS.find(p=>p.value===range.preset)?.label:range?.from&&range?.to?`${range.from} → ${range.to}`:"Choisir une période";
  const checkIcon=color=>(<svg width="11" height="11" viewBox="0 0 16 16" fill={color}><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>);
  return (
    <div ref={ref} style={{position:"relative",display:"inline-block"}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",border:"1px solid #e2e8f0",borderRadius:8,background:"#fff",cursor:"pointer",fontSize:12,color:"#374151",fontWeight:500,boxShadow:open?"0 0 0 3px rgba(37,99,235,.15)":"none"}}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="#6b7280"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg>
        <span>{activeLabel}</span>
        {compareMode&&<span style={{background:"#eff6ff",color:"#1d4ed8",padding:"1px 6px",borderRadius:4,fontSize:10,fontWeight:600}}>vs</span>}
        <svg width="8" height="5" viewBox="0 0 8 5" fill="#9ca3af"><path d="M0 0l4 5 4-5z"/></svg>
      </button>
      {open&&(
        <div onClick={e=>e.stopPropagation()}
          style={{position:"absolute",top:"calc(100% + 8px)",right:0,zIndex:9999,background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,boxShadow:"0 16px 40px rgba(0,0,0,.14)",width:280,overflow:"hidden"}}>
          <div style={{display:"flex",borderBottom:"1px solid #f1f5f9"}}>
            {[{id:"preset",label:"Période"},{id:"custom",label:"Calendrier"},{id:"compare",label:"Comparer"}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{flex:1,padding:"9px 4px",border:"none",background:"none",fontSize:11,fontWeight:tab===t.id?600:400,color:tab===t.id?"#2563eb":"#6b7280",borderBottom:tab===t.id?"2px solid #2563eb":"2px solid transparent",cursor:"pointer"}}>
                {t.label}
              </button>
            ))}
          </div>
          {tab==="preset"&&(
            <div style={{padding:12}}>
              {PRESETS.map(p=>(
                <button key={p.value} onClick={()=>{setRange({preset:p.value,from:null,to:null});setOpen(false);}}
                  style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"8px 10px",border:"none",borderRadius:7,cursor:"pointer",background:range?.preset===p.value?"#eff6ff":"none",color:range?.preset===p.value?"#1d4ed8":"#374151",fontSize:12,fontWeight:range?.preset===p.value?600:400}}>
                  {p.label}{range?.preset===p.value&&checkIcon("#2563eb")}
                </button>
              ))}
            </div>
          )}
          {tab==="custom"&&(
            <div style={{padding:12,display:"flex",flexDirection:"column",gap:8}}>
              <div><label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:4}}>Date de début</label>
                <input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)}
                  style={{width:"100%",padding:"7px 10px",border:"1px solid #e2e8f0",borderRadius:7,fontSize:12,color:"#374151",outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div><label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:4}}>Date de fin</label>
                <input type="date" value={customTo} min={customFrom} onChange={e=>setCustomTo(e.target.value)}
                  style={{width:"100%",padding:"7px 10px",border:"1px solid #e2e8f0",borderRadius:7,fontSize:12,color:"#374151",outline:"none",boxSizing:"border-box"}}/>
              </div>
              <button disabled={!customFrom||!customTo}
                onClick={()=>{if(customFrom&&customTo){setRange({preset:null,from:customFrom,to:customTo});setOpen(false);}}}
                style={{padding:"9px",border:"none",borderRadius:8,background:customFrom&&customTo?"#2563eb":"#e5e7eb",color:customFrom&&customTo?"#fff":"#9ca3af",cursor:customFrom&&customTo?"pointer":"not-allowed",fontSize:12,fontWeight:500}}>
                Appliquer la plage
              </button>
            </div>
          )}
          {tab==="compare"&&(
            <div style={{padding:12}}>
              <button onClick={()=>{setCompareMode(null);setOpen(false);}}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"8px 10px",border:"none",borderRadius:7,cursor:"pointer",background:!compareMode?"#fef2f2":"none",color:!compareMode?"#b91c1c":"#374151",fontSize:12,fontWeight:!compareMode?600:400}}>
                Désactiver{!compareMode&&checkIcon("#dc2626")}
              </button>
              <div style={{height:1,background:"#f3f4f6",margin:"4px 0"}}/>
              {COMPARE_OPTS.map(c=>(
                <button key={c.value} onClick={()=>{setCompareMode(c.value);setOpen(false);}}
                  style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"8px 10px",border:"none",borderRadius:7,cursor:"pointer",background:compareMode===c.value?"#eff6ff":"none",color:compareMode===c.value?"#1d4ed8":"#374151",fontSize:12,fontWeight:compareMode===c.value?600:400}}>
                  {c.label}{compareMode===c.value&&checkIcon("#2563eb")}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stars({value,max=5,color="#f59e0b"}){
  return <div style={{display:"flex",gap:2}}>
    {Array.from({length:max}).map((_,i)=>(
      <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i<Math.round(value)?color:"#d1d5db"}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ))}
  </div>;
}

export default function BIDashboard({role,token,userId}){
  const [data,setData]           = useState(null);
  const [loading,setLoading]     = useState(true);
  const [periode,setPeriode]     = useState("mois");
  const [agentId,setAgentId]     = useState("tous");
  const [agents,setAgents]       = useState([]);
  const [showCmp,setShowCmp]     = useState(false);
  const [adminMode,setAdminMode] = useState(false);
  const [showBgPanel, setShowBgPanel] = useState(false);
  const [bgColor,   setBgColor]   = useState(()=>lsGet("bi_bg_color","#f6f8fa"));
  const [textColor, setTextColor] = useState(()=>lsGet("bi_text_color","#111827"));
  const [cardColor, setCardColor] = useState(()=>lsGet("bi_card_bg","#ffffff"));
  const [dateRange,    setDateRange]  = useState({preset:"month",from:null,to:null});
  const [compareMode,  setCompareMode]= useState(null);
  useEffect(()=>{lsSet("bi_bg_color",bgColor);},[bgColor]);
  useEffect(()=>{lsSet("bi_text_color",textColor);},[textColor]);
  useEffect(()=>{lsSet("bi_card_bg",cardColor);},[cardColor]);

  const [cardColors,setCardColors]     = useState(()=>lsGet(LS.cardColors,DEFAULT_CARD_COLORS));
  const [gaugeColors,setGaugeColors]   = useState(()=>lsGet(LS.gaugeColors,DEFAULT_GAUGE_COLORS));
  const [cardOrder,setCardOrder]       = useState(()=>lsGet(LS.cardOrder,[0,1,2,3,4,5,6,7]));
  const [gaugeOrder,setGaugeOrder]     = useState(()=>lsGet(LS.gaugeOrder,[0,1,2]));
  const [typeColors,setTypeColors]     = useState(()=>lsGet(LS.typeColors,DEFAULT_TYPE_COLORS));
  const [prioColors,setPrioColors]     = useState(()=>lsGet(LS.prioColors,DEFAULT_PRIO_COLORS));
  const [widgetOrder,setWidgetOrder]   = useState(()=>lsGet(LS.widgetOrder,DEFAULT_WIDGET_ORDER));
  const [widgetColors,setWidgetColors] = useState(()=>lsGet(LS.widgetColors,DEFAULT_WIDGET_COLORS));

  const dragCard   = useRef(null);
  const dragGauge  = useRef(null);
  const dragWidget = useRef(null);
  const [dragOverCard,setDragOverCard]     = useState(null);
  const [dragOverGauge,setDragOverGauge]   = useState(null);
  const [dragOverWidget,setDragOverWidget] = useState(null);

  useEffect(()=>{lsSet(LS.cardColors,cardColors);},[cardColors]);
  useEffect(()=>{lsSet(LS.gaugeColors,gaugeColors);},[gaugeColors]);
  useEffect(()=>{lsSet(LS.cardOrder,cardOrder);},[cardOrder]);
  useEffect(()=>{lsSet(LS.gaugeOrder,gaugeOrder);},[gaugeOrder]);
  useEffect(()=>{lsSet(LS.typeColors,typeColors);},[typeColors]);
  useEffect(()=>{lsSet(LS.prioColors,prioColors);},[prioColors]);
  useEffect(()=>{lsSet(LS.widgetOrder,widgetOrder);},[widgetOrder]);
  useEffect(()=>{lsSet(LS.widgetColors,widgetColors);},[widgetColors]);

  const fetchData=useCallback(async()=>{
    setLoading(true);
    try{
      const p=new URLSearchParams({periode});
      if(agentId!=="tous")p.append("agentId",agentId);
      const res=await fetch(`${API}/bi/dashboard?${p}`,{headers:{Authorization:`Bearer ${token}`}});
      const json=await res.json();
      if(json.status==="ok")setData(json);
    }catch(e){console.error(e);}
    finally{setLoading(false);}
  },[periode,agentId,token]);

  useEffect(()=>{fetchData();},[fetchData]);
  useEffect(()=>{const iv=setInterval(fetchData,30000);return()=>clearInterval(iv);},[fetchData]);
  useEffect(()=>{
    if(["team_lead","admin"].includes(role)){
      fetch(`${API}/admin/users`,{headers:{Authorization:`Bearer ${token}`}})
        .then(r=>r.json()).then(d=>{if(d.status==="ok")setAgents(d.users.filter(u=>u.role==="support"&&u.isActive));}).catch(()=>{});
    }
  },[role,token]);

  const pi=PERIODES.find(p=>p.key===periode)||PERIODES[0];
  const pv=k=>{const v=data?.kpis?.[k];return v?.valeur!=null&&v?.trend?.diff!=null?v.valeur-v.trend.diff:null;};
  const wc=k=>widgetColors[k]||"#1e6fd4";
  const setWc=(k,c)=>setWidgetColors(p=>({...p,[k]:c}));

  const cardDS=op=>e=>{dragCard.current=op;e.dataTransfer.effectAllowed="move";};
  const cardDO=op=>e=>{e.preventDefault();setDragOverCard(op);};
  const cardDP=op=>e=>{e.preventDefault();const s=dragCard.current;if(s==null||s===op){setDragOverCard(null);return;}setCardOrder(p=>{const n=[...p];[n[s],n[op]]=[n[op],n[s]];return n;});dragCard.current=null;setDragOverCard(null);};
  const cardDE=()=>{dragCard.current=null;setDragOverCard(null);};
  const gaugeDS=op=>e=>{dragGauge.current=op;e.dataTransfer.effectAllowed="move";};
  const gaugeDO=op=>e=>{e.preventDefault();setDragOverGauge(op);};
  const gaugeDP=op=>e=>{e.preventDefault();const s=dragGauge.current;if(s==null||s===op){setDragOverGauge(null);return;}setGaugeOrder(p=>{const n=[...p];[n[s],n[op]]=[n[op],n[s]];return n;});dragGauge.current=null;setDragOverGauge(null);};
  const gaugeDE=()=>{dragGauge.current=null;setDragOverGauge(null);};
  const widgetDS=op=>e=>{dragWidget.current=op;e.dataTransfer.effectAllowed="move";};
  const widgetDO=op=>e=>{e.preventDefault();setDragOverWidget(op);};
  const widgetDP=op=>e=>{e.preventDefault();const s=dragWidget.current;if(s==null||s===op){setDragOverWidget(null);return;}setWidgetOrder(p=>{const n=[...p];[n[s],n[op]]=[n[op],n[s]];return n;});dragWidget.current=null;setDragOverWidget(null);};
  const widgetDE=()=>{dragWidget.current=null;setDragOverWidget(null);};

  const isAdmin=["team_lead","admin"].includes(role);

  if(loading&&!data) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:280,flexDirection:"column",gap:12}}>
      <div style={{width:32,height:32,border:"2px solid var(--color-border-tertiary)",borderTopColor:"#1e6fd4",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      <p style={{fontSize:12,color:"var(--color-text-secondary)"}}>Chargement...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if(!data) return null;

  const {kpis,parJour,parType,parPriorite,parStatut,parAgent,classement}=data;
  const totalMax=Math.max(kpis.total.valeur,1);
  const agentsList=parAgent||[];
  const avgCharge=agentsList.length>0?Math.round(agentsList.reduce((s,a)=>s+a.total,0)/agentsList.length):1;

  const buildRadarScore=a=>({
    satisfaction: a.satisfaction!=null?Math.round((a.satisfaction/5)*100):0,
    tauxSla:      a.tauxSla||0,
    resolution:   a.total>0?Math.round((a.resolus/a.total)*100):0,
    charge:       avgCharge>0?Math.min(100,Math.round((avgCharge/Math.max(a.total,1))*100)):50,
    escalades:    Math.max(0,100-Math.round((a.escalades||0)/Math.max(totalMax,1)*100*3)),
  });

  const radarData=RADAR_AXES.map(ax=>({
    axe:ax.label,
    ...agentsList.reduce((acc,a,i)=>{acc[`agent_${i}`]=buildRadarScore(a)[ax.key];return acc;},{}),
  }));

  const kpiDefs=[
    {label:"Total tickets",   valeur:kpis.total.valeur,          valeurPrev:pv("total"),          unit:"",  inverse:false, max:totalMax, sparkData:parJour},
    {label:"Tickets résolus", valeur:kpis.resolus.valeur,        valeurPrev:pv("resolus"),        unit:"",  inverse:false, max:totalMax},
    {label:"Taux résolution", valeur:kpis.tauxResolution.valeur, valeurPrev:pv("tauxResolution"), unit:"%", inverse:false},
    {label:"Taux SLA",        valeur:kpis.tauxSla.valeur,        valeurPrev:pv("tauxSla"),        unit:"%", inverse:false},
    {label:"Temps moyen",     valeur:kpis.tempsMoyen.valeur,     valeurPrev:pv("tempsMoyen"),     unit:"m", inverse:true},
    {label:"Satisfaction",    valeur:kpis.satisfaction.valeur,   valeurPrev:pv("satisfaction"),   unit:"/5",inverse:false, max:5},
    {label:"Escaladés",       valeur:kpis.escalades.valeur,      valeurPrev:pv("escalades"),      unit:"",  inverse:true, max:totalMax},
    role==="support"&&classement
      ?{label:"Mon classement",valeur:classement.position,unit:`/${classement.total}`,inverse:false,max:classement.total}
      :{label:"Non assignés",  valeur:kpis.nonAssignes.valeur,valeurPrev:pv("nonAssignes"),unit:"",inverse:true,max:totalMax},
  ];

  const tauxResVal=kpis.tauxResolution.valeur||0;
  const tauxSlaVal=kpis.tauxSla.valeur||0;
  const satVal=kpis.satisfaction.valeur||0;

  const gaugeDefs=[
    {label:"Taux résolution",value:tauxResVal,max:100,gaugeLabel:"objectif 70%",
     statusText:tauxResVal>=70?"✓ Objectif atteint":tauxResVal>=50?"⚠ En progression":"✗ En dessous",
     statusColor:tauxResVal>=70?"#0e9e6e":tauxResVal>=50?"#d97706":"#e03535",
     dynamicColor:tauxResVal>=70?"#0e9e6e":tauxResVal>=50?"#d97706":"#e03535"},
    {label:"Taux SLA",value:tauxSlaVal,max:100,gaugeLabel:"objectif 80%",
     statusText:tauxSlaVal>=80?"✓ Objectif atteint":tauxSlaVal>=60?"⚠ En progression":"✗ En dessous",
     statusColor:tauxSlaVal>=80?"#0e9e6e":tauxSlaVal>=60?"#d97706":"#e03535",
     dynamicColor:tauxSlaVal>=80?"#0e9e6e":tauxSlaVal>=60?"#d97706":"#e03535"},
    {label:"Satisfaction",value:satVal,max:5,gaugeLabel:"objectif 4/5",
     statusText:kpis.satisfaction.valeur==null?"Aucun feedback":satVal>=4?"✓ Excellent":satVal>=3?"⚠ Moyen":"✗ Insuffisant",
     statusColor:satVal>=4?"#0e9e6e":satVal>=3?"#d97706":"#e03535",
     dynamicColor:satVal>=4?"#0e9e6e":satVal>=3?"#d97706":"#e03535"},
  ];

  // W0 Évolution
  const W0=(
    <DraggableWidget index={0} adminMode={true} dragOver={dragOverWidget} onDragStart={widgetDS} onDragOver={widgetDO} onDrop={widgetDP} onDragEnd={widgetDE}>
      <WidgetCard cardBg={cardColor} textCol={textColor} title="Évolution des tickets" sub={`${pi.label} — créés vs résolus`} adminMode={true}
        color1={wc("evolution1")} onColor1Change={c=>setWc("evolution1",c)} label1="Créés"
        color2={wc("evolution2")} onColor2Change={c=>setWc("evolution2",c)} label2="Résolus"
        isDragOver={dragOverWidget===0}>
        <div style={{display:"flex",gap:14,marginBottom:8}}>
          {[{c:wc("evolution1"),l:"Créés"},{c:wc("evolution2"),l:"Résolus",dash:true}].map((x,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"var(--color-text-secondary)"}}>
              <div style={{width:18,height:2,background:x.c,opacity:x.dash?.7:1}}/>{x.l}
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={parJour} margin={{top:4,right:8,left:-18,bottom:0}}>
            <defs>
              <linearGradient id="evg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={wc("evolution1")} stopOpacity={.15}/><stop offset="95%" stopColor={wc("evolution1")} stopOpacity={0}/></linearGradient>
              <linearGradient id="evg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={wc("evolution2")} stopOpacity={.15}/><stop offset="95%" stopColor={wc("evolution2")} stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" vertical={false}/>
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{fontSize:9,fill:"var(--color-text-secondary)"}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
            <YAxis tick={{fontSize:9,fill:"var(--color-text-secondary)"}} axisLine={false} tickLine={false} allowDecimals={false}/>
            <Tooltip content={<Tip/>}/>
            <Area type="monotone" dataKey="crees"  name="Créés"   stroke={wc("evolution1")} strokeWidth={2} fill="url(#evg1)" dot={false} activeDot={{r:4}}/>
            <Area type="monotone" dataKey="resolus" name="Résolus" stroke={wc("evolution2")} strokeWidth={2} fill="url(#evg2)" dot={false} activeDot={{r:4}} strokeDasharray="5 3"/>
          </AreaChart>
        </ResponsiveContainer>
      </WidgetCard>
    </DraggableWidget>
  );

  // W1 Type
  const W1=(
    <DraggableWidget index={1} adminMode={true} dragOver={dragOverWidget} onDragStart={widgetDS} onDragOver={widgetDO} onDrop={widgetDP} onDragEnd={widgetDE}>
      <WidgetCard cardBg={cardColor} textCol={textColor} title="Répartition par type" sub={`${kpis.total.valeur} tickets`} adminMode={true} isDragOver={dragOverWidget===1}>
        <ResponsiveContainer width="100%" height={110}>
          <PieChart>
            <Pie data={parType.filter(t=>t.count>0)} dataKey="count" cx="50%" cy="50%" outerRadius={52} innerRadius={30} strokeWidth={0} paddingAngle={2}>
              {parType.map((t,i)=><Cell key={i} fill={typeColors[t.type]||"#9ca3af"}/>)}
            </Pie>
            <Tooltip formatter={v=>[v,"tickets"]} contentStyle={{fontSize:10}}/>
          </PieChart>
        </ResponsiveContainer>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:6}}>
          {parType.map(t=>{
            const col=typeColors[t.type]||"#9ca3af";
            return (
              <div key={t.type}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <ColorDot color={col} onChange={c=>setTypeColors(p=>({...p,[t.type]:c}))}/>
                    <span style={{fontSize:11,fontWeight:500,color:"var(--color-text-primary)"}}>{t.label}</span>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:11,color:"var(--color-text-secondary)"}}>{t.count}</span>
                    <span style={{fontSize:10,padding:"1px 6px",borderRadius:20,background:col+"22",color:col,fontWeight:500}}>{t.pct}%</span>
                  </div>
                </div>
                <div style={{height:4,background:"var(--color-background-secondary)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${t.pct}%`,background:col,borderRadius:3,transition:"width .6s"}}/>
                </div>
              </div>
            );
          })}
        </div>
      </WidgetCard>
    </DraggableWidget>
  );

  // W2 Priorité
  const W2=(
    <DraggableWidget index={2} adminMode={true} dragOver={dragOverWidget} onDragStart={widgetDS} onDragOver={widgetDO} onDrop={widgetDP} onDragEnd={widgetDE}>
      <WidgetCard cardBg={cardColor} textCol={textColor} title="Répartition par priorité" sub="Distribution des niveaux" adminMode={true} isDragOver={dragOverWidget===2}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie data={parPriorite.filter(p=>p.count>0)} dataKey="count" cx="50%" cy="50%" outerRadius={56} innerRadius={32} strokeWidth={0} paddingAngle={2}>
                {parPriorite.map((e,i)=><Cell key={i} fill={prioColors[e.priorite]||"#9ca3af"}/>)}
              </Pie>
              <Tooltip formatter={(v,n)=>[v,n]} contentStyle={{fontSize:10}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:9}}>
            {parPriorite.filter(p=>p.count>0).map(p=>{
              const col=prioColors[p.priorite]||"#9ca3af";
              return (
                <div key={p.priorite} style={{display:"flex",alignItems:"center",gap:6}}>
                  <ColorDot color={col} onChange={c=>setPrioColors(pv=>({...pv,[p.priorite]:c}))}/>
                  <span style={{fontSize:11,color:"var(--color-text-secondary)",flex:1}}>{p.label}</span>
                  <span style={{fontSize:11,fontWeight:600,color:"var(--color-text-primary)"}}>{p.count}</span>
                  <span style={{fontSize:10,color:"var(--color-text-secondary)",minWidth:26,textAlign:"right"}}>{p.pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </WidgetCard>
    </DraggableWidget>
  );

  // W3 Statuts
  const W3=(
    <DraggableWidget index={3} adminMode={true} dragOver={dragOverWidget} onDragStart={widgetDS} onDragOver={widgetDO} onDrop={widgetDP} onDragEnd={widgetDE}>
      <WidgetCard cardBg={cardColor} textCol={textColor} title="Par statut" sub="Distribution actuelle" adminMode={true} isDragOver={dragOverWidget===3}>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {parStatut.map(s=>(
            <div key={s.statut} style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:10,color:"var(--color-text-secondary)",minWidth:78,flexShrink:0}}>{s.label}</span>
              <div style={{flex:1,height:16,background:"var(--color-background-secondary)",borderRadius:3,overflow:"hidden",position:"relative"}}>
                {s.count>0&&(
                  <div style={{height:"100%",width:`${Math.max(Math.round((s.count/totalMax)*100),3)}%`,background:STATUT_C[s.statut]||"#9ca3af",borderRadius:3,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:4,transition:"width .6s"}}>
                    <span style={{fontSize:8,color:"#fff",fontWeight:700}}>{s.count}</span>
                  </div>
                )}
              </div>
              <span style={{fontSize:9,color:"var(--color-text-secondary)",minWidth:28,textAlign:"right"}}>{Math.round((s.count/totalMax)*100)}%</span>
            </div>
          ))}
        </div>
      </WidgetCard>
    </DraggableWidget>
  );

  // W4 Performance
  const W4=isAdmin&&agentsList.length>0?(
    <DraggableWidget index={4} adminMode={true} dragOver={dragOverWidget} onDragStart={widgetDS} onDragOver={widgetDO} onDrop={widgetDP} onDragEnd={widgetDE}>
      <WidgetCard cardBg={cardColor} textCol={textColor} title="Performance par agent" sub={pi.label} adminMode={true}
        color1={wc("perf1")} onColor1Change={c=>setWc("perf1",c)} label1="Total"
        color2={wc("perf2")} onColor2Change={c=>setWc("perf2",c)} label2="Résolus"
        isDragOver={dragOverWidget===4}>
        <div style={{display:"flex",gap:14,marginBottom:10}}>
          {[{c:wc("perf1"),l:"Total"},{c:wc("perf2"),l:"Résolus"}].map((x,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"var(--color-text-secondary)"}}>
              <div style={{width:10,height:10,borderRadius:2,background:x.c}}/>{x.l}
            </div>
          ))}
          {showCmp&&<div style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"var(--color-text-secondary)"}}>
            <div style={{width:10,height:10,borderRadius:2,background:"#AFA9EC"}}/>Période préc.
          </div>}
        </div>
        <ResponsiveContainer width="100%" height={Math.max(agentsList.length*70+60,180)}>
          <BarChart data={agentsList.map(a=>({prenom:a.agent.prenom,total:a.total,resolus:a.resolus,prevTotal:a.total-(a.trend?.diff||0)}))}
            margin={{top:16,right:10,left:-10,bottom:agentsList.length>4?30:8}} barCategoryGap="30%" barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" vertical={false}/>
            <XAxis dataKey="prenom" tick={{fontSize:11,fill:"var(--color-text-secondary)"}} axisLine={false} tickLine={false} interval={0} angle={agentsList.length>4?-30:0} textAnchor={agentsList.length>4?"end":"middle"}/>
            <YAxis tick={{fontSize:9,fill:"var(--color-text-secondary)"}} axisLine={false} tickLine={false} allowDecimals={false}/>
            <Tooltip content={<Tip/>}/>
            {showCmp&&<Bar dataKey="prevTotal" name="Période préc." fill="#AFA9EC" radius={[4,4,0,0]} barSize={10}/>}
            <Bar dataKey="total" name="Total" fill={wc("perf1")} radius={[4,4,0,0]} barSize={18}>
              <LabelList dataKey="total" position="top" style={{fontSize:10,fill:"var(--color-text-secondary)",fontWeight:600}}/>
            </Bar>
            <Bar dataKey="resolus" name="Résolus" fill={wc("perf2")} radius={[4,4,0,0]} barSize={12}/>
          </BarChart>
        </ResponsiveContainer>
      </WidgetCard>
    </DraggableWidget>
  ):<div/>;

  // W5 Charge
  const W5=isAdmin&&agentsList.length>0?(
    <DraggableWidget index={5} adminMode={true} dragOver={dragOverWidget} onDragStart={widgetDS} onDragOver={widgetDO} onDrop={widgetDP} onDragEnd={widgetDE}>
      <WidgetCard cardBg={cardColor} textCol={textColor} title="Charge par agent" sub="Tickets assignés vs moyenne" adminMode={true}
        color1={wc("workload")} onColor1Change={c=>setWc("workload",c)} label1="Couleur"
        isDragOver={dragOverWidget===5}>
        {(()=>{
          const avg=Math.round(agentsList.reduce((s,a)=>s+a.total,0)/agentsList.length);
          const chartData=agentsList.map(a=>({prenom:a.agent.prenom,total:a.total,color:a.total>avg*1.5?"#e03535":a.total<avg*0.5?"#64748b":wc("workload"),statut:a.total>avg*1.5?"Surchargé":a.total<avg*0.5?"Léger":"Normal"}));
          const mx=Math.max(...chartData.map(d=>d.total),avg,1);
          return (
            <>
              <ResponsiveContainer width="100%" height={Math.max(agentsList.length*70+60,180)}>
                <BarChart data={chartData} margin={{top:24,right:10,left:-10,bottom:agentsList.length>4?30:8}} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" vertical={false}/>
                  <XAxis dataKey="prenom" tick={{fontSize:10,fill:"var(--color-text-secondary)"}} axisLine={false} tickLine={false} interval={0} angle={agentsList.length>4?-30:0} textAnchor={agentsList.length>4?"end":"middle"}/>
                  <YAxis tick={{fontSize:9,fill:"var(--color-text-secondary)"}} axisLine={false} tickLine={false} allowDecimals={false} domain={[0,mx+2]}/>
                  <Tooltip content={<Tip/>}/>
                  <ReferenceLine y={avg} stroke="#1e6fd4" strokeDasharray="4 3" strokeWidth={1.5} label={{value:`moy. ${avg}`,position:"insideTopRight",fill:"#1e6fd4",fontSize:9,offset:4}}/>
                  <Bar dataKey="total" name="Tickets" radius={[4,4,0,0]} barSize={28}>
                    {chartData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                    <LabelList dataKey="total" position="top" style={{fontSize:10,fontWeight:600,fill:"var(--color-text-primary)"}}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
                {[{c:wc("workload"),l:"Normal"},{c:"#e03535",l:"Surchargé"},{c:"#64748b",l:"Léger"}].map((x,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"var(--color-text-secondary)"}}>
                    <div style={{width:8,height:8,borderRadius:2,background:x.c}}/>{x.l}
                  </div>
                ))}
              </div>
              <div style={{borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:10,marginTop:10,display:"flex",flexDirection:"column",gap:6}}>
                {chartData.map((d,i)=>{
                  const sc=d.statut==="Surchargé"?"#e03535":d.statut==="Léger"?"#64748b":wc("workload");
                  const scBg=d.statut==="Surchargé"?"#fde8e8":d.statut==="Léger"?"#f1f5f9":"#e3f7f0";
                  return (
                    <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontSize:10,color:"var(--color-text-secondary)"}}>{d.prenom}</span>
                      <span style={{fontSize:9,padding:"2px 8px",borderRadius:20,background:scBg,color:sc,fontWeight:500}}>{d.statut}</span>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </WidgetCard>
    </DraggableWidget>
  ):<div/>;

  // W6 Analyse agents — MAINTENANT AVEC WidgetCard
  const W6=isAdmin&&agentsList.length>0?(
    <DraggableWidget index={6} adminMode={true} dragOver={dragOverWidget} onDragStart={widgetDS} onDragOver={widgetDO} onDrop={widgetDP} onDragEnd={widgetDE}>
      <WidgetCard cardBg={cardColor} textCol={textColor} title="Analyse des agents" sub="Satisfaction · Radar multi-critères · Récapitulatif" adminMode={true} isDragOver={dragOverWidget===6}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,alignItems:"start"}}>

          {/* COL 1 — Satisfaction */}
          <div>
            <p style={{fontSize:9,fontWeight:500,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Satisfaction client</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {agentsList.map(a=>{
                const sat=a.satisfaction;
                if(sat==null) return (
                  <div key={a.agent._id} style={{background:"var(--color-background-secondary)",borderRadius:10,padding:"12px 14px",border:"0.5px solid var(--color-border-tertiary)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:30,height:30,borderRadius:"50%",background:"var(--color-border-tertiary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"var(--color-text-secondary)",flexShrink:0}}>{a.agent.prenom[0]}{a.agent.nom[0]}</div>
                      <div><p style={{fontSize:12,fontWeight:600,color:"var(--color-text-primary)",margin:0}}>{a.agent.prenom} {a.agent.nom}</p><p style={{fontSize:10,color:"var(--color-text-secondary)",margin:0}}>Aucun feedback</p></div>
                    </div>
                  </div>
                );
                const sc=sat>=4?{bg:"#e3f7f0",border:"#5dcaa5",text:"#076645",val:"#0e9e6e"}:sat>=3?{bg:"#fef3e0",border:"#ef9f27",text:"#92500a",val:"#d97706"}:{bg:"#fde8e8",border:"#f09595",text:"#991818",val:"#e03535"};
                return (
                  <div key={a.agent._id} style={{background:sc.bg,borderRadius:10,padding:"12px 14px",border:`1.5px solid ${sc.border}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <div style={{width:30,height:30,borderRadius:"50%",background:sc.border+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:sc.text,border:`1.5px solid ${sc.border}`,flexShrink:0}}>{a.agent.prenom[0]}{a.agent.nom[0]}</div>
                      <p style={{fontSize:12,fontWeight:600,color:sc.text,margin:0}}>{a.agent.prenom} {a.agent.nom}</p>
                    </div>
                    <p style={{fontSize:26,fontWeight:700,color:sc.val,margin:"0 0 4px",lineHeight:1}}>{sat.toFixed(1)}<span style={{fontSize:12,color:sc.text,fontWeight:400,opacity:.7}}>/5</span></p>
                    <Stars value={sat} color={sc.val}/>
                    <div style={{height:4,background:sc.border+"33",borderRadius:2,overflow:"hidden",marginTop:8,marginBottom:4}}>
                      <div style={{height:"100%",width:`${(sat/5)*100}%`,background:sc.val,borderRadius:2,transition:"width .6s"}}/>
                    </div>
                    <p style={{fontSize:10,color:sc.text,fontWeight:600,margin:0}}>{sat>=4?"✓ Excellent":sat>=3?"⚠ Moyen":"✗ Insuffisant"}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COL 2 — Radar */}
          <div>
            <p style={{fontSize:9,fontWeight:500,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Radar multi-critères</p>
            <div style={{display:"flex",gap:10,marginBottom:8,flexWrap:"wrap"}}>
              {agentsList.map((a,i)=>(
                <div key={a.agent._id} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"var(--color-text-secondary)"}}>
                  <div style={{width:10,height:10,borderRadius:2,background:AGENT_COLORS[i%AGENT_COLORS.length]}}/>
                  {a.agent.prenom}
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} margin={{top:10,right:30,left:30,bottom:10}}>
                <PolarGrid stroke="var(--color-border-tertiary)" strokeWidth={0.5}/>
                <PolarAngleAxis dataKey="axe" tick={{fontSize:10,fill:"var(--color-text-secondary)"}}/>
                <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:8,fill:"var(--color-text-secondary)"}} tickCount={4}/>
                {agentsList.map((a,i)=>(
                  <Radar key={a.agent._id} name={`${a.agent.prenom} ${a.agent.nom}`} dataKey={`agent_${i}`}
                    stroke={AGENT_COLORS[i%AGENT_COLORS.length]} fill={AGENT_COLORS[i%AGENT_COLORS.length]} fillOpacity={0.15}
                    strokeWidth={2} strokeDasharray={i>0?"5 3":undefined} dot={{r:3,fill:AGENT_COLORS[i%AGENT_COLORS.length]}}/>
                ))}
                <Tooltip content={<RadarTip/>}/>
              </RadarChart>
            </ResponsiveContainer>
            <div style={{display:"flex",flexDirection:"column",gap:4,marginTop:4}}>
              {RADAR_AXES.map(ax=>(
                <div key={ax.key} style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:"var(--color-text-secondary)"}}>
                  <div style={{width:8,height:8,borderRadius:2,background:ax.color,flexShrink:0}}/>
                  <span style={{flex:1}}>{ax.label}</span>
                  <span style={{fontSize:9,opacity:.6}}>0 → 100</span>
                </div>
              ))}
            </div>
          </div>

          {/* COL 3 — Tableau récap */}
          <div>
            <p style={{fontSize:9,fontWeight:500,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Récapitulatif</p>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead>
                <tr style={{borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
                  <th style={{textAlign:"left",padding:"5px 6px",fontWeight:500,fontSize:9,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:".04em"}}>Agent</th>
                  <th style={{textAlign:"center",padding:"5px 4px",fontWeight:500,fontSize:9,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:".04em"}}>Satisf.</th>
                  <th style={{textAlign:"center",padding:"5px 4px",fontWeight:500,fontSize:9,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:".04em"}}>SLA</th>
                  <th style={{textAlign:"center",padding:"5px 4px",fontWeight:500,fontSize:9,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:".04em"}}>Résol.</th>
                  <th style={{textAlign:"center",padding:"5px 4px",fontWeight:500,fontSize:9,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:".04em"}}>Escal.</th>
                </tr>
              </thead>
              <tbody>
                {agentsList.map((a,i)=>{
                  const sat=a.satisfaction;
                  const sla=a.tauxSla||0;
                  const res=a.total>0?Math.round((a.resolus/a.total)*100):0;
                  const esc=a.escalades||0;
                  const color=AGENT_COLORS[i%AGENT_COLORS.length];
                  return (
                    <tr key={a.agent._id} style={{borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
                      <td style={{padding:"8px 6px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0}}/>
                          <span style={{fontWeight:500,color:"var(--color-text-primary)",fontSize:11}}>{a.agent.prenom}</span>
                        </div>
                      </td>
                      <td style={{padding:"8px 4px",textAlign:"center"}}>
                        {sat!=null?<span style={{fontSize:10,padding:"2px 6px",borderRadius:20,background:sat>=4?"#e3f7f0":sat>=3?"#fef3e0":"#fde8e8",color:sat>=4?"#076645":sat>=3?"#92500a":"#991818",fontWeight:500}}>{sat.toFixed(1)}</span>:<span style={{fontSize:10,color:"var(--color-text-secondary)"}}>—</span>}
                      </td>
                      <td style={{padding:"8px 4px",textAlign:"center"}}>
                        <span style={{fontSize:10,padding:"2px 6px",borderRadius:20,background:sla>=80?"#e3f7f0":sla>=60?"#fef3e0":"#fde8e8",color:sla>=80?"#076645":sla>=60?"#92500a":"#991818",fontWeight:500}}>{sla}%</span>
                      </td>
                      <td style={{padding:"8px 4px",textAlign:"center"}}>
                        <span style={{fontSize:10,padding:"2px 6px",borderRadius:20,background:res>=70?"#e3f7f0":res>=50?"#fef3e0":"#fde8e8",color:res>=70?"#076645":res>=50?"#92500a":"#991818",fontWeight:500}}>{res}%</span>
                      </td>
                      <td style={{padding:"8px 4px",textAlign:"center"}}>
                        <span style={{fontSize:10,padding:"2px 6px",borderRadius:20,background:esc===0?"#e3f7f0":esc<=2?"#fef3e0":"#fde8e8",color:esc===0?"#076645":esc<=2?"#92500a":"#991818",fontWeight:500}}>{esc}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{marginTop:12,padding:"8px 10px",background:"var(--color-background-secondary)",borderRadius:8}}>
              <p style={{fontSize:9,color:"var(--color-text-secondary)",margin:"0 0 6px",fontWeight:500,textTransform:"uppercase",letterSpacing:".04em"}}>Seuils</p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[{c:"#e3f7f0",t:"#076645",l:"Bon"},{c:"#fef3e0",t:"#92500a",l:"Moyen"},{c:"#fde8e8",t:"#991818",l:"Faible"}].map((x,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:9}}>
                    <div style={{width:10,height:10,borderRadius:2,background:x.c,border:`1px solid ${x.t}44`}}/>
                    <span style={{color:x.t}}>{x.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </WidgetCard>
    </DraggableWidget>
  ):<div/>;

  return (
    <div style={{padding:"0 0 40px", background:bgColor, minHeight:"100%",
      "--bi-card-bg": cardColor,
      "--bi-text-col": textColor,
    }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      {showBgPanel&&(
        <>
          <div style={{position:"fixed",inset:0,zIndex:7999,background:"rgba(0,0,0,.4)"}} onClick={()=>setShowBgPanel(false)}/>
          <BgPanel bg={bgColor} onChangeBg={setBgColor} textColor={textColor} onChangeText={setTextColor} cardColor={cardColor} onChangeCard={setCardColor} onClose={()=>setShowBgPanel(false)}/>
        </>
      )}

      {/* TOOLBAR */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"var(--color-background-primary)",border:"1px solid var(--color-border-tertiary)",borderRadius:10,marginBottom:12,flexWrap:"wrap",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
        {/* Calendrier */}
        <DateRangePicker range={dateRange} setRange={setDateRange} compareMode={compareMode} setCompareMode={setCompareMode}/>
        {/* Filtre agent */}
        {isAdmin&&agents.length>0&&(
          <select value={agentId} onChange={e=>setAgentId(e.target.value)}
            style={{padding:"7px 10px",borderRadius:7,border:"1px solid #e2e8f0",fontSize:12,background:"#fff",color:"#374151",cursor:"pointer",fontFamily:"inherit",outline:"none"}}>
            <option value="tous">Tous les agents</option>
            {agents.map(a=><option key={a._id} value={a._id}>{a.prenom} {a.nom}</option>)}
          </select>
        )}
        <div style={{flex:1}}/>
        {/* Bouton fond */}
        <button onClick={()=>setShowBgPanel(true)}
          style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",border:"1px solid #e2e8f0",borderRadius:8,background:"#fff",cursor:"pointer",fontSize:12,color:"#374151",fontWeight:500}}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="#374151"><path d="M8 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm4 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm.5 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M16 8c0 3.15-1.866 2.585-3.567 2.07C11.42 9.763 10.465 9.473 10 10c-.603.683-.475 1.819-.351 2.92C9.826 14.495 9.996 16 8 16a8 8 0 1 1 8-8z"/></svg>
          Personnaliser
          <div style={{display:"flex",gap:3}}>
            {[bgColor,textColor,cardColor].map((c,i)=>(<div key={i} style={{width:12,height:12,borderRadius:3,background:c,border:"1px solid rgba(0,0,0,.15)"}}/>))}
          </div>
        </button>
      </div>

      {/* KPI CARDS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8,marginBottom:8}}>
        {cardOrder.slice(0,4).map((ri,op)=>(
          <KpiCard key={ri} {...kpiDefs[ri]} colorMain={cardColors[ri]} showCmp={showCmp} prevLabel={pi.prev}
            adminMode={true} onColorChange={c=>{const n=[...cardColors];n[ri]=c;setCardColors(n);}}
            draggable={true} onDragStart={cardDS(op)} onDragOver={cardDO(op)} onDrop={cardDP(op)} onDragEnd={cardDE}
             isDragOver={dragOverCard===op} cardBg={cardColor} textCol={textColor}/>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8,marginBottom:12}}>
        {cardOrder.slice(4,8).map((ri,op_)=>{
          const op=op_+4;
          return (
            <KpiCard key={ri} {...kpiDefs[ri]} colorMain={cardColors[ri]} showCmp={showCmp} prevLabel={pi.prev}
              adminMode={true} onColorChange={c=>{const n=[...cardColors];n[ri]=c;setCardColors(n);}}
              draggable={true} onDragStart={cardDS(op)} onDragOver={cardDO(op)} onDrop={cardDP(op)} onDragEnd={cardDE}
               isDragOver={dragOverCard===op} cardBg={cardColor} textCol={textColor}/>
          );
        })}
      </div>

      {/* JAUGES */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8,marginBottom:12}}>
        {gaugeOrder.map((ri,op)=>{
          const gd=gaugeDefs[ri];
          return (
            <GaugeCard key={ri} label={gd.label} value={gd.value} max={gd.max}
              gaugeLabel={gd.gaugeLabel} statusText={gd.statusText} statusColor={gd.statusColor}
              gaugeColor={gd.dynamicColor}
              draggable={true} onDragStart={gaugeDS(op)} onDragOver={gaugeDO(op)} onDrop={gaugeDP(op)} onDragEnd={gaugeDE}
               isDragOver={dragOverGauge===op} cardBg={cardColor} textCol={textColor}/>
          );
        })}
      </div>

      {/* ROW Évolution | Type | Priorité */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:8,marginBottom:8}}>
        {W0}{W1}{W2}
      </div>

      {/* ROW Statuts | SLA par agent */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        {W3}
        {isAdmin&&agentsList.length>0?(
          <WidgetCard cardBg={cardColor} textCol={textColor} title="Taux SLA par agent" sub="Respect des délais" adminMode={false} isDragOver={false}>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {agentsList.map(a=>{
                const slaColor=a.tauxSla>=80?"#0e9e6e":a.tauxSla>=60?"#d97706":"#e03535";
                return (
                  <div key={a.agent._id}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:11,fontWeight:500,color:"var(--color-text-primary)"}}>{a.agent.prenom} {a.agent.nom}</span>
                      <span style={{fontSize:13,fontWeight:700,color:slaColor}}>{a.tauxSla}%</span>
                    </div>
                    <div style={{height:8,background:"var(--color-background-secondary)",borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${a.tauxSla}%`,background:slaColor,borderRadius:4,transition:"width .6s"}}/>
                    </div>
                    <p style={{fontSize:9,color:slaColor,margin:"4px 0 0",fontWeight:500}}>
                      {a.tauxSla>=80?"✓ Objectif atteint":a.tauxSla>=60?"⚠ En progression":"✗ En dessous de l'objectif"}
                    </p>
                  </div>
                );
              })}
            </div>
          </WidgetCard>
        ):<div/>}
      </div>

      {/* ROW Performance | Charge */}
      {isAdmin&&agentsList.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          {W4}{W5}
        </div>
      )}

      {/* Analyse agents pleine largeur */}
      {isAdmin&&agentsList.length>0&&(
        <div style={{marginBottom:8}}>{W6}</div>
      )}
    </div>
  );
}