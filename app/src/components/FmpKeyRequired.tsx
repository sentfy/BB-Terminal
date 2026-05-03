import { useWorkspace } from "@/store/workspaceStore";

export function FmpKeyRequired({ feature }: { feature: string }) {
  const openTab = useWorkspace((s) => s.openTab);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
      <div className="text-term-amber text-[11px] uppercase tracking-[0.3em] font-bold">
        API KEY REQUIRED
      </div>
      <div className="text-term-heading text-[14px] text-center max-w-md">
        {feature} requires a Financial Modeling Prep (FMP) API key.
      </div>
      <div className="text-term-muted text-[12px] text-center max-w-md">
        FMP offers a free tier with 250 requests/day. Sign up at financialmodelingprep.com.
      </div>
      <button
        onClick={() => openTab("KEYS")}
        className="px-4 py-2 border border-term-amber text-term-amber hover:bg-term-amberSubtle text-[11px] uppercase tracking-wider"
      >
        CONFIGURE API KEYS
      </button>
    </div>
  );
}
