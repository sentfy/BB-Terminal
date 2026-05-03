import { useState } from "react";
import {
  useSettings,
  PROVIDERS,
  type DataProvider,
} from "@/store/settingsStore";
import { cn } from "@/lib/cn";

// ── All APIs the terminal can use ───────────────────────────────────────

interface ApiEntry {
  id: string;
  name: string;
  description: string;
  free: boolean;
  signupUrl: string;
  /** "provider" keys go through the OpenBB backend; "standalone" keys are used directly */
  kind: "provider" | "standalone";
  /** for provider keys, which DataProvider they map to */
  providerId?: DataProvider;
  /** for standalone keys, getter/setter wiring */
  storeGet?: () => string | null;
  storeSet?: (key: string) => void;
  storeClear?: () => void;
}

function buildApis(): ApiEntry[] {
  const s = useSettings.getState;
  return [
    // ── Financial data providers (routed through OpenBB) ──
    {
      id: "yfinance",
      name: "Yahoo Finance",
      description: "Free equity, index, FX, and crypto data. No API key needed — works out of the box.",
      free: true,
      signupUrl: "",
      kind: "provider",
      providerId: "yfinance",
    },
    {
      id: "fmp",
      name: "Financial Modeling Prep",
      description: "Fundamentals, financials, estimates, ETF data. Free tier available (250 req/day).",
      free: false,
      signupUrl: "https://financialmodelingprep.com/developer/docs/",
      kind: "provider",
      providerId: "fmp",
    },
    {
      id: "polygon",
      name: "Polygon.io",
      description: "Real-time and historical market data. Free tier available (5 req/min).",
      free: false,
      signupUrl: "https://polygon.io/pricing",
      kind: "provider",
      providerId: "polygon",
    },
    {
      id: "intrinio",
      name: "Intrinio",
      description: "Institutional-grade fundamentals, prices, options data.",
      free: false,
      signupUrl: "https://intrinio.com/pricing",
      kind: "provider",
      providerId: "intrinio",
    },
    {
      id: "tiingo",
      name: "Tiingo",
      description: "End-of-day and real-time prices, news, fundamentals. Free tier available.",
      free: false,
      signupUrl: "https://api.tiingo.com/",
      kind: "provider",
      providerId: "tiingo",
    },

    // ── Standalone APIs ──
    {
      id: "eia",
      name: "EIA (Energy Information Administration)",
      description: "US energy data — refinery utilization, petroleum stocks, natural gas storage, electricity generation. Used by WX INFRA tab.",
      free: true,
      signupUrl: "https://www.eia.gov/opendata/register.php",
      kind: "standalone",
      storeGet: () => s().eiaApiKey,
      storeSet: (k) => useSettings.getState().setEiaApiKey(k),
      storeClear: () => useSettings.getState().clearEiaApiKey(),
    },

    // ── Free / keyless APIs (informational) ──
    {
      id: "openmeteo",
      name: "Open-Meteo",
      description: "Weather forecasts from ECMWF, GFS, ICON, UKMO, GEM models. No API key required.",
      free: true,
      signupUrl: "https://open-meteo.com/",
      kind: "standalone",
    },
    {
      id: "rainviewer",
      name: "RainViewer",
      description: "Live radar and satellite imagery overlays for the weather map. No API key required.",
      free: true,
      signupUrl: "https://www.rainviewer.com/api.html",
      kind: "standalone",
    },
    {
      id: "openbb",
      name: "OpenBB Platform (Backend)",
      description: "Local backend that routes financial data requests to the selected provider. Must be running on the same host.",
      free: true,
      signupUrl: "https://openbb.co/",
      kind: "standalone",
    },
  ];
}

// ════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════

export function KEYS() {
  const {
    activeProvider, setProvider,
    apiKeys, setApiKey, removeApiKey,
    eiaApiKey,
  } = useSettings();

  const apis = buildApis();

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Active provider selector */}
      <div className="px-4 py-3 border-b border-term-border bg-term-panel2">
        <div className="sub-header mb-2">ACTIVE DATA PROVIDER</div>
        <div className="flex items-center gap-2 flex-wrap">
          {PROVIDERS.map((p) => {
            const isActive = activeProvider === p.id;
            const hasKey = !p.requiresKey || !!apiKeys[p.id];
            return (
              <button
                key={p.id}
                onClick={() => hasKey ? setProvider(p.id) : undefined}
                className={cn(
                  "px-3 py-1.5 border text-[11px] tracking-wider uppercase transition-colors",
                  isActive
                    ? "border-term-amber bg-term-amberSubtle text-term-amber font-bold"
                    : hasKey
                      ? "border-term-border text-term-text hover:border-term-amber hover:text-term-amber cursor-pointer"
                      : "border-term-border/50 text-term-muted/50 cursor-not-allowed",
                )}
              >
                {p.name}
                {isActive && <span className="ml-2 text-[9px]">ACTIVE</span>}
                {!hasKey && p.requiresKey && <span className="ml-2 text-[9px] text-term-red">NO KEY</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* API list */}
      <div className="flex-1 overflow-auto scroll-thin p-4">
        <div className="flex flex-col gap-3">
          {apis.map((api) => (
            <ApiCard
              key={api.id}
              api={api}
              activeProvider={activeProvider}
              apiKeys={apiKeys}
              onSetKey={setApiKey}
              onRemoveKey={removeApiKey}
              eiaApiKey={eiaApiKey}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// API CARD
// ════════════════════════════════════════════════════════════════════════

function ApiCard({ api, activeProvider, apiKeys, onSetKey, onRemoveKey, eiaApiKey }: {
  api: ApiEntry;
  activeProvider: DataProvider;
  apiKeys: Partial<Record<DataProvider, string>>;
  onSetKey: (p: DataProvider, k: string) => void;
  onRemoveKey: (p: DataProvider) => void;
  eiaApiKey: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  // Determine key status
  let hasKey = false;
  let maskedKey = "";
  let needsKey = false;

  if (api.kind === "provider" && api.providerId) {
    const prov = PROVIDERS.find((p) => p.id === api.providerId);
    needsKey = prov?.requiresKey ?? false;
    const raw = apiKeys[api.providerId];
    hasKey = !!raw;
    maskedKey = raw ? maskKey(raw) : "";
  } else if (api.id === "eia") {
    needsKey = true;
    hasKey = !!eiaApiKey;
    maskedKey = eiaApiKey ? maskKey(eiaApiKey) : "";
  }

  const isActive = api.kind === "provider" && api.providerId === activeProvider;
  const keyless = !needsKey;

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (api.kind === "provider" && api.providerId) {
      onSetKey(api.providerId, trimmed);
    } else if (api.storeSet) {
      api.storeSet(trimmed);
    }
    setDraft("");
    setEditing(false);
  };

  const handleRemove = () => {
    if (api.kind === "provider" && api.providerId) {
      onRemoveKey(api.providerId);
    } else if (api.storeClear) {
      api.storeClear();
    }
    setEditing(false);
  };

  return (
    <div className={cn(
      "border p-4",
      isActive ? "border-term-amber bg-term-amberSubtle/30" : "border-term-border bg-term-panel",
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-term-heading font-bold text-[13px]">{api.name}</span>
            {isActive && (
              <span className="text-[9px] px-1.5 py-0.5 bg-term-amber text-black font-bold tracking-wider">ACTIVE</span>
            )}
            {api.free && (
              <span className="text-[9px] px-1.5 py-0.5 border border-term-green text-term-green tracking-wider">FREE</span>
            )}
          </div>
          <p className="text-[11px] text-term-muted leading-relaxed">{api.description}</p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 shrink-0 mt-1">
          {keyless ? (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-term-green shadow-[0_0_6px_rgba(34,238,34,0.6)]" />
              <span className="text-[10px] text-term-green tracking-wider uppercase">NO KEY NEEDED</span>
            </span>
          ) : hasKey ? (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-term-green shadow-[0_0_6px_rgba(34,238,34,0.6)]" />
              <span className="text-[10px] text-term-green tracking-wider uppercase">CONNECTED</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-term-red shadow-[0_0_6px_rgba(255,59,59,0.6)]" />
              <span className="text-[10px] text-term-red tracking-wider uppercase">KEY REQUIRED</span>
            </span>
          )}
        </div>
      </div>

      {/* Key management row */}
      {needsKey && (
        <div className="mt-3 pt-3 border-t border-term-borderSoft">
          {!editing ? (
            <div className="flex items-center gap-3">
              {hasKey && (
                <span className="text-[11px] num text-term-muted flex-1">{maskedKey}</span>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditing(true); setDraft(""); }}
                  className="text-[10px] px-2 py-0.5 border border-term-border text-term-text hover:border-term-amber hover:text-term-amber uppercase tracking-wider"
                >
                  {hasKey ? "UPDATE KEY" : "ADD KEY"}
                </button>
                {hasKey && (
                  <button
                    onClick={handleRemove}
                    className="text-[10px] px-2 py-0.5 border border-term-border text-term-muted hover:border-term-red hover:text-term-red uppercase tracking-wider"
                  >
                    REMOVE
                  </button>
                )}
                {api.signupUrl && (
                  <a
                    href={api.signupUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-term-amber hover:text-term-amberBright uppercase tracking-wider"
                  >
                    GET KEY →
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
                placeholder="Paste your API key…"
                autoFocus
                className="flex-1 bg-term-bg border border-term-border px-2 py-1 text-[12px] text-term-text placeholder:text-term-muted focus:outline-none focus:border-term-amber num"
              />
              <button
                onClick={handleSave}
                disabled={!draft.trim()}
                className="text-[10px] px-3 py-1 bg-term-amber text-black font-bold uppercase tracking-wider disabled:opacity-40"
              >
                SAVE
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-[10px] px-2 py-1 border border-term-border text-term-muted hover:text-term-text uppercase tracking-wider"
              >
                CANCEL
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}
