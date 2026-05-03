import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchScreener, hasFmpKey, type ScreenerParams } from "@/lib/fmp";
import { FmpKeyRequired } from "@/components/FmpKeyRequired";
import { useWorkspace } from "@/store/workspaceStore";
import { fmtPrice, fmtVolume } from "@/lib/format";
import { cn } from "@/lib/cn";

const SECTORS = [
  "", "Technology", "Healthcare", "Financial Services", "Consumer Cyclical",
  "Industrials", "Communication Services", "Consumer Defensive", "Energy",
  "Basic Materials", "Real Estate", "Utilities",
];

interface Preset {
  label: string;
  params: Partial<ScreenerParams>;
}

const PRESETS: Preset[] = [
  { label: "Large Cap", params: { marketCapMoreThan: 10_000_000_000, limit: 100 } },
  { label: "Small Cap", params: { marketCapMoreThan: 300_000_000, marketCapLowerThan: 2_000_000_000, limit: 100 } },
  { label: "High Dividend", params: { dividendMoreThan: 3, marketCapMoreThan: 1_000_000_000, limit: 100 } },
  { label: "High Volume", params: { volumeMoreThan: 10_000_000, marketCapMoreThan: 1_000_000_000, limit: 100 } },
  { label: "Penny Stocks", params: { priceLowerThan: 5, priceMoreThan: 0.5, volumeMoreThan: 500_000, limit: 100 } },
];

type SortKey = "symbol" | "price" | "marketCap" | "volume" | "dividend" | "sector";

export function SCR() {
  const openTab = useWorkspace((s) => s.openTab);
  const [params, setParams] = useState<ScreenerParams>({ marketCapMoreThan: 1_000_000_000, limit: 100 });
  const [sector, setSector] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortAsc, setSortAsc] = useState(false);

  if (!hasFmpKey()) return <FmpKeyRequired feature="Stock Screener" />;

  const queryParams = useMemo(
    () => ({ ...params, sector: sector || undefined }),
    [params, sector],
  );

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["screener", JSON.stringify(queryParams)],
    queryFn: () => fetchScreener(queryParams),
    staleTime: 120_000,
  });

  const sorted = useMemo(() => {
    const copy = [...data];
    copy.sort((a, b) => {
      let av: number | string, bv: number | string;
      switch (sortKey) {
        case "symbol": return sortAsc ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
        case "sector": return sortAsc ? a.sector.localeCompare(b.sector) : b.sector.localeCompare(a.sector);
        case "price": av = a.price; bv = b.price; break;
        case "marketCap": av = a.marketCap; bv = b.marketCap; break;
        case "volume": av = a.volume; bv = b.volume; break;
        case "dividend": av = a.lastAnnualDividend; bv = b.lastAnnualDividend; break;
        default: return 0;
      }
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return copy;
  }, [data, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const applyPreset = (p: Preset) => {
    setParams({ ...p.params });
    setSector("");
    setActivePreset(p.label);
  };

  const thClass = (key: SortKey) => cn("cursor-pointer select-none", sortKey === key && "text-term-amber");

  return (
    <div className="h-full flex flex-col">
      {/* Preset bar */}
      <div className="flex items-center gap-2 px-3 h-8 border-b border-term-border bg-term-panel2 text-[11px] uppercase tracking-wider">
        <span className="text-term-heading font-bold shrink-0">PRESETS</span>
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => applyPreset(p)}
            className={cn("px-2 py-0.5 border",
              activePreset === p.label ? "border-term-amber text-term-amber" : "border-transparent text-term-muted hover:text-term-text")}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-term-border text-[11px]">
        <label className="flex items-center gap-1">
          <span className="text-term-muted uppercase tracking-wider">Sector</span>
          <select value={sector} onChange={(e) => { setSector(e.target.value); setActivePreset(null); }}
            className="bg-term-bg border border-term-border px-1 py-0.5 text-term-text text-[11px] focus:outline-none focus:border-term-amber">
            <option value="">All</option>
            {SECTORS.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1">
          <span className="text-term-muted uppercase tracking-wider">Mkt Cap &gt;</span>
          <select
            value={params.marketCapMoreThan ?? ""}
            onChange={(e) => { setParams((p) => ({ ...p, marketCapMoreThan: Number(e.target.value) || undefined })); setActivePreset(null); }}
            className="bg-term-bg border border-term-border px-1 py-0.5 text-term-text text-[11px] focus:outline-none focus:border-term-amber">
            <option value="">Any</option>
            <option value="300000000">300M</option>
            <option value="1000000000">1B</option>
            <option value="10000000000">10B</option>
            <option value="100000000000">100B</option>
          </select>
        </label>
        <label className="flex items-center gap-1">
          <span className="text-term-muted uppercase tracking-wider">Vol &gt;</span>
          <select
            value={params.volumeMoreThan ?? ""}
            onChange={(e) => { setParams((p) => ({ ...p, volumeMoreThan: Number(e.target.value) || undefined })); setActivePreset(null); }}
            className="bg-term-bg border border-term-border px-1 py-0.5 text-term-text text-[11px] focus:outline-none focus:border-term-amber">
            <option value="">Any</option>
            <option value="100000">100K</option>
            <option value="500000">500K</option>
            <option value="1000000">1M</option>
            <option value="10000000">10M</option>
          </select>
        </label>
        <label className="flex items-center gap-1">
          <span className="text-term-muted uppercase tracking-wider">Div &gt;</span>
          <select
            value={params.dividendMoreThan ?? ""}
            onChange={(e) => { setParams((p) => ({ ...p, dividendMoreThan: Number(e.target.value) || undefined })); setActivePreset(null); }}
            className="bg-term-bg border border-term-border px-1 py-0.5 text-term-text text-[11px] focus:outline-none focus:border-term-amber">
            <option value="">Any</option>
            <option value="1">1%</option>
            <option value="2">2%</option>
            <option value="3">3%</option>
            <option value="5">5%</option>
          </select>
        </label>
        <span className="ml-auto text-term-muted num">{sorted.length} RESULTS</span>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto scroll-thin">
        {isLoading && <div className="p-4 text-term-muted uppercase text-[11px] tracking-widest">Loading…</div>}
        {error && <div className="p-4 text-term-red">{(error as Error).message}</div>}
        {!isLoading && !error && (
          <table className="w-full text-[12px] grid-data">
            <thead>
              <tr>
                <th>#</th>
                <th className={thClass("symbol")} onClick={() => toggleSort("symbol")}>Symbol</th>
                <th>Name</th>
                <th className={cn("text-right", thClass("price"))} onClick={() => toggleSort("price")}>Price</th>
                <th className={cn("text-right", thClass("marketCap"))} onClick={() => toggleSort("marketCap")}>Mkt Cap</th>
                <th className={cn("text-right", thClass("volume"))} onClick={() => toggleSort("volume")}>Volume</th>
                <th className={cn("text-right", thClass("dividend"))} onClick={() => toggleSort("dividend")}>Div Yield</th>
                <th className={thClass("sector")} onClick={() => toggleSort("sector")}>Sector</th>
                <th>Exchange</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={r.symbol} className="cursor-pointer" onClick={() => openTab("INTEL", r.symbol)}>
                  <td className="text-term-muted num">{i + 1}</td>
                  <td className="num text-term-amber font-semibold">{r.symbol}</td>
                  <td className="text-term-heading truncate max-w-[220px]">{r.companyName}</td>
                  <td className="num text-right">{fmtPrice(r.price)}</td>
                  <td className="num text-right text-term-muted">{fmtVolume(r.marketCap)}</td>
                  <td className="num text-right text-term-muted">{fmtVolume(r.volume)}</td>
                  <td className="num text-right">{r.lastAnnualDividend > 0 ? `$${r.lastAnnualDividend.toFixed(2)}` : "—"}</td>
                  <td className="text-term-muted truncate max-w-[140px]">{r.sector}</td>
                  <td className="text-term-muted">{r.exchangeShortName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="px-3 py-1 border-t border-term-border sub-header">DATA: FMP · CLICK A ROW TO OPEN INTEL</div>
    </div>
  );
}
