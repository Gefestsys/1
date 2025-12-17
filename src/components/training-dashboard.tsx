"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type LogLine = {
  id: number;
  text: string;
  kind: "code" | "log" | "info" | "success" | "warn";
};

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

type Candle = { open: number; high: number; low: number; close: number; absoluteIndex: number };

interface CandleChartData extends Candle {
  index: number;
}

interface CandleChartProps {
  candles: Candle[];
  animatingIndices?: Set<number>;
}

function CandleChart({ candles, animatingIndices = new Set() }: CandleChartProps) {
  if (candles.length === 0) {
    return <div className="w-full h-full flex items-center justify-center"><span className="text-xs text-muted-foreground">Waiting for data…</span></div>;
  }

  const values = candles.flatMap((c) => [c.high, c.low]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const margin = span * 0.02;

  const chartRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 220 });

  useEffect(() => {
    if (!chartRef.current) return;
    const updateSize = () => {
      const parent = chartRef.current?.parentElement;
      if (parent) {
        setDimensions({
          width: parent.clientWidth || 600,
          height: parent.clientHeight || 220,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const leftPadding = 60;
  const rightPadding = 40;
  const topPadding = 40;
  const bottomPadding = 40;
  const chartWidth = dimensions.width - leftPadding - rightPadding;
  const chartHeight = dimensions.height - topPadding - bottomPadding;

  const toX = (i: number) => leftPadding + (i / Math.max(1, candles.length - 1)) * chartWidth;
  const toY = (v: number) => topPadding + (1 - (v - (min - margin)) / (span + margin * 2)) * chartHeight;

  return (
    <>
      <style>{`
        @keyframes candleGrow {
          from {
            opacity: 0.3;
            transform: scaleY(0.3);
          }
          to {
            opacity: 1;
            transform: scaleY(1);
          }
        }
      `}</style>
      <svg ref={chartRef} className="w-full h-full" style={{ display: "block" }}>
      {/* Grid lines */}
      {Array.from({ length: 6 }).map((_, i) => {
        const v = min + (i * span) / 5;
        const y = toY(v);
        return (
          <g key={`grid-${i}`}>
            <line x1={leftPadding} x2={dimensions.width - rightPadding} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <text x={leftPadding - 15} y={y + 4} fill="rgba(161,161,170,1)" fontSize="10" textAnchor="end">
              {Math.round(v)}
            </text>
          </g>
        );
      })}

      {/* Axes */}
      <line x1={leftPadding} x2={leftPadding} y1={topPadding} y2={dimensions.height - bottomPadding} stroke="rgba(161,161,170,1)" strokeWidth="1" />
      <line x1={leftPadding} x2={dimensions.width - rightPadding} y1={dimensions.height - bottomPadding} y2={dimensions.height - bottomPadding} stroke="rgba(161,161,170,1)" strokeWidth="1" />

      {/* Candles */}
      {candles.map((c, i) => {
        const x = toX(i);
        const yHigh = toY(c.high);
        const yLow = toY(c.low);
        const yOpen = toY(c.open);
        const yClose = toY(c.close);

        const isUp = c.close >= c.open;
        const color = isUp ? "#22c55e" : "#f43f5e";
        const baseOpacity = isUp ? 0.8 : 0.7;
        const isAnimating = animatingIndices.has(i);
        const displayOpacity = isAnimating ? baseOpacity * 0.3 : baseOpacity;

        const bodyWidth = Math.max(2, Math.min(8, chartWidth / candles.length * 0.5));
        const bodyY = Math.min(yOpen, yClose);
        const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));

        return (
          <g key={i} style={{
            opacity: isAnimating ? "0.3" : "1",
            animation: isAnimating ? "candleGrow 0.4s ease-out forwards" : "none",
            transformOrigin: `${x}px ${(yOpen + yClose) / 2}px`,
            transform: isAnimating ? "scaleY(0.5)" : "scaleY(1)",
            transition: "opacity 0.4s ease-out, transform 0.4s ease-out"
          } as any}>
            <line x1={x} x2={x} y1={yHigh} y2={yLow} stroke={color} strokeOpacity={isAnimating ? "0.3" : "0.7"} strokeWidth="1" />
            <rect x={x - bodyWidth / 2} y={bodyY} width={bodyWidth} height={bodyHeight} fill={color} fillOpacity={displayOpacity} />
          </g>
        );
      })}

      {/* X-axis labels - fixed positions, correct time display */}
      {Array.from({ length: 5 }).map((_, i) => {
        // Fixed screen positions (0%, 25%, 50%, 75%, 100%)
        const screenPosition = (i / 4) * chartWidth + leftPadding;

        // Find which candle is at this screen position
        const displayIdx = Math.round((i / 4) * (candles.length - 1));
        const candle = candles[displayIdx];
        const absoluteIdx = candle?.absoluteIndex ?? 0;

        // Calculate time for this candle
        const totalMinutes = absoluteIdx * 5;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const timeLabel = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        return (
          <text key={`xlabel-${i}`} x={screenPosition} y={dimensions.height - bottomPadding + 20} fill="rgba(161,161,170,1)" fontSize="10" textAnchor="middle">
            {timeLabel}
          </text>
        );
      })}
    </svg>
    </>
  );
}

export default function TrainingDashboard() {
  const [isTraining, setIsTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [maxEpochs] = useState(10);
  const [accuracy, setAccuracy] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [trainingTime, setTrainingTime] = useState("00:00");

  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [liveChangePct, setLiveChangePct] = useState<number | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [baselineSim, setBaselineSim] = useState<number | null>(null);
  const [frozenPrice, setFrozenPrice] = useState<number | null>(null);
  const [frozenPct, setFrozenPct] = useState<number | null>(null);
  const [animatingIndices, setAnimatingIndices] = useState<Set<number>>(new Set());
  const candleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTrainingRef = useRef(false);
  const lastCloseRef = useRef<number | null>(null);
  const trainingTimeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnimationRef = useRef<number | null>(null);
  const trainingStartRef = useRef<number | null>(null);
  const candleCountRef = useRef(0);
  const MAX_CANDLES = 80;

  // Use explicit formatter to avoid server/client locale differences that cause hydration mismatches
  const priceFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatPrice = (p: number) => priceFormatter.format(p);

  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);


  // Auto-scroll logs
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  // Keep ref in sync
  useEffect(() => { isTrainingRef.current = isTraining; }, [isTraining]);

  // Update training time display
  useEffect(() => {
    if (!startedAt) return;

    const updateTime = () => {
      setTrainingTime(formatDuration(Date.now() - startedAt));
    };

    updateTime();
    trainingTimeTimerRef.current = setInterval(updateTime, 100);

    return () => {
      if (trainingTimeTimerRef.current) clearInterval(trainingTimeTimerRef.current);
    };
  }, [startedAt]);

  // Connect to Binance Ticker for real-time BTCUSDT price (always update live values)
  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string);
        if (data && typeof data.c === 'string') {
          const p = Number(parseFloat(data.c).toFixed(2));
          if (!Number.isNaN(p)) setLivePrice(p);
        }
        if (data && typeof data.P === 'string') {
          const cp = Number(parseFloat(data.P).toFixed(2));
          if (!Number.isNaN(cp)) setLiveChangePct(cp);
        }
      } catch {}
    };
    return () => { ws.close(); };
  }, []);

  // Update progress smoothly using requestAnimationFrame
  const updateProgressSmooth = (currentEpoch: number, maxEpochsVal: number, trainingStartTime: number) => {
    const animate = () => {
      const elapsedMs = Date.now() - trainingStartTime;
      const totalDurationMs = maxEpochsVal * 1000;
      const smoothProgress = Math.min(100, (elapsedMs / totalDurationMs) * 100);
      setProgress(Math.round(smoothProgress));

      if (elapsedMs < totalDurationMs) {
        progressAnimationRef.current = requestAnimationFrame(animate);
      }
    };

    if (progressAnimationRef.current) cancelAnimationFrame(progressAnimationRef.current);
    progressAnimationRef.current = requestAnimationFrame(animate);
  };

  // Start/Stop training
  const startTraining = () => {
    if (isTraining) return;
    setIsTraining(true);
    setEpoch(0);
    setAccuracy(0);
    setProgress(0);
    setLogs([
      { id: 1, kind: "code", text: "import tensorflow as tf" },
      { id: 2, kind: "code", text: "model = tf.keras.Sequential([...])" },
      { id: 3, kind: "code", text: "model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])" },
      { id: 4, kind: "info", text: "Starting training loop... 🔄" },
    ]);
    const now = Date.now();
    setStartedAt(now);
    trainingStartRef.current = now;

    // Simulation baseline from current price (or fallback)
    const base = (livePrice ?? 68325.12);
    setBaselineSim(base);
    setFrozenPrice(null);
    setFrozenPct(null);
    lastCloseRef.current = base;
    candleCountRef.current = 0;

    // Start candle simulation - no fixed range limits, window follows the price
    let lastClose = base;
    let trend = 0;
    const seed: Candle[] = Array.from({ length: 60 }, (_, i) => {
      // Realistic trend + volatility (±1.5% max per candle)
      trend += (Math.random() - 0.5) * 0.002;
      trend = Math.max(-0.005, Math.min(0.005, trend));

      const trendComponent = trend * base * 0.008;
      const volatility = (Math.random() - 0.5) * base * 0.008;

      const open = lastClose;
      const close = open + trendComponent + volatility;

      // High and low are based on realistic price movement
      const bodyMin = Math.min(open, close);
      const bodyMax = Math.max(open, close);

      // Upper wick: realistically scaled (±1.5% total with body)
      const upperWickSize = (Math.random() * 0.3 + 0.05) * base * 0.006;
      const high = bodyMax + upperWickSize;

      // Lower wick: realistically scaled (±1.5% total with body)
      const lowerWickSize = (Math.random() * 0.3 + 0.05) * base * 0.006;
      const low = bodyMin - lowerWickSize;

      lastClose = close;
      return { open, high, low, close, absoluteIndex: i };
    });
    candleCountRef.current = 60;
    setCandles(seed);

    let candleTrend = 0;
    if (candleTimerRef.current) clearInterval(candleTimerRef.current);
    candleTimerRef.current = setInterval(() => {
      setCandles((arr) => {
        const prev = arr[arr.length - 1] ?? { open: base, high: base, low: base, close: base };
        const open = prev.close;

        // Realistic drift and volatility - no clamping (±1.5% max per candle)
        candleTrend += (Math.random() - 0.5) * 0.002;
        candleTrend = Math.max(-0.005, Math.min(0.005, candleTrend));

        const trendComponent = candleTrend * open * 0.008;
        const volatility = (Math.random() - 0.5) * open * 0.008;
        const close = open + trendComponent + volatility;

        // Realistic wicks based on body size
        const bodyMin = Math.min(open, close);
        const bodyMax = Math.max(open, close);

        // Upper wick (±1.5% total with body)
        const upperWickSize = (Math.random() * 0.3 + 0.05) * open * 0.006;
        const high = bodyMax + upperWickSize;

        // Lower wick (±1.5% total with body)
        const lowerWickSize = (Math.random() * 0.3 + 0.05) * open * 0.006;
        const low = bodyMin - lowerWickSize;

        const next = [...arr, { open, high, low, close, absoluteIndex: candleCountRef.current }];
        candleCountRef.current += 1;
        lastCloseRef.current = close;
        const wasRemoved = next.length > MAX_CANDLES;
        if (wasRemoved) next.shift();

        const newIndex = next.length - 1;
        setAnimatingIndices((prev) => {
          const updated = new Set(prev);
          updated.add(newIndex);
          setTimeout(() => {
            setAnimatingIndices((p) => {
              const s = new Set(p);
              s.delete(newIndex);
              return s;
            });
          }, 400);
          return updated;
        });

        return next;
      });
    }, 150);

    // Epoch timer
    let localEpoch = 0;
    let id = 5;
    let accSum = 0;
    timerRef.current = setInterval(() => {
      localEpoch += 1;

      // Random accuracy per epoch in [75, 99]
      const rndAcc = Math.max(75, Math.min(99, 75 + Math.random() * 24));
      accSum += rndAcc;

      setEpoch(localEpoch);
      setAccuracy(Number(rndAcc.toFixed(2)));

      // Start smooth progress animation
      if (trainingStartRef.current !== null) {
        updateProgressSmooth(localEpoch, maxEpochs, trainingStartRef.current);
      }

      const loss = 1.2 / (1 + localEpoch / 2) + Math.random() * 0.05;
      const emoji = rndAcc > 95 ? "✅" : rndAcc > 85 ? "📈" : "⚠️";

      setLogs((prev) => [
        ...prev,
        {
          id: ++id,
          kind: "log",
          text: `Epoch ${localEpoch}/${maxEpochs} — loss: ${loss.toFixed(3)} — acc: ${rndAcc.toFixed(2)}% ${emoji}`,
        },
      ]);

      if (localEpoch >= maxEpochs) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (candleTimerRef.current) clearInterval(candleTimerRef.current);
        if (trainingTimeTimerRef.current) clearInterval(trainingTimeTimerRef.current);
        if (progressAnimationRef.current) cancelAnimationFrame(progressAnimationRef.current);
        const avgAcc = accSum / maxEpochs;
        setAccuracy(Number(avgAcc.toFixed(2)));
        setProgress(100);

        // Freeze displayed price/pct for Live Market after simulation
        const base = baselineSim ?? livePrice ?? lastCloseRef.current ?? 0;
        const lc = lastCloseRef.current ?? base;
        const fpct = base ? ((lc - base) / base) * 100 : 0;
        setFrozenPrice(lc);
        setFrozenPct(fpct);

        setLogs((prev) => [
          ...prev,
          { id: ++id, kind: "code", text: "model.save('model.h5')" },
          { id: ++id, kind: "success", text: `Model saved ✔️ — Final average accuracy: ${avgAcc.toFixed(2)}%` },
        ]);
        setIsTraining(false);
        setStartedAt(null);
      }
    }, 1000);

  };


  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (candleTimerRef.current) clearInterval(candleTimerRef.current);
    if (trainingTimeTimerRef.current) clearInterval(trainingTimeTimerRef.current);
    if (progressAnimationRef.current) cancelAnimationFrame(progressAnimationRef.current);
  }, []);

  // Helpers for chip styles
  const Chip = ({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" }) => (
    <span
      className={
        `px-2 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1 border ` +
        (tone === "success"
          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
          : "bg-primary-foreground/10 text-muted-foreground border-white/10")
      }
    >
      {label}
    </span>
  );

  const PriceStat = ({ label, value, accent }: { label: string; value: string; accent?: "pos" | "neg" | "muted" }) => (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span
        className={
          "text-[13px] font-semibold " +
          (accent === "pos" ? "text-emerald-400" : accent === "neg" ? "text-rose-400" : "text-foreground")
        }
      >
        {value}
      </span>
    </div>
  );

  const lastClose = candles.length ? candles[candles.length - 1].close : null;
  const lmPrice = isTraining ? (lastClose ?? baselineSim ?? livePrice ?? null) : (frozenPrice ?? livePrice ?? null);
  const lmPct = isTraining && baselineSim != null && lastClose != null
    ? ((lastClose - baselineSim) / baselineSim) * 100
    : (frozenPct ?? (liveChangePct ?? 0));
  const pctSign = (lmPct ?? 0) >= 0 ? "+" : "";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-black/60 to-black/40">
      {/* Top status bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2">
          <Chip label="Python" />
          <Chip label="Live Market Simulation" tone="success" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">BTCUSDT</span>
          <span className="text-sm font-semibold text-emerald-300">{livePrice != null ? `$${formatPrice(livePrice)}` : "—"}</span>
        </div>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 flex-1 min-h-0 items-stretch">
        {/* Code / Training panel */}
        <div className="flex h-full min-h-0 flex-col rounded-md border border-white/10 bg-[#0b0f14]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <div className="text-xs text-muted-foreground">model_training.py</div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>time: {trainingTime}</span>
              <span>acc: {accuracy.toFixed(2)}%</span>
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-2 font-mono text-[12px] leading-5 text-zinc-300 ai-terminal-scroll">
            <div className="space-y-1">
              {/* Static code header */}
              <div><span className="text-emerald-400">import</span> <span className="text-sky-300">tensorflow</span> <span className="text-emerald-400">as</span> <span className="text-sky-300">tf</span></div>
              <div><span className="text-sky-300">model</span> <span className="text-emerald-400">=</span> <span className="text-sky-300">tf</span>.<span className="text-sky-300">keras</span>.<span className="text-sky-300">Sequential</span>([<span className="text-zinc-400">...</span>])</div>
              <div><span className="text-sky-300">model</span>.<span className="text-sky-300">compile</span>(optimizer=<span className="text-amber-300">'adam'</span>, loss=<span className="text-amber-300">'categorical_crossentropy'</span>, metrics=[<span className="text-amber-300">'accuracy'</span>])</div>
              <div className="text-zinc-500"># Training output</div>
            </div>
            <div className="mt-2 space-y-1">
              {logs.map((l) => (
                <div key={l.id} className={
                  l.kind === "success"
                    ? "text-emerald-300"
                    : l.kind === "warn"
                    ? "text-amber-300"
                    : l.kind === "info"
                    ? "text-zinc-400"
                    : "text-zinc-300"
                }>
                  {l.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Market panel */}
        <div className="flex h-full min-h-0 flex-col bg-transparent">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <div className="text-xs text-muted-foreground">Live Market Simulation</div>
            <div className="flex items-center gap-[17px]">
              <div className="flex items-center gap-[15px]">
                <PriceStat label="Price" value={lmPrice != null ? `$${formatPrice(lmPrice)}` : "—"} />
                <PriceStat label="24h" value={`${pctSign}${(lmPct ?? 0).toFixed(2)}%`} accent={(lmPct ?? 0) >= 0 ? "pos" : "neg"} />
              </div>
              {!isTraining ? (
                <button onClick={startTraining} className="px-3 py-1.5 rounded-md bg-emerald-500 text-black text-xs font-medium hover:bg-emerald-400 transition-colors whitespace-nowrap">
                  Start Training
                </button>
              ) : (
                <span className="text-[10px] text-muted-foreground">Training…</span>
              )}
            </div>
          </div>

          <div className="p-0 flex flex-col gap-0 flex-1 min-h-0">
            <div className="flex-1 min-h-[140px] overflow-hidden rounded-md border border-white/10 bg-black/30">
              {candles.length > 1 ? (
                <CandleChart candles={candles} animatingIndices={animatingIndices} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Waiting for data…</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom progress bar */}
      <div className="h-1 w-full bg-black/40">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
