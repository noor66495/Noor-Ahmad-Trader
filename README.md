# 🤖 Noor Ahmad Trader — AI Trading Platform

عصري او مسلکي AI سوداګریز پلیټ فارم د **XAU/USD** او **EUR/USD** لپاره — د ICT (Inner Circle Trader) مفهومونو پر بنسټ، په پښتو او انګلیسي ژبو کې.

A modern, professional AI Trading Platform for **XAU/USD** & **EUR/USD** — built on ICT concepts, bilingual (Pashto / English), fully responsive.

---

## 📂 فایلونه / Files

| فایل | توضیح |
|------|-------|
| `index.html` | بشپړ پلیټ فارم — یوازې همدا فایل کافي دی (ټول CSS/JS پکې شامل دي). Open it directly in any browser. |
| `screenshots/` | د پلیټ فارم انځورونه (Home, Dashboard, ICT, Setup, Chat) |
| `src/` | سرچینې — `i18n.js` (ژبې)، `sim.js` (د بازار انجن)، `chart.js` (چارټ)، `chat.js` (AI بوټ)، `ui.js` + `pages.js` (انټرفیس) |
| `build.py` | `python3 build.py` — ټول سورس په یو `index.html` کې یوځای کوي |

---

## ✨ ځانګړنې / Features

- 🖥️ **کور پاڼه** — لوګو، ژوندی XAU/USD او EUR/USD، AI بازار شننه
- 📊 **ډشبورډ** — ژوندی شمعې (Candlestick) چارټ: 1D، 4H، 3H، 2H، 1H، 30M، 15M، 5M + د هر ټایم فریم لپاره: Trend، BOS، CHoCH، FVG، Order Block، Liquidity، Buy/Sell/Wait
- 🧠 **د ICT AI شننه** — Market Structure، BOS، CHoCH، Liquidity، Liquidity Sweep، FVG، Inverse FVG، Order Block، Breaker Block، Mitigation Block، Premium & Discount، OTE، Equal Highs/Lows، Daily/Weekly/Monthly Bias، Asian Session، London Kill Zone، New York Kill Zone (د ژوندی شمېرنې سره)
- 🎯 **د ټریډ طرحه** — Entry، Stop Loss، TP1-3، Risk/Reward، Confidence + د خطر اندازه ($)
- ⏰ **د ټریډ وخت** — د انټري کړکۍ، د ټریډ موده، د سیګنال خپرېدو/ختمېدو وخت
- 📈 **د پایپ حسابګر** — SL/TP واټنونه، R:R، د پایپ موخې
- 📰 **خبرونه** — CPI، NFP، FOMC، د سود کچه، اقتصادي کالندر (د شمېرنې سره)
- 🔔 **د ټیلیګرام خبرتیاوې** — Buy/Sell/Wait/News/Kill Zone + ژوندۍ خبرتیاوې
- 🤖 **AI چټ** — د ICT پوښتنې، د چارټ شننه، د بازار تشریح (په دواړو ژبو)
- 👤 **پروفایل** — پښتو/انګلیسي، توره/روښانه بڼه، د بریا سلنه (Win Rate)
- 📱 **په موبایل بشپړ کار کوي** — ښکته مینو (bottom navigation)

---

## 🚀 څنګه وکاروئ / How to use

1. `index.html` په هر براوزر کې خلاص کړئ (یا یې په Hosting — Netlify / Vercel / GitHub Pages — کې پورته کړئ).
2. ډیفالټ ژبه **پښتو** او بڼه **توره** ده — له پورته تڼیو یې بدلولی شئ.
3. ټول ډاټا اوسمهال **نمونه (Demo)** ده — د ریښتیني بازار ډاټا لپاره لاندې وګورئ.

---

## 🔌 د ریښتیني بازار ډاټا / Connecting real market data

اوسنی انجن (د `src/sim.js` — `tickMarket` فنکشن) سمولېډ شوي قیمتونه تولیدوي چې هیڅ انټرنیټ ته اړتیا نه لري. د ریښتیني ډاټا لپاره:

- **TwelveData / AlphaVantage / Finnhub** — وړیا API کیلي واخلئ او د `tickMarket` پر ځای د قیمت `fetch` وکړئ.
- **Binance/OKX** — د `XAUTUSDT` (Tether Gold) او `EURUSDT` سره وړیا REST API شته (CORS فعال).
- د Telegram چینل لینک په `src/pages.js` کې بدل کړئ: `https://t.me/NoorAhmadTrader` → خپل چینل.
- اقتصادي کالندر: ForexFactory / Myfxbook API ونښلوی (اوسنی یې نمونه ده).

---

## 🛠️ پرمختګ / Development

```bash
# سرچینې بدلول او بیا جوړول
python3 build.py

# ازموینه (اختیاري)
node test/smoke.js
```

---

© 2026 Noor Ahmad Trader — ټول حقوق خوندي دي. / All rights reserved.
