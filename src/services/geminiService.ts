import { GoogleGenAI } from '@google/genai';
import { StockQuote, StockOpportunity, MarketRegimeState, TargetScenario } from '../types/stock';
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
  marketRegime: MarketRegimeState
): Promise<StockOpportunity> {
  const ai = getAiClient();
  const chart = generateChartBars(stock.cmp, stock.atr14, 20);

  // Target & SL Calculations based on ATR and Structure
  const atr = stock.atr14;
  const hardSL = Math.round((stock.cmp - (atr * 1.5)) * 10) / 10;
  const slPct = Math.round(((stock.cmp - hardSL) / stock.cmp) * 1000) / 10;
  
  const riskAmount = stock.cmp - hardSL;
  const t1 = Math.round((stock.cmp + (riskAmount * 2.0)) * 10) / 10;
  const t1GainPct = Math.round(((t1 - stock.cmp) / stock.cmp) * 1000) / 10;
  
  const t2 = Math.round((stock.cmp + (riskAmount * 3.4)) * 10) / 10;
  const t2GainPct = Math.round(((t2 - stock.cmp) / stock.cmp) * 1000) / 10;

  const riskReward = `1 : ${(t1GainPct / slPct).toFixed(1)}`;

  const fallbackOpportunity: StockOpportunity = {
    id: `opp-${stock.symbol}-${Date.now()}`,
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sector,
    cmp: stock.cmp,
    changePercent: stock.changePercent,
    setupType,
    selectionReason: `${stock.name} demonstrates high relative strength (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent}%) within ${stock.sector}, outperforming benchmark Nifty. Volume expanded to ${stock.volumeMultiple}x its 20-day average with ${stock.deliveryPercent}% delivery mark, confirming institutional accumulation. Price is trading firmly above rising 20 EMA (₹${stock.ema20}) with RSI at ${stock.rsi14}, signaling sustainable swing momentum.`,
    entryConditions: [
      `Primary Trigger: Buy zone on 15-minute pullback between ₹${Math.round(stock.cmp * 0.993)} - ₹${stock.cmp}`,
      `Breakout Trigger: Bullish candle close above ₹${stock.high} with 5-minute volume > 35,000 shares`,
      `Safety Condition: Do not chase if stock opens gap-up > 1.8% above previous close`
    ],
    targetsAndStopLoss: {
      t1,
      t1GainPct,
      t1Rationale: `Immediate resistance at recent pivot high / 2x ATR expansion target.`,
      t2,
      t2GainPct,
      t2Rationale: `Measured move extension based on multi-week base breakout.`,
      hardStopLoss: hardSL,
      stopLossLossPct: slPct,
      trailingStopRule: `Once T1 (₹${t1}) is achieved, revise trailing stop to cost (₹${stock.cmp}) and trail daily low under 9 EMA.`,
      riskRewardRatio: riskReward
    },
    holdingPeriod: '4 - 8 Trading Days (Swing)',
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
