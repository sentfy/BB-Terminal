import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSocialSentiment, hasFmpKey, type SocialSentiment } from "@/lib/fmp";
import { FmpKeyRequired } from "@/components/FmpKeyRequired";
import { fmtVolume } from "@/lib/format";
import { cn } from "@/lib/cn";

type Tab = "overview" | "stocktwits" | "twitter";

function sentimentLabel(score: number): { label: string; cls: string } {
  if (score > 0.6) return { label: "BULLISH", cls: "up" };
  if (score < 0.4) return { label: "BEARISH", cls: "down" };
  return { label: "NEUTRAL", cls: "text-term-amber" };
}

function Spark({ values, color = "#ff8c00", height = 28 }: { values: number[]; color?: string; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = height - 4 - ((v - min) / range) * (height - 8);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
    </svg>
  );
}

export function SENT({ symbol }: { symbol: string }) {
  const [tab, setTab] = useState<Tab>("overview");

  if (!hasFmpKey()) return <FmpKeyRequired feature="Social Sentiment" />;

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["social-sentiment", symbol],
    queryFn: () => fetchSocialSentiment(symbol, 30),
    staleTime: 120_000,
  });

  const sorted = useMemo(() => [...data].sort((a, b) => a.date.localeCompare(b.date)), [data]);

  const totals = useMemo(() => {
    let posts = 0, comments = 0, likes = 0, impressions = 0, sentSum = 0;
    for (const d of data) {
      posts += d.stocktwitsPosts + d.twitterPosts;
      comments += d.stocktwitsComments + d.twitterComments;
      likes += d.stocktwitsLikes + d.twitterLikes;
      impressions += d.stocktwitsImpressions + d.twitterImpressions;
      sentSum += (d.stocktwitsSentiment + d.twitterSentiment) / 2;
    }
    const avgSentiment = data.length > 0 ? sentSum / data.length : 0.5;
    return { posts, comments, likes, impressions, avgSentiment };
  }, [data]);

  const sentLabel = sentimentLabel(totals.avgSentiment);

  const sentimentValues = useMemo(
    () => sorted.map((d) => (d.stocktwitsSentiment + d.twitterSentiment) / 2),
    [sorted],
  );
  const mentionValues = useMemo(
    () => sorted.map((d) => d.stocktwitsPosts + d.twitterPosts),
    [sorted],
  );

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex items-center gap-3 h-8 px-3 border-b border-term-border bg-term-panel2 text-[11px] uppercase tracking-wider">
        {(["overview", "stocktwits", "twitter"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-2 py-0.5 border",
              tab === t ? "border-term-amber text-term-amber" : "border-transparent text-term-muted hover:text-term-text")}>
            {t === "overview" ? "Overview" : t === "stocktwits" ? "StockTwits" : "Twitter"}
          </button>
        ))}
        <span className="ml-auto text-term-muted">{data.length} days · {symbol}</span>
      </div>

      <div className="flex-1 overflow-auto scroll-thin">
        {isLoading && <div className="p-4 text-term-muted uppercase text-[11px] tracking-widest">Loading…</div>}
        {error && <div className="p-4 text-term-red">{(error as Error).message}</div>}
        {!isLoading && !error && data.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="text-term-amber text-[11px] uppercase tracking-[0.25em] font-bold mb-2">SOCIAL SENTIMENT</div>
              <div className="text-term-muted text-[12px] leading-relaxed">
                Social sentiment data is not available in the current FMP API plan. This feature requires a premium FMP subscription with access to the social sentiment endpoint.
              </div>
            </div>
          </div>
        )}
        {!isLoading && !error && data.length > 0 && tab === "overview" && (
          <div className="p-4 flex flex-col gap-4">
            {/* Sentiment gauge */}
            <div className="flex items-center gap-6 p-3 border border-term-border bg-term-panel2">
              <div>
                <div className="sub-header mb-1">OVERALL SENTIMENT</div>
                <div className={cn("text-[20px] font-bold", sentLabel.cls)}>
                  {sentLabel.label}
                </div>
                <div className="text-[11px] text-term-muted num mt-1">
                  Score: {totals.avgSentiment.toFixed(3)} / 1.0
                </div>
              </div>
              <div className="flex-1 grid grid-cols-4 gap-3 text-[11px]">
                <div>
                  <div className="sub-header">Posts</div>
                  <div className="num text-term-heading font-bold">{fmtVolume(totals.posts)}</div>
                </div>
                <div>
                  <div className="sub-header">Comments</div>
                  <div className="num text-term-heading font-bold">{fmtVolume(totals.comments)}</div>
                </div>
                <div>
                  <div className="sub-header">Likes</div>
                  <div className="num text-term-heading font-bold">{fmtVolume(totals.likes)}</div>
                </div>
                <div>
                  <div className="sub-header">Impressions</div>
                  <div className="num text-term-heading font-bold">{fmtVolume(totals.impressions)}</div>
                </div>
              </div>
            </div>

            {/* Sparklines */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-term-border p-3">
                <div className="sub-header mb-2">30-DAY SENTIMENT TREND</div>
                <Spark values={sentimentValues} color="#ff8c00" height={60} />
              </div>
              <div className="border border-term-border p-3">
                <div className="sub-header mb-2">30-DAY MENTION VOLUME</div>
                <Spark values={mentionValues} color="#22ccee" height={60} />
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && data.length > 0 && tab !== "overview" && (
          <DetailTable data={sorted} platform={tab} />
        )}
      </div>

      <div className="px-3 py-1 border-t border-term-border sub-header">DATA: FMP · SOCIAL SENTIMENT</div>
    </div>
  );
}

function DetailTable({ data, platform }: { data: SocialSentiment[]; platform: "stocktwits" | "twitter" }) {
  const reversed = useMemo(() => [...data].reverse(), [data]);
  return (
    <table className="w-full text-[12px] grid-data">
      <thead>
        <tr>
          <th>Date</th>
          <th className="text-right">Posts</th>
          <th className="text-right">Comments</th>
          <th className="text-right">Likes</th>
          <th className="text-right">Impressions</th>
          <th className="text-right">Sentiment</th>
        </tr>
      </thead>
      <tbody>
        {reversed.map((d, i) => {
          const posts = platform === "stocktwits" ? d.stocktwitsPosts : d.twitterPosts;
          const comments = platform === "stocktwits" ? d.stocktwitsComments : d.twitterComments;
          const likes = platform === "stocktwits" ? d.stocktwitsLikes : d.twitterLikes;
          const impressions = platform === "stocktwits" ? d.stocktwitsImpressions : d.twitterImpressions;
          const sentiment = platform === "stocktwits" ? d.stocktwitsSentiment : d.twitterSentiment;
          const sl = sentimentLabel(sentiment);
          return (
            <tr key={i}>
              <td className="num text-term-muted">{d.date.slice(0, 10)}</td>
              <td className="num text-right">{fmtVolume(posts)}</td>
              <td className="num text-right">{fmtVolume(comments)}</td>
              <td className="num text-right">{fmtVolume(likes)}</td>
              <td className="num text-right text-term-muted">{fmtVolume(impressions)}</td>
              <td className={cn("num text-right font-semibold", sl.cls)}>
                {sentiment.toFixed(3)} {sl.label}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
