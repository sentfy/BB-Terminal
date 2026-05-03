// ── Types ──

export type TemperatureUnit = "fahrenheit" | "celsius";

export interface WeatherModel {
  id: string;
  name: string;
  endpoint: string;
  modelParam?: string;
  color: string;
  org: string;
  supportsCurrent: boolean;
  supportsDaily: boolean;
}

export interface MarketCity {
  name: string;
  lat: number;
  lon: number;
  tz: string;
  exchange: string;
}

export interface UsCity {
  name: string;
  abbrev: string;
  lat: number;
  lon: number;
}

export interface UsPort {
  name: string;
  lat: number;
  lon: number;
  type: "energy" | "container" | "mixed";
}

export interface UsPipeline {
  name: string;
  type: "oil" | "gas" | "refined";
  points: [number, number][]; // [lat, lon][]
}

export interface UsRefinery {
  name: string;
  lat: number;
  lon: number;
  operator: string;
  capacity: number; // bpd
}

export interface UsPowerPlant {
  name: string;
  lat: number;
  lon: number;
  fuel: "nuclear" | "gas" | "coal" | "hydro" | "wind" | "solar";
  capacity: number; // MW
}

export interface WxCurrentData {
  temperature_2m: number | null;
  relative_humidity_2m: number | null;
  apparent_temperature: number | null;
  precipitation: number | null;
  weather_code: number | null;
  wind_speed_10m: number | null;
  wind_direction_10m: number | null;
  pressure_msl: number | null;
  cloud_cover: number | null;
}

export interface WxDailyData {
  time: string[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_sum: (number | null)[];
  wind_speed_10m_max: (number | null)[];
  weather_code: (number | null)[];
}

export interface WxHourlyData {
  time: string[];
  temperature_2m: (number | null)[];
}

export interface ModelForecast {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current?: WxCurrentData;
  hourly: WxHourlyData;
  daily?: WxDailyData;
}

// ── Static Data ──

const OPEN_METEO = "https://api.open-meteo.com";

export const WEATHER_MODELS: WeatherModel[] = [
  { id: "best",  name: "Best Match", endpoint: "/v1/forecast",  color: "#ffffff", org: "Open-Meteo",     supportsCurrent: true,  supportsDaily: true },
  { id: "ecmwf", name: "ECMWF IFS",  endpoint: "/v1/ecmwf",    color: "#ff8c00", org: "ECMWF",          supportsCurrent: false, supportsDaily: true },
  { id: "gfs",   name: "GFS",         endpoint: "/v1/gfs",      color: "#22ccee", org: "NOAA",           supportsCurrent: true,  supportsDaily: true },
  { id: "icon",  name: "ICON",        endpoint: "/v1/dwd-icon", color: "#22ee22", org: "DWD",            supportsCurrent: true,  supportsDaily: true },
  { id: "ukmo",  name: "UKMO",        endpoint: "/v1/forecast", modelParam: "ukmo_seamless", color: "#ff69b4", org: "UK Met Office", supportsCurrent: true, supportsDaily: true },
  { id: "gem",   name: "GEM",         endpoint: "/v1/forecast", modelParam: "gem_seamless",  color: "#ffaa33", org: "ECCC",          supportsCurrent: true, supportsDaily: true },
];

export const MARKET_CITIES: MarketCity[] = [
  { name: "New York",  lat: 40.71, lon: -74.01, tz: "America/New_York",    exchange: "NYSE" },
  { name: "Chicago",   lat: 41.88, lon: -87.63, tz: "America/Chicago",     exchange: "CME" },
  { name: "Houston",   lat: 29.76, lon: -95.37, tz: "America/Chicago",     exchange: "ICE" },
  { name: "London",    lat: 51.51, lon: -0.13,  tz: "Europe/London",       exchange: "LSE" },
  { name: "Frankfurt", lat: 50.11, lon: 8.68,   tz: "Europe/Berlin",       exchange: "EUREX" },
  { name: "Tokyo",     lat: 35.68, lon: 139.69, tz: "Asia/Tokyo",          exchange: "TSE" },
  { name: "Singapore", lat: 1.35,  lon: 103.82, tz: "Asia/Singapore",      exchange: "SGX" },
  { name: "Sydney",    lat: -33.87, lon: 151.21, tz: "Australia/Sydney",   exchange: "ASX" },
  { name: "São Paulo", lat: -23.55, lon: -46.63, tz: "America/Sao_Paulo", exchange: "B3" },
  { name: "Dubai",     lat: 25.20, lon: 55.27,  tz: "Asia/Dubai",          exchange: "DFM" },
];

export const US_CITIES: UsCity[] = [
  { name: "New York",      abbrev: "NYC", lat: 40.71, lon: -74.01 },
  { name: "Los Angeles",   abbrev: "LA",  lat: 34.05, lon: -118.24 },
  { name: "Chicago",       abbrev: "CHI", lat: 41.88, lon: -87.63 },
  { name: "Houston",       abbrev: "HOU", lat: 29.76, lon: -95.37 },
  { name: "Phoenix",       abbrev: "PHX", lat: 33.45, lon: -112.07 },
  { name: "Philadelphia",  abbrev: "PHL", lat: 39.95, lon: -75.17 },
  { name: "San Antonio",   abbrev: "SAT", lat: 29.42, lon: -98.49 },
  { name: "San Diego",     abbrev: "SD",  lat: 32.72, lon: -117.16 },
  { name: "Dallas",        abbrev: "DFW", lat: 32.78, lon: -96.80 },
  { name: "Austin",        abbrev: "AUS", lat: 30.27, lon: -97.74 },
  { name: "Jacksonville",  abbrev: "JAX", lat: 30.33, lon: -81.66 },
  { name: "San Francisco", abbrev: "SFO", lat: 37.77, lon: -122.42 },
  { name: "Seattle",       abbrev: "SEA", lat: 47.61, lon: -122.33 },
  { name: "Denver",        abbrev: "DEN", lat: 39.74, lon: -104.99 },
  { name: "Washington DC", abbrev: "DC",  lat: 38.91, lon: -77.04 },
  { name: "Nashville",     abbrev: "BNA", lat: 36.16, lon: -86.78 },
  { name: "Boston",        abbrev: "BOS", lat: 42.36, lon: -71.06 },
  { name: "Detroit",       abbrev: "DTW", lat: 42.33, lon: -83.05 },
  { name: "Atlanta",       abbrev: "ATL", lat: 33.75, lon: -84.39 },
  { name: "Miami",         abbrev: "MIA", lat: 25.76, lon: -80.19 },
  { name: "Minneapolis",   abbrev: "MSP", lat: 44.98, lon: -93.27 },
  { name: "New Orleans",   abbrev: "MSY", lat: 29.95, lon: -90.07 },
  { name: "Portland",      abbrev: "PDX", lat: 45.52, lon: -122.68 },
  { name: "Las Vegas",     abbrev: "LAS", lat: 36.17, lon: -115.14 },
  { name: "Kansas City",   abbrev: "MCI", lat: 39.10, lon: -94.58 },
  { name: "Salt Lake City", abbrev: "SLC", lat: 40.76, lon: -111.89 },
  { name: "Tampa",         abbrev: "TPA", lat: 27.95, lon: -82.46 },
  { name: "Charlotte",     abbrev: "CLT", lat: 35.23, lon: -80.84 },
  { name: "Pittsburgh",    abbrev: "PIT", lat: 40.44, lon: -79.99 },
  { name: "Billings",      abbrev: "BIL", lat: 45.78, lon: -108.50 },
];

export const US_PORTS: UsPort[] = [
  { name: "Houston",         lat: 29.73, lon: -95.02, type: "energy" },
  { name: "Long Beach",      lat: 33.75, lon: -118.19, type: "container" },
  { name: "New York/NJ",     lat: 40.67, lon: -74.04, type: "mixed" },
  { name: "Savannah",        lat: 32.08, lon: -81.09, type: "container" },
  { name: "New Orleans",     lat: 29.93, lon: -90.02, type: "energy" },
  { name: "Norfolk",         lat: 36.85, lon: -76.29, type: "mixed" },
  { name: "Charleston",      lat: 32.78, lon: -79.93, type: "container" },
  { name: "Seattle/Tacoma",  lat: 47.27, lon: -122.41, type: "container" },
  { name: "Oakland",         lat: 37.80, lon: -122.30, type: "container" },
  { name: "Baltimore",       lat: 39.26, lon: -76.58, type: "mixed" },
  { name: "Miami",           lat: 25.77, lon: -80.17, type: "container" },
  { name: "Philadelphia",    lat: 39.89, lon: -75.14, type: "energy" },
];

export const US_PIPELINES: UsPipeline[] = [
  {
    name: "Colonial",
    type: "refined",
    points: [[29.76, -95.37], [30.45, -91.19], [32.37, -86.30], [33.75, -84.39], [35.23, -80.84], [36.85, -76.29], [38.91, -77.04], [39.95, -75.17], [40.67, -74.18]],
  },
  {
    name: "Keystone",
    type: "oil",
    points: [[48.80, -110.00], [46.80, -104.80], [42.50, -97.40], [40.10, -96.70], [36.12, -96.00], [33.60, -96.60], [30.50, -96.40], [29.76, -95.37]],
  },
  {
    name: "Transco",
    type: "gas",
    points: [[30.10, -93.70], [30.45, -91.19], [32.37, -86.30], [33.75, -84.39], [35.23, -80.84], [37.27, -79.94], [38.91, -77.04], [39.95, -75.17], [40.71, -74.01]],
  },
  {
    name: "Rockies Express",
    type: "gas",
    points: [[41.27, -110.00], [41.30, -106.30], [41.10, -102.00], [40.80, -99.30], [39.80, -96.50], [39.10, -92.00], [39.20, -87.50], [39.40, -84.30], [39.80, -81.20]],
  },
  {
    name: "El Paso",
    type: "gas",
    points: [[31.50, -103.50], [32.20, -106.75], [32.22, -110.97], [33.45, -112.07], [34.50, -114.30], [34.05, -118.24]],
  },
  {
    name: "Southern Natural",
    type: "gas",
    points: [[30.00, -93.80], [30.45, -91.19], [31.00, -89.50], [32.30, -86.80], [33.52, -86.81], [33.75, -84.39]],
  },
];

export const US_REFINERIES: UsRefinery[] = [
  { name: "Port Arthur",    lat: 29.90, lon: -93.93, operator: "Motiva",     capacity: 630000 },
  { name: "Galveston Bay",  lat: 29.38, lon: -94.90, operator: "Marathon",   capacity: 593000 },
  { name: "Baytown",        lat: 29.74, lon: -95.01, operator: "ExxonMobil", capacity: 560000 },
  { name: "Baton Rouge",    lat: 30.45, lon: -91.19, operator: "ExxonMobil", capacity: 502000 },
  { name: "Garyville",      lat: 30.06, lon: -90.62, operator: "Marathon",   capacity: 578000 },
  { name: "Lake Charles",   lat: 30.23, lon: -93.22, operator: "Citgo",      capacity: 425000 },
  { name: "Whiting",        lat: 41.68, lon: -87.49, operator: "BP",         capacity: 435000 },
  { name: "Wood River",     lat: 38.87, lon: -90.07, operator: "Phillips 66", capacity: 346000 },
  { name: "El Segundo",     lat: 33.92, lon: -118.41, operator: "Chevron",   capacity: 290000 },
  { name: "Philadelphia",   lat: 39.91, lon: -75.25, operator: "PBF Energy", capacity: 335000 },
];

export const US_POWER_PLANTS: UsPowerPlant[] = [
  { name: "Palo Verde",     lat: 33.39, lon: -112.86, fuel: "nuclear", capacity: 3937 },
  { name: "Grand Coulee",   lat: 47.96, lon: -118.98, fuel: "hydro",   capacity: 6809 },
  { name: "West County",    lat: 26.78, lon: -80.09,  fuel: "gas",     capacity: 3750 },
  { name: "Scherer",        lat: 33.06, lon: -83.77,  fuel: "coal",    capacity: 3564 },
  { name: "Roscoe Wind",    lat: 32.45, lon: -100.54, fuel: "wind",    capacity: 781 },
  { name: "STP Nuclear",    lat: 28.80, lon: -96.05,  fuel: "nuclear", capacity: 2708 },
  { name: "Ivanpah Solar",  lat: 35.56, lon: -115.47, fuel: "solar",   capacity: 392 },
  { name: "Diablo Canyon",  lat: 35.21, lon: -120.85, fuel: "nuclear", capacity: 2256 },
  { name: "Martin",         lat: 27.04, lon: -80.55,  fuel: "gas",     capacity: 3000 },
  { name: "Comanche Peak",  lat: 32.30, lon: -97.79,  fuel: "nuclear", capacity: 2430 },
];

// ── WMO Weather Codes ──

const WMO: Record<number, { desc: string; icon: string }> = {
  0:  { desc: "Clear",           icon: "CLR" },
  1:  { desc: "Mainly Clear",    icon: "FEW" },
  2:  { desc: "Partly Cloudy",   icon: "SCT" },
  3:  { desc: "Overcast",        icon: "OVC" },
  45: { desc: "Fog",             icon: "FG" },
  48: { desc: "Rime Fog",        icon: "FZFG" },
  51: { desc: "Light Drizzle",   icon: "DZ-" },
  53: { desc: "Drizzle",         icon: "DZ" },
  55: { desc: "Heavy Drizzle",   icon: "DZ+" },
  56: { desc: "Frzg Drizzle Lt", icon: "FZDZ-" },
  57: { desc: "Frzg Drizzle",    icon: "FZDZ" },
  61: { desc: "Light Rain",      icon: "RA-" },
  63: { desc: "Rain",            icon: "RA" },
  65: { desc: "Heavy Rain",      icon: "RA+" },
  66: { desc: "Frzg Rain Lt",    icon: "FZRA-" },
  67: { desc: "Frzg Rain",       icon: "FZRA" },
  71: { desc: "Light Snow",      icon: "SN-" },
  73: { desc: "Snow",            icon: "SN" },
  75: { desc: "Heavy Snow",      icon: "SN+" },
  77: { desc: "Snow Grains",     icon: "SG" },
  80: { desc: "Rain Showers Lt", icon: "SHRA-" },
  81: { desc: "Rain Showers",    icon: "SHRA" },
  82: { desc: "Rain Showers Hv", icon: "SHRA+" },
  85: { desc: "Snow Showers Lt", icon: "SHSN-" },
  86: { desc: "Snow Showers",    icon: "SHSN" },
  95: { desc: "Thunderstorm",    icon: "TS" },
  96: { desc: "Tstm w/ Hail Lt", icon: "TSGR-" },
  99: { desc: "Tstm w/ Hail",    icon: "TSGR" },
};

export function wmoDescription(code: number | null | undefined): string {
  if (code == null) return "—";
  return WMO[code]?.desc ?? `WMO ${code}`;
}

export function wmoIcon(code: number | null | undefined): string {
  if (code == null) return "—";
  return WMO[code]?.icon ?? "??";
}

// ── Helpers ──

export function windDirLabel(deg: number | null | undefined): string {
  if (deg == null) return "";
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

/** Convert lat/lon to SVG coordinates for CONUS map (viewBox 0 0 960 600) */
export function geoToSvg(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon - (-130)) / ((-65) - (-130))) * 960;
  const y = ((50 - lat) / (50 - 24)) * 600;
  return { x, y };
}

/** Temperature to color gradient (blue→cyan→green→yellow→red) */
export function tempColor(temp: number | null | undefined, units: TemperatureUnit): string {
  if (temp == null) return "#6e6e6e";
  // Normalize to 0–1 range based on expected temperature range
  const lo = units === "fahrenheit" ? 0 : -18;
  const hi = units === "fahrenheit" ? 110 : 43;
  const t = Math.max(0, Math.min(1, (temp - lo) / (hi - lo)));
  // 5-stop gradient: blue → cyan → green → yellow → red
  if (t < 0.25) return lerpColor("#3b82f6", "#22ccee", t / 0.25);
  if (t < 0.5)  return lerpColor("#22ccee", "#22ee22", (t - 0.25) / 0.25);
  if (t < 0.75) return lerpColor("#22ee22", "#eab308", (t - 0.5) / 0.25);
  return lerpColor("#eab308", "#ff3b3b", (t - 0.75) / 0.25);
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

// Simplified US outline SVG path (continental)
export const US_OUTLINE = "M 70 155 L 80 135 L 95 120 L 118 110 L 135 105 L 152 100 L 180 98 L 210 102 L 240 95 L 260 98 L 285 92 L 310 90 L 330 95 L 350 98 L 380 93 L 405 95 L 410 105 L 400 115 L 410 130 L 430 140 L 450 135 L 470 130 L 485 140 L 500 138 L 520 130 L 535 125 L 550 130 L 555 140 L 570 150 L 580 155 L 600 152 L 620 145 L 640 140 L 660 135 L 680 130 L 695 128 L 710 125 L 730 128 L 745 135 L 760 138 L 780 142 L 795 148 L 810 155 L 825 158 L 840 160 L 852 165 L 860 172 L 855 180 L 860 192 L 850 200 L 845 215 L 838 220 L 830 230 L 825 245 L 832 255 L 838 265 L 830 275 L 825 290 L 830 300 L 838 310 L 835 320 L 830 335 L 840 345 L 845 355 L 850 370 L 843 380 L 835 390 L 840 400 L 855 410 L 860 420 L 855 430 L 845 438 L 838 445 L 825 450 L 810 455 L 795 460 L 780 458 L 765 465 L 750 470 L 735 478 L 715 482 L 700 488 L 680 492 L 660 490 L 640 488 L 622 492 L 600 498 L 580 500 L 560 498 L 540 502 L 520 510 L 510 518 L 498 522 L 485 518 L 475 525 L 460 528 L 445 530 L 425 525 L 408 520 L 392 515 L 378 510 L 360 505 L 345 510 L 328 515 L 310 518 L 295 520 L 278 515 L 260 510 L 245 505 L 228 498 L 215 490 L 205 480 L 192 472 L 180 465 L 165 458 L 150 455 L 135 460 L 125 468 L 115 475 L 100 480 L 85 485 L 70 490 L 58 492 L 50 488 L 42 480 L 38 470 L 35 458 L 30 445 L 28 430 L 32 415 L 30 400 L 25 385 L 22 370 L 28 355 L 30 340 L 28 325 L 32 310 L 35 295 L 32 280 L 28 265 L 32 250 L 38 235 L 42 220 L 48 205 L 52 190 L 58 175 L 65 165 Z";

// ── API Fetcher ──

export async function fetchModelForecast(
  model: WeatherModel,
  lat: number,
  lon: number,
  units: TemperatureUnit
): Promise<ModelForecast> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: "auto",
    temperature_unit: units,
    wind_speed_unit: units === "fahrenheit" ? "mph" : "kmh",
    precipitation_unit: units === "fahrenheit" ? "inch" : "mm",
  });

  if (model.supportsCurrent) {
    params.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,cloud_cover");
  }
  params.set("hourly", "temperature_2m");
  if (model.supportsDaily) {
    params.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code");
  }
  if (model.modelParam) {
    params.set("models", model.modelParam);
  }

  const res = await fetch(`${OPEN_METEO}${model.endpoint}?${params}`);
  if (!res.ok) throw new Error(`${model.name}: ${res.status} ${res.statusText}`);
  return res.json();
}

/** Fetch current conditions for a single city (uses Best Match model) */
export async function fetchCityCurrent(
  lat: number,
  lon: number,
  units: TemperatureUnit
): Promise<{ temperature_2m: number | null; weather_code: number | null }> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,weather_code",
    timezone: "auto",
    temperature_unit: units,
  });
  const res = await fetch(`${OPEN_METEO}/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Weather: ${res.status}`);
  const data = await res.json();
  return data.current ?? { temperature_2m: null, weather_code: null };
}

// ── RainViewer (free radar / satellite tiles, no API key) ──

export interface RainViewerFrame {
  time: number;
  path: string;
}

export interface RainViewerMaps {
  host: string;
  radar: { past: RainViewerFrame[]; nowcast: RainViewerFrame[] };
  satellite: { infrared: RainViewerFrame[] };
}

/** Fetch available radar + satellite timestamps from RainViewer */
export async function fetchRainViewerMaps(): Promise<RainViewerMaps> {
  const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
  if (!res.ok) throw new Error(`RainViewer: ${res.status}`);
  return res.json();
}
