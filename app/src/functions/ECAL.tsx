import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEarningsCalendar, type EarningsEvent } from "@/lib/api";
import { useWorkspace } from "@/store/workspaceStore";
import { fmtPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

function weekStart(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function ECAL() {
  const openTab = useWorkspace((s) => s.openTab);
  const [weekOffset, setWeekOffset] = useState(0);

  const baseWeek = useMemo(() => {
    const today = new Date();
    return addDays(weekStart(today), weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => addDays(baseWeek, i)),
  [baseWeek]);

  const startDate = toISO(weekDays[0]);
  const endDate = toISO(weekDays[4]);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["earnings-cal", startDate, endDate],
    queryFn: () => fetchEarningsCalendar(startDate, endDate),
    staleTime: 300_000,
  });

  // Group by date
  const byDate = useMemo(() => {
    const map: Record<string, EarningsEvent[]> = {};
    for (const e of events) {
      const d = e.report_date ?? "";
      if (!map[d]) map[d] = [];
      map[d].push(e);
    }
    return map;
  }, [events]);

  return (
    <div className="flex flex-col h-full">
      {/* Navigation */}
      <div className="flex items-center px-3 h-8 border-b border-term-border bg-term-panel2">
        <button onClick={() => setWeekOffset((w) => w - 1)}
          className="text-[11px] text-term-amber hover:text-term-amberBright px-2">← PREV</button>
        <span className="text-[11px] uppercase tracking-wider text-term-heading mx-3">
          {fmtDay(weekDays[0])} — {fmtDay(weekDays[4])}
        </span>
        <button onClick={() => setWeekOffset((w) => w + 1)}
          className="text-[11px] text-term-amber hover:text-term-amberBright px-2">NEXT →</button>
        {weekOffset !== 0 && (
          <button onClick={() => setWeekOffset(0)}
            className="text-[10px] text-term-muted hover:text-term-text ml-2 px-2 border border-term-border">
            THIS WEEK
          </button>
        )}
        {isLoading && <span className="ml-auto text-[10px] text-term-muted">LOADING…</span>}
      </div>

      {/* Week grid */}
      <div className="flex-1 overflow-auto scroll-thin">
        <div className="grid grid-cols-5 gap-px bg-term-border min-h-full">
          {weekDays.map((day) => {
            const iso = toISO(day);
            const dayEvents = byDate[iso] ?? [];
            const isToday = iso === toISO(new Date());
            return (
              <div key={iso} className={cn("bg-term-panel flex flex-col min-h-[200px]", isToday && "bg-term-amberSubtle")}>
                <div className={cn("px-2 py-1 text-[10px] uppercase tracking-wider border-b border-term-borderSoft",
                  isToday ? "text-term-amber font-bold" : "text-term-muted")}>
                  {fmtDay(day)}
                </div>
                <div className="flex-1 overflow-auto scroll-thin p-1">
                  {dayEvents.length === 0 && (
                    <div className="text-[10px] text-term-muted p-1 italic">No earnings</div>
                  )}
                  {dayEvents.map((e, i) => (
                    <div key={i}
                      className="flex items-center gap-1 px-1 py-0.5 text-[11px] hover:bg-term-amberSubtle cursor-pointer border-b border-term-borderSoft"
                      onClick={() => openTab("INTEL", e.symbol)}>
                      <span className="num text-term-amber font-semibold w-14 shrink-0">{e.symbol}</span>
                      <span className="text-term-text truncate flex-1">{e.name ?? ""}</span>
                      {e.eps_actual != null && e.eps_estimate != null && (
                        <span className={cn("num text-[10px]",
                          e.eps_actual >= e.eps_estimate ? "up" : "down")}>
                          {e.eps_actual.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {events.length === 0 && !isLoading && (
        <div className="px-3 py-2 text-[10px] text-term-muted border-t border-term-border">
          No earnings data available for this week. The earnings calendar endpoint may require a premium data provider.
        </div>
      )}
    </div>
  );
}
