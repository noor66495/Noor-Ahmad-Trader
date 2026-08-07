/* ============ Noor Ahmad Trader — AI Chat Bot ============ */
const AI_BOT = {
  match(text){
    const s = text.toLowerCase();
    const has = (...words) => words.some(w => s.includes(w));
    if (has("سلام","سلامونه","salam","hello","هيلو") && s.length < 25) return "cHello";
    if (has("bos","بي او اس") || (has("break of structure","سټرکچر مات")) ) return "cBOS";
    if (has("choch","choc","character","بدلون") ) return "cCHoCH";
    if (has("fvg","fair value","اي وي جي") ) return "cFVG";
    if (has("order block","اردربلاک","اردر") ) return "cOB";
    if (has("breaker","بریکر") ) return "cBreaker";
    if (has("mitigation","ميټيگيشن","mitigation block") ) return "cMitigation";
    if (has("liquidity","ليکويډيټي","لیکویډیټي","liquidation") ) return "cLiquidity";
    if (has("sweep","سويپ","سویپ") ) return "cSweep";
    if (has("kill zone","کيل زون","کیل زون","killzone","kz","لندن","london","نيويارک","نیویارک","asian","آسیا") ) return "cKill";
    if (has("ote","او ټي اي") ) return "cOTE";
    if (has("premium","پریمیم","پرېميم","discount","ډیسکاونټ","ډيسکاونټ") ) return "cPremium";
    if (has("equal high","equal low","برابر لوړ","برابر ټيټ") ) return "cEq";
    if (has("bias","بایس","باييس") ) return "cBias";
    if (has("analyse","analyze","تحليل","تحلیل","شننه","chart","چارټ","سگنال","سيگنال","سیګنال","مارکیټ","بازار","مارکيټ") && (has("تحليل","تحلیل","analy","شننه","chart","چارټ","مارکیټ","بازار","مارکيټ","سگنال","سيگنال","سیګنال")) ) return "cAnalyze";
    return null;
  },
  reply(text, state){
    const key = this.match(text);
    if (key === "cAnalyze") return this.marketSummary(state);
    if (key) return t(key);
    return t("cDefault");
  },
  /* dynamic market summary from current analysis */
  marketSummary(state){
    const a = state.analysis;
    const P = PAIRS[state.pair];
    const sig = a ? a.signal : { dir: 0, conf: 0 };
    const dirTxt = sig.dir===1 ? t("buyL") : (sig.dir===-1 ? t("sellL") : t("waitL"));
    const dirColor = sig.dir===1 ? "🟢" : (sig.dir===-1 ? "🔴" : "🟡");
    const tfName = TFS[state.tf];
    const price = a ? a.price : 0;
    let lines = [
      t("cMarket"),
      "━━━━━━━━━━━━",
      t("cTf") + ": " + tfName,
      t("cCur") + ": " + fmtNum(price, P.dec),
      t("cSig") + ": " + dirColor + " " + dirTxt + " (" + (a?a.signal.conf:0) + "%)"
    ];
    if (a){
      lines.push("Trend: " + (a.structure.trend===1 ? t("bullish") : a.structure.trend===-1 ? t("bearish") : t("neutral")));
      if (a.setup){
        lines.push("━━━━━━━━━━━━");
        lines.push(t("entry") + ": " + fmtNum(a.setup.entry, P.dec));
        lines.push(t("stopLoss") + ": " + fmtNum(a.setup.sl, P.dec));
        lines.push("TP1: " + fmtNum(a.setup.tp1, P.dec) + " | TP2: " + fmtNum(a.setup.tp2, P.dec));
      }
      const reasonLine = a.reasons[0] ? a.reasons[0].text : "";
      if (reasonLine) lines.push("📌 " + reasonLine);
    }
    return lines.join("\n");
  }
};
