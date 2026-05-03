import { type ReactNode, useState } from "react";
import { FN_BY_CODE, type FunctionCode } from "@/lib/functions";
import { type ExportConfig, exportCSV, exportPDF } from "@/lib/export";

interface Props {
  code: FunctionCode;
  symbol?: string;
  children: ReactNode;
  exportConfig?: ExportConfig;
}

export function FunctionPanel({ code, symbol, children, exportConfig }: Props) {
  const fn = FN_BY_CODE[code];
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="panel flex-1 min-h-0 min-w-0">
      <div className="panel-header">
        <div className="flex items-center gap-3">
          <span className="text-term-amber font-bold">{code}</span>
          <span className="text-term-muted">·</span>
          <span className="text-term-heading">{fn.name}</span>
          {symbol && (
            <>
              <span className="text-term-muted">·</span>
              <span className="text-term-amberBright num">{symbol}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {exportConfig && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-term-muted hover:text-term-amber transition-colors text-[10px] tracking-normal normal-case font-normal flex items-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                EXPORT
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-term-panel border border-term-border text-[10px] min-w-[100px]"
                  onMouseLeave={() => setShowMenu(false)}>
                  <button onClick={() => { exportCSV(exportConfig); setShowMenu(false); }}
                    className="block w-full text-left px-3 py-1.5 text-term-text hover:bg-term-amberSubtle hover:text-term-amber">
                    CSV
                  </button>
                  <button onClick={() => { exportPDF(exportConfig); setShowMenu(false); }}
                    className="block w-full text-left px-3 py-1.5 text-term-text hover:bg-term-amberSubtle hover:text-term-amber border-t border-term-borderSoft">
                    PDF
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="text-term-muted normal-case tracking-normal font-normal text-[10px]">
            {fn.summary}
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto scroll-thin">{children}</div>
    </div>
  );
}
