import { NextResponse } from "next/server";

// GET /api/longshort?symbol=BTCUSDT&period=5m
// Proxies Binance Futures Global Long/Short Account Ratio and returns percentages (5m only)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "BTCUSDT").toUpperCase();
  const interval = "5m";

  const upstream = `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${encodeURIComponent(symbol)}&period=${encodeURIComponent(interval)}&limit=1`;

  try {
    const res = await fetch(upstream, {
      next: { revalidate: 5 * 60 },
      headers: { accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error", status: res.status }, { status: res.status });
    }

    const data = await res.json();
    const last = Array.isArray(data) && data.length ? data[data.length - 1] : null;

    if (!last) {
      return NextResponse.json({ error: "No data" }, { status: 502 });
    }

    const rawRatio = Number(last.longShortRatio);
    let longPct = 50;
    let shortPct = 50;

    if (Number.isFinite(rawRatio) && rawRatio > 0) {
      longPct = (rawRatio / (1 + rawRatio)) * 100;
      shortPct = 100 - longPct;
    } else {
      const la = Number(last.longAccount);
      const sa = Number(last.shortAccount);
      if (Number.isFinite(la) && Number.isFinite(sa) && la + sa > 0) {
        longPct = (la / (la + sa)) * 100;
        shortPct = 100 - longPct;
      }
    }

    const payload = {
      symbol,
      interval,
      ratio: Number.isFinite(rawRatio) ? rawRatio : null,
      longPct: Math.max(0, Math.min(100, longPct)),
      shortPct: Math.max(0, Math.min(100, shortPct)),
    } as const;

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch long/short" }, { status: 500 });
  }
}
