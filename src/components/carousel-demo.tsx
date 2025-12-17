"use client";

"use client";

import Carousel, { type SlideItem } from "@/components/ui/carousel";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from 'react-dom';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/* Minimalist card wrappers used inside slides */
const CardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-full h-full p-3">
    <div className="w-full h-full bg-black/30 border rounded-2xl flex flex-col shadow-[0_6px_18px_rgba(2,6,23,0.6)] min-h-0 border-primary-foreground/20" style={{ padding: '16px' }}>

      <div className="flex-[2.6] flex items-center justify-center w-full" style={{ flexBasis: '0%', flexGrow: 2.6 }}>
        <div className="flex-1 h-full overflow-auto w-full" style={{ flexBasis: '0%', flexGrow: 1 }}>
          <div className="flex flex-col items-center gap-3 h-full">
            {children}
          </div>
        </div>
      </div>

      <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1">
      </div>
    </div>
  </div>
);

// Fear & Greed Gauge - refactored structure with accessible metric and animated needle
function FearGreedGauge() {
  const [value, setValue] = useState<number | null>(null);
  const [label, setLabel] = useState<string>("—");
  const [trend, setTrend] = useState<number>(0); // -1 down, 0 neutral, 1 up
  const prevRef = React.useRef<number | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    const load = async () => {
      try {
        const res = await fetch("https://api.alternative.me/fng/?limit=1", { cache: "no-store" });
        const json = await res.json();
        const v = Number(json?.data?.[0]?.value ?? 50);
        const numeric = clamp(isNaN(v) ? 50 : v, 0, 100);
        const prev = prevRef.current;
        if (prev != null) {
          if (numeric > prev) setTrend(1);
          else if (numeric < prev) setTrend(-1);
          else setTrend(0);
        }
        prevRef.current = numeric;
        setValue(numeric);
        setLabel(json?.data?.[0]?.value_classification ?? "Neutral");
      } catch {
        setValue(50);
        setLabel("Neutral");
      }
    };
    load();
    timer = setInterval(load, 60 * 60 * 1000);
    return () => { if (timer) clearInterval(timer); };
  }, []);

  const v = clamp(value ?? 50, 0, 100);
  const pct = Math.round(v);
  const angle = (pct / 100) * 180 - 180;
  // interpolate color from gradient stops: 0% red -> 50% yellow -> 100% green
  const hexToRgb = (hex: string) => {
    const h = hex.replace('#','');
    const bigint = parseInt(h.length===3? h.split('').map(c=>c+c).join('') : h,16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  };
  const rgbToCss = (c: {r:number,g:number,b:number}) => `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;
  const lerp = (a:number,b:number,t:number) => a + (b-a)*t;
  const interp = (c1:string,c2:string,t:number) => {
    const A = hexToRgb(c1); const B = hexToRgb(c2);
    return rgbToCss({ r: lerp(A.r,B.r,t), g: lerp(A.g,B.g,t), b: lerp(A.b,B.b,t) });
  };
  const labelColor = (() => {
    const p = Math.max(0, Math.min(100, pct));
    if (p <= 50) {
      // red -> yellow
      return interp('#ef4444','#f59e0b', p/50);
    }
    // yellow -> green
    return interp('#f59e0b','#22c55e', (p-50)/50);
  })();


  return (
    <CardShell>
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 min-h-0">
        <div className="text-base text-muted-foreground mb-0">Fear & Greed</div>

        <div className="gauge-visual" role="img" aria-label={`Fear and Greed gauge: ${pct}`}>
          <svg viewBox="0 0 120 70" className="w-44 h-24 mx-auto">
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <path d="M10 60 A50 50 0 0 1 110 60" stroke="url(#g1)" strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.98" />
            <g transform={`translate(60,60) rotate(${angle.toFixed(2)})`}>
              <rect x="0" y="-3" width="32" height="6" rx="3" fill="#e6edf3" opacity="0.98" />
            </g>
          </svg>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <div style={{ fontSize: '30px', fontWeight: 600, lineHeight: '30px' }} aria-live="polite">{pct}</div>
          </div>
          <div style={{ color: labelColor, fontSize: '18px', fontWeight: 500, lineHeight: '28px' }}>{(function(v:number){ if(v<=20) return 'Extreme Fear'; if(v<=40) return 'Fear'; if(v<=60) return 'Neutral'; if(v<=80) return 'Greed'; return 'Extreme Greed'; })(pct)}</div>
        </div>

      </div>
    </CardShell>
  );
}

function Trending() {
  // Fetch top trending search queries from CoinGecko (compact, top-5)
  const [items, setItems] = useState<Array<{id:string,name:string,symbol:string,thumb?:string,market_cap_rank?:number}>>([]);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/search/trending');
        const json = await res.json();
        if (!active) return;
        const coins = Array.isArray(json?.coins) ? json.coins.map((c: any) => c.item).slice(0, 5) : [];
        setItems(coins);
      } catch (e) {
        setItems([]);
      }
    };
    load();
    const t = setInterval(load, 60 * 60 * 1000);
    return () => { active = false; clearInterval(t); };
  }, []);

  return (
    <CardShell>
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 min-h-0">
        <div className="text-sm text-muted-foreground">Top-5 Search Trends</div>
        <div className="w-full mt-1 px-1">
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center">No data</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {items.map((c, idx) => (
                <div key={c.id} className="flex items-center justify-between gap-3 px-1 py-0.5 rounded-md border border-white/8 bg-white/5 h-8 min-h-0 overflow-hidden">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {c.thumb ? <img src={c.thumb} alt={c.name} className="w-full h-full object-contain" /> : <div className="text-[11px] font-semibold">{c.symbol?.slice(0,1).toUpperCase()}</div>}
                    </div>
                    <div className="min-w-0 flex flex-col gap-0 leading-tight">
                      <div className="text-[13px] font-semibold text-foreground truncate leading-tight">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate leading-none">{c.symbol?.toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-1 py-0.5 bg-primary-foreground/8 rounded text-[11px] font-medium">#{idx + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CardShell>
  );
}

function DominanceAltseason() {
  const [composite, setComposite] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<{ dominance: number; performance: number; breadth: number; volume: number } | null>(null);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const TOP_N = 100; // use top 100 market cap alts
  // weights (sum 1): performance 40%, dominance 30%, breadth 20%, volume 10%
  const w = { performance: 0.4, dominance: 0.3, breadth: 0.2, volume: 0.1 };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        // 1) global dominance
        const gRes = await fetch('https://api.coingecko.com/api/v3/global');
        const gJson = await gRes.json();
        const btcDom = Number(gJson?.data?.market_cap_percentage?.btc ?? gJson?.market_cap_percentage?.btc ?? NaN);

        // 2) top markets with 30d change and volumes
        // request one extra to include BTC and then filter it out
        const marketsRes = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=101&page=1&price_change_percentage=30d');
        const markets = await marketsRes.json();
        if (!active) return;

        if (!Array.isArray(markets) || Number.isNaN(btcDom)) {
          setComposite(null);
          setBreakdown(null);
          return;
        }

        const btcEntry = markets.find((m: any) => (m.id === 'bitcoin' || (m.symbol || '').toLowerCase() === 'btc'));
        const btc30 = Number(btcEntry?.price_change_percentage_30d_in_currency ?? btcEntry?.price_change_percentage_30d ?? NaN);

        // select top N alts excluding bitcoin
        const alts = markets.filter((m: any) => (m.id !== 'bitcoin' && (m.symbol || '').toLowerCase() !== 'btc')).slice(0, TOP_N);

        // performance: % of alts outperforming BTC over 30d
        const perfCount = alts.reduce((s: number, a: any) => {
          const a30 = Number(a?.price_change_percentage_30d_in_currency ?? a?.price_change_percentage_30d ?? NaN);
          return s + ((Number.isFinite(a30) && Number.isFinite(btc30) && a30 > btc30) ? 1 : 0);
        }, 0);
        const performancePct = (perfCount / Math.max(1, alts.length)) * 100;

        // breadth: % of alts with positive 30d returns
        const positiveCount = alts.reduce((s: number, a: any) => {
          const a30 = Number(a?.price_change_percentage_30d_in_currency ?? a?.price_change_percentage_30d ?? NaN);
          return s + ((Number.isFinite(a30) && a30 > 0) ? 1 : 0);
        }, 0);
        const breadthPct = (positiveCount / Math.max(1, alts.length)) * 100;

        // volume: alt volume share among selected (alt vs alt+btc)
        const altVol = alts.reduce((s: number, a: any) => s + (Number(a?.total_volume ?? a?.total_volume ?? 0) || 0), 0);
        const btcVol = Number(btcEntry?.total_volume ?? btcEntry?.total_volume ?? 0) || 0;
        const volumeShare = (altVol + btcVol) > 0 ? (altVol / (altVol + btcVol)) * 100 : 0;

        const dominancePct = Number.isFinite(btcDom) ? Math.max(0, Math.min(100, 100 - btcDom)) : 0;

        // composite
        const comp = clamp(
          w.performance * performancePct +
          w.dominance * dominancePct +
          w.breadth * breadthPct +
          w.volume * volumeShare,
          0,
          100
        );

        if (active) {
          setBreakdown({ dominance: dominancePct, performance: performancePct, breadth: breadthPct, volume: volumeShare });
          setComposite(comp);
        }
      } catch (e) {
        if (active) {
          setComposite(null);
          setBreakdown(null);
        }
      }
    };

    load();
    const t = setInterval(load, 60 * 60 * 1000);
    return () => { active = false; clearInterval(t); };
  }, []);

  return (
    <CardShell>
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 min-h-0">
        <div className="w-full flex justify-end -mt-6">
          <div className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-muted-foreground">BTC Dominance {breakdown ? `${(100 - breakdown.dominance).toFixed(1)}%` : '—'}</div>
        </div>

        <div className="text-sm text-muted-foreground mt-2 relative">Altseason Index</div>
        <div className="mt-1">
          <div className="flex items-center gap-2">
            <div className="text-4xl font-extrabold text-foreground opacity-90">{composite != null ? `${composite.toFixed(1)}%` : '—'}</div>

            {/* tooltip trigger */}
            <div>
              <button
                ref={btnRef as any}
                aria-label="About Altseason Index"
                onMouseEnter={(e) => {
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setTooltipPos({ x: r.left + r.width / 2, y: r.top });
                  setTooltipOpen(true);
                }}
                onFocus={(e) => {
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setTooltipPos({ x: r.left + r.width / 2, y: r.top });
                  setTooltipOpen(true);
                }}
                onMouseLeave={() => setTooltipOpen(false)}
                onBlur={() => setTooltipOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/8 text-[12px] text-white/80 hover:bg-white/10 focus:outline-none -mt-0.5 ml-1.5"
              >
                ?
              </button>
            </div>

            {tooltipOpen && tooltipPos && typeof document !== 'undefined' && createPortal(
              <div onMouseEnter={() => setTooltipOpen(true)} onMouseLeave={() => setTooltipOpen(false)} style={{ position: 'fixed', left: tooltipPos.x, top: tooltipPos.y - 8, transform: 'translate(-50%, -100%)', zIndex: 9999 }}>
                <div role="tooltip" className="w-[280px] bg-black/90 border border-white/10 text-white/90 p-3 rounded-md text-[12px] shadow-lg leading-relaxed">
                  Composite Altseason Index — weighted score (Performance, Dominance, Breadth, Volume). Based on top 100 alts 30d returns. Higher means stronger Altseason.
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>

        <div className="w-full mt-2">
          <div className="w-full flex items-center justify-between mb-2 px-1">
            <div className="text-[12px] font-medium text-muted-foreground">Bitcoin Season</div>
            <div className="text-[12px] font-medium text-muted-foreground">Altseason</div>
          </div>

          <div className="relative h-4 rounded-full bg-white/8 overflow-hidden border border-white/6">
            <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-yellow-400 to-sky-500" />

            {typeof composite === 'number' && (
              <div className="absolute top-0 h-full pointer-events-none transition-all duration-700" style={{ left: `${composite}%`, transform: 'translateX(-50%)' }}>
                <div className="h-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full border border-white/20 shadow-sm" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function DirectionalSentimentIndex() {
  const [symbol, setSymbol] = useState<string>("BTCUSDT");
  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"] as const;
  const period = "1h";

  const [dataMap, setDataMap] = useState<Record<string, { longPct: number; shortPct: number; ratio: number | null }>>({});

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadAll = async () => {
      if (!mounted) return;
      try {
        const promises = symbols.map(s =>
          fetch(`/api/longshort?symbol=${encodeURIComponent(s)}&period=${encodeURIComponent(period)}`, { signal: controller.signal, cache: "no-store" })
            .then(res => res.ok ? res.json() : null)
            .then(json => ({ s, json }))
            .catch(() => ({ s, json: null }))
        );
        const results = await Promise.all(promises);
        if (!mounted) return;
        const next: Record<string, { longPct: number; shortPct: number; ratio: number | null }> = {};
        results.forEach(({ s, json }) => {
          if (json && (json.longPct ?? null) !== null) {
            next[s] = { longPct: json.longPct, shortPct: json.shortPct, ratio: json.ratio ?? null };
          }
        });
        setDataMap(prev => ({ ...prev, ...next }));
      } catch (e) {
        // ignore errors
      }
    };

    loadAll();
    const t = setInterval(loadAll, 60 * 60 * 1000);
    return () => { mounted = false; controller.abort(); clearInterval(t); };
  }, []);

  const data = dataMap[symbol] ?? null;
  const long = Math.round(data?.longPct ?? 50);
  const short = Math.round(data?.shortPct ?? 50);

  return (
    <CardShell>
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 min-h-0">
        <div className="text-sm text-muted-foreground">Directional Sentiment Index</div>
        <div className="text-[11px] text-muted-foreground">Account-level data</div>

        <div className="flex items-center gap-2">
          {symbols.map(s => (
            <button
              key={s}
              onClick={() => setSymbol(s)}
              className={`px-2.5 h-7 rounded-md border text-xs font-medium transition-colors ${symbol===s ? 'bg-white/10 border-white/20 text-foreground' : 'bg-transparent border-white/10 text-muted-foreground hover:border-white/20'}`}
            >{s.replace('USDT','')}</button>
          ))}
        </div>

        <div className="w-full px-1">
          <div className="relative h-6 w-full rounded-full border border-white/10 overflow-hidden bg-white/5">
            <div className="absolute left-0 top-0 h-full bg-emerald-500/80 transition-all duration-500" style={{ width: `${long}%` }} />
            <div className="absolute right-0 top-0 h-full bg-rose-500/80 transition-all duration-500" style={{ width: `${short}%` }} />
            <div className="absolute inset-0 flex items-center justify-between px-2 text-[11px] font-semibold">
              <span className="text-emerald-100">Long {long}%</span>
              <span className="text-rose-100">Short {short}%</span>
            </div>
          </div>
        </div>

        <div className="w-full flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex w-2 h-2 rounded-full bg-emerald-400/90"></span>
            <span>Long</span>
          </div>
          <div className="text-xs font-medium text-foreground">{data?.ratio ? `${data.ratio.toFixed(2)}` : '—'}</div>
          <div className="flex items-center gap-2">
            <span>Short</span>
            <span className="inline-flex w-2 h-2 rounded-full bg-rose-400/90"></span>
          </div>
        </div>

      </div>
    </CardShell>
  );
}

export default function CarouselDemo() {
  const slides: SlideItem[] = [
    { title: "Fear ↔ Greed", button: "", content: <FearGreedGauge /> },
    { title: "Directional Sentiment Index", button: "", content: <DirectionalSentimentIndex /> },
    { title: "Trending 24h", button: "", content: <Trending /> },
    { title: "Altseason Index", button: "", content: <DominanceAltseason /> },
  ];

  return (
    <div className="relative overflow-hidden w-full h-full py-8">
      <Carousel slides={slides} />
    </div>
  );
}
