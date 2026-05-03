import { useState } from "react";
import { useAlerts, describeCondition, type AlertCondition } from "@/store/alertStore";
import { useWorkspace } from "@/store/workspaceStore";
import { cn } from "@/lib/cn";

type ConditionType = AlertCondition["type"];

const CONDITION_TYPES: { type: ConditionType; label: string; needsValue: boolean; valueLabel: string }[] = [
  { type: "price_above",      label: "Price Above",       needsValue: true,  valueLabel: "Price" },
  { type: "price_below",      label: "Price Below",       needsValue: true,  valueLabel: "Price" },
  { type: "pct_change_above", label: "Day Change Above",  needsValue: true,  valueLabel: "%" },
  { type: "pct_change_below", label: "Day Change Below",  needsValue: true,  valueLabel: "%" },
  { type: "volume_spike",     label: "Volume Spike",      needsValue: true,  valueLabel: "x Avg" },
  { type: "52w_high",         label: "52-Week High",      needsValue: false, valueLabel: "" },
  { type: "52w_low",          label: "52-Week Low",       needsValue: false, valueLabel: "" },
];

export function ALRT() {
  const { rules, notifications, addRule, removeRule, toggleRule, markRead, markAllRead, clearNotifications } = useAlerts();
  const openTab = useWorkspace((s) => s.openTab);

  const [sym, setSym] = useState("");
  const [condType, setCondType] = useState<ConditionType>("price_above");
  const [value, setValue] = useState("");

  const condDef = CONDITION_TYPES.find((c) => c.type === condType)!;

  const handleAdd = () => {
    const s = sym.trim().toUpperCase();
    if (!s) return;

    let condition: AlertCondition;
    const v = parseFloat(value);
    switch (condType) {
      case "price_above": condition = { type: "price_above", value: v }; break;
      case "price_below": condition = { type: "price_below", value: v }; break;
      case "pct_change_above": condition = { type: "pct_change_above", value: v }; break;
      case "pct_change_below": condition = { type: "pct_change_below", value: v }; break;
      case "volume_spike": condition = { type: "volume_spike", multiplier: v || 2 }; break;
      case "52w_high": condition = { type: "52w_high" }; break;
      case "52w_low": condition = { type: "52w_low" }; break;
      default: return;
    }

    if (condDef.needsValue && (isNaN(v) || v <= 0)) return;

    addRule({ symbol: s, condition, enabled: true });
    setSym(""); setValue("");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col h-full">
      {/* Create alert form */}
      <div className="flex items-center gap-2 px-3 h-9 border-b border-term-border bg-term-panel2">
        <span className="text-[10px] uppercase tracking-wider text-term-muted">NEW ALERT</span>
        <input value={sym} onChange={(e) => setSym(e.target.value.toUpperCase())}
          placeholder="SYMBOL"
          className="bg-transparent border border-term-border text-term-amber px-2 py-0.5 text-[11px] w-20 focus:border-term-amber outline-none num" />
        <select value={condType} onChange={(e) => setCondType(e.target.value as ConditionType)}
          className="bg-term-panel border border-term-border text-term-text px-1 py-0.5 text-[10px]">
          {CONDITION_TYPES.map((c) => (
            <option key={c.type} value={c.type}>{c.label}</option>
          ))}
        </select>
        {condDef.needsValue && (
          <input value={value} onChange={(e) => setValue(e.target.value)}
            placeholder={condDef.valueLabel} type="number"
            className="bg-transparent border border-term-border text-term-text px-2 py-0.5 text-[11px] w-20 focus:border-term-amber outline-none num" />
        )}
        <button onClick={handleAdd}
          className="text-[10px] px-2 py-0.5 border border-term-amber text-term-amber hover:bg-term-amberSubtle uppercase tracking-wider">
          + ADD
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Active rules */}
        <div className="flex-1 flex flex-col border-r border-term-border min-h-0">
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-term-muted border-b border-term-borderSoft bg-term-panel2">
            ACTIVE RULES ({rules.length})
          </div>
          <div className="flex-1 overflow-auto scroll-thin">
            {rules.length === 0 ? (
              <div className="p-3 text-[11px] text-term-muted">No alert rules configured</div>
            ) : (
              <table className="w-full grid-data text-[12px]">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Condition</th>
                    <th className="text-center">Active</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.id}>
                      <td className="num text-term-amber font-semibold cursor-pointer"
                        onClick={() => openTab("INTEL", r.symbol)}>
                        {r.symbol}
                      </td>
                      <td className="text-term-text">{describeCondition(r.condition)}</td>
                      <td className="text-center">
                        <button onClick={() => toggleRule(r.id)}
                          className={cn("w-3 h-3 rounded-full inline-block",
                            r.enabled ? "bg-term-green shadow-[0_0_4px_rgba(34,238,34,0.4)]" : "bg-term-muted")}>
                        </button>
                      </td>
                      <td className="text-center">
                        <button onClick={() => removeRule(r.id)}
                          className="text-term-muted hover:text-term-red text-[10px]">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Notification history */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-term-muted border-b border-term-borderSoft bg-term-panel2 flex items-center justify-between">
            <span>NOTIFICATIONS {unreadCount > 0 && <span className="text-term-red">({unreadCount} new)</span>}</span>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-term-amber hover:text-term-amberBright">MARK READ</button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearNotifications} className="text-term-muted hover:text-term-red">CLEAR</button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-auto scroll-thin">
            {notifications.length === 0 ? (
              <div className="p-3 text-[11px] text-term-muted">No notifications yet</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id}
                  className={cn(
                    "px-2 py-1.5 border-b border-term-borderSoft text-[11px] cursor-pointer hover:bg-term-amberSubtle",
                    !n.read && "bg-term-panel2"
                  )}
                  onClick={() => { markRead(n.id); openTab("INTEL", n.symbol); }}>
                  <div className="flex items-center gap-2">
                    {!n.read && <span className="w-1.5 h-1.5 bg-term-amber rounded-full shrink-0" />}
                    <span className="num text-term-amber font-semibold">{n.symbol}</span>
                    <span className="text-term-muted text-[9px] ml-auto num">
                      {new Date(n.triggeredAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-term-text mt-0.5">{n.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
