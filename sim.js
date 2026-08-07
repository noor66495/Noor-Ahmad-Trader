/* ============ Noor Ahmad Trader — Market Engine & ICT Analysis ============ */
/* Demo market simulator + ICT analysis engine. Replace `priceSource` with a
   real API (TwelveData / AlphaVantage / Binance PAXG etc.) for live data. */

/* ---------- Seeded RNG ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function rngFor(seed){
  const r = mulberry32(seed);
  return {
    next: () => r(),
    range: (a,b) => a + (b-a)*r(),
    gauss: () => { let u=0,v=0; while(!u) u=r(); while(!v) v=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); },
    pick: arr => arr[Math.floor(r()*arr.length)]
  };
}

/* ---------- Constants ---------- */
const PAIRS = {
  XAUUSD: { name:"XAU/USD", base: 3548.0, vol: 0.0009, pip: 0.10, dec: 2, seed: 101 },
  EURUSD: { name:"EUR/USD", base: 1.1462, vol: 0.00035, pip: 0.0001, dec: 5, seed: 202 }
};
const TFS = {
  86400:"1D", 14400:"4H", 10800:"3H", 7200:"2H", 3600:"1H", 1800:"30M", 900:"15M", 300:"5M"
};
const fmtNum = (n, dec) => n.toLocaleString("en-US", {minimumFractionDigits:dec, maximumFractionDigits:dec});
const fmtPct = n => (n>=0?"+":"") + n.toFixed(2) + "%";

/* ---------- Candle series generation (historical) ---------- */
function genSeries(sym, tfSec, count=340){
  const P = PAIRS[sym];
  const R = rngFor(P.seed * 100000 + tfSec);
  let price = P.base * (1 + R.range(-0.05, 0.05));
  const v = P.vol * Math.sqrt(tfSec/300);
  const out = [];
  let t = Date.now() - tfSec * count;
  let regime = R.pick([-1,0,0,1,1]);
  let regimeLeft = Math.floor(R.range(8, 42));
  for (let i=0;i<count;i++){
    if (--regimeLeft <= 0){ regime = R.pick([-1,-1,0,0,1,1,1]); regimeLeft = Math.floor(R.range(8,48)); }
    const drift = regime*0.34 + R.gauss()*0.5;
    const move = price * drift * v;
    const o = price;
    const c = price + move;
    const wick = Math.abs(R.gauss()) * price * v * 0.9;
    const h = Math.max(o,c) + wick * R.range(0.15, 1);
    const l = Math.min(o,c) - wick * R.range(0.15, 1);
    out.push({ t, o, h, l, c, v: Math.floor(R.range(120, 9500)) });
    price = c;
    t += tfSec;
  }
  return out;
}

/* ---------- Market state ---------- */
const Market = { XAUUSD: { series: {}, last:null }, EURUSD: { series: {}, last:null } };
let tickCount = 0;

function ensureSeries(sym, tfSec){
  const M = Market[sym];
  if (!M.series[tfSec]) {
    const s = genSeries(sym, tfSec);
    M.series[tfSec] = s;
    M.last = { price: s[s.length-1].c, dayHigh: -Infinity, dayLow: Infinity };
    for (let i=Math.max(0,s.length-288); i<s.length; i++){
      M.last.dayHigh = Math.max(M.last.dayHigh, s[i].h);
      M.last.dayLow = Math.min(M.last.dayLow, s[i].l);
    }
  }
  return M.series[tfSec];
}

/* Advance the market one tick (called ~every 1.4s). Updates the 5M series
   (used for sparklines) and any series currently viewed. */
function tickMarket(){
  tickCount++;
  for (const sym of Object.keys(PAIRS)){
    const P = PAIRS[sym];
    const M = Market[sym];
    const tf = 300; // 5M base series always live
    const s = ensureSeries(sym, tf);
    const last = s[s.length-1];
    const v = P.vol * Math.sqrt(tf/300);
    // random walk with slight mean reversion to keep price sane
    const drift = (P.base - last.c)/P.base * 0.004 + (Math.random()-0.5)*0.05;
    const move = last.c * drift * v * 3;
    const c = last.c + move;
    // every ~4 ticks push a new 5M candle
    if (tickCount % 4 === 0){
      s.push({ t: last.t + tf, o: last.c, h: Math.max(last.c,c), l: Math.min(last.c,c), c, v: Math.floor(Math.random()*9000+500) });
      if (s.length > 700) s.splice(0, 100);
    } else {
      last.c = c; last.h = Math.max(last.h, c); last.l = Math.min(last.l, c);
    }
    M.last = {
      price: c,
      dayHigh: Math.max(M.last ? M.last.dayHigh : -Infinity, last.h),
      dayLow: Math.min(M.last ? M.last.dayLow : Infinity, last.l)
    };
    // also update other generated series: append synthetic candle occasionally
    for (const k of Object.keys(M.series)){
      if (k === tf) continue;
      const ss = M.series[k];
      const l2 = ss[ss.length-1];
      const nv = l2.c * (Math.random()-0.5) * P.vol * Math.sqrt(k/300) * 0.4;
      ss[ss.length-1] = { ...l2, c: l2.c + nv*0.3, h: Math.max(l2.h, l2.c+nv*0.3), l: Math.min(l2.l, l2.c+nv*0.3) };
    }
  }
}

/* ---------- Swing points ---------- */
function findSwings(candles, k=2){
  const s = [];
  for (let i=k;i<candles.length-k;i++){
    let isH=true, isL=true;
    for (let j=1;j<=k;j++){
      if (!(candles[i].h > candles[i-j].h && candles[i].h >= candles[i+j].h)) isH=false;
      if (!(candles[i].l < candles[i-j].l && candles[i].l <= candles[i+j].l)) isL=false;
    }
    if (isH) s.push({type:"H", i, p: candles[i].h});
    if (isL) s.push({type:"L", i, p: candles[i].l});
  }
  return s;
}

/* ---------- Structure / BOS / CHoCH ---------- */
function analyzeStructure(candles, swings){
  const last = candles[candles.length-1];
  const up = swings.filter(s=>s.type==="H");
  const dn = swings.filter(s=>s.type==="L");
  const u = up.slice(-3), d = dn.slice(-3);
  let trend = 0, seq = [];
  if (u.length>=2 && d.length>=2){
    const hh = u[u.length-1].p > u[u.length-2].p;
    const hl = d[d.length-1].p > d[d.length-2].p;
    const lh = u[u.length-1].p < u[u.length-2].p;
    const ll = d[d.length-1].p < d[d.length-2].p;
    if (hh && hl){ trend = 1; seq = ["HH","HL"]; }
    else if (lh && ll){ trend = -1; seq = ["LH","LL"]; }
    else { trend = 0; seq = [u[u.length-1].p>=u[u.length-2].p?"HH":"LH", d[d.length-1].p<=d[d.length-2].p?"LL":"HL"]; }
  } else if (u.length && d.length){
    trend = last.c > u[u.length-1].p ? 1 : (last.c < d[d.length-1].p ? -1 : 0);
  }
  // BOS: in trend, close beyond the last swing extreme
  let bos = { dir: 0, price: null };
  if (trend === 1 && u.length){ const ref = u[u.length-1].p; if (last.c > ref){ bos = { dir: 1, price: ref }; } }
  if (trend === -1 && d.length){ const ref = d[d.length-1].p; if (last.c < ref){ bos = { dir: -1, price: ref }; } }
  // CHoCH: opposite break of last swing
  let choch = { dir: 0, price: null };
  if (trend === 1 && d.length){ const ref = d[d.length-1].p; if (last.c < ref){ choch = { dir: -1, price: ref }; } }
  if (trend === -1 && u.length){ const ref = u[u.length-1].p; if (last.c > ref){ choch = { dir: 1, price: ref }; } }
  // structure seq of last 5 swings for display
  const allS = swings.slice(-6).map(s=> s.type==="H" ? "H" : "L");
  return { trend, seq, bos, choch, allS, lastSwingHigh: u.length ? u[u.length-1].p : null, lastSwingLow: d.length ? d[d.length-1].p : null };
}

/* ---------- Liquidity (equal highs/lows) ---------- */
function clusterEqual(prices, tol){
  const groups = [];
  for (const p of prices.sort((a,b)=>a-b)){
    let placed = false;
    for (const g of groups){ if (Math.abs(g.avg - p) <= tol){ g.items.push(p); g.avg = g.items.reduce((a,b)=>a+b,0)/g.items.length; placed = true; break; } }
    if (!placed) groups.push({ items:[p], avg:p });
  }
  return groups.filter(g => g.items.length >= 2);
}
function analyzeLiquidity(candles, swings, sym){
  const tol = sym==="XAUUSD" ? 0.0016 : 0.0007;
  const last = candles[candles.length-1];
  const highs = swings.filter(s=>s.type==="H").map(s=>s.p);
  const lows = swings.filter(s=>s.type==="L").map(s=>s.p);
  const eqHighs = clusterEqual(highs, tol*last.c).map(g=>({price:g.avg, count:g.items.length}));
  const eqLows = clusterEqual(lows, tol*last.c).map(g=>({price:g.avg, count:g.items.length}));
  const buyAbove0 = eqHighs.filter(g=>g.price > last.c).sort((a,b)=>a.price-b.price)[0] || null; // nearest above
  const sellBelow0 = eqLows.filter(g=>g.price < last.c).sort((a,b)=>b.price-a.price)[0] || null; // nearest below
  // nearest swing liquidity
  let buyAbove = buyAbove0, sellBelow = sellBelow0;
  const sh = highs[highs.length-1], sl = lows[lows.length-1];
  if (!buyAbove && sh && sh > last.c) buyAbove = { price: sh, count: 1, swing:true };
  if (!sellBelow && sl && sl < last.c) sellBelow = { price: sl, count: 1, swing:true };
  // sweep detection (last 40 candles): wick beyond level, close back inside
  let sweep = null;
  const look = candles.slice(-40);
  for (const liq of [{side:"buy", p: buyAbove ? buyAbove.price : null}, {side:"sell", p: sellBelow ? sellBelow.price : null}]){
    if (!liq.p) continue;
    for (const c of look){
      if (liq.side==="buy" && c.h > liq.p && c.c < liq.p){ sweep = { side:"buy", price: liq.p, time: c.t }; break; }
      if (liq.side==="sell" && c.l < liq.p && c.c > liq.p){ sweep = { side:"sell", price: liq.p, time: c.t }; break; }
    }
    if (sweep) break;
  }
  return { eqHighs, eqLows, buyAbove, sellBelow, sweep };
}

/* ---------- FVG / Inverse FVG ---------- */
function analyzeFVG(candles){
  const fvgs = [], invs = [];
  for (let i=1;i<candles.length-1;i++){
    const a = candles[i-1], b = candles[i], c = candles[i+1];
    if (c.l > a.h){ // bullish FVG: gap between a.h and c.l
      let status = "open", lo = a.h, hi = c.l;
      for (let j=i+2;j<candles.length;j++){
        if (candles[j].l <= lo){ status = "mitigated"; break; }
        if (candles[j].l < hi){ status = "partial"; }
      }
      fvgs.push({ dir:1, lo, hi, i, status });
    }
    if (c.h < a.l){ // bearish FVG
      let status = "open", lo = c.h, hi = a.l;
      for (let j=i+2;j<candles.length;j++){
        if (candles[j].h >= hi){ status = "mitigated"; break; }
        if (candles[j].h > lo){ status = "partial"; }
      }
      invs.push({ dir:-1, lo, hi, i, status });
    }
  }
  return { fvgs: fvgs.slice(-3), invs: invs.slice(-3) };
}

/* ---------- Order blocks / breaker / mitigation ---------- */
function analyzeOrderBlocks(candles){
  const bodies = candles.slice(-60).map(c=>Math.abs(c.c-c.o));
  const avgBody = bodies.reduce((a,b)=>a+b,0)/Math.max(1,bodies.length);
  const obs = [];
  for (let i=Math.max(1,candles.length-80); i<candles.length-1; i++){
    const disp = candles[i], prev = candles[i-1];
    const body = Math.abs(disp.c-disp.o);
    if (body > 1.6*avgBody){
      const dir = disp.c > disp.o ? 1 : -1;
      const zone = { lo: Math.min(prev.o,prev.c), hi: Math.max(prev.o,prev.c), dir, i, kind:"order" };
      // check sweep/breaker: price later swept zone low (bull) and returned inside
      let swept = false, reentered = false, partial = false;
      for (let j=i+1;j<candles.length;j++){
        const c = candles[j];
        if (dir===1 && c.l < zone.lo) swept = true;
        if (dir===-1 && c.h > zone.hi) swept = true;
        if (swept && dir===1 && c.l < zone.hi) reentered = true;
        if (swept && dir===-1 && c.h > zone.lo) reentered = true;
        if (!swept && dir===1 && c.l < zone.hi) partial = true;
        if (!swept && dir===-1 && c.h > zone.lo) partial = true;
      }
      if (swept && reentered) zone.kind = "breaker";
      else if (partial) zone.kind = "mitigation";
      obs.push(zone);
      i += 2;
    }
  }
  return obs.slice(-3);
}

/* ---------- Premium/Discount & OTE ---------- */
function analyzeRange(candles){
  const look = candles.slice(-140);
  const hi = Math.max(...look.map(c=>c.h));
  const lo = Math.min(...look.map(c=>c.l));
  const mid = (hi+lo)/2;
  const last = candles[candles.length-1].c;
  const pos = (last-lo)/(hi-lo); // 0..1 (0=discount extreme)
  return { hi, lo, mid, pos, zone: pos > 0.5 ? "premium" : "discount" };
}
function analyzeOTE(candles, swings){
  const sw = swings.slice(-4);
  if (sw.length < 2) return { inZone:false, lo:0, hi:0, dir:0 };
  // last impulse leg = between last two opposite swings
  const a = sw[sw.length-2], b = sw[sw.length-1];
  if (a.type === b.type) return { inZone:false, lo:0, hi:0, dir:0 };
  const dir = (b.type==="L") ? 1 : -1; // L after H => up leg
  let lo = Math.min(a.p, b.p), hi = Math.max(a.p, b.p);
  const range = hi - lo;
  let oteLo, oteHi;
  if (dir === 1){ oteLo = hi - 0.79*range; oteHi = hi - 0.618*range; }
  else { oteLo = lo + 0.618*range; oteHi = lo + 0.79*range; }
  const last = candles[candles.length-1].c;
  const inZone = last >= oteLo && last <= oteHi;
  return { inZone, lo: oteLo, hi: oteHi, dir, legLo:lo, legHi:hi };
}

/* ---------- Sessions / Kill zones (ET) ---------- */
function etParts(){
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone:"America/New_York", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false, weekday:"short" });
  const parts = fmt.formatToParts(now);
  const get = type => parts.find(p=>p.type===type).value;
  let h = parseInt(get("hour")); const m = parseInt(get("minute")); const s = parseInt(get("second"));
  if (h===24) h=0;
  const minutes = h*60 + m + s/60;
  return { h, m, s, minutes, label: get("weekday") + " " + String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+":"+String(s).padStart(2,"0"), now };
}
function sessions(){
  const { minutes, label } = etParts();
  const zones = [
    { id:"asian",   s:0*60,     e:4*60,     labelKey:"sAsian"  },
    { id:"london",  s:2*60,     e:5*60,     labelKey:"sLondon" },
    { id:"ny",      s:7*60,     e:10*60,    labelKey:"sNy"     }
  ];
  return zones.map(z => {
    const active = minutes >= z.s && minutes < z.e;
    let nextStart = z.s, nextEnd = z.e;
    if (minutes >= z.e){ nextStart = z.s + 1440; nextEnd = z.e + 1440; }
    else if (minutes >= z.s){ nextEnd = z.e; }
    const minsToStart = active ? 0 : nextStart - minutes;
    const minsToEnd = active ? z.e - minutes : nextEnd - minutes;
    return { ...z, active, minsToStart, minsToEnd, label: t(z.labelKey) };
  });
}

/* ---------- Higher-TF biases ---------- */
function ema(arr, n){
  const k = 2/(n+1); let e = arr[0]; const out=[e];
  for (let i=1;i<arr.length;i++){ e = arr[i]*k + e*(1-k); out.push(e); }
  return out;
}
function biasFromSeries(candles, look){
  const slice = candles.slice(-look);
  const closes = slice.map(c=>c.c);
  const e = ema(closes, Math.max(3, Math.floor(look/4)));
  const lastE = e[e.length-1], prevE = e[Math.floor(e.length*0.6)];
  const last = closes[closes.length-1];
  let dir = 0;
  if (last > lastE && lastE > prevE) dir = 1;
  else if (last < lastE && lastE < prevE) dir = -1;
  return dir;
}
function higherBiases(sym){
  const d1 = ensureSeries(sym, 86400);
  return {
    monthly: biasFromSeries(d1, 30),
    weekly: biasFromSeries(d1, 12),
    daily: biasFromSeries(d1, 5)
  };
}

/* ---------- Full ICT analysis ---------- */
function analyze(sym, tfSec){
  const candles = ensureSeries(sym, tfSec);
  const P = PAIRS[sym];
  const sw = findSwings(candles);
  const structure = analyzeStructure(candles, sw);
  const liq = analyzeLiquidity(candles, sw, sym);
  const fvg = analyzeFVG(candles);
  const obs = analyzeOrderBlocks(candles);
  const range = analyzeRange(candles);
  const ote = analyzeOTE(candles, sw);
  const sess = sessions();
  const biases = higherBiases(sym);
  const last = candles[candles.length-1];
  const price = last.c;

  /* ---- Composite signal scoring ---- */
  let score = 0;
  const reasons = []; // {dir, text}
  const tfName = TFS[tfSec];
  const push = (dir, txt) => reasons.push({ dir, text: txt });
  const align = d => d===1 ? "up" : (d===-1 ? "down" : "flat");

  if (structure.trend === 1){ score += 1.3; push(1, t("rTrendUp",{tf:tfName})); }
  if (structure.trend === -1){ score -= 1.3; push(-1, t("rTrendDown",{tf:tfName})); }
  if (structure.bos.dir === 1){ score += 0.8; push(1, t("rBosUp",{p:fmtNum(structure.bos.price,P.dec)})); }
  if (structure.bos.dir === -1){ score -= 0.8; push(-1, t("rBosDown",{p:fmtNum(structure.bos.price,P.dec)})); }
  if (structure.choch.dir === 1){ score += 1.1; push(1, t("rChochUp")); }
  if (structure.choch.dir === -1){ score -= 1.1; push(-1, t("rChochDown")); }

  const openFvg = fvg.fvgs.find(f=>f.status==="open" || f.status==="partial");
  if (openFvg && openFvg.dir===1){ score += 0.7; push(1, t("rFvgUp",{p:fmtNum(openFvg.hi,P.dec)})); }
  const openInv = fvg.invs.find(f=>f.status==="open" || f.status==="partial");
  if (openInv && openInv.dir===-1){ score -= 0.7; push(-1, t("rFvgDown",{p:fmtNum(openInv.lo,P.dec)})); }

  const lastOb = obs[obs.length-1];
  if (lastOb){ if (lastOb.dir===1){ score += 0.6; push(1, lastOb.kind==="breaker" ? t("rBreaker",{p:fmtNum(lastOb.hi,P.dec)}) : t("rObUp",{p:fmtNum(lastOb.lo,P.dec)})); }
    else { score -= 0.6; push(-1, lastOb.kind==="breaker" ? t("rBreaker",{p:fmtNum(lastOb.lo,P.dec)}) : t("rObDown",{p:fmtNum(lastOb.hi,P.dec)})); } }
  if (obs.some(o=>o.kind==="mitigation")) push(lastOb && lastOb.dir===1?1:-1, t("rMit",{p:fmtNum(lastOb.hi,P.dec)}));

  if (liq.sweep){ if (liq.sweep.side==="sell"){ score += 0.9; push(1, t("rSweepSell",{p:fmtNum(liq.sweep.price,P.dec)})); }
    else { score -= 0.9; push(-1, t("rSweepBuy",{p:fmtNum(liq.sweep.price,P.dec)})); } }
  if (liq.eqHighs.length && !liq.sweep){ push(-0.5, t("rEqH",{p:fmtNum(liq.eqHighs[0].price,P.dec)})); }
  if (liq.eqLows.length && !liq.sweep){ push(0.5, t("rEqL",{p:fmtNum(liq.eqLows[0].price,P.dec)})); }

  if (range.zone === "discount"){ score += 0.55; push(1, t("rDisc")); }
  else { score -= 0.55; push(-1, t("rPrem")); }
  if (ote.inZone){ score += (ote.dir===1?0.5:-0.5); push(ote.dir, t("rOte",{p:fmtNum(ote.lo,P.dec)+"–"+fmtNum(ote.hi,P.dec)})); }

  if (biases.daily===1 && score>0){ score += 0.5; push(1, t("rBiasUp",{tf:"D1"})); }
  if (biases.daily===-1 && score<0){ score -= 0.5; push(-1, t("rBiasDown",{tf:"D1"})); }
  if (biases.weekly===1 && score>0){ score += 0.4; push(1, t("rBiasUp",{tf:"W1"})); }
  if (biases.weekly===-1 && score<0){ score -= 0.4; push(-1, t("rBiasDown",{tf:"W1"})); }

  const inKz = sess.find(z=>z.active && z.id!=="asian");
  if (inKz){ score += (score>=0?0.4:-0.4); push(score>=0?1:-1, t("rKz",{zone:inKz.label})); }

  const dir = score >= 2.1 ? 1 : (score <= -2.1 ? -1 : 0);
  const conf = Math.round(Math.min(95, Math.max(55, 52 + Math.abs(score)*7.5 + Math.random()*3)));
  if (dir === 0 && reasons.length < 2) push(0, t("rWait"));

  /* ---- Trade setup ---- */
  let setup = null;
  if (dir !== 0){
    const slBuf = price * (sym==="XAUUSD" ? 0.0018 : 0.0012);
    let entry = price, sl, tps;
    if (dir === 1){
      const liqBelow = liq.sellBelow ? liq.sellBelow.price : (structure.lastSwingLow || price - slBuf*3);
      sl = Math.min(liqBelow, price - slBuf) - slBuf*0.4;
      const r = entry - sl;
      const t1 = Math.max(entry + r*1.2, liq.buyAbove ? liq.buyAbove.price : entry + r*1.2);
      tps = [t1, entry + r*2.2, entry + r*3.4];
    } else {
      const liqAbove = liq.buyAbove ? liq.buyAbove.price : (structure.lastSwingHigh || price + slBuf*3);
      sl = Math.max(liqAbove, price + slBuf) + slBuf*0.4;
      const r = sl - entry;
      const t1 = Math.min(entry - r*1.2, liq.sellBelow ? liq.sellBelow.price : entry - r*1.2);
      tps = [t1, entry - r*2.2, entry - r*3.4];
    }
    setup = { dir, entry, sl, tp1: tps[0], tp2: tps[1], tp3: tps[2] };
  }

  return {
    sym, tf: tfSec, price, time: Date.now(),
    structure, liq, fvg, obs, range, ote, sess, biases,
    signal: { dir, conf },
    reasons: reasons.slice(0, 4),
    setup
  };
}

/* ---------- Signal history (seeded) ---------- */
function seedHistory(){
  const R = rngFor(777);
  const out = [];
  const now = Date.now();
  const syms = ["XAUUSD","XAUUSD","EURUSD","XAUUSD","EURUSD","XAUUSD","EURUSD","XAUUSD","XAUUSD","EURUSD","XAUUSD","EURUSD","XAUUSD","EURUSD","XAUUSD"];
  const dirs = [1,1,-1,1,-1,1,1,-1,1,1,-1,1,-1,1,-1];
  const tfs = [3600,900,3600,14400,3600,900,3600,3600,14400,900,3600,3600,900,14400,3600];
  syms.forEach((sym,i)=>{
    const P = PAIRS[sym];
    const d = dirs[i];
    const base = P.base * (1 + R.range(-0.03,0.03));
    const r = base * (sym==="XAUUSD"?0.004:0.002);
    const entry = base;
    const sl = d===1 ? entry - r : entry + r;
    const tps = d===1 ? [entry+r*1.5, entry+r*2.5, entry+r*4] : [entry-r*1.5, entry-r*2.5, entry-r*4];
    const conf = Math.round(R.range(58,94));
    const roll = R.next();
    const won = roll < (conf/100)*0.92 ? "win" : "loss";
    out.push({
      time: now - (i+1)*R.range(9,30)*3600000,
      sym, tf: tfs[i], dir: d, entry, sl, tp1:tps[0], tp2:tps[1], tp3:tps[2], conf,
      result: R.next() < 0.85 ? won : "pending"
    });
  });
  return out.sort((a,b)=>b.time-a.time);
}
function computeWinRate(hist){
  const closed = hist.filter(h=>h.result==="win"||h.result==="loss");
  if (!closed.length) return 0;
  return Math.round(closed.filter(h=>h.result==="win").length / closed.length * 100);
}

/* ---------- News calendar (sample, Aug–Sep 2026) ---------- */
function newsEvents(){
  const at = (y,mo,d,h,mi) => { const dt = new Date(Date.UTC(y,mo-1,d,h,mi)); return dt.getTime() - 4*3600000; }; // convert ET->UTC (EDT)
  return [
    { title:"NFP — US Non-Farm Payrolls",  cur:"USD", impact:"high", time: at(2026,8,7,13,30),  prev:"142K",  fcst:"165K",  tag:"NFP" },
    { title:"CPI — US Inflation (YoY)",     cur:"USD", impact:"high", time: at(2026,8,12,13,30), prev:"3.0%",  fcst:"2.9%",  tag:"CPI" },
    { title:"PPI — US Producer Prices",     cur:"USD", impact:"med",  time: at(2026,8,13,13,30), prev:"0.4%",  fcst:"0.3%",  tag:"PPI" },
    { title:"Retail Sales — US",            cur:"USD", impact:"med",  time: at(2026,8,14,13,30), prev:"0.3%",  fcst:"0.4%",  tag:"Retail" },
    { title:"FOMC — Fed Interest Rate Decision", cur:"USD", impact:"high", time: at(2026,9,16,19,0), prev:"3.75%", fcst:"3.75%", tag:"FOMC" },
    { title:"GDP — US Q2 (2nd estimate)",   cur:"USD", impact:"high", time: at(2026,8,27,13,30), prev:"2.1%",  fcst:"2.3%",  tag:"GDP" },
    { title:"ECB — Interest Rate Decision", cur:"EUR", impact:"high", time: at(2026,9,10,13,15), prev:"2.00%", fcst:"1.75%", tag:"ECB" },
    { title:"NFP — US Non-Farm Payrolls",   cur:"USD", impact:"high", time: at(2026,9,4,13,30),  prev:"165K", fcst:"155K",  tag:"NFP" },
    { title:"Unemployment Claims — US",     cur:"USD", impact:"med",  time: at(2026,8,13,13,30), prev:"230K",  fcst:"228K",  tag:"Claims" },
    { title:"ISM Manufacturing PMI — US",   cur:"USD", impact:"med",  time: at(2026,9,1,15,0),  prev:"49.8",  fcst:"50.1",  tag:"ISM" },
    { title:"Michigan Consumer Sentiment",  cur:"USD", impact:"med",  time: at(2026,8,14,15,0),  prev:"62.5",  fcst:"63.0",  tag:"UMich" },
    { title:"BoE — Interest Rate Decision", cur:"GBP", impact:"high", time: at(2026,9,17,12,0),  prev:"3.75%", fcst:"3.75%", tag:"BoE" }
  ];
}
