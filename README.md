# 🤖 Noor Ahmad Trader — AI Gold Trading Platform

**نسخه 1.2** — عصري او مسلکي AI سوداګریز پلیټ فارم — **یوازې سرو زر (XAU/USD)** — د ICT مفهومونو پر بنسټ، په پښتو او انګلیسي، **د ریښتیني بازار ژوندۍ ډاټا سره**.

**Version 1.2** — A modern, professional AI trading platform for **XAU/USD (Gold) only** — ICT concepts, bilingual (Pashto / English), live market data.

---

## 📂 فایلونه / Files

| فایل | توضیح |
|------|-------|
| `index.html` | بشپړ پلیټ فارم — یوازې همدا فایل کافي دی. Open it in any browser. |
| `feeds.js` | ریښتینۍ بازاري ډاټا — `FEED_CHAINS` + اوتومات بېرتهګرځنه |
| `sim.js` | ICT شننه + ATR سټاپونه + دقیق Entry (FVG CE / OB / OTE) + ډیمو انجن |
| `chart.js` | شمعې چارټ، `chat.js` AI بوټ، `ui.js` + `pages.js` انټرفیس، `i18n.js` ژبې |
| `style.css` | ډیزاین — flash-up / flash-down د بیې حرکت |
| `build.py` | `python3 build.py` — ټول سورس په یو `index.html` کې یوځای کوي |
| `test/smoke.js` | `node test/smoke.js` — ۱۹ چیکونه |

---

## ✨ نسخه 1.2 — څه نوي دي؟

- **۵ ټایم فریمونه**: `1D` · `4H` · `1H` · `15M` · `5M` + `TF_PROFILES` (د هر TF لپاره ATR ضرب)
- **دقیق Entry**: FVG **CE** (منځ) → Order Block → OTE → مارکیټ
- **ATR سټاپونه**: `function atr(` — د هر ټایم فریم لپاره جلا `slAtr`
- **د MT5 لاټ حسابګر** (`mt5Title` / `mt5-lots`): **۱ لاټ = ۱۰۰ اونس**، **۱ نقطه = $۱**
- **flash-up** ډیزاین: بیه پورته/ښکته کېږي نو شنه/سوره چمک
- نسخه **1.2**

---

## 🔴 ریښتینۍ بازاري ډاټا — NO API KEY

`FEED_CHAINS` ترتیب:

| ترتیب | چینل | سمبول |
|---|---|---|
| ۱ | **Kraken** | `PAXG/USD` |
| ۲ | **OKX** | `XAUT/USDT` |
| ۳ | **KuCoin** | `XAUT/USDT` |
| ۴ | **Binance** | `XAUTUSDT` → `PAXGUSDT` (+ WebSocket) |
| ۵ | **Bybit** | `XAUTUSDT` → `PAXGUSDT` |
| ۶ | **Bitfinex** | `XAUT/USD` |

که ټول بند وي → ډیمو انجن اوتومات فعالېږي.

---

## 📐 MT5 لاټ حساب

```
1.00 lot  = 100 ounces of gold
1 point   = $0.01  →  $1 per lot
Lots      = Risk ($)  ÷  SL points
```

بېلګه: خطر $100، SL = 1000 نقطې (=$10) → **0.10 لاټ**

---

## 🛠️ پرمختګ / Development

```bash
python3 build.py      # سرچینې → index.html
node test/smoke.js    # ازموینې (19 چیکونه)
```

---

© 2026 Noor Ahmad Trader — ټول حقوق خوندي دي. / All rights reserved.
