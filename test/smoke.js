#!/usr/bin/env node
/* Noor Ahmad Trader v1.2 — smoke test (no browser needed).
   Loads the app scripts in one scope (like the built index.html does),
   stubs fetch with Kraken-shaped fixtures, and verifies:
   gold-only · 5 TFs + TF_PROFILES · FEED_CHAINS · ATR entries · ticks · fallback. */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const files = ["i18n.js", "sim.js", "feeds.js", "chart.js", "chat.js", "ui.js", "pages.js"];
let code = files.map(f => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n;\n");

/* ---------- fixtures ---------- */
function genCandles(n, tfSec, startPrice){
  const out = []; let p = startPrice;
  const now = Math.floor(Date.now() / (tfSec * 1000)) * tfSec;
  for (let i = n - 1; i >= 0; i--){
    const t = (now - i * tfSec);
    const o = p;
    const c = p * (1 + (Math.sin(i * 1.7) + Math.random() - 0.5) * 0.004);
    const h = Math.max(o, c) * 1.0015, l = Math.min(o, c) * 0.9985;
    out.push({ t: t * 1000, o, h, l, c, v: 10 + Math.random() * 90 });
    p = c;
  }
  return out;
}
const krakenOHLC = {};
[300, 900, 3600, 14400, 86400].forEach(tf => krakenOHLC[tf] = genCandles(700, tf, 4400 + Math.random() * 100));

const fixture = (url) => {
  if (url.includes("api.kraken.com/0/public/OHLC")){
    const m = url.match(/interval=(\d+)/); const iv = m ? +m[1] : 60;
    const tfSec = { 5:300, 15:900, 60:3600, 240:14400, 1440:86400 }[iv] || 3600;
    const rows = krakenOHLC[tfSec].map(c => [c.t/1000, String(c.o), String(c.h), String(c.l), String(c.c), String(c.c), String(c.v), 42]);
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ error: [], result: { PAXGUSD: rows } }) });
  }
  if (url.includes("api.kraken.com/0/public/Ticker")){
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ error: [], result: { PAXGUSD: {
      a:["4500.1","1","1.000"], b:["4499.9","1","1.000"], c:["4500.0","0.5"],
      v:["100","150"], p:["4450","4440"], t:[10,20], l:["4400.0","4400.0"], h:["4510.0","4510.0"], o:"4420.0"
    }}}) });
  }
  return Promise.reject(new Error("network blocked for " + url));
};

const global_fetch = global.fetch;
global.fetch = (url) => fixture(String(url));
const _mem = new Map();
global.localStorage = {
  getItem: k => (_mem.has(k) ? _mem.get(k) : null),
  setItem: (k, v) => _mem.set(k, String(v)),
  removeItem: k => _mem.delete(k)
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

let failures = 0;
const ok = (cond, name) => { console.log((cond ? "  ✓ " : "  ✗ ") + name); if (!cond) failures++; };

(async () => {
  const sandbox = eval("(async () => {" + code + "\n; return { FEED, FEED_UI, PAIRS, Market, ensureSeries, tickMarket, analyze, TFS, TF_PROFILES, State, seedHistory, atr, FEED_CHAINS, APP_VERSION, mt5Lots, mt5Points, pickEntry }; })()");
  const app = await sandbox;

  console.log("1) gold-only + version 1.2");
  ok(app.APP_VERSION === "1.2" && Object.keys(app.PAIRS).length === 1 && !!app.PAIRS.XAUUSD, "version 1.2 + PAIRS has only XAUUSD");
  ok(!app.PAIRS.EURUSD, "EURUSD removed");

  console.log("2) five timeframes + TF_PROFILES + FEED_CHAINS");
  const labels = Object.values(app.TFS);
  ok(Object.keys(app.TFS).length === 5 && ["1D","4H","1H","15M","5M"].every(x => labels.includes(x)), "TFS is 1D, 4H, 1H, 15M, 5M");
  ok(Object.keys(app.TFS).every(tf => app.TF_PROFILES[+tf] && app.TF_PROFILES[+tf].slAtr > 0), "TF_PROFILES covers every TF");
  const chain = (app.FEED_CHAINS.XAUUSD || []).map(x => x[0]).join(",");
  ok(chain === "kraken,okx,kucoin,binance,bybit,bitfinex", "FEED_CHAINS Kraken→OKX→KuCoin→Binance→Bybit→Bitfinex");

  console.log("3) provider probe (Kraken fixture)");
  app.FEED.sourcePref = "auto";
  await app.FEED.probeAll();
  ok(app.FEED.pairLive("XAUUSD"), "XAUUSD resolved to a live provider");
  ok(app.FEED.pairFeed.XAUUSD.providerId === "kraken", "provider is kraken");
  ok(app.FEED.pairFeed.XAUUSD.symbol === "PAXGUSD", "symbol is PAXGUSD");

  console.log("4) real series load (1H + 4H)");
  app.ensureSeries("XAUUSD", 3600);
  app.ensureSeries("XAUUSD", 14400);
  await sleep(400);
  ok(app.Market.XAUUSD.series[3600].length > 100, "1H series loaded (" + app.Market.XAUUSD.series[3600].length + " candles)");
  ok(app.Market.XAUUSD.series[14400].length > 30, "4H series loaded (" + app.Market.XAUUSD.series[14400].length + " candles)");
  ok(app.Market.XAUUSD.real === true, "Market flagged real");

  console.log("5) live ticks");
  await app.FEED.pollTickers();
  ok(Math.abs(app.Market.XAUUSD.last.price - 4500.0) < 0.01, "ticker price applied (4500.0)");
  ok(Math.abs(app.Market.XAUUSD.last.dayHigh - 4510.0) < 0.01, "24h high applied");
  const lastBefore = app.Market.XAUUSD.series[3600][app.Market.XAUUSD.series[3600].length - 1].c;
  app.tickMarket();
  const lastAfter = app.Market.XAUUSD.series[3600][app.Market.XAUUSD.series[3600].length - 1].c;
  ok(lastBefore === lastAfter, "simulator does not fight live feed");

  console.log("6) ICT analysis + ATR + MT5 lots");
  const a = app.analyze("XAUUSD", 3600);
  ok(a.price > 0, "analysis price > 0 (" + a.price.toFixed(2) + ")");
  ok(a.signal && typeof a.signal.conf === "number", "signal produced (conf " + a.signal.conf + "%)");
  const av = app.atr(app.Market.XAUUSD.series[3600], 14);
  const lotsOk = Math.abs(app.mt5Lots(100, 1000) - 0.10) < 1e-9;
  ok(av > 0 && lotsOk, "atr() > 0 (" + av.toFixed(2) + ") + MT5 1 lot = 100 oz / $1 per point");

  console.log("7) demo fallback when network dies");
  global.fetch = () => Promise.reject(new Error("offline"));
  app.FEED.pairFeed.XAUUSD.fails = 4;
  await app.FEED.maybeFailover("XAUUSD");
  await sleep(900);
  ok(!app.FEED.pairLive("XAUUSD") || app.FEED.mode === "demo", "pair dropped to demo when offline");

  console.log("8) cache hydrate");
  app.FEED.saveCache("XAUUSD", 3600, app.Market.XAUUSD.series[3600]);
  const hyd = app.FEED.hydrate("XAUUSD", 3600);
  ok(hyd && hyd.length > 100, "candle cache round-trips (" + (hyd ? hyd.length : 0) + ")");

  console.log(failures ? "\nFAILED: " + failures : "\nALL TESTS PASSED ✅");
  global.fetch = global_fetch;
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error("SMOKE CRASH:", e); global.fetch = global_fetch; process.exit(1); });
