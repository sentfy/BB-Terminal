export type FunctionCode =
  | "CC" | "INTEL" | "HELP"
  | "DES" | "GP" | "QR" | "HP"
  | "FA" | "KEY" | "DVD" | "EE" | "NI"
  | "WEI" | "MOV" | "OMON"
  | "CURV" | "FXC" | "CRYPTO"
  | "WL" | "PORT" | "CMDTY" | "SMAP" | "ETF" | "COMP"
  | "ECAL" | "HCAL" | "ALRT"
  | "WX" | "KEYS"
  | "IPO" | "OWN" | "INSD" | "SCR" | "ECON" | "SI" | "SENT";

export interface FunctionDef {
  code: FunctionCode;
  name: string;
  needsSymbol: boolean;
  group: "Security" | "Markets" | "Macro" | "System";
  summary: string;
}

export const FUNCTIONS: FunctionDef[] = [
  { code: "CC",   name: "Command Center",        needsSymbol: false, group: "System", summary: "Morning briefing · markets, curve, FX, movers, news" },
  { code: "HELP", name: "Function Directory",    needsSymbol: false, group: "System", summary: "List of all terminal functions" },
  { code: "ALRT", name: "Alert Manager",         needsSymbol: false, group: "System", summary: "Price, volume, and 52-week alerts with notification history" },
  { code: "KEYS", name: "API Keys & Providers",  needsSymbol: false, group: "System", summary: "Manage data providers, API keys, and connection status" },

  { code: "INTEL", name: "Stock Intelligence",   needsSymbol: true,  group: "Security", summary: "Full scorecard — signals across technical, value, fundamentals, analysts" },
  { code: "DES",  name: "Security Description", needsSymbol: true,  group: "Security", summary: "Company profile, sector, HQ, employees" },
  { code: "GP",   name: "Graph / Chart",         needsSymbol: true,  group: "Security", summary: "Candlestick chart + volume + technical indicators" },
  { code: "QR",   name: "Quote Recap",           needsSymbol: true,  group: "Security", summary: "Live quote: last, bid/ask, volume, day range" },
  { code: "HP",   name: "Historical Prices",     needsSymbol: true,  group: "Security", summary: "OHLCV table" },
  { code: "FA",   name: "Financial Analysis",    needsSymbol: true,  group: "Security", summary: "Income statement — last 5 fiscal years" },
  { code: "KEY",  name: "Key Ratios & Metrics",  needsSymbol: true,  group: "Security", summary: "PE, EV/EBITDA, margins, ROE, etc." },
  { code: "DVD",  name: "Dividend History",      needsSymbol: true,  group: "Security", summary: "All historical dividends" },
  { code: "EE",   name: "Analyst Estimates",     needsSymbol: true,  group: "Security", summary: "Target prices, recommendation, analyst count" },
  { code: "NI",   name: "News — Company",        needsSymbol: true,  group: "Security", summary: "Latest headlines for the symbol" },
  { code: "OMON", name: "Options Monitor",       needsSymbol: true,  group: "Security", summary: "Options chain with bid/ask, IV, OI, volume" },
  { code: "COMP", name: "Comparative Analysis",  needsSymbol: false, group: "Security", summary: "Compare 2-4 symbols with charts and metrics" },
  { code: "OWN",  name: "Ownership Analysis",   needsSymbol: true,  group: "Security", summary: "Institutional & mutual fund holders, ownership concentration" },
  { code: "INSD", name: "Insider Trading",       needsSymbol: true,  group: "Security", summary: "Insider & political trades — buy/sell activity and net position changes" },
  { code: "SENT", name: "Social Sentiment",      needsSymbol: true,  group: "Security", summary: "Social media mention counts, sentiment scoring, and trending data" },

  { code: "WL",    name: "Watchlist",            needsSymbol: false, group: "Markets", summary: "Tracked symbols with live quotes and sparklines" },
  { code: "PORT",  name: "Portfolio",            needsSymbol: false, group: "Markets", summary: "Holdings with cost basis, P&L, and allocation" },
  { code: "WEI",  name: "World Equity Indices",  needsSymbol: false, group: "Markets", summary: "Major global indices — level & daily change" },
  { code: "MOV",  name: "Market Movers",         needsSymbol: false, group: "Markets", summary: "US gainers, losers, most active" },
  { code: "SMAP", name: "Sector Heatmap",        needsSymbol: false, group: "Markets", summary: "S&P 500 sector treemap by daily performance" },
  { code: "ETF",  name: "ETF Screener",          needsSymbol: false, group: "Markets", summary: "Search and filter ETFs by category and metrics" },
  { code: "CMDTY", name: "Commodities",          needsSymbol: false, group: "Markets", summary: "Futures dashboard — energy, metals, agriculture, softs" },
  { code: "CRYPTO", name: "Crypto Monitor",      needsSymbol: false, group: "Markets", summary: "Top crypto prices + sparkline" },
  { code: "FXC",  name: "FX Cross Rates",        needsSymbol: false, group: "Markets", summary: "Major FX pairs matrix" },
  { code: "ECAL", name: "Earnings Calendar",     needsSymbol: false, group: "Markets", summary: "Upcoming and past earnings dates with estimates" },
  { code: "HCAL", name: "Holiday Calendar",      needsSymbol: false, group: "Markets", summary: "ICE + CME + NYSE trading holidays 2025-2026" },
  { code: "IPO",  name: "IPO Calendar",          needsSymbol: false, group: "Markets", summary: "Upcoming and recent IPOs with pricing, exchange, and share data" },
  { code: "SCR",  name: "Stock Screener",         needsSymbol: false, group: "Markets", summary: "Filter stocks by market cap, P/E, sector, dividend yield, and performance" },
  { code: "SI",   name: "Short Interest",         needsSymbol: false, group: "Markets", summary: "Most shorted stocks — short %, float short, days to cover" },

  { code: "CURV", name: "US Yield Curve",        needsSymbol: false, group: "Macro", summary: "Treasury par yield curve" },
  { code: "WX",   name: "Weather Intelligence",  needsSymbol: false, group: "Macro", summary: "Multi-model forecasts, US energy infrastructure map, EIA metrics, radar" },
  { code: "ECON", name: "Economic Calendar",      needsSymbol: false, group: "Macro", summary: "Macro events — CPI, GDP, Fed meetings, jobs reports with impact levels" },
];

export const FN_BY_CODE: Record<string, FunctionDef> = Object.fromEntries(FUNCTIONS.map((f) => [f.code, f]));

export interface ParsedCommand {
  symbol?: string;
  code: FunctionCode;
}

/** Parse a free-form command like "AAPL DES", "DES", "AAPL", "TOP". */
export function parseCommand(raw: string, activeSymbol: string | null): ParsedCommand | null {
  const parts = raw.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;

  const isFn = (s: string): s is FunctionCode => s in FN_BY_CODE;

  if (parts.length === 1) {
    const p = parts[0];
    if (isFn(p)) {
      const fn = FN_BY_CODE[p];
      if (fn.needsSymbol) {
        if (!activeSymbol) return null;
        return { symbol: activeSymbol, code: p };
      }
      return { code: p };
    }
    // just a symbol — default to INTEL (the scorecard view)
    return { symbol: p, code: "INTEL" };
  }

  // Two or more tokens: SYMBOL FUNC
  const [sym, fn] = parts;
  if (isFn(fn)) return { symbol: sym, code: fn };
  // FUNC SYMBOL (also allowed)
  if (isFn(sym)) {
    const f = FN_BY_CODE[sym];
    return f.needsSymbol ? { symbol: fn, code: sym } : { code: sym };
  }
  return null;
}
