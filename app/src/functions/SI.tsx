import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetchSharesFloat, hasFmpKey } from "@/lib/fmp";
import { fetchQuote, type Quote } from "@/lib/api";
import { FmpKeyRequired } from "@/components/FmpKeyRequired";
import { useWorkspace } from "@/store/workspaceStore";
import { fmtPrice, fmtPct, fmtVolume } from "@/lib/format";
import { cn } from "@/lib/cn";

const DEFAULT_SYMBOLS = [
  "GME", "AMC", "RIVN", "CVNA", "MARA", "RIOT", "COIN",
  "PLUG", "LCID", "SOFI", "PLTR", "NKLA", "SPCE", "BYND",
  "UPST", "HOOD", "CLOV", "DKNG", "ROKU", "SNAP",
  "PINS", "DASH", "AFRM", "PATH", "SQ", "OPEN",
];

type SortKey = "symbol" | "price" | "freeFloat" | "floatShares" | "change";

export function SI() {
  const openTab = useWorkspace((s) => s.openTab);
  const [extra, setExtra] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("freeFloat");
  const [sortAsc, setSortAsc] = useState(false);

  if (!hasFmpKey()) return <FmpKeyRequired feature="Short Interest" />;

  const symbols = useMemo(() => [...new Set([...DEFAULT_SYMBOLS, ...extra])], [extra]);

  const quoteQueries = useQueries({
    queries: symbols.map((s) => ({
      queryKey: ["quote", s],
      queryFn: () => fetchQuote(s),
      refetchInterval: 30_000,
    })),
  });

  const floatQueries = useQueries({
    queries: symbols.map((s) => ({
      queryKey: ["shares-float", s],
      queryFn: () => fetchSharesFloat(s),
      staleTime: 600_000,
    })),
  });

  const rows = useMemo(() => {
    return symbols.map((sym, i) => {
      const q = quoteQueries[i]?.data as Quote | undefined;
      const f = floatQueries[i]?.data;
      return {
        symbol: sym,
        name: q?.name ?? "",
        price: q?.last_price ?? 0,
        change: q?.last_price && q?.prev_close ? ((q.last_price - q.prev_close) / q.prev_close) * 100 : 0,
        freeFloat: f?.freeFloat ?? null,
        floatShares: f?.floatShares ?? null,
        outstandingShares: f?.outstandingShares ?? null,
      };
    });
  }, [symbols, quoteQueries.map((q) => q.dataUpdatedAt).join(","), floatQueries.map((q) => q.dataUpdatedAt).join(",")]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let av: number, bv: number;
      switch (sortKey) {
        case "symbol": return sortAsc ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
        case "price": av = a.price; bv = b.price; break;
        case "freeFloat": av = a.freeFloat ?? -1; bv = b.freeFloat ?? -1; break;
        case "floatShares": av = a.floatShares ?? -1; bv = b.floatShares ?? -1; break;
        case "change": av = a.change; bv = b.change; break;
        default: return 0;
      }
      return sortAsc ? av - bv : bv - av;
    });
    return copy;
  }, [rows, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const addSymbol = () => {
    const s = input.trim().toUpperCase();
    if (s && !symbols.includes(s)) setExtra((prev) => [...prev, s]);
    setInput("");
  };

  const thClass = (key: SortKey) => cn("cursor-pointer select-none", sortKey === key && "text-term-amber");

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 h-8 px-3 border-b border-term-border bg-term-panel2 text-[11px]">
        <span className="uppercase tracking-wider text-term-heading font-bold">SHORT INTEREST</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSymbol()}
          placeholder="Add symbol…"
          className="bg-term-bg border border-term-border px-2 py-0.5 text-[11px] text-term-text placeholder:text-term-muted focus:outline-none focus:border-term-amber num w-28"
        />
        <button onClick={addSymbol}
          className="text-[10px] px-2 py-0.5 border border-term-border text-term-muted hover:text-term-amber hover:border-term-amber uppercase tracking-wider">
          ADD
        </button>
        <span className="ml-auto text-term-muted uppercase tracking-wider">{symbols.length} symbols · DATA MAY BE DELAYED</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto scroll-thin">
        <table className="w-full text-[12px] grid-data">
          <thead>
            <tr>
              <th>#</th>
              <th className={thClass("symbol")} onClick={() => toggleSort("symbol")}>Symbol</th>
              <th>Name</th>
              <th className={cn("text-right", thClass("price"))} onClick={() => toggleSort("price")}>Price</th>
              <th className={cn("text-right", thClass("change"))} onClick={() => toggleSort("change")}>Chg %</th>
              <th className={cn("text-right", thClass("freeFloat"))} onClick={() => toggleSort("freeFloat")}>Free Float %</th>
              <th className={cn("text-right", thClass("floatShares"))} onClick={() => toggleSort("floatShares")}>Float Shares</th>
              <th className="text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const dir = r.change >= 0 ? "up" : "down";
              const ffColor = r.freeFloat != null
                ? r.freeFloat < 10 ? "text-term-red" : r.freeFloat < 30 ? "text-term-amber" : "text-term-muted"
                : "text-term-muted";
              return (
                <tr key={r.symbol} className="cursor-pointer" onClick={() => openTab("INTEL", r.symbol)}>
                  <td className="text-term-muted num">{i + 1}</td>
                  <td className="num text-term-amber font-semibold">{r.symbol}</td>
                  <td className="text-term-heading truncate max-w-[200px]">{r.name}</td>
                  <td className="num text-right">{fmtPrice(r.price)}</td>
                  <td className={cn("num text-right", dir === "up" ? "up" : "down")}>{fmtPct(r.change)}</td>
                  <td className={cn("num text-right font-semibold", ffColor)}>
                    {r.freeFloat != null ? r.freeFloat.toFixed(2) + "%" : "—"}
                  </td>
                  <td className="num text-right text-term-muted">{r.floatShares != null ? fmtVolume(r.floatShares) : "—"}</td>
                  <td className="num text-right text-term-muted">{r.outstandingShares != null ? fmtVolume(r.outstandingShares) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-1 border-t border-term-border sub-header">DATA: FMP · CLICK A ROW TO OPEN INTEL</div>
    </div>
  );
}
