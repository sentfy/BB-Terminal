import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEconomicCalendar, hasFmpKey, type EconEvent } from "@/lib/fmp";
import { FmpKeyRequired } from "@/components/FmpKeyRequired";
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

function impactColor(impact: string) {
  const i = impact.toLowerCase();
  if (i === "high") return "text-term-red";
  if (i === "medium") return "text-term-amber";
  return "text-term-muted";
}

function impactBorder(impact: string) {
  const i = impact.toLowerCase();
  if (i === "high") return "border-l-2 border-l-term-red";
  if (i === "medium") return "border-l-2 border-l-term-amber";
  return "border-l-2 border-l-term-border";
}

export function ECON() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [country, setCountry] = useState<"US" | "ALL">("US");

  if (!hasFmpKey()) return <FmpKeyRequired feature="Economic Calendar" />;

  const baseWeek = useMemo(() => {
    const today = new Date();
    return addDays(weekStart(today), weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(
    () => Array.from({ length: 5 }, (_, i) => addDays(baseWeek, i)),
    [baseWeek],
  );

  const startDate = toISO(weekDays[0]);
  const endDate = toISO(weekDays[4]);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["econ-cal", startDate, endDate],
    queryFn: () => fetchEconomicCalendar(startDate, endDate),
    staleTime: 300_000,
  });

  const filtered = useMemo(
    () => (country === "US" ? events.filter((e) => e.country === "US") : events),
    [events, country],
  );

  const byDate = useMemo(() => {
    const map: Record<string, EconEvent[]> = {};
    for (const e of filtered) {
      const d = (e.date ?? "").slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(e);
    }
    return map;
  }, [filtered]);

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
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setCountry("US")}
            className={cn("text-[10px] px-2 py-0.5 border",
              country === "US" ? "border-term-amber text-term-amber" : "border-transparent text-term-muted hover:text-term-text")}>
            US
          </button>
          <button onClick={() => setCountry("ALL")}
            className={cn("text-[10px] px-2 py-0.5 border",
              country === "ALL" ? "border-term-amber text-term-amber" : "border-transparent text-term-muted hover:text-term-text")}>
            ALL
          </button>
          {isLoading && <span className="text-[10px] text-term-muted">LOADING…</span>}
        </div>
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
                  {fmtDay(day)} <span className="text-term-muted font-normal">({dayEvents.length})</span>
                </div>
                <div className="flex-1 overflow-auto scroll-thin p-1">
                  {dayEvents.length === 0 && (
                    <div className="text-[10px] text-term-muted p-1 italic">No events</div>
                  )}
                  {dayEvents.map((e, i) => {
                    const beat = e.actual != null && e.consensus != null ? e.actual > e.consensus : null;
                    return (
                      <div key={i} className={cn(
                        "px-1 py-1 text-[11px] border-b border-term-borderSoft",
                        impactBorder(e.impact),
                      )}>
                        <div className="flex items-center gap-1">
                          <span className={cn("text-[9px] font-bold uppercase tracking-wider", impactColor(e.impact))}>
                            {e.impact.slice(0, 3)}
                          </span>
                          {e.country !== "US" && (
                            <span className="text-[9px] text-term-muted">{e.country}</span>
                          )}
                        </div>
                        <div className="text-term-text truncate">{e.event}</div>
                        <div className="flex items-center gap-2 text-[10px] mt-0.5">
                          {e.actual != null && (
                            <span className={cn("num font-semibold",
                              beat === true ? "up" : beat === false ? "down" : "text-term-text")}>
                              A: {e.actual}
                            </span>
                          )}
                          {e.consensus != null && (
                            <span className="num text-term-muted">F: {e.consensus}</span>
                          )}
                          {e.previous != null && (
                            <span className="num text-term-muted">P: {e.previous}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-3 py-1 border-t border-term-border sub-header">
        DATA: FMP · A=ACTUAL F=FORECAST P=PREVIOUS · IMPACT: HIGH/MED/LOW
      </div>
    </div>
  );
}
