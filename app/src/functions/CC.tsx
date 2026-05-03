import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  fetchIndexHistorical, fetchTreasuryRates, fetchFxHistorical, fetchCryptoHistorical,
  fetchGainers, fetchLosers, fetchNewsCompany, fetchQuote, fetchEarningsCalendar,
  type Quote, type Mover, type EarningsEvent,
} from "@/lib/api";
import { COMMODITIES } from "@/lib/commodities";
import { SECTORS } from "@/lib/sp500";
import { fmtPrice, fmtPct, fmtPctFromDecimal, fmtTime } from "@/lib/format";
import { useWorkspace } from "@/store/workspaceStore";
import { usePortfolio } from "@/store/portfolioStore";
import { useCCLayout, type ModuleLayout } from "@/store/ccLayoutStore";
import { cn } from "@/lib/cn";

// ════════════════════════════════════════════════════════════════════════
// MODULE REGISTRY
// ════════════════════════════════════════════════════════════════════════

interface ModuleDef {
  id: string;
  name: string;
  category: string;
  Component: React.FC;
}

const MODULE_DEFS: ModuleDef[] = [
  { id: "us-markets",    name: "US Markets",        category: "Markets",   Component: UsMarketsModule },
  { id: "yield-curve",   name: "US Yield Curve",    category: "Macro",     Component: YieldCurveModule },
  { id: "fx-crypto",     name: "FX / Crypto",       category: "Markets",   Component: FxCryptoModule },
  { id: "gainers",       name: "Top Gainers",       category: "Movers",    Component: GainersModule },
  { id: "losers",        name: "Top Losers",        category: "Movers",    Component: LosersModule },
  { id: "headlines",     name: "Market Headlines",   category: "News",      Component: HeadlinesModule },
  { id: "sector-map",    name: "Sector Heatmap",    category: "Markets",   Component: SectorMapModule },
  { id: "world-indices", name: "World Indices",      category: "Markets",   Component: WorldIndicesModule },
  { id: "commodities",   name: "Commodities",       category: "Markets",   Component: CommoditiesModule },
  { id: "watchlist",     name: "Watchlist",          category: "Portfolio", Component: WatchlistModule },
  { id: "portfolio",     name: "Portfolio",          category: "Portfolio", Component: PortfolioModule },
  { id: "earnings",      name: "Earnings Calendar",  category: "Events",   Component: EarningsModule },
];

const MODULE_MAP = Object.fromEntries(MODULE_DEFS.map((m) => [m.id, m]));

// ════════════════════════════════════════════════════════════════════════
// MAIN CC COMPONENT
// ════════════════════════════════════════════════════════════════════════

export function CC() {
  const { modules, editing, setEditing, addModule, removeModule, moveModule, resizeModule, resetToDefault } = useCCLayout();
  const available = MODULE_DEFS.filter((m) => !modules.some((mod) => mod.id === m.id));

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="flex items-center px-3 h-7 border-b border-term-border bg-term-panel2 shrink-0">
        <span className="text-[10px] uppercase tracking-[0.18em] text-term-amber font-semibold">COMMAND CENTER</span>
        <span className="text-[10px] text-term-muted ml-2">{modules.length} modules</span>
        <div className="ml-auto flex items-center gap-2">
          {editing && (
            <button onClick={resetToDefault}
              className="text-[9px] px-2 py-0.5 border border-term-border text-term-muted hover:text-term-text uppercase tracking-wider">
              RESET
            </button>
          )}
          <button onClick={() => setEditing(!editing)}
            className={cn("text-[9px] px-2 py-0.5 border uppercase tracking-wider",
              editing ? "border-term-amber text-term-amber" : "border-term-border text-term-muted hover:text-term-text")}>
            {editing ? "DONE" : "EDIT"}
          </button>
        </div>
      </div>

      {/* Module grid */}
      <div className="flex-1 overflow-auto scroll-thin p-3">
        <div className="grid gap-3" style={{
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gridAutoRows: "200px",
          gridAutoFlow: "dense",
        }}>
          {modules.map((mod, idx) => {
            const def = MODULE_MAP[mod.id];
            if (!def) return null;
            return (
              <div key={mod.id} className="panel min-h-0 min-w-0 overflow-hidden"
                style={{
                  gridColumn: `span ${mod.w}`,
                  gridRow: `span ${mod.h}`,
                }}>
                {editing && (
                  <EditBar
                    mod={mod}
                    name={def.name}
                    idx={idx}
                    total={modules.length}
                    onMove={(dir) => moveModule(idx, dir)}
                    onResize={(w, h) => resizeModule(mod.id, w, h)}
                    onRemove={() => removeModule(mod.id)}
                  />
                )}
                <def.Component />
              </div>
            );
          })}
        </div>

        {/* Add module panel (edit mode) */}
        {editing && available.length > 0 && (
          <div className="mt-3 border border-dashed border-term-border p-3">
            <div className="text-[10px] uppercase tracking-wider text-term-muted mb-2">ADD MODULES</div>
            <div className="flex flex-wrap gap-2">
              {available.map((m) => (
                <button key={m.id} onClick={() => addModule(m.id)}
                  className="flex items-center gap-2 px-3 py-1.5 border border-term-border hover:border-term-amber text-[11px] group">
                  <span className="text-term-amber">+</span>
                  <span className="text-term-text group-hover:text-term-amber">{m.name}</span>
                  <span className="text-[9px] text-term-muted">{m.category}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// EDIT BAR (per-tile controls: reorder, resize, remove)
// ════════════════════════════════════════════════════════════════════════

function EditBar({ mod, name, idx, total, onMove, onResize, onRemove }: {
  mod: ModuleLayout;
  name: string;
  idx: number;
  total: number;
  onMove: (dir: "up" | "down") => void;
  onResize: (w: number, h: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1 px-2 h-7 bg-term-amberSubtle border-b border-term-amber shrink-0">
      {/* Reorder */}
      <button onClick={() => onMove("up")} disabled={idx === 0}
        className="text-[10px] text-term-amber disabled:text-term-muted/40 px-0.5"
        title="Move left">←</button>
      <button onClick={() => onMove("down")} disabled={idx === total - 1}
        className="text-[10px] text-term-amber disabled:text-term-muted/40 px-0.5"
        title="Move right">→</button>

      <span className="text-[9px] text-term-amber uppercase tracking-wider flex-1 truncate ml-1">{name}</span>

      {/* Width control */}
      <span className="text-[8px] text-term-muted tracking-wider ml-1">W</span>
      {[1, 2, 3].map((v) => (
        <button key={`w${v}`}
          onClick={() => onResize(v, mod.h)}
          className={cn(
            "w-4 h-4 text-[9px] font-bold leading-none",
            mod.w === v
              ? "bg-term-amber text-black"
              : "text-term-muted hover:text-term-amber",
          )}>
          {v}
        </button>
      ))}

      {/* Height control */}
      <span className="text-[8px] text-term-muted tracking-wider ml-2">H</span>
      {[1, 2, 3].map((v) => (
        <button key={`h${v}`}
          onClick={() => onResize(mod.w, v)}
          className={cn(
            "w-4 h-4 text-[9px] font-bold leading-none",
            mod.h === v
              ? "bg-term-amber text-black"
              : "text-term-muted hover:text-term-amber",
          )}>
          {v}
        </button>
      ))}

      {/* Remove */}
      <button onClick={onRemove}
        className="text-[10px] text-term-red hover:text-term-red px-1 font-bold ml-1"
        title="Remove module">✕</button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ════════════════════════════════════════════════════════════════════════

function Spark({ values, color = "#ff8c00" }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 28 - ((v - min) / (max - min || 1)) * 24;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 28" className="w-full h-8">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MODULE: US MARKETS
// ════════════════════════════════════════════════════════════════════════

const INDICES = [
  { sym: "^GSPC", name: "S&P 500" },
  { sym: "^DJI",  name: "Dow Jones" },
  { sym: "^IXIC", name: "NASDAQ" },
  { sym: "^RUT",  name: "Russell 2k" },
  { sym: "^VIX",  name: "VIX" },
];

function UsMarketsModule() {
  const idxQueries = useQueries({
    queries: INDICES.map((i) => ({
      queryKey: ["cc-idx", i.sym],
      queryFn: () => fetchIndexHistorical(i.sym, 14),
      refetchInterval: 60_000,
    })),
  });

  return (
    <>
      <div className="panel-header"><span>US MARKETS</span><span className="sub-header normal-case tracking-normal font-normal">14d</span></div>
      <div className="flex divide-x divide-term-border flex-1 min-h-0">
        {INDICES.map((idx, i) => {
          const q = idxQueries[i];
          const data = q.data ?? [];
          const last = data[data.length - 1];
          const prev = data[data.length - 2];
          const chgPct = last && prev ? ((last.close - prev.close) / prev.close) * 100 : undefined;
          const dir = chgPct == null ? "flat" : chgPct >= 0 ? "up" : "down";
          const vals = data.map((d) => d.close);
          return (
            <div key={idx.sym} className="p-2 flex flex-col flex-1 min-w-0">
              <div className="sub-header truncate">{idx.name}</div>
              <div className="num text-[16px] text-term-heading mt-1">
                {q.isLoading ? "…" : last?.close != null ? last.close.toFixed(2) : "—"}
              </div>
              <div className={cn("num text-[11px]", dir === "up" && "up", dir === "down" && "down")}>{fmtPct(chgPct)}</div>
              <div className="mt-auto"><Spark values={vals} color={dir === "up" ? "#22ee22" : dir === "down" ? "#ff3b3b" : "#ff8c00"} /></div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MODULE: YIELD CURVE
// ════════════════════════════════════════════════════════════════════════

function YieldCurveModule() {
  const openTab = useWorkspace((s) => s.openTab);
  const curve = useQuery({ queryKey: ["cc-treasury"], queryFn: () => fetchTreasuryRates(2), refetchInterval: 3600_000 });
  const today = curve.data?.sort((a, b) => (a.date > b.date ? -1 : 1))[0];

  const spread2y10y = today?.year_10 != null && today?.year_2 != null ? (today.year_10 - today.year_2) * 100 : undefined;
  const spread3m10y = today?.year_10 != null && today?.month_3 != null ? (today.year_10 - today.month_3) * 100 : undefined;
  const curveStatus = spread2y10y == null ? { t: "—", tone: "text-term-muted" as const }
    : spread2y10y < 0 ? { t: "INVERTED", tone: "down" as const }
    : spread2y10y < 25 ? { t: "FLAT", tone: "amber" as const }
    : spread2y10y < 100 ? { t: "NORMAL", tone: "up" as const }
    : { t: "STEEP", tone: "up" as const };

  return (
    <>
      <div className="panel-header cursor-pointer" onClick={() => openTab("CURV")}>
        <span>US YIELD CURVE</span>
        <span className={cn("normal-case tracking-normal font-bold text-[11px]",
          curveStatus.tone === "up" && "up", curveStatus.tone === "down" && "down",
          curveStatus.tone === "amber" && "amber", curveStatus.tone.startsWith("text") && curveStatus.tone)}>{curveStatus.t}</span>
      </div>
      <div className="p-3 flex flex-col gap-1.5 text-[11px] flex-1 min-h-0">
        <div className="flex items-center justify-between">
          <span className="sub-header">2s-10s SPREAD</span>
          <span className={cn("num font-semibold text-[13px]", spread2y10y == null ? "" : spread2y10y >= 0 ? "up" : "down")}>
            {spread2y10y == null ? "—" : `${spread2y10y >= 0 ? "+" : ""}${spread2y10y.toFixed(0)} bps`}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="sub-header">3m-10y SPREAD</span>
          <span className={cn("num font-semibold", spread3m10y == null ? "" : spread3m10y >= 0 ? "up" : "down")}>
            {spread3m10y == null ? "—" : `${spread3m10y >= 0 ? "+" : ""}${spread3m10y.toFixed(0)} bps`}
          </span>
        </div>
        <div className="border-t border-term-borderSoft pt-2 mt-1 grid grid-cols-6 gap-1">
          {[["3M","month_3"],["1Y","year_1"],["2Y","year_2"],["5Y","year_5"],["10Y","year_10"],["30Y","year_30"]].map(([l,k]) => (
            <div key={k} className="text-center">
              <div className="sub-header">{l}</div>
              <div className="num text-term-text">
                {today?.[k as keyof typeof today] != null ? fmtPctFromDecimal(today[k as keyof typeof today] as number, 2) : "—"}
              </div>
            </div>
          ))}
        </div>
        <div className="sub-header mt-auto text-center">CLICK HEADER → CURV</div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MODULE: FX / CRYPTO
// ════════════════════════════════════════════════════════════════════════

const FX_CRYPTO = [
  { sym: "EURUSD=X", name: "EUR/USD", kind: "fx", digits: 4 },
  { sym: "GBPUSD=X", name: "GBP/USD", kind: "fx", digits: 4 },
  { sym: "USDJPY=X", name: "USD/JPY", kind: "fx", digits: 2 },
  { sym: "BTC-USD",  name: "BTC",     kind: "crypto", digits: 0 },
  { sym: "ETH-USD",  name: "ETH",     kind: "crypto", digits: 0 },
];

function FxCryptoModule() {
  const openTab = useWorkspace((s) => s.openTab);
  const fxQueries = useQueries({
    queries: FX_CRYPTO.map((x) => ({
      queryKey: ["cc-fxc", x.sym],
      queryFn: () => x.kind === "fx" ? fetchFxHistorical(x.sym, 14) : fetchCryptoHistorical(x.sym, 14),
      refetchInterval: 60_000,
    })),
  });

  return (
    <>
      <div className="panel-header">
        <span>FX · CRYPTO</span>
        <span className="sub-header normal-case tracking-normal font-normal cursor-pointer hover:text-term-amber"
          onClick={() => openTab("FXC")}>all FX →</span>
      </div>
      <div className="p-2 flex flex-col divide-y divide-term-borderSoft text-[12px] flex-1 min-h-0 overflow-auto scroll-thin">
        {FX_CRYPTO.map((x, i) => {
          const data = fxQueries[i].data ?? [];
          const last = data[data.length - 1];
          const prev = data[data.length - 2];
          const chgPct = last && prev ? ((last.close - prev.close) / prev.close) * 100 : undefined;
          const dir = chgPct == null ? "flat" : chgPct >= 0 ? "up" : "down";
          return (
            <div key={x.sym} className="flex items-center gap-2 py-1.5">
              <span className="text-term-amber font-bold text-[11px] w-16">{x.name}</span>
              <span className="num flex-1">
                {fxQueries[i].isLoading ? "…" : last?.close != null
                  ? last.close.toLocaleString(undefined, { minimumFractionDigits: x.digits, maximumFractionDigits: x.digits }) : "—"}
              </span>
              <span className={cn("num text-[11px] w-16 text-right", dir === "up" && "up", dir === "down" && "down")}>{fmtPct(chgPct)}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MODULE: GAINERS
// ════════════════════════════════════════════════════════════════════════

function GainersModule() {
  const openTab = useWorkspace((s) => s.openTab);
  const { data, isLoading } = useQuery({ queryKey: ["cc-gainers"], queryFn: fetchGainers, refetchInterval: 120_000 });

  return (
    <>
      <div className="panel-header">
        <span className="up">TOP GAINERS</span>
        <span className="sub-header normal-case tracking-normal font-normal cursor-pointer hover:text-term-amber"
          onClick={() => openTab("MOV")}>view all →</span>
      </div>
      <div className="flex-1 overflow-auto scroll-thin min-h-0">
        <table className="w-full text-[12px]">
          <tbody>
            {(data ?? []).slice(0, 8).map((m, i) => (
              <tr key={m.symbol} onClick={() => openTab("INTEL", m.symbol)}
                className="cursor-pointer border-b border-term-borderSoft hover:bg-term-amberSubtle">
                <td className="px-2 py-1 text-term-muted num w-6">{i + 1}</td>
                <td className="px-2 py-1 num text-term-amber font-semibold w-16">{m.symbol}</td>
                <td className="px-2 py-1 text-term-heading truncate max-w-[180px]">{m.name}</td>
                <td className="px-2 py-1 num text-right">{fmtPrice(m.price)}</td>
                <td className="px-2 py-1 num text-right up w-20">{fmtPct(m.percent_change * 100)}</td>
              </tr>
            ))}
            {isLoading && <tr><td colSpan={5} className="p-3 text-term-muted">Loading…</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MODULE: LOSERS
// ════════════════════════════════════════════════════════════════════════

function LosersModule() {
  const openTab = useWorkspace((s) => s.openTab);
  const { data, isLoading } = useQuery({ queryKey: ["cc-losers"], queryFn: fetchLosers, refetchInterval: 120_000 });

  return (
    <>
      <div className="panel-header">
        <span className="down">TOP LOSERS</span>
        <span className="sub-header normal-case tracking-normal font-normal cursor-pointer hover:text-term-amber"
          onClick={() => openTab("MOV")}>view all →</span>
      </div>
      <div className="flex-1 overflow-auto scroll-thin min-h-0">
        <table className="w-full text-[12px]">
          <tbody>
            {(data ?? []).slice(0, 8).map((m, i) => (
              <tr key={m.symbol} onClick={() => openTab("INTEL", m.symbol)}
                className="cursor-pointer border-b border-term-borderSoft hover:bg-term-amberSubtle">
                <td className="px-2 py-1 text-term-muted num w-6">{i + 1}</td>
                <td className="px-2 py-1 num text-term-amber font-semibold w-16">{m.symbol}</td>
                <td className="px-2 py-1 text-term-heading truncate max-w-[180px]">{m.name}</td>
                <td className="px-2 py-1 num text-right">{fmtPrice(m.price)}</td>
                <td className="px-2 py-1 num text-right down w-20">{fmtPct(m.percent_change * 100)}</td>
              </tr>
            ))}
            {isLoading && <tr><td colSpan={5} className="p-3 text-term-muted">Loading…</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MODULE: HEADLINES
// ════════════════════════════════════════════════════════════════════════

function HeadlinesModule() {
  const { data, isLoading } = useQuery({
    queryKey: ["cc-news"], queryFn: () => fetchNewsCompany("SPY", 12), staleTime: 60_000,
  });

  return (
    <>
      <div className="panel-header"><span>MARKET HEADLINES</span></div>
      <div className="flex-1 overflow-auto scroll-thin min-h-0 divide-y divide-term-borderSoft">
        {isLoading && <div className="p-3 text-term-muted">Loading…</div>}
        {(data ?? []).slice(0, 12).map((n, i) => (
          <a key={n.id + i} href={n.url} target="_blank" rel="noreferrer"
            className="block px-3 py-1.5 hover:bg-term-amberSubtle group">
            <div className="sub-header">{fmtTime(n.date)} · {n.source}</div>
            <div className="text-term-heading group-hover:text-term-amber text-[12px] leading-snug line-clamp-2">{n.title}</div>
          </a>
        ))}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MODULE: SECTOR HEATMAP (mini)
// ════════════════════════════════════════════════════════════════════════

function chgColor(pct: number): string {
  if (pct > 2) return "#22ee22";
  if (pct > 1) return "#44cc44";
  if (pct > 0.25) return "#338833";
  if (pct > -0.25) return "#444444";
  if (pct > -1) return "#883333";
  if (pct > -2) return "#cc4444";
  return "#ff3b3b";
}

function SectorMapModule() {
  const openTab = useWorkspace((s) => s.openTab);
  const sectorQueries = useQueries({
    queries: SECTORS.map((s) => ({
      queryKey: ["quote", s.etf],
      queryFn: () => fetchQuote(s.etf),
      refetchInterval: 30_000,
    })),
  });

  const sectorData = useMemo(() => {
    return SECTORS.map((s, i) => {
      const q = sectorQueries[i]?.data as Quote | undefined;
      const chg = q?.change_percent != null
        ? q.change_percent
        : (q?.last_price != null && q?.prev_close != null && q.prev_close !== 0)
          ? ((q.last_price - q.prev_close) / q.prev_close) * 100 : 0;
      return { ...s, chgPct: chg };
    });
  }, [sectorQueries.map((q) => q.dataUpdatedAt).join(",")]);

  return (
    <>
      <div className="panel-header cursor-pointer" onClick={() => openTab("SMAP")}>
        <span>SECTORS</span>
        <span className="sub-header normal-case tracking-normal font-normal">expand →</span>
      </div>
      <div className="flex-1 p-2 flex flex-col gap-1 overflow-auto scroll-thin min-h-0">
        {sectorData.map((s) => (
          <div key={s.etf} className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-term-amberSubtle px-1 py-0.5"
            onClick={() => openTab("SMAP")}>
            <span className="w-2 h-2 shrink-0" style={{ backgroundColor: chgColor(s.chgPct) }} />
            <span className="text-term-amber font-semibold w-12 num">{s.etf}</span>
            <span className="text-term-text flex-1 truncate">{s.name}</span>
            <span className={cn("num w-16 text-right", s.chgPct > 0 ? "up" : s.chgPct < 0 ? "down" : "text-term-muted")}>
              {s.chgPct > 0 ? "+" : ""}{s.chgPct.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MODULE: WORLD INDICES
// ════════════════════════════════════════════════════════════════════════

const WORLD_IDX = [
  { sym: "^FTSE",    name: "FTSE 100" },
  { sym: "^GDAXI",   name: "DAX" },
  { sym: "^N225",    name: "Nikkei 225" },
  { sym: "^HSI",     name: "Hang Seng" },
  { sym: "^AXJO",    name: "ASX 200" },
  { sym: "^GSPTSE",  name: "TSX Comp" },
];

function WorldIndicesModule() {
  const openTab = useWorkspace((s) => s.openTab);
  const queries = useQueries({
    queries: WORLD_IDX.map((idx) => ({
      queryKey: ["index-hist", idx.sym],
      queryFn: () => fetchIndexHistorical(idx.sym, 5),
      refetchInterval: 60_000,
    })),
  });

  return (
    <>
      <div className="panel-header cursor-pointer" onClick={() => openTab("WEI")}>
        <span>WORLD INDICES</span>
        <span className="sub-header normal-case tracking-normal font-normal">expand →</span>
      </div>
      <div className="flex-1 overflow-auto scroll-thin min-h-0">
        <table className="w-full text-[11px]">
          <tbody>
            {WORLD_IDX.map((idx, i) => {
              const data = queries[i].data ?? [];
              const last = data[data.length - 1];
              const prev = data[data.length - 2];
              const chgPct = last && prev ? ((last.close - prev.close) / prev.close) * 100 : undefined;
              const dir = chgPct == null ? "flat" : chgPct >= 0 ? "up" : "down";
              return (
                <tr key={idx.sym} className="border-b border-term-borderSoft">
                  <td className="px-2 py-1 text-term-heading">{idx.name}</td>
                  <td className="px-2 py-1 num text-right">{queries[i].isLoading ? "…" : fmtPrice(last?.close, 2)}</td>
                  <td className={cn("px-2 py-1 num text-right w-16", dir === "up" && "up", dir === "down" && "down")}>{fmtPct(chgPct)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MODULE: COMMODITIES
// ════════════════════════════════════════════════════════════════════════

const KEY_CMDTY = COMMODITIES.filter((c) =>
  ["CL=F", "NG=F", "GC=F", "SI=F", "ZC=F", "HG=F"].includes(c.symbol)
);

function CommoditiesModule() {
  const openTab = useWorkspace((s) => s.openTab);
  const queries = useQueries({
    queries: KEY_CMDTY.map((c) => ({
      queryKey: ["cmdty-q", c.symbol],
      queryFn: () => fetchQuote(c.symbol),
      refetchInterval: 30_000,
    })),
  });

  return (
    <>
      <div className="panel-header cursor-pointer" onClick={() => openTab("CMDTY")}>
        <span>COMMODITIES</span>
        <span className="sub-header normal-case tracking-normal font-normal">expand →</span>
      </div>
      <div className="flex-1 overflow-auto scroll-thin min-h-0">
        <table className="w-full text-[11px]">
          <tbody>
            {KEY_CMDTY.map((c, i) => {
              const q = queries[i]?.data as Quote | undefined;
              const chgPct = q?.change_percent != null ? q.change_percent
                : (q?.last_price != null && q?.prev_close != null && q.prev_close !== 0)
                  ? ((q.last_price - q.prev_close) / q.prev_close) * 100 : undefined;
              const dir = chgPct == null ? "flat" : chgPct >= 0 ? "up" : "down";
              return (
                <tr key={c.symbol} className="border-b border-term-borderSoft cursor-pointer hover:bg-term-amberSubtle"
                  onClick={() => openTab("GP", c.symbol)}>
                  <td className="px-2 py-1.5 text-term-amber font-semibold w-20">{c.name}</td>
                  <td className="px-2 py-1.5 num text-right">{q?.last_price != null ? q.last_price.toFixed(c.digits) : "—"}</td>
                  <td className={cn("px-2 py-1.5 num text-right w-16", dir === "up" && "up", dir === "down" && "down")}>
                    {chgPct != null ? fmtPct(chgPct) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-term-muted text-[9px] w-12">{c.unit}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MODULE: WATCHLIST
// ════════════════════════════════════════════════════════════════════════

function WatchlistModule() {
  const openTab = useWorkspace((s) => s.openTab);
  const { watchlist } = usePortfolio();
  const symbols = watchlist.map((w) => w.symbol);

  const quoteQueries = useQueries({
    queries: symbols.map((s) => ({
      queryKey: ["quote", s],
      queryFn: () => fetchQuote(s),
      refetchInterval: 10_000,
    })),
  });

  return (
    <>
      <div className="panel-header cursor-pointer" onClick={() => openTab("WL")}>
        <span>WATCHLIST</span>
        <span className="sub-header normal-case tracking-normal font-normal">{symbols.length} sym · expand →</span>
      </div>
      <div className="flex-1 overflow-auto scroll-thin min-h-0">
        {symbols.length === 0 ? (
          <div className="p-3 text-[10px] text-term-muted uppercase tracking-widest text-center">
            Add symbols via WL
          </div>
        ) : (
          <table className="w-full text-[11px]">
            <tbody>
              {symbols.slice(0, 12).map((sym, i) => {
                const q = quoteQueries[i]?.data as Quote | undefined;
                const chgPct = q?.change_percent != null ? q.change_percent
                  : (q?.last_price != null && q?.prev_close != null && q.prev_close !== 0)
                    ? ((q.last_price - q.prev_close) / q.prev_close) * 100 : undefined;
                const dir = chgPct == null ? "flat" : chgPct >= 0 ? "up" : "down";
                return (
                  <tr key={sym} className="border-b border-term-borderSoft cursor-pointer hover:bg-term-amberSubtle"
                    onClick={() => openTab("INTEL", sym)}>
                    <td className="px-2 py-1 num text-term-amber font-semibold w-16">{sym}</td>
                    <td className="px-2 py-1 num text-right">{fmtPrice(q?.last_price)}</td>
                    <td className={cn("px-2 py-1 num text-right w-16", dir === "up" && "up", dir === "down" && "down")}>
                      {chgPct != null ? fmtPct(chgPct) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MODULE: PORTFOLIO
// ════════════════════════════════════════════════════════════════════════

function PortfolioModule() {
  const openTab = useWorkspace((s) => s.openTab);
  const { holdings } = usePortfolio();
  const symbols = holdings.map((h) => h.symbol);

  const quoteQueries = useQueries({
    queries: symbols.map((s) => ({
      queryKey: ["quote", s],
      queryFn: () => fetchQuote(s),
      refetchInterval: 10_000,
    })),
  });

  let totalValue = 0, totalCost = 0, totalDayPL = 0;
  holdings.forEach((h, i) => {
    const q = quoteQueries[i]?.data as Quote | undefined;
    const price = q?.last_price ?? 0;
    totalValue += price * h.shares;
    totalCost += h.costBasis * h.shares;
    const dayChg = price && q?.prev_close ? price - q.prev_close : 0;
    totalDayPL += dayChg * h.shares;
  });
  const totalPL = totalValue - totalCost;
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  return (
    <>
      <div className="panel-header cursor-pointer" onClick={() => openTab("PORT")}>
        <span>PORTFOLIO</span>
        <span className="sub-header normal-case tracking-normal font-normal">{holdings.length} pos · expand →</span>
      </div>
      {holdings.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[10px] text-term-muted uppercase tracking-widest">
          Add positions via PORT
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-4 px-3 py-2 border-b border-term-borderSoft text-[11px]">
            <span className="text-term-muted">VALUE <span className="text-term-heading num ml-1">{fmtPrice(totalValue)}</span></span>
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
          <div className="flex-1 overflow-auto scroll-thin min-h-0">
            <table className="w-full text-[11px]">
              <tbody>
                {holdings.slice(0, 10).map((h, i) => {
                  const q = quoteQueries[i]?.data as Quote | undefined;
                  const mktVal = (q?.last_price ?? 0) * h.shares;
                  const pl = mktVal - h.costBasis * h.shares;
                  return (
                    <tr key={h.symbol} className="border-b border-term-borderSoft cursor-pointer hover:bg-term-amberSubtle"
                      onClick={() => openTab("INTEL", h.symbol)}>
                      <td className="px-2 py-1 num text-term-amber font-semibold w-14">{h.symbol}</td>
                      <td className="px-2 py-1 num text-right">{fmtPrice(q?.last_price)}</td>
                      <td className={cn("px-2 py-1 num text-right w-20", pl > 0 ? "up" : pl < 0 ? "down" : "")}>
                        {pl > 0 ? "+" : ""}{fmtPrice(pl)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MODULE: EARNINGS CALENDAR
// ════════════════════════════════════════════════════════════════════════

function EarningsModule() {
  const openTab = useWorkspace((s) => s.openTab);
  const today = new Date().toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["cc-earnings", today, endDate],
    queryFn: () => fetchEarningsCalendar(today, endDate),
    staleTime: 300_000,
  });

  return (
    <>
      <div className="panel-header cursor-pointer" onClick={() => openTab("ECAL")}>
        <span>EARNINGS (7D)</span>
        <span className="sub-header normal-case tracking-normal font-normal">expand →</span>
      </div>
      <div className="flex-1 overflow-auto scroll-thin min-h-0">
        {isLoading && <div className="p-3 text-term-muted text-[10px]">Loading…</div>}
        {events.length === 0 && !isLoading && (
          <div className="p-3 text-[10px] text-term-muted text-center">No upcoming earnings</div>
        )}
        {events.slice(0, 15).map((e, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1 text-[11px] border-b border-term-borderSoft cursor-pointer hover:bg-term-amberSubtle"
            onClick={() => openTab("INTEL", e.symbol)}>
            <span className="num text-term-amber font-semibold w-14 shrink-0">{e.symbol}</span>
            <span className="text-term-text truncate flex-1">{e.name ?? ""}</span>
            <span className="text-term-muted text-[9px] shrink-0">{e.report_date ?? ""}</span>
            {e.eps_estimate != null && (
              <span className="num text-term-muted text-[9px] shrink-0 w-12 text-right">
                Est {e.eps_estimate.toFixed(2)}
              </span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
