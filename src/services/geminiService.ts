import { GoogleGenAI } from '@google/genai';
import { StockQuote, StockOpportunity, MarketRegimeState, TargetScenario, InvestmentHorizon } from '../types/stock';
import { generateChartBars } from './marketData';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function synthesizeStockOpportunityWithGemini(
  stock: StockQuote,
  setupType: StockOpportunity['setupType'],
  marketRegime: MarketRegimeState,
  horizon: InvestmentHorizon = 'SWING'
): Promise<StockOpportunity> {
  const ai = getAiClient();
  const chart = generateChartBars(stock.cmp, stock.atr14, 20);

  // Target & SL Calculations tailored dynamically to Investment Horizon:
  // SWING: 1.5x ATR stop, 2.0x / 3.4x R:R, 3-8 trading days
  // SHORT_TERM: 2.2x ATR stop (or 50 EMA buffer), 3.0x / 5.0x R:R, 1-3 months
  // LONG_TERM: 3.5x ATR stop (or 200 EMA buffer), 4.5x / 8.0x R:R, 6-18+ months
  const atr = stock.atr14;

  let hardSL: number;
  let t1Multiplier: number;
  let t2Multiplier: number;
  let defaultHolding: string;
  let trailingRule: string;

  if (horizon === 'LONG_TERM') {
    hardSL = Math.round(Math.min(stock.cmp - (atr * 3.5), stock.ema200 * 0.96) * 10) / 10;
    t1Multiplier = 3.5;
    t2Multiplier = 7.0;
    defaultHolding = '6 - 18+ Months (Long Term Wealth Compounding)';
    trailingRule = 'Quarterly revision; trail stop-loss under rising 50-week / 200-day EMA as compounding thesis plays out.';
  } else if (horizon === 'SHORT_TERM') {
    hardSL = Math.round(Math.min(stock.cmp - (atr * 2.2), stock.ema50 * 0.98) * 10) / 10;
    t1Multiplier = 2.5;
    t2Multiplier = 4.5;
    defaultHolding = '4 - 12 Weeks (Short Term Positional Swing)';
    trailingRule = 'Once T1 is achieved, trail under previous swing low and 20-Day EMA on daily close.';
  } else {
    // SWING
    hardSL = Math.round((stock.cmp - (atr * 1.5)) * 10) / 10;
    t1Multiplier = 2.0;
    t2Multiplier = 3.4;
    defaultHolding = '3 - 8 Trading Days (Tactical Swing)';
    trailingRule = 'Once T1 is achieved, revise trailing stop to cost (₹' + stock.cmp + ') and trail daily low under 9 EMA.';
  }

  const slPct = Math.round(((stock.cmp - hardSL) / stock.cmp) * 1000) / 10;
  const riskAmount = stock.cmp - hardSL;
  
  const t1 = Math.round((stock.cmp + (riskAmount * t1Multiplier)) * 10) / 10;
  const t1GainPct = Math.round(((t1 - stock.cmp) / stock.cmp) * 1000) / 10;
  
  const t2 = Math.round((stock.cmp + (riskAmount * t2Multiplier)) * 10) / 10;
  const t2GainPct = Math.round(((t2 - stock.cmp) / stock.cmp) * 1000) / 10;

  const riskReward = `1 : ${(t1GainPct / Math.max(0.1, slPct)).toFixed(1)}`;

  const fallbackOpportunity: StockOpportunity = {
    id: `opp-${stock.symbol}-${horizon}-${Date.now()}`,
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sector,
    cmp: stock.cmp,
    changePercent: stock.changePercent,
    setupType,
    horizon,
    selectionReason: `${stock.name} was selected for ${horizon.replace('_', ' ')} allocation due to outstanding relative strength (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent}%) in ${stock.sector}. High delivery accumulation (${stock.deliveryPercent}%) confirms strong institutional backing, with price trading above key rising moving averages (20 EMA: ₹${stock.ema20}, 50 EMA: ₹${stock.ema50}).`,
    entryConditions: [
      horizon === 'LONG_TERM' 
        ? `Primary Trigger: Systematic accumulation on any market dip near 20 EMA (₹${stock.ema20}) - 50 EMA (₹${stock.ema50})`
        : `Primary Trigger: Buy zone on 15-minute pullback between ₹${Math.round(stock.cmp * 0.993)} - ₹${stock.cmp}`,
      `Breakout Trigger: Bullish close above ₹${stock.high} with confirmed volume expansion`,
      `Safety Condition: Do not chase if opening gap-up exceeds 1.8% from previous close`
    ],
    targetsAndStopLoss: {
      t1,
      t1GainPct,
      t1Rationale: horizon === 'LONG_TERM' 
        ? `First structural target based on annual earnings expansion and multi-quarter channel resistance.`
        : `Immediate resistance at recent pivot high / ${t1Multiplier}x risk expansion target.`,
      t2,
      t2GainPct,
      t2Rationale: horizon === 'LONG_TERM'
        ? `Multi-year trend extension based on market leadership in ${stock.sector}.`
        : `Measured move extension based on multi-week base breakout.`,
      hardStopLoss: hardSL,
      stopLossLossPct: slPct,
      trailingStopRule: trailingRule,
      riskRewardRatio: riskReward
    },
    holdingPeriod: defaultHolding,
    risksAndInvalidations: [
      `Strict Invalidation: A daily close below the 20 EMA (₹${stock.ema20}) or hard stop-loss of ₹${hardSL}.`,
      `Market Overhang: High India VIX surge above 17.5 triggering broader midcap index profit booking.`,
      `Sector Weakness: Relative weakness in ${stock.sector} with institutional distribution.`
    ],
    confidencePercent: stock.volumeMultiple > 2.0 && stock.deliveryPercent > 55 ? 89 : 82,
    confidenceGrade: stock.volumeMultiple > 2.0 ? 'HIGH' : 'MODERATE_HIGH',
    supportingEvidence: [
      `Volume Surge: ${stock.volumeMultiple}x of 20-Day Average Volume`,
      `Delivery Footprint: ${stock.deliveryPercent}% Delivery Volume (Strong Hands)`,
      `Trend Alignment: CMP (₹${stock.cmp}) > 20 EMA (₹${stock.ema20}) > 50 EMA (₹${stock.ema50})`,
      `Momentum: RSI(14) at ${stock.rsi14} in optimal swing zone without divergence`
    ],
    technicalBadges: [
      `RSI ${stock.rsi14}`,
      `Vol ${stock.volumeMultiple}x`,
      `${stock.deliveryPercent}% Deliv`,
      `20 EMA > 50 EMA`,
      `R:R ${riskReward}`
    ],
    suggestedQtyFor1LakhCapital: Math.max(1, Math.floor(100000 / stock.cmp)),
    chartData: chart,
    generatedAt: new Date().toISOString()
  };

  if (!ai) {
    return fallbackOpportunity;
  }

  try {
    const prompt = `
You are the senior quantitative swing trader and analyst for an autonomous Indian Stock Market Intelligence Agent (LangGraph).
You are evaluating a shortlisted NSE stock for our institutional Daily Intelligence Briefing.

STOCK DATA:
- Symbol: ${stock.symbol} (${stock.name})
- Sector: ${stock.sector}
- CMP: ₹${stock.cmp} (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent}%)
- 52-Week High: ₹${stock.high52W} (Distance: ${stock.distanceFrom52WHigh}%)
- 20 EMA: ₹${stock.ema20} | 50 EMA: ₹${stock.ema50} | 200 EMA: ₹${stock.ema200}
- RSI (14): ${stock.rsi14}
- Volume: ${(stock.volume / 100000).toFixed(1)} Lakh shares (${stock.volumeMultiple}x 20D Average)
- Delivery %: ${stock.deliveryPercent}%
- ATR (14): ₹${stock.atr14}
- Setup Category: ${setupType}

CURRENT MARKET REGIME:
- Nifty 50: ${marketRegime.nifty50Value} (${marketRegime.niftyTrend})
- India VIX: ${marketRegime.indiaVix} (${marketRegime.vixStatus})
- FII Net: ₹${marketRegime.fiiNetCr} Cr | DII Net: ₹${marketRegime.diiNetCr} Cr

CALCULATED REFERENCE METRICS:
- Hard Stop Loss: ₹${hardSL} (-${slPct}%)
- Conservative Target 1: ₹${t1} (+${t1GainPct}%)
- Extended Target 2: ₹${t2} (+${t2GainPct}%)

Provide an institutional, actionable swing trading plan formatted strictly as JSON with this schema:
{
  "selectionReason": "Detailed 2-3 sentence institutional rationale explaining why this stock was selected from NSE universe",
  "entryConditions": ["Condition 1 with exact price or candle trigger", "Condition 2 pullback zone", "Condition 3 gap-up caveat"],
  "t1Rationale": "Why T1 is at ₹${t1}",
  "t2Rationale": "Why T2 is at ₹${t2}",
  "trailingStopRule": "Concrete trailing stop rule (e.g., move to breakeven once T1 hits, trail 9 EMA)",
  "holdingPeriod": "e.g., 3 - 6 Trading Days (Swing)",
  "risksAndInvalidations": ["Specific invalidation price trigger", "Macro/sector risk", "Event risk"],
  "confidencePercent": 85,
  "confidenceGrade": "HIGH",
  "supportingEvidence": ["Evidence 1", "Evidence 2", "Evidence 3", "Evidence 4"]
}
`;

    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 5000)
    );

    const callPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an elite Indian market quantitative strategist. Return only valid JSON without markdown fences.',
        responseMimeType: 'application/json'
      }
    });

    const response = (await Promise.race([callPromise, timeoutPromise])) as any;

    const text = response.text?.trim() || '';
    if (!text) {
      return fallbackOpportunity;
    }

    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      ...fallbackOpportunity,
      selectionReason: parsed.selectionReason || fallbackOpportunity.selectionReason,
      entryConditions: Array.isArray(parsed.entryConditions) && parsed.entryConditions.length > 0 ? parsed.entryConditions : fallbackOpportunity.entryConditions,
      targetsAndStopLoss: {
        t1,
        t1GainPct,
        t1Rationale: parsed.t1Rationale || fallbackOpportunity.targetsAndStopLoss.t1Rationale,
        t2,
        t2GainPct,
        t2Rationale: parsed.t2Rationale || fallbackOpportunity.targetsAndStopLoss.t2Rationale,
        hardStopLoss: hardSL,
        stopLossLossPct: slPct,
        trailingStopRule: parsed.trailingStopRule || fallbackOpportunity.targetsAndStopLoss.trailingStopRule,
        riskRewardRatio: riskReward
      },
      holdingPeriod: parsed.holdingPeriod || fallbackOpportunity.holdingPeriod,
      risksAndInvalidations: Array.isArray(parsed.risksAndInvalidations) && parsed.risksAndInvalidations.length > 0 ? parsed.risksAndInvalidations : fallbackOpportunity.risksAndInvalidations,
      confidencePercent: typeof parsed.confidencePercent === 'number' ? parsed.confidencePercent : fallbackOpportunity.confidencePercent,
      confidenceGrade: parsed.confidenceGrade === 'HIGH' || parsed.confidenceGrade === 'MODERATE_HIGH' ? parsed.confidenceGrade : fallbackOpportunity.confidenceGrade,
      supportingEvidence: Array.isArray(parsed.supportingEvidence) && parsed.supportingEvidence.length > 0 ? parsed.supportingEvidence : fallbackOpportunity.supportingEvidence,
    };
  } catch (err) {
    console.warn('Gemini synthesis fallback invoked due to:', err);
    return fallbackOpportunity;
  }
}

export async function askStockAgentFollowUp(
  userQuery: string,
  history: Array<{ role: 'user' | 'model'; text: string }> = [],
  context: {
    shortlist?: StockOpportunity[];
    regime?: MarketRegimeState;
  } = {}
): Promise<string> {
  const ai = getAiClient();
  const shortlistSummary = context.shortlist?.map(s => 
    `- ${s.symbol} (₹${s.cmp}, ${s.sector}): Setup=${s.setupType}, Entry=${s.entryConditions[0] || 'Pullback'}, T1=₹${s.targetsAndStopLoss.t1}, SL=₹${s.targetsAndStopLoss.hardStopLoss}, R:R=${s.targetsAndStopLoss.riskRewardRatio}, Conf=${s.confidencePercent}%`
  ).join('\n') || 'None loaded';

  const regimeSummary = context.regime ? 
    `Nifty 50: ${context.regime.nifty50Value} (${context.regime.regime}), India VIX: ${context.regime.indiaVix}, FII Net: +₹${context.regime.fiiNetCr}Cr, Bias: ${context.regime.bias}` :
    'Bullish Trend, India VIX 13.8, FIIs Net Buyers';

  if (!ai) {
    // Helpful institutional fallback
    return `**ArthaGraph Agent Insight:**
Regarding **"${userQuery}"**:

1. **Market Context:** ${regimeSummary}.
2. **Current Shortlist Focus:** The agent prioritizes high relative strength equities (like ${context.shortlist?.[0]?.symbol || 'TRENT, BEL, DIXON'}) where institutional delivery exceeds 50% and volume expands over 1.8x the 20-day average.
3. **Execution Rule:** If a stock opens with a gap-up greater than 1.5-2%, avoid chasing at the open. Wait for the initial 15-minute range breakout or a minor pullback to the 20 EMA. Always honor the ATR stop-loss!`;
  }

  try {
    const systemPrompt = `You are ArthaGraph AI, an elite Indian Stock Market intelligence assistant and LangGraph agent.
You are assisting an Indian trader with questions about today's NSE stock picks, swing trading tactics, entry conditions, stop loss management, sector momentum, and Nifty/Bank Nifty outlook.

CURRENT SHORTLISTED STOCKS:
${shortlistSummary}

CURRENT MARKET REGIME:
${regimeSummary}

GUIDELINES:
- Provide concise, practical, and highly actionable answers formatted with markdown bullet points.
- Quote actual price levels (CMP, Target 1, Stop Loss, 20 EMA) when discussing specific stocks.
- Emphasize strict risk management (1:2+ R:R, never averaging down, trailing stop to cost once T1 is hit).
- Do not give guarantees; remind them that swing trades require strict invalidation stops.`;

    const chatMessages = history.map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }]
    }));

    chatMessages.push({
      role: 'user',
      parts: [{ text: userQuery }]
    });

    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 6500)
    );

    const callPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatMessages as any,
      config: {
        systemInstruction: systemPrompt
      }
    });

    const response = (await Promise.race([callPromise, timeoutPromise])) as any;
    return response?.text?.trim() || 'Could not generate a response at this time. Please try again.';
  } catch (error) {
    console.warn('Gemini chat follow-up fallback:', error);
    return `**ArthaGraph Quick Guidance on "${userQuery}":**\n\n• **Trade Strategy:** In the current market regime (${regimeSummary}), focus strictly on leaders trading above their 20 EMA.\n• **Entry Timing:** Buy on 15-minute pullbacks to the calculated entry zones rather than chasing morning gap-ups.\n• **Risk Control:** Respect the hard stop-loss and trail stops to breakeven once Target 1 is reached.`;
  }
}
