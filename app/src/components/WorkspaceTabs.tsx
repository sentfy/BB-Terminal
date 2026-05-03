import { type ReactNode, useRef, useState } from "react";
import { X } from "lucide-react";
import { useWorkspace } from "@/store/workspaceStore";
import { useMultiScreen, type LayoutMode } from "@/store/multiScreenStore";
import { cn } from "@/lib/cn";

export function WorkspaceTabs() {
  const { tabs, activeTabId, setActiveTab, closeTab, closeAllTabs, moveTab } = useWorkspace();
  const { layout, setLayout, panels, focusedIdx, setPanelTab } = useMultiScreen();

  /* ── drag-to-reorder state ────────────────────────── */
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = "move";
    // make the ghost semi-transparent
    requestAnimationFrame(() => {
      if (dragNodeRef.current) dragNodeRef.current.style.opacity = "0.4";
    });
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) dragNodeRef.current.style.opacity = "1";
    if (dragIdx != null && overIdx != null && dragIdx !== overIdx) {
      moveTab(dragIdx, overIdx);
    }
    setDragIdx(null);
    setOverIdx(null);
    dragNodeRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (idx !== overIdx) setOverIdx(idx);
  };

  /* ── layout change ────────────────────────────────── */
  const handleLayoutChange = (newLayout: LayoutMode) => {
    if (activeTabId) setPanelTab(focusedIdx, activeTabId);
    setLayout(newLayout);
  };

  return (
    <div className="flex h-7 bg-term-bg2 border-b border-term-border">
      {/* Scrollable tab list */}
      <div className="flex flex-1 overflow-x-auto scroll-thin">
        {tabs.map((t, idx) => {
          const isActive = t.id === activeTabId;
          const label = t.symbol ? `${t.symbol} · ${t.code}` : t.code;
          const isDragging = dragIdx === idx;
          const isDropTarget = overIdx === idx && dragIdx !== idx;

          // panel badges (multi-screen only)
          const panelBadges: number[] = [];
          if (layout !== "single") {
            panels.forEach((p, i) => {
              if (i === focusedIdx) {
                if (activeTabId === t.id) panelBadges.push(i + 1);
              } else if (p.tabId === t.id) {
                panelBadges.push(i + 1);
              }
            });
          }

          return (
            <div
              key={t.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnter={(e) => e.preventDefault()}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-2 h-full px-3 cursor-grab border-r border-term-border text-[11px] tracking-wider uppercase whitespace-nowrap select-none transition-[border-color] duration-150",
                isActive
                  ? "bg-term-panel text-term-amber border-t-2 border-t-term-amber"
                  : "text-term-muted hover:text-term-text hover:bg-term-panel/40",
                isDropTarget && "border-l-2 border-l-term-amber",
              )}
            >
              <span className="font-semibold">{label}</span>
              {panelBadges.length > 0 && (
                <span className="text-[8px] text-term-amber/60 font-normal tracking-normal">
                  {panelBadges.map((n) => `P${n}`).join(" ")}
                </span>
              )}
              {tabs.length > 1 && (
                <X
                  size={11}
                  className="opacity-40 hover:opacity-100 hover:text-term-red"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(t.id);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Close all + layout controls */}
      <div className="flex items-center gap-1.5 px-3 border-l border-term-border shrink-0">
        {tabs.length > 1 && (
          <button
            onClick={closeAllTabs}
            title="Close all tabs · open Command Center"
            className="text-[9px] text-term-muted hover:text-term-red transition-colors tracking-wider uppercase mr-1"
          >
            CLOSE ALL
          </button>
        )}
        <span className="text-[9px] text-term-muted tracking-wider mr-0.5 hidden lg:inline">
          LAYOUT
        </span>
        <LayoutBtn
          active={layout === "single"}
          onClick={() => handleLayoutChange("single")}
          title="Single panel"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </LayoutBtn>
        <LayoutBtn
          active={layout === "2col"}
          onClick={() => handleLayoutChange("2col")}
          title="Side-by-side"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8" y="1" width="5" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </LayoutBtn>
        <LayoutBtn
          active={layout === "2row"}
          onClick={() => handleLayoutChange("2row")}
          title="Stacked"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="12" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1" y="8" width="12" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </LayoutBtn>
        <LayoutBtn
          active={layout === "quad"}
          onClick={() => handleLayoutChange("quad")}
          title="Quad view"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8" y="1" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1" y="8" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8" y="8" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </LayoutBtn>
      </div>
    </div>
  );
}

/* ── tiny layout-mode button ─────────────────────── */

function LayoutBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "p-1 transition-colors",
        active ? "text-term-amber" : "text-term-muted hover:text-term-text",
      )}
    >
      {children}
    </button>
  );
}
