import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetchInstitutionalHolders, hasFmpKey } from "@/lib/fmp";
import { FmpKeyRequired } from "@/components/FmpKeyRequired";
import { fmtVolume, fmtPct } from "@/lib/format";
import { cn } from "@/lib/cn";

type Tab = "institutional" | "mutual";

export function OWN({ symbol }: { symbol: string }) {
  const [tab, setTab] = useState<Tab>("institutional");

  if (!hasFmpKey()) return <FmpKeyRequired feature="Ownership Analysis" />;

  const [instQ] = useQueries({
    queries: [
      { queryKey: ["inst-holders", symbol], queryFn: () => fetchInstitutionalHolders(symbol), staleTime: 300_000 },
    ],
  });

  const instData = (instQ.data ?? []).sort((a, b) => b.shares - a.shares);
  const isLoading = tab === "institutional" ? instQ.isLoading : false;
  const error = tab === "institutional" ? instQ.error : null;
  const rows = tab === "institutional" ? instData : [];

  // Summary
  const summary = useMemo(() => {
    const list = instData.slice(0, 20);
    const totalShares = list.reduce((s, h) => s + h.shares, 0);
    const top10Shares = list.slice(0, 10).reduce((s, h) => s + h.shares, 0);
    const netChange = list.reduce((s, h) => s + h.change, 0);
    return { totalShares, top10Pct: totalShares > 0 ? (top10Shares / totalShares) * 100 : 0, netChange };
  }, [instData]);

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex items-center gap-3 h-8 px-3 border-b border-term-border bg-term-panel2 text-[11px] uppercase tracking-wider">
        <button onClick={() => setTab("institutional")}
          className={cn("px-2 py-0.5 border",
            tab === "institutional" ? "border-term-amber text-term-amber" : "border-transparent text-term-muted hover:text-term-text")}>
          Institutional
        </button>
        <button onClick={() => setTab("mutual")}
          className={cn("px-2 py-0.5 border",
            tab === "mutual" ? "border-term-amber text-term-amber" : "border-transparent text-term-muted hover:text-term-text")}>
          Mutual Funds
        </button>
        <span className="ml-auto text-term-muted">{rows.length} holders · {symbol}</span>
      </div>

      {/* Summary metrics */}
      {tab === "institutional" && instData.length > 0 && (
        <div className="flex items-center gap-6 px-3 py-2 border-b border-term-border bg-term-panel2 text-[11px]">
          <span className="text-term-muted">TOP 20 SHARES:</span>
          <span className="num text-term-heading font-bold">{fmtVolume(summary.totalShares)}</span>
          <span className="text-term-muted">TOP 10 CONC:</span>
          <span className="num text-term-amber">{summary.top10Pct.toFixed(1)}%</span>
          <span className="text-term-muted">NET CHG:</span>
          <span className={cn("num font-bold", summary.netChange >= 0 ? "up" : "down")}>
            {summary.netChange >= 0 ? "+" : ""}{fmtVolume(summary.netChange)}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto scroll-thin">
        {tab === "mutual" ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="text-term-amber text-[11px] uppercase tracking-[0.25em] font-bold mb-2">MUTUAL FUND DATA</div>
              <div className="text-term-muted text-[12px] leading-relaxed">
                Mutual fund holder data requires a premium FMP subscription. This feature will be available when a compatible data endpoint is supported.
              </div>
            </div>
          </div>
        ) : (
          <>
            {isLoading && <div className="p-4 text-term-muted uppercase text-[11px] tracking-widest">Loading…</div>}
            {error && <div className="p-4 text-term-red">{(error as Error).message}</div>}
            {!isLoading && !error && (
              <table className="w-full text-[12px] grid-data">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Holder</th>
                    <th className="text-right">Shares</th>
                    <th className="text-right">Change</th>
                    <th className="text-right">Chg %</th>
                    <th>Reported</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((h, i) => {
                    const dir = h.change >= 0 ? "up" : "down";
                    return (
                      <tr key={i}>
                        <td className="text-term-muted num">{i + 1}</td>
                        <td className="text-term-heading truncate max-w-[300px]">{h.holder}</td>
                        <td className="num text-right">{fmtVolume(h.shares)}</td>
                        <td className={cn("num text-right", dir === "up" ? "up" : "down")}>
                          {h.change >= 0 ? "+" : ""}{fmtVolume(h.change)}
                        </td>
                        <td className={cn("num text-right", dir === "up" ? "up" : "down")}>
                          {h.changePercent != null ? fmtPct(h.changePercent) : "—"}
                        </td>
                        <td className="text-term-muted">{h.dateReported}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
      <div className="px-3 py-1 border-t border-term-border sub-header">DATA: FMP · SEC 13F FILINGS</div>
    </div>
  );
}
