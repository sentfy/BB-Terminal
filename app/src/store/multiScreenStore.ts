import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LayoutMode = "single" | "2col" | "2row" | "quad";

export interface PanelState {
  tabId: string;
}

interface MultiScreenState {
  layout: LayoutMode;
  panels: PanelState[];
  focusedIdx: number;
  setLayout: (layout: LayoutMode) => void;
  setFocusedIdx: (idx: number) => void;
  setPanelTab: (idx: number, tabId: string) => void;
}

const panelCount = (layout: LayoutMode) =>
  layout === "single" ? 1 : layout === "quad" ? 4 : 2;

export const useMultiScreen = create<MultiScreenState>()(
  persist(
    (set, get) => ({
      layout: "single" as LayoutMode,
      panels: [{ tabId: "CC:_" }],
      focusedIdx: 0,

      setLayout: (layout) => {
        const { panels, focusedIdx } = get();
        const count = panelCount(layout);
        const focusedTab = panels[focusedIdx]?.tabId ?? "CC:_";

        let next: PanelState[];
        if (count <= panels.length) {
          next = panels.slice(0, count);
        } else {
          next = [...panels];
          while (next.length < count) {
            next.push({ tabId: focusedTab });
          }
        }

        set({
          layout,
          panels: next,
          focusedIdx: Math.min(focusedIdx, count - 1),
        });
      },

      setFocusedIdx: (idx) => {
        if (idx >= 0 && idx < panelCount(get().layout)) {
          set({ focusedIdx: idx });
        }
      },

      setPanelTab: (idx, tabId) => {
        const { panels } = get();
        if (idx >= 0 && idx < panels.length && panels[idx].tabId !== tabId) {
          const next = [...panels];
          next[idx] = { tabId };
          set({ panels: next });
        }
      },
    }),
    {
      name: "sentfy-multiscreen",
      partialize: (s) => ({
        layout: s.layout,
        panels: s.panels,
        focusedIdx: s.focusedIdx,
      }),
    }
  )
);
