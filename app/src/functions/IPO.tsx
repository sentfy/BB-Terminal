import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchIpoCalendar, hasFmpKey } from "@/lib/fmp";
import { FmpKeyRequired } from "@/components/FmpKeyRequired";
import { useWorkspace } from "@/store/workspaceStore";
import { fmtVolume } from "@/lib/format";
import { cn } from "@/lib/cn";

type Tab = "upcoming" | "recent" | "thisWeek";
const TABS: { id: Tab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "recent", label: "Recent" },
  { id: "thisWeek", label: "This Week" },
];

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dateRange(tab: Tab): { from: string; to: string } {
  const now = new Date();
  if (tab === "upcoming") {
    const future = new Date(now);
    future.setDate(future.getDate() + 60);
    return { from: toISO(now), to: toISO(future) };
  }
  if (tab === "recent") {
    const past = new Date(now);
    past.setDate(past.getDate() - 30);
    return { from: toISO(past), to: toISO(now) };
  }
  // thisWeek
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(mon.getDate() - day + (day === 0 ? -6 : 1));
  const fri = new Date(mon);
  fri.setDate(fri.getDate() + 4);
  return { from: toISO(mon), to: toISO(fri) };
}

export function IPO() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const openTab = useWorkspace((s) => s.openTab);

  if (!hasFmpKey()) return <FmpKeyRequired feature="IPO Calendar" />;

  const { from, to } = useMemo(() => dateRange(tab), [tab]);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["ipo-cal", tab, from, to],
    queryFn: () => fetchIpoCalendar(from, to),
    staleTime: 300_000,
  });

  const sorted = useMemo(
    () => [...data].sort((a, b) => (tab === "recent" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date))),
    [data, tab],
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 h-8 px-3 border-b border-term-border bg-term-panel2 text-[11px] uppercase tracking-wider">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("px-2 py-0.5 border",
              tab === t.id ? "border-term-amber text-term-amber" : "border-transparent text-term-muted hover:text-term-text")}>
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-term-muted">{sorted.length} IPOs · {from} to {to}</span>
      </div>
      <div className="flex-1 overflow-auto scroll-thin">
        {isLoading && <div className="p-4 text-term-muted uppercase text-[11px] tracking-widest">Loading…</div>}
        {error && <div className="p-4 text-term-red">{(error as Error).message}</div>}
        {!isLoading && !error && (
          <table className="w-full text-[12px] grid-data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Company</th>
                <th>Symbol</th>
                <th>Exchange</th>
                <th className="text-right">Price Range</th>
                <th className="text-right">Shares</th>
                <th className="text-right">Mkt Cap</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((ipo, i) => (
                <tr key={`${ipo.symbol}-${i}`}
                  className={ipo.symbol ? "cursor-pointer" : ""}
                  onClick={() => ipo.symbol && openTab("INTEL", ipo.symbol)}>
                  <td className="num text-term-muted">{ipo.date}</td>
                  <td className="text-term-heading truncate max-w-[260px]">{ipo.company}</td>
                  <td className="num text-term-amber font-semibold">{ipo.symbol || "—"}</td>
                  <td className="text-term-muted">{ipo.exchange || "—"}</td>
                  <td className="num text-right">{ipo.priceRange}</td>
                  <td className="num text-right text-term-muted">{ipo.shares != null ? fmtVolume(ipo.shares) : "—"}</td>
                  <td className="num text-right text-term-muted">{ipo.marketCap != null ? fmtVolume(ipo.marketCap) : "—"}</td>
                  <td className={cn("text-[10px] uppercase",
                    ipo.actions === "priced" ? "up" : ipo.actions === "withdrawn" ? "down" : "text-term-amber")}>
                    {ipo.actions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="px-3 py-1 border-t border-term-border sub-header">DATA: FMP · CLICK A LISTED IPO TO OPEN INTEL</div>
    </div>
  );
}
