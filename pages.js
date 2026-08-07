/* ============ Noor Ahmad Trader — Pages: layout, rendering, updates ============ */

/* ---------- Layout skeleton ---------- */
const NAV_ITEMS = [
  ["home", "home", "nav_home"], ["dashboard", "chart", "nav_dashboard"],
  ["ict", "brain", "nav_ict"], ["setup", "target", "nav_setup"],
  ["timer", "clock", "nav_timer"], ["calc", "calc", "nav_calc"],
  ["news", "news", "nav_news"], ["alerts", "bell", "nav_alerts"],
  ["chat", "chat", "nav_chat"], ["profile", "user", "nav_profile"]
];
function buildLayout(){
  const app = document.getElementById("app");
  const pages = ["home","dashboard","ict","setup","timer","calc","news","alerts","chat","profile"];
  app.innerHTML = `
  <aside id="sidebar">
    <div class="logo">
      ${I.logo}
      <div><div class="l-name">${t("appName")}</div><div class="l-sub">${t("tagline")}</div></div>
    </div>
    ${NAV_ITEMS.map(([p,ic,key]) => `<div class="nav-item" data-page="${p}">${icon(ic)}${t(key)}</div>`).join("")}
    <div class="side-foot">
      <div><b>${t("appName")}</b> — ${t("tagline")}</div>
      <div>${t("version")} 1.0 · ${I18N[getLang()].pro}</div>
      <span class="ver-badge"><span class="dot g pulse"></span>${t("live")}</span>
    </div>
  </aside>
  <main>
    <div id="topbar">
      <div id="page-title"></div>
      <div class="top-spacer"></div>
      <div class="clock-chip" id="top-clock"></div>
      <button class="icon-btn" id="btn-lang" title="Language"></button>
      <button class="icon-btn" id="btn-theme" title="Theme"></button>
    </div>
    <div id="pages">
      ${pages.map(p => `<section class="page" id="page-${p}"></section>`).join("")}
    </div>
  </main>
  <nav id="bottomnav">
    ${NAV_ITEMS.map(([p,ic,key]) => `<div class="bn-item" data-page="${p}">${icon(ic)}<span>${t(key)}</span></div>`).join("")}
  </nav>
  <div id="toasts"></div>`;
  document.querySelectorAll(".nav-item, .bn-item").forEach(el => {
    el.addEventListener("click", () => nav(el.dataset.page));
  });
  document.getElementById("btn-lang").addEventListener("click", toggleLang);
  document.getElementById("btn-theme").addEventListener("click", toggleTheme);
}

/* ---------- Page dispatcher ---------- */
function renderPage(){
  if (State.page === "home") renderHome();
  else if (State.page === "dashboard") renderDashboard();
  else if (State.page === "ict") renderICT();
  else if (State.page === "setup") renderSetup();
  else if (State.page === "timer") renderTimer();
  else if (State.page === "calc") renderCalc();
  else if (State.page === "news") renderNews();
  else if (State.page === "alerts") renderAlerts();
  else if (State.page === "chat") renderChat();
  else if (State.page === "profile") renderProfile();
  document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === "page-" + State.page));
}

/* ============================================================
   HOME
   ============================================================ */
function renderHome(){
  const a = getAnalysis();
  const xau = Market.XAUUSD.last || { price: PAIRS.XAUUSD.base };
  const eur = Market.EURUSD.last || { price: PAIRS.EURUSD.base };
  const sec = document.getElementById("page-home");
  const sig = a.signal;
  const P = PAIRS[State.pair];
  const dec = P.dec;
  const sigCls = sig.dir===1 ? "buy" : sig.dir===-1 ? "sell" : "wait";
  const stats = [
    { k: t("statsWinRate"), v: computeWinRate(State.history) + "%", c: "g" },
    { k: t("statsToday"), v: State.history.filter(h => Date.now() - h.time < 86400000).length, c: "b" },
    { k: t("statsSetup"), v: sig.dir !== 0 ? t("active") : t("wait"), c: sig.dir===1 ? "g" : sig.dir===-1 ? "r" : "y" },
    { k: t("statsNews"), v: fmtDate(newsEvents()[0].time) + " · " + fmtTime(newsEvents()[0].time), c: "y" }
  ];
  const reasons = a.reasons || [];
  const recent = State.history.slice(0, 5);
  sec.innerHTML = `
  <div class="hero">
    <div style="position:relative;z-index:1">${I.logo.replace('width="40" height="40"','width="64" height="64"')}</div>
    <div class="hero-info">
      <div style="font-size:11.5px;font-weight:800;color:var(--blue2);letter-spacing:1.2px;text-transform:uppercase">${t("welcome")} 👋</div>
      <h1>${t("appName")}</h1>
      <div class="hero-sub">${t("heroText")}</div>
      <div class="hero-actions">
        <button class="btn btn-blue" onclick="nav('dashboard')">${icon("chart")}${t("heroCta1")}</button>
        <button class="btn" onclick="nav('chat')">${icon("chat")}${t("heroCta2")}</button>
      </div>
    </div>
  </div>

  <div class="grid g2" style="margin-top:16px">
    <div class="card ticker">
      <div class="ticker-head">
        <span class="ico yellow">${icon("bolt")}</span>
        <span class="pair-name">XAU/USD</span>
        <span class="live-tag"><span class="dot g pulse"></span>${t("live")}</span>
        <span style="flex:1"></span>
        <span class="badge muted">${t("gold")} · USD</span>
      </div>
      <div class="ticker-price" id="t-xau-price">${fmtNum(xau.price, 2)}</div>
      <div class="ticker-change" id="t-xau-chg"></div>
      <canvas class="spark" id="spark-xau"></canvas>
      <div class="ticker-hl" id="t-xau-hl"></div>
    </div>
    <div class="card ticker">
      <div class="ticker-head">
        <span class="ico blue">${icon("bolt")}</span>
        <span class="pair-name">EUR/USD</span>
        <span class="live-tag"><span class="dot g pulse"></span>${t("live")}</span>
        <span style="flex:1"></span>
        <span class="badge muted">EUR · USD</span>
      </div>
      <div class="ticker-price" id="t-eur-price">${fmtNum(eur.price, 4)}</div>
      <div class="ticker-change" id="t-eur-chg"></div>
      <canvas class="spark" id="spark-eur"></canvas>
      <div class="ticker-hl" id="t-eur-hl"></div>
    </div>
  </div>

  <div class="section-title"><h2>🤖 ${t("aiAnalysis")}</h2><div class="line"></div><span class="badge blue">${t("updated")} <span id="ai-upd">${fmtTime(a.time)}</span></span></div>
  <div class="card">
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div class="sig-badge ${sigCls}" id="home-sig">${dirBadge(sig.dir, 15).replace("badge","badge")}</div>
      <div style="flex:1;min-width:220px">
        <div class="conf-wrap" style="max-width:none">
          <div class="conf-label"><span>${t("confidence")}</span><span id="home-conf">${sig.conf}%</span></div>
          <div class="conf-bar"><div style="width:${sig.conf}%;background:${sig.dir===1?"var(--green)":sig.dir===-1?"var(--red)":"var(--yellow)"}"></div></div>
        </div>
      </div>
    </div>
    <div class="stat-grid" id="home-setup">
      ${a.setup ? `
        <div class="stat"><div class="k">${t("entry")}</div><div class="v b">${fmtNum(a.setup.entry, dec)}</div></div>
        <div class="stat"><div class="k">${t("stopLoss")}</div><div class="v r">${fmtNum(a.setup.sl, dec)}</div></div>
        <div class="stat"><div class="k">${t("tp1")}</div><div class="v g">${fmtNum(a.setup.tp1, dec)}</div></div>
        <div class="stat"><div class="k">${t("tp2")}</div><div class="v g">${fmtNum(a.setup.tp2, dec)}</div></div>
        <div class="stat"><div class="k">${t("tp3")}</div><div class="v g">${fmtNum(a.setup.tp3, dec)}</div></div>
        <div class="stat"><div class="k">${t("timeframe")}</div><div class="v">${TFS[State.tf]}</div></div>
      ` : `<div class="stat" style="grid-column:1/-1"><div class="k">${t("signal")}</div><div class="v y">${t("noSetup")}</div></div>`}
    </div>
    <ul class="reason-list" id="home-reasons">
      ${reasons.map(r => `<li class="${r.dir===1?"buy-li":r.dir===-1?"sell-li":"wait-li"}"><span class="ri">${r.dir===1?"🟢":r.dir===-1?"🔴":"🟡"}</span><span>${esc(r.text)}</span></li>`).join("")}
    </ul>
    <div style="display:flex;gap:9px;margin-top:15px;flex-wrap:wrap">
      <button class="btn btn-blue" onclick="nav('ict')">${icon("brain")}${t("viewFull")}</button>
      <button class="btn" onclick="nav('setup')">${icon("target")}${t("viewSetup")}</button>
    </div>
  </div>

  <div class="stat-row">
    ${stats.map(s => `<div class="card" style="padding:14px 16px"><div class="k" style="font-size:11px;color:var(--muted);font-weight:700">${s.k}</div><div class="v ${s.c}" style="font-size:21px;font-weight:900;margin-top:3px;font-variant-numeric:tabular-nums">${s.v}</div></div>`).join("")}
  </div>

  <div class="section-title"><h2>📊 ${t("recentSignals")}</h2><div class="line"></div><button class="btn btn-sm" onclick="nav('setup')">${t("history")}</button></div>
  ${historyTable(recent, true)}
  <div class="note">ℹ️ ${t("demo")}</div>`;
}
function updateTickers(){
  if (State.page !== "home") return;
  for (const sym of ["XAUUSD","EURUSD"]){
    const M = Market[sym];
    if (!M || !M.last) continue;
    const P = PAIRS[sym];
    const s = M.series[300];
    const closes = s.slice(-56).map(c=>c.c);
    const prev = s[s.length-2] ? s[s.length-2].c : M.last.price;
    const chg = M.last.price - prev;
    const pct = chg / prev * 100;
    const dec = P.dec;
    const id = sym === "XAUUSD" ? "xau" : "eur";
    const elPrice = document.getElementById("t-" + id + "-price");
    const elChg = document.getElementById("t-" + id + "-chg");
    const elHl = document.getElementById("t-" + id + "-hl");
    if (elPrice) elPrice.textContent = fmtNum(M.last.price, dec);
    if (elChg){
      elChg.className = "ticker-change " + (chg >= 0 ? "up" : "down");
      elChg.innerHTML = `${chg>=0?icon("up"):icon("down")} ${fmtNum(Math.abs(chg), dec)} (${fmtPct(pct)})`;
    }
    if (elHl) elHl.innerHTML = `<span>${t("high")} <b style="color:var(--text)">${fmtNum(M.last.dayHigh, dec)}</b></span><span>${t("low")} <b style="color:var(--text)">${fmtNum(M.last.dayLow, dec)}</b></span>`;
    drawSpark(document.getElementById("spark-" + id), closes, chg >= 0 ? "#22c55e" : "#ef4444");
  }
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function renderDashboard(){
  const sec = document.getElementById("page-dashboard");
  sec.innerHTML = `
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">
    ${Object.keys(PAIRS).map(s => `<button class="tf-chip ${s===State.pair?"active":""}" data-pair="${s}" style="font-size:12.5px;padding:8px 16px">${PAIRS[s].name}</button>`).join("")}
    <div class="top-spacer"></div>
    <button class="btn btn-sm btn-blue" onclick="getAnalysis(true);renderDashboard()">${icon("refresh")}${t("refreshAI")}</button>
  </div>
  <div class="card">
    <div class="card-h">
      <h3>${icon("chart")} ${t("dashTitle")} <span class="badge blue">${PAIRS[State.pair].name}</span> <span class="badge muted">${TFS[State.tf]}</span></h3>
      <div class="spacer"></div>
      <span class="live-tag"><span class="dot g pulse"></span>${t("live")}</span>
    </div>
    <div class="tf-chips" style="margin-bottom:13px">
      ${Object.keys(TFS).map(tf => `<button class="tf-chip ${tf==String(State.tf)?"active":""}" data-tf="${tf}">${TFS[tf]}</button>`).join("")}
    </div>
    <div class="chart-wrap"><canvas id="chart"></canvas></div>
    <div class="chart-legend">
      <span><span class="legend-sq" style="background:rgba(34,197,94,.35);border:1px solid #22c55e"></span>${t("lgFvg")}</span>
      <span><span class="legend-sq" style="background:rgba(59,130,246,.3);border:1px solid #3b82f6"></span>${t("lgOb")}</span>
      <span><span class="legend-sq" style="background:rgba(234,179,8,.25);border:1px dashed #eab308"></span>${t("lgLiq")}</span>
      <span><span class="legend-sq" style="background:rgba(234,179,8,.3);border:1px solid #eab308"></span>${t("lgOte")}</span>
      <span><span class="legend-sq" style="background:rgba(249,115,22,.18);border:1px solid #f97316"></span>${t("lgPd")}</span>
      <span><span class="legend-sq" style="background:rgba(37,99,235,.25);border:1px solid #3b82f6"></span>${t("lgSetup")}</span>
    </div>
  </div>

  <div class="section-title"><h2>🧠 ${t("tfAnalysis")} — ${TFS[State.tf]}</h2><div class="line"></div></div>
  <div class="grid g3" id="dash-minis"></div>
  <div class="grid g2" style="margin-top:16px">
    <div class="card" id="dash-signal"></div>
    <div class="card">
      <div class="card-h"><h3>${icon("spark")} ${t("marketStructure")}</h3></div>
      <div id="dash-structure"></div>
    </div>
  </div>`;
  // events
  sec.querySelectorAll("[data-pair]").forEach(b => b.onclick = () => { State.pair = b.dataset.pair; getAnalysis(true); renderDashboard(); });
  sec.querySelectorAll("[data-tf]").forEach(b => b.onclick = () => { State.tf = parseInt(b.dataset.tf); getAnalysis(true); renderDashboard(); });
  initDashboard();
  updateDashboard();
}
function dashboardZones(a){
  const zones = [], lines = [];
  const P = PAIRS[a.sym];
  // premium & discount halves
  zones.push({ lo: a.range.mid, hi: a.range.hi, color: "rgba(249,115,22,.10)", border: "rgba(249,115,22,.45)", label: t("inPremium").split(" ")[0].toUpperCase() });
  zones.push({ lo: a.range.lo, hi: a.range.mid, color: "rgba(34,197,94,.08)", border: "rgba(34,197,94,.4)", label: "DISCOUNT" });
  // OTE
  if (a.ote.hi > 0) zones.push({ lo: a.ote.lo, hi: a.ote.hi, color: "rgba(234,179,8,.14)", border: "rgba(234,179,8,.55)", label: "OTE", dash: [5,4] });
  // FVGs
  for (const f of a.fvg.fvgs) zones.push({ lo: f.lo, hi: f.hi, color: "rgba(34,197,94,.13)", border: "rgba(34,197,94,.5)", label: "FVG ▲" });
  for (const f of a.fvg.invs) zones.push({ lo: f.lo, hi: f.hi, color: "rgba(239,68,68,.12)", border: "rgba(239,68,68,.5)", label: "FVG ▼" });
  // OBs
  for (const o of a.obs){
    const col = o.dir === 1 ? "rgba(59,130,246,.14)" : "rgba(249,115,22,.13)";
    const bd = o.dir === 1 ? "rgba(59,130,246,.55)" : "rgba(249,115,22,.55)";
    const lbl = o.kind === "breaker" ? "BREAKER" : "OB";
    zones.push({ lo: o.lo, hi: o.hi, color: col, border: bd, label: lbl, dash: o.kind==="breaker"?[4,4]:[] });
  }
  // liquidity
  if (a.liq.buyAbove) lines.push({ p: a.liq.buyAbove.price, color: "#eab308", dash: [6,4], label: "▲ " + t("liqBuy"), width: 1.3 });
  if (a.liq.sellBelow) lines.push({ p: a.liq.sellBelow.price, color: "#eab308", dash: [6,4], label: "▼ " + t("liqSell"), width: 1.3 });
  // setup levels
  if (a.setup){
    lines.push({ p: a.setup.entry, color: "#3b82f6", label: "ENTRY", width: 1.6 });
    lines.push({ p: a.setup.sl, color: "#ef4444", label: "SL", width: 1.5 });
    lines.push({ p: a.setup.tp1, color: "#22c55e", dash: [5,3], label: "TP1", width: 1.3 });
    lines.push({ p: a.setup.tp2, color: "#22c55e", dash: [5,3], label: "TP2", width: 1.2 });
    lines.push({ p: a.setup.tp3, color: "#22c55e", dash: [5,3], label: "TP3", width: 1.1 });
  }
  return { zones, lines };
}
function updateDashboard(){
  if (State.page !== "dashboard") return;
  const a = getAnalysis();
  const P = PAIRS[a.sym];
  const candles = ensureSeries(a.sym, a.tf);
  const { zones, lines } = dashboardZones(a);
  CHART.setData(candles, zones, lines);
  // minis
  const trendV = a.structure.trend===1 ? t("bullish") : a.structure.trend===-1 ? t("bearish") : t("neutral");
  const trendC = a.structure.trend===1 ? "g" : a.structure.trend===-1 ? "r" : "y";
  const bosT = a.structure.bos.dir===1 ? t("bullish") : a.structure.bos.dir===-1 ? t("bearish") : t("neutral");
  const bosC = a.structure.bos.dir===1 ? "g" : a.structure.bos.dir===-1 ? "r" : "y";
  const choT = a.structure.choch.dir===1 ? t("bullish") : a.structure.choch.dir===-1 ? t("bearish") : "—";
  const choC = a.structure.choch.dir===1 ? "g" : a.structure.choch.dir===-1 ? "r" : "y";
  const fvgT = a.fvg.fvgs.find(f=>f.status!=="invalid") ? `${a.fvg.fvgs[0] ? (a.fvg.fvgs[0].dir===1 ? t("bullish") : t("bearish")) : "—"} ${t("open")}` : t("invalid");
  const fvgC = a.fvg.fvgs[0] ? (a.fvg.fvgs[0].dir===1 ? "g" : "r") : "y";
  const obT = a.obs.length ? (a.obs[a.obs.length-1].dir===1 ? t("bullish") : t("bearish")) + (a.obs.some(o=>o.kind==="breaker") ? " · " + t("breaker") : "") : "—";
  const obC = a.obs.length ? (a.obs[a.obs.length-1].dir===1 ? "g" : "r") : "y";
  const liqT = a.liq.sweep ? `${t("sweepOf")} ${a.liq.sweep.side==="buy"?t("liqBuy"):t("liqSell")}` : (a.liq.buyAbove || a.liq.sellBelow ? t("active") : "—");
  const liqC = a.liq.sweep ? "y" : "b";
  const minis = [
    [t("aTrend"), trendV, trendC, "📈"],
    [t("aBOS"), bosT, bosC, "🔨"],
    [t("aCHoCH"), choT, choC, "🔄"],
    [t("aFVG"), fvgT, fvgC, "🧩"],
    [t("aOB"), obT, obC, "🧱"],
    [t("aLiq"), liqT, liqC, "🎯"]
  ];
  const minisEl = document.getElementById("dash-minis");
  if (minisEl) minisEl.innerHTML = minis.map(m => `
    <div class="mini-card">
      <div class="k"><span>${m[3]}</span>${m[0]}</div>
      <div class="v ${m[2]}"><span class="dot ${m[2]==="g"?"g":m[2]==="r"?"r":m[2]==="y"?"y":"b"}"></span>${m[1]}</div>
    </div>`).join("");
  // signal card
  const sEl = document.getElementById("dash-signal");
  if (sEl){
    const sig = a.signal;
    const cls = sig.dir===1 ? "buy" : sig.dir===-1 ? "sell" : "wait";
    sEl.innerHTML = `
      <div class="card-h"><h3>${icon("spark")} ${t("aSignal")} — ${TFS[a.tf]}</h3><div class="spacer"></div><span class="badge blue">${t("updated")} ${fmtTime(a.time)}</span></div>
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <div class="sig-badge ${cls}" style="font-size:17px;padding:9px 20px">${dirBadge(sig.dir, 11).replace("badge","badge")}</div>
        <div class="conf-wrap" style="flex:1;min-width:180px">
          <div class="conf-label"><span>${t("confidence")}</span><span>${sig.conf}%</span></div>
          <div class="conf-bar"><div style="width:${sig.conf}%;background:${sig.dir===1?"var(--green)":sig.dir===-1?"var(--red)":"var(--yellow)"}"></div></div>
        </div>
      </div>
      ${a.setup ? `<div class="stat-grid">
        <div class="stat"><div class="k">${t("entry")}</div><div class="v b">${fmtNum(a.setup.entry,P.dec)}</div></div>
        <div class="stat"><div class="k">${t("stopLoss")}</div><div class="v r">${fmtNum(a.setup.sl,P.dec)}</div></div>
        <div class="stat"><div class="k">TP1</div><div class="v g">${fmtNum(a.setup.tp1,P.dec)}</div></div>
        <div class="stat"><div class="k">TP2</div><div class="v g">${fmtNum(a.setup.tp2,P.dec)}</div></div>
        <div class="stat"><div class="k">TP3</div><div class="v g">${fmtNum(a.setup.tp3,P.dec)}</div></div>
        <div class="stat"><div class="k">${t("rr")}</div><div class="v">1 : ${((a.setup.tp1-a.setup.entry)/(a.setup.entry-a.setup.sl)).toFixed(1)}</div></div>
      </div>` : `<div class="note" style="margin-top:12px">🟡 ${t("noSetup")}</div>`}`;
  }
  // structure card
  const stEl = document.getElementById("dash-structure");
  if (stEl){
    const seq = a.structure.seq.length ? a.structure.seq.join(" → ") : "—";
    stEl.innerHTML = `
      <div class="kv"><span class="kk">${t("msTrend")}</span><span class="vv ${trendC}" style="color:var(--${trendC==="g"?"green":trendC==="r"?"red":"yellow"})">${trendV}</span></div>
      <div class="kv"><span class="kk">${t("msSeq")}</span><span class="vv">${seq}</span></div>
      <div class="kv"><span class="kk">${t("biasMonthly")}</span><span class="vv">${a.biases.monthly===1?"📈 "+t("bullish"):a.biases.monthly===-1?"📉 "+t("bearish"):"➖ "+t("neutral")}</span></div>
      <div class="kv"><span class="kk">${t("biasWeekly")}</span><span class="vv">${a.biases.weekly===1?"📈 "+t("bullish"):a.biases.weekly===-1?"📉 "+t("bearish"):"➖ "+t("neutral")}</span></div>
      <div class="kv"><span class="kk">${t("biasDaily")}</span><span class="vv">${a.biases.daily===1?"📈 "+t("bullish"):a.biases.daily===-1?"📉 "+t("bearish"):"➖ "+t("neutral")}</span></div>`;
  }
}
function initDashboard(){
  const cv = document.getElementById("chart");
  if (cv) CHART.init(cv);
}

/* ============================================================
   ICT ANALYSIS
   ============================================================ */
function renderICT(){
  const a = getAnalysis();
  const P = PAIRS[a.sym];
  const sec = document.getElementById("page-ict");
  const st = a.structure, liq = a.liq, rg = a.range, ote = a.ote;
  const trendV = st.trend===1 ? t("bullish") : st.trend===-1 ? t("bearish") : t("neutral");
  const trendDot = st.trend===1 ? "g" : st.trend===-1 ? "r" : "y";
  const seq = st.allS.slice(-6).map(s=>s==="H"?"🔼 H":"🔽 L").join(" ");
  const eqH = liq.eqHighs.map(g=>fmtNum(g.price,P.dec)+(g.count>2?` (${g.count})`:"")).join(", ") || "—";
  const eqL = liq.eqLows.map(g=>fmtNum(g.price,P.dec)+(g.count>2?` (${g.count})`:"")).join(", ") || "—";
  const pdPos = Math.round(rg.pos*100);
  const pdColor = rg.zone==="discount" ? "#22c55e" : "#ef4444";
  const sess = sessions();
  const sessCard = s => {
    const state = s.active ? "active" : "upcoming";
    const mins = s.active ? s.minsToEnd : s.minsToStart;
    const cls = s.active ? "g" : "b";
    return `<div class="card session-card">
      <div class="s-name">${s.id==="asian"?"🌏":s.id==="london"?"🏰":"🗽"} ${s.label}</div>
      <div class="s-time">${s.id==="asian"?t("asianTime"):s.id==="london"?t("londonTime"):t("nyTime")}</div>
      <div class="s-status"><span class="badge ${s.active?"green":"blue"}">${s.active?"● "+t("activeNow"):t("upcoming")}</span></div>
      <div class="countdown" data-kz="${s.id}">${countdownStr(mins*60000)}</div>
      <small>${s.active ? t("endsIn") : t("startsIn")}</small>
    </div>`;
  };
  sec.innerHTML = `
  <div class="grid g3" style="margin-bottom:16px">
    <div class="card">
      <div class="card-h"><h3>📈 ${t("marketStructure")}</h3></div>
      <div class="kv"><span class="kk">${t("msTrend")}</span><span class="vv" style="color:var(--${trendDot==="g"?"green":trendDot==="r"?"red":"yellow"})"><span class="dot ${trendDot}"></span> ${trendV}</span></div>
      <div class="kv"><span class="kk">${t("msSeq")}</span><span class="vv">${st.seq.join(" → ") || "—"}</span></div>
      <div class="kv"><span class="kk">${t("aBOS")}</span><span class="vv ${st.bos.dir===1?"g":st.bos.dir===-1?"r":""}">${st.bos.dir===1?"✅ "+t("bullish"):st.bos.dir===-1?"✅ "+t("bearish"):"—"}</span></div>
      <div class="kv"><span class="kk">${t("aCHoCH")}</span><span class="vv ${st.choch.dir===1?"g":st.choch.dir===-1?"r":""}">${st.choch.dir===1?"🔄 "+t("bullish"):st.choch.dir===-1?"🔄 "+t("bearish"):"—"}</span></div>
    </div>
    <div class="card">
      <div class="card-h"><h3>🎯 ${t("aLiq")}</h3></div>
      <div class="kv"><span class="kk">${t("eqHighs")}</span><span class="vv" style="color:var(--yellow)">${eqH}</span></div>
      <div class="kv"><span class="kk">${t("eqLows")}</span><span class="vv" style="color:var(--yellow)">${eqL}</span></div>
      <div class="kv"><span class="kk">${t("liqBuy")}</span><span class="vv b">${liq.buyAbove ? fmtNum(liq.buyAbove.price,P.dec) : "—"}</span></div>
      <div class="kv"><span class="kk">${t("liqSell")}</span><span class="vv b">${liq.sellBelow ? fmtNum(liq.sellBelow.price,P.dec) : "—"}</span></div>
    </div>
    <div class="card">
      <div class="card-h"><h3>🪤 ${t("sweep")}</h3></div>
      ${liq.sweep ? `
        <div class="badge ${liq.sweep.side==="buy"?"sell":"buy"}" style="margin-bottom:10px">${liq.sweep.side==="buy" ? "▼ "+t("sweepOf")+" "+t("liqBuy") : "▲ "+t("sweepOf")+" "+t("liqSell")}</div>
        <div class="kv"><span class="kk">${t("price")}</span><span class="vv">${fmtNum(liq.sweep.price,P.dec)}</span></div>
        <div class="kv"><span class="kk">${t("time")}</span><span class="vv">${fmtDate(liq.sweep.time)} ${fmtTime(liq.sweep.time)}</span></div>` 
      : `<div class="note" style="margin-top:0">— ${t("noSetup")}</div>`}
    </div>
  </div>

  <div class="grid g2">
    <div class="card">
      <div class="card-h"><h3>🧩 ${t("fvgList")}</h3></div>
      ${a.fvg.fvgs.length ? a.fvg.fvgs.map(f => `
        <div class="kv"><span class="kk"><span class="dot ${f.dir===1?"g":"r"}"></span> ${f.dir===1?"▲":"▼"} ${fmtNum(f.lo,P.dec)} — ${fmtNum(f.hi,P.dec)}</span>
        <span class="vv ${f.status==="open"?"g":f.status==="partial"?"y":"r"}">${f.status==="open"?t("open"):f.status==="partial"?t("partial"):t("mitigated")}</span></div>`).join("") : `<div class="note" style="margin-top:0">—</div>`}
      <div class="card-h" style="margin-top:16px"><h3>🔁 ${t("invFvg")}</h3></div>
      ${a.fvg.invs.length ? a.fvg.invs.map(f => `
        <div class="kv"><span class="kk"><span class="dot ${f.dir===1?"g":"r"}"></span> ${f.dir===1?"▲":"▼"} ${fmtNum(f.lo,P.dec)} — ${fmtNum(f.hi,P.dec)}</span>
        <span class="vv ${f.status==="open"?"g":f.status==="partial"?"y":"r"}">${f.status==="open"?t("open"):f.status==="partial"?t("partial"):t("mitigated")}</span></div>`).join("") : `<div class="note" style="margin-top:0">—</div>`}
    </div>
    <div class="card">
      <div class="card-h"><h3>🧱 ${t("obList")}</h3></div>
      ${a.obs.length ? a.obs.map(o => `
        <div class="kv"><span class="kk">${o.kind==="breaker"?"⚡":o.kind==="mitigation"?"🩹":"🧱"} ${o.kind==="breaker"?t("breaker"):o.kind==="mitigation"?t("mitigation"):t("aOB")} · ${o.dir===1?"▲ "+t("bullish"):"▼ "+t("bearish")}<br><span style="font-weight:600;font-size:11.5px">${fmtNum(o.lo,P.dec)} — ${fmtNum(o.hi,P.dec)}</span></span>
        <span class="vv ${o.kind==="breaker"?"y":""}">${o.kind==="breaker"?t("swept"):o.kind==="mitigation"?t("partial"):t("open")}</span></div>`).join("") : `<div class="note" style="margin-top:0">—</div>`}
      <div class="card-h" style="margin-top:16px"><h3>⚖️ ${t("premiumDiscount")}</h3></div>
      <div class="pd-labels"><span class="disc">${t("inDiscount")} — ${fmtNum(rg.lo,P.dec)}</span><span class="prem">${fmtNum(rg.hi,P.dec)} — ${t("inPremium")}</span></div>
      <div class="pd-bar"><div class="pd-marker" style="left:${pdPos}%"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:800;margin-top:5px">
        <span>50% · ${fmtNum(rg.mid,P.dec)}</span>
        <span style="color:${pdColor}">${rg.zone==="discount"?t("inDiscount"):t("inPremium")} (${pdPos}%)</span>
      </div>
      <div class="card-h" style="margin-top:16px"><h3>📐 ${t("oteZone")}</h3></div>
      <div class="kv"><span class="kk">${t("zone")}</span><span class="vv">${ote.hi ? fmtNum(ote.lo,P.dec)+" — "+fmtNum(ote.hi,P.dec) : "—"}</span></div>
      <div class="kv"><span class="kk">${t("priceInOte")}</span><span class="vv ${ote.inZone?"g":"r"}">${ote.inZone?"✅ "+t("active"):"❌"}</span></div>
    </div>
  </div>

  <div class="section-title"><h2>🧭 ${t("biasMonthly")} / ${t("biasWeekly")} / ${t("biasDaily")}</h2><div class="line"></div></div>
  <div class="grid g3">
    ${[["biasMonthly",a.biases.monthly],["biasWeekly",a.biases.weekly],["biasDaily",a.biases.daily]].map(([k,v]) => `
      <div class="card" style="text-align:center;padding:14px">
        <div class="k" style="font-size:11px;color:var(--muted);font-weight:800;letter-spacing:.5px">${t(k)}</div>
        <div style="font-size:24px;margin-top:5px">${v===1?"📈":v===-1?"📉":"➖"}</div>
        <div class="badge ${v===1?"buy":v===-1?"sell":"muted"}" style="margin-top:7px">${v===1?t("bullish"):v===-1?t("bearish"):t("neutral")}</div>
      </div>`).join("")}
  </div>

  <div class="section-title"><h2>⏰ ${t("sessions")}</h2><div class="line"></div><span class="badge blue" id="ict-et">${etParts().label} ET</span></div>
  <div class="grid g3" id="ict-sessions">${sess.map(sessCard).join("")}</div>
  <div class="note" style="margin-top:14px">ℹ️ ${t("demo")}</div>`;
  State._ictSessions = sess;
}
function updateICT(){
  if (State.page !== "ict") return;
  const sEl = document.getElementById("ict-et");
  if (sEl) sEl.textContent = etParts().label + " ET";
  const sess = sessions();
  document.querySelectorAll("[data-kz]").forEach(el => {
    const s = sess.find(x => x.id === el.dataset.kz);
    if (!s) return;
    const mins = s.active ? s.minsToEnd : s.minsToStart;
    el.textContent = countdownStr(mins * 60000);
  });
}

/* ============================================================
   TRADE SETUP
   ============================================================ */
function renderSetup(){
  const a = getAnalysis();
  const P = PAIRS[a.sym];
  const sec = document.getElementById("page-setup");
  const sig = a.signal;
  const cls = sig.dir===1 ? "buy" : sig.dir===-1 ? "sell" : "wait";
  const rr1 = a.setup ? (a.setup.tp1-a.setup.entry)/(a.setup.entry-a.setup.sl) : 0;
  const rr2 = a.setup ? (a.setup.tp2-a.setup.entry)/(a.setup.entry-a.setup.sl) : 0;
  const rr3 = a.setup ? (a.setup.tp3-a.setup.entry)/(a.setup.entry-a.setup.sl) : 0;
  sec.innerHTML = `
  <div class="grid g3" style="margin-bottom:16px">
    <div class="card" style="grid-column:1/-1">
      <div class="card-h">
        <h3>${icon("target")} ${t("setupTitle")} — ${t("aiPlan")}</h3>
        <div class="spacer"></div>
        <span class="badge blue">${PAIRS[State.pair].name} · ${TFS[State.tf]}</span>
        <span class="badge ${cls}"><span class="dot ${sig.dir===1?"g":sig.dir===-1?"r":"y"}"></span>${dirBadge(sig.dir, 10).replace("badge","badge")}</span>
      </div>
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:6px">
        <div class="sig-badge ${cls}" style="font-size:18px;padding:10px 22px">${dirBadge(sig.dir, 12).replace("badge","badge")}</div>
        <div class="conf-wrap" style="flex:1;min-width:200px">
          <div class="conf-label"><span>${t("confidence")}</span><span>${sig.conf}%</span></div>
          <div class="conf-bar"><div style="width:${sig.conf}%;background:${sig.dir===1?"var(--green)":sig.dir===-1?"var(--red)":"var(--yellow)"}"></div></div>
        </div>
      </div>
      ${a.setup ? `
      <div class="stat-grid" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">
        <div class="stat"><div class="k">${t("entry")}</div><div class="v b">${fmtNum(a.setup.entry,P.dec)}</div></div>
        <div class="stat"><div class="k">${t("stopLoss")}</div><div class="v r">${fmtNum(a.setup.sl,P.dec)}</div></div>
        <div class="stat"><div class="k">${t("tp1")}</div><div class="v g">${fmtNum(a.setup.tp1,P.dec)}</div></div>
        <div class="stat"><div class="k">${t("tp2")}</div><div class="v g">${fmtNum(a.setup.tp2,P.dec)}</div></div>
        <div class="stat"><div class="k">${t("tp3")}</div><div class="v g">${fmtNum(a.setup.tp3,P.dec)}</div></div>
        <div class="stat"><div class="k">${t("rr")}</div><div class="v">1:${rr1.toFixed(1)} / 1:${rr2.toFixed(1)} / 1:${rr3.toFixed(1)}</div></div>
      </div>
      <div class="grid g3" style="margin-top:14px">
        <div class="field"><label>${t("riskAmount")} ($)</label><input class="inp" id="risk-inp" type="number" value="${State.riskAmount}" min="1"></div>
        <div class="field"><label>${t("lotSize")}</label><input class="inp" id="lot-inp" type="text" value="${State.pair==="XAUUSD"?"0.10":"0.10"}" placeholder="0.10"></div>
        <div class="field"><label>${t("riskMoney")} / ${t("rewardMoney")}</label><input class="inp" id="rr-out" type="text" value="—" readonly></div>
      </div>
      <div style="display:flex;gap:9px;margin-top:15px;flex-wrap:wrap">
        <button class="btn btn-blue" id="btn-tg">${icon("tg")}${t("sendTelegram")}</button>
        <button class="btn" id="btn-copy">${icon("copy")}${t("copySetup")}</button>
        <button class="btn" id="btn-save">${icon("check")}${t("addHistory")}</button>
      </div>`
      : `<div class="note" style="margin-top:10px">🟡 ${t("noSetup")}</div>`}
    </div>
  </div>

  <div class="card">
    <div class="card-h"><h3>🤖 ${t("aiReason")}</h3><div class="spacer"></div><span class="badge blue">${TFS[State.tf]}</span></div>
    <ul class="reason-list">
      ${a.reasons.map(r => `<li class="${r.dir===1?"buy-li":r.dir===-1?"sell-li":"wait-li"}"><span class="ri">${r.dir===1?"🟢":r.dir===-1?"🔴":"🟡"}</span><span>${esc(r.text)}</span></li>`).join("")}
    </ul>
  </div>

  <div class="section-title"><h2>📊 ${t("history")} <span class="badge green">${t("winRate")}: ${computeWinRate(State.history)}%</span></h2><div class="line"></div>
    <button class="btn btn-sm btn-red" onclick="clearHistory()">${icon("trash")}${t("clearHistory")}</button></div>
  ${historyTable(State.history)}`;
  // events
  const riskInp = document.getElementById("risk-inp");
  if (riskInp){
    riskInp.oninput = () => { State.riskAmount = parseFloat(riskInp.value) || 100; updateRR(); };
    const lotInp = document.getElementById("lot-inp");
    if (lotInp) lotInp.oninput = updateRR;
    updateRR();
  }
  const btnTg = document.getElementById("btn-tg");
  if (btnTg) btnTg.onclick = () => {
    toast(t("tAlert") + " — Telegram", t("channelSub"), "#3b82f6");
    addFeed("buy", "Telegram: " + t("sendTelegram") + " — " + setupText(true));
  };
  const btnCopy = document.getElementById("btn-copy");
  if (btnCopy) btnCopy.onclick = () => {
    const txt = setupText(false);
    const done = () => toast(t("tSaved"), "", "#22c55e");
    if (navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(done).catch(()=>{}); }
    else done();
  };
  const btnSave = document.getElementById("btn-save");
  if (btnSave) btnSave.onclick = () => {
    if (!a.setup) return;
    State.history.unshift({ time: Date.now(), sym: a.sym, tf: a.tf, dir: a.signal.dir, entry: a.setup.entry, sl: a.setup.sl, tp1: a.setup.tp1, tp2: a.setup.tp2, tp3: a.setup.tp3, conf: a.signal.conf, result: "pending" });
    Store.set("nat_history", State.history);
    toast(t("tSaved"), t("savedOk"), "#22c55e");
    renderSetup();
  };
}
function setupText(simple){
  const a = State.analysis; if (!a || !a.setup) return "";
  const P = PAIRS[a.sym];
  const d = a.signal.dir===1 ? "BUY" : "SELL";
  const l = [`${P.name} ${TFS[a.tf]} ${d}`, `Entry: ${fmtNum(a.setup.entry,P.dec)}`, `SL: ${fmtNum(a.setup.sl,P.dec)}`, `TP1: ${fmtNum(a.setup.tp1,P.dec)}`, `TP2: ${fmtNum(a.setup.tp2,P.dec)}`, `TP3: ${fmtNum(a.setup.tp3,P.dec)}`, `Conf: ${a.signal.conf}%`];
  return l.join("\n");
}
function updateRR(){
  const a = State.analysis;
  const risk = parseFloat(document.getElementById("risk-inp")?.value) || 100;
  const rr = document.getElementById("rr-out");
  if (!rr || !a || !a.setup) return;
  const P = PAIRS[a.sym];
  const dist = Math.abs(a.setup.entry - a.setup.sl);
  const val = State.pair==="XAUUSD" ? 10 : 10; // $ per pip per 1.0 lot; pips = dist/0.1 or dist/0.0001
  const pipVal = dist / P.pip * 10 * (State.pair==="XAUUSD" ? 1 : 1);
  const perLot = pipVal;
  rr.value = `${t("riskMoney")}: ~$${risk} · ${t("rewardMoney")} TP1: ~$${Math.round(risk * ((a.setup.tp1-a.setup.entry)/(a.setup.entry-a.setup.sl)))}`;
}
function clearHistory(){
  State.history = [];
  Store.set("nat_history", State.history);
  toast(t("tSaved"), t("resetOk"), "#3b82f6");
  renderSetup();
}
function historyTable(rows, mini){
  if (!rows.length) return `<div class="card"><div class="note" style="margin-top:0">${t("noHistory")}</div></div>`;
  const P = PAIRS;
  return `<div class="tbl-wrap"><table>
    <thead><tr>
      <th>${t("pair")}</th><th>TF</th><th>${t("signal")}</th><th>${t("entry")}</th><th>${t("stopLoss")}</th><th>TP1</th><th>${t("confidence")}</th><th>${t("result")}</th>${mini ? "" : "<th>" + t("time") + "</th>"}
    </tr></thead>
    <tbody>
      ${rows.map(h => {
        const d = h.dir;
        return `<tr>
          <td><b>${P[h.sym].name}</b></td>
          <td>${TFS[h.tf]||h.tf}</td>
          <td>${dirBadge(d, 9)}</td>
          <td>${fmtNum(h.entry, P[h.sym].dec)}</td>
          <td style="color:var(--red)">${fmtNum(h.sl, P[h.sym].dec)}</td>
          <td style="color:var(--green)">${fmtNum(h.tp1, P[h.sym].dec)}</td>
          <td>${h.conf}%</td>
          <td>${h.result==="win" ? '<span class="badge buy">✅ '+t("win")+'</span>' : h.result==="loss" ? '<span class="badge sell">❌ '+t("loss")+'</span>' : '<span class="badge muted">⏳ '+t("pending")+'</span>'}</td>
          ${mini?"":"<td style='color:var(--muted)'>"+fmtDate(h.time)+" "+fmtTime(h.time)+"</td>"}
        </tr>`;
      }).join("")}
    </tbody>
  </table></div>`;
}

/* ============================================================
   TRADE TIMER
   ============================================================ */
function renderTimer(){
  const sec = document.getElementById("page-timer");
  const sess = sessions();
  const nextKz = sess.filter(s=>!s.active).sort((a,b)=>a.minsToStart-b.minsToStart)[0] || sess[0];
  const activeKz = sess.find(s=>s.active);
  const a = State.analysis;
  const expMin = a && a.setup ? (a.tf >= 14400 ? 8 : a.tf >= 3600 ? 4 : 2) : 3;
  sec.innerHTML = `
  <div class="grid g4">
    <div class="card timer-card">
      <div class="tc-ico">${icon("target", "ico blue")}</div>
      <div class="k" style="font-size:11px;color:var(--muted);font-weight:800">${t("tEntry")}</div>
      <div class="big-num" id="tm-entry">--:--:--</div>
      <div class="tc-sub" id="tm-entry-sub">${activeKz ? "● " + t("activeNow") + " — " + activeKz.label : t("nextKz") + ": " + nextKz.label}</div>
      <div class="progress"><div id="tm-entry-bar"></div></div>
    </div>
    <div class="card timer-card">
      <div class="tc-ico">${icon("clock", "ico purple")}</div>
      <div class="k" style="font-size:11px;color:var(--muted);font-weight:800">${t("tDuration")}</div>
      <div class="big-num" id="tm-dur">--:--</div>
      <div class="tc-sub">≈ ${expMin} ${t("hours")}</div>
      <div class="progress"><div style="width:70%"></div></div>
    </div>
    <div class="card timer-card">
      <div class="tc-ico">${icon("bolt", "ico green")}</div>
      <div class="k" style="font-size:11px;color:var(--muted);font-weight:800">${t("tRelease")}</div>
      <div class="big-num" id="tm-rel">--:--</div>
      <div class="tc-sub" id="tm-rel-sub">—</div>
      <div class="progress"><div style="width:100%"></div></div>
    </div>
    <div class="card timer-card">
      <div class="tc-ico">${icon("bell", "ico red")}</div>
      <div class="k" style="font-size:11px;color:var(--muted);font-weight:800">${t("tExpiry")}</div>
      <div class="big-num" id="tm-exp">--:--:--</div>
      <div class="tc-sub" id="tm-exp-sub">${t("activeNow")}</div>
      <div class="progress"><div id="tm-exp-bar"></div></div>
    </div>
  </div>
  <div class="grid g3" style="margin-top:16px">
    ${sess.map(s => `
      <div class="card session-card">
        <div class="s-name">${s.id==="asian"?"🌏":s.id==="london"?"🏰":"🗽"} ${s.label}</div>
        <div class="s-time">${s.id==="asian"?t("asianTime"):s.id==="london"?t("londonTime"):t("nyTime")}</div>
        <div class="s-status"><span class="badge ${s.active?"green":"blue"}">${s.active?"● "+t("activeNow"):t("upcoming")}</span></div>
        <div class="countdown" data-kz2="${s.id}">${countdownStr((s.active?s.minsToEnd:s.minsToStart)*60000)}</div>
        <small>${s.active ? t("endsIn") : t("startsIn")}</small>
      </div>`).join("")}
  </div>
  <div class="card" style="margin-top:16px">
    <div class="card-h"><h3>${icon("clock")} ${t("nowSess")}</h3><div class="spacer"></div><span class="badge blue" id="tm-et">${etParts().label} ET</span></div>
    <div class="kv"><span class="kk">${t("time")} (UTC)</span><span class="vv" id="tm-utc">—</span></div>
    <div class="kv"><span class="kk">${t("activeNow")}</span><span class="vv" id="tm-now">—</span></div>
  </div>`;
  State._sess = sess;
}
function updateTimerPage(){
  if (State.page !== "timer") return;
  const sess = sessions();
  const nextKz = sess.filter(s=>!s.active).sort((a,b)=>a.minsToStart-b.minsToStart)[0] || sess[0];
  const activeKz = sess.find(s=>s.active);
  const et = document.getElementById("tm-et");
  if (et) et.textContent = etParts().label + " ET";
  const utc = document.getElementById("tm-utc");
  if (utc) utc.textContent = new Date().toUTCString().slice(17,25);
  const nowS = document.getElementById("tm-now");
  if (nowS) nowS.innerHTML = activeKz ? `<span class="badge green">● ${activeKz.label}</span>${activeKz.minsToEnd<60?` · ${t("endsIn")} ${countdownStr(activeKz.minsToEnd*60000)}`:""}` : `<span class="badge blue">${t("next")}: ${nextKz.label} ${countdownStr(nextKz.minsToStart*60000)}</span>`;
  // entry window countdown
  const entry = document.getElementById("tm-entry");
  if (entry){
    if (activeKz){ entry.textContent = countdownStr(activeKz.minsToEnd*60000); const bar = document.getElementById("tm-entry-bar"); if (bar) bar.style.width = Math.min(100, Math.max(4, activeKz.minsToEnd/180*100)) + "%"; }
    else { entry.textContent = countdownStr(nextKz.minsToStart*60000); const bar = document.getElementById("tm-entry-bar"); if (bar) bar.style.width = "12%"; }
  }
  const rel = document.getElementById("tm-rel");
  if (rel){
    const a = State.analysis;
    if (a && a.time){ rel.textContent = fmtTime(a.time); const sub = document.getElementById("tm-rel-sub"); if (sub) sub.textContent = `${PAIRS[a.sym].name} ${TFS[a.tf]} — ${t("confidence")} ${a.signal.conf}%`; }
  }
  const exp = document.getElementById("tm-exp");
  if (exp){
    const a = State.analysis;
    const expMs = a ? Math.max(30, (a.tf >= 14400 ? 8 : a.tf >= 3600 ? 4 : 2) * 3600000) : 2*3600000;
    const left = (a ? a.time + expMs : Date.now() + expMs) - Date.now();
    exp.textContent = countdownStr(left);
    const bar = document.getElementById("tm-exp-bar");
    if (bar) bar.style.width = Math.min(100, Math.max(3, left/expMs*100)) + "%";
  }
  const dur = document.getElementById("tm-dur");
  if (dur){
    const a = State.analysis;
    const expMin = a ? (a.tf >= 14400 ? 8 : a.tf >= 3600 ? 4 : 2) : 3;
    dur.textContent = "~" + expMin + "h";
  }
  document.querySelectorAll("[data-kz2]").forEach(el => {
    const s = sess.find(x => x.id === el.dataset.kz2);
    if (s) el.textContent = countdownStr((s.active ? s.minsToEnd : s.minsToStart) * 60000);
  });
}

/* ============================================================
   PIP CALCULATOR
   ============================================================ */
function renderCalc(){
  const sec = document.getElementById("page-calc");
  const a = State.analysis;
  const def = a && a.setup ? a.setup : null;
  const P = PAIRS[State.pair];
  sec.innerHTML = `
  <div class="grid g2">
    <div class="card">
      <div class="card-h"><h3>${icon("calc")} ${t("calcTitle")}</h3></div>
      <div class="grid g2" style="gap:12px">
        <div class="field"><label>${t("pair")}</label>
          <select class="inp" id="calc-pair">${Object.keys(PAIRS).map(s=>`<option value="${s}" ${s===State.pair?"selected":""}>${PAIRS[s].name}</option>`).join("")}</select>
        </div>
        <div class="field"><label>${t("cEntry")}</label><input class="inp" id="calc-entry" type="number" step="any" value="${def?def.entry:P.base}"></div>
        <div class="field"><label>${t("cSL")}</label><input class="inp" id="calc-sl" type="number" step="any" value="${def?def.sl:P.base - P.base*(P.pip*60/ (P.pip===0.1? P.base:1))}"></div>
        <div class="field"><label>${t("cTP")} 1</label><input class="inp" id="calc-tp1" type="number" step="any" value="${def?def.tp1:P.base + P.base*(P.pip*60/(P.pip===0.1?P.base:1))}"></div>
        <div class="field"><label>${t("cTP")} 2</label><input class="inp" id="calc-tp2" type="number" step="any" value="${def?def.tp2:P.base + P.base*(P.pip*120/(P.pip===0.1?P.base:1))}"></div>
        <div class="field"><label>${t("cTP")} 3</label><input class="inp" id="calc-tp3" type="number" step="any" value="${def?def.tp3:P.base + P.base*(P.pip*180/(P.pip===0.1?P.base:1))}"></div>
      </div>
      <div class="note">${t("cNote")}</div>
    </div>
    <div class="card">
      <div class="card-h"><h3>📊 ${t("calcTitle")} — ${t("result")}</h3></div>
      <div class="kv"><span class="kk">${t("cSld")}</span><span class="vv" id="res-sl">—</span></div>
      <div class="kv"><span class="kk">${t("cTPDist")} 1</span><span class="vv" id="res-tp1">—</span></div>
      <div class="kv"><span class="kk">${t("cTPDist")} 2</span><span class="vv" id="res-tp2">—</span></div>
      <div class="kv"><span class="kk">${t("cTPDist")} 3</span><span class="vv" id="res-tp3">—</span></div>
      <div class="kv"><span class="kk">${t("cRR")} 1</span><span class="vv" id="res-rr1">—</span></div>
      <div class="kv"><span class="kk">${t("cRR")} 2</span><span class="vv" id="res-rr2">—</span></div>
      <div class="kv"><span class="kk">${t("cRR")} 3</span><span class="vv" id="res-rr3">—</span></div>
      <div class="kv"><span class="kk">${t("cPips")} (TP1)</span><span class="vv" id="res-pips">—</span></div>
    </div>
  </div>`;
  const calc = () => {
    const pair = document.getElementById("calc-pair").value;
    const Pc = PAIRS[pair];
    const e = parseFloat(document.getElementById("calc-entry").value);
    const sl = parseFloat(document.getElementById("calc-sl").value);
    const tp1 = parseFloat(document.getElementById("calc-tp1").value);
    const tp2 = parseFloat(document.getElementById("calc-tp2").value);
    const tp3 = parseFloat(document.getElementById("calc-tp3").value);
    const g = id => document.getElementById(id);
    const slD = Math.abs(e - sl);
    const pips = d => d / Pc.pip;
    g("res-sl").textContent = fmtNum(slD, Pc.dec) + " (" + pips(slD).toFixed(1) + " " + t("pips") + ")";
    const set = (id, tp) => { const d = Math.abs(tp - e); g(id).textContent = fmtNum(d, Pc.dec) + " · " + pips(d).toFixed(1) + " pips · R " + (d/slD).toFixed(2); };
    set("res-tp1", tp1); set("res-tp2", tp2); set("res-tp3", tp3);
    g("res-rr1").textContent = "1 : " + (Math.abs(tp1-e)/slD).toFixed(2);
    g("res-rr2").textContent = "1 : " + (Math.abs(tp2-e)/slD).toFixed(2);
    g("res-rr3").textContent = "1 : " + (Math.abs(tp3-e)/slD).toFixed(2);
    g("res-pips").textContent = pips(Math.abs(tp1-e)).toFixed(1);
  };
  ["calc-pair","calc-entry","calc-sl","calc-tp1","calc-tp2","calc-tp3"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", calc);
  });
  calc();
}

/* ============================================================
   NEWS
   ============================================================ */
let newsCache = null;
function getNews(){ if (!newsCache) newsCache = newsEvents(); return newsCache; }
function renderNews(){
  const sec = document.getElementById("page-news");
  const events = getNews().filter(e => e.time > Date.now() - 3600000).sort((a,b)=>a.time-b.time);
  const high = events.filter(e=>e.impact==="high");
  sec.innerHTML = `
  <div class="section-title"><h2>🔴 ${t("nextEvents")}</h2><div class="line"></div></div>
  <div class="grid g4">
    ${high.slice(0,4).map(e => `
      <div class="card" style="text-align:center;border-color:rgba(239,68,68,.35)">
        <div class="badge high">${e.impact==="high"?"🔴 "+t("highImpact"):"🟡 "+t("impact")}</div>
        <div style="font-weight:800;margin-top:8px;font-size:13px">${e.title.split("—")[0].trim()}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">${e.cur} · ${e.tag}</div>
        <div class="countdown" data-ev="${e.time}" style="font-size:22px;color:var(--red)">${countdownStr(e.time-Date.now())}</div>
        <small style="color:var(--muted);font-size:10px;font-weight:700">${t("time")}: ${fmtDate(e.time)} ${fmtTime(e.time)}</small>
      </div>`).join("")}
  </div>
  <div class="section-title"><h2>📰 ${t("calendar")}</h2><div class="line"></div></div>
  <div class="card" style="padding:8px 16px">
    ${events.map(e => `
      <div class="news-event">
        <div class="news-date"><b>${fmtDate(e.time).split("/")[0]}</b><span>${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][new Date(e.time).getUTCMonth()]}</span></div>
        <div style="flex:1;min-width:180px">
          <div style="font-weight:800;font-size:13px">${e.title}</div>
          <div style="font-size:11px;color:var(--muted)">${e.cur} · ${t("time")}: ${fmtTime(e.time)} ET</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span class="badge ${e.impact==="high"?"high":e.impact==="med"?"med":"low"}">${e.impact==="high"?"🔴":e.impact==="med"?"🟡":"🟢"} ${t("impact")}: ${e.impact}</span>
          <span class="badge muted">${t("previous")}: ${e.prev}</span>
          <span class="badge blue">${t("forecast")}: ${e.fcst}</span>
          <span class="count-mini" data-ev2="${e.time}">${countdownStr(e.time-Date.now())}</span>
        </div>
      </div>`).join("")}
  </div>
  <div class="note" style="margin-top:14px">ℹ️ ${t("newsNote")}</div>`;
}
function updateNewsCountdowns(){
  document.querySelectorAll("[data-ev]").forEach(el => {
    const left = parseInt(el.dataset.ev) - Date.now();
    el.textContent = countdownStr(left);
  });
  document.querySelectorAll("[data-ev2]").forEach(el => {
    const left = parseInt(el.dataset.ev2) - Date.now();
    el.textContent = left > 0 ? countdownStr(left) : "—";
  });
}

/* ============================================================
   ALERTS
   ============================================================ */
function renderAlerts(){
  const sec = document.getElementById("page-alerts");
  const toggles = [
    ["buy", "atBuy", "🟢"], ["sell", "atSell", "🔴"], ["wait", "atWait", "🟡"],
    ["news", "atNews", "📰"], ["kz", "atKz", "⏰"]
  ];
  sec.innerHTML = `
  <div class="grid g2" style="margin-bottom:16px">
    <div class="card" style="background:linear-gradient(135deg,rgba(37,99,235,.16),var(--card2))">
      <div class="card-h"><h3>${icon("tg")} ${t("channel")}</h3></div>
      <div style="font-size:13px;color:var(--muted)">${t("channelSub")}</div>
      <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;align-items:center">
        <button class="btn btn-blue" onclick="window.open('https://t.me/NoorAhmadTrader','_blank')">${icon("tg")}${t("joinBtn")}</button>
        <span class="badge green"><span class="dot g pulse"></span> @NoorAhmadTrader</span>
      </div>
    </div>
    <div class="card">
      <div class="card-h"><h3>🔔 ${t("alertTypes")}</h3></div>
      ${toggles.map(([k, key, emo]) => `
        <div class="setting-row">
          <span style="font-size:17px">${emo}</span>
          <div class="s-txt"><b>${t(key)}</b></div>
          <label class="switch"><input type="checkbox" data-toggle="${k}" ${State.alertToggles[k]?"checked":""}><span class="sl"></span></label>
        </div>`).join("")}
      <div style="margin-top:12px"><button class="btn btn-sm" id="btn-test">${icon("bolt")}${t("testAlert")}</button></div>
    </div>
  </div>
  <div class="card">
    <div class="card-h"><h3>${icon("bell")} ${t("liveFeed")}</h3><div class="spacer"></div><span class="badge blue" id="feed-count">${State.feed.length}</span></div>
    <div class="feed" id="feed-list"></div>
  </div>`;
  sec.querySelectorAll("[data-toggle]").forEach(cb => {
    cb.onchange = () => { State.alertToggles[cb.dataset.toggle] = cb.checked; Store.set("nat_toggles", State.alertToggles); };
  });
  const test = document.getElementById("btn-test");
  if (test) test.onclick = () => toast(t("tAlert") + " — ✅", t("testAlert"), "#22c55e");
  renderFeed(document.getElementById("feed-list"));
}
function renderFeed(el){
  if (!el) return;
  const fc = document.getElementById("feed-count");
  if (fc) fc.textContent = State.feed.length;
  if (!State.feed.length){ el.innerHTML = `<div class="note" style="margin-top:0">${t("noFeed")}</div>`; return; }
  el.innerHTML = State.feed.map(f => {
    const col = f.type==="buy" ? "#22c55e" : f.type==="sell" ? "#ef4444" : f.type==="news" ? "#eab308" : f.type==="kz" ? "#3b82f6" : "#8fa3c8";
    const emo = f.type==="buy" ? "🟢" : f.type==="sell" ? "🔴" : f.type==="news" ? "📰" : f.type==="kz" ? "⏰" : "🟡";
    return `<div class="feed-item"><span style="color:${col};font-size:15px">${emo}</span>
      <div style="flex:1"><div class="f-msg" style="color:${col}">${esc(f.msg)}</div><div class="f-time">${fmtDate(f.time)} ${fmtTime(f.time)} UTC</div></div></div>`;
  }).join("");
}

/* ============================================================
   AI CHAT
   ============================================================ */
const chatState = { msgs: [] };
function renderChat(){
  const sec = document.getElementById("page-chat");
  const chips = I18N[getLang()].chips || [];
  sec.innerHTML = `
  <div class="card" style="padding:0">
    <div class="chat-head">
      <span class="ico blue" style="width:38px;height:38px">${icon("spark")}</span>
      <div style="flex:1">
        <div class="c-name">🤖 ${t("appName")} AI</div>
        <div class="c-status"><span class="dot g pulse"></span>${t("chatSub")}</div>
      </div>
    </div>
    <div class="chat-msgs" id="chat-msgs"></div>
    <div class="chat-chips" id="chat-chips">
      ${chips.map(c => `<button class="chat-chip" data-chip="${esc(c)}">${c}</button>`).join("")}
    </div>
    <div class="chat-input-row">
      <input class="inp" id="chat-inp" placeholder="${t("chatPh")}" autocomplete="off">
      <button class="btn btn-blue" id="chat-send">${icon("send")}</button>
    </div>
  </div>`;
  const msgs = document.getElementById("chat-msgs");
  if (!chatState.msgs.length){
    chatState.msgs.push({ role: "bot", text: t("chatGreeting"), time: Date.now() });
  }
  renderChatMsgs(msgs);
  document.getElementById("chat-chips").querySelectorAll("[data-chip]").forEach(b => {
    b.onclick = () => sendChat(b.dataset.chip);
  });
  const inp = document.getElementById("chat-inp");
  const send = document.getElementById("chat-send");
  const doSend = () => { const v = inp.value.trim(); if (v) sendChat(v); inp.value = ""; };
  send.onclick = doSend;
  inp.addEventListener("keydown", e => { if (e.key === "Enter") doSend(); });
}
function renderChatMsgs(el){
  el.innerHTML = chatState.msgs.map(m => `
    <div class="msg ${m.role}">${esc(m.text)}
      <span class="m-time">${fmtTime(m.time)}</span>
    </div>`).join("");
  el.scrollTop = el.scrollHeight;
}
function sendChat(text){
  const msgs = document.getElementById("chat-msgs");
  if (!msgs) return;
  chatState.msgs.push({ role: "user", text, time: Date.now() });
  renderChatMsgs(msgs);
  const typing = document.createElement("div");
  typing.className = "msg bot typing"; typing.innerHTML = "<span></span><span></span><span></span>";
  msgs.appendChild(typing); msgs.scrollTop = msgs.scrollHeight;
  setTimeout(() => {
    typing.remove();
    chatState.msgs.push({ role: "bot", text: AI_BOT.reply(text, State), time: Date.now() });
    renderChatMsgs(msgs);
  }, 900 + Math.random() * 900);
}
function scrollChat(){ const el = document.getElementById("chat-msgs"); if (el) el.scrollTop = el.scrollHeight; }

/* ============================================================
   PROFILE
   ============================================================ */
function renderProfile(){
  const sec = document.getElementById("page-profile");
  const wr = computeWinRate(State.history);
  const today = State.history.filter(h => Date.now() - h.time < 86400000).length;
  sec.innerHTML = `
  <div class="grid g3">
    <div class="card" style="grid-column:1/-1">
      <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">
        <div class="avatar">NA</div>
        <div style="flex:1;min-width:200px">
          <div style="font-size:20px;font-weight:900">${t("appName")}</div>
          <div style="color:var(--muted);font-weight:700;font-size:12.5px">${t("role")}</div>
          <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
            <span class="badge blue">${icon("shield")} ${t("planName")}</span>
            <span class="badge green"><span class="dot g pulse"></span>${t("live")}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-h"><h3>${icon("user")} ${t("stats")}</h3></div>
      <div class="kv"><span class="kk">${t("winRate")}</span><span class="vv g">${wr}%</span></div>
      <div class="kv"><span class="kk">${t("statsToday")}</span><span class="vv b">${today}</span></div>
      <div class="kv"><span class="kk">${t("history")}</span><span class="vv">${State.history.length}</span></div>
      <div class="kv"><span class="kk">${t("tSignal")} (${TFS[State.tf]})</span><span class="vv">${State.analysis ? dirBadge(State.analysis.signal.dir, 9) : "—"}</span></div>
    </div>
    <div class="card">
      <div class="card-h"><h3>${icon("globe")} ${t("settings")}</h3></div>
      <div class="setting-row">
        <span style="font-size:17px">🌐</span>
        <div class="s-txt"><b>${t("sLang")}</b><span>${t("sLangSub")}</span></div>
        <button class="btn btn-sm btn-blue" onclick="toggleLang()">${State.lang==="ps" ? "English" : "پښتو"}</button>
      </div>
      <div class="setting-row">
        <span style="font-size:17px">${State.theme==="dark"?"🌙":"☀️"}</span>
        <div class="s-txt"><b>${t("sTheme")}</b><span>${t("sThemeSub")}</span></div>
        <button class="btn btn-sm" onclick="toggleTheme()">${State.theme==="dark"?t("lightMode"):t("darkMode")}</button>
      </div>
      <div class="setting-row">
        <span style="font-size:17px">🗑️</span>
        <div class="s-txt"><b>${t("resetData")}</b></div>
        <button class="btn btn-sm btn-red" onclick="resetAll()">${icon("trash")}</button>
      </div>
    </div>
    <div class="card" style="grid-column:1/-1">
      <div class="card-h"><h3>ℹ️ ${t("about")}</h3></div>
      <p style="font-size:13px;color:var(--muted);line-height:1.75">${t("aboutText")}</p>
    </div>
  </div>`;
}
function resetAll(){
  try { localStorage.clear(); } catch(e){}
  location.reload();
}
