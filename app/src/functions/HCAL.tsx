import { useMemo } from "react";
import { ICE_HOLIDAYS, CME_HOLIDAYS, NYSE_HOLIDAYS, getUpcomingHolidays, isPastHoliday, type TradingHoliday } from "@/lib/holidays";
import { cn } from "@/lib/cn";

function fmtHolidayDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function HolidayColumn({ title, holidays, accent }: { title: string; holidays: TradingHoliday[]; accent: string }) {
  const upcoming = useMemo(() => getUpcomingHolidays(holidays, 3), [holidays]);
  const nextDate = upcoming[0]?.date;

  return (
    <div className="flex flex-col min-h-0">
      <div className="px-2 py-1.5 text-[11px] uppercase tracking-wider font-bold border-b border-term-border" style={{ color: accent }}>
        {title}
      </div>
      {/* Next up */}
      {upcoming.length > 0 && (
        <div className="px-2 py-1.5 border-b border-term-borderSoft bg-term-panel2">
          <div className="text-[9px] uppercase tracking-wider text-term-muted mb-0.5">NEXT</div>
          <div className="text-[12px] font-semibold" style={{ color: accent }}>{upcoming[0].name}</div>
          <div className="text-[11px] num text-term-heading">{fmtHolidayDate(upcoming[0].date)}</div>
        </div>
      )}
      {/* Full list */}
      <div className="flex-1 overflow-auto scroll-thin">
        {holidays.map((h) => {
          const past = isPastHoliday(h.date);
          const isNext = h.date === nextDate;
          return (
            <div key={h.date + h.name}
              className={cn(
                "flex items-center justify-between px-2 py-1 border-b border-term-borderSoft text-[11px]",
                past && "opacity-40",
                isNext && "bg-term-amberSubtle"
              )}>
              <div className="flex-1">
                <div className={cn("text-term-heading", isNext && "font-semibold")}>{h.name}</div>
                <div className="num text-term-muted text-[10px]">{fmtHolidayDate(h.date)}</div>
              </div>
              {h.earlyClose && (
                <span className="text-[9px] uppercase tracking-wider text-term-amber border border-term-amber/30 px-1 py-0.5">
                  EARLY
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HCAL() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-3 h-8 border-b border-term-border bg-term-panel2">
        <span className="text-[11px] uppercase tracking-wider text-term-heading">
          2025-2026 Trading Holiday Calendar
        </span>
        <span className="ml-auto text-[10px] text-term-muted">Past dates dimmed · Next holiday highlighted</span>
      </div>
      <div className="flex-1 grid grid-cols-3 gap-px bg-term-border min-h-0 overflow-hidden">
        <HolidayColumn title="ICE Futures" holidays={ICE_HOLIDAYS} accent="#ff8c00" />
        <HolidayColumn title="CME Group" holidays={CME_HOLIDAYS} accent="#22ccee" />
        <HolidayColumn title="NYSE / NASDAQ" holidays={NYSE_HOLIDAYS} accent="#22ee22" />
      </div>
    </div>
  );
}
