# Indian Stock Market Intelligence (ArthaGraph)

An autonomous **LangGraph-powered** Indian Stock Market Intelligence Agent designed for the **National Stock Exchange (NSE)**. It scans equities across high-liquidity sectors, analyzes macro market conditions, detects institutional momentum patterns, enforces mathematical risk parameters, and synthesizes institutional-grade entry, target, and stop-loss roadmaps.

---

## 1. Functional Overview

### 1.1 Purpose & Problem Statement
Retail and discretionary swing traders frequently suffer from:
- Chasing morning gap-ups at the open without confirmation.
- Arbitrary stop-loss placement susceptible to standard daily volatility noise.
- Low reward-to-risk setups ($< 1:1$) leading to negative long-term expectancy.
- Lack of institutional delivery volume awareness.

**Indian Stock Market Intelligence** solves this by automating the end-to-end quantitative workflow of an institutional swing desk:
1. **Macro Regime Filter:** Checks if broader Indian markets (Nifty 50, Bank Nifty, India VIX, FII/DII liquidity) support aggressive buying or defensive capital preservation.
2. **Sector Relative Strength:** Identifies where institutional funds are actively rotating (e.g. Defense, Capital Goods, Auto, Retail).
3. **Multi-Factor Quantitative Screener:** Evaluates 20/50/200 Exponential Moving Averages, RSI momentum, 20-day volume expansion, and delivery percentage.
4. **Actionable Trading Plans:** Generates concrete price targets (Conservative T1 & Extended T2), dynamic ATR-based hard stop-loss, trailing rules, and trade invalidation triggers.

---

### 1.2 Daily Intelligence Output (The Core Deliverable)
Every shortlisted stock card contains:
- **Action Price Roadmap:** Visual price ladder showing $\text{Stop-Loss} \rightarrow \text{Entry Zone (CMP)} \rightarrow \text{Target 1} \rightarrow \text{Target 2}$.
- **Why the Stock Was Selected:** Multi-factor institutional thesis (relative strength, sector outperformance, volume footprint).
- **Potential Entry Conditions:** Specific 15-minute pullback trigger or breakout candle condition with gap-up safety caveats (e.g., avoid chasing if opening gap $> 1.8\%$).
- **Target and Stop-Loss Scenarios:**
  - **Target 1 (Conservative):** 2x ATR expansion target or immediate structural resistance ($+6\%$ to $+9\%$).
  - **Target 2 (Extended):** Measured move extension for multi-week trend runners ($+11\%$ to $+18\%$).
  - **Hard Stop-Loss:** Calculated dynamically at $\text{CMP} - (1.5 \times \text{ATR}_{14})$ to sit outside random market noise.
  - **Trailing Stop Rule:** Automatic instruction to move stop-loss to cost price once Target 1 is achieved and trail 9 EMA.
  - **Risk/Reward Ratio:** Strictly enforced institutional minimum ($\ge 1:2.0$).
- **Expected Holding Period:** Swing trading duration (typically 3 to 8 trading days).
- **Risks and Invalidation Conditions:** Concrete technical breakdowns (e.g., daily close below 20 EMA) that void the setup.
- **Confidence & Supporting Evidence:** Quantitative score and evidence badges (e.g., volume multiple, delivery %, EMA cross).
- **Position Sizing Calculator:** Custom modal calculating exact share count and maximum rupee loss based on user capital and risk tolerance.

---

### 1.3 The 3 Investment Horizons (Swing, Short Term & Long Term)

The agent allows users to dynamically toggle between three distinct market holding horizons. Selecting an option automatically adapts the screening algorithm, volatility buffers, target scenarios, and expected holding periods:

| Horizon | Holding Period | Target Range | Stop-Loss Calibration | Primary Technical Anchor | Trader Profile |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **⚡ Swing** | 3 – 8 Trading Days | **T1:** $+6\%$ to $+9\%$<br>**T2:** $+10\%$ to $+14\%$ | $1.5 \times \text{ATR}_{14}$ (Tight stop below 20 EMA) | 20-Day EMA & Volume Surge ($\ge 1.8\times$) | Active momentum swing traders seeking quick turns. |
| **📈 Short Term** | 4 – 12 Weeks (1–3 Months) | **T1:** $+12\%$ to $+18\%$<br>**T2:** $+20\%$ to $+28\%$ | $2.2 \times \text{ATR}_{14}$ (Anchored below 50 EMA) | 50-Day EMA & Sector Rotation Leadership | Positional traders & working professionals riding multi-week waves. |
| **💎 Long Term** | 6 – 18+ Months | **T1:** $+35\%$ to $+45\%$<br>**T2:** $+60\%$ to $+85\%+$ | $3.5 \times \text{ATR}_{14}$ (Cushioned $4\%$ below 200 EMA) | 200-Day EMA & Delivery Accumulation ($>60\%$) | Wealth builders targeting multi-bagger compounders. |

---

### 1.4 The 4 Quantitative Scan Setups

| Setup Strategy | Core Thesis | Key Quantitative Rules | Best Suited For |
| :--- | :--- | :--- | :--- |
| **Balanced Multi-Factor** *(Recommended)* | Harmony across trend, momentum, volume, and delivery. | $\text{CMP} > 20\text{ EMA} > 50\text{ EMA}$, $\text{RSI}(14) \in [52, 72]$, $\text{Vol} \ge 1.5\times$ or $\text{Delivery} \ge 50\%$. | Steady, high win-rate swing trades (4–8 days). |
| **Volume Breakouts** | Institutional momentum expansion near 52-week or base highs. | $\text{Vol} \ge 1.8\times - 2.5\times$, within $5\%-10\%$ of 52W High, $\text{RSI} > 58$, close in top 20% of range. | Fast, aggressive 2–5 day momentum expansions. |
| **20 EMA Dips** | "Buy the dip" at key structural support in strong uptrends. | $\text{Uptrend intact}$, price within $2\%-3.5\%$ of 20 EMA, declining pullback volume, reversal hammer. | Conservative traders wanting low-risk entries ($1:2.5+$ R:R). |
| **High Delivery** | Smart money accumulation with overnight Demat transfers. | $\text{Delivery \%} \ge 55\% - 70\%+$, rising price, low intraday churn. | Riding alongside Mutual Funds, FIIs, and DIIs. |

---

### 1.5 Interactive Follow-up AI Assistant
- Users can click **"Ask AI Follow-up"** or click **"Ask AI About [Stock]"** directly on any card.
- Grounded in current market context, providing answers on entry timing, trailing rules, and sector rotation without giving blind financial advice.

---

## 2. Technical Architecture

### 2.1 Technology Stack

```
Frontend:            React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion
State Machine:       @langchain/langgraph (StateGraph DAG)
Reasoning LLM:       @google/genai (Gemini 3.8 Flash)
Backend Server:      Express, tsx, Node.js v22
Build Tool:          Vite 8
Deployment Target:   Google Cloud Run / AI Studio Applet
```

---

### 2.2 LangGraph StateGraph Architecture

The agent executes as a **Directed Acyclic Graph (DAG)** using `@langchain/langgraph`:

```
               [__START__]
                    │
                    ▼
          ┌───────────────────┐
          │ market_regime_node│  Evaluates Nifty 50, India VIX, FII/DII net flows
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │sector_momentum_node│ Ranks 9 NSE sector indices for Relative Strength
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │  nse_screener_node│  Filters candidates tailored to Horizon ('SWING'|'SHORT_TERM'|'LONG_TERM')
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │deep_technical_node│  Structural taxonomy (Breakouts, EMA Dips, Compounding Base)
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │risk_invalidation_n│  Calculates horizon-specific ATR stop and invalidations
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │gemini_synthesis_no│  Server-side Gemini 3.8 Flash institutional thesis synthesis
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │daily_shortlist_nod│  Sorts by confidence, compiles final briefing
          └─────────┬─────────┘
                    │
                    ▼
                [__END__]
```

#### Node Breakdown:
1. **`market_regime_node`**: Ingests Nifty 50, Bank Nifty, India VIX, and FII/DII institutional cash flow to determine market bias (`Aggressive Long`, `Selective Long`, or `Hedging Recommended`).
2. **`sector_momentum_node`**: Ranks 9 NSE sectoral indices (Defense, Retail/EMS, Auto, Capital Goods, Healthcare, Banking, IT, Metals, Energy).
3. **`nse_screener_node`**: Runs multi-factor screening across liquid NSE stocks based on both the strategy preset (`BALANCED`, `MOMENTUM_BREAKOUT`, `EMA_PULLBACK`, `HIGH_DELIVERY`) and the chosen **Investment Horizon** (`SWING`, `SHORT_TERM`, `LONG_TERM`).
4. **`deep_technical_node`**: Classifies pattern types (Breakouts, EMA Dips, Cup & Handle Retests, Long Term Compounding Bases).
5. **`risk_invalidation_node`**: Calculates dynamic ATR stop-loss and validates the risk-to-reward ratio customized to the holding timeframe.
6. **`gemini_synthesis_node`**: Calls `gemini-3.8-flash` concurrently (`Promise.all` with a 5-second timeout safeguard) to produce institutional entry triggers and invalidations for the selected horizon.
7. **`daily_shortlist_node`**: Compiles, sorts by confidence score, and prepares state outputs.

---

### 2.3 Mathematical Formulations Across Horizons

#### 1. Swing Trading Horizon (`SWING`)
- **Hard Stop-Loss:** $\text{CMP} - (1.5 \times \text{ATR}_{14})$
- **Target 1:** $\text{CMP} + (2.0 \times \text{ATR}_{14})$
- **Target 2:** $\text{CMP} + (3.4 \times \text{ATR}_{14})$
- **Holding Period:** 3 to 8 trading days
- **Trailing Rule:** Move SL to cost on Target 1; trail 9 EMA daily low.

#### 2. Short Term Positional Horizon (`SHORT_TERM`)
- **Hard Stop-Loss:** $\min(\text{CMP} - [2.2 \times \text{ATR}_{14}], \text{EMA}_{50} \times 0.98)$
- **Target 1:** $\text{CMP} + (2.5 \times 2.2 \times \text{ATR}_{14})$
- **Target 2:** $\text{CMP} + (4.5 \times 2.2 \times \text{ATR}_{14})$
- **Holding Period:** 4 to 12 weeks
- **Trailing Rule:** Trail stop-loss under 20 EMA on daily close once Target 1 is hit.

#### 3. Long Term Compounding Horizon (`LONG_TERM`)
- **Hard Stop-Loss:** $\min(\text{CMP} - [3.5 \times \text{ATR}_{14}], \text{EMA}_{200} \times 0.96)$
- **Target 1:** $\text{CMP} + (3.5 \times 3.5 \times \text{ATR}_{14})$
- **Target 2:** $\text{CMP} + (7.0 \times 3.5 \times \text{ATR}_{14})$
- **Holding Period:** 6 to 18+ months
- **Trailing Rule:** Quarterly evaluation; trail stop under rising 200-Day / 50-Week EMA.

#### Position Sizing Formula
$$\text{Max Risk Budget (₹)} = \text{Total Capital (₹)} \times \left(\frac{\text{Risk \%}}{100}\right)$$
$$\text{Recommended Quantity} = \left\lfloor \frac{\text{Max Risk Budget}}{\text{CMP} - \text{Hard Stop-Loss}} \right\rfloor$$

---

### 2.4 Server API Endpoints (`server.ts`)

| HTTP Method | Route | Body Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | — | Health check, server status, Gemini API configuration verification. |
| `GET` | `/api/market-regime` | — | Fetches Nifty 50, Bank Nifty, India VIX, FII/DII liquidity, and sector heatmap. |
| `GET` | `/api/stocks` | — | Full universe of liquid NSE equities with technical metrics. |
| `POST` | `/api/run-langgraph-scan` | `{ mode, horizon }` | Executes LangGraph state machine end-to-end for chosen strategy and horizon (`SWING`, `SHORT_TERM`, `LONG_TERM`). |
| `POST` | `/api/analyze-stock/:symbol` | `{ setupType, horizon }` | On-demand LangGraph evaluation for any single NSE stock (e.g., `BEL`, `HAL`, `TRENT`). |
| `POST` | `/api/chat` | `{ message, history, context }` | Multi-turn conversational endpoint powered by `gemini-3.8-flash` with full context of today's shortlist and market regime. |

---

### 2.5 Data Refresh Cadence
1. **Automatic Background Refresh:** Every 5 minutes (`setInterval` timer with visual countdown pill).
2. **Instant Manual Re-Scan:** 1-click **"Re-Scan"** button re-executes the LangGraph DAG in $\sim 2.5\text{ seconds}$.
3. **Horizon Toggle:** Instant switching between Swing, Short Term, and Long Term immediately retrieves and prioritizes the corresponding setups.
4. **On-Demand Ticker Search:** Immediate synthesis of any typed NSE stock.

---

## 3. Getting Started

### 3.1 Prerequisites
- Node.js $\ge 20$
- Valid `GEMINI_API_KEY` configured in `.env` (automatically injected in AI Studio).

### 3.2 Running the Application
```bash
# Install dependencies
npm install

# Start full-stack development server (Express + Vite)
npm run dev

# Compile TypeScript & check lints
npm run lint

# Build for production
npm run build

# Start production server
npm start
```
The application will be live at `http://localhost:3000`.

---

## 4. Disclaimer
*This intelligence agent is built for quantitative research, algorithmic analysis, and educational purposes. Always verify risk limits, position sizes, and trade invalidation levels before executing orders on the exchange.*
