import type { Candle } from "@/lib/api";

export interface Point {
  time: number;
  value: number;
}

export function computeSMA(candles: Candle[], period: number): Point[] {
  const out: Point[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    out.push({
      time: Math.floor(new Date(candles[i].date).getTime() / 1000),
      value: sum / period,
    });
  }
  return out;
}

export function computeEMA(candles: Candle[], period: number): Point[] {
  if (candles.length < period) return [];
  const k = 2 / (period + 1);
  let ema = 0;
  for (let i = 0; i < period; i++) ema += candles[i].close;
  ema /= period;
  const out: Point[] = [
    { time: Math.floor(new Date(candles[period - 1].date).getTime() / 1000), value: ema },
  ];
  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    out.push({
      time: Math.floor(new Date(candles[i].date).getTime() / 1000),
      value: ema,
    });
  }
  return out;
}

export function computeRSI(candles: Candle[], period = 14): Point[] {
  if (candles.length < period + 1) return [];
  const changes: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    changes.push(candles[i].close - candles[i - 1].close);
  }
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  const out: Point[] = [];
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  out.push({
    time: Math.floor(new Date(candles[period].date).getTime() / 1000),
    value: 100 - 100 / (1 + rs),
  });

  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const r = avgLoss === 0 ? 100 : avgGain / avgLoss;
    out.push({
      time: Math.floor(new Date(candles[i + 1].date).getTime() / 1000),
      value: 100 - 100 / (1 + r),
    });
  }
  return out;
}

export interface MACDResult {
  macd: Point[];
  signal: Point[];
  histogram: Point[];
}

export function computeMACD(
  candles: Candle[],
  fast = 12,
  slow = 26,
  sig = 9
): MACDResult {
  const emaFast = computeEMA(candles, fast);
  const emaSlow = computeEMA(candles, slow);

  const slowStart = slow - fast;
  const macdLine: Point[] = [];
  for (let i = 0; i < emaSlow.length; i++) {
    const fv = emaFast[i + slowStart];
    if (!fv) continue;
    macdLine.push({ time: emaSlow[i].time, value: fv.value - emaSlow[i].value });
  }

  if (macdLine.length < sig) return { macd: macdLine, signal: [], histogram: [] };

  const k = 2 / (sig + 1);
  let ema = 0;
  for (let i = 0; i < sig; i++) ema += macdLine[i].value;
  ema /= sig;

  const signal: Point[] = [{ time: macdLine[sig - 1].time, value: ema }];
  const histogram: Point[] = [{ time: macdLine[sig - 1].time, value: macdLine[sig - 1].value - ema }];

  for (let i = sig; i < macdLine.length; i++) {
    ema = macdLine[i].value * k + ema * (1 - k);
    signal.push({ time: macdLine[i].time, value: ema });
    histogram.push({ time: macdLine[i].time, value: macdLine[i].value - ema });
  }
  return { macd: macdLine, signal, histogram };
}

export interface BollingerResult {
  upper: Point[];
  middle: Point[];
  lower: Point[];
}

export function computeBollingerBands(
  candles: Candle[],
  period = 20,
  stdDev = 2
): BollingerResult {
  const upper: Point[] = [];
  const middle: Point[] = [];
  const lower: Point[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    const mean = sum / period;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) variance += (candles[j].close - mean) ** 2;
    const sd = Math.sqrt(variance / period);
    const t = Math.floor(new Date(candles[i].date).getTime() / 1000);
    middle.push({ time: t, value: mean });
    upper.push({ time: t, value: mean + stdDev * sd });
    lower.push({ time: t, value: mean - stdDev * sd });
  }
  return { upper, middle, lower };
}
