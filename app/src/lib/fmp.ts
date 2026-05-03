// Direct FMP API calls — for endpoints not routed through OpenBB
// Pattern mirrors app/src/lib/eia.ts

import { useSettings } from "@/store/settingsStore";

const FMP_BASE = "https://financialmodelingprep.com";

export class FmpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function fmpKey(): string {
  const key = useSettings.getState().apiKeys.fmp;
  if (!key) throw new FmpError(401, "FMP API key required. Go to KEYS to add one.");
  return key;
}

export function hasFmpKey(): boolean {
  return !!useSettings.getState().apiKeys.fmp;
}

async function fmpGet<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const key = fmpKey();
  const qs = new URLSearchParams({ apikey: key });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }
  const res = await fetch(`${FMP_BASE}${path}?${qs}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new FmpError(res.status, `FMP ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// ── IPO Calendar ──────────────────────────────────────────────────────

export interface IpoEvent {
  date: string;
  company: string;
  symbol: string;
  exchange: string;
  actions: string;
  shares: number | null;
  priceRange: string;
  marketCap: number | null;
}

export const fetchIpoCalendar = (from?: string, to?: string): Promise<IpoEvent[]> =>
  fmpGet<any[]>("/stable/ipos-calendar", { from, to }).then((raw) =>
    (raw ?? []).map((r) => ({
      date: r.date ?? "",
      company: r.company ?? "",
      symbol: r.symbol ?? "",
      exchange: r.exchange ?? "",
      actions: r.actions ?? "expected",
      shares: r.numberOfShares ?? null,
      priceRange: r.priceRange ?? "—",
      marketCap: r.marketCap ?? null,
    })),
  );

// ── Institutional & Mutual Fund Holders ───────────────────────────────

export interface InstitutionalHolder {
  holder: string;
  shares: number;
  dateReported: string;
  change: number;
  changePercent: number | null;
}

export interface MutualFundHolder {
  holder: string;
  shares: number;
  dateReported: string;
  change: number;
  changePercent: number | null;
  weightPercent: number | null;
}

export const fetchInstitutionalHolders = (symbol: string): Promise<InstitutionalHolder[]> =>
  fmpGet<any[]>("/stable/institutional-ownership/symbol-positions-summary", { symbol }).then((raw) =>
    (raw ?? []).map((r) => ({
      holder: r.investorName ?? r.holder ?? "",
      shares: r.sharesNumber ?? r.shares ?? 0,
      dateReported: r.filingDate ?? r.dateReported ?? "",
      change: r.changeInSharesNumber ?? r.change ?? 0,
      changePercent: r.changeInSharesNumberPercentage ?? r.changePercent ?? null,
    })),
  );

// Mutual fund holder endpoint is not available in FMP stable API
export const fetchMutualFundHolders = (_symbol: string): Promise<MutualFundHolder[]> =>
  Promise.resolve([]);

// ── Insider Trading ───────────────────────────────────────────────────

export interface InsiderTrade {
  symbol: string;
  filingDate: string;
  transactionDate: string;
  reportingName: string;
  typeOfOwner: string;
  transactionType: string;
  securitiesOwned: number;
  securitiesTransacted: number;
  price: number | null;
  link: string;
}

export const fetchInsiderTrading = (symbol: string, limit = 50): Promise<InsiderTrade[]> =>
  fmpGet<any[]>("/stable/insider-trading/search", { symbol, limit }).then((raw) =>
    (raw ?? []).map((r) => ({
      symbol: r.symbol ?? symbol,
      filingDate: r.filingDate ?? "",
      transactionDate: r.transactionDate ?? "",
      reportingName: r.reportingName ?? "",
      typeOfOwner: r.typeOfOwner ?? "",
      transactionType: r.transactionType ?? "",
      securitiesOwned: r.securitiesOwned ?? 0,
      securitiesTransacted: r.securitiesTransacted ?? 0,
      price: r.price ?? null,
      link: r.link ?? "",
    })),
  );

// ── Stock Screener ────────────────────────────────────────────────────

export interface ScreenerParams {
  marketCapMoreThan?: number;
  marketCapLowerThan?: number;
  priceMoreThan?: number;
  priceLowerThan?: number;
  volumeMoreThan?: number;
  dividendMoreThan?: number;
  sector?: string;
  exchange?: string;
  limit?: number;
}

export interface ScreenerResult {
  symbol: string;
  companyName: string;
  marketCap: number;
  sector: string;
  industry: string;
  price: number;
  lastAnnualDividend: number;
  volume: number;
  exchangeShortName: string;
  beta: number | null;
  country: string;
}

export const fetchScreener = (params: ScreenerParams): Promise<ScreenerResult[]> =>
  fmpGet<any[]>("/stable/company-screener", {
    marketCapMoreThan: params.marketCapMoreThan,
    marketCapLowerThan: params.marketCapLowerThan,
    priceMoreThan: params.priceMoreThan,
    priceLowerThan: params.priceLowerThan,
    volumeMoreThan: params.volumeMoreThan,
    dividendMoreThan: params.dividendMoreThan,
    sector: params.sector,
    exchange: params.exchange,
    limit: params.limit ?? 100,
  }).then((raw) =>
    (raw ?? []).map((r) => ({
      symbol: r.symbol ?? "",
      companyName: r.companyName ?? "",
      marketCap: r.marketCap ?? 0,
      sector: r.sector ?? "",
      industry: r.industry ?? "",
      price: r.price ?? 0,
      lastAnnualDividend: r.lastAnnualDividend ?? 0,
      volume: r.volume ?? 0,
      exchangeShortName: r.exchangeShortName ?? "",
      beta: r.beta ?? null,
      country: r.country ?? "",
    })),
  );

// ── Economic Calendar ─────────────────────────────────────────────────

export interface EconEvent {
  event: string;
  date: string;
  country: string;
  actual: number | null;
  previous: number | null;
  consensus: number | null;
  impact: string;
  change: number | null;
  changePercentage: number | null;
  unit: string;
}

export const fetchEconomicCalendar = (from?: string, to?: string): Promise<EconEvent[]> =>
  fmpGet<any[]>("/stable/economic-calendar", { from, to }).then((raw) =>
    (raw ?? []).map((r) => ({
      event: r.event ?? "",
      date: r.date ?? "",
      country: r.country ?? "",
      actual: r.actual ?? null,
      previous: r.previous ?? null,
      consensus: r.estimate ?? r.consensus ?? null,
      impact: r.impact ?? "Low",
      change: r.change ?? null,
      changePercentage: r.changePercentage ?? null,
      unit: r.unit ?? "",
    })),
  );

// ── Shares Float (for Short Interest) ─────────────────────────────────

export interface SharesFloat {
  symbol: string;
  freeFloat: number | null;
  floatShares: number | null;
  outstandingShares: number | null;
  date: string;
}

export const fetchSharesFloat = (symbol: string): Promise<SharesFloat | null> =>
  fmpGet<any>("/stable/shares-float", { symbol }).then((raw) => {
    // Stable endpoint may return single object or array
    const r = Array.isArray(raw) ? raw[0] : raw;
    if (!r) return null;
    return {
      symbol: r.symbol ?? symbol,
      freeFloat: r.freeFloat ?? null,
      floatShares: r.floatShares ?? null,
      outstandingShares: r.outstandingShares ?? null,
      date: r.date ?? "",
    };
  });

// ── Political / Congressional Trading ────────────────────────────────

export interface PoliticalTrade {
  date: string;
  name: string;
  chamber: "Senate" | "House";
  symbol: string;
  asset: string;
  type: string;
  amount: string;
  filingDate: string;
  link: string;
}

export const fetchSenateTrades = (symbol: string): Promise<PoliticalTrade[]> =>
  fmpGet<any[]>("/stable/senate-trades", { symbol }).then((raw) =>
    (raw ?? []).map((r) => ({
      date: r.transactionDate ?? "",
      name: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim(),
      chamber: "Senate" as const,
      symbol: r.symbol ?? symbol,
      asset: r.assetDescription ?? "",
      type: r.transactionType ?? r.type ?? "",
      amount: r.amount ?? "",
      filingDate: r.disclosureDate ?? "",
      link: r.link ?? "",
    })),
  );

export const fetchHouseTrades = (symbol: string): Promise<PoliticalTrade[]> =>
  fmpGet<any[]>("/stable/house-trades", { symbol }).then((raw) =>
    (raw ?? []).map((r) => ({
      date: r.transactionDate ?? "",
      name: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || (r.representative ?? ""),
      chamber: "House" as const,
      symbol: r.symbol ?? symbol,
      asset: r.assetDescription ?? "",
      type: r.transactionType ?? r.type ?? "",
      amount: r.amount ?? "",
      filingDate: r.disclosureDate ?? "",
      link: r.link ?? "",
    })),
  );

// Senate Stock Watcher — free, no API key required
const SSW_URL =
  "https://raw.githubusercontent.com/timothycarambat/senate-stock-watcher-data/master/aggregate/all_transactions.json";

export const fetchSenateStockWatcher = async (symbol: string): Promise<PoliticalTrade[]> => {
  const res = await fetch(SSW_URL);
  if (!res.ok) return [];
  const raw: any[] = await res.json().catch(() => []);
  const trades: PoliticalTrade[] = [];
  const sym = symbol.toUpperCase();
  for (const senator of raw) {
    for (const tx of senator.transactions ?? []) {
      if ((tx.ticker ?? "").toUpperCase() === sym) {
        trades.push({
          date: tx.transaction_date ?? "",
          name: `${senator.first_name ?? ""} ${senator.last_name ?? ""}`.trim(),
          chamber: "Senate",
          symbol: sym,
          asset: tx.asset_description ?? "",
          type: tx.type ?? "",
          amount: tx.amount ?? "",
          filingDate: senator.date_recieved ?? "",
          link: senator.ptr_link ?? "",
        });
      }
    }
  }
  return trades;
};

// ── Social Sentiment ──────────────────────────────────────────────────

export interface SocialSentiment {
  date: string;
  symbol: string;
  stocktwitsPosts: number;
  twitterPosts: number;
  stocktwitsComments: number;
  twitterComments: number;
  stocktwitsLikes: number;
  twitterLikes: number;
  stocktwitsImpressions: number;
  twitterImpressions: number;
  stocktwitsSentiment: number;
  twitterSentiment: number;
}

// Social sentiment endpoint is not available in FMP stable API
export const fetchSocialSentiment = (_symbol: string, _limit = 30): Promise<SocialSentiment[]> =>
  Promise.resolve([]);
