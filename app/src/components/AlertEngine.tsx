import { useEffect } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetchQuote, type Quote } from "@/lib/api";
import { useAlerts, type AlertRule } from "@/store/alertStore";

function evaluateRule(rule: AlertRule, q: Quote): string | null {
  const price = q.last_price;
  const prevClose = q.prev_close;
  const volume = q.volume;
  const avgVolume = q.volume_average;
  const yearHigh = q.year_high;
  const yearLow = q.year_low;

  switch (rule.condition.type) {
    case "price_above":
      if (price != null && price > rule.condition.value)
        return `${rule.symbol} price ${price.toFixed(2)} is above ${rule.condition.value}`;
      break;
    case "price_below":
      if (price != null && price < rule.condition.value)
        return `${rule.symbol} price ${price.toFixed(2)} is below ${rule.condition.value}`;
      break;
    case "pct_change_above":
      if (price != null && prevClose != null) {
        const pct = ((price - prevClose) / prevClose) * 100;
        if (pct > rule.condition.value)
          return `${rule.symbol} up ${pct.toFixed(2)}% today (threshold: +${rule.condition.value}%)`;
      }
      break;
    case "pct_change_below":
      if (price != null && prevClose != null) {
        const pct = ((price - prevClose) / prevClose) * 100;
        if (pct < -rule.condition.value)
          return `${rule.symbol} down ${pct.toFixed(2)}% today (threshold: -${rule.condition.value}%)`;
      }
      break;
    case "volume_spike":
      if (volume != null && avgVolume != null && avgVolume > 0) {
        if (volume > avgVolume * rule.condition.multiplier)
          return `${rule.symbol} volume spike: ${(volume / avgVolume).toFixed(1)}x average`;
      }
      break;
    case "52w_high":
      if (price != null && yearHigh != null && price >= yearHigh * 0.99)
        return `${rule.symbol} at 52-week high: ${price.toFixed(2)}`;
      break;
    case "52w_low":
      if (price != null && yearLow != null && price <= yearLow * 1.01)
        return `${rule.symbol} at 52-week low: ${price.toFixed(2)}`;
      break;
  }
  return null;
}

export function AlertEngine() {
  const { rules, pushNotification, setLastTriggered } = useAlerts();
  const enabledRules = rules.filter((r) => r.enabled);
  const uniqueSymbols = [...new Set(enabledRules.map((r) => r.symbol))];

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Poll quotes for all alerted symbols
  const quoteQueries = useQueries({
    queries: uniqueSymbols.map((s) => ({
      queryKey: ["alert-quote", s],
      queryFn: () => fetchQuote(s),
      refetchInterval: 10_000,
      enabled: enabledRules.length > 0,
    })),
  });

  // Evaluate rules on data changes
  useEffect(() => {
    const now = Date.now();
    const quoteMap = new Map<string, Quote>();
    uniqueSymbols.forEach((sym, i) => {
      const q = quoteQueries[i]?.data;
      if (q) quoteMap.set(sym, q as Quote);
    });

    for (const rule of enabledRules) {
      const q = quoteMap.get(rule.symbol);
      if (!q) continue;

      // Debounce: don't re-trigger within 60 seconds
      if (rule.lastTriggeredAt && now - rule.lastTriggeredAt < 60_000) continue;

      const message = evaluateRule(rule, q);
      if (message) {
        pushNotification({
          ruleId: rule.id,
          symbol: rule.symbol,
          message,
          triggeredAt: now,
          read: false,
        });
        setLastTriggered(rule.id, now);

        // Browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`Sentfy-Terminal Alert: ${rule.symbol}`, { body: message });
        }
      }
    }
  }, [quoteQueries.map((q) => q.dataUpdatedAt).join(",")]);

  return null; // Headless component
}
