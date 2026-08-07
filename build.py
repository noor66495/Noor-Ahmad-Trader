#!/usr/bin/env python3
"""Build the single-file index.html for Noor Ahmad Trader.

Works in BOTH layouts:
  - project/src/...  (original zip layout)
  - project/...      (files at repo root — as uploaded to GitHub)
"""
import pathlib

ROOT = pathlib.Path(__file__).parent

def find(name):
    """Look for a source file in src/ first, then at root."""
    for base in (ROOT / "src", ROOT):
        p = base / name
        if p.exists():
            return p.read_text(encoding="utf-8")
    raise FileNotFoundError(f"Missing source file: {name} (expected in src/ or at root)")

css = find("style.css")
js = "\n".join(find(f) for f in
    ["i18n.js", "sim.js", "chart.js", "chat.js", "ui.js", "pages.js"])

html = f"""<!DOCTYPE html>
<html lang="ps" dir="rtl" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>Noor Ahmad Trader — AI Trading Platform</title>
<meta name="description" content="Noor Ahmad Trader — AI Trading Platform for XAU/USD & EUR/USD with ICT analysis">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%233b82f6'/%3E%3Cstop offset='1' stop-color='%231d4ed8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='2' y='2' width='44' height='44' rx='12' fill='url(%23g)'/%3E%3Cpath d='M13 30 L21 20 L26 25 L34 14' stroke='white' stroke-width='3.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='34' cy='14' r='3.4' fill='%2322c55e'/%3E%3C/svg%3E">
<meta name="theme-color" content="#070b14">
<style>
{css}
</style>
</head>
<body>
<div id="splash">
  <div class="splash-logo"><svg width="76" height="76" viewBox="0 0 48 48"><defs><linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient></defs><rect x="2" y="2" width="44" height="44" rx="12" fill="url(#lg2)"/><path d="M13 30 L21 20 L26 25 L34 14" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="34" cy="14" r="3.4" fill="#22c55e"/></svg></div>
  <div class="splash-name">Noor Ahmad Trader</div>
  <div class="splash-sub">AI TRADING PLATFORM</div>
  <div class="splash-bar"><div></div></div>
</div>
<div class="orb orb1"></div><div class="orb orb2"></div><div class="orb orb3"></div>
<div id="scrollbar"></div>
<div id="app"></div>
<script>
{js}
</script>
<script>
document.addEventListener("DOMContentLoaded", function(){{
  initApp();
  nav("home");
}});
</script>
</body>
</html>
"""
OUT = ROOT / "index.html"
OUT.write_text(html, encoding="utf-8")
print(f"Built {OUT} ({OUT.stat().st_size/1024:.1f} KB)")
