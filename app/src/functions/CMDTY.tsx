import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetchQuote, fetchHistorical, type Quote, type Candle } from "@/lib/api";
import { COMMODITIES, CATEGORIES, type CommodityCategory, type CommodityDef } from "@/lib/commodities";
import { useWorkspace } from "@/store/workspaceStore";
import { fmtPrice, fmtPct, fmtVolume } from "@/lib/format";
import { cn } from "@/lib/cn";

type Tab = "All" | CommodityCategory;

export function CMDTY() {
  const [tab, setTab] = useState<Tab>("All");
  const openTab = useWorkspace((s) => s.openTab);

  const filtered = tab === "All" ? COMMODITIES : COMMODITIES.filter((c) => c.category === tab);

  const quoteQueries = useQueries({
    queries: filtered.map((c) => ({
      queryKey: ["cmdty-q", c.symbol],
      queryFn: () => fetchQuote(c.symbol),
      refetchInterval: 15_000,
    })),
  });

  const sparkQueries = useQueries({
    queries: filtered.map((c) => ({
      queryKey: ["cmdty-spark", c.symbol],
      queryFn: () =>
        fetchHistorical(c.symbol, {
          interval: "1d",
          start_date: new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10),
        }),
      staleTime: 600_000,
    })),
  });

  const energyFocus = COMMODITIES.filter((c) =>
    ["NG=F", "CL=F", "BZ=F", "HO=F", "RB=F"].includes(c.symbol)
  );

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center px-3 h-8 border-b border-term-border bg-term-panel2">
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider">
          {(["All", ...CATEGORIES] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-1.5 py-0.5 border",
                t === tab
                  ? "border-term-amber text-term-amber"
                  : "border-transparent text-term-muted hover:text-term-text")}>
              {t}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[10px] text-term-muted">
          ICE · CME · NYMEX · COMEX · CBOT
        </span>
      </div>

      <div className="flex-1 overflow-auto scroll-thin">
        {/* Power & Gas Focus Section */}
        {tab === "All" && (
          <div className="p-3 border-b border-term-border">
            <div className="sub-header mb-2">POWER & GAS FOCUS</div>
            <div className="grid grid-cols-5 gap-2">
              {energyFocus.map((c) => {
                const qi = COMMODITIES.indexOf(c);
                const allQ = quoteQueries.find((_, i) => filtered[i]?.symbol === c.symbol);
                const q = allQ?.data as Quote | undefined;
                const chg = q?.last_price && q?.prev_close ? q.last_price - q.prev_close : undefined;
                const chgPct = chg && q?.prev_close ? (chg / q.prev_close) * 100 : undefined;
                return (
                  <div key={c.symbol}
                    className="bg-term-panel2 border border-term-borderSoft p-2 cursor-pointer hover:border-term-amber"
                    onClick={() => openTab("GP", c.symbol)}>
                    <div className="text-[10px] text-term-muted">{c.exchange}</div>
                    <div className="text-[11px] text-term-amber font-semibold">{c.name}</div>
                    <div className="text-[14px] num text-term-heading mt-0.5">
                      {q?.last_price != null ? q.last_price.toFixed(c.digits) : "—"}
                    </div>
                    <div className={cn("text-[11px] num", chgPct && chgPct > 0 ? "up" : chgPct && chgPct < 0 ? "down" : "text-term-muted")}>
                      {chgPct != null ? fmtPct(chgPct) : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-[9px] text-term-muted">
              ICE power hub data (PJM, ERCOT, ISO-NE) requires premium data provider — configure in settings
            </div>
          </div>
        )}

        {/* Main table */}
        <table className="w-full grid-data text-[12px]">
          <thead>
            <tr>
              <th>Name</th>
              <th>Symbol</th>
              <th>Exchange</th>
              <th className="text-right">Last</th>
              <th className="text-right">Chg</th>
              <th className="text-right">Chg%</th>
              <th className="text-right">Volume</th>
              <th>Unit</th>
              <th className="w-24">14D</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const q = quoteQueries[i]?.data as Quote | undefined;
              const spark = sparkQueries[i]?.data as Candle[] | undefined;
              const chg = q?.last_price && q?.prev_close ? q.last_price - q.prev_close : undefined;
              const chgPct = chg && q?.prev_close ? (chg / q.prev_close) * 100 : undefined;
              return (
                <tr key={c.symbol} className="cursor-pointer hover:bg-term-amberSubtle"
                  onClick={() => openTab("GP", c.symbol)}>
                  <td className="text-term-heading font-semibold">{c.name}</td>
                  <td className="num text-term-amber">{c.symbol.replace("=F", "")}</td>
                  <td className="text-term-muted text-[10px]">{c.exchange}</td>
                  <td className="text-right num">{q?.last_price != null ? q.last_price.toFixed(c.digits) : "—"}</td>
                  <td className={cn("text-right num", chg && chg > 0 ? "up" : chg && chg < 0 ? "down" : "")}>
                    {chg != null ? (chg > 0 ? "+" : "") + chg.toFixed(c.digits) : "—"}
                  </td>
                  <td className={cn("text-right num", chgPct && chgPct > 0 ? "up" : chgPct && chgPct < 0 ? "down" : "")}>
                    {chgPct != null ? fmtPct(chgPct) : "—"}
                  </td>
                  <td className="text-right num">{fmtVolume(q?.volume)}</td>
                  <td className="text-term-muted text-[10px]">{c.unit}</td>
                  <td className="px-1">
                    {spark && spark.length > 1 && <Spark values={spark.map((d) => d.close)} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
