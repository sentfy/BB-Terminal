export interface TradingHoliday {
  date: string;
  name: string;
  exchange: "ICE" | "CME" | "NYSE";
  earlyClose?: boolean;
}

// 2025-2026 ICE Futures US holidays
export const ICE_HOLIDAYS: TradingHoliday[] = [
  { date: "2025-01-01", name: "New Year's Day", exchange: "ICE" },
  { date: "2025-01-20", name: "Martin Luther King Jr. Day", exchange: "ICE" },
  { date: "2025-02-17", name: "Presidents' Day", exchange: "ICE" },
  { date: "2025-04-18", name: "Good Friday", exchange: "ICE" },
  { date: "2025-05-26", name: "Memorial Day", exchange: "ICE" },
  { date: "2025-06-19", name: "Juneteenth", exchange: "ICE" },
  { date: "2025-07-04", name: "Independence Day", exchange: "ICE" },
  { date: "2025-09-01", name: "Labor Day", exchange: "ICE" },
  { date: "2025-11-27", name: "Thanksgiving Day", exchange: "ICE" },
  { date: "2025-11-28", name: "Day After Thanksgiving", exchange: "ICE", earlyClose: true },
  { date: "2025-12-25", name: "Christmas Day", exchange: "ICE" },
  { date: "2026-01-01", name: "New Year's Day", exchange: "ICE" },
  { date: "2026-01-19", name: "Martin Luther King Jr. Day", exchange: "ICE" },
  { date: "2026-02-16", name: "Presidents' Day", exchange: "ICE" },
  { date: "2026-04-03", name: "Good Friday", exchange: "ICE" },
  { date: "2026-05-25", name: "Memorial Day", exchange: "ICE" },
  { date: "2026-06-19", name: "Juneteenth", exchange: "ICE" },
  { date: "2026-07-03", name: "Independence Day (Observed)", exchange: "ICE" },
  { date: "2026-09-07", name: "Labor Day", exchange: "ICE" },
  { date: "2026-11-26", name: "Thanksgiving Day", exchange: "ICE" },
  { date: "2026-12-25", name: "Christmas Day", exchange: "ICE" },
];

// 2025-2026 CME Group holidays
export const CME_HOLIDAYS: TradingHoliday[] = [
  { date: "2025-01-01", name: "New Year's Day", exchange: "CME" },
  { date: "2025-01-20", name: "Martin Luther King Jr. Day", exchange: "CME" },
  { date: "2025-02-17", name: "Presidents' Day", exchange: "CME" },
  { date: "2025-04-18", name: "Good Friday", exchange: "CME" },
  { date: "2025-05-26", name: "Memorial Day", exchange: "CME" },
  { date: "2025-06-19", name: "Juneteenth", exchange: "CME" },
  { date: "2025-07-04", name: "Independence Day", exchange: "CME" },
  { date: "2025-09-01", name: "Labor Day", exchange: "CME" },
  { date: "2025-10-13", name: "Columbus Day", exchange: "CME", earlyClose: true },
  { date: "2025-11-11", name: "Veterans Day", exchange: "CME", earlyClose: true },
  { date: "2025-11-27", name: "Thanksgiving Day", exchange: "CME" },
  { date: "2025-11-28", name: "Day After Thanksgiving", exchange: "CME", earlyClose: true },
  { date: "2025-12-25", name: "Christmas Day", exchange: "CME" },
  { date: "2025-12-24", name: "Christmas Eve", exchange: "CME", earlyClose: true },
  { date: "2026-01-01", name: "New Year's Day", exchange: "CME" },
  { date: "2026-01-19", name: "Martin Luther King Jr. Day", exchange: "CME" },
  { date: "2026-02-16", name: "Presidents' Day", exchange: "CME" },
  { date: "2026-04-03", name: "Good Friday", exchange: "CME" },
  { date: "2026-05-25", name: "Memorial Day", exchange: "CME" },
  { date: "2026-06-19", name: "Juneteenth", exchange: "CME" },
  { date: "2026-07-03", name: "Independence Day (Observed)", exchange: "CME" },
  { date: "2026-09-07", name: "Labor Day", exchange: "CME" },
  { date: "2026-11-26", name: "Thanksgiving Day", exchange: "CME" },
  { date: "2026-12-25", name: "Christmas Day", exchange: "CME" },
];

// 2025-2026 NYSE holidays
export const NYSE_HOLIDAYS: TradingHoliday[] = [
  { date: "2025-01-01", name: "New Year's Day", exchange: "NYSE" },
  { date: "2025-01-20", name: "Martin Luther King Jr. Day", exchange: "NYSE" },
  { date: "2025-02-17", name: "Presidents' Day", exchange: "NYSE" },
  { date: "2025-04-18", name: "Good Friday", exchange: "NYSE" },
  { date: "2025-05-26", name: "Memorial Day", exchange: "NYSE" },
  { date: "2025-06-19", name: "Juneteenth", exchange: "NYSE" },
  { date: "2025-07-04", name: "Independence Day", exchange: "NYSE" },
  { date: "2025-09-01", name: "Labor Day", exchange: "NYSE" },
  { date: "2025-11-27", name: "Thanksgiving Day", exchange: "NYSE" },
  { date: "2025-11-28", name: "Day After Thanksgiving", exchange: "NYSE", earlyClose: true },
  { date: "2025-12-25", name: "Christmas Day", exchange: "NYSE" },
  { date: "2026-01-01", name: "New Year's Day", exchange: "NYSE" },
  { date: "2026-01-19", name: "Martin Luther King Jr. Day", exchange: "NYSE" },
  { date: "2026-02-16", name: "Presidents' Day", exchange: "NYSE" },
  { date: "2026-04-03", name: "Good Friday", exchange: "NYSE" },
  { date: "2026-05-25", name: "Memorial Day", exchange: "NYSE" },
  { date: "2026-06-19", name: "Juneteenth", exchange: "NYSE" },
  { date: "2026-07-03", name: "Independence Day (Observed)", exchange: "NYSE" },
  { date: "2026-09-07", name: "Labor Day", exchange: "NYSE" },
  { date: "2026-11-26", name: "Thanksgiving Day", exchange: "NYSE" },
  { date: "2026-12-25", name: "Christmas Day", exchange: "NYSE" },
];

export function getUpcomingHolidays(holidays: TradingHoliday[], count = 5): TradingHoliday[] {
  const today = new Date().toISOString().slice(0, 10);
  return holidays.filter((h) => h.date >= today).slice(0, count);
}

export function isPastHoliday(date: string): boolean {
  return date < new Date().toISOString().slice(0, 10);
}
