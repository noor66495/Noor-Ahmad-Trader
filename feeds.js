/* ============ Noor Ahmad Trader — Real Market Data Layer ============ */
/* Multi-provider live data with automatic fallback:
   - Each pair has its own ordered provider chain (currently: gold only).
   - First provider that answers becomes the live source for that pair.
   - If everything fails → the built-in demo simulator keeps running.
   Free, key-less, CORS-enabled public endpoints only. */

/* ---------- tiny safe storage (independent of ui.js load order) ---------- */
const FLS = {
  get(k, d){ try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} },
  del(k){ try { localStorage.removeItem(k); } catch(e){} }
};

/* ---------- fetch with timeout ---------- */
function ffetch(url, ms){
  const ctl = (typeof AbortController !== "undefined") ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => { try { ctl.abort(); } catch(e){} }, ms || 7000) : null;
  return fetch(url, ctl ? { signal: ctl.signal, cache: "no-store" } : { cache: "no-store" })
    .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .finally(() => { if (timer) clearTimeout(timer); });
}

/* ---------- candle helpers ---------- */
const CANDLE_MS = { 300:"5m", 900:"15m", 3600:"1H", 14400:"4H", 86400:"1D" };
function sanitizeCandles(arr){ // oldest-first [{t,o,h,l,c,v}]
  const out = [];
  for (const c of arr){
    if (!c || !isFinite(c.t) || !isFinite(c.o) || !isFinite(c.h) || !isFinite(c.l) || !isFinite(c.c)) continue;
    if (c.c <= 0 || c.h <= 0) continue;
    if (c.h < c.l) { const x = c.h; c.h = c.l; c.l = x; }
    if (c.h < Math.max(c.o, c.c) - 1e-9) c.h = Math.max(c.o, c.c);
    if (c.l > Math.min(c.o, c.c) + 1e-9) c.l = Math.min(c.o, c.c);
    out.push(c);
  }
  out.sort((a,b) => a.t - b.t);
  return out;
}
/* Merge N base candles into tfSec buckets (epoch-aligned) */
function aggregateCandles(base, tfSec){
  const ms = tfSec * 1000, out = [];
  let cur = null, curIdx = -1;
  for (const b of base){
    const idx = Math.floor(b.t / ms);
    if (idx !== curIdx){
      cur = { t: idx * ms, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v || 0 };
      out.push(cur); curIdx = idx;
    } else {
      cur.h = Math.max(cur.h, b.h); cur.l = Math.min(cur.l, b.l);
      cur.c = b.c; cur.v = (cur.v || 0) + (b.v || 0);
    }
  }
  return out;
}

/* ============================================================
   Providers — each implements:
     candles(symbol, tfSec, count) → Promise<oldest-first candle array>
     ticker(symbol)                → Promise<{price,pct24,dayHigh,dayLow}>
   ============================================================ */
const FEED_PROVIDERS = {

  /* ---- Kraken (PAXG gold vs USD; 720 candles max) ---- */
  kraken: {
    id: "kraken", name: "Kraken",
    _iv: { 300:5, 900:15, 3600:60, 14400:240, 86400:1440 },
    async candles(symbol, tfSec, count){
      const agg = false;
      const iv = this._iv[tfSec];
      if (!iv) throw new Error("tf unsupported");
      const j = await ffetch(`https://api.kraken.com/0/public/OHLC?pair=${encodeURIComponent(symbol)}&interval=${iv}`, 9000);
      if (!j || !j.result || (j.error && j.error.length)) throw new Error(j && j.error && j.error[0] || "kraken empty");
      const key = Object.keys(j.result).find(k => k !== "last");
      const raw = j.result[key] || [];
      let arr = raw.map(r => ({ t: r[0]*1000, o:+r[1], h:+r[2], l:+r[3], c:+r[4], v:+r[6] }));
      arr = sanitizeCandles(arr);
      if (agg) arr = aggregateCandles(arr, tfSec);
      if (arr.length < 30) throw new Error("kraken short");
      return arr.slice(-count);
    },
    async ticker(symbol){
      const j = await ffetch(`https://api.kraken.com/0/public/Ticker?pair=${encodeURIComponent(symbol)}`, 7000);
      if (!j || !j.result) throw new Error("kraken ticker");
      const key = Object.keys(j.result)[0], d = j.result[key];
      const last = +d.c[0], open = +d.o;
      const hi = Math.max(+d.h[1], +d.h[0]), lo = Math.min(+d.l[1], +d.l[0]);
      return { price: last, pct24: open ? (last-open)/open*100 : null, dayHigh: hi || null, dayLow: lo || null };
    }
  },

  /* ---- Binance (XAUT / PAXG / EUR USDT pairs; websocket support) ---- */
  binance: {
    id: "binance", name: "Binance",
    _hosts: ["https://data-api.binance.vision", "https://api.binance.com"],
    _iv: { 300:"5m", 900:"15m", 3600:"1h", 14400:"4h", 86400:"1d" },
    async candles(symbol, tfSec, count){
      const agg = false;
      const iv = this._iv[tfSec];
      if (!iv) throw new Error("tf unsupported");
      const lim = Math.min(agg ? count*3 : count, 1000);
      let lastErr = null;
      for (const h of this._hosts){
        try {
          const j = await ffetch(`${h}/api/v3/klines?symbol=${symbol}&interval=${iv}&limit=${lim}`, 7000);
          if (!Array.isArray(j) || !j.length) throw new Error("binance empty");
          let arr = sanitizeCandles(j.map(r => ({ t:+r[0], o:+r[1], h:+r[2], l:+r[3], c:+r[4], v:+r[5] })));
          if (agg) arr = aggregateCandles(arr, tfSec);
          if (arr.length < 30) throw new Error("binance short");
          return arr.slice(-count);
        } catch(e){ lastErr = e; }
      }
      throw lastErr || new Error("binance unreachable");
    },
    async ticker(symbol){
      let lastErr = null;
      for (const h of this._hosts){
        try {
          const q = encodeURIComponent(JSON.stringify([symbol]));
          const j = await ffetch(`${h}/api/v3/ticker/24hr?symbols=${q}`, 7000);
          if (!Array.isArray(j) || !j.length) throw new Error("binance ticker empty");
          const d = j[0];
          return { price:+d.lastPrice, pct24:+d.priceChangePercent, dayHigh:+d.highPrice, dayLow:+d.lowPrice };
        } catch(e){ lastErr = e; }
      }
      throw lastErr || new Error("binance unreachable");
    }
  },

  /* ---- OKX (XAUT-USDT gold) ---- */
  okx: {
    id: "okx", name: "OKX",
    _iv: { 300:"5m", 900:"15m", 3600:"1H", 14400:"4H", 86400:"1D" },
    async candles(symbol, tfSec, count){
      const agg = false;
      const bar = this._iv[tfSec];
      if (!bar) throw new Error("tf unsupported");
      const lim = Math.min(agg ? 300 : count, 300);
      const j = await ffetch(`https://www.okx.com/api/v5/market/candles?instId=${symbol}&bar=${bar}&limit=${lim}`, 8000);
      if (!j || j.code !== "0" || !Array.isArray(j.data) || !j.data.length) throw new Error("okx empty");
      let arr = sanitizeCandles(j.data.map(r => ({ t:+r[0], o:+r[1], h:+r[2], l:+r[3], c:+r[4], v:+r[5] })).reverse()); // newest→oldest-first
      if (agg) arr = aggregateCandles(arr, tfSec);
      if (arr.length < 30) throw new Error("okx short");
      return arr.slice(-count);
    },
    async ticker(symbol){
      const j = await ffetch(`https://www.okx.com/api/v5/market/ticker?instId=${symbol}`, 7000);
      if (!j || j.code !== "0" || !j.data || !j.data.length) throw new Error("okx ticker");
      const d = j.data[0], open = +d.open24h;
      return { price:+d.last, pct24: open ? (+d.last - open)/open*100 : null, dayHigh:+d.high24h, dayLow:+d.low24h };
    }
  },

  /* ---- KuCoin (XAUT-USDT gold) ---- */
  kucoin: {
    id: "kucoin", name: "KuCoin",
    _iv: { 300:"5min", 900:"15min", 3600:"1hour", 14400:"4hour", 86400:"1day" },
    async candles(symbol, tfSec, count){
      const agg = false;
      const type = this._iv[tfSec];
      if (!type) throw new Error("tf unsupported");
      const lim = Math.min(agg ? count*3 : count, 1500);
      const j = await ffetch(`https://api.kucoin.com/api/v1/market/candles?symbol=${symbol}&type=${type}&limit=${lim}`, 8000);
      if (!j || j.code !== "200000" || !Array.isArray(j.data)) throw new Error("kucoin empty");
      // NOTE: rows are [t(s), open, CLOSE, high, low, vol, turnover], newest first
      let arr = sanitizeCandles(j.data.map(r => ({ t:+r[0]*1000, o:+r[1], h:+r[3], l:+r[4], c:+r[2], v:+r[5] })).reverse());
      if (agg) arr = aggregateCandles(arr, tfSec);
      if (arr.length < 30) throw new Error("kucoin short");
      return arr.slice(-count);
    },
    async ticker(symbol){
      const j = await ffetch(`https://api.kucoin.com/api/v1/market/stats?symbol=${symbol}`, 7000);
      if (!j || j.code !== "200000" || !j.data) throw new Error("kucoin ticker");
      const d = j.data;
      return { price:+d.last, pct24: d.changeRate != null ? +d.changeRate*100 : null, dayHigh:+d.high, dayLow:+d.low };
    }
  },

  /* ---- Bybit (XAUT/PAXG + EUR USDT) ---- */
  bybit: {
    id: "bybit", name: "Bybit",
    _iv: { 300:"5", 900:"15", 3600:"60", 14400:"240", 86400:"D" },
    async candles(symbol, tfSec, count){
      const agg = false;
      const iv = this._iv[tfSec];
      if (!iv) throw new Error("tf unsupported");
      const lim = Math.min(agg ? count*3 : count, 1000);
      const j = await ffetch(`https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=${iv}&limit=${lim}`, 8000);
      if (!j || j.retCode !== 0 || !j.result || !Array.isArray(j.result.list)) throw new Error("bybit empty");
      let arr = sanitizeCandles(j.result.list.map(r => ({ t:+r[0], o:+r[1], h:+r[2], l:+r[3], c:+r[4], v:+r[5] })).reverse());
      if (agg) arr = aggregateCandles(arr, tfSec);
      if (arr.length < 30) throw new Error("bybit short");
      return arr.slice(-count);
    },
    async ticker(symbol){
      const j = await ffetch(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`, 7000);
      const d = j && j.result && j.result.list && j.result.list[0];
      if (!d) throw new Error("bybit ticker");
      return { price:+d.lastPrice, pct24: d.price24hPcnt != null ? +d.price24hPcnt*100 : null,
               dayHigh: d.highPrice24h ? +d.highPrice24h : null, dayLow: d.lowPrice24h ? +d.lowPrice24h : null };
    }
  },

  /* ---- Bitfinex (last resort) ---- */
  bitfinex: {
    id: "bitfinex", name: "Bitfinex",
    _iv: { 300:"5m", 900:"15m", 3600:"1h", 14400:"4h", 86400:"1D" },
    async candles(symbol, tfSec, count){
      const agg = false;
      const tf = this._iv[tfSec];
      if (!tf) throw new Error("tf unsupported");
      const lim = Math.min(agg ? count*3 : count, 1000);
      const j = await ffetch(`https://api-pub.bitfinex.com/v2/candles/t${symbol}:${tf}/hist?limit=${lim}`, 8000);
      if (!Array.isArray(j) || !j.length) throw new Error("bitfinex empty");
      // rows: [MTS, OPEN, CLOSE, HIGH, LOW, VOLUME], newest first
      let arr = sanitizeCandles(j.map(r => ({ t:+r[0], o:+r[1], h:+r[3], l:+r[4], c:+r[2], v:+r[5] })).reverse());
      if (agg) arr = aggregateCandles(arr, tfSec);
      if (arr.length < 30) throw new Error("bitfinex short");
      return arr.slice(-count);
    },
    async ticker(symbol){
      const j = await ffetch(`https://api-pub.bitfinex.com/v2/ticker/t${symbol}`, 7000);
      if (!Array.isArray(j) || j.length < 10) throw new Error("bitfinex ticker");
      return { price:+j[7], pct24: j[6] != null ? +j[6]*100 : null, dayHigh:+j[8], dayLow:+j[9] };
    }
  }
};

/* Ordered per-pair chain: [providerId, [candidate symbols...]] — GOLD ONLY */
const FEED_CHAINS = {
  XAUUSD: [
    ["kraken",  ["PAXGUSD"]],
    ["okx",     ["XAUT-USDT"]],
    ["kucoin",  ["XAUT-USDT"]],
    ["binance", ["XAUTUSDT", "PAXGUSDT"]],
    ["bybit",   ["XAUTUSDT", "PAXGUSDT"]],
    ["bitfinex",["XAUT:USD"]]
  ]
};

/* ============================================================
   FEED controller
   ============================================================ */
const FEED = {
  mode: "connecting",              // "connecting" | "live" | "demo"
  sourcePref: FLS.get("nat_datasrc", "auto"),   // "auto" (real) | "demo"
  pairFeed: {},                    // sym -> { providerId, providerName, symbol, fails }
  lastTick: {},                    // sym -> { price, pct24, dayHigh, dayLow, at }
  lastDataAt: 0,
  _timers: [], _ws: null, _wsTries: 0, _probing: false, _firstLiveShown: false,

  providers(){ return FEED_PROVIDERS; },

  pairLive(sym){ return !!this.pairFeed[sym]; },
  providerName(sym){ const p = this.pairFeed[sym]; return p ? p.providerName : ""; },
  providerNames(){
    const ns = Object.values(this.pairFeed).map(p => p.providerName);
    return [...new Set(ns)].join(" + ");
  },
  ageSec(){ return this.lastDataAt ? Math.max(0, Math.round((Date.now() - this.lastDataAt)/1000)) : null; },

  /* ---------- boot ---------- */
  init(){
    if (this.sourcePref === "demo"){ this.mode = "demo"; return; }
    this.mode = "connecting";
    this.probeAll().then(() => {
      if (Object.keys(this.pairFeed).length){
        this.mode = "live";
        this.refreshAllSeries();
        this.pollTickers();
        this.startLoops();
        this.tryWebSocket();
        this.announce(true);
      } else {
        this.mode = "demo";
        this.announce(false);
      }
    });
  },

  async probeAll(){
    this._probing = true;
    for (const sym of Object.keys(FEED_CHAINS)){
      for (const [pid, symbols] of FEED_CHAINS[sym]){
        for (const symbol of symbols){
          try {
            const prov = FEED_PROVIDERS[pid];
            const test = await prov.candles(symbol, 3600, 40);
            if (test && test.length >= 30 && test[test.length-1].c > 0){
              this.pairFeed[sym] = { providerId: pid, providerName: prov.name, symbol, fails: 0 };
              break;
            }
          } catch(e){ /* next candidate */ }
        }
        if (this.pairFeed[sym]) break;
      }
    }
    this._probing = false;
  },

  /* ---------- series ---------- */
  requestSeries(sym, tfSec){
    if (!this.pairLive(sym)) return;
    const pf = this.pairFeed[sym];
    FEED_PROVIDERS[pf.providerId].candles(pf.symbol, tfSec, 340).then(arr => {
      const M = (typeof Market !== "undefined") ? Market[sym] : null;
      if (!M || !M.series[tfSec]) return;
      M.series[tfSec].splice(0, M.series[tfSec].length, ...arr);
      M.real = true;
      this.lastDataAt = Date.now();
      pf.fails = 0;
      if (typeof State !== "undefined"){ State.analysisAt = 0; }   // force re-analysis
      this.saveCache(sym, tfSec, arr);
    }).catch(() => { pf.fails = (pf.fails||0) + 1; this.maybeFailover(sym); });
  },

  refreshAllSeries(){
    for (const sym of Object.keys(this.pairFeed)){
      const M = (typeof Market !== "undefined") ? Market[sym] : null;
      if (!M) continue;
      for (const tf of Object.keys(M.series)) this.requestSeries(sym, +tf);
    }
    this.lastDataAt = Date.now();
  },

  /* ---------- ticks ---------- */
  applyTick(sym, tk){
    const M = (typeof Market !== "undefined") ? Market[sym] : null;
    if (!M) return;
    this.lastTick[sym] = { ...tk, at: Date.now() };
    if (tk.price > 0){
      const prevHigh = M.last ? M.last.dayHigh : -Infinity;
      const prevLow  = M.last ? M.last.dayLow  : Infinity;
      /* explicit 24h high/low from the exchange wins; otherwise keep/extend */
      const hi = (tk.dayHigh && tk.dayHigh > 0) ? Math.max(tk.dayHigh, tk.price)
                : (isFinite(prevHigh) ? Math.max(prevHigh, tk.price) : tk.price);
      const lo = (tk.dayLow && tk.dayLow > 0) ? Math.min(tk.dayLow, tk.price)
                : (isFinite(prevLow) ? Math.min(prevLow, tk.price) : tk.price);
      M.last = { price: tk.price, dayHigh: hi, dayLow: lo, pct24: tk.pct24 };
      for (const k of Object.keys(M.series)){
        const s = M.series[k]; const last = s[s.length-1];
        if (!last) continue;
        last.c = tk.price;
        last.h = Math.max(last.h, tk.price);
        last.l = Math.min(last.l, tk.price);
      }
      this.lastDataAt = Date.now();
      if (typeof State !== "undefined"){ State.analysisAt = 0; }
    }
  },

  async pollTickers(){
    for (const sym of Object.keys(this.pairFeed)){
      const pf = this.pairFeed[sym];
      try {
        const tk = await FEED_PROVIDERS[pf.providerId].ticker(pf.symbol);
        if (tk && tk.price > 0){ this.applyTick(sym, tk); pf.fails = 0; }
      } catch(e){ pf.fails = (pf.fails||0) + 1; this.maybeFailover(sym); }
    }
  },

  maybeFailover(sym){
    const pf = this.pairFeed[sym];
    if (!pf || (pf.fails||0) < 4 || this._probing) return;
    // drop this provider and re-probe the chain (excluding current)
    delete this.pairFeed[sym];
    const chain = FEED_CHAINS[sym].filter(([pid]) => pid !== pf.providerId);
    (async () => {
      for (const [pid, symbols] of chain){
        for (const symbol of symbols){
          try {
            const test = await FEED_PROVIDERS[pid].candles(symbol, 3600, 40);
            if (test && test.length >= 30){
              this.pairFeed[sym] = { providerId: pid, providerName: FEED_PROVIDERS[pid].name, symbol, fails: 0 };
              this.requestSeries(sym, 300);
              const M = (typeof Market !== "undefined") ? Market[sym] : null;
              if (M) for (const tf of Object.keys(M.series)) this.requestSeries(sym, +tf);
              if (typeof FEED_UI !== "undefined" && FEED_UI.onSwitch) FEED_UI.onSwitch(sym, FEED_PROVIDERS[pid].name);
              return;
            }
          } catch(e){}
        }
      }
      // nothing works → this pair falls back to demo simulation
      if (Object.keys(this.pairFeed).length === 0){
        this.mode = "demo"; this.stopLoops();
        if (typeof FEED_UI !== "undefined" && FEED_UI.onDemo) FEED_UI.onDemo();
      }
    })();
  },

  /* ---------- loops ---------- */
  startLoops(){
    this.stopLoops();
    this._timers.push(setInterval(() => this.pollTickers(), 9000));
    this._timers.push(setInterval(() => this.refreshAllSeries(), 60000));
    try {
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && this.mode === "live"){ this.pollTickers(); this.refreshAllSeries(); }
      });
    } catch(e){}
  },
  stopLoops(){
    this._timers.forEach(clearInterval); this._timers = [];
    if (this._ws){ try { this._ws.close(); } catch(e){} this._ws = null; }
  },

  /* ---------- optional websocket (Binance miniTicker, tick-level feel) ---------- */
  tryWebSocket(){
    if (this._ws || this._wsTries >= 3) return;
    const bn = Object.entries(this.pairFeed).filter(([,p]) => p.providerId === "binance");
    if (!bn.length) return;
    const streams = bn.map(([sym, p]) => p.symbol.toLowerCase() + "@miniTicker").join("/");
    const hosts = ["wss://data-stream.binance.vision:9443", "wss://stream.binance.com:9443"];
    const open = (hi) => {
      if (hi >= hosts.length){ this._wsTries++; return; }
      let ws;
      try { ws = new WebSocket(hosts[hi] + "/stream?streams=" + streams); } catch(e){ this._wsTries++; return; }
      const kill = setTimeout(() => { try { ws.close(); } catch(e){} }, 6000);
      ws.onopen = () => { clearTimeout(kill); this._ws = ws; this._wsTries = 0; };
      ws.onmessage = (ev) => {
        try {
          const m = JSON.parse(ev.data); const d = m.data || m;
          if (!d || !d.s) return;
          for (const [sym, p] of bn){
            if (p.symbol === d.s){
              this.applyTick(sym, { price:+d.c, pct24: d.o ? (+d.c - +d.o)/+d.o*100 : null, dayHigh:+d.h || null, dayLow:+d.l || null });
            }
          }
        } catch(e){}
      };
      ws.onclose = () => { if (this._ws === ws) this._ws = null; };
      ws.onerror = () => { try { ws.close(); } catch(e){} open(hi + 1); };
    };
    open(0);
  },

  /* ---------- localStorage candle cache (instant real data on reload) ---------- */
  saveCache(sym, tfSec, arr){
    try {
      const c = FLS.get("nat_candles_v1", {});
      c[sym + "_" + tfSec] = { at: Date.now(), src: this.pairFeed[sym] ? this.pairFeed[sym].providerName : "", data: arr.slice(-300) };
      const keys = Object.keys(c);
      if (keys.length > 24){ keys.sort((a,b) => (c[a].at||0) - (c[b].at||0)); for (let i=0;i<keys.length-24;i++) delete c[keys[i]]; }
      FLS.set("nat_candles_v1", c);
    } catch(e){}
  },
  hydrate(sym, tfSec){
    try {
      const c = FLS.get("nat_candles_v1", {})[sym + "_" + tfSec];
      if (!c || !c.data || !c.data.length) return null;
      if (Date.now() - c.at > 6*3600000) return null;           // stale → demo gen instead
      if (c.data[c.data.length-1].c <= 0) return null;
      return c.data;
    } catch(e){ return null; }
  },

  /* ---------- manual source switch ---------- */
  setSource(pref){
    this.sourcePref = pref;
    FLS.set("nat_datasrc", pref);
    if (pref === "demo"){
      this.stopLoops(); this.pairFeed = {}; this.mode = "demo";
      if (typeof FEED_UI !== "undefined" && FEED_UI.onDemo) FEED_UI.onDemo(true);
    } else {
      this.mode = "connecting"; this.pairFeed = {}; this._firstLiveShown = false;
      this.init();
    }
  },

  announce(ok){
    if (typeof FEED_UI === "undefined") return;
    if (ok && FEED_UI.onLive) FEED_UI.onLive(this.providerNames());
    if (!ok && FEED_UI.onDemo) FEED_UI.onDemo();
  }
};

/* UI hooks — assigned by ui.js (kept optional so this file stays DOM-free & testable) */
const FEED_UI = { onLive: null, onDemo: null, onSwitch: null };
