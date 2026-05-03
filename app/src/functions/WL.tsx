import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetchQuote, fetchHistorical, type Quote, type Candle } from "@/lib/api";
import { usePortfolio } from "@/store/portfolioStore";
import { useWorkspace } from "@/store/workspaceStore";
import { fmtPrice, fmtPct, fmtVolume } from "@/lib/format";
import { cn } from "@/lib/cn";

export function WL() {
  const { watchlist, addToWatchlist, removeFromWatchlist } = usePortfolio();
  const openTab = useWorkspace((s) => s.openTab);
  const [input, setInput] = useState("");

  const symbols = watchlist.map((w) => w.symbol);

  const quoteQueries = useQueries({
    queries: symbols.map((s) => ({
      queryKey: ["quote", s],
      queryFn: () => fetchQuote(s),
      refetchInterval: 5_000,
    })),
  });

  const sparkQueries = useQueries({
    queries: symbols.map((s) => ({
      queryKey: ["wl-spark", s],
      queryFn: () =>
        fetchHistorical(s, {
          interval: "1d",
          start_date: new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10),
        }),
      staleTime: 300_000,
    })),
  });

  const handleAdd = () => {
    const sym = input.trim().toUpperCase();
    if (sym) { addToWatchlist(sym); setInput(""); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Add symbol bar */}
      <div className="flex items-center gap-2 px-3 h-9 border-b border-term-border bg-term-panel2">
        <span className="text-[10px] uppercase tracking-wider text-term-muted">ADD</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="SYMBOL"
          className="bg-transparent border border-term-border text-term-amber px-2 py-0.5 text-[11px] w-28 focus:border-term-amber outline-none num"
        />
        <button onClick={handleAdd}
          className="text-[10px] px-2 py-0.5 border border-term-amber text-term-amber hover:bg-term-amberSubtle uppercase tracking-wider">
          +
        </button>
        <span className="text-[10px] text-term-muted ml-auto num">{symbols.length} SYMBOLS</span>
      </div>

      {/* Watchlist table */}
      {symbols.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-term-muted text-[11px] uppercase tracking-widest">
          Add symbols to your watchlist
        </div>
      ) : (
        <div className="flex-1 overflow-auto scroll-thin">
          <table className="w-full grid-data text-[12px]">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th className="text-right">Last</th>
                <th className="text-right">Change</th>
                <th className="text-right">Chg%</th>
                <th className="text-right">Volume</th>
                <th className="text-right">52W Hi</th>
                <th className="text-right">52W Lo</th>
                <th className="w-24">14D</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((sym, i) => {
                const q = quoteQueries[i]?.data as Quote | undefined;
                const spark = sparkQueries[i]?.data as Candle[] | undefined;
                const chg = q?.last_price && q?.prev_close ? q.last_price - q.prev_close : undefined;
                const chgPct = chg && q?.prev_close ? (chg / q.prev_close) * 100 : undefined;
                return (
                  <tr key={sym} className="cursor-pointer hover:bg-term-amberSubtle"
                    onClick={() => openTab("INTEL", sym)}>
                    <td className="num text-term-amber font-semibold">{sym}</td>
                    <td className="text-term-heading truncate max-w-[180px]">{q?.name ?? "—"}</td>
                    <td className="text-right num">{fmtPrice(q?.last_price)}</td>
                    <td className={cn("text-right num", chg && chg > 0 ? "up" : chg && chg < 0 ? "down" : "")}>
                      {chg != null ? (chg > 0 ? "+" : "") + chg.toFixed(2) : "—"}
                    </td>
                    <td className={cn("text-right num", chgPct && chgPct > 0 ? "up" : chgPct && chgPct < 0 ? "down" : "")}>
                      {chgPct != null ? fmtPct(chgPct) : "—"}
                    </td>
                    <td className="text-right num">{fmtVolume(q?.volume)}</td>
                    <td className="text-right num">{fmtPrice(q?.year_high)}</td>
                    <td className="text-right num">{fmtPrice(q?.year_low)}</td>
                    <td className="px-1">
                      {spark && spark.length > 1 && <Spark values={spark.map((c) => c.close)} />}
                    </td>
                    <td className="text-center" onClick={(e) => { e.stopPropagation(); removeFromWatchlist(sym); }}>
                      <span className="text-term-muted hover:text-term-red cursor-pointer text-[10px]">✕</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Spark({ values, color = "#ff8c00" }: { values: number[]; color?: string }) {
  const min = Math.min(...values), max = Math.max(...values);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 24 - ((v - min) / (max - min || 1)) * 20;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 24" className="w-full h-6">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
    </svg>
  );
}
