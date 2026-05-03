import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WatchlistItem {
  symbol: string;
  addedAt: number;
}

export interface PortfolioHolding {
  symbol: string;
  shares: number;
  costBasis: number;
  addedAt: number;
}

interface PortfolioState {
  watchlist: WatchlistItem[];
  holdings: PortfolioHolding[];
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  addHolding: (h: Omit<PortfolioHolding, "addedAt">) => void;
  updateHolding: (symbol: string, shares: number, costBasis: number) => void;
  removeHolding: (symbol: string) => void;
}

export const usePortfolio = create<PortfolioState>()(
  persist(
    (set, get) => ({
      watchlist: [],
      holdings: [],
      addToWatchlist: (symbol) => {
        const s = symbol.toUpperCase();
        if (get().watchlist.some((w) => w.symbol === s)) return;
        set({ watchlist: [...get().watchlist, { symbol: s, addedAt: Date.now() }] });
      },
      removeFromWatchlist: (symbol) =>
        set({ watchlist: get().watchlist.filter((w) => w.symbol !== symbol) }),
      addHolding: (h) => {
        const s = h.symbol.toUpperCase();
        const existing = get().holdings.find((p) => p.symbol === s);
        if (existing) {
          const totalShares = existing.shares + h.shares;
          const avgCost =
            (existing.costBasis * existing.shares + h.costBasis * h.shares) / totalShares;
          set({
            holdings: get().holdings.map((p) =>
              p.symbol === s ? { ...p, shares: totalShares, costBasis: avgCost } : p
            ),
          });
        } else {
          set({
            holdings: [
              ...get().holdings,
              { symbol: s, shares: h.shares, costBasis: h.costBasis, addedAt: Date.now() },
            ],
          });
        }
      },
      updateHolding: (symbol, shares, costBasis) =>
        set({
          holdings: get().holdings.map((p) =>
            p.symbol === symbol ? { ...p, shares, costBasis } : p
          ),
        }),
      removeHolding: (symbol) =>
        set({ holdings: get().holdings.filter((p) => p.symbol !== symbol) }),
    }),
    { name: "sentfy-portfolio" }
  )
);
