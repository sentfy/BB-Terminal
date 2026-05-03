import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DataProvider =
  | "yfinance"
  | "fmp"
  | "polygon"
  | "intrinio"
  | "tiingo";

export interface ProviderInfo {
  id: DataProvider;
  name: string;
  requiresKey: boolean;
}

export const PROVIDERS: ProviderInfo[] = [
  { id: "yfinance", name: "Yahoo Finance", requiresKey: false },
  { id: "fmp",      name: "Financial Modeling Prep", requiresKey: true },
  { id: "polygon",  name: "Polygon.io", requiresKey: true },
  { id: "intrinio", name: "Intrinio", requiresKey: true },
  { id: "tiingo",   name: "Tiingo", requiresKey: true },
];

interface SettingsState {
  activeProvider: DataProvider;
  apiKeys: Partial<Record<DataProvider, string>>;
  eiaApiKey: string | null;
  setProvider: (p: DataProvider) => void;
  setApiKey: (provider: DataProvider, key: string) => void;
  removeApiKey: (provider: DataProvider) => void;
  setEiaApiKey: (key: string) => void;
  clearEiaApiKey: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      activeProvider: "yfinance",
      apiKeys: {},
      eiaApiKey: null,
      setProvider: (p) => set({ activeProvider: p }),
      setApiKey: (provider, key) =>
        set({ apiKeys: { ...get().apiKeys, [provider]: key } }),
      removeApiKey: (provider) => {
        const { [provider]: _, ...rest } = get().apiKeys;
        set({ apiKeys: rest });
      },
      setEiaApiKey: (key) => set({ eiaApiKey: key }),
      clearEiaApiKey: () => set({ eiaApiKey: null }),
    }),
    { name: "sentfy-settings" }
  )
);
