/* ============ Noor Ahmad Trader — Canvas Candlestick Chart ============ */
const CHART = {
  canvas: null, ctx: null, visible: 90,
  candles: [], zones: [], lines: [], hover: null, tooltip: null,
  W: 0, H: 0, padL: 66, padR: 10, padT: 12, padB: 26,
  scale: null,
  init(canvas){
    if (this._bound !== canvas){
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this._bound = canvas;
      if (this.tooltip && this.tooltip.parentElement) this.tooltip.remove();
      this.tooltip = document.createElement("div");
      this.tooltip.style.cssText = "position:absolute;pointer-events:none;background:rgba(10,15,30,.94);border:1px solid #26365c;border-radius:8px;padding:7px 10px;font-size:11px;font-family:inherit;z-index:30;display:none;line-height:1.5;color:#e8eefc;box-shadow:0 6px 18px rgba(0,0,0,.5);";
      this.canvas.parentElement.appendChild(this.tooltip);
      this.bind();
      window.addEventListener("resize", () => this.resize());
    } else {
      this.canvas = canvas; this.ctx = canvas.getContext("2d");
    }
    this.resize();
  },
  resize(){
    const wrap = this.canvas.parentElement;
    const w = wrap.clientWidth;
    this.W = w; this.H = this.canvas.clientHeight || 440;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr; this.canvas.height = this.H * dpr;
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
  },
  bind(){
    const cv = this.canvas;
    cv.addEventListener("mousemove", e => {
      const r = cv.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      this.hover = { x, y };
      this.draw(); this.drawCrosshair(x, y);
    });
    cv.addEventListener("mouseleave", () => { this.hover = null; this.tooltip.style.display = "none"; this.draw(); });
    cv.addEventListener("touchstart", e => {
      const t = e.touches[0]; const r = cv.getBoundingClientRect();
      this.hover = { x: t.clientX - r.left, y: t.clientY - r.top };
      this.draw(); this.drawCrosshair(this.hover.x, this.hover.y);
    }, { passive: true });
  },
  setData(candles, zones, lines){
    this.candles = candles; this.zones = zones || []; this.lines = lines || [];
    this.resize(); this.draw();
  },
  /* price <-> px */
  xAt(i, n){ const plotW = this.W - this.padL - this.padR; return this.padL + (i + 0.5) * plotW / n; },
  yAt(p){ return this.padT + (this.pMax - p) * this.plotH / (this.pMax - this.pMin); },
  computeScale(){
    const n = Math.min(this.visible, this.candles.length);
    const start = this.candles.length - n;
    const slice = this.candles.slice(start);
    let lo = Math.min(...slice.map(c=>c.l)), hi = Math.max(...slice.map(c=>c.h));
    for (const z of this.zones){ lo = Math.min(lo, z.lo); hi = Math.max(hi, z.hi); }
    for (const l of this.lines){ if (l.p !== undefined && l.p !== null){ lo = Math.min(lo, l.p); hi = Math.max(hi, l.p); } }
    const pad = (hi - lo) * 0.07 || hi * 0.002;
    this.pMax = hi + pad; this.pMin = lo - pad;
    this.plotH = this.H - this.padT - this.padB;
  },
  draw(){
    const g = this.ctx; if (!g) return;
    if (!this.candles.length) return;
    this.computeScale();
    const n = Math.min(this.visible, this.candles.length);
    const start = this.candles.length - n;
    const candles = this.candles.slice(start);
    const plotW = this.W - this.padL - this.padR;
    const cw = Math.max(2, plotW / n * 0.62);
    const theme = document.documentElement.dataset.theme;
    const gridC = theme==="light" ? "rgba(16,27,51,.08)" : "rgba(143,163,200,.09)";
    const textC = theme==="light" ? "#5b6b8c" : "#8fa3c8";

    g.clearRect(0,0,this.W,this.H);

    /* zones (behind candles) */
    for (const z of this.zones){
      const y1 = this.yAt(z.hi), y2 = this.yAt(z.lo);
      const h = Math.max(2, y2 - y1);
      g.fillStyle = z.color || "rgba(59,130,246,.12)";
      g.fillRect(this.padL, y1, plotW, h);
      if (z.border){
        g.strokeStyle = z.border; g.lineWidth = 1; g.setLineDash(z.dash || []);
        g.strokeRect(this.padL + 0.5, y1 + 0.5, plotW - 1, h - 1);
        g.setLineDash([]);
      }
      if (z.label){
        g.fillStyle = z.border || textC; g.font = "bold 9.5px Segoe UI, Tahoma, sans-serif";
        g.fillText(z.label, this.padL + 4, y1 + 10);
      }
    }

    /* candles */
    for (let i=0;i<n;i++){
      const c = candles[i];
      const x = this.xAt(i, n);
      const up = c.c >= c.o;
      g.strokeStyle = up ? "#22c55e" : "#ef4444";
      g.fillStyle = up ? "#22c55e" : "#ef4444";
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, this.yAt(c.h)); g.lineTo(x, this.yAt(c.l)); g.stroke();
      const yO = this.yAt(c.o), yC = this.yAt(c.c);
      const bodyH = Math.max(1, Math.abs(yO - yC));
      g.fillRect(x - cw/2, Math.min(yO,yC), cw, bodyH);
    }

    /* grid + y labels */
    g.strokeStyle = gridC; g.fillStyle = textC; g.font = "10px 'Segoe UI', Tahoma, sans-serif";
    const steps = 5;
    for (let s=0;s<=steps;s++){
      const p = this.pMin + (this.pMax-this.pMin) * s/steps;
      const y = this.padT + this.plotH * s/steps;
      g.beginPath(); g.moveTo(this.padL, y); g.lineTo(this.W-this.padR, y); g.stroke();
      g.textAlign = "right"; g.fillText(this.fmt(p), this.padL - 6, y + 3);
    }
    /* time labels */
    g.textAlign = "center";
    const labelCount = 4;
    for (let k=0;k<=labelCount;k++){
      const i = Math.floor(n * k / labelCount);
      if (i >= n) continue;
      const c = candles[i];
      const x = this.xAt(i, n);
      const d = new Date(c.t);
      g.fillText(String(d.getUTCHours()).padStart(2,"0") + ":" + String(d.getUTCMinutes()).padStart(2,"0"), x, this.H - 9);
    }

    /* lines (setup / liquidity) */
    for (const l of this.lines){
      const y = this.yAt(l.p);
      g.strokeStyle = l.color; g.lineWidth = l.width || 1.4;
      g.setLineDash(l.dash || []);
      g.beginPath(); g.moveTo(this.padL, y); g.lineTo(this.W-this.padR, y); g.stroke();
      g.setLineDash([]);
      if (l.label){
        g.fillStyle = l.color; g.font = "bold 9.5px 'Segoe UI', Tahoma, sans-serif"; g.textAlign = "left";
        const tx = l.labelPos === "left" ? this.padL + 4 : this.W - this.padR - 4;
        g.textAlign = l.labelPos === "left" ? "left" : "right";
        g.fillText(l.label, tx, y - 3);
      }
    }
  },
  fmt(p){
    const dec = p > 100 ? 2 : (p > 1 ? 4 : 5);
    return p.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  },
  drawCrosshair(mx, my){
    const g = this.ctx; if (!g || !this.hover) return;
    const theme = document.documentElement.dataset.theme;
    g.strokeStyle = theme==="light" ? "rgba(16,27,51,.35)" : "rgba(232,238,252,.3)";
    g.lineWidth = 1; g.setLineDash([4,4]);
    g.beginPath(); g.moveTo(mx, this.padT); g.lineTo(mx, this.H-this.padB); g.stroke();
    g.beginPath(); g.moveTo(this.padL, my); g.lineTo(this.W-this.padR, my); g.stroke();
    g.setLineDash([]);
    const n = Math.min(this.visible, this.candles.length);
    const idx = Math.floor((mx - this.padL) / ((this.W-this.padL-this.padR)/n));
    if (idx < 0 || idx >= n) return;
    const start = this.candles.length - n;
    const c = this.candles[start + idx];
    if (!c) return;
    /* price tag */
    const dec = c.o > 100 ? 2 : 4;
    const pTxt = c.o.toLocaleString("en-US",{minimumFractionDigits:dec, maximumFractionDigits:dec});
    g.fillStyle = "rgba(37,99,235,.95)"; g.fillRect(this.W-this.padR-72, my-10, 66, 16);
    g.fillStyle = "#fff"; g.font = "bold 10px 'Segoe UI', Tahoma, sans-serif"; g.textAlign = "center";
    g.fillText(pTxt, this.W-this.padR-39, my+3);
    /* tooltip */
    const d = new Date(c.t);
    const tt = document.getElementById("chart-tt") || this.tooltip;
    tt.innerHTML =
      "<b>" + d.toUTCString().slice(0,16) + "</b><br>" +
      "O " + this.fmt(c.o) + "&nbsp;&nbsp;H " + this.fmt(c.h) + "<br>" +
      "L " + this.fmt(c.l) + "&nbsp;&nbsp;C " + this.fmt(c.c);
    tt.style.display = "block";
    const wrap = this.canvas.parentElement;
    let tx = mx + 14, ty = my - 44;
    if (tx + 130 > wrap.clientWidth) tx = mx - 144;
    if (ty < 4) ty = 4;
    tt.style.left = tx + "px"; tt.style.top = ty + "px";
  }
};
