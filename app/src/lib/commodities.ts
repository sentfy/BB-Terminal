export type CommodityCategory = "Energy" | "Metals" | "Agriculture" | "Softs";
export type CommodityExchange = "NYMEX" | "COMEX" | "ICE" | "CBOT" | "CME";

export interface CommodityDef {
  symbol: string;
  name: string;
  category: CommodityCategory;
  exchange: CommodityExchange;
  unit: string;
  digits: number;
}

export const COMMODITIES: CommodityDef[] = [
  // Energy — emphasis on power and natural gas
  { symbol: "NG=F",  name: "Natural Gas",     category: "Energy",  exchange: "NYMEX", unit: "MMBtu", digits: 3 },
  { symbol: "CL=F",  name: "WTI Crude Oil",   category: "Energy",  exchange: "NYMEX", unit: "bbl",   digits: 2 },
  { symbol: "BZ=F",  name: "Brent Crude",     category: "Energy",  exchange: "ICE",   unit: "bbl",   digits: 2 },
  { symbol: "HO=F",  name: "Heating Oil",     category: "Energy",  exchange: "NYMEX", unit: "gal",   digits: 4 },
  { symbol: "RB=F",  name: "RBOB Gasoline",   category: "Energy",  exchange: "NYMEX", unit: "gal",   digits: 4 },

  // Metals
  { symbol: "GC=F",  name: "Gold",            category: "Metals",  exchange: "COMEX", unit: "oz",    digits: 2 },
  { symbol: "SI=F",  name: "Silver",          category: "Metals",  exchange: "COMEX", unit: "oz",    digits: 3 },
  { symbol: "HG=F",  name: "Copper",          category: "Metals",  exchange: "COMEX", unit: "lb",    digits: 4 },
  { symbol: "PL=F",  name: "Platinum",        category: "Metals",  exchange: "NYMEX", unit: "oz",    digits: 2 },
  { symbol: "PA=F",  name: "Palladium",       category: "Metals",  exchange: "NYMEX", unit: "oz",    digits: 2 },

  // Agriculture
  { symbol: "ZC=F",  name: "Corn",            category: "Agriculture", exchange: "CBOT", unit: "bu", digits: 2 },
  { symbol: "ZW=F",  name: "Wheat",           category: "Agriculture", exchange: "CBOT", unit: "bu", digits: 2 },
  { symbol: "ZS=F",  name: "Soybeans",        category: "Agriculture", exchange: "CBOT", unit: "bu", digits: 2 },
  { symbol: "ZL=F",  name: "Soybean Oil",     category: "Agriculture", exchange: "CBOT", unit: "lb", digits: 2 },
  { symbol: "CT=F",  name: "Cotton",          category: "Agriculture", exchange: "ICE",  unit: "lb", digits: 2 },
  { symbol: "LE=F",  name: "Live Cattle",     category: "Agriculture", exchange: "CME",  unit: "lb", digits: 3 },

  // Softs
  { symbol: "KC=F",  name: "Coffee",          category: "Softs",   exchange: "ICE",   unit: "lb",    digits: 2 },
  { symbol: "SB=F",  name: "Sugar #11",       category: "Softs",   exchange: "ICE",   unit: "lb",    digits: 2 },
  { symbol: "CC=F",  name: "Cocoa",           category: "Softs",   exchange: "ICE",   unit: "MT",    digits: 0 },
  { symbol: "OJ=F",  name: "Orange Juice",    category: "Softs",   exchange: "ICE",   unit: "lb",    digits: 2 },
];

export const CATEGORIES: CommodityCategory[] = ["Energy", "Metals", "Agriculture", "Softs"];
