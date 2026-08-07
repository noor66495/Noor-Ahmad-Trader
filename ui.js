/* ============ Noor Ahmad Trader — UI core: state, router, icons, toasts ============ */

/* ---------- Safe localStorage (sandbox may block it) ---------- */
const Store = {
  get(k, d){ try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};

/* ---------- App state ---------- */
const State = {
  lang: Store.get("nat_lang", "ps"),
  theme: Store.get("nat_theme", "dark"),
  page: "home",
  pair: "XAUUSD",
  tf: 3600,
  alertToggles: Object.assign({ buy:true, sell:true, wait:true, news:true, kz:true }, Store.get("nat_toggles", {})),
  history: (() => { const h = Store.get("nat_history", null); return h || seedHistory(); })(),
  feed: Store.get("nat_feed", []),
  analysis: null,
  analysisAt: 0,
  lastSigMsg: 0,
  riskAmount: Store.get("nat_risk", 100),
};

/* ---------- Icons ---------- */
const I = {
  logo: '<svg width="40" height="40" viewBox="0 0 48 48"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient></defs><rect x="2" y="2" width="44" height="44" rx="12" fill="url(#lg)"/><path d="M13 30 L21 20 L26 25 L34 14" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="34" cy="14" r="3.4" fill="#22c55e"/></svg>',
  home: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/></svg>',
  chart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg>',
  brain: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a3 3 0 0 0-3 3v.2A3 3 0 0 0 6.5 10 3 3 0 0 0 6 16a3.5 3.5 0 0 0 6 .9 3.5 3.5 0 0 0 6-.9 3 3 0 0 0-.5-6A3 3 0 0 0 15 7.2V7a3 3 0 0 0-3-3z"/><path d="M12 4v16"/></svg>',
  target: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
  clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  calc: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/></svg>',
  news: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V8"/><path d="M10 7h8M10 11h8M10 15h5"/></svg>',
  bell: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  chat: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  user: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>',
  up: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>',
  down: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>',
  spark: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z"/></svg>',
  refresh: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.3"/><path d="M21 3v6h-6"/></svg>',
  copy: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  send: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>',
  tg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.6 19 19.3c-.2 1-.8 1.2-1.6.8l-4.6-3.4-2.2 2.1c-.2.3-.5.5-.9.5l.3-4.7L18.4 6c.4-.3-.1-.5-.6-.2L7.4 12.5 2.9 11c-1-.3-1-1 .2-1.5L20.5 3.2c.8-.3 1.6.2 1.4 1.4z"/></svg>',
  moon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  sun: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  globe: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/></svg>',
  check: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  bolt: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>',
  trash: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',
  shield: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/></svg>',
};
const icon = (name, cls) => `<span class="${cls||""}" style="display:inline-flex">${I[name]||""}</span>`;

/* ---------- Toast ---------- */
function toast(title, msg, color){
  const box = document.getElementById("toasts");
  const el = document.createElement("div");
  el.className = "toast";
  el.style.borderInlineStart = "3px solid " + color;
  el.innerHTML = `<div style="flex:1">` +
    `<div class="t-title" style="color:${color}">${title}</div>` +
    (msg ? `<div class="t-msg">${msg}</div>` : "") +
    `</div><span class="t-close">${I.x}</span>`;
  el.querySelector(".t-close").onclick = () => el.remove();
  box.appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(()=>el.remove(), 300); }, 5200);
}

/* ---------- Theme & lang ---------- */
function applyTheme(){
  document.documentElement.dataset.theme = State.theme;
  Store.set("nat_theme", State.theme);
}
function applyLang(){
  setLang(State.lang);
  document.documentElement.dir = State.lang === "ps" ? "rtl" : "ltr";
  document.documentElement.lang = State.lang;
  Store.set("nat_lang", State.lang);
}
function toggleTheme(){
  State.theme = State.theme === "dark" ? "light" : "dark";
  applyTheme();
  renderPage();           // re-render to refresh colors on canvas etc.
  refreshTopbar();
}
function toggleLang(){
  State.lang = State.lang === "ps" ? "en" : "ps";
  applyLang();
  buildLayout();
  refreshTopbar();
  nav(State.page);
}

/* ---------- Router ---------- */
const PAGE_TITLES = {
  home: "homePage", dashboard: "dashTitle", ict: "ictTitle", setup: "setupTitle",
  timer: "timerTitle", calc: "calcTitle", news: "newsTitle", alerts: "alertsTitle",
  chat: "chatTitle", profile: "profileTitle"
};
function nav(page){
  State.page = page;
  renderPage();
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const target = document.getElementById("page-" + page);
  if (target) target.classList.add("active");
  document.querySelectorAll(".nav-item, .bn-item").forEach(n => {
    n.classList.toggle("active", n.dataset.page === page);
  });
  document.getElementById("page-title").innerHTML = `<span class="pt-dot"></span>${t(PAGE_TITLES[page])}`;
  try { window.scrollTo({ top: 0 }); } catch(e){}
  if (page === "dashboard") initDashboard();
  if (page === "chat") scrollChat();
}

/* ---------- Topbar ---------- */
function refreshTopbar(){
  const langBtn = document.getElementById("btn-lang");
  const themeBtn = document.getElementById("btn-theme");
  if (langBtn) langBtn.innerHTML = icon("globe") + ` <b style="font-size:11px">${State.lang==="ps" ? t("langEN") : t("langPS")}</b>`;
  if (themeBtn) themeBtn.innerHTML = State.theme === "dark" ? I.sun : I.moon;
}

/* ---------- Live clock ---------- */
function tickClocks(){
  const el = document.getElementById("top-clock");
  if (!el) return;
  const d = new Date();
  const utc = d.toUTCString().slice(17,25);
  const et = new Intl.DateTimeFormat("en-US", { timeZone:"America/New_York", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false }).format(d);
  el.innerHTML = `<span>UTC <b>${utc}</b></span><span class="hide-sm">· ET <b>${et}</b></span>`;
}

/* ---------- Sparkline ---------- */
function drawSpark(canvas, closes, color){
  if (!canvas) return;
  const g = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w*dpr; canvas.height = h*dpr; g.setTransform(dpr,0,0,dpr,0,0);
  g.clearRect(0,0,w,h);
  if (closes.length < 2) return;
  const lo = Math.min(...closes), hi = Math.max(...closes);
  const rng = (hi-lo) || 1;
  g.beginPath();
  closes.forEach((c,i)=>{
    const x = i/(closes.length-1)*w, y = h - 6 - (c-lo)/rng*(h-12);
    i ? g.lineTo(x,y) : g.moveTo(x,y);
  });
  g.strokeStyle = color; g.lineWidth = 1.8; g.stroke();
  const grad = g.createLinearGradient(0,0,0,h);
  grad.addColorStop(0, color + "44"); grad.addColorStop(1, color + "00");
  g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fillStyle = grad; g.fill();
}

/* ---------- Helpers ---------- */
function tfLabel(tf){ return TFS[tf] || tf; }
function dirBadge(dir, size){
  const cls = dir===1 ? "buy" : dir===-1 ? "sell" : "wait";
  const label = dir===1 ? t("buy") : dir===-1 ? t("sell") : t("wait");
  const dot = dir===1 ? "g" : dir===-1 ? "r" : "y";
  return `<span class="badge ${cls}" ${size?`style="font-size:${size}px;padding:${size*0.28}px ${size*0.85}px"`:""}><span class="dot ${dot}"></span>${label}</span>`;
}
function fmtTime(ts){
  const d = new Date(ts);
  return String(d.getUTCHours()).padStart(2,"0") + ":" + String(d.getUTCMinutes()).padStart(2,"0");
}
function fmtDate(ts){
  const d = new Date(ts);
  return String(d.getUTCDate()).padStart(2,"0") + "/" + String(d.getUTCMonth()+1).padStart(2,"0");
}
function countdownStr(ms){
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms/1000);
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return String(h).padStart(2,"0") + ":" + String(m).padStart(2,"0") + ":" + String(sec).padStart(2,"0");
}
function countdownParts(ms){
  const s = Math.floor(ms/1000);
  return { h: Math.floor(s/3600), m: Math.floor((s%3600)/60), s: s%60 };
}
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

/* ---------- Analysis refresh (debounced per timeframe) ---------- */
function getAnalysis(){
  const now = Date.now();
  if (!State.analysis || State.analysis.tf !== State.tf || State.analysis.sym !== State.pair || now - State.analysisAt > 15000){
    State.analysis = analyze(State.pair, State.tf);
    State.analysisAt = now;
    maybeEmitSignal();
  }
  return State.analysis;
}
let lastSigKey = "";
function maybeEmitSignal(){
  const a = State.analysis;
  const key = a.sym + "_" + a.tf + "_" + a.signal.dir + "_" + Math.floor(a.price/ (a.sym==="XAUUSD"?5:0.002));
  if (key !== lastSigKey && a.signal.dir !== 0){
    lastSigKey = key;
    const sigTxt = a.signal.dir===1 ? t("buy") : t("sell");
    const col = a.signal.dir===1 ? "#22c55e" : "#ef4444";
    toast(`<span class="dot ${a.signal.dir===1?'g':'r'}" style="margin-inline-end:4px"></span>` + t("tSignal") + " — " + sigTxt,
      `${PAIRS[a.sym].name} ${TFS[a.tf]} · ${t("confidence")} ${a.signal.conf}% · ${t("entry")} ${fmtNum(a.setup ? a.setup.entry : a.price, PAIRS[a.sym].dec)}`, col);
    addFeed(a.signal.dir===1 ? "buy" : "sell", `${PAIRS[a.sym].name} ${TFS[a.tf]} — ${sigTxt} ${t("confidence")} ${a.signal.conf}%`);
  }
}

/* ---------- Alert feed ---------- */
function addFeed(type, msg){
  State.feed.unshift({ time: Date.now(), type, msg });
  if (State.feed.length > 40) State.feed.length = 40;
  Store.set("nat_feed", State.feed);
  const feedEl = document.getElementById("feed-list");
  if (feedEl) renderFeed(feedEl);
}

/* ---------- Simulated periodic alerts ---------- */
const FEED_MSGS = {
  buy:  ["XAU/USD — BUY signal on 1H, confidence 84%", "EUR/USD — BUY on 4H, entry 1.1482, TP 1.1540"],
  sell: ["XAU/USD — SELL signal on 30M, confidence 78%", "EUR/USD — SELL on 1H, liquidity sweep above"],
  wait: ["XAU/USD — WAIT: no confluence yet, watch London open", "EUR/USD — WAIT: price in OTE, await confirmation"],
  news: ["CPI release in 3h — high volatility expected on USD", "NFP tomorrow 13:30 ET — avoid new trades before news"],
  kz:   ["London Kill Zone opens in 25 min — prepare", "NY AM Kill Zone active — watch for liquidity sweeps"]
};
let alertTimer = null;
function scheduleAlerts(){
  if (alertTimer) return;
  alertTimer = setInterval(() => {
    const keys = Object.keys(FEED_MSGS);
    const k = keys[Math.floor(Math.random()*keys.length)];
    if (!State.alertToggles[k] && k !== "wait") return;
    const msgs = FEED_MSGS[k];
    const msg = msgs[Math.floor(Math.random()*msgs.length)];
    const col = k==="buy" ? "#22c55e" : k==="sell" ? "#ef4444" : k==="news" ? "#eab308" : k==="kz" ? "#3b82f6" : "#8fa3c8";
    if (k !== "wait" || Math.random() < 0.5) toast(t("tAlert") + " — " + t("at" + k.charAt(0).toUpperCase() + k.slice(1)), msg, col);
    addFeed(k, msg);
  }, 26000);
}

/* ---------- Main loop ---------- */
let loopTimer = null;
function startLoop(){
  if (loopTimer) return;
  // warm up market series
  ensureSeries("XAUUSD", 300); ensureSeries("EURUSD", 300);
  loopTimer = setInterval(() => {
    tickMarket();
    tickClocks();
    updateTickers();
    updateDashboard();
    updateTimerPage();
    updateNewsCountdowns();
  }, 1400);
}

/* ---------- Init ---------- */
function initApp(){
  applyLang();
  applyTheme();
  buildLayout();
  refreshTopbar();
  startLoop();
  scheduleAlerts();
  nav("home");
}
