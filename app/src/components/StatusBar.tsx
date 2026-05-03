import { useEffect, useState } from "react";
import { useWorkspace } from "@/store/workspaceStore";
import { useSettings } from "@/store/settingsStore";
import { useAlerts } from "@/store/alertStore";
import { useMultiScreen } from "@/store/multiScreenStore";

export function StatusBar() {
  const [now, setNow] = useState(() => new Date());
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const tabs = useWorkspace((s) => s.tabs);
  const openTab = useWorkspace((s) => s.openTab);
  const provider = useSettings((s) => s.activeProvider);
  const unreadCount = useAlerts((s) => s.notifications.filter((n) => !n.read).length);
  const layout = useMultiScreen((s) => s.layout);
  const focusedIdx = useMultiScreen((s) => s.focusedIdx);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;
    const ping = async () => {
      try {
        const r = await fetch("/api/v1/equity/price/quote?symbol=SPY&provider=yfinance");
        if (alive) setApiOk(r.ok);
      } catch { if (alive) setApiOk(false); }
    };
    ping();
    const t = setInterval(ping, 15000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <div className="h-6 px-3 flex items-center justify-between border-t border-term-border bg-term-panel2 text-[10px] uppercase tracking-[0.18em] text-term-muted">
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-2">
          <span className={
            apiOk == null ? "w-1.5 h-1.5 bg-term-muted"
            : apiOk ? "w-1.5 h-1.5 bg-term-green shadow-[0_0_6px_rgba(34,238,34,0.6)]"
            : "w-1.5 h-1.5 bg-term-red shadow-[0_0_6px_rgba(255,59,59,0.6)]"
          } />
          <span>OPENBB {apiOk == null ? "…" : apiOk ? "LIVE" : "DOWN"}</span>
        </span>
        <span>PROVIDER <span className="text-term-amber ml-1">{provider.toUpperCase()}</span></span>
        <span>TABS <span className="text-term-text ml-1 num">{tabs.length}</span></span>
        {layout !== "single" && (
          <span>PANEL <span className="text-term-amber ml-1">P{focusedIdx + 1}</span>
            <span className="text-term-muted ml-1">
              / {layout === "quad" ? "4" : "2"}
            </span>
          </span>
        )}
        <button onClick={() => openTab("ALRT")}
          className="flex items-center gap-1 hover:text-term-amber transition-colors relative">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span>ALERTS</span>
          {unreadCount > 0 && (
            <span className="w-3.5 h-3.5 bg-term-red text-white text-[8px] flex items-center justify-center rounded-full leading-none font-bold shadow-[0_0_4px_rgba(255,59,59,0.5)]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
      <div className="flex items-center gap-5 num">
        <span>{now.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" })}</span>
        <span className="text-term-amber">{now.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
