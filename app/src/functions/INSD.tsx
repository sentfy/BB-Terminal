import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchInsiderTrading,
  fetchSenateTrades,
  fetchHouseTrades,
  fetchSenateStockWatcher,
  hasFmpKey,
  type PoliticalTrade,
} from "@/lib/fmp";
import { FmpKeyRequired } from "@/components/FmpKeyRequired";
import { fmtPrice, fmtVolume } from "@/lib/format";
import { cn } from "@/lib/cn";

type Tab = "insider" | "political";
type ChamberFilter = "all" | "senate" | "house";

function isBuy(txType: string): boolean {
  return txType.toLowerCase().startsWith("p") || txType.toLowerCase().includes("purchase");
}

export function INSD({ symbol }: { symbol: string }) {
  const [tab, setTab] = useState<Tab>("insider");
  const [chamber, setChamber] = useState<ChamberFilter>("all");
  const hasFmp = hasFmpKey();

  // ── Insider trading (FMP) ────────────────────────────────────────────
  const { data: insiderData = [], isLoading: insiderLoading, error: insiderError } = useQuery({
    queryKey: ["insider-trading", symbol],
    queryFn: () => fetchInsiderTrading(symbol, 100),
    staleTime: 120_000,
    enabled: tab === "insider" && hasFmp,
  });

  // ── Political: FMP senate + house ────────────────────────────────────
  const { data: senateData = [] } = useQuery({
    queryKey: ["senate-trades", symbol],
    queryFn: () => fetchSenateTrades(symbol),
    staleTime: 300_000,
    enabled: tab === "political" && hasFmp,
  });

  const { data: houseData = [] } = useQuery({
    queryKey: ["house-trades", symbol],
    queryFn: () => fetchHouseTrades(symbol),
    staleTime: 300_000,
    enabled: tab === "political" && hasFmp,
  });

  // ── Political: Senate Stock Watcher (free, no key) ───────────────────
  const { data: sswData = [], isLoading: polLoading, error: polError } = useQuery({
    queryKey: ["ssw-trades", symbol],
    queryFn: () => fetchSenateStockWatcher(symbol),
    staleTime: 600_000,
    enabled: tab === "political",
  });

  // ��─ Merge & deduplicate political trades ─────────────────────────────
  const politicalTrades = useMemo(() => {
    const all = [...senateData, ...houseData, ...sswData];
    const seen = new Set<string>();
    const deduped = all.filter((t) => {
      const key = `${t.date}-${t.name}-${t.type}-${t.amount}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return deduped.sort((a, b) => b.date.localeCompare(a.date));
  }, [senateData, houseData, sswData]);

  const filteredPolitical = useMemo(() => {
    if (chamber === "all") return politicalTrades;
    return politicalTrades.filter(
      (t) => t.chamber.toLowerCase() === chamber,
    );
  }, [politicalTrades, chamber]);

  // ── Insider summary stats ────────────────────────────────────────────
  const summary = useMemo(() => {
    const threeMonthsAgo = Date.now() - 90 * 864e5;
    const recent = insiderData.filter((t) => new Date(t.transactionDate).getTime() > threeMonthsAgo);
    let buys = 0, sells = 0, buyValue = 0, sellValue = 0;
    for (const t of recent) {
      const val = t.securitiesTransacted * (t.price ?? 0);
      if (isBuy(t.transactionType)) { buys++; buyValue += val; }
      else { sells++; sellValue += val; }
    }
    return { buys, sells, buyValue, sellValue, net: buyValue - sellValue };
  }, [insiderData]);

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex items-center gap-3 h-8 px-3 border-b border-term-border bg-term-panel2 text-[11px] uppercase tracking-wider">
        <button onClick={() => setTab("insider")}
          className={cn("px-2 py-0.5 border",
            tab === "insider" ? "border-term-amber text-term-amber" : "border-transparent text-term-muted hover:text-term-text")}>
          Insider
        </button>
        <button onClick={() => setTab("political")}
          className={cn("px-2 py-0.5 border",
            tab === "political" ? "border-term-amber text-term-amber" : "border-transparent text-term-muted hover:text-term-text")}>
          Political
        </button>
        {tab === "insider" && (
          <span className="ml-auto text-term-muted">{insiderData.length} trades · {symbol}</span>
        )}
        {tab === "political" && (
          <>
            <span className="border-l border-term-border h-4 mx-1" />
            {(["all", "senate", "house"] as ChamberFilter[]).map((f) => (
              <button key={f} onClick={() => setChamber(f)}
                className={cn("px-1.5 py-0.5 text-[10px]",
                  chamber === f ? "text-term-amber" : "text-term-muted hover:text-term-text")}>
                {f === "all" ? "ALL" : f.toUpperCase()}
              </button>
            ))}
            <span className="ml-auto text-term-muted">{filteredPolitical.length} trades · {symbol}</span>
          </>
        )}
      </div>

      {tab === "insider" ? (
        !hasFmp ? (
          <FmpKeyRequired feature="Insider Trading" />
        ) : (
          <>
            {/* Summary bar */}
            {insiderData.length > 0 && (
              <div className="flex items-center gap-6 px-3 py-2 border-b border-term-border bg-term-panel2 text-[11px]">
                <span className="text-term-muted">90-DAY NET:</span>
                <span className={cn("num font-bold", summary.net >= 0 ? "up" : "down")}>
                  {summary.net >= 0 ? "+" : ""}{fmtVolume(Math.abs(summary.net))}
                </span>
                <span className="up num">{summary.buys} buys ({fmtVolume(summary.buyValue)})</span>
                <span className="down num">{summary.sells} sells ({fmtVolume(summary.sellValue)})</span>
              </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-auto scroll-thin">
              {insiderLoading && <div className="p-4 text-term-muted uppercase text-[11px] tracking-widest">Loading…</div>}
              {insiderError && <div className="p-4 text-term-red">{(insiderError as Error).message}</div>}
              {!insiderLoading && !insiderError && (
                <table className="w-full text-[12px] grid-data">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Name</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th className="text-right">Shares</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Value</th>
                      <th className="text-right">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insiderData.map((t, i) => {
                      const buy = isBuy(t.transactionType);
                      const value = t.securitiesTransacted * (t.price ?? 0);
                      return (
                        <tr key={i}>
                          <td className="num text-term-muted">{t.transactionDate}</td>
                          <td className="text-term-heading truncate max-w-[180px]">{t.reportingName}</td>
                          <td className="text-term-muted text-[11px] truncate max-w-[120px]">{t.typeOfOwner}</td>
                          <td className={cn("font-semibold text-[11px] uppercase", buy ? "up" : "down")}>
                            {buy ? "BUY" : "SELL"}
                          </td>
                          <td className="num text-right">{fmtVolume(t.securitiesTransacted)}</td>
                          <td className="num text-right">{t.price != null ? fmtPrice(t.price) : "—"}</td>
                          <td className={cn("num text-right", buy ? "up" : "down")}>
                            {value > 0 ? fmtVolume(value) : "—"}
                          </td>
                          <td className="num text-right text-term-muted">{fmtVolume(t.securitiesOwned)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-3 py-1 border-t border-term-border sub-header">DATA: FMP · SEC FORM 4 FILINGS</div>
          </>
        )
      ) : (
        <>
          <div className="flex-1 overflow-auto scroll-thin">
            {polLoading && <div className="p-4 text-term-muted uppercase text-[11px] tracking-widest">Loading…</div>}
            {polError && <div className="p-4 text-term-red">{(polError as Error).message}</div>}
            {!polLoading && !polError && filteredPolitical.length === 0 && (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-term-muted text-[12px] text-center">
                  No congressional trades found for {symbol}.
                </div>
              </div>
            )}
            {!polLoading && !polError && filteredPolitical.length > 0 && (
              <PoliticalTable trades={filteredPolitical} />
            )}
          </div>
          <div className="px-3 py-1 border-t border-term-border sub-header">
            DATA: {hasFmp ? "FMP + " : ""}SENATE STOCK WATCHER · STOCK ACT DISCLOSURES
          </div>
        </>
      )}
    </div>
  );
}

function PoliticalTable({ trades }: { trades: PoliticalTrade[] }) {
  return (
    <table className="w-full text-[12px] grid-data">
      <thead>
        <tr>
          <th>Date</th>
          <th>Name</th>
          <th>Chamber</th>
          <th>Type</th>
          <th>Amount</th>
          <th>Asset</th>
          <th>Filed</th>
        </tr>
      </thead>
      <tbody>
        {trades.map((t, i) => {
          const buy = isBuy(t.type);
          return (
            <tr key={i}>
              <td className="num text-term-muted">{t.date}</td>
              <td className="text-term-heading truncate max-w-[180px]">{t.name}</td>
              <td className={cn("text-[11px] uppercase",
                t.chamber === "Senate" ? "text-term-amber" : "text-term-muted")}>{t.chamber}</td>
              <td className={cn("font-semibold text-[11px] uppercase", buy ? "up" : "down")}>
                {buy ? "BUY" : "SELL"}
              </td>
              <td className="num text-term-heading">{t.amount || "—"}</td>
              <td className="text-term-muted truncate max-w-[200px]">{t.asset || "—"}</td>
              <td className="num text-term-muted">{t.filingDate}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
