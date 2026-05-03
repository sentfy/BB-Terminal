import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetchQuote, type Quote } from "@/lib/api";
import { usePortfolio } from "@/store/portfolioStore";
import { useWorkspace } from "@/store/workspaceStore";
import { fmtPrice, fmtPct, fmtVolume } from "@/lib/format";
import { cn } from "@/lib/cn";

export function PORT() {
  const { holdings, addHolding, removeHolding } = usePortfolio();
  const openTab = useWorkspace((s) => s.openTab);
  const [sym, setSym] = useState("");
  const [shares, setShares] = useState("");
  const [cost, setCost] = useState("");

  const symbols = holdings.map((h) => h.symbol);

  const quoteQueries = useQueries({
    queries: symbols.map((s) => ({
      queryKey: ["quote", s],
      queryFn: () => fetchQuote(s),
      refetchInterval: 5_000,
    })),
  });

  const handleAdd = () => {
    const s = sym.trim().toUpperCase();
    const sh = parseFloat(shares);
    const c = parseFloat(cost);
    if (s && sh > 0 && c > 0) {
      addHolding({ symbol: s, shares: sh, costBasis: c });
      setSym(""); setShares(""); setCost("");
    }
  };

  // Calculate totals
  let totalValue = 0;
  let totalCost = 0;
  let totalDayPL = 0;

  const rows = holdings.map((h, i) => {
    const q = quoteQueries[i]?.data as Quote | undefined;
    const price = q?.last_price ?? 0;
    const mktVal = price * h.shares;
    const costVal = h.costBasis * h.shares;
    const totalPL = mktVal - costVal;
    const totalPLPct = costVal > 0 ? (totalPL / costVal) * 100 : 0;
    const dayChg = price && q?.prev_close ? price - q.prev_close : 0;
    const dayPL = dayChg * h.shares;

    totalValue += mktVal;
    totalCost += costVal;
    totalDayPL += dayPL;

    return { ...h, q, price, mktVal, costVal, totalPL, totalPLPct, dayPL };
  });

  const totalPL = totalValue - totalCost;
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Add position bar */}
      <div className="flex items-center gap-2 px-3 h-9 border-b border-term-border bg-term-panel2">
        <span className="text-[10px] uppercase tracking-wider text-term-muted">ADD POSITION</span>
        <input value={sym} onChange={(e) => setSym(e.target.value.toUpperCase())}
          placeholder="SYM" className="bg-transparent border border-term-border text-term-amber px-2 py-0.5 text-[11px] w-20 focus:border-term-amber outline-none num" />
        <input value={shares} onChange={(e) => setShares(e.target.value)}
          placeholder="SHARES" type="number" className="bg-transparent border border-term-border text-term-text px-2 py-0.5 text-[11px] w-20 focus:border-term-amber outline-none num" />
        <input value={cost} onChange={(e) => setCost(e.target.value)}
          placeholder="COST" type="number" className="bg-transparent border border-term-border text-term-text px-2 py-0.5 text-[11px] w-24 focus:border-term-amber outline-none num" />
        <button onClick={handleAdd}
          className="text-[10px] px-2 py-0.5 border border-term-amber text-term-amber hover:bg-term-amberSubtle uppercase tracking-wider">
          + ADD
        </button>
      </div>

      {/* Summary */}
      {holdings.length > 0 && (
        <div className="flex items-center gap-6 px-3 h-8 border-b border-term-borderSoft bg-term-panel text-[11px]">
          <span className="text-term-muted">TOTAL VALUE <span className="text-term-heading num ml-1">{fmtPrice(totalValue)}</span></span>
          <span className="text-term-muted">COST <span className="text-term-text num ml-1">{fmtPrice(totalCost)}</span></span>
          <span className="text-term-muted">P&L{" "}
            <span className={cn("num ml-1", totalPL > 0 ? "up" : totalPL < 0 ? "down" : "")}>
              {totalPL > 0 ? "+" : ""}{fmtPrice(totalPL)} ({fmtPct(totalPLPct)})
            </span>
          </span>
          <span className="text-term-muted">DAY{" "}
            <span className={cn("num ml-1", totalDayPL > 0 ? "up" : totalDayPL < 0 ? "down" : "")}>
              {totalDayPL > 0 ? "+" : ""}{fmtPrice(totalDayPL)}
            </span>
          </span>
        </div>
      )}

      {/* Portfolio table */}
      {holdings.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-term-muted text-[11px] uppercase tracking-widest">
          Add positions to your portfolio
        </div>
      ) : (
        <div className="flex-1 overflow-auto scroll-thin">
          <table className="w-full grid-data text-[12px]">
            <thead>
              <tr>
                <th>Symbol</th>
                <th className="text-right">Shares</th>
                <th className="text-right">Avg Cost</th>
                <th className="text-right">Current</th>
                <th className="text-right">Mkt Value</th>
                <th className="text-right">Day P&L</th>
                <th className="text-right">Total P&L</th>
                <th className="text-right">P&L %</th>
                <th className="text-right">Weight</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.symbol} className="cursor-pointer hover:bg-term-amberSubtle"
                  onClick={() => openTab("INTEL", r.symbol)}>
                  <td className="num text-term-amber font-semibold">{r.symbol}</td>
                  <td className="text-right num">{r.shares}</td>
                  <td className="text-right num">{fmtPrice(r.costBasis)}</td>
                  <td className="text-right num">{fmtPrice(r.price)}</td>
                  <td className="text-right num">{fmtPrice(r.mktVal)}</td>
                  <td className={cn("text-right num", r.dayPL > 0 ? "up" : r.dayPL < 0 ? "down" : "")}>
                    {r.dayPL > 0 ? "+" : ""}{fmtPrice(r.dayPL)}
                  </td>
                  <td className={cn("text-right num", r.totalPL > 0 ? "up" : r.totalPL < 0 ? "down" : "")}>
                    {r.totalPL > 0 ? "+" : ""}{fmtPrice(r.totalPL)}
                  </td>
                  <td className={cn("text-right num", r.totalPLPct > 0 ? "up" : r.totalPLPct < 0 ? "down" : "")}>
                    {fmtPct(r.totalPLPct)}
                  </td>
                  <td className="text-right num">
                    {totalValue > 0 ? ((r.mktVal / totalValue) * 100).toFixed(1) + "%" : "—"}
                  </td>
                  <td className="text-center" onClick={(e) => { e.stopPropagation(); removeHolding(r.symbol); }}>
                    <span className="text-term-muted hover:text-term-red cursor-pointer text-[10px]">✕</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Allocation bar */}
          {totalValue > 0 && (
            <div className="px-3 py-2 border-t border-term-border">
              <div className="text-[10px] uppercase tracking-wider text-term-muted mb-1">ALLOCATION</div>
              <div className="flex h-4 w-full overflow-hidden border border-term-border">
                {rows.map((r, i) => {
                  const pct = (r.mktVal / totalValue) * 100;
                  const colors = ["#ff8c00", "#22ccee", "#22ee22", "#ff3b3b", "#ffaa33", "#ff69b4", "#6e6e6e", "#22ccee"];
                  return (
                    <div key={r.symbol} title={`${r.symbol} ${pct.toFixed(1)}%`}
                      style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }}
                      className="h-full opacity-70" />
                  );
                })}
              </div>
              <div className="flex gap-3 mt-1 flex-wrap">
                {rows.map((r, i) => {
                  const pct = (r.mktVal / totalValue) * 100;
                  const colors = ["#ff8c00", "#22ccee", "#22ee22", "#ff3b3b", "#ffaa33", "#ff69b4", "#6e6e6e", "#22ccee"];
                  return (
                    <span key={r.symbol} className="text-[9px] text-term-muted flex items-center gap-1">
                      <span className="w-2 h-2 inline-block" style={{ backgroundColor: colors[i % colors.length] }} />
                      {r.symbol} {pct.toFixed(1)}%
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
