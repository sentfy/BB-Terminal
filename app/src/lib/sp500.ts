export interface SectorDef {
  name: string;
  etf: string;
  weight: number;
  constituents: string[];
}

export const SECTORS: SectorDef[] = [
  {
    name: "Technology", etf: "XLK", weight: 31.5,
    constituents: ["AAPL", "MSFT", "NVDA", "AVGO", "CRM", "AMD", "ADBE", "ACN", "CSCO", "ORCL", "INTC", "TXN", "QCOM", "INTU", "NOW"],
  },
  {
    name: "Financials", etf: "XLF", weight: 13.2,
    constituents: ["BRK-B", "JPM", "V", "MA", "BAC", "WFC", "GS", "MS", "SPGI", "BLK", "AXP", "C", "SCHW", "CB", "MMC"],
  },
  {
    name: "Health Care", etf: "XLV", weight: 12.1,
    constituents: ["LLY", "UNH", "JNJ", "ABBV", "MRK", "TMO", "ABT", "PFE", "DHR", "AMGN", "BMY", "MDT", "ISRG", "GILD", "SYK"],
  },
  {
    name: "Consumer Disc.", etf: "XLY", weight: 10.5,
    constituents: ["AMZN", "TSLA", "HD", "MCD", "NKE", "LOW", "SBUX", "TJX", "BKNG", "CMG", "ORLY", "MAR", "ABNB", "GM", "F"],
  },
  {
    name: "Industrials", etf: "XLI", weight: 8.8,
    constituents: ["GE", "CAT", "UNP", "RTX", "HON", "BA", "DE", "UPS", "LMT", "ADP", "MMM", "GD", "WM", "ETN", "ITW"],
  },
  {
    name: "Comm. Services", etf: "XLC", weight: 8.5,
    constituents: ["META", "GOOGL", "GOOG", "NFLX", "DIS", "CMCSA", "T", "VZ", "TMUS", "CHTR", "EA", "ATVI", "MTCH", "WBD", "PARA"],
  },
  {
    name: "Consumer Staples", etf: "XLP", weight: 5.9,
    constituents: ["PG", "KO", "PEP", "COST", "WMT", "PM", "MO", "MDLZ", "CL", "ADM", "KHC", "GIS", "SYY", "STZ", "HSY"],
  },
  {
    name: "Energy", etf: "XLE", weight: 3.8,
    constituents: ["XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PXD", "PSX", "VLO", "OXY", "WMB", "HES", "KMI", "HAL", "DVN"],
  },
  {
    name: "Utilities", etf: "XLU", weight: 2.5,
    constituents: ["NEE", "SO", "DUK", "CEG", "SRE", "AEP", "D", "EXC", "XEL", "PEG", "ED", "WEC", "ES", "AWK", "DTE"],
  },
  {
    name: "Real Estate", etf: "XLRE", weight: 2.3,
    constituents: ["PLD", "AMT", "CCI", "EQIX", "SPG", "PSA", "O", "WELL", "DLR", "VICI", "AVB", "EQR", "ARE", "MAA", "VTR"],
  },
  {
    name: "Materials", etf: "XLB", weight: 2.4,
    constituents: ["LIN", "APD", "SHW", "ECL", "FCX", "NUE", "NEM", "DOW", "DD", "VMC", "MLM", "PPG", "ALB", "CF", "CTVA"],
  },
];
