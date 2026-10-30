import React, { useState } from 'react';
import { TargetScenario } from '../types/stock';

interface InteractiveStockChartProps {
  symbol: string;
  cmp: number;
  targetsAndSL: TargetScenario;
  chartData: {
    dates: string[];
    prices: number[];
    ema20: number[];
    ema50: number[];
    volumes: number[];
  };
}

export const InteractiveStockChart: React.FC<InteractiveStockChartProps> = ({
  symbol,
  cmp,
  targetsAndSL,
  chartData
}) => {
  const [showIndicators, setShowIndicators] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { dates, prices, ema20, ema50, volumes } = chartData;
  const count = prices.length;
  if (count === 0) return null;

  // Chart coordinate math
  const allPrices = [
    ...prices,
    ...ema20,
    ...ema50,
    targetsAndSL.t1,
    targetsAndSL.t2,
    targetsAndSL.hardStopLoss
  ];
  const minPrice = Math.min(...allPrices) * 0.985;
  const maxPrice = Math.max(...allPrices) * 1.015;
  const priceRange = maxPrice - minPrice;

  const width = 640;
  const height = 240;
  const paddingLeft = 10;
  const paddingRight = 65;
  const paddingTop = 20;
  const paddingBottom = 45;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVol = Math.max(...volumes);

  const getX = (index: number) => paddingLeft + (index / (count - 1)) * chartWidth;
  const getY = (price: number) => paddingTop + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

  // Generate SVG path strings
  const pricePath = prices.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p)}`).join(' ');
  const ema20Path = ema20.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p)}`).join(' ');
  const ema50Path = ema50.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p)}`).join(' ');

  // Gradient area
  const areaPath = `${pricePath} L ${getX(count - 1)} ${paddingTop + chartHeight} L ${getX(0)} ${paddingTop + chartHeight} Z`;

  const yT1 = getY(targetsAndSL.t1);
  const yT2 = getY(targetsAndSL.t2);
  const ySL = getY(targetsAndSL.hardStopLoss);
  const yCMP = getY(cmp);

  return (
    <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {symbol} Swing Price Action (20-Day Chart)
          </span>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-blue-700 font-semibold">
              <span className="w-2 h-0.5 bg-blue-600 rounded-full inline-block"></span> Price (₹{cmp})
            </span>
            {showIndicators && (
              <>
                <span className="flex items-center gap-1 text-cyan-600">
                  <span className="w-2 h-0.5 bg-cyan-500 rounded-full inline-block"></span> 20 EMA
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <span className="w-2 h-0.5 bg-amber-500 rounded-full inline-block"></span> 50 EMA
                </span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowIndicators(!showIndicators)}
          className="text-xs px-2.5 py-1 rounded-md bg-white border border-blue-200 hover:bg-blue-50 text-slate-700 font-medium transition-colors shadow-2xs"
        >
          {showIndicators ? 'Hide EMAs' : 'Show EMAs'}
        </button>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none font-mono"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={`priceGrad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight}
            stroke="#e2e8f0"
            strokeWidth="1"
          />

          {/* Volume bars */}
          {volumes.map((vol, i) => {
            const barHeight = (vol / maxVol) * 35;
            const barWidth = (chartWidth / count) * 0.55;
            const x = getX(i) - barWidth / 2;
            const y = paddingTop + chartHeight - barHeight;
            const isBullish = i > 0 ? prices[i] >= prices[i - 1] : true;
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={isBullish ? '#10b981' : '#f43f5e'}
                opacity={0.35}
                rx={1}
              />
            );
          })}

          {/* Target 2 Line (Purple) */}
          <line
            x1={paddingLeft}
            y1={yT2}
            x2={width - paddingRight}
            y2={yT2}
            stroke="#7c3aed"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
          <text x={width - paddingRight + 6} y={yT2 + 3} fill="#7c3aed" fontSize="9" fontWeight="bold">
            T2 ₹{targetsAndSL.t2}
          </text>

          {/* Target 1 Line (Emerald) */}
          <line
            x1={paddingLeft}
            y1={yT1}
            x2={width - paddingRight}
            y2={yT1}
            stroke="#059669"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
          <text x={width - paddingRight + 6} y={yT1 + 3} fill="#059669" fontSize="9" fontWeight="bold">
            T1 ₹{targetsAndSL.t1}
          </text>

          {/* CMP Reference (Solid Slate) */}
          <line
            x1={paddingLeft}
            y1={yCMP}
            x2={width - paddingRight}
            y2={yCMP}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <text x={width - paddingRight + 6} y={yCMP + 3} fill="#475569" fontSize="9">
            CMP ₹{cmp}
          </text>

          {/* Stop Loss Line (Crimson) */}
          <line
            x1={paddingLeft}
            y1={ySL}
            x2={width - paddingRight}
            y2={ySL}
            stroke="#dc2626"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
          <text x={width - paddingRight + 6} y={ySL + 3} fill="#dc2626" fontSize="9" fontWeight="bold">
            SL ₹{targetsAndSL.hardStopLoss}
          </text>

          {/* Gradient area under price */}
          <path d={areaPath} fill={`url(#priceGrad-${symbol})`} />

          {/* EMAs */}
          {showIndicators && (
            <>
              <path d={ema50Path} fill="none" stroke="#d97706" strokeWidth="1.5" strokeOpacity="0.8" />
              <path d={ema20Path} fill="none" stroke="#0891b2" strokeWidth="1.5" strokeOpacity="0.8" />
            </>
          )}

          {/* Main Price Line */}
          <path d={pricePath} fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" />

          {/* Data Points */}
          {prices.map((p, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(p)}
              r={hoverIndex === i ? 5 : i === count - 1 ? 4 : 2}
              fill={hoverIndex === i ? '#ffffff' : '#2563eb'}
              stroke="#1d4ed8"
              strokeWidth="1.5"
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoverIndex(i)}
            />
          ))}

          {/* Dates */}
          {dates.map((d, i) => {
            if (i % 4 === 0 || i === count - 1) {
              return (
                <text
                  key={i}
                  x={getX(i)}
                  y={height - 12}
                  fill="#64748b"
                  fontSize="9"
                  textAnchor="middle"
                >
                  {d}
                </text>
              );
            }
            return null;
          })}

          {/* Hover tooltip */}
          {hoverIndex !== null && (
            <g transform={`translate(${getX(hoverIndex)}, ${getY(prices[hoverIndex]) - 25})`}>
              <rect
                x="-40"
                y="-15"
                width="80"
                height="22"
                rx="4"
                fill="#1e293b"
              />
              <text x="0" y="0" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                ₹{prices[hoverIndex]}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 mt-2 pt-2 border-t border-blue-100">
        <div className="flex items-center gap-4">
          <span>Target 1: <strong className="text-emerald-700 font-mono">+{targetsAndSL.t1GainPct}%</strong></span>
          <span>Target 2: <strong className="text-purple-700 font-mono">+{targetsAndSL.t2GainPct}%</strong></span>
          <span>Risk: <strong className="text-rose-600 font-mono">-{targetsAndSL.stopLossLossPct}%</strong></span>
        </div>
        <div className="font-mono text-blue-700 font-bold">
          R:R {targetsAndSL.riskRewardRatio}
        </div>
      </div>
    </div>
  );
};
