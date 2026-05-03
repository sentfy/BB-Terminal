import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ── Per-tile layout entry ────────────────────────── */

export interface ModuleLayout {
  id: string;
  w: number; // grid column span 1-3
  h: number; // grid row span 1-3
}

/** Sensible default sizes for each module type */
const DEFAULT_SIZES: Record<string, { w: number; h: number }> = {
  "us-markets":    { w: 2, h: 1 },
  "yield-curve":   { w: 1, h: 1 },
  "fx-crypto":     { w: 1, h: 1 },
  "gainers":       { w: 1, h: 1 },
  "losers":        { w: 1, h: 1 },
  "headlines":     { w: 1, h: 2 },
  "sector-map":    { w: 1, h: 2 },
  "world-indices": { w: 1, h: 1 },
  "commodities":   { w: 1, h: 1 },
  "watchlist":     { w: 1, h: 1 },
  "portfolio":     { w: 1, h: 1 },
  "earnings":      { w: 1, h: 1 },
};

export const DEFAULT_MODULES: ModuleLayout[] = [
  { id: "us-markets",  w: 2, h: 1 },
  { id: "yield-curve", w: 1, h: 1 },
  { id: "fx-crypto",   w: 1, h: 1 },
  { id: "gainers",     w: 1, h: 1 },
  { id: "losers",      w: 1, h: 1 },
  { id: "headlines",   w: 1, h: 2 },
];

/* ── Store ────────────────────────────────────────── */

interface CCLayoutState {
  modules: ModuleLayout[];
  editing: boolean;
  setModules: (modules: ModuleLayout[]) => void;
  addModule: (id: string) => void;
  removeModule: (id: string) => void;
  moveModule: (fromIdx: number, direction: "up" | "down") => void;
  resizeModule: (id: string, w: number, h: number) => void;
  resetToDefault: () => void;
  setEditing: (v: boolean) => void;
}

export const useCCLayout = create<CCLayoutState>()(
  persist(
    (set, get) => ({
      modules: [...DEFAULT_MODULES],
      editing: false,

      setModules: (modules) => set({ modules }),

      addModule: (id) => {
        const { modules } = get();
        if (modules.some((m) => m.id === id)) return;
        const size = DEFAULT_SIZES[id] ?? { w: 1, h: 1 };
        set({ modules: [...modules, { id, ...size }] });
      },

      removeModule: (id) =>
        set({ modules: get().modules.filter((m) => m.id !== id) }),

      moveModule: (fromIdx, direction) => {
        const { modules } = get();
        const toIdx = direction === "up" ? fromIdx - 1 : fromIdx + 1;
        if (toIdx < 0 || toIdx >= modules.length) return;
        const next = [...modules];
        [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
        set({ modules: next });
      },

      resizeModule: (id, w, h) =>
        set({
          modules: get().modules.map((m) =>
            m.id === id
              ? { ...m, w: Math.max(1, Math.min(3, w)), h: Math.max(1, Math.min(3, h)) }
              : m,
          ),
        }),

      resetToDefault: () => set({ modules: [...DEFAULT_MODULES] }),
      setEditing: (v) => set({ editing: v }),
    }),
    {
      name: "sentfy-cc-layout",
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        if (version === 0) {
          const state = persisted as { modules?: unknown };
          const raw = state?.modules;
          if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
            return {
              ...state,
              modules: (raw as string[]).map((id) => ({
                id,
                ...(DEFAULT_SIZES[id] ?? { w: 1, h: 1 }),
              })),
            };
          }
        }
        return persisted as CCLayoutState;
      },
      partialize: (s) => ({ modules: s.modules }),
    },
  ),
);
