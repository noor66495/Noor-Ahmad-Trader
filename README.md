# 🤖 Noor Ahmad Trader — AI Gold Trading Platform

عصري او مسلکي AI سوداګریز پلیټ فارم — **یوازې سرو زر (XAU/USD)** — د ICT (Inner Circle Trader) مفهومونو پر بنسټ، په پښتو او انګلیسي ژبو، **د ریښتیني بازار ژوندۍ ډاټا سره**.

A modern, professional AI trading platform for **XAU/USD (Gold) only** — built on ICT concepts, bilingual (Pashto / English), fully responsive, with **real live market data**.

---

## 📂 فایلونه / Files

| فایل | توضیح |
|------|-------|
| `index.html` | بشپړ پلیټ فارم — یوازې همدا فایل کافي دی (ټول CSS/JS پکې شامل دي). Open it directly in any browser. |
| `feeds.js` | 🆕 د ریښتیني بازار ډاټا پرت — څو چینل زنځیر + اوتومات بېرتهګرځنه |
| `sim.js` | د ICT شننه انجن + د نمونې (ډیمو) انجن (کله چې انټرنټ نشته) |
| `chart.js` | د شمعو چارټ، `chat.js` — AI بوټ، `ui.js` + `pages.js` — انټرفیس، `i18n.js` — ژبې |
| `build.py` | `python3 build.py` — ټول سورس په یو `index.html` کې یوځای کوي |
| `test/smoke.js` | `node test/smoke.js` — اتومات ازموینې |

---

## 🔴 ریښتینۍ بازاري ډاټا / Real market data — NO API KEY NEEDED

پلیټ فارم اوس **ریښتیني سرو زر** قیمتونه کاروي — بې کیلي، وړیا:

| ترتیب | چینل | سمبول |
|---|---|---|
| ۱ | **Kraken** | `PAXG/USD` (هر اونس سرو زر — ریښتیني USD) |
| ۲ | **OKX** | `XAUT/USDT` (Tether Gold) |
| ۳ | **KuCoin** | `XAUT/USDT` |
| ۴ | **Binance** | `XAUTUSDT` → `PAXGUSDT` (+ WebSocket ژوندی ټیک) |
| ۵ | **Bybit** | `XAUTUSDT` → `PAXGUSDT` |
| ۶ | **Bitfinex** | `XAUT/USD` |

- **اوتومات غوراوی**: کوم چینل ستاسو له انټرنټه کار وکړي، همغه کار کوي (ځینې هېوادونه یې بندوي).
- که ټول بند وي → **ډیمو انجن** اوتومات فعالیږي او سایټ کار کولي ته دوام ورکوي (LIVE → DEMO بیج ښیي).
- بیه هر ~۹ ثانیې تازه کېږي؛ شمعې هر ۶۰ ثانیې؛ د Binance لپاره WebSocket (هر ثانیه).
- وروستۍ ریښتینې شمعې په براوزر کې خوندي کېږي → بل ځل خلاصېدو سملاسي ریښتینې ډاټا ښیي.
- سرچینه په **پروفایل** کې بدلولی شئ: ریښتینی (اتومات) / نمونه.
- په ټولونو ټایم فریمونو (1D…5M) بشپړ ICT شننه د ریښتینيو شمعو پر بنسټ.

> ℹ️ `PAXG` او `XAUT` دواړه د یوه اونس سرو زرو ټوکنونه دي — د سپاټ سرو زرو (`XAU/USD`) بیه په ډېر لږ توپیر تعقیبوي.

---

## ✨ ځانګړنې / Features

- 🖥️ **کور پاڼه** — لوګو، ژوندی XAU/USD، د ډاټا سرچینې بیج، AI بازار شننه
- 📊 **ډشبورډ** — ژوندی شمعې چارټ: 1D، 4H، 3H، 2H، 1H، 30M، 15M، 5M + Trend، BOS، CHoCH، FVG، Order Block، Liquidity، Buy/Sell/Wait
- 🧠 **د ICT AI شننه** — Market Structure، BOS، CHoCH، Liquidity، Liquidity Sweep، FVG، Inverse FVG، Order Block، Breaker Block، Mitigation Block، Premium & Discount، OTE، Equal Highs/Lows، Daily/Weekly/Monthly Bias، Asian Session، London & New York Kill Zone
- 🎯 **د ټریډ طرحه** — Entry، Stop Loss، TP1-3، Risk/Reward، Confidence + د خطر اندازه ($)
- ⏰ **د ټریډ وخت** — د انټري کړکۍ، د ټریډ موده، سیګنال وختونه
- 📈 **د پایپ حسابګر** — SL/TP واټنونه، R:R، د پایپ موخې
- 📰 **خبرونه** — CPI، NFP، FOMC، GDP او نور USD پېښې (نمونه لیست)
- 🔔 **خبرتیاوې** — Buy/Sell/Wait/News/Kill Zone + ژوندی فیډ
- 🤖 **AI چټ** — د ICT پوښتنې، د بازار تشریح (په دواړو ژبو)
- 👤 **پروفایل** — ژبه، توره/روښانه بڼه، د ډاټا سرچینې ټاکنه، Win Rate
- 📱 **موبایل** — ښکته مینو (bottom navigation)

---

## 🚀 څنګه وکاروئ / How to use

1. `index.html` په هر براوزر کې خلاص کړئ (یا په GitHub Pages / Netlify / Vercel کې).
2. ډیفالټ: ژبه **پښتو**، بڼه **توره**، ډاټا **ریښتینې (اتومات)**.
3. که انټرنټ نه وي یا ټول APIونه بند وي → اوتومات ډیمو بڼه.

---

## 🛠️ پرمختګ / Development

```bash
python3 build.py      # سرچینې → index.html
node test/smoke.js    # ازموینې (19 چیکونه)
```

---

© 2026 Noor Ahmad Trader — ټول حقوق خوندي دي. / All rights reserved.
