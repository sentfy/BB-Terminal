import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, ColorType, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { useQueries } from "@tanstack/react-query";
import { fetchHistorical, fetchQuote, fetchMetrics, type Quote, type Metrics, type Candle } from "@/lib/api";
import { fmtPrice, fmtPct, fmtVolume } from "@/lib/format";
import { cn } from "@/lib/cn";

const COMP_COLORS = ["#ff8c00", "#22ccee", "#22ee22", "#ff3b3b"];

const COMP_RANGES = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
];

export function COMP() {
  const [symbols, setSymbols] = useState<string[]>(["AAPL", "MSFT"]);
  const [input, setInput] = useState("");
  const [range, setRange] = useState(COMP_RANGES[3]);

  const addSymbol = () => {
    const s = input.trim().toUpperCase();
    if (s && !symbols.includes(s) && symbols.length < 4) {
      setSymbols([...symbols, s]);
      setInput("");
    }
  };

  const removeSymbol = (s: string) => setSymbols(symbols.filter((x) => x !== s));

  // Fetch historical for chart
  const histQueries = useQueries({
    queries: symbols.map((s) => ({
      queryKey: ["comp-hist", s, range.label],
      queryFn: () => fetchHistorical(s, {
        interval: "1d",
        start_date: new Date(Date.now() - range.days * 864e5).toISOString().slice(0, 10),
      }),
      staleTime: 120_000,
    })),
  });

  // Fetch quotes + metrics for table
  const quoteQueries = useQueries({
    queries: symbols.map((s) => ({
      queryKey: ["quote", s],
      queryFn: () => fetchQuote(s),
      refetchInterval: 10_000,
    })),
  });

  const metricQueries = useQueries({
    queries: symbols.map((s) => ({
      queryKey: ["metrics", s],
      queryFn: () => fetchMetrics(s),
      staleTime: 300_000,
    })),
  });

  // Chart
  const chartRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ISeriesApi<"Line">[]>([]);

  // Create chart once on mount
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = createChart(chartRef.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#8a8a8a", fontFamily: "JetBrains Mono, monospace", fontSize: 11 },
      rightPriceScale: { borderColor: "#2a2a2a" },
      timeScale: { borderColor: "#2a2a2a" },
      grid: { vertLines: { color: "rgba(42,42,42,0.5)" }, horzLines: { color: "rgba(42,42,42,0.5)" } },
      crosshair: {
        vertLine: { color: "#ff8c00", width: 1 as const, style: 3, labelBackgroundColor: "#ff8c00" },
        horzLine: { color: "#ff8c00", width: 1 as const, style: 3, labelBackgroundColor: "#ff8c00" },
      },
      autoSize: true,
    });
    chartApiRef.current = chart;
    return () => { chart.remove(); chartApiRef.current = null; };
  }, []);

  // Update normalized chart data — remove old series, add new ones
  useEffect(() => {
    const chart = chartApiRef.current;
    if (!chart) return;

    // Remove previous series
    seriesRefs.current.forEach((s) => chart.removeSeries(s));
    seriesRefs.current = [];

    // Add a line series per symbol
    symbols.forEach((sym, i) => {
      const data = histQueries[i]?.data as Candle[] | undefined;
      if (!data || data.length < 2) return;
      const base = data[0].close;
      const normalized = data.map((c) => ({
        time: Math.floor(new Date(c.date).getTime() / 1000) as UTCTimestamp,
        value: (c.close / base) * 100,
      }));
      const series = chart.addLineSeries({
        color: COMP_COLORS[i % COMP_COLORS.length],
        lineWidth: 2,
        title: sym,
      });
      series.setData(normalized);
      seriesRefs.current.push(series);
    });
    chart.timeScale().fitContent();
  }, [symbols.join(","), histQueries.map((q) => q.dataUpdatedAt).join(",")]);

  // Metrics table rows
  const metricRows = useMemo(() => {
    const defs: { label: string; key: string; fmt: (v: any) => string }[] = [
      { label: "Price", key: "price", fmt: (v) => fmtPrice(v) },
      { label: "Change %", key: "chgPct", fmt: (v) => fmtPct(v) },
      { label: "Market Cap", key: "market_cap", fmt: (v) => fmtVolume(v) },
      { label: "P/E", key: "pe_ratio", fmt: (v) => v?.toFixed(1) ?? "—" },
      { label: "Forward P/E", key: "forward_pe", fmt: (v) => v?.toFixed(1) ?? "—" },
      { label: "EV/EBITDA", key: "enterprise_to_ebitda", fmt: (v) => v?.toFixed(1) ?? "—" },
      { label: "Revenue Growth", key: "revenue_growth", fmt: (v) => v != null ? fmtPct(v * 100) : "—" },
      { label: "Earnings Growth", key: "earnings_growth", fmt: (v) => v != null ? fmtPct(v * 100) : "—" },
      { label: "Gross Margin", key: "gross_margin", fmt: (v) => v != null ? fmtPct(v * 100) : "—" },
      { label: "Operating Margin", key: "operating_margin", fmt: (v) => v != null ? fmtPct(v * 100) : "—" },
      { label: "ROE", key: "return_on_equity", fmt: (v) => v != null ? fmtPct(v * 100) : "—" },
      { label: "Debt/Equity", key: "debt_to_equity", fmt: (v) => v?.toFixed(2) ?? "—" },
      { label: "Dividend Yield", key: "dividend_yield", fmt: (v) => v != null ? fmtPct(v * 100) : "—" },
    ];

    return defs.map((d) => ({
      label: d.label,
      values: symbols.map((sym, i) => {
        const q = quoteQueries[i]?.data as Quote | undefined;
        const m = metricQueries[i]?.data as Metrics | undefined;
        let raw: any;
        if (d.key === "price") raw = q?.last_price;
        else if (d.key === "chgPct") {
          raw = q?.last_price && q?.prev_close ? ((q.last_price - q.prev_close) / q.prev_close) * 100 : undefined;
        } else raw = m?.[d.key as keyof Metrics];
        return { raw, formatted: d.fmt(raw) };
      }),
    }));
  }, [symbols, quoteQueries.map((q) => q.dataUpdatedAt).join(","), metricQueries.map((q) => q.dataUpdatedAt).join(",")]);

  return (
    <div className="flex flex-col h-full">
      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 h-9 border-b border-term-border bg-term-panel2">
        <span className="text-[10px] uppercase tracking-wider text-term-muted">COMPARE</span>
        {symbols.map((s, i) => (
          <span key={s} className="flex items-center gap-1 px-1.5 py-0.5 border border-term-border text-[11px]">
            <span className="w-2 h-2 inline-block" style={{ backgroundColor: COMP_COLORS[i % COMP_COLORS.length] }} />
            <span className="num text-term-amber">{s}</span>
            <button onClick={() => removeSymbol(s)} className="text-term-muted hover:text-term-red ml-1 text-[9px]">✕</button>
          </span>
        ))}
        {symbols.length < 4 && (
          <>
            <input value={input} onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && addSymbol()}
              placeholder="ADD"
              className="bg-transparent border border-term-border text-term-amber px-2 py-0.5 text-[11px] w-20 focus:border-term-amber outline-none num" />
            <button onClick={addSymbol}
              className="text-[10px] px-1.5 py-0.5 border border-term-amber text-term-amber hover:bg-term-amberSubtle">+</button>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          {COMP_RANGES.map((r) => (
            <button key={r.label} onClick={() => setRange(r)}
              className={cn("text-[10px] px-1 py-0.5 border",
                r.label === range.label ? "border-term-amber text-term-amber" : "border-transparent text-term-muted hover:text-term-text")}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative flex-1 min-h-[200px]">
        <div ref={chartRef} className="absolute inset-0" />
      </div>

      {/* Metrics comparison table */}
      <div className="border-t border-term-border overflow-auto scroll-thin max-h-[45%]">
        <table className="w-full grid-data text-[12px]">
          <thead>
            <tr>
              <th>Metric</th>
              {symbols.map((s, i) => (
                <th key={s} className="text-right">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 inline-block" style={{ backgroundColor: COMP_COLORS[i % COMP_COLORS.length] }} />
                    {s}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metricRows.map((row) => (
              <tr key={row.label}>
                <td className="text-term-muted">{row.label}</td>
                {row.values.map((v, i) => (
                  <td key={i} className="text-right num">{v.formatted}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
