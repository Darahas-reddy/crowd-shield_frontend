import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";

/* ═══════════════════════════════════════════════════════
   CROWDSHIELD v4 — CLEAN PRODUCTION BUILD
   Fixed: black screen (undefined apiKey), stale chat vars
   New: AI Crowd Intelligence Dashboard
═══════════════════════════════════════════════════════ */

// ── API / WS URLs ──────────────────────────────────────────────────────────
// Dev: CRA proxy (setupProxy.js) forwards /api/* → localhost:8080
// Prod: Set REACT_APP_API_URL / REACT_APP_WS_URL env vars
const API    = process.env.REACT_APP_API_URL || "/api";
const WS_URL = process.env.REACT_APP_WS_URL  || (window.location.origin.replace(/^http/, "http") + "/ws");
const HISTORY_MAX = 30;

// ── Theme ──────────────────────────────────────────────────────────────────
const mkTheme = (dark) => ({
  isDark: dark,
  bg:       dark ? "#0e0e0d" : "#f6f6f4",
  card:     dark ? "#1a1a18" : "#ffffff",
  surface:  dark ? "#131312" : "#f1f1ef",
  border:   dark ? "#272725" : "#e4e4e0",
  border2:  dark ? "#363633" : "#d0d0ca",
  text:     dark ? "#eeeeea" : "#191917",
  sub:      dark ? "#8a8a84" : "#5c5c57",
  muted:    dark ? "#555552" : "#9e9e98",
  safe:     dark ? "#34c472" : "#1a7a4a",
  safeBg:   dark ? "#0a1e12" : "#ecf7f1",
  warn:     dark ? "#f0b429" : "#8a5c00",
  warnBg:   dark ? "#1c1200" : "#fdf6e3",
  crit:     dark ? "#f03e5e" : "#8a1a2a",
  critBg:   dark ? "#1e0a0e" : "#fdeef0",
  evac:     dark ? "#b06cff" : "#5510cc",
  evacBg:   dark ? "#130a24" : "#f0e8ff",
  info:     dark ? "#4d9fff" : "#1a4a8a",
  infoBg:   dark ? "#080f20" : "#eef3fd",
  accent:   dark ? "#4d9fff" : "#1a4a8a",
  user:     dark ? "#f0b429" : "#7a4a00",
  nav:      dark ? "#1a1a18" : "#ffffff",
  sh:       dark ? "0 1px 3px rgba(0,0,0,.4)" : "0 1px 4px rgba(0,0,0,.07)",
  sh2:      dark ? "0 4px 20px rgba(0,0,0,.5)" : "0 4px 20px rgba(0,0,0,.1)",
  mapFilter: dark
    ? "invert(1) hue-rotate(180deg) saturate(.55) brightness(.45) contrast(1.3)"
    : "saturate(.8) brightness(1.03) sepia(.05)",
});

// ── CSS ────────────────────────────────────────────────────────────────────
const buildCSS = (T) => `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;line-height:1.55;
  background:${T.bg};color:${T.text};min-height:100vh;transition:background .3s,color .3s;}
::-webkit-scrollbar{width:3px;height:3px;}::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:${T.border2};border-radius:3px;}
@keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes si{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes ping{0%{transform:scale(1);opacity:.8}70%{transform:scale(2.4);opacity:0}100%{opacity:0}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 0 0 currentColor}50%{box-shadow:0 0 12px 3px currentColor}}
.fu{animation:fu .3s cubic-bezier(.22,1,.36,1) both;}
.si{animation:si .26s cubic-bezier(.22,1,.36,1) both;}
.blink{animation:blink 2s ease-in-out infinite;}
header{background:${T.nav};border-bottom:1px solid ${T.border};height:54px;padding:0 22px;
  display:flex;align-items:center;gap:16px;position:sticky;top:0;z-index:300;}
.logo-mark{width:30px;height:30px;border-radius:7px;background:${T.text};color:${T.bg};
  display:flex;align-items:center;justify-content:center;font-size:14px;}
.logo-name{font-weight:800;font-size:15px;letter-spacing:-.3px;color:${T.text};}
.logo-name span{font-weight:300;opacity:.4;}
.hdiv{width:1px;height:18px;background:${T.border};flex-shrink:0;}
.top-nav{display:flex;gap:1px;flex:1;overflow-x:auto;}
.tn{background:none;border:none;color:${T.muted};padding:5px 10px;border-radius:7px;cursor:pointer;
  font-size:11.5px;font-weight:600;font-family:inherit;display:flex;align-items:center;gap:5px;
  position:relative;white-space:nowrap;transition:all .13s;}
.tn:hover{color:${T.sub};background:${T.border};}
.tn.on{color:${T.text};background:${T.surface};}
.tn-badge{position:absolute;top:3px;right:3px;width:5px;height:5px;border-radius:50%;animation:blink 2s ease-in-out infinite;}
.htools{display:flex;align-items:center;gap:10px;flex-shrink:0;}
.clk{font-size:11px;color:${T.muted};font-family:'DM Mono',monospace;min-width:64px;}
.live-chip{display:flex;align-items:center;gap:5px;background:${T.safeBg};border:1px solid ${T.safe}33;border-radius:20px;padding:3px 9px;}
.live-dot{width:5px;height:5px;border-radius:50%;background:${T.safe};animation:blink 1.8s ease-in-out infinite;}
.live-lbl{font-size:10px;font-weight:700;color:${T.safe};letter-spacing:.5px;}
.ws-badge{font-size:9px;font-weight:700;letter-spacing:.5px;padding:3px 8px;border-radius:5px;font-family:'DM Mono',monospace;}
.ws-live{background:${T.safeBg};color:${T.safe};}
.ws-conn{background:${T.infoBg};color:${T.info};}
.ws-poll{background:${T.warnBg};color:${T.warn};}
.tog{width:38px;height:21px;border-radius:11px;border:1px solid ${T.border2};background:${T.surface};cursor:pointer;position:relative;}
.knob{position:absolute;top:2px;left:${T.isDark?"19px":"2px"};width:15px;height:15px;border-radius:8px;
  background:${T.text};transition:left .3s cubic-bezier(.34,1.56,.64,1);display:flex;align-items:center;justify-content:center;font-size:8.5px;}
.evac-banner{background:${T.evac};color:#fff;padding:9px 22px;display:flex;align-items:center;
  justify-content:space-between;gap:12px;font-size:13px;font-weight:700;
  position:sticky;top:54px;z-index:299;animation:glowPulse .9s ease-in-out infinite;}
main{display:flex;min-height:calc(100vh - 54px);}
.snav{width:188px;flex-shrink:0;border-right:1px solid ${T.border};padding:14px 10px;
  display:flex;flex-direction:column;gap:1px;position:sticky;top:54px;
  height:calc(100vh - 54px);overflow-y:auto;background:${T.nav};}
.snav-sec{font-size:9.5px;font-weight:800;color:${T.muted};letter-spacing:1.8px;
  text-transform:uppercase;padding:12px 8px 5px;}
.snav-sec:first-child{padding-top:2px;}
.snav-btn{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:7px;
  color:${T.sub};font-size:12.5px;font-weight:500;cursor:pointer;border:none;
  background:none;width:100%;text-align:left;font-family:inherit;transition:all .12s;}
.snav-btn:hover{background:${T.border};color:${T.text};}
.snav-btn.on{background:${T.surface};color:${T.text};font-weight:600;}
.snav-ico{font-size:13px;width:18px;text-align:center;}
.snav-badge{margin-left:auto;border-radius:99px;padding:1px 6px;font-size:9px;font-weight:700;font-family:'DM Mono',monospace;}
.snav-status{padding:9px 10px;margin-top:auto;border-top:1px solid ${T.border};
  font-size:9.5px;color:${T.muted};font-family:'DM Mono',monospace;line-height:1.9;}
.content{flex:1;padding:26px 30px;min-width:0;overflow-x:hidden;}
.tab-pane{display:none;}
.tab-pane.on{display:block;animation:fu .28s cubic-bezier(.22,1,.36,1) both;}
.ph{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;}
.ph-title{font-size:21px;font-weight:800;letter-spacing:-.5px;}
.ph-sub{font-size:11px;color:${T.muted};margin-top:3px;font-family:'DM Mono',monospace;}
.ph-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.sc-grid{display:grid;gap:1px;border:1px solid ${T.border};border-radius:12px;overflow:hidden;margin-bottom:22px;background:${T.border};}
.sc{background:${T.card};padding:16px 18px;transition:background .15s;cursor:default;}
.sc:hover{background:${T.surface};}
.sc-val{font-size:25px;font-weight:800;letter-spacing:-1.5px;font-family:'DM Mono',monospace;line-height:1;}
.sc-lbl{font-size:9.5px;font-weight:700;color:${T.muted};margin-top:6px;text-transform:uppercase;letter-spacing:.9px;}
.sc-sub{font-size:10px;color:${T.muted};margin-top:2px;font-family:'DM Mono',monospace;}
.card{background:${T.card};border:1px solid ${T.border};border-radius:12px;transition:box-shadow .18s;}
.card:hover{box-shadow:${T.sh2};}
.cp{padding:16px 18px;}
.ch{display:flex;justify-content:space-between;align-items:center;padding:11px 18px;border-bottom:1px solid ${T.border};}
.ch-title{font-size:12.5px;font-weight:700;}
.ch-sub{font-size:11px;color:${T.muted};}
.dbar{height:4px;background:${T.border};border-radius:2px;overflow:hidden;margin-top:6px;}
.dfill{height:100%;border-radius:2px;transition:width .8s cubic-bezier(.4,0,.2,1);}
.drow{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;}
.dlbl{font-size:9.5px;font-weight:700;color:${T.muted};text-transform:uppercase;letter-spacing:.8px;}
.dval{font-size:10.5px;font-weight:700;font-family:'DM Mono',monospace;}
.spark{display:flex;align-items:flex-end;gap:1.5px;height:20px;margin-top:4px;}
.spark-bar{min-width:2px;border-radius:1px;transition:height .4s ease;}
.tbl{width:100%;border-collapse:collapse;}
.tbl th{font-size:9.5px;font-weight:800;color:${T.muted};text-transform:uppercase;letter-spacing:1px;padding:0 15px 9px;text-align:left;border-bottom:1px solid ${T.border};}
.tbl td{padding:11px 15px;border-bottom:1px solid ${T.border};vertical-align:middle;}
.tbl tr:last-child td{border-bottom:none;}
.tbl tr:hover td{background:${T.surface};}
.tz-name{font-weight:700;font-size:13px;}
.tz-meta{font-size:10.5px;color:${T.muted};margin-top:1px;}
.lr{display:flex;justify-content:space-between;align-items:center;gap:11px;
  padding:11px 18px;border-bottom:1px solid ${T.border};transition:background .12s;}
.lr:last-child{border-bottom:none;}
.lr:hover{background:${T.surface};}
.lr-title{font-size:13px;font-weight:700;}
.lr-sub{font-size:11px;color:${T.muted};margin-top:1.5px;}
.lr-time{font-size:9.5px;color:${T.muted};font-family:'DM Mono',monospace;margin-top:2px;}
.map-layout{display:grid;grid-template-columns:1fr 296px;gap:14px;}
.pill{display:inline-flex;align-items:center;gap:3.5px;border-radius:5px;padding:2.5px 8px;font-size:10.5px;font-weight:600;}
.pdot{width:4.5px;height:4.5px;border-radius:50%;}
.gps-data{background:${T.surface};border-radius:8px;padding:9px 11px;font-family:'DM Mono',monospace;font-size:10.5px;color:${T.muted};line-height:1.85;}
.gdr{display:flex;justify-content:space-between;}
.btn{border:none;cursor:pointer;font-family:inherit;font-weight:600;border-radius:7px;
  padding:7px 13px;font-size:12px;transition:all .12s;display:inline-flex;align-items:center;gap:5px;}
.btn:hover{filter:brightness(1.08);}
.btn:active{transform:scale(.98);}
.btn:disabled{opacity:.45;cursor:not-allowed;}
.btn-primary{background:${T.text};color:${T.bg};}
.btn-ghost{background:${T.surface};color:${T.text};border:1px solid ${T.border};}
.btn-danger{background:${T.critBg};color:${T.crit};border:1px solid ${T.crit}33;}
.btn-success{background:${T.safeBg};color:${T.safe};border:1px solid ${T.safe}33;}
.btn-warn{background:${T.evacBg};color:${T.evac};border:1px solid ${T.evac}33;}
.btn-sm{padding:4px 9px;font-size:11px;border-radius:6px;}
.btn-xs{padding:3px 7px;font-size:10px;border-radius:5px;}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);
  display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;}
.modal{background:${T.card};border:1px solid ${T.border};border-radius:14px;
  padding:22px;width:100%;max-width:450px;box-shadow:${T.sh2};position:relative;}
.modal-bar{position:absolute;top:0;left:0;right:0;height:2px;border-radius:14px 14px 0 0;
  background:linear-gradient(90deg,transparent,${T.accent},transparent);}
.modal-title{font-size:15px;font-weight:800;letter-spacing:-.2px;margin-bottom:16px;}
.finp{width:100%;background:${T.surface};border:1px solid ${T.border};border-radius:7px;
  padding:8px 10px;color:${T.text};font-size:12.5px;font-family:inherit;outline:none;
  transition:border-color .18s;margin-bottom:11px;}
.finp:focus{border-color:${T.accent};}
.flbl{display:block;font-size:9.5px;font-weight:700;color:${T.muted};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:3px;}
.frow{margin-bottom:12px;}
.inline-inp{background:${T.surface};border:1px solid ${T.border};border-radius:5px;
  padding:4px 8px;color:${T.text};font-size:12px;font-family:'DM Mono',monospace;
  outline:none;width:70px;transition:border-color .15s;}
.inline-inp:focus{border-color:${T.accent};}
.search-wrap{position:relative;margin-bottom:14px;}
.search-ico{position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:${T.muted};pointer-events:none;}
.search-inp{width:100%;background:${T.surface};border:1px solid ${T.border};border-radius:8px;
  padding:8px 11px 8px 32px;color:${T.text};font-size:12.5px;font-family:inherit;outline:none;transition:border-color .18s;}
.search-inp:focus{border-color:${T.accent};}
.search-inp::placeholder{color:${T.muted};}
.toast-box{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);
  border-radius:9px;padding:10px 18px;font-weight:600;font-size:13px;
  z-index:9999;box-shadow:${T.sh2};animation:fu .25s both;white-space:nowrap;pointer-events:none;}
.spinner{width:20px;height:20px;border:2px solid ${T.border};border-top:2px solid ${T.accent};border-radius:50%;animation:spin .65s linear infinite;}
.loading-page{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:12px;color:${T.muted};font-size:11px;letter-spacing:2px;text-transform:uppercase;background:${T.bg};}
.g2{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:12px;}
.g2c{display:grid;grid-template-columns:1fr 1fr;gap:13px;}
.g2c2{display:grid;grid-template-columns:1fr 1fr;gap:13px;}
.fg{display:flex;align-items:center;gap:8px;}
.fb{display:flex;justify-content:space-between;align-items:center;}
.col{display:flex;flex-direction:column;gap:9px;}
.mb20{margin-bottom:20px;}.mb24{margin-bottom:24px;}
.hint{background:${T.surface};border-radius:8px;padding:10px 14px;font-size:11.5px;color:${T.muted};line-height:1.6;margin-bottom:16px;}
.empty{text-align:center;padding:40px 20px;color:${T.muted};font-size:13px;}
.mono{font-family:'DM Mono',monospace;}
.audit-row{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid ${T.border};}
.audit-row:last-child{border-bottom:none;}
.ptabs{display:flex;gap:2px;margin-bottom:16px;border-bottom:1px solid ${T.border};padding-bottom:0;}
.ptab{background:none;border:none;border-bottom:2px solid transparent;padding:8px 13px 10px;
  font-size:12.5px;font-weight:600;color:${T.muted};cursor:pointer;font-family:inherit;margin-bottom:-1px;transition:all .14s;}
.ptab:hover{color:${T.sub};}
.ptab.on{color:${T.accent};border-bottom-color:${T.accent};}
.auth-tab{flex:1;padding:7px 0;border:none;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700;font-size:12px;transition:all .2s;background:transparent;color:${T.muted};}
.auth-tab.on{background:${T.card};box-shadow:${T.sh};color:${T.text};}
.leaflet-container{background:${T.isDark?"#1a1a16":"#e8e4da"} !important;font-family:'Plus Jakarta Sans',sans-serif !important;}
.leaflet-tile{filter:${T.mapFilter};}
.leaflet-control-attribution{background:${T.card}cc !important;color:${T.muted} !important;font-size:9px !important;}
.leaflet-control-zoom a{background:${T.card} !important;color:${T.accent} !important;border-color:${T.border} !important;font-weight:700;}
.leaflet-popup-content-wrapper{background:${T.card} !important;border:1px solid ${T.border} !important;border-radius:11px !important;color:${T.text} !important;box-shadow:${T.sh2} !important;}
.leaflet-popup-tip{background:${T.card} !important;}
.leaflet-popup-content{margin:13px 15px !important;min-width:190px;}
.leaflet-popup-close-button{color:${T.muted} !important;}
`;

// ── Auth helpers ───────────────────────────────────────────────────────────
const getToken  = () => localStorage.getItem("cs-token");
const getUser   = () => { try { return JSON.parse(localStorage.getItem("cs-user") || "null"); } catch { return null; } };
const saveAuth  = (token, user) => { localStorage.setItem("cs-token", token); localStorage.setItem("cs-user", JSON.stringify(user)); };
const clearAuth = () => { localStorage.removeItem("cs-token"); localStorage.removeItem("cs-user"); };
const isAdmin   = () => !!getUser();

// ── API helpers ────────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  let r;
  try { r = await fetch(API + path, { headers, ...opts }); }
  catch (e) { throw new Error("Cannot reach backend — is it running on port 8080?"); }
  if (r.status === 401) { clearAuth(); window.location.reload(); return; }
  if (!r.ok) {
    let msg = `HTTP ${r.status}`;
    try { const j = await r.json(); msg = j.message || j.error || msg; if (j.details && typeof j.details === 'object') msg += ": " + Object.values(j.details).join(", "); } catch (_) {}
    throw new Error(msg);
  }
  if (r.status === 204) return null;
  return r.json();
}

async function authApi(path, body) {
  let r;
  try { r = await fetch(API + path, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) }); }
  catch (e) { throw new Error("Cannot reach backend — is it running on port 8080?"); }
  if (!r.ok) {
    let msg = `HTTP ${r.status}`;
    try { const j = await r.json(); msg = j.message || j.error || msg; if (j.details && typeof j.details === 'object') msg += ": " + Object.values(j.details).join(", "); } catch (_) { msg = (await r.text()) || msg; }
    throw new Error(msg);
  }
  return r.json();
}

// ── Helpers ────────────────────────────────────────────────────────────────
const scr = (src) => new Promise(r => {
  if (document.querySelector(`script[src="${src}"]`)) { r(); return; }
  const s = document.createElement("script"); s.src = src; s.onload = r; s.onerror = r;
  document.head.appendChild(s);
});
const pct    = (v, m) => m > 0 ? Math.min(Math.round(v / m * 100), 100) : 0;
const dcol   = (p, T) => p >= 95 ? T.crit : p >= 75 ? T.warn : p >= 50 ? "#55aa55" : T.safe;
const fmtArea  = m2 => m2 >= 1e6 ? `${(m2/1e6).toFixed(2)} km²` : m2 >= 1e4 ? `${(m2/1e4).toFixed(1)} ha` : `${Math.round(m2)} m²`;
const fmtTime  = iso => iso ? new Date(iso).toLocaleString(undefined, {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "";
const fmtShort = iso => iso ? new Date(iso).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"}) : "";

const STATUS = { SAFE:{dot:"#34c472",lbl:"Safe",fg:"#34c472",bg:"#0a1e12"}, WARNING:{dot:"#f0b429",lbl:"Warning",fg:"#f0b429",bg:"#1c1200"}, CRITICAL:{dot:"#f03e5e",lbl:"Critical",fg:"#f03e5e",bg:"#1e0a0e"}, EVACUATING:{dot:"#b06cff",lbl:"Evacuating",fg:"#b06cff",bg:"#130a24"} };
const INC_I  = { OVERCROWDING:"👥", MEDICAL:"🏥", FIRE:"🔥", STAMPEDE:"🚨", SECURITY:"🔒", OTHER:"⚠️" };

function playAlert(freq=880,dur=.25) {
  try { const c=new(window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="triangle";o.frequency.value=freq;g.gain.setValueAtTime(.25,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+dur);o.start(c.currentTime);o.stop(c.currentTime+dur); } catch(e){}
}
function playEvacAlarm() { [880,660,880,660].forEach((f,i)=>setTimeout(()=>playAlert(f,.2),i*220)); }
let auditStore = [];
function pushAudit(msg,icon="📋") { auditStore=[{msg,icon,ts:new Date().toISOString(),id:Date.now()},...auditStore].slice(0,60); }

// ── WebSocket hook ─────────────────────────────────────────────────────────
function useWS({ onZones, onUsers, onAlerts, onIncidents, onStats, onEvac, setWsState }) {
  const ref = useRef(null);
  const prevAlertCount = useRef(0);
  useEffect(() => {
    let alive = true;
    (async () => {
      await scr("https://cdnjs.cloudflare.com/ajax/libs/sockjs-client/1.6.1/sockjs.min.js");
      await scr("https://cdnjs.cloudflare.com/ajax/libs/stomp.js/2.3.3/stomp.min.js");
      if (alive) connect();
    })();
    return () => { alive=false; try{ref.current?.disconnect();}catch(e){} };
  }, []);
  function connect() {
    setWsState("conn");
    try {
      const sock = new window.SockJS(WS_URL);
      const c = window.Stomp.over(sock);
      c.debug = null;
      c.connect({}, () => {
        setWsState("live");
        c.subscribe("/topic/zones",     m=>{ try{const d=JSON.parse(m.body);onZones(d.zones||[],d);}catch(e){} });
        c.subscribe("/topic/live",      m=>{ try{onUsers(JSON.parse(m.body).users||[]);}catch(e){} });
        c.subscribe("/topic/alerts",    m=>{ try{const d=JSON.parse(m.body);const n=(d.alerts||[]).length;if(n>prevAlertCount.current)playAlert(660,.3);prevAlertCount.current=n;onAlerts(d.alerts||[]);}catch(e){} });
        c.subscribe("/topic/incidents", m=>{ try{onIncidents(JSON.parse(m.body).incidents||[]);}catch(e){} });
        c.subscribe("/topic/stats",     m=>{ try{onStats(JSON.parse(m.body));}catch(e){} });
        c.subscribe("/topic/evacuation",m=>{ try{onEvac(JSON.parse(m.body));}catch(e){} });
        ref.current = c;
      }, ()=>{ setWsState("poll"); setTimeout(connect,3500); });
    } catch(e){ setWsState("poll"); setTimeout(connect,3500); }
  }
}

// ── Small components ───────────────────────────────────────────────────────
function Pill({ status, T }) {
  const s = STATUS[status] || STATUS.SAFE;
  return <span className="pill" style={{background:s.bg,color:s.fg}}><span className="pdot" style={{background:s.dot}}/>{s.lbl}</span>;
}
function IncPill({ status, T }) {
  const map = {OPEN:{c:"var(--warn)",b:"var(--warnBg)"},IN_PROGRESS:{c:"var(--info)",b:"var(--infoBg)"},RESOLVED:{c:"var(--safe)",b:"var(--safeBg)"},CLOSED:{c:T.muted,b:T.surface}};
  const s = map[status]||map.OPEN;
  return <span className="pill" style={{background:s.b,color:s.c}}><span className="pdot" style={{background:s.c}}/>{status.replace("_"," ")}</span>;
}
function SevPill({ sev, T }) {
  const map = {LOW:{c:"var(--info)",b:"var(--infoBg)"},MEDIUM:{c:"var(--warn)",b:"var(--warnBg)"},HIGH:{c:"var(--warn)",b:"var(--warnBg)"},CRITICAL:{c:"var(--crit)",b:"var(--critBg)"}};
  const s = map[sev]||map.LOW;
  return <span className="pill" style={{background:s.b,color:s.c}}><span className="pdot" style={{background:s.c}}/>{sev}</span>;
}
function DBar({ value, max, T, height=4 }) {
  const p=pct(value,max),c=dcol(p,T);
  return <div><div className="drow"><span className="dlbl">Density</span><span className="dval" style={{color:c}}>{p}% <span style={{color:T.muted,fontWeight:400}}>({value}/{max})</span></span></div><div className="dbar" style={{height}}><div className="dfill" style={{width:`${p}%`,background:c}}/></div></div>;
}
function Sparkline({ data, T }) {
  if (!data?.length) return null;
  const max=Math.max(...data,1);
  return <div className="spark">{data.map((v,i)=>{const h=Math.max(2,Math.round(v/max*20));const op=0.35+0.65*(i/Math.max(data.length-1,1));return <div key={i} className="spark-bar" style={{height:h,background:dcol(pct(v,max*0.8),T),opacity:op,flex:1}}/>;})}</div>;
}

// ── AI Crowd Intelligence components ──────────────────────────────────────
function AiDangerBadge({ level }) {
  const map = {CRITICAL:{c:"var(--crit)",b:"var(--critBg)"},HIGH:{c:"#f0832a",b:"#1a0d00"},MODERATE:{c:"var(--warn)",b:"var(--warnBg)"},LOW:{c:"var(--safe)",b:"var(--safeBg)"},EVACUATING:{c:"var(--evac)",b:"var(--evacBg)"}};
  const s = map[level]||map.LOW;
  return <span style={{background:s.b,color:s.c,borderRadius:6,padding:"3px 10px",fontSize:10.5,fontWeight:800,letterSpacing:.5,animation:level==="CRITICAL"?"blink 1.4s ease-in-out infinite":"none"}}>{level}</span>;
}

// ── Zone Map ───────────────────────────────────────────────────────────────
const ZoneMap = memo(function ZoneMap({ zones, incidents, tracked, onSaveZone, onEditZoneGeo, onUpdateCount, showHeat, T }) {
  const cRef=useRef(null),mapRef=useRef(null),drawnRef=useRef(null);
  const zLy=useRef({}),uLy=useRef({}),iLy=useRef({}),heatRef=useRef(null);
  const fittedRef=useRef(false);
  const [ready,setReady]=useState(false);
  const [pend,setPend]=useState(null);

  useEffect(()=>{
    if(window.L?.Draw){setReady(true);return;}
    const lnk=h=>{const l=document.createElement("link");l.rel="stylesheet";l.href=h;document.head.appendChild(l);};
    lnk("https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css");
    lnk("https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css");
    scr("https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js")
      .then(()=>scr("https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"))
      .then(()=>scr("https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js"))
      .then(()=>setReady(true));
  },[]);

  useEffect(()=>{
    if(!ready||!cRef.current||mapRef.current)return;
    const L=window.L;
    const map=L.map(cRef.current,{center:[20.5937,78.9629],zoom:5});
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OSM",maxZoom:19}).addTo(map);
    const drawn=new L.FeatureGroup().addTo(map);
    drawnRef.current=drawn;
    const dc=new L.Control.Draw({edit:{featureGroup:drawn},draw:{polygon:{allowIntersection:false,shapeOptions:{color:T.accent,fillColor:T.accent,fillOpacity:.1,weight:2}},circle:{shapeOptions:{color:T.accent,fillColor:T.accent,fillOpacity:.1,weight:2},showRadius:true,metric:true},marker:false,polyline:false,rectangle:false,circlemarker:false}});
    map.addControl(dc);
    map.on(L.Draw.Event.CREATED,e=>{
      const ly=e.layer;let sd={};
      if(e.layerType==="polygon"){const ll=ly.getLatLngs()[0],coords=ll.map(p=>[p.lat,p.lng]);coords.push(coords[0]);const cx=ll.reduce((a,p)=>({lat:a.lat+p.lat/ll.length,lng:a.lng+p.lng/ll.length}),{lat:0,lng:0});sd={shapeType:"polygon",polygonCoords:coords,latitude:cx.lat,longitude:cx.lng};}
      else if(e.layerType==="circle"){const c=ly.getLatLng();sd={shapeType:"circle",latitude:c.lat,longitude:c.lng,radiusMetres:ly.getRadius()};}
      drawn.addLayer(ly);setPend({ly,sd});
    });
    map.on(L.Draw.Event.EDITED,e=>{e.layers.eachLayer(ly=>{const zid=ly.options.zoneId;if(!zid)return;let u={};if(ly instanceof L.Circle)u={shapeType:"circle",latitude:ly.getLatLng().lat,longitude:ly.getLatLng().lng,radiusMetres:ly.getRadius()};else if(ly instanceof L.Polygon){const ll=ly.getLatLngs()[0],coords=ll.map(p=>[p.lat,p.lng]);coords.push(coords[0]);const cx=ll.reduce((a,p)=>({lat:a.lat+p.lat/ll.length,lng:a.lng+p.lng/ll.length}),{lat:0,lng:0});u={shapeType:"polygon",polygonCoords:coords,latitude:cx.lat,longitude:cx.lng};}onEditZoneGeo(zid,u);});});
    mapRef.current=map;
  },[ready]);

  useEffect(()=>{
    if(!ready||!mapRef.current||!window.L)return;
    if(heatRef.current){mapRef.current.removeLayer(heatRef.current);heatRef.current=null;}
    if(!showHeat||!zones.length)return;
    const pts=zones.filter(z=>z.latitude&&z.longitude&&z.capacity>0).map(z=>[z.latitude,z.longitude,Math.min(pct(z.currentCount,z.capacity)/100*1.2,1)]);
    if(!pts.length)return;
    heatRef.current=window.L.heatLayer(pts,{radius:60,blur:45,maxZoom:14,gradient:{0:T.safe,.5:T.warn,1:T.crit}}).addTo(mapRef.current);
  },[zones,showHeat,ready,T]);

  useEffect(()=>{
    if(!ready||!mapRef.current||!window.L)return;
    const L=window.L,map=mapRef.current;
    const live=new Set(zones.map(z=>z.id));
    Object.keys(zLy.current).forEach(id=>{if(!live.has(id)){map.removeLayer(zLy.current[id]);delete zLy.current[id];}});
    let added=false;
    zones.forEach(zone=>{
      if(!zone.latitude&&!zone.polygonCoords?.length)return;
      const st=STATUS[zone.status]||STATUS.SAFE,col=st.dot,p=pct(zone.currentCount,zone.capacity);
      const isCrit=zone.status==="CRITICAL",isEvac=zone.status==="EVACUATING";
      const sty={color:col,fillColor:col,fillOpacity:isCrit?.18:isEvac?.15:.08,weight:isCrit||isEvac?2.5:1.5,...(isCrit?{dashArray:"6 3"}:{}),...(isEvac?{dashArray:"3 3"}:{})};
      const ph=`<div style="font-family:'Plus Jakarta Sans',sans-serif"><div style="font-weight:800;font-size:14px;color:${T.text};margin-bottom:2px">${zone.name}</div><div style="font-size:11px;color:${T.muted};margin-bottom:9px">📍 ${zone.location||""}</div><div style="background:${T.border};border-radius:2px;height:5px;margin-bottom:11px"><div style="height:100%;width:${p}%;background:${col};border-radius:2px"></div></div><span style="background:${st.bg};color:${st.fg};border-radius:5px;padding:3px 9px;font-size:11px;font-weight:600">${st.lbl} · ${zone.currentCount}/${zone.capacity}</span></div>`;
      if(zLy.current[zone.id]){zLy.current[zone.id].setStyle(sty);zLy.current[zone.id].setPopupContent(ph);}
      else{
        let ly;
        if(zone.shapeType==="polygon"&&zone.polygonCoords?.length>2)ly=L.polygon(zone.polygonCoords.map(c=>L.latLng(c[0],c[1])),{...sty,zoneId:zone.id});
        else ly=L.circle([zone.latitude,zone.longitude],{...sty,radius:zone.radiusMetres||200,zoneId:zone.id});
        ly.bindPopup(ph,{maxWidth:260});
        const zid=zone.id;
        ly.on("popupopen",()=>{ });
        ly.addTo(map);zLy.current[zone.id]=ly;added=true;
      }
    });
    if(added&&!fittedRef.current&&Object.keys(zLy.current).length){
      try{map.fitBounds(L.featureGroup(Object.values(zLy.current)).getBounds().pad(.3),{maxZoom:16,animate:true});fittedRef.current=true;}catch(e){}
    }
  },[zones,ready,T]);

  useEffect(()=>{
    if(!ready||!mapRef.current||!window.L)return;
    Object.values(iLy.current).forEach(m=>mapRef.current.removeLayer(m));iLy.current={};
    incidents.filter(i=>!["RESOLVED","CLOSED"].includes(i.status)).forEach(inc=>{
      const z=zones.find(z=>z.id===inc.zoneId);if(!z?.latitude)return;
      const em=INC_I[inc.type]||"⚠️";
      const icon=window.L.divIcon({html:`<div style="font-size:20px;filter:drop-shadow(0 2px 5px rgba(0,0,0,.4))">${em}</div>`,className:"",iconSize:[24,24],iconAnchor:[12,24]});
      iLy.current[inc.id]=window.L.marker([z.latitude+.0012,z.longitude+.0012],{icon,zIndexOffset:500}).addTo(mapRef.current).bindPopup(`<div style="font-family:'Plus Jakarta Sans',sans-serif"><div style="font-size:22px;margin-bottom:5px">${em}</div><div style="font-size:13px;font-weight:700;color:${T.text}">${inc.title}</div><div style="font-size:11px;color:${T.muted};margin-top:2px">${inc.zoneName}</div></div>`,{maxWidth:220});
    });
  },[incidents,zones,ready,T]);

  useEffect(()=>{
    if(!ready||!mapRef.current||!window.L)return;
    const map=mapRef.current;
    const live=new Set(tracked.map(u=>u.deviceId));
    Object.keys(uLy.current).forEach(id=>{if(!live.has(id)){map.removeLayer(uLy.current[id]);delete uLy.current[id];}});
    tracked.forEach(u=>{
      if(!u.latitude||!u.longitude)return;
      const inZ=!!u.currentZoneName,dot=inZ?"#34c472":"#f0b429";
      const icon=window.L.divIcon({html:`<div style="position:relative;width:13px;height:13px"><div style="position:absolute;inset:0;border-radius:50%;background:${dot};border:2px solid #fff;z-index:2"></div><div style="position:absolute;inset:-5px;border-radius:50%;background:${dot}55;animation:ping 2.5s ease-out infinite;pointer-events:none"></div></div>`,className:"",iconSize:[13,13],iconAnchor:[6,6]});
      const ph=`<div style="font-family:'Plus Jakarta Sans',sans-serif"><div style="font-size:13px;font-weight:700;color:${T.text};margin-bottom:2px">👤 ${u.displayName||"User"}</div><div style="font-size:11px;color:${inZ?"#34c472":"var(--muted)"}">${inZ?"📍 "+u.currentZoneName:"Outside zones"}</div></div>`;
      if(uLy.current[u.deviceId]){uLy.current[u.deviceId].setLatLng([u.latitude,u.longitude]);}
      else{uLy.current[u.deviceId]=window.L.marker([u.latitude,u.longitude],{icon,zIndexOffset:1000}).addTo(map).bindPopup(ph,{maxWidth:210});}
    });
  },[tracked,ready,T]);

  return (
    <div style={{position:"relative",height:"100%",minHeight:460,borderRadius:12,overflow:"hidden",border:`1px solid ${T.border}`}}>
      <div ref={cRef} style={{width:"100%",height:"100%"}}/>
      {!ready&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:T.card,gap:11}}><div className="spinner"/><span style={{color:T.muted,fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:2}}>LOADING MAP</span></div>}
      {pend&&<DrawDialog sd={pend.sd} T={T} onSave={(n,l,c)=>{onSaveZone({...pend.sd,name:n,location:l,capacity:Number(c)});setPend(null);}} onCancel={()=>{drawnRef.current?.removeLayer(pend.ly);setPend(null);}}/>}
    </div>
  );
});

function DrawDialog({ sd, onSave, onCancel, T }) {
  const [n,sN]=useState(""); const [l,sL]=useState(""); const [c,sC]=useState("500");
  const ref=useRef(null);
  useEffect(()=>{ref.current?.focus();},[]);
  return (
    <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:800,padding:20}} onKeyDown={e=>{if(e.key==="Escape")onCancel();if(e.key==="Enter"&&n&&c)onSave(n,l,c);}}>
      <div className="modal fu">
        <div className="modal-bar"/>
        <div className="modal-title">Create Zone</div>
        <div style={{background:T.surface,borderRadius:7,padding:"8px 11px",marginBottom:15,fontFamily:"'DM Mono',monospace",fontSize:11,color:T.accent}}>
          {sd.shapeType==="polygon"?"◆ Polygon":"○ Circle"}{sd.radiusMetres?` · r=${Math.round(sd.radiusMetres)}m`:""} · {(sd.latitude||0).toFixed(4)}°N {(sd.longitude||0).toFixed(4)}°E
        </div>
        {[["Zone name","text",n,sN,"e.g. Main Entrance",true],["Location label","text",l,sL,"e.g. Gate A"],["Max capacity","number",c,sC,"e.g. 500"]].map(([lb,tp,val,set,ph,foc])=>(
          <div className="frow" key={lb}><label className="flbl">{lb}</label><input ref={foc?ref:null} className="finp" type={tp} value={val} placeholder={ph} onChange={e=>set(e.target.value)}/></div>
        ))}
        <div style={{display:"flex",gap:7,marginTop:4}}>
          <button className="btn btn-primary" style={{flex:1,justifyContent:"center",opacity:n&&l&&c?1:.45}} onClick={()=>{if(n&&l&&c)onSave(n,l,c);}}>Create Zone</button>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [isDark, setDark] = useState(()=>localStorage.getItem("cs-theme")==="dark");
  const T = useMemo(()=>mkTheme(isDark),[isDark]);

  // Auth
  const [authed,   setAuthed]   = useState(()=>!!getToken());
  const [authUser, setAuthUser] = useState(()=>getUser());
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({fullName:"",email:"",password:""});
  const [authErr,  setAuthErr]  = useState("");
  const [authLoad, setAuthLoad] = useState(false);

  // App state
  const [tab,       setTab]       = useState("map");
  const [zones,     setZones]     = useState([]);
  const [incs,      setIncs]      = useState([]);
  const [alerts,    setAlerts]    = useState([]);
  const [stats,     setStats]     = useState({});
  const [tracked,   setTracked]   = useState([]);
  const [riskScores,setRiskScores]= useState({});
  const [loading,   setLoading]   = useState(true);
  const [wsState,   setWsState]   = useState("conn");
  const [heat,      setHeat]      = useState(false);
  const [modal,     setModal]     = useState(null);
  const [editZone,  setEditZ]     = useState(null);
  const [sync,      setSync]      = useState(null);
  const [toast,     setToast]     = useState(null);
  const [evacActive,setEvac]      = useState(false);
  const [audit,     setAudit]     = useState([]);
  const [incFilter, setIncF]      = useState("ALL");
  const [search,    setSearch]    = useState("");
  const [zoneHistory,setZH]       = useState({});
  const [newInc,    setNI]        = useState({zoneId:"",title:"",description:"",type:"OVERCROWDING",severity:"MEDIUM"});

  // AI Crowd Intelligence state
  const [aiData,    setAiData]    = useState(null);
  const [aiLoading, setAiLoad]    = useState(false);
  const [aiError,   setAiError]   = useState("");
  const [aiLastRun, setAiLastRun] = useState(null);
  const [aiFilter,  setAiFilter]  = useState("ALL");

  // CSS
  useEffect(()=>{
    let el=document.getElementById("cs-css");
    if(!el){el=document.createElement("style");el.id="cs-css";document.head.appendChild(el);}
    el.textContent=buildCSS(T);
  },[T]);

  // Keyboard shortcuts
  useEffect(()=>{
    const h=e=>{
      if(e.key==="Escape")setModal(null);
      if(document.activeElement?.tagName==="INPUT"||document.activeElement?.tagName==="TEXTAREA")return;
      const m={m:"map",d:"dash",z:"zones",i:"inc",a:"alrt",g:"gps"};
      if(m[e.key])setTab(m[e.key]);
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[]);

  const showToast = useCallback((msg,type="safe")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3200); },[]);
  const addAudit  = useCallback((msg,icon="📋")=>{ pushAudit(msg,icon); setAudit(a=>[{msg,icon,ts:new Date().toISOString(),id:Date.now()},...a].slice(0,60)); },[]);

  const updateHistory = useCallback((newZones)=>{
    const ts=new Date().toISOString();
    setZH(prev=>{ const next={...prev}; newZones.forEach(z=>{ const cur=next[z.id]||[]; next[z.id]=[...cur,{count:z.currentCount,capacity:z.capacity,ts}].slice(-HISTORY_MAX); }); return next; });
  },[]);

  // WebSocket
  useWS({
    onZones:     useCallback((zs,d)=>{ setZones(zs); if(d.evacuatingZones>0){if(!evacActive)playEvacAlarm();setEvac(true);}else setEvac(false); updateHistory(zs); setSync(new Date()); },[evacActive,updateHistory]),
    onUsers:     useCallback(us=>setTracked(us),[]),
    onAlerts:    useCallback(as=>setAlerts(as),[]),
    onIncidents: useCallback(is=>setIncs(is),[]),
    onStats:     useCallback(s=>{ setStats(s); if(s.riskScores)setRiskScores(s.riskScores); },[]),
    onEvac:      useCallback(d=>{ if(d.event==="EVACUATION_ACTIVE"){setEvac(true);playEvacAlarm();addAudit("🚨 Evacuation activated","🚨");showToast("EVACUATION ACTIVATED","crit");}else if(d.event==="ALL_CLEAR"){setEvac(false);addAudit("✅ Evacuation cleared","✅");showToast("All clear");} },[addAudit,showToast]),
    setWsState,
  });

  // REST polling
  const load = useCallback(async()=>{
    try {
      const [s,z,i,a,u,r]=await Promise.all([api("/dashboard/stats"),api("/zones"),api("/incidents"),api("/alerts/unacknowledged"),api("/track/active"),api("/risk/zones")]);
      setStats(s);setZones(z);setIncs(i);setAlerts(a);setTracked(u);
      setEvac(z.some(z=>z.status==="EVACUATING"));
      updateHistory(z);
      if(r)setRiskScores(r);
      setSync(new Date());
    } catch(e){console.warn("Poll:",e.message);}
    finally{setLoading(false);}
  },[updateHistory]);
  useEffect(()=>{ load(); const t=setInterval(load,8000); return()=>clearInterval(t); },[load]);

  // Clock
  const [clock,setClock]=useState(new Date().toLocaleTimeString());
  useEffect(()=>{ const t=setInterval(()=>setClock(new Date().toLocaleTimeString()),1000); return()=>clearInterval(t); },[]);

  // Auth handlers
  const handleAuth = useCallback(async()=>{
    setAuthErr("");setAuthLoad(true);
    try {
      const isReg=authMode==="register";
      const body=isReg?{fullName:authForm.fullName,email:authForm.email,password:authForm.password}:{email:authForm.email,password:authForm.password};
      const data=await authApi(isReg?"/auth/register":"/auth/login",body);
      saveAuth(data.token,{email:data.email,fullName:data.fullName,role:data.role});
      setAuthUser({email:data.email,fullName:data.fullName,role:data.role});
      setAuthed(true);
    } catch(e){ setAuthErr(e.message||"Login failed — check backend is running"); }
    finally{setAuthLoad(false);}
  },[authMode,authForm]);
  const handleLogout=useCallback(()=>{ clearAuth();setAuthed(false);setAuthUser(null); },[]);

  // AI handler
  const runAiAnalysis=useCallback(async()=>{
    setAiLoad(true);setAiError("");
    try {
      const data=await api("/ai/analyse");
      setAiData(data);setAiLastRun(new Date());
      addAudit("AI crowd analysis completed","🤖");
    } catch(e){ setAiError(e.message||"AI analysis failed"); }
    finally{setAiLoad(false);}
  },[addAudit]);

  // Zone actions
  const saveZone=useCallback(async d=>{
    try{await api("/zones",{method:"POST",body:JSON.stringify(d)});addAudit(`Zone "${d.name}" created`,"◈");showToast(`Zone "${d.name}" created`);}
    catch(e){showToast(e.message,"crit");}
  },[addAudit,showToast]);
  const editZoneGeo=useCallback(async(id,g)=>{ const z=zones.find(z=>z.id===id);if(!z)return; try{await api(`/zones/${id}`,{method:"PUT",body:JSON.stringify({...z,...g})});}catch(e){showToast(e.message,"crit");} },[zones,showToast]);
  const updateCount=useCallback(async(id,count)=>{ try{await api(`/zones/${id}/count`,{method:"PATCH",body:JSON.stringify({count})});}catch(e){showToast(e.message,"crit");} },[showToast]);
  const deleteZone=useCallback(async(id,name)=>{ if(!confirm(`Delete zone "${name}"?`))return; try{await api(`/zones/${id}`,{method:"DELETE"});addAudit(`Zone "${name}" deleted`,"🗑");showToast("Zone deleted");}catch(e){showToast(e.message,"crit");} },[addAudit,showToast]);
  const saveEditZone=useCallback(async()=>{ try{await api(`/zones/${editZone.id}`,{method:"PUT",body:JSON.stringify(editZone)});setModal(null);setEditZ(null);addAudit(`Zone "${editZone.name}" updated`,"✏️");showToast("Zone saved");}catch(e){showToast(e.message,"crit");} },[editZone,addAudit,showToast]);
  const createInc=useCallback(async()=>{ const zoneName=zones.find(z=>z.id===newInc.zoneId)?.name||""; try{await api("/incidents",{method:"POST",body:JSON.stringify({...newInc,zoneName})});setModal(null);setNI({zoneId:"",title:"",description:"",type:"OVERCROWDING",severity:"MEDIUM"});addAudit(`Incident "${newInc.title}" reported`,"⚑");showToast("Incident reported");}catch(e){showToast(e.message,"crit");} },[newInc,zones,addAudit,showToast]);
  const resolveInc=useCallback(async inc=>{ try{await api(`/incidents/${inc.id}/resolve`,{method:"PATCH"});addAudit(`Incident "${inc.title}" resolved`,"✅");showToast("Incident resolved");}catch(e){showToast(e.message,"crit");} },[addAudit,showToast]);
  const ackAlert=useCallback(async id=>{ try{await api(`/alerts/${id}/acknowledge`,{method:"PATCH"});}catch(e){} },[]);
  const ackAll=useCallback(async()=>{ try{await api("/alerts/acknowledge-all",{method:"POST"});addAudit("All alerts acknowledged","✅");showToast("All alerts acknowledged");}catch(e){} },[addAudit,showToast]);
  const activateEvac=useCallback(async()=>{ const reason=prompt("Evacuation reason:","Emergency evacuation");if(!reason)return; try{await api("/evacuation/activate",{method:"POST",body:JSON.stringify({reason})});}catch(e){showToast(e.message,"crit");} },[showToast]);
  const clearEvac=useCallback(async()=>{ try{await api("/evacuation/clear",{method:"POST"});}catch(e){showToast(e.message,"crit");} },[showToast]);
  const exportCSV=useCallback((type)=>{ let csv="",fn=""; if(type==="zones"){csv=["Name,Location,Status,Count,Capacity,Density%"].concat(zones.map(z=>`"${z.name}","${z.location||""}",${z.status},${z.currentCount},${z.capacity},${pct(z.currentCount,z.capacity)}`)).join("\n");fn="zones.csv";}else{csv=["Title,Zone,Type,Severity,Status,Reported"].concat(incs.map(i=>`"${i.title}","${i.zoneName||""}",${i.type},${i.severity},${i.status},"${fmtTime(i.reportedAt)}"`)).join("\n");fn="incidents.csv";} const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));const a=document.createElement("a");a.href=url;a.download=fn;a.click();URL.revokeObjectURL(url);showToast(`${type} exported`); },[zones,incs,showToast]);

  const openIncs    = useMemo(()=>incs.filter(i=>i.status==="OPEN"),[incs]);
  const critCount   = useMemo(()=>zones.filter(z=>z.status==="CRITICAL").length,[zones]);
  const critRiskCount = useMemo(()=>Object.values(riskScores).filter(r=>r.riskScore>=75).length,[riskScores]);
  const overallDensity = Math.round(stats?.overallDensity||0);
  const filteredIncs = useMemo(()=>{ let l=incs; if(incFilter!=="ALL")l=l.filter(i=>i.status===incFilter||i.severity===incFilter); if(search)l=l.filter(i=>i.title?.toLowerCase().includes(search.toLowerCase())||i.zoneName?.toLowerCase().includes(search.toLowerCase())); return l; },[incs,incFilter,search]);
  const filteredZones = useMemo(()=>search?zones.filter(z=>z.name?.toLowerCase().includes(search.toLowerCase())||z.location?.toLowerCase().includes(search.toLowerCase())):zones,[zones,search]);
  const mapProps = useMemo(()=>({zones,incidents:incs,tracked,onSaveZone:saveZone,onEditZoneGeo:editZoneGeo,onUpdateCount:updateCount,showHeat:heat,T}),[zones,incs,tracked,saveZone,editZoneGeo,updateCount,heat,T]);

  const NAV = [
    {id:"map",  lbl:"Live Map",  ico:"🗺"},
    {id:"dash", lbl:"Dashboard", ico:"▦"},
    {id:"ai",   lbl:"AI Intel",  ico:"🤖", badge:aiData?((aiData.zones||[]).filter(z=>z.dangerLevel==="CRITICAL"||z.dangerLevel==="HIGH").length):0},
    {id:"zones",lbl:"Zones",     ico:"◈"},
    {id:"inc",  lbl:"Incidents", ico:"⚑", badge:openIncs.length},
    {id:"alrt", lbl:"Alerts",    ico:"◎", badge:alerts.length},
    {id:"gps",  lbl:"Tracking",  ico:"📡",badge:tracked.length,bg:true},
    {id:"log",  lbl:"Audit Log", ico:"🗒"},
  ];

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!authed) {
    const isReg=authMode==="register";
    return (
      <div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Plus Jakarta Sans',sans-serif",color:T.text}}>
        <style>{buildCSS(T)}</style>
        <div style={{width:"100%",maxWidth:400}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{width:52,height:52,borderRadius:13,background:T.text,color:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 12px"}}>🛡</div>
            <div style={{fontSize:24,fontWeight:800,letterSpacing:"-.5px"}}>CrowdShield</div>
            <div style={{fontSize:12,color:T.muted,marginTop:4}}>Real-time crowd safety platform</div>
          </div>
          <div className="card cp" style={{position:"relative"}}>
            <div className="modal-bar"/>
            <div style={{display:"flex",gap:4,marginBottom:18,background:T.surface,padding:4,borderRadius:8}}>
              {["login","register"].map(m=>(
                <button key={m} className={`auth-tab${authMode===m?" on":""}`} onClick={()=>{setAuthMode(m);setAuthErr("");}}>{m==="login"?"Sign In":"Register"}</button>
              ))}
            </div>
            {isReg&&<div className="frow"><label className="flbl">Full Name</label><input className="finp" placeholder="Your name" value={authForm.fullName} onChange={e=>setAuthForm({...authForm,fullName:e.target.value})} onKeyDown={e=>e.key==="Enter"&&handleAuth()}/></div>}
            <div className="frow"><label className="flbl">Email</label><input className="finp" type="email" placeholder="admin@crowdshield.com" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} onKeyDown={e=>e.key==="Enter"&&handleAuth()}/></div>
            <div className="frow" style={{marginBottom:authErr?10:18}}><label className="flbl">Password</label><input className="finp" type="password" placeholder="••••••••" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} onKeyDown={e=>e.key==="Enter"&&handleAuth()}/></div>
            {authErr&&<div style={{background:T.critBg,color:T.crit,border:`1px solid ${T.crit}33`,borderRadius:7,padding:"8px 11px",fontSize:12,marginBottom:14}}>{authErr}</div>}
            <button className="btn btn-primary" style={{width:"100%",justifyContent:"center",opacity:authLoad?.6:1}} onClick={handleAuth} disabled={authLoad}>
              {authLoad?"Please wait…":isReg?"Create Account":"Sign In"}
            </button>
            <div style={{textAlign:"center",marginTop:12,fontSize:11,color:T.muted}}>Demo: admin@crowdshield.com / Admin@1234</div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading-page"><div className="spinner"/><span>Connecting to CrowdShield…</span></div>;

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text}}>
      {toast&&<div className="toast-box" style={{background:toast.type==="crit"?T.critBg:toast.type==="warn"?T.warnBg:T.safeBg,color:toast.type==="crit"?T.crit:toast.type==="warn"?T.warn:T.safe,border:`1px solid ${toast.type==="crit"?T.crit:toast.type==="warn"?T.warn:T.safe}44`}}>{toast.msg}</div>}

      <header>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div className="logo-mark">🛡</div>
          <div className="logo-name">Crowd<span>Shield</span></div>
        </div>
        <div className="hdiv"/>
        <nav className="top-nav">
          {NAV.map(n=>{const b=n.badge>0;return(
            <button key={n.id} className={`tn${tab===n.id?" on":""}`} onClick={()=>setTab(n.id)}>
              {n.lbl}
              {b&&<span className="tn-badge" style={{background:n.bg?"var(--safe)":"var(--crit)"}}/>}
            </button>
          );})}
        </nav>
        <div className="htools">
          {isAdmin()&&(evacActive
            ?<button className="btn btn-sm btn-success blink" onClick={clearEvac}>✅ All Clear</button>
            :<button className="btn btn-sm btn-warn" onClick={activateEvac}>🚨 Evacuate</button>
          )}
          <span className="clk">{clock}</span>
          <div className="live-chip"><div className="live-dot"/><span className="live-lbl">LIVE</span></div>
          <span className={`ws-badge ws-${wsState}`}>{wsState==="live"?"WS ●":wsState==="conn"?"WS …":"REST ↻"}</span>
          <div style={{display:"flex",alignItems:"center",gap:6,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"4px 10px 4px 8px"}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:isAdmin()?"var(--accent)":"var(--safe)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700,flexShrink:0}}>{authUser?.fullName?.[0]?.toUpperCase()||"U"}</div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:11,fontWeight:700,color:T.text,lineHeight:1.2,maxWidth:90,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{authUser?.fullName||authUser?.email}</div>
              <div style={{fontSize:9,color:isAdmin()?"var(--accent)":"var(--safe)",fontWeight:700,letterSpacing:.5}}>{isAdmin()?"ADMIN":"USER"}</div>
            </div>
            <button onClick={handleLogout} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:14,padding:"0 0 0 4px"}} title="Sign out">⏻</button>
          </div>
          <button className="tog" onClick={()=>setDark(d=>{localStorage.setItem("cs-theme",d?"light":"dark");return !d;})}><div className="knob">{isDark?"☾":"☀"}</div></button>
        </div>
      </header>

      {evacActive&&(
        <div className="evac-banner">
          <span>🚨 EVACUATION IN PROGRESS — Guide people to exit points calmly</span>
          <button className="btn btn-sm" style={{background:"rgba(255,255,255,.2)",color:"#fff",border:"1px solid rgba(255,255,255,.3)"}} onClick={clearEvac}>✅ All Clear</button>
        </div>
      )}

      <main>
        {/* Sidebar */}
        <div className="snav">
          <div className="snav-sec">Monitor</div>
          {NAV.slice(0,3).map(n=>(
            <button key={n.id} className={`snav-btn${tab===n.id?" on":""}`} onClick={()=>setTab(n.id)}>
              <span className="snav-ico">{n.ico}</span>{n.lbl}
              {n.badge>0&&<span className="snav-badge" style={{background:n.bg?"var(--safeBg)":"var(--critBg)",color:n.bg?"var(--safe)":"var(--crit)"}}>{n.badge}</span>}
            </button>
          ))}
          <div className="snav-sec">Manage</div>
          {NAV.slice(3).map(n=>(
            <button key={n.id} className={`snav-btn${tab===n.id?" on":""}`} onClick={()=>setTab(n.id)}>
              <span className="snav-ico">{n.ico}</span>{n.lbl}
              {n.badge>0&&<span className="snav-badge" style={{background:n.bg?"var(--safeBg)":"var(--critBg)",color:n.bg?"var(--safe)":"var(--crit)"}}>{n.badge}</span>}
            </button>
          ))}
          <div className="snav-status">
            <div>WS: {wsState==="live"?"✓ connected":"connecting…"}</div>
            {sync&&<div>Sync: {fmtShort(sync)}</div>}
            <div>Zones: {zones.length} · GPS: {tracked.length}</div>
            {evacActive&&<div style={{color:"var(--evac)",fontWeight:700,marginTop:4}}>⚠ EVAC ACTIVE</div>}
          </div>
        </div>

        <div className="content">

          {/* ── LIVE MAP ── */}
          <div className={`tab-pane${tab==="map"?" on":""}`}>
            <div className="ph">
              <div><div className="ph-title">Live Map</div><div className="ph-sub">{zones.length} zones · {tracked.length} GPS users</div></div>
              <div className="ph-actions">
                <button className="btn btn-ghost btn-sm" onClick={()=>setHeat(h=>!h)} style={heat?{background:"var(--warnBg)",color:"var(--warn)"}:{}}>🌡 {heat?"Heat On":"Heatmap"}</button>
                {authed&&<button className="btn btn-danger btn-sm" onClick={()=>setModal("incident")}>⚑ Report</button>}
              </div>
            </div>
            <div className="sc-grid mb20" style={{gridTemplateColumns:"repeat(5,1fr)"}}>
              {[["Zones",zones.length,"var(--accent)"],["GPS Live",tracked.length,"var(--safe)"],["Critical",critCount,"var(--crit)"],["Incidents",openIncs.length,"var(--warn)"],["Density",overallDensity+"%",T.text]].map(([lbl,val,col])=>(
                <div key={lbl} className="sc"><div className="sc-val" style={{color:col}}>{val}</div><div className="sc-lbl">{lbl}</div></div>
              ))}
            </div>
            <div className="map-layout">
              <div style={{height:"calc(100vh - 290px)",minHeight:450}}><ZoneMap {...mapProps}/></div>
              <div className="col" style={{maxHeight:"calc(100vh - 290px)",overflowY:"auto"}}>
                <div className="card">
                  <div className="ch"><span className="ch-title">Zones</span></div>
                  {zones.map(z=>(
                    <div key={z.id} className="lr">
                      <div style={{flex:1,minWidth:0}}>
                        <div className="lr-title">{z.name}</div>
                        <DBar value={z.currentCount} max={z.capacity} T={T} height={3}/>
                        <Sparkline data={(zoneHistory[z.id]||[]).map(h=>h.count)} T={T}/>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                        <Pill status={z.status} T={T}/>
                        {riskScores[z.id]&&<span style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:riskScores[z.id].riskScore>=75?"var(--crit)":"var(--muted)",fontWeight:700}}>Risk {riskScores[z.id].riskScore}</span>}
                      </div>
                    </div>
                  ))}
                  {zones.length===0&&<div className="empty">Draw zones on the map</div>}
                </div>
                {openIncs.length>0&&(
                  <div className="card">
                    <div className="ch"><span className="ch-title">Active Incidents</span></div>
                    {openIncs.map(i=><div key={i.id} className="lr"><div><div className="lr-title">{INC_I[i.type]||"⚠️"} {i.title}</div><div className="lr-sub">{i.zoneName}</div></div><SevPill sev={i.severity} T={T}/></div>)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── DASHBOARD ── */}
          <div className={`tab-pane${tab==="dash"?" on":""}`}>
            <div className="ph"><div><div className="ph-title">Dashboard</div><div className="ph-sub">Venue overview</div></div><div className="ph-actions"><button className="btn btn-ghost btn-sm" onClick={()=>exportCSV("zones")}>📥 Export</button></div></div>
            <div className="sc-grid mb24" style={{gridTemplateColumns:"repeat(6,1fr)"}}>
              {[["◈","Zones",stats?.totalZones??zones.length,"var(--accent)",""],["👥","People",(stats?.totalCurrentCount??0).toLocaleString(),T.text,`cap ${(stats?.totalCapacity??0).toLocaleString()}`],["📡","GPS Live",tracked.length,"var(--safe)",""],["📊","Density",overallDensity+"%",T.text,""],["🚨","Critical",stats?.criticalZones??0,"var(--crit)",""],["⚑","Incidents",stats?.openIncidents??0,"var(--warn)",""]].map(([ico,lbl,val,col,sub])=>(
                <div key={lbl} className="sc"><div style={{fontSize:17,marginBottom:8,opacity:.55}}>{ico}</div><div className="sc-val" style={{color:col}}>{val}</div><div className="sc-lbl">{lbl}</div>{sub&&<div className="sc-sub">{sub}</div>}</div>
              ))}
            </div>
            <div className="g2c2 mb24">
              <div className="card">
                <div className="ch"><span className="ch-title">Zone Density</span></div>
                <div className="cp" style={{display:"flex",alignItems:"flex-end",gap:7,height:80}}>
                  {zones.map(z=>{const p=pct(z.currentCount,z.capacity);return(
                    <div key={z.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}} title={`${z.name}: ${p}%`}>
                      <div style={{flex:1,display:"flex",alignItems:"flex-end",width:"100%"}}><div style={{height:Math.max(3,Math.round(p/100*60)),width:"100%",background:dcol(p,T),borderRadius:"2px 2px 0 0",transition:"height .6s ease"}}/></div>
                      <div style={{fontSize:8,color:T.muted,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",maxWidth:"100%"}}>{z.name.split(" ")[0]}</div>
                    </div>
                  );})}
                  {zones.length===0&&<div style={{color:T.muted,fontSize:11}}>No zones</div>}
                </div>
              </div>
              <div className="card">
                <div className="ch"><span className="ch-title">Recent Incidents</span><button className="btn btn-ghost btn-sm" onClick={()=>setTab("inc")}>All →</button></div>
                {incs.slice(0,4).map(i=><div key={i.id} className="lr"><div style={{minWidth:0}}><div className="lr-title">{INC_I[i.type]||"⚠️"} {i.title}</div><div className="lr-sub">{i.zoneName} · {fmtTime(i.reportedAt)}</div></div><IncPill status={i.status} T={T}/></div>)}
                {incs.length===0&&<div className="empty">No incidents</div>}
              </div>
            </div>
            <div className="card">
              <div className="ch"><span className="ch-title">Zone Overview</span></div>
              <table className="tbl">
                <thead><tr><th>Zone</th><th>Status</th><th>Count</th><th>Density</th><th>Trend</th><th>Risk</th></tr></thead>
                <tbody>{zones.map(z=>{const p=pct(z.currentCount,z.capacity),rs=riskScores[z.id];return(
                  <tr key={z.id}>
                    <td><div className="tz-name">{z.name}</div><div className="tz-meta">📍 {z.location}</div></td>
                    <td><Pill status={z.status} T={T}/></td>
                    <td><span className="mono">{z.currentCount}/{z.capacity}</span></td>
                    <td style={{minWidth:120}}><div style={{background:T.border,borderRadius:2,height:4,overflow:"hidden"}}><div style={{height:"100%",width:`${p}%`,background:dcol(p,T),borderRadius:2,transition:"width .6s"}}/></div><div style={{fontSize:10,color:T.muted,marginTop:3,fontFamily:"'DM Mono',monospace"}}>{p}%</div></td>
                    <td><Sparkline data={(zoneHistory[z.id]||[]).map(h=>h.count)} T={T}/></td>
                    <td>{rs&&<span style={{fontSize:11,fontFamily:"'DM Mono',monospace",color:rs.riskScore>=75?"var(--crit)":rs.riskScore>=50?"var(--warn)":"var(--safe)",fontWeight:700}}>{rs.riskScore}</span>}</td>
                  </tr>
                );})}
                </tbody>
              </table>
              {zones.length===0&&<div className="empty">No zones yet</div>}
            </div>
          </div>

          {/* ── AI CROWD INTELLIGENCE ── */}
          <div className={`tab-pane${tab==="ai"?" on":""}`}>
            <div className="ph">
              <div><div className="ph-title">AI Crowd Intelligence</div>
                <div className="ph-sub">{aiData?`Last run: ${aiLastRun?.toLocaleTimeString()} · ${aiData.zones?.length||0} zones · ${aiData.aiPowered?"Claude AI":"Rule-based"}`:"Identify dangerous zones, trends, and exact actions"}</div>
              </div>
              <div className="ph-actions">
                {aiData&&["ALL","CRITICAL","HIGH","MODERATE","LOW"].map(f=>(
                  <button key={f} className="btn btn-sm" style={{background:aiFilter===f?T.text:T.surface,color:aiFilter===f?T.bg:T.sub,border:`1px solid ${T.border}`}} onClick={()=>setAiFilter(f)}>{f}</button>
                ))}
                <button className="btn btn-primary" onClick={runAiAnalysis} disabled={aiLoading}>
                  {aiLoading?<><div className="spinner" style={{width:13,height:13,borderWidth:2}}/>&nbsp;Analysing…</>:aiData?"🔄 Re-Analyse":"🤖 Analyse Now"}
                </button>
              </div>
            </div>

            {aiError&&<div style={{background:T.critBg,border:`1px solid ${T.crit}33`,borderRadius:9,padding:"11px 16px",marginBottom:16,color:T.crit,fontSize:13}}>⚠ {aiError}</div>}

            {!aiData&&!aiLoading&&(
              <div className="card">
                <div style={{padding:"50px 30px",textAlign:"center"}}>
                  <div style={{fontSize:48,marginBottom:14,opacity:.3}}>🤖</div>
                  <div style={{fontSize:17,fontWeight:800,marginBottom:8}}>AI Crowd Intelligence</div>
                  <div style={{fontSize:13,color:T.muted,maxWidth:420,margin:"0 auto 24px",lineHeight:1.7}}>Click <strong>Analyse Now</strong> to instantly identify dangerous zones, predict what happens in 15 minutes, and get exact staff action commands per zone.</div>
                  <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap",marginBottom:24}}>
                    {[["🚨","Danger Level","CRITICAL/HIGH/MODERATE per zone"],["📈","15-Min Forecast","Predicted density from real trend data"],["🎯","Action Command","Exact steps for each zone's staff"],["🧠","AI Explanation","Why each zone is or isn't risky"]].map(([ico,title,desc])=>(
                      <div key={title} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 18px",width:170,textAlign:"left"}}>
                        <div style={{fontSize:20,marginBottom:7}}>{ico}</div>
                        <div style={{fontSize:12,fontWeight:700,marginBottom:3}}>{title}</div>
                        <div style={{fontSize:11,color:T.muted,lineHeight:1.5}}>{desc}</div>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-primary" onClick={runAiAnalysis} style={{padding:"10px 24px",fontSize:13}}>🤖 Analyse Now</button>
                </div>
              </div>
            )}

            {aiLoading&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:13}}>
                {[1,2,3].map(i=><div key={i} className="card cp" style={{opacity:.4}}><div style={{height:16,background:T.border,borderRadius:4,marginBottom:10,width:"60%"}}/><div style={{height:10,background:T.border,borderRadius:4,marginBottom:6,width:"90%"}}/><div style={{height:10,background:T.border,borderRadius:4,width:"75%"}}/></div>)}
              </div>
            )}

            {aiData&&!aiLoading&&(()=>{
              const summary=aiData.summary||{};
              const zoneList=(aiData.zones||[]).filter(z=>aiFilter==="ALL"||z.dangerLevel===aiFilter);
              const sColor={"CRITICAL":"var(--crit)","WARNING":"var(--warn)","WATCH":"var(--warn)","SAFE":"var(--safe)"}[summary.overallStatus]||T.muted;
              const sBg={"CRITICAL":"var(--critBg)","WARNING":"var(--warnBg)","WATCH":"var(--warnBg)","SAFE":"var(--safeBg)"}[summary.overallStatus]||T.surface;
              return(
                <>
                  <div style={{background:sBg,border:`1px solid ${sColor}33`,borderRadius:12,padding:"16px 22px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:5}}>
                        <span style={{width:10,height:10,borderRadius:"50%",background:sColor,display:"inline-block",animation:summary.overallStatus==="CRITICAL"?"blink 1s ease-in-out infinite":"none"}}/>
                        <span style={{fontWeight:800,fontSize:15,color:sColor}}>{summary.overallStatus}</span>
                        {summary.topPriorityZone&&summary.overallStatus!=="SAFE"&&<span style={{fontSize:12,color:T.muted}}>· Top priority: <strong style={{color:T.text}}>{summary.topPriorityZone}</strong></span>}
                      </div>
                      <div style={{fontSize:13,color:T.text,fontWeight:500}}>{summary.overallMessage}</div>
                    </div>
                    <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                      {[["👥",`${summary.totalPeople||0}/${summary.totalCapacity||0}`,"People"],["🚨",summary.criticalZones||0,"Critical"],["⚠",summary.highZones||0,"High"],["📈",summary.risingZones||0,"Rising"]].map(([ico,val,lbl])=>(
                        <div key={lbl} style={{textAlign:"center"}}>
                          <div style={{fontSize:11,marginBottom:2}}>{ico}</div>
                          <div style={{fontSize:16,fontWeight:800,fontFamily:"'DM Mono',monospace",color:T.text}}>{val}</div>
                          <div style={{fontSize:9.5,color:T.muted,fontWeight:700,letterSpacing:.5}}>{lbl}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {zoneList.length===0&&<div className="card"><div className="empty">No zones match filter "{aiFilter}"</div></div>}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(330px,1fr))",gap:14}}>
                    {zoneList.map((z,i)=>{
                      const dC={"CRITICAL":"var(--crit)","HIGH":"#f0832a","MODERATE":"var(--warn)","LOW":"var(--safe)","EVACUATING":"var(--evac)"}[z.dangerLevel]||T.muted;
                      const dB={"CRITICAL":"var(--critBg)","HIGH":"#1a0d00","MODERATE":"var(--warnBg)","LOW":"var(--safeBg)","EVACUATING":"var(--evacBg)"}[z.dangerLevel]||T.surface;
                      const tA={"RISING":"↑","FALLING":"↓","STABLE":"→"}[z.trend]||"→";
                      const tC={"RISING":"var(--crit)","FALLING":"var(--safe)","STABLE":T.muted}[z.trend]||T.muted;
                      const isCrit=z.dangerLevel==="CRITICAL";
                      return(
                        <div key={z.zoneId} className="card fu" style={{borderTop:`3px solid ${dC}`,animationDelay:`${i*50}ms`,boxShadow:isCrit?`0 0 20px ${dC}22`:undefined}}>
                          <div style={{padding:"16px 18px"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:13}}>
                              <div><div style={{fontSize:14,fontWeight:800,marginBottom:2}}>{z.zoneName}</div><div style={{fontSize:11,color:T.muted}}>📍 {z.location}</div></div>
                              <AiDangerBadge level={z.dangerLevel}/>
                            </div>
                            <div style={{marginBottom:12}}>
                              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,color:T.muted,fontWeight:600}}>OCCUPANCY</span><span style={{fontSize:12,fontWeight:700,fontFamily:"'DM Mono',monospace",color:dC}}>{z.currentCount}/{z.capacity} ({z.density}%)</span></div>
                              <div style={{height:6,background:T.border,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${z.density}%`,background:dC,borderRadius:3,transition:"width .6s ease"}}/></div>
                            </div>
                            <div style={{display:"flex",gap:8,marginBottom:13}}>
                              <div style={{flex:1,background:T.surface,borderRadius:8,padding:"9px 12px",display:"flex",alignItems:"center",gap:8}}>
                                <span style={{fontSize:18,color:tC,fontWeight:800}}>{tA}</span>
                                <div><div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:.8}}>TREND</div><div style={{fontSize:11.5,fontWeight:700}}>{z.trend}</div></div>
                              </div>
                              <div style={{flex:1,background:T.surface,borderRadius:8,padding:"9px 12px",display:"flex",alignItems:"center",gap:8}}>
                                <span style={{fontSize:18}}>🔮</span>
                                <div><div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:.8}}>IN 15 MIN</div><div style={{fontSize:11.5,fontWeight:700,color:z.prediction15>=95?"var(--crit)":z.prediction15>=75?"var(--warn)":"var(--safe)"}}>{z.prediction15}%</div></div>
                              </div>
                              {z.openIncidents>0&&<div style={{flex:1,background:"var(--critBg)",borderRadius:8,padding:"9px 12px",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>⚑</span><div><div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:.8}}>INCIDENTS</div><div style={{fontSize:11.5,fontWeight:700,color:"var(--crit)"}}>{z.openIncidents} open</div></div></div>}
                            </div>
                            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 13px",marginBottom:11,fontSize:12.5,lineHeight:1.6}}>
                              <span style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:.8,marginRight:6}}>WHY</span>{z.explanation}
                            </div>
                            <div style={{background:dB,border:`1px solid ${dC}44`,borderRadius:8,padding:"10px 13px",fontSize:12,fontWeight:600,color:dC,lineHeight:1.55}}>{z.action}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{marginTop:14,fontSize:11,color:T.muted,textAlign:"center"}}>
                    {aiData.aiPowered?"🧠 Claude AI":"🔧 Rule-based"} · Set ANTHROPIC_API_KEY in application.properties for Claude explanations
                  </div>
                </>
              );
            })()}
          </div>

          {/* ── ZONES ── */}
          <div className={`tab-pane${tab==="zones"?" on":""}`}>
            <div className="ph"><div><div className="ph-title">Zones</div><div className="ph-sub">{zones.length} areas</div></div><div className="ph-actions"><button className="btn btn-ghost btn-sm" onClick={()=>exportCSV("zones")}>📥 CSV</button>{isAdmin()&&<button className="btn btn-primary" onClick={()=>setTab("map")}>+ Draw on Map</button>}</div></div>
            <div className="search-wrap"><span className="search-ico">🔍</span><input className="search-inp" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search zones…"/></div>
            <div className="card">
              <table className="tbl">
                <thead><tr><th>Zone</th><th>Status</th><th>Count</th><th>Density</th><th>Trend</th>{isAdmin()&&<th/>}</tr></thead>
                <tbody>{filteredZones.map(z=>{const p=pct(z.currentCount,z.capacity);return(
                  <tr key={z.id}>
                    <td><div className="tz-name">{z.name}</div><div className="tz-meta">📍 {z.location}</div></td>
                    <td><Pill status={z.status} T={T}/></td>
                    <td><div style={{display:"flex",alignItems:"center",gap:7}}><input className="inline-inp" type="number" defaultValue={z.currentCount} min={0} max={z.capacity} onBlur={e=>{const v=Number(e.target.value);if(v!==z.currentCount)updateCount(z.id,v);}} onKeyDown={e=>{if(e.key==="Enter"){const v=Number(e.target.value);if(v!==z.currentCount)updateCount(z.id,v);e.target.blur();}}}/><span style={{fontSize:11,color:T.muted}}>/ {z.capacity}</span></div></td>
                    <td style={{minWidth:120}}><div style={{background:T.border,borderRadius:2,height:4,overflow:"hidden"}}><div style={{height:"100%",width:`${p}%`,background:dcol(p,T),borderRadius:2,transition:"width .6s"}}/></div><div style={{fontSize:10,color:T.muted,marginTop:3,fontFamily:"'DM Mono',monospace"}}>{p}%</div></td>
                    <td><Sparkline data={(zoneHistory[z.id]||[]).map(h=>h.count)} T={T}/></td>
                    {isAdmin()&&<td><div className="fg"><button className="btn btn-ghost btn-sm" onClick={()=>{setEditZ({...z});setModal("zone-edit");}}>Edit</button><button className="btn btn-danger btn-sm" onClick={()=>deleteZone(z.id,z.name)}>Del</button></div></td>}
                  </tr>
                );})}
                </tbody>
              </table>
              {filteredZones.length===0&&<div className="empty">{zones.length===0?"No zones yet":"No matching zones"}</div>}
            </div>
          </div>

          {/* ── INCIDENTS ── */}
          <div className={`tab-pane${tab==="inc"?" on":""}`}>
            <div className="ph"><div><div className="ph-title">Incidents</div><div className="ph-sub">{openIncs.length} open</div></div><div className="ph-actions"><button className="btn btn-ghost btn-sm" onClick={()=>exportCSV("incidents")}>📥 CSV</button>{authed&&<button className="btn btn-danger" onClick={()=>setModal("incident")}>⚑ Report</button>}</div></div>
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              <div className="search-wrap" style={{flex:1,marginBottom:0}}><span className="search-ico">🔍</span><input className="search-inp" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search incidents…"/></div>
              {["ALL","OPEN","IN_PROGRESS","RESOLVED","CRITICAL","HIGH"].map(f=>(
                <button key={f} className="btn btn-sm" style={{background:incFilter===f?T.text:T.surface,color:incFilter===f?T.bg:T.sub,border:`1px solid ${T.border}`}} onClick={()=>setIncF(f)}>{f}</button>
              ))}
            </div>
            <div className="card">
              {filteredIncs.map(inc=>(
                <div key={inc.id} className="lr">
                  <div style={{flex:1,minWidth:0}}>
                    <div className="fg" style={{flexWrap:"wrap",marginBottom:4,gap:7}}><span style={{fontSize:18}}>{INC_I[inc.type]||"⚠️"}</span><span className="lr-title">{inc.title}</span><SevPill sev={inc.severity} T={T}/><IncPill status={inc.status} T={T}/></div>
                    <div className="lr-sub"><span style={{color:"var(--accent)"}}>◈ {inc.zoneName||"–"}</span></div>
                    <div className="lr-time">{fmtTime(inc.reportedAt)}</div>
                  </div>
                  {inc.status==="OPEN"&&<button className="btn btn-success btn-sm" style={{whiteSpace:"nowrap"}} onClick={()=>resolveInc(inc)}>✓ Resolve</button>}
                </div>
              ))}
              {filteredIncs.length===0&&<div className="empty">No incidents</div>}
            </div>
          </div>

          {/* ── ALERTS ── */}
          <div className={`tab-pane${tab==="alrt"?" on":""}`}>
            <div className="ph"><div><div className="ph-title">Alerts</div><div className="ph-sub">{alerts.length} unacknowledged</div></div><div className="ph-actions">{alerts.length>0&&<button className="btn btn-ghost" onClick={ackAll}>Ack All</button>}</div></div>
            <div className="card">
              {alerts.map(a=>{const isCrit=a.type?.includes("CRITICAL")||a.type==="EVACUATION_REQUIRED";const isEvacA=a.type==="EVACUATION_REQUIRED";return(
                <div key={a.id} className="lr" style={isEvacA?{background:"var(--evacBg)"}:{}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="fg" style={{marginBottom:3}}><span style={{width:7,height:7,borderRadius:"50%",background:isEvacA?"var(--evac)":isCrit?"var(--crit)":"var(--warn)",display:"inline-block",flexShrink:0}}/><span className="lr-title">{a.message}</span></div>
                    <div className="lr-time" style={{paddingLeft:15}}>{a.zoneName||"System"} · {fmtTime(a.createdAt)}</div>
                  </div>
                  <button className="btn btn-ghost btn-xs" onClick={()=>ackAlert(a.id)}>Ack</button>
                </div>
              );})}
              {alerts.length===0&&<div className="empty" style={{padding:"46px 20px"}}><div style={{fontSize:30,marginBottom:8}}>✅</div><div style={{fontWeight:700,marginBottom:3,fontSize:14}}>All clear</div></div>}
            </div>
          </div>

          {/* ── GPS TRACKING ── */}
          <div className={`tab-pane${tab==="gps"?" on":""}`}>
            <div className="ph"><div><div className="ph-title">GPS Tracking</div><div className="ph-sub">{tracked.length} live users</div></div></div>
            <div className="card mb20"><div className="cp fb" style={{flexWrap:"wrap",gap:12}}><div><div style={{fontWeight:700,fontSize:14,marginBottom:3}}>Share tracking link</div><div style={{fontSize:12.5,color:T.muted}}>Attendees open on phone → tap Start → appear on map</div></div><button className="btn btn-primary" onClick={()=>showToast(`http://YOUR_IP:3000/track.html`)}>Show Link</button></div></div>
            {tracked.length===0
              ?<div className="card"><div className="empty" style={{padding:"50px 20px"}}><div style={{fontSize:34,marginBottom:10}}>📡</div><div style={{fontWeight:700}}>No GPS users yet</div></div></div>
              :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(215px,1fr))",gap:11}}>
                {tracked.map((u,i)=>(
                  <div key={u.deviceId} className="card cp si" style={{animationDelay:`${i*40}ms`}}>
                    <div className="fb" style={{marginBottom:10}}><div><div style={{fontSize:14,fontWeight:700}}>👤 {u.displayName||"User"}</div><div style={{fontSize:12,color:u.currentZoneName?"var(--safe)":"var(--muted)",marginTop:2}}>{u.currentZoneName?"📍 "+u.currentZoneName:"Outside zones"}</div></div><div className="live-chip"><div className="live-dot"/><span className="live-lbl">Live</span></div></div>
                    <div className="gps-data"><div className="gdr"><span>LAT</span><span style={{color:T.text}}>{(u.latitude||0).toFixed(5)}°</span></div><div className="gdr"><span>LNG</span><span style={{color:T.text}}>{(u.longitude||0).toFixed(5)}°</span></div>{u.accuracy&&<div className="gdr"><span>ACC</span><span style={{color:u.accuracy<20?"var(--safe)":u.accuracy<100?"var(--warn)":"var(--crit)"}}>±{Math.round(u.accuracy)} m</span></div>}</div>
                  </div>
                ))}
              </div>
            }
          </div>

          {/* ── AUDIT LOG ── */}
          <div className={`tab-pane${tab==="log"?" on":""}`}>
            <div className="ph"><div><div className="ph-title">Audit Log</div><div className="ph-sub">{audit.length} events</div></div><div className="ph-actions"><button className="btn btn-ghost btn-sm" onClick={()=>setAudit([])}>Clear</button></div></div>
            <div className="card">
              {audit.map(e=><div key={e.id} className="audit-row"><span style={{fontSize:14,flexShrink:0}}>{e.icon}</span><div style={{flex:1}}><div style={{fontSize:12,color:T.text}}>{e.msg}</div><div style={{fontSize:10,color:T.muted,fontFamily:"'DM Mono',monospace",marginTop:2}}>{fmtTime(e.ts)}</div></div></div>)}
              {audit.length===0&&<div className="empty">No events yet</div>}
            </div>
          </div>

        </div>
      </main>

      {/* ── INCIDENT MODAL ── */}
      {modal==="incident"&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal fu"><div className="modal-bar"/>
            <div className="modal-title">Report Incident</div>
            <div className="frow"><label className="flbl">Zone</label><select className="finp" value={newInc.zoneId} onChange={e=>setNI({...newInc,zoneId:e.target.value})}><option value="">Select zone…</option>{zones.map(z=><option key={z.id} value={z.id}>{z.name}</option>)}</select></div>
            <div className="frow"><label className="flbl">Title</label><input className="finp" value={newInc.title} placeholder="Brief description" onChange={e=>setNI({...newInc,title:e.target.value})} onKeyDown={e=>e.key==="Enter"&&newInc.zoneId&&newInc.title&&createInc()}/></div>
            <div className="frow"><label className="flbl">Details (optional)</label><input className="finp" value={newInc.description} placeholder="More context" onChange={e=>setNI({...newInc,description:e.target.value})}/></div>
            <div className="g2c">
              <div className="frow"><label className="flbl">Type</label><select className="finp" value={newInc.type} onChange={e=>setNI({...newInc,type:e.target.value})}>{["OVERCROWDING","MEDICAL","FIRE","STAMPEDE","SECURITY","OTHER"].map(t=><option key={t}>{t}</option>)}</select></div>
              <div className="frow"><label className="flbl">Severity</label><select className="finp" value={newInc.severity} onChange={e=>setNI({...newInc,severity:e.target.value})}>{["LOW","MEDIUM","HIGH","CRITICAL"].map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div className="fg" style={{marginTop:3}}><button className="btn btn-danger" style={{flex:1,justifyContent:"center",opacity:newInc.zoneId&&newInc.title?1:.45}} onClick={createInc}>Report Incident</button><button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancel</button></div>
          </div>
        </div>
      )}

      {/* ── EDIT ZONE MODAL ── */}
      {modal==="zone-edit"&&editZone&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal fu"><div className="modal-bar"/>
            <div className="modal-title">Edit Zone</div>
            {[["Name","name","text"],["Location","location","text"],["Max Capacity","capacity","number"]].map(([lb,key,tp])=>(
              <div className="frow" key={key}><label className="flbl">{lb}</label><input className="finp" type={tp} value={editZone[key]||""} onChange={e=>setEditZ({...editZone,[key]:tp==="number"?Number(e.target.value):e.target.value})}/></div>
            ))}
            <div className="fg" style={{marginTop:3}}><button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={saveEditZone}>Save Changes</button><button className="btn btn-ghost" onClick={()=>{setModal(null);setEditZ(null);}}>Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
