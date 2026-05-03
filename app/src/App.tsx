import { useCallback, useEffect, useRef } from "react";
import { CommandBar } from "@/components/CommandBar";
import { QuickBar } from "@/components/QuickBar";
import { WorkspaceTabs } from "@/components/WorkspaceTabs";
import { StatusBar } from "@/components/StatusBar";
import { FunctionPanel } from "@/components/FunctionPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AlertEngine } from "@/components/AlertEngine";
import { useWorkspace } from "@/store/workspaceStore";
import { useMultiScreen } from "@/store/multiScreenStore";
import { FUNCTIONS } from "@/lib/functions";
import { cn } from "@/lib/cn";

import { CC } from "@/functions/CC";
import { INTEL } from "@/functions/INTEL";
import { HELP } from "@/functions/HELP";
import { DES } from "@/functions/DES";
import { GP } from "@/functions/GP";
import { QR } from "@/functions/QR";
import { HP } from "@/functions/HP";
import { FA } from "@/functions/FA";
import { KEY as KEYFN } from "@/functions/KEY";
import { DVD } from "@/functions/DVD";
import { EE } from "@/functions/EE";
import { NI } from "@/functions/NI";
import { WEI } from "@/functions/WEI";
import { MOV } from "@/functions/MOV";
import { OMON } from "@/functions/OMON";
import { CURV } from "@/functions/CURV";
import { FXC } from "@/functions/FXC";
import { CRYPTO } from "@/functions/CRYPTO";
import { WL } from "@/functions/WL";
import { PORT } from "@/functions/PORT";
import { CMDTY } from "@/functions/CMDTY";
import { SMAP } from "@/functions/SMAP";
import { ETF } from "@/functions/ETF";
import { COMP } from "@/functions/COMP";
import { ECAL } from "@/functions/ECAL";
import { HCAL } from "@/functions/HCAL";
import { ALRT } from "@/functions/ALRT";
import { WX } from "@/functions/WX";
import { KEYS as KEYSFN } from "@/functions/KEYS";
import { IPO } from "@/functions/IPO";
import { OWN } from "@/functions/OWN";
import { INSD } from "@/functions/INSD";
import { SCR } from "@/functions/SCR";
import { ECON } from "@/functions/ECON";
import { SI } from "@/functions/SI";
import { SENT } from "@/functions/SENT";

const SCREENS: Record<string, (symbol?: string) => JSX.Element> = {
  CC: () => <CC />,
  INTEL: (s) => <INTEL symbol={s!} />,
  HELP: () => <HELP />,
  DES: (s) => <DES symbol={s!} />,
  GP:  (s) => <GP symbol={s!} />,
  QR:  (s) => <QR symbol={s!} />,
  HP:  (s) => <HP symbol={s!} />,
  FA:  (s) => <FA symbol={s!} />,
  KEY: (s) => <KEYFN symbol={s!} />,
  DVD: (s) => <DVD symbol={s!} />,
  EE:  (s) => <EE symbol={s!} />,
  NI:  (s) => <NI symbol={s!} />,
  WEI: () => <WEI />,
  MOV: () => <MOV />,
  OMON: (s) => <OMON symbol={s!} />,
  CURV: () => <CURV />,
  FXC: () => <FXC />,
  CRYPTO: () => <CRYPTO />,
  WL:   () => <WL />,
  PORT: () => <PORT />,
  CMDTY: () => <CMDTY />,
  SMAP: () => <SMAP />,
  ETF:  () => <ETF />,
  COMP: () => <COMP />,
  ECAL: () => <ECAL />,
  HCAL: () => <HCAL />,
  ALRT: () => <ALRT />,
  WX:   () => <WX />,
  KEYS: () => <KEYSFN />,
  IPO:  () => <IPO />,
  OWN:  (s) => <OWN symbol={s!} />,
  INSD: (s) => <INSD symbol={s!} />,
  SCR:  () => <SCR />,
  ECON: () => <ECON />,
  SI:   () => <SI />,
  SENT: (s) => <SENT symbol={s!} />,
};

export default function App() {
  const { tabs, activeTabId, setActiveTab } = useWorkspace();
  const { layout, panels, focusedIdx, setFocusedIdx, setPanelTab, setLayout } =
    useMultiScreen();

  /* ── Panel focus management ─────────────────────────── */

  const handlePanelFocus = useCallback(
    (idx: number) => {
      if (idx === focusedIdx) return;
      // persist the outgoing focused panel's displayed tab
      if (activeTabId) setPanelTab(focusedIdx, activeTabId);
      setFocusedIdx(idx);
      // load the target panel's tab as active
      const newTabId = panels[idx]?.tabId;
      if (newTabId && tabs.some((t) => t.id === newTabId)) {
        setActiveTab(newTabId);
      }
    },
    [focusedIdx, activeTabId, panels, tabs, setPanelTab, setFocusedIdx, setActiveTab],
  );

  // Double-click a panel → maximise it (go back to single layout)
  const handlePanelMaximise = useCallback(
    (panelIdx: number) => {
      if (layout === "single") return;
      const tabId =
        panelIdx === focusedIdx
          ? activeTabId ?? panels[panelIdx]?.tabId
          : panels[panelIdx]?.tabId;
      // persist before layout change
      if (activeTabId) setPanelTab(focusedIdx, activeTabId);
      setLayout("single");
      if (tabId) {
        setPanelTab(0, tabId);
        setActiveTab(tabId);
      }
    },
    [layout, focusedIdx, activeTabId, panels, setPanelTab, setLayout, setActiveTab],
  );

  /* ── Keyboard shortcuts: Ctrl/⌘ + 1-4 focus panels ── */

  const focusRef = useRef(handlePanelFocus);
  focusRef.current = handlePanelFocus;

  useEffect(() => {
    const count = layout === "single" ? 1 : layout === "quad" ? 4 : 2;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key >= "1" && e.key <= "4") {
        const idx = parseInt(e.key) - 1;
        if (idx < count) {
          e.preventDefault();
          focusRef.current(idx);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [layout]);

  /* ── Render a single panel ──────────────────────────── */

  const renderPanel = (panelIdx: number) => {
    const storedTabId = panels[panelIdx]?.tabId ?? "CC:_";
    // Focused panel always mirrors workspaceStore.activeTabId
    const tabId = panelIdx === focusedIdx ? (activeTabId ?? storedTabId) : storedTabId;
    const tab = tabs.find((t) => t.id === tabId) ?? tabs[0];
    if (!tab) return null;

    const isFocused = panelIdx === focusedIdx;
    const screen = SCREENS[tab.code]?.(tab.symbol);
    const isMulti = layout !== "single";

    return (
      <div
        key={panelIdx}
        className={cn(
          "flex-1 min-h-0 min-w-0 flex flex-col relative overflow-hidden",
          isMulti &&
            (isFocused
              ? "ring-1 ring-term-amber/60"
              : "ring-1 ring-term-border/40"),
        )}
        onMouseDown={() => isMulti && handlePanelFocus(panelIdx)}
        onDoubleClick={() => isMulti && handlePanelMaximise(panelIdx)}
      >
        {isMulti && (
          <div
            className={cn(
              "absolute top-0 right-0 z-50 text-[9px] font-bold px-1.5 py-0.5 tracking-wider select-none pointer-events-none",
              isFocused
                ? "bg-term-amber text-black"
                : "bg-term-panel2 text-term-muted border-b border-l border-term-border",
            )}
          >
            P{panelIdx + 1}
          </div>
        )}
        <ErrorBoundary label={tab.code} key={tab.id}>
          <FunctionPanel code={tab.code} symbol={tab.symbol}>
            {screen ?? (
              <div className="p-4 text-term-muted">Function not implemented.</div>
            )}
          </FunctionPanel>
        </ErrorBoundary>
      </div>
    );
  };

  /* ── Layout container ───────────────────────────────── */

  const layoutClass = (() => {
    switch (layout) {
      case "2col":
        return "flex gap-0.5";
      case "2row":
        return "flex flex-col gap-0.5";
      case "quad":
        return "grid grid-cols-2 grid-rows-2 gap-0.5";
      default:
        return "flex";
    }
  })();

  const panelNodes = (() => {
    switch (layout) {
      case "2col":
      case "2row":
        return (
          <>
            {renderPanel(0)}
            {renderPanel(1)}
          </>
        );
      case "quad":
        return (
          <>
            {renderPanel(0)}
            {renderPanel(1)}
            {renderPanel(2)}
            {renderPanel(3)}
          </>
        );
      default:
        return renderPanel(0);
    }
  })();

  return (
    <div className="h-screen flex flex-col">
      <CommandBar />
      <QuickBar />
      <WorkspaceTabs />
      <div className={cn("flex-1 min-h-0 p-1", layoutClass)}>
        {panelNodes}
      </div>
      <StatusBar />
      <AlertEngine />
    </div>
  );
}

// Ensure FUNCTIONS is kept (for autocomplete discovery)
void FUNCTIONS;
