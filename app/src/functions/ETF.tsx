import { useState, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetchQuote, type Quote } from "@/lib/api";
import { ETFS, ETF_CATEGORIES, ETF_ISSUERS } from "@/lib/etfData";
import { useWorkspace } from "@/store/workspaceStore";
import { fmtPrice, fmtPct, fmtVolume } from "@/lib/format";
import { cn } from "@/lib/cn";

type SortKey = "symbol" | "name" | "category" | "price" | "chgPct" | "volume" | "expenseRatio";

export function ETF() {
  const openTab = useWorkspace((s) => s.openTab);
  const [category, setCategory] = useState<string>("All");
  const [issuer, setIssuer] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("symbol");
  const [sortAsc, setSortAsc] = useState(true);

  // Filter
  const filtered = useMemo(() => {
    let list = ETFS;
    if (category !== "All") list = list.filter((e) => e.category === category);
    if (issuer !== "All") list = list.filter((e) => e.issuer === issuer);
    if (search) {
      const q = search.toUpperCase();
      list = list.filter((e) => e.symbol.includes(q) || e.name.toUpperCase().includes(q));
    }
    return list;
  }, [category, issuer, search]);

  // Fetch quotes for filtered ETFs
  const quoteQueries = useQueries({
    queries: filtered.map((e) => ({
      queryKey: ["quote", e.symbol],
      queryFn: () => fetchQuote(e.symbol),
      refetchInterval: 30_000,
      staleTime: 15_000,
    })),
  });

  // Build rows with live data
  const rows = useMemo(() => {
    return filtered.map((e, i) => {
      const q = quoteQueries[i]?.data as Quote | undefined;
      const price = q?.last_price ?? 0;
      const chgPct =
        q?.last_price && q?.prev_close
          ? ((q.last_price - q.prev_close) / q.prev_close) * 100
          : 0;
      return { ...e, price, chgPct, volume: q?.volume ?? 0, q };
    });
  }, [filtered, quoteQueries.map((q) => q.dataUpdatedAt).join(",")]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let va: any, vb: any;
      switch (sortKey) {
        case "symbol": va = a.symbol; vb = b.symbol; break;
        case "name": va = a.name; vb = b.name; break;
        case "category": va = a.category; vb = b.category; break;
        case "price": va = a.price; vb = b.price; break;
        case "chgPct": va = a.chgPct; vb = b.chgPct; break;
        case "volume": va = a.volume; vb = b.volume; break;
        case "expenseRatio": va = a.expenseRatio; vb = b.expenseRatio; break;
      }
      if (typeof va === "string") return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? va - vb : vb - va;
    });
    return copy;
  }, [rows, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const thCls = (key: SortKey, right?: boolean) =>
    cn("cursor-pointer select-none", right && "text-right",
      sortKey === key && "text-term-amber");

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex items-center gap-3 px-3 h-9 border-b border-term-border bg-term-panel2 text-[10px]">
        <label className="uppercase tracking-wider text-term-muted">CAT</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="bg-term-panel border border-term-border text-term-text px-1 py-0.5 text-[10px]">
          <option value="All">All</option>
          {ETF_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <label className="uppercase tracking-wider text-term-muted ml-2">ISSUER</label>
        <select value={issuer} onChange={(e) => setIssuer(e.target.value)}
          className="bg-term-panel border border-term-border text-term-text px-1 py-0.5 text-[10px]">
          <option value="All">All</option>
          {ETF_ISSUERS.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>

        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH"
          className="bg-transparent border border-term-border text-term-text px-2 py-0.5 text-[10px] w-32 focus:border-term-amber outline-none ml-2" />

        <span className="ml-auto text-term-muted num">{sorted.length} ETFs</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto scroll-thin">
        <table className="w-full grid-data text-[12px]">
          <thead>
            <tr>
              <th className={thCls("symbol")} onClick={() => toggleSort("symbol")}>Symbol</th>
              <th className={thCls("name")} onClick={() => toggleSort("name")}>Name</th>
              <th className={thCls("category")} onClick={() => toggleSort("category")}>Category</th>
              <th className={thCls("price", true)} onClick={() => toggleSort("price")}>Price</th>
              <th className={thCls("chgPct", true)} onClick={() => toggleSort("chgPct")}>Chg%</th>
              <th className={thCls("volume", true)} onClick={() => toggleSort("volume")}>Volume</th>
              <th className={thCls("expenseRatio", true)} onClick={() => toggleSort("expenseRatio")}>ER</th>
              <th>Issuer</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => (
              <tr key={e.symbol} className="cursor-pointer hover:bg-term-amberSubtle"
                onClick={() => openTab("INTEL", e.symbol)}>
                <td className="num text-term-amber font-semibold">{e.symbol}</td>
                <td className="text-term-heading truncate max-w-[250px]">{e.name}</td>
                <td className="text-term-muted text-[10px]">{e.category}</td>
                <td className="text-right num">{fmtPrice(e.price)}</td>
                <td className={cn("text-right num", e.chgPct > 0 ? "up" : e.chgPct < 0 ? "down" : "")}>
                  {fmtPct(e.chgPct)}
                </td>
                <td className="text-right num">{fmtVolume(e.volume)}</td>
                <td className="text-right num">{e.expenseRatio.toFixed(2)}%</td>
                <td className="text-term-muted text-[10px]">{e.issuer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
