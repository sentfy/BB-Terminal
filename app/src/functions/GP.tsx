import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, ColorType, type IChartApi, type ISeriesApi, type UTCTimestamp, LineStyle } from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import { fetchHistorical } from "@/lib/api";
import { cn } from "@/lib/cn";
import { computeSMA, computeEMA, computeRSI, computeMACD, computeBollingerBands } from "@/lib/indicators";

interface RangeDef { label: string; days: number; interval: string; intraday: boolean; }

const RANGES: RangeDef[] = [
  { label: "1D",  days: 1,       interval: "5m",  intraday: true },
  { label: "5D",  days: 7,       interval: "15m", intraday: true },
  { label: "1M",  days: 30,      interval: "1d",  intraday: false },
  { label: "3M",  days: 90,      interval: "1d",  intraday: false },
  { label: "6M",  days: 180,     interval: "1d",  intraday: false },
  { label: "1Y",  days: 365,     interval: "1d",  intraday: false },
  { label: "3Y",  days: 365 * 3, interval: "1W",  intraday: false },
  { label: "5Y",  days: 365 * 5, interval: "1W",  intraday: false },
];

type IndicatorId = "sma20" | "sma50" | "ema20" | "rsi" | "macd" | "bb";

const INDICATOR_DEFS: { id: IndicatorId; label: string }[] = [
  { id: "sma20", label: "SMA 20" },
  { id: "sma50", label: "SMA 50" },
  { id: "ema20", label: "EMA 20" },
  { id: "bb",    label: "BB" },
  { id: "rsi",   label: "RSI" },
  { id: "macd",  label: "MACD" },
];

const IND_COLORS = {
  sma20: "#22ccee",
  sma50: "#ffaa33",
  ema20: "#ff69b4",
  bbMid: "#6e6e6e",
  bbBand: "rgba(255,140,0,0.25)",
  rsi: "#22ccee",
  macdLine: "#22ccee",
  macdSignal: "#ff8c00",
};

function chartOpts(intraday: boolean) {
  return {
    layout: { background: { type: ColorType.Solid as const, color: "transparent" }, textColor: "#8a8a8a", fontFamily: "JetBrains Mono, monospace", fontSize: 11 },
    rightPriceScale: { borderColor: "#2a2a2a" },
    timeScale: { borderColor: "#2a2a2a", timeVisible: intraday },
    grid: { vertLines: { color: "rgba(42,42,42,0.5)" }, horzLines: { color: "rgba(42,42,42,0.5)" } },
    crosshair: {
      vertLine: { color: "#ff8c00", width: 1 as const, style: 3, labelBackgroundColor: "#ff8c00" },
      horzLine: { color: "#ff8c00", width: 1 as const, style: 3, labelBackgroundColor: "#ff8c00" },
    },
    autoSize: true,
  };
}

export function GP({ symbol }: { symbol: string }) {
  const [range, setRange] = useState(RANGES[5]);
  const [indicators, setIndicators] = useState<Set<IndicatorId>>(new Set());
  const start = new Date(Date.now() - range.days * 864e5).toISOString().slice(0, 10);

  const { data, isLoading, error } = useQuery({
    queryKey: ["historical", symbol, range.label],
    queryFn: () => fetchHistorical(symbol, { interval: range.interval, start_date: start }),
    staleTime: range.intraday ? 15_000 : 60_000,
    refetchInterval: range.intraday ? 15_000 : undefined,
  });

  const toggleInd = (id: IndicatorId) => {
    setIndicators((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const hasSub = indicators.has("rsi") || indicators.has("macd");

  // Main chart refs
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const overlayRefs = useRef<ISeriesApi<"Line">[]>([]);

  // Sub chart refs
  const subRef = useRef<HTMLDivElement>(null);
  const subChartRef = useRef<IChartApi | null>(null);

  // Computed indicator data
  const indData = useMemo(() => {
    if (!data || data.length < 2) return null;
    return {
      sma20: computeSMA(data, 20),
      sma50: computeSMA(data, 50),
      ema20: computeEMA(data, 20),
      bb: computeBollingerBands(data, 20, 2),
      rsi: computeRSI(data, 14),
      macd: computeMACD(data, 12, 26, 9),
    };
  }, [data]);

  // Create main chart
  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, chartOpts(range.intraday));
    const candle = chart.addCandlestickSeries({
      upColor: "#22ee22", downColor: "#ff3b3b",
      wickUpColor: "#22ee22", wickDownColor: "#ff3b3b",
      borderVisible: false,
    });
    const vol = chart.addHistogramSeries({ color: "rgba(255,140,0,0.3)", priceFormat: { type: "volume" }, priceScaleId: "" });
    vol.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    candle.priceScale().applyOptions({ scaleMargins: { top: 0.05, bottom: 0.22 } });
    chartRef.current = chart;
    candleRef.current = candle;
    volRef.current = vol;
    return () => { chart.remove(); chartRef.current = null; };
  }, []);

  // Toggle time visibility on range change
  useEffect(() => {
    chartRef.current?.applyOptions({
      timeScale: { timeVisible: range.intraday, borderColor: "#2a2a2a" },
    });
  }, [range.intraday]);

  // Update candle + volume data
  useEffect(() => {
    if (!data || !candleRef.current || !volRef.current) return;
    const candles = data.map((c) => ({
      time: Math.floor(new Date(c.date).getTime() / 1000) as UTCTimestamp,
      open: c.open, high: c.high, low: c.low, close: c.close,
    }));
    const vols = data.map((c) => ({
      time: Math.floor(new Date(c.date).getTime() / 1000) as UTCTimestamp,
      value: c.volume,
      color: c.close >= c.open ? "rgba(34,238,34,0.35)" : "rgba(255,59,59,0.35)",
    }));
    candleRef.current.setData(candles);
    volRef.current.setData(vols);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  // Overlay indicators (SMA, EMA, BB)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !indData) return;
    overlayRefs.current.forEach((s) => chart.removeSeries(s));
    overlayRefs.current = [];

    const add = (pts: { time: number; value: number }[], color: string, dash?: boolean) => {
      const s = chart.addLineSeries({
        color, lineWidth: 1, priceScaleId: "right",
        ...(dash ? { lineStyle: LineStyle.Dashed } : {}),
      });
      s.setData(pts as any);
      overlayRefs.current.push(s);
    };

    if (indicators.has("sma20")) add(indData.sma20, IND_COLORS.sma20);
    if (indicators.has("sma50")) add(indData.sma50, IND_COLORS.sma50);
    if (indicators.has("ema20")) add(indData.ema20, IND_COLORS.ema20);
    if (indicators.has("bb")) {
      add(indData.bb.middle, IND_COLORS.bbMid, true);
      add(indData.bb.upper, IND_COLORS.bbBand);
      add(indData.bb.lower, IND_COLORS.bbBand);
    }
  }, [indicators, indData]);

  // Sub chart (RSI / MACD)
  useEffect(() => {
    // Cleanup if no sub indicators
    if (!hasSub) {
      if (subChartRef.current) { subChartRef.current.remove(); subChartRef.current = null; }
      return;
    }
    if (!subRef.current || !indData) return;

    if (subChartRef.current) { subChartRef.current.remove(); subChartRef.current = null; }
    const sc = createChart(subRef.current, {
      ...chartOpts(range.intraday),
      height: 120,
      autoSize: false,
    });
    sc.applyOptions({ rightPriceScale: { borderColor: "#2a2a2a" } });
    subChartRef.current = sc;

    if (indicators.has("rsi")) {
      const s = sc.addLineSeries({ color: IND_COLORS.rsi, lineWidth: 1 });
      s.setData(indData.rsi as any);
      s.createPriceLine({ price: 70, color: "rgba(255,59,59,0.3)", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true });
      s.createPriceLine({ price: 30, color: "rgba(34,238,34,0.3)", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true });
    }
    if (indicators.has("macd")) {
      const ml = sc.addLineSeries({ color: IND_COLORS.macdLine, lineWidth: 1 });
      ml.setData(indData.macd.macd as any);
      const sl = sc.addLineSeries({ color: IND_COLORS.macdSignal, lineWidth: 1 });
      sl.setData(indData.macd.signal as any);
      const hist = sc.addHistogramSeries({ color: "#22ee22" });
      hist.setData(
        indData.macd.histogram.map((p) => ({
          ...p,
          color: p.value >= 0 ? "rgba(34,238,34,0.5)" : "rgba(255,59,59,0.5)",
        })) as any
      );
    }
    sc.timeScale().fitContent();

    return () => { if (subChartRef.current) { subChartRef.current.remove(); subChartRef.current = null; } };
  }, [hasSub, indicators, indData, range.intraday]);

  // Resize sub chart on container resize
  useEffect(() => {
    if (!hasSub || !subRef.current) return;
    const el = subRef.current;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (w && subChartRef.current) subChartRef.current.applyOptions({ width: w });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasSub]);

  return (
    <div className="flex flex-col h-full">
      {/* Range selector */}
      <div className="flex items-center justify-between px-3 h-8 border-b border-term-border bg-term-panel2">
        <div className="flex items-center gap-4 text-[11px] uppercase tracking-wider">
          <span className="text-term-amber">RANGE</span>
          {RANGES.map((r) => (
            <button key={r.label} onClick={() => setRange(r)}
              className={cn("px-1 py-0.5 border",
                r.label === range.label
                  ? "border-term-amber text-term-amber"
                  : "border-transparent text-term-muted hover:text-term-text")}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      {/* Indicator selector */}
      <div className="flex items-center px-3 h-7 border-b border-term-borderSoft bg-term-panel">
        <span className="text-[10px] uppercase tracking-wider text-term-muted mr-3">IND</span>
        {INDICATOR_DEFS.map((ind) => (
          <button key={ind.id} onClick={() => toggleInd(ind.id)}
            className={cn("text-[10px] px-1.5 py-0.5 mr-1 border",
              indicators.has(ind.id)
                ? "border-term-amber text-term-amber bg-term-amberSubtle"
                : "border-transparent text-term-muted hover:text-term-text")}>
            {ind.label}
          </button>
        ))}
      </div>
      {/* Main chart */}
      <div className={cn("relative", hasSub ? "flex-[3]" : "flex-1")}>
        <div ref={ref} className="absolute inset-0" />
        {isLoading && <Centered>LOADING…</Centered>}
        {error && <Centered error>{(error as Error).message}</Centered>}
      </div>
      {/* Sub chart */}
      {hasSub && (
        <div className="border-t border-term-border" style={{ height: 120 }}>
          <div ref={subRef} className="w-full h-full" />
        </div>
      )}
    </div>
  );
}

function Centered({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return <div className={cn("absolute inset-0 flex items-center justify-center text-[11px] uppercase tracking-widest", error ? "text-term-red" : "text-term-muted")}>{children}</div>;
}
