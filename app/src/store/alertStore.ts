import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AlertCondition =
  | { type: "price_above"; value: number }
  | { type: "price_below"; value: number }
  | { type: "pct_change_above"; value: number }
  | { type: "pct_change_below"; value: number }
  | { type: "volume_spike"; multiplier: number }
  | { type: "52w_high" }
  | { type: "52w_low" };

export interface AlertRule {
  id: string;
  symbol: string;
  condition: AlertCondition;
  enabled: boolean;
  createdAt: number;
  lastTriggeredAt?: number;
}

export interface AlertNotification {
  id: string;
  ruleId: string;
  symbol: string;
  message: string;
  triggeredAt: number;
  read: boolean;
}

interface AlertState {
  rules: AlertRule[];
  notifications: AlertNotification[];
  addRule: (rule: Omit<AlertRule, "id" | "createdAt">) => void;
  removeRule: (id: string) => void;
  toggleRule: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  pushNotification: (n: Omit<AlertNotification, "id">) => void;
  setLastTriggered: (ruleId: string, time: number) => void;
}

let _counter = 0;
function uid() {
  return `${Date.now()}-${++_counter}`;
}

export const useAlerts = create<AlertState>()(
  persist(
    (set, get) => ({
      rules: [],
      notifications: [],
      addRule: (rule) =>
        set({
          rules: [...get().rules, { ...rule, id: uid(), createdAt: Date.now() }],
        }),
      removeRule: (id) =>
        set({ rules: get().rules.filter((r) => r.id !== id) }),
      toggleRule: (id) =>
        set({
          rules: get().rules.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled } : r
          ),
        }),
      markRead: (id) =>
        set({
          notifications: get().notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }),
      markAllRead: () =>
        set({
          notifications: get().notifications.map((n) => ({ ...n, read: true })),
        }),
      clearNotifications: () => set({ notifications: [] }),
      pushNotification: (n) =>
        set({
          notifications: [{ ...n, id: uid() }, ...get().notifications].slice(0, 100),
        }),
      setLastTriggered: (ruleId, time) =>
        set({
          rules: get().rules.map((r) =>
            r.id === ruleId ? { ...r, lastTriggeredAt: time } : r
          ),
        }),
    }),
    { name: "sentfy-alerts" }
  )
);

export function describeCondition(c: AlertCondition): string {
  switch (c.type) {
    case "price_above": return `Price > ${c.value}`;
    case "price_below": return `Price < ${c.value}`;
    case "pct_change_above": return `Day Change > +${c.value}%`;
    case "pct_change_below": return `Day Change < -${c.value}%`;
    case "volume_spike": return `Volume > ${c.multiplier}x avg`;
    case "52w_high": return "At 52-Week High";
    case "52w_low": return "At 52-Week Low";
  }
}
