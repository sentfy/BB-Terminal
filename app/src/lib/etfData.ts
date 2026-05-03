export interface EtfDef {
  symbol: string;
  name: string;
  category: string;
  issuer: string;
  expenseRatio: number;
}

export const ETF_CATEGORIES = [
  "US Large Cap", "US Small/Mid Cap", "International Developed", "Emerging Markets",
  "US Bond", "International Bond", "Commodity", "Sector", "Thematic",
] as const;

export const ETF_ISSUERS = ["Vanguard", "iShares", "SPDR", "Invesco", "Schwab", "Other"] as const;

export const ETFS: EtfDef[] = [
  // US Large Cap
  { symbol: "SPY",   name: "SPDR S&P 500 ETF",                category: "US Large Cap", issuer: "SPDR",     expenseRatio: 0.09 },
  { symbol: "VOO",   name: "Vanguard S&P 500 ETF",            category: "US Large Cap", issuer: "Vanguard", expenseRatio: 0.03 },
  { symbol: "IVV",   name: "iShares Core S&P 500",            category: "US Large Cap", issuer: "iShares",  expenseRatio: 0.03 },
  { symbol: "QQQ",   name: "Invesco QQQ Trust (Nasdaq 100)",  category: "US Large Cap", issuer: "Invesco",  expenseRatio: 0.20 },
  { symbol: "VTI",   name: "Vanguard Total Stock Market",     category: "US Large Cap", issuer: "Vanguard", expenseRatio: 0.03 },
  { symbol: "DIA",   name: "SPDR Dow Jones Industrial Avg",   category: "US Large Cap", issuer: "SPDR",     expenseRatio: 0.16 },
  { symbol: "RSP",   name: "Invesco S&P 500 Equal Weight",    category: "US Large Cap", issuer: "Invesco",  expenseRatio: 0.20 },
  { symbol: "SCHX",  name: "Schwab US Large-Cap",             category: "US Large Cap", issuer: "Schwab",   expenseRatio: 0.03 },
  { symbol: "MGK",   name: "Vanguard Mega Cap Growth",        category: "US Large Cap", issuer: "Vanguard", expenseRatio: 0.07 },
  { symbol: "VTV",   name: "Vanguard Value ETF",              category: "US Large Cap", issuer: "Vanguard", expenseRatio: 0.04 },

  // US Small/Mid Cap
  { symbol: "IWM",   name: "iShares Russell 2000",            category: "US Small/Mid Cap", issuer: "iShares",  expenseRatio: 0.19 },
  { symbol: "VB",    name: "Vanguard Small Cap",              category: "US Small/Mid Cap", issuer: "Vanguard", expenseRatio: 0.05 },
  { symbol: "MDY",   name: "SPDR S&P MidCap 400",            category: "US Small/Mid Cap", issuer: "SPDR",     expenseRatio: 0.24 },
  { symbol: "VO",    name: "Vanguard Mid-Cap",                category: "US Small/Mid Cap", issuer: "Vanguard", expenseRatio: 0.04 },
  { symbol: "IJR",   name: "iShares Core S&P Small-Cap",      category: "US Small/Mid Cap", issuer: "iShares",  expenseRatio: 0.06 },

  // International Developed
  { symbol: "VEA",   name: "Vanguard Developed Markets",      category: "International Developed", issuer: "Vanguard", expenseRatio: 0.05 },
  { symbol: "EFA",   name: "iShares MSCI EAFE",               category: "International Developed", issuer: "iShares",  expenseRatio: 0.32 },
  { symbol: "IEFA",  name: "iShares Core MSCI EAFE",          category: "International Developed", issuer: "iShares",  expenseRatio: 0.07 },
  { symbol: "VXUS",  name: "Vanguard Total International",    category: "International Developed", issuer: "Vanguard", expenseRatio: 0.07 },
  { symbol: "SCHF",  name: "Schwab International Equity",     category: "International Developed", issuer: "Schwab",   expenseRatio: 0.06 },

  // Emerging Markets
  { symbol: "VWO",   name: "Vanguard Emerging Markets",       category: "Emerging Markets", issuer: "Vanguard", expenseRatio: 0.08 },
  { symbol: "EEM",   name: "iShares MSCI Emerging Markets",   category: "Emerging Markets", issuer: "iShares",  expenseRatio: 0.68 },
  { symbol: "IEMG",  name: "iShares Core MSCI EM",            category: "Emerging Markets", issuer: "iShares",  expenseRatio: 0.09 },
  { symbol: "MCHI",  name: "iShares MSCI China",              category: "Emerging Markets", issuer: "iShares",  expenseRatio: 0.59 },
  { symbol: "EWZ",   name: "iShares MSCI Brazil",             category: "Emerging Markets", issuer: "iShares",  expenseRatio: 0.59 },

  // US Bond
  { symbol: "BND",   name: "Vanguard Total Bond Market",      category: "US Bond", issuer: "Vanguard", expenseRatio: 0.03 },
  { symbol: "AGG",   name: "iShares Core US Aggregate Bond",  category: "US Bond", issuer: "iShares",  expenseRatio: 0.03 },
  { symbol: "TLT",   name: "iShares 20+ Year Treasury",       category: "US Bond", issuer: "iShares",  expenseRatio: 0.15 },
  { symbol: "SHY",   name: "iShares 1-3 Year Treasury",       category: "US Bond", issuer: "iShares",  expenseRatio: 0.15 },
  { symbol: "LQD",   name: "iShares Investment Grade Corp",   category: "US Bond", issuer: "iShares",  expenseRatio: 0.14 },
  { symbol: "HYG",   name: "iShares High Yield Corporate",    category: "US Bond", issuer: "iShares",  expenseRatio: 0.49 },
  { symbol: "VCSH",  name: "Vanguard Short-Term Corp Bond",   category: "US Bond", issuer: "Vanguard", expenseRatio: 0.04 },
  { symbol: "TIP",   name: "iShares TIPS Bond",               category: "US Bond", issuer: "iShares",  expenseRatio: 0.19 },

  // International Bond
  { symbol: "BNDX",  name: "Vanguard Total Intl Bond",        category: "International Bond", issuer: "Vanguard", expenseRatio: 0.07 },
  { symbol: "EMB",   name: "iShares JP Morgan EM Bond",       category: "International Bond", issuer: "iShares",  expenseRatio: 0.39 },

  // Commodity
  { symbol: "GLD",   name: "SPDR Gold Trust",                 category: "Commodity", issuer: "SPDR",    expenseRatio: 0.40 },
  { symbol: "IAU",   name: "iShares Gold Trust",              category: "Commodity", issuer: "iShares", expenseRatio: 0.25 },
  { symbol: "SLV",   name: "iShares Silver Trust",            category: "Commodity", issuer: "iShares", expenseRatio: 0.50 },
  { symbol: "USO",   name: "US Oil Fund",                     category: "Commodity", issuer: "Other",   expenseRatio: 0.79 },
  { symbol: "UNG",   name: "US Natural Gas Fund",             category: "Commodity", issuer: "Other",   expenseRatio: 1.06 },
  { symbol: "DBC",   name: "Invesco DB Commodity Index",      category: "Commodity", issuer: "Invesco", expenseRatio: 0.85 },
  { symbol: "PDBC",  name: "Invesco Optimum Yield Diversified",category: "Commodity", issuer: "Invesco", expenseRatio: 0.59 },

  // Sector
  { symbol: "XLK",   name: "Technology Select Sector SPDR",   category: "Sector", issuer: "SPDR", expenseRatio: 0.10 },
  { symbol: "XLF",   name: "Financial Select Sector SPDR",    category: "Sector", issuer: "SPDR", expenseRatio: 0.10 },
  { symbol: "XLV",   name: "Health Care Select Sector SPDR",  category: "Sector", issuer: "SPDR", expenseRatio: 0.10 },
  { symbol: "XLE",   name: "Energy Select Sector SPDR",       category: "Sector", issuer: "SPDR", expenseRatio: 0.10 },
  { symbol: "XLI",   name: "Industrial Select Sector SPDR",   category: "Sector", issuer: "SPDR", expenseRatio: 0.10 },
  { symbol: "XLY",   name: "Consumer Disc. Select Sector",    category: "Sector", issuer: "SPDR", expenseRatio: 0.10 },
  { symbol: "XLP",   name: "Consumer Staples Select Sector",  category: "Sector", issuer: "SPDR", expenseRatio: 0.10 },
  { symbol: "XLU",   name: "Utilities Select Sector SPDR",    category: "Sector", issuer: "SPDR", expenseRatio: 0.10 },
  { symbol: "XLB",   name: "Materials Select Sector SPDR",    category: "Sector", issuer: "SPDR", expenseRatio: 0.10 },
  { symbol: "XLRE",  name: "Real Estate Select Sector SPDR",  category: "Sector", issuer: "SPDR", expenseRatio: 0.10 },
  { symbol: "XLC",   name: "Communication Svc Select Sector", category: "Sector", issuer: "SPDR", expenseRatio: 0.10 },

  // Thematic
  { symbol: "ARKK",  name: "ARK Innovation ETF",              category: "Thematic", issuer: "Other",   expenseRatio: 0.75 },
  { symbol: "ICLN",  name: "iShares Global Clean Energy",     category: "Thematic", issuer: "iShares", expenseRatio: 0.40 },
  { symbol: "SOXX",  name: "iShares Semiconductor",           category: "Thematic", issuer: "iShares", expenseRatio: 0.35 },
  { symbol: "XBI",   name: "SPDR S&P Biotech ETF",            category: "Thematic", issuer: "SPDR",    expenseRatio: 0.35 },
  { symbol: "HACK",  name: "ETFMG Prime Cyber Security",      category: "Thematic", issuer: "Other",   expenseRatio: 0.60 },
  { symbol: "TAN",   name: "Invesco Solar ETF",               category: "Thematic", issuer: "Invesco", expenseRatio: 0.67 },
];
