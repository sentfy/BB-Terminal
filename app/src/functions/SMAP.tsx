import { useState, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetchQuote, type Quote } from "@/lib/api";
import { SECTORS } from "@/lib/sp500";
import { useWorkspace } from "@/store/workspaceStore";
import { fmtPrice, fmtPct } from "@/lib/format";
import { cn } from "@/lib/cn";

function chgColor(pct: number): string {
  if (pct > 2) return "#22ee22";
  if (pct > 1) return "#44cc44";
  if (pct > 0.25) return "#338833";
  if (pct > -0.25) return "#444444";
  if (pct > -1) return "#883333";
  if (pct > -2) return "#cc4444";
  return "#ff3b3b";
}

function textColor(pct: number): string {
  return Math.abs(pct) > 0.5 ? "#fff" : "#ccc";
}

// Squarified treemap layout
interface TreeRect { x: number; y: number; w: number; h: number; idx: number; }

function squarify(items: { weight: number }[], x: number, y: number, w: number, h: number): TreeRect[] {
  if (items.length === 0) return [];
  if (items.length === 1) return [{ x, y, w, h, idx: 0 }];

  const total = items.reduce((a, b) => a + b.weight, 0);
  const rects: TreeRect[] = [];
  let cx = x, cy = y, cw = w, ch = h;

  const remaining = items.map((it, i) => ({ ...it, idx: i }));
  while (remaining.length > 0) {
    const isWide = cw >= ch;
    const side = isWide ? ch : cw;
    const remTotal = remaining.reduce((a, b) => a + b.weight, 0);

    let row: typeof remaining = [];
    let rowArea = 0;
    let bestRatio = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const testRow = [...row, remaining[i]];
      const testArea = rowArea + remaining[i].weight;
      const rowLen = (testArea / remTotal) * (isWide ? cw : ch);
      const worst = testRow.reduce((w, r) => {
        const rSize = (r.weight / testArea) * side;
        const ratio = Math.max(rowLen / rSize, rSize / rowLen);
        return Math.max(w, ratio);
      }, 0);

      if (worst <= bestRatio || row.length === 0) {
        row = testRow;
        rowArea = testArea;
        bestRatio = worst;
      } else {
        break;
      }
    }

    const rowLen = (rowArea / remTotal) * (isWide ? cw : ch);
    let offset = 0;
    for (const item of row) {
      const frac = item.weight / rowArea;
      const rSize = frac * side;
      if (isWide) {
        rects.push({ x: cx, y: cy + offset, w: rowLen, h: rSize, idx: item.idx });
      } else {
        rects.push({ x: cx + offset, y: cy, w: rSize, h: rowLen, idx: item.idx });
      }
      offset += rSize;
    }

    remaining.splice(0, row.length);
    if (isWide) { cx += rowLen; cw -= rowLen; }
    else { cy += rowLen; ch -= rowLen; }
  }

  return rects;
}

export function SMAP() {
  const openTab = useWorkspace((s) => s.openTab);
  const [drillSector, setDrillSector] = useState<string | null>(null);

  // Fetch sector ETF quotes
  const sectorQueries = useQueries({
    queries: SECTORS.map((s) => ({
      queryKey: ["quote", s.etf],
      queryFn: () => fetchQuote(s.etf),
      refetchInterval: 15_000,
    })),
  });

  // Drill-down constituent quotes
  const drillDef = SECTORS.find((s) => s.name === drillSector);
  const drillSymbols = drillDef?.constituents ?? [];

  const drillQueries = useQueries({
    queries: drillSymbols.map((s) => ({
      queryKey: ["quote", s],
      queryFn: () => fetchQuote(s),
      refetchInterval: 15_000,
      enabled: !!drillSector,
    })),
  });

  const isLoading = sectorQueries.every((q) => q.isLoading);
  const hasError = sectorQueries.some((q) => q.isError);

  // Build sector data with change %
  const sectorData = useMemo(() => {
    return SECTORS.map((s, i) => {
      const q = sectorQueries[i]?.data as Quote | undefined;
      // Prefer API-provided change_percent; fall back to manual calculation
      const chg = q?.change_percent != null
        ? q.change_percent
        : (q?.last_price != null && q?.prev_close != null && q.prev_close !== 0)
          ? ((q.last_price - q.prev_close) / q.prev_close) * 100
          : 0;
      return { ...s, quote: q, chgPct: chg };
    });
  }, [sectorQueries.map((q) => q.dataUpdatedAt).join(",")]);

  // Treemap rects
  const treeRects = useMemo(() => {
    const items = sectorData.map((s) => ({ weight: s.weight }));
    return squarify(items, 0, 0, 100, 100);
  }, [sectorData]);

  if (drillSector && drillDef) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center px-3 h-8 border-b border-term-border bg-term-panel2">
          <button onClick={() => setDrillSector(null)}
            className="text-[11px] text-term-amber hover:text-term-amberBright mr-3">
            ← BACK
          </button>
          <span className="text-[11px] uppercase tracking-wider text-term-heading">{drillDef.name}</span>
          <span className="text-[10px] text-term-muted ml-2">{drillDef.etf}</span>
        </div>
        <div className="flex-1 overflow-auto scroll-thin">
          <table className="w-full grid-data text-[12px]">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th className="text-right">Price</th>
                <th className="text-right">Chg%</th>
                <th className="text-right">Volume</th>
              </tr>
            </thead>
            <tbody>
              {drillSymbols.map((sym, i) => {
                const q = drillQueries[i]?.data as Quote | undefined;
                const chg = q?.change_percent != null
                  ? q.change_percent
                  : (q?.last_price != null && q?.prev_close != null && q.prev_close !== 0)
                    ? ((q.last_price - q.prev_close) / q.prev_close) * 100
                    : undefined;
                return (
                  <tr key={sym} className="cursor-pointer hover:bg-term-amberSubtle"
                    onClick={() => openTab("INTEL", sym)}>
                    <td className="num text-term-amber font-semibold">{sym}</td>
                    <td className="text-term-heading truncate max-w-[200px]">{q?.name ?? "—"}</td>
                    <td className="text-right num">{fmtPrice(q?.last_price)}</td>
                    <td className={cn("text-right num", chg && chg > 0 ? "up" : chg && chg < 0 ? "down" : "")}>
                      {chg != null ? fmtPct(chg) : "—"}
                    </td>
                    <td className="text-right num">{q?.volume ? (q.volume / 1e6).toFixed(1) + "M" : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-3">
      <div className="flex items-center gap-3 mb-2">
        <span className="sub-header">S&P 500 SECTOR PERFORMANCE</span>
        {isLoading && <span className="text-[10px] text-term-muted uppercase tracking-widest">LOADING…</span>}
        {hasError && <span className="text-[10px] text-term-red uppercase tracking-widest">API ERROR — CHECK PROVIDER</span>}
      </div>
      {/* SVG Treemap */}
      <div className="flex-1 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          {treeRects.map((rect) => {
            const sector = sectorData[rect.idx];
            const bg = chgColor(sector.chgPct);
            const fg = textColor(sector.chgPct);
            const showLabel = rect.w > 8 && rect.h > 6;
            return (
              <g key={sector.etf} className="cursor-pointer"
                onClick={() => setDrillSector(sector.name)}>
                <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h}
                  fill={bg} stroke="#0a0a0a" strokeWidth="0.3" rx="0.3" />
                {showLabel && (
                  <>
                    <text x={rect.x + rect.w / 2} y={rect.y + rect.h / 2 - 2}
                      textAnchor="middle" fill={fg} fontSize={rect.w > 15 ? "2.8" : "2"}
                      fontFamily="JetBrains Mono" fontWeight="600">
                      {sector.etf}
                    </text>
                    <text x={rect.x + rect.w / 2} y={rect.y + rect.h / 2 + 2}
                      textAnchor="middle" fill={fg} fontSize={rect.w > 15 ? "2.2" : "1.6"}
                      fontFamily="JetBrains Mono" opacity="0.9">
                      {sector.chgPct > 0 ? "+" : ""}{sector.chgPct.toFixed(2)}%
                    </text>
                    {rect.w > 18 && rect.h > 10 && (
                      <text x={rect.x + rect.w / 2} y={rect.y + rect.h / 2 + 5}
                        textAnchor="middle" fill={fg} fontSize="1.6"
                        fontFamily="JetBrains Mono" opacity="0.6">
                        {sector.name}
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-term-muted flex-wrap">
        {sectorData.map((s) => (
          <span key={s.etf} className="flex items-center gap-1 cursor-pointer hover:text-term-text"
            onClick={() => setDrillSector(s.name)}>
            <span className="w-2 h-2 inline-block" style={{ backgroundColor: chgColor(s.chgPct) }} />
            <span>{s.etf}</span>
            <span className={cn("num", s.chgPct > 0 ? "up" : s.chgPct < 0 ? "down" : "")}>
              {s.chgPct > 0 ? "+" : ""}{s.chgPct.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
