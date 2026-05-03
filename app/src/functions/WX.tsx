import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, ColorType, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { useQueries, useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Polyline, Marker, Tooltip as LTooltip } from "react-leaflet";
import L from "leaflet";
import {
  WEATHER_MODELS, MARKET_CITIES, US_CITIES, US_PORTS, US_PIPELINES,
  US_REFINERIES, US_POWER_PLANTS, tempColor,
  fetchModelForecast, fetchCityCurrent, fetchRainViewerMaps,
  wmoDescription, wmoIcon, windDirLabel,
  type TemperatureUnit, type MarketCity, type ModelForecast,
} from "@/lib/weather";
import {
  fetchRefineryUtilization, fetchPetroleumStocks,
  fetchNatGasStorage, fetchElectricityGeneration,
  type RefineryUtilization, type PetroleumStock, type NatGasStorage, type ElectricityGeneration,
} from "@/lib/eia";
import { useSettings } from "@/store/settingsStore";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { cn } from "@/lib/cn";

type WxTab = "US MAP" | "FORECAST" | "INFRA" | "RADAR";
const TABS: WxTab[] = ["US MAP", "FORECAST", "INFRA", "RADAR"];

export function WX() {
  const [tab, setTab] = useState<WxTab>("US MAP");
  const [city, setCity] = useState<MarketCity>(MARKET_CITIES[0]);
  const [units, setUnits] = useState<TemperatureUnit>("fahrenheit");

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar + global controls */}
      <div className="flex items-center gap-1 px-3 h-8 border-b border-term-border bg-term-panel2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("text-[10px] px-2 py-0.5 border uppercase tracking-wider",
              t === tab ? "border-term-amber text-term-amber" : "border-transparent text-term-muted hover:text-term-text")}>
            {t}
          </button>
        ))}
        <span className="text-term-muted mx-1">|</span>
        <button onClick={() => setUnits(units === "fahrenheit" ? "celsius" : "fahrenheit")}
          className="text-[10px] px-1.5 py-0.5 border border-term-border text-term-amber hover:bg-term-amberSubtle">
          {units === "fahrenheit" ? "°F" : "°C"}
        </button>
      </div>

      <ErrorBoundary label={tab} key={tab}>
        {tab === "US MAP" && <UsMapTab units={units} onSelectCity={(c) => { setCity(c); setTab("FORECAST"); }} />}
        {tab === "FORECAST" && <ForecastTab city={city} setCity={setCity} units={units} />}
        {tab === "INFRA" && <InfraTab />}
        {tab === "RADAR" && <RadarTab />}
      </ErrorBoundary>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// FORECAST TAB
// ════════════════════════════════════════════════════════════════════════

function ForecastTab({ city, setCity, units }: {
  city: MarketCity; setCity: (c: MarketCity) => void; units: TemperatureUnit;
}) {
  const [selectedModel, setSelectedModel] = useState("best");
  const unitLabel = units === "fahrenheit" ? "F" : "C";
  const windUnit = units === "fahrenheit" ? "mph" : "km/h";
  const precipUnit = units === "fahrenheit" ? "in" : "mm";

  // Fetch all models in parallel
  const modelQueries = useQueries({
    queries: WEATHER_MODELS.map((m) => ({
      queryKey: ["wx", m.id, city.lat, city.lon, units],
      queryFn: () => fetchModelForecast(m, city.lat, city.lon, units),
      staleTime: 300_000,
      refetchInterval: 300_000,
    })),
  });

  // Chart
  const chartRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ISeriesApi<"Line">[]>([]);

  useEffect(() => {
    if (!chartRef.current) return;
    try {
      const chart = createChart(chartRef.current, {
        layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#8a8a8a", fontFamily: "JetBrains Mono, monospace", fontSize: 11 },
        rightPriceScale: { borderColor: "#2a2a2a" },
        timeScale: { borderColor: "#2a2a2a", timeVisible: true },
        grid: { vertLines: { color: "rgba(42,42,42,0.5)" }, horzLines: { color: "rgba(42,42,42,0.5)" } },
        crosshair: {
          vertLine: { color: "#ff8c00", width: 1 as const, style: 3, labelBackgroundColor: "#ff8c00" },
          horzLine: { color: "#ff8c00", width: 1 as const, style: 3, labelBackgroundColor: "#ff8c00" },
        },
        autoSize: true,
      });
      chartApiRef.current = chart;
      return () => { chart.remove(); chartApiRef.current = null; };
    } catch (e) { console.error("[ForecastTab] chart init error:", e); }
  }, []);

  useEffect(() => {
    const chart = chartApiRef.current;
    if (!chart) return;
    try {
      seriesRefs.current.forEach((s) => chart.removeSeries(s));
      seriesRefs.current = [];

      WEATHER_MODELS.forEach((model, i) => {
        const data = modelQueries[i]?.data as ModelForecast | undefined;
        if (!data?.hourly?.time?.length) return;
        const points = data.hourly.time
          .map((t, j) => {
            const temp = data.hourly.temperature_2m[j];
            if (temp == null || isNaN(new Date(t).getTime())) return null;
            return { time: Math.floor(new Date(t).getTime() / 1000) as UTCTimestamp, value: temp };
          })
          .filter(Boolean) as { time: UTCTimestamp; value: number }[];
        if (points.length < 2) return;
        const series = chart.addLineSeries({
          color: model.color,
          lineWidth: model.id === "best" ? 1 : 2,
          title: model.name,
          ...(model.id === "best" ? { lineStyle: 2 } : {}),
        });
        series.setData(points);
        seriesRefs.current.push(series);
      });
      chart.timeScale().fitContent();
    } catch (e) { console.error("[ForecastTab] chart data error:", e); }
  }, [modelQueries.map((q) => q.dataUpdatedAt).join(",")]);

  const bestData = modelQueries[0]?.data as ModelForecast | undefined;
  const current = bestData?.current;
  const selIdx = WEATHER_MODELS.findIndex((m) => m.id === selectedModel);
  const selData = modelQueries[selIdx]?.data as ModelForecast | undefined;

  // Model spread
  const spread = useMemo(() => {
    const days: { date: string; range: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const his: number[] = [];
      let date = "";
      WEATHER_MODELS.forEach((_, i) => {
        const data = modelQueries[i]?.data as ModelForecast | undefined;
        if (!data?.daily?.time?.[d]) return;
        if (!date) date = data.daily.time[d];
        const hi = data.daily.temperature_2m_max[d];
        if (hi != null) his.push(hi);
      });
      if (date && his.length > 1) days.push({ date, range: Math.max(...his) - Math.min(...his) });
    }
    return days;
  }, [modelQueries.map((q) => q.dataUpdatedAt).join(",")]);

  const isLoading = modelQueries.some((q) => q.isLoading);

  return (
    <>
      {/* City selector */}
      <div className="flex items-center gap-1 px-3 h-7 border-b border-term-borderSoft bg-term-panel overflow-x-auto scroll-thin">
        <span className="text-[10px] uppercase tracking-wider text-term-muted shrink-0">CITY</span>
        {MARKET_CITIES.map((c) => (
          <button key={c.name} onClick={() => setCity(c)}
            className={cn("text-[10px] px-1.5 py-0.5 border shrink-0",
              c.name === city.name ? "border-term-amber text-term-amber" : "border-transparent text-term-muted hover:text-term-text")}>
            {c.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Current conditions */}
      <div className="flex items-center gap-4 px-3 py-2 border-b border-term-border bg-term-bg2 overflow-x-auto scroll-thin">
        <div className="shrink-0">
          <div className="text-[10px] uppercase tracking-wider text-term-muted">{city.name} · {city.exchange}</div>
          <div className="num text-[22px] text-term-heading leading-tight">
            {current?.temperature_2m != null ? `${current.temperature_2m.toFixed(1)}°${unitLabel}` : "—"}
          </div>
        </div>
        {current?.weather_code != null && (
          <div className="shrink-0 text-center">
            <div className="text-[10px] uppercase tracking-wider text-term-muted">WX</div>
            <div className="text-term-amber font-bold text-[14px] tracking-wider">{wmoIcon(current.weather_code)}</div>
          </div>
        )}
        {[
          { label: "FEELS", val: current?.apparent_temperature, s: `°${unitLabel}` },
          { label: "HUMID", val: current?.relative_humidity_2m, s: "%" },
          { label: "WIND", val: current?.wind_speed_10m, s: ` ${windUnit} ${windDirLabel(current?.wind_direction_10m)}` },
          { label: "PRECIP", val: current?.precipitation, s: ` ${precipUnit}` },
          { label: "PRESS", val: current?.pressure_msl, s: " hPa" },
          { label: "CLOUD", val: current?.cloud_cover, s: "%" },
        ].map((m) => (
          <div key={m.label} className="text-center shrink-0">
            <div className="text-[9px] uppercase tracking-wider text-term-muted">{m.label}</div>
            <div className="num text-[12px] text-term-text">{m.val != null ? `${m.val.toFixed(1)}${m.s}` : "—"}</div>
          </div>
        ))}
      </div>

      {/* Main: chart + table */}
      <div className="flex-1 flex min-h-0">
        {/* Chart */}
        <div className="flex-[3] flex flex-col min-w-0 border-r border-term-border">
          <div className="flex items-center gap-3 px-3 py-1 border-b border-term-borderSoft bg-term-panel">
            <span className="text-[9px] text-term-muted uppercase tracking-wider">TEMP FORECAST</span>
            {WEATHER_MODELS.map((m) => (
              <span key={m.id} className="flex items-center gap-1 text-[9px]">
                <span className="w-2 h-2 inline-block rounded-sm" style={{ backgroundColor: m.color }} />
                <span className="text-term-muted">{m.name}</span>
              </span>
            ))}
          </div>
          <div className="relative flex-1 min-h-[150px]">
            <div ref={chartRef} className="absolute inset-0" />
            {isLoading && <div className="absolute inset-0 flex items-center justify-center text-[11px] uppercase tracking-widest text-term-muted">LOADING…</div>}
          </div>
        </div>

        {/* Daily table */}
        <div className="flex-[2] flex flex-col min-w-0">
          <div className="flex items-center gap-1 px-2 py-1 border-b border-term-borderSoft bg-term-panel overflow-x-auto scroll-thin">
            {WEATHER_MODELS.map((m) => (
              <button key={m.id} onClick={() => setSelectedModel(m.id)}
                className={cn("text-[9px] px-1 py-0.5 border shrink-0",
                  m.id === selectedModel ? "border-term-amber text-term-amber" : "border-transparent text-term-muted hover:text-term-text")}>
                {m.name.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto scroll-thin">
            <table className="w-full grid-data text-[11px]">
              <thead>
                <tr><th>Date</th><th className="text-right">Hi</th><th className="text-right">Lo</th><th className="text-right">Wind</th><th className="text-right">Prcp</th><th>Wx</th></tr>
              </thead>
              <tbody>
                {selData?.daily?.time?.map((date, i) => (
                  <tr key={date}>
                    <td className="text-term-text">{new Date(date + "T12:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</td>
                    <td className="text-right num text-term-red">{selData.daily!.temperature_2m_max[i]?.toFixed(0) ?? "—"}°</td>
                    <td className="text-right num text-term-cyan">{selData.daily!.temperature_2m_min[i]?.toFixed(0) ?? "—"}°</td>
                    <td className="text-right num">{selData.daily!.wind_speed_10m_max[i]?.toFixed(0) ?? "—"}</td>
                    <td className="text-right num">{selData.daily!.precipitation_sum[i]?.toFixed(2) ?? "—"}</td>
                    <td className="text-term-amber">{wmoIcon(selData.daily!.weather_code[i])}</td>
                  </tr>
                )) ?? <tr><td colSpan={6} className="text-term-muted">No daily data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Spread footer */}
      <div className="border-t border-term-border bg-term-panel2 px-3 py-1">
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-term-muted uppercase tracking-wider shrink-0">MODEL SPREAD</span>
          {spread.slice(0, 5).map((d) => (
            <span key={d.date} className="flex items-center gap-1 shrink-0">
              <span className="text-term-muted">{new Date(d.date + "T12:00").toLocaleDateString(undefined, { weekday: "short" })}</span>
              <span className={cn("num", d.range > 8 ? "text-term-red" : d.range > 4 ? "text-term-amber" : "text-term-green")}>
                ±{d.range.toFixed(0)}°
              </span>
            </span>
          ))}
          <span className="ml-auto text-term-muted shrink-0">GRAPHCAST · CLIMAVISION — PREMIUM</span>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// US MAP TAB
// ════════════════════════════════════════════════════════════════════════

// Leaflet icon factories for infrastructure markers
function mkDivIcon(html: string, size: number): L.DivIcon {
  return L.divIcon({ className: "", html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}
const portIcon = (color: string) => mkDivIcon(
  `<svg width="12" height="12" viewBox="0 0 12 12"><rect x="2" y="2" width="8" height="8" fill="${color}" transform="rotate(45 6 6)" opacity="0.85"/></svg>`, 12
);
const refIcon = () => mkDivIcon(
  `<svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" fill="#ff3b3b" opacity="0.85"/></svg>`, 10
);
const pwrIcon = (color: string) => mkDivIcon(
  `<svg width="12" height="12" viewBox="0 0 12 12"><polygon points="6,1 1,11 11,11" fill="${color}" opacity="0.85"/></svg>`, 12
);

const PIPELINE_COLORS: Record<string, string> = { oil: "#ff3b3b", gas: "#22ccee", refined: "#ff8c00" };
const FUEL_COLORS: Record<string, string> = { nuclear: "#22ee22", gas: "#22ccee", coal: "#6e6e6e", hydro: "#3b82f6", wind: "#d0d0d0", solar: "#ff8c00" };

function UsMapTab({ units, onSelectCity }: {
  units: TemperatureUnit;
  onSelectCity: (c: MarketCity) => void;
}) {
  const [layers, setLayers] = useState({
    radar: true, satellite: false,
    pipelines: true, ports: true, refineries: true, power: true, temps: true,
  });
  const toggle = (key: keyof typeof layers) => setLayers((l) => ({ ...l, [key]: !l[key] }));

  // Fetch current temps for US cities
  const cityQueries = useQueries({
    queries: US_CITIES.map((c) => ({
      queryKey: ["wx-city", c.abbrev, units],
      queryFn: () => fetchCityCurrent(c.lat, c.lon, units),
      staleTime: 300_000,
      refetchInterval: 300_000,
    })),
  });

  // RainViewer radar + satellite tile timestamps
  const { data: rvMaps } = useQuery({
    queryKey: ["rainviewer-maps"],
    queryFn: fetchRainViewerMaps,
    staleTime: 120_000,
    refetchInterval: 120_000,
  });

  const rvHost = rvMaps?.host ?? "https://tilecache.rainviewer.com";
  const radarPath = rvMaps?.radar?.past?.slice(-1)[0]?.path ?? null;
  const satPath = rvMaps?.satellite?.infrared?.slice(-1)[0]?.path ?? null;
  const radarTime = rvMaps?.radar?.past?.slice(-1)[0]?.time;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Layer toggles */}
      <div className="flex items-center gap-3 px-3 py-1 border-b border-term-borderSoft bg-term-panel overflow-x-auto scroll-thin">
        <span className="text-[9px] text-term-muted uppercase tracking-wider shrink-0">WX</span>
        {(["radar", "satellite"] as const).map((k) => (
          <button key={k} onClick={() => toggle(k)}
            className={cn("text-[9px] px-1.5 py-0.5 border uppercase shrink-0",
              layers[k] ? "border-term-green text-term-green" : "border-term-border text-term-muted")}>
            {k}
          </button>
        ))}
        <span className="text-term-border shrink-0">│</span>
        <span className="text-[9px] text-term-muted uppercase tracking-wider shrink-0">INFRA</span>
        {(["pipelines", "ports", "refineries", "power", "temps"] as const).map((k) => (
          <button key={k} onClick={() => toggle(k)}
            className={cn("text-[9px] px-1.5 py-0.5 border uppercase shrink-0",
              layers[k] ? "border-term-amber text-term-amber" : "border-term-border text-term-muted")}>
            {k}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-[9px] text-term-muted shrink-0">
          <span>● City</span>
          <span>◆ Port</span>
          <span>■ Refinery</span>
          <span>▲ Power</span>
          <span>┈ Pipeline</span>
        </div>
      </div>

      {/* Leaflet Map */}
      <div className="flex-1 min-h-0">
        <MapContainer
          center={[39, -98]}
          zoom={5}
          minZoom={3}
          maxZoom={10}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com">CARTO</a> · <a href="https://osm.org">OSM</a>'
          />

          {/* RainViewer radar overlay */}
          {layers.radar && radarPath && (
            <TileLayer
              key={`radar-${radarPath}`}
              url={`${rvHost}${radarPath}/256/{z}/{x}/{y}/6/1_1.png`}
              opacity={0.55}
              zIndex={400}
            />
          )}

          {/* RainViewer satellite IR overlay */}
          {layers.satellite && satPath && (
            <TileLayer
              key={`sat-${satPath}`}
              url={`${rvHost}${satPath}/256/{z}/{x}/{y}/0/0_0.png`}
              opacity={0.4}
              zIndex={350}
            />
          )}

          {/* Pipelines */}
          {layers.pipelines && US_PIPELINES.map((p) => (
            <Polyline
              key={p.name}
              positions={p.points.map(([lat, lon]) => [lat, lon] as L.LatLngTuple)}
              pathOptions={{ color: PIPELINE_COLORS[p.type], weight: 2.5, dashArray: "8 4", opacity: 0.7 }}
            >
              <LTooltip direction="top" offset={[0, -6]}>
                <span style={{ color: PIPELINE_COLORS[p.type] }}>{p.name}</span> · {p.type}
              </LTooltip>
            </Polyline>
          ))}

          {/* Ports */}
          {layers.ports && US_PORTS.map((p) => {
            const color = p.type === "energy" ? "#ff8c00" : p.type === "container" ? "#22ccee" : "#d0d0d0";
            return (
              <Marker key={p.name} position={[p.lat, p.lon]} icon={portIcon(color)}>
                <LTooltip direction="top" offset={[0, -8]}>
                  <span style={{ color }}>◆ {p.name}</span> · {p.type}
                </LTooltip>
              </Marker>
            );
          })}

          {/* Refineries */}
          {layers.refineries && US_REFINERIES.map((r) => (
            <Marker key={r.name} position={[r.lat, r.lon]} icon={refIcon()}>
              <LTooltip direction="top" offset={[0, -8]}>
                <span style={{ color: "#ff3b3b" }}>■ {r.name}</span> · {r.operator} · {(r.capacity / 1000).toFixed(0)}k bpd
              </LTooltip>
            </Marker>
          ))}

          {/* Power Plants */}
          {layers.power && US_POWER_PLANTS.map((p) => {
            const color = FUEL_COLORS[p.fuel] || "#d0d0d0";
            return (
              <Marker key={p.name} position={[p.lat, p.lon]} icon={pwrIcon(color)}>
                <LTooltip direction="top" offset={[0, -8]}>
                  <span style={{ color }}>▲ {p.name}</span> · {p.fuel} · {p.capacity >= 1000 ? `${(p.capacity / 1000).toFixed(1)}GW` : `${p.capacity}MW`}
                </LTooltip>
              </Marker>
            );
          })}

          {/* City temperature dots */}
          {layers.temps && US_CITIES.map((c, i) => {
            const temp = cityQueries[i]?.data?.temperature_2m;
            const wxCode = cityQueries[i]?.data?.weather_code;
            const color = tempColor(temp, units);
            const mc = MARKET_CITIES.find((m) => Math.abs(m.lat - c.lat) < 0.5 && Math.abs(m.lon - c.lon) < 0.5);
            return (
              <CircleMarker
                key={c.abbrev}
                center={[c.lat, c.lon]}
                radius={7}
                pathOptions={{ fillColor: color, fillOpacity: 0.9, color: "#0a0a0a", weight: 1 }}
                eventHandlers={mc ? { click: () => onSelectCity(mc) } : {}}
              >
                <LTooltip permanent direction="top" offset={[0, -8]} className="wx-city-tooltip">
                  <span style={{ color: "#c0c0c0" }}>{c.abbrev}</span>
                  {temp != null && <span style={{ color, marginLeft: 3 }}>{temp.toFixed(0)}°</span>}
                  {wxCode != null && <span style={{ color: "#8a8a8a", marginLeft: 3 }}>{wmoIcon(wxCode)}</span>}
                </LTooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Status bar */}
      <div className="flex items-center px-3 py-1 border-t border-term-border bg-term-panel2 text-[9px] text-term-muted">
        <span>
          Radar: {radarTime ? new Date(radarTime * 1000).toLocaleTimeString() : "loading…"}
          {" · "}RainViewer · auto-refresh 2 min
        </span>
        <span className="ml-auto">
          Ship tracking (MarineTraffic), pipeline flow SCADA — premium · Map: CartoDB Dark Matter
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// INFRA TAB (EIA Data)
// ════════════════════════════════════════════════════════════════════════

type InfraSection = "petroleum" | "natgas" | "electricity";

function InfraTab() {
  const eiaKey = useSettings((s) => s.eiaApiKey);
  const setEiaKey = useSettings((s) => s.setEiaApiKey);
  const [section, setSection] = useState<InfraSection>("petroleum");
  const [keyInput, setKeyInput] = useState("");

  if (!eiaKey) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-[14px] text-term-heading uppercase tracking-wider">EIA API KEY REQUIRED</div>
        <div className="text-[11px] text-term-muted text-center max-w-md">
          The Infrastructure tab uses the U.S. Energy Information Administration API for live refinery utilization, petroleum stocks, natural gas storage, and electricity generation data.
          Register for a free API key at <span className="text-term-amber">eia.gov/opendata</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input value={keyInput} onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Paste EIA API key"
            className="bg-transparent border border-term-border text-term-text px-3 py-1 text-[11px] w-64 focus:border-term-amber outline-none" />
          <button onClick={() => { if (keyInput.trim()) { setEiaKey(keyInput.trim()); setKeyInput(""); } }}
            className="text-[10px] px-3 py-1 border border-term-amber text-term-amber hover:bg-term-amberSubtle uppercase tracking-wider">
            SAVE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Section tabs */}
      <div className="flex items-center gap-1 px-3 py-1 border-b border-term-borderSoft bg-term-panel">
        {(["petroleum", "natgas", "electricity"] as InfraSection[]).map((s) => (
          <button key={s} onClick={() => setSection(s)}
            className={cn("text-[10px] px-2 py-0.5 border uppercase tracking-wider",
              s === section ? "border-term-amber text-term-amber" : "border-transparent text-term-muted hover:text-term-text")}>
            {s === "natgas" ? "NATURAL GAS" : s.toUpperCase()}
          </button>
        ))}
      </div>

      <ErrorBoundary label={section.toUpperCase()} key={section}>
        {section === "petroleum" && <PetroleumPanel apiKey={eiaKey} />}
        {section === "natgas" && <NatGasPanel apiKey={eiaKey} />}
        {section === "electricity" && <ElectricityPanel apiKey={eiaKey} />}
      </ErrorBoundary>
    </div>
  );
}

function PetroleumPanel({ apiKey }: { apiKey: string }) {
  const { data: util, isLoading: uLoad, error: uErr } = useQuery({
    queryKey: ["eia-refutil", apiKey],
    queryFn: () => fetchRefineryUtilization(apiKey),
    staleTime: 600_000,
  });
  const { data: stocks, isLoading: sLoad, error: sErr } = useQuery({
    queryKey: ["eia-petstock", apiKey],
    queryFn: () => fetchPetroleumStocks(apiKey),
    staleTime: 600_000,
  });

  const chartRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    try {
      const chart = createChart(chartRef.current, {
        layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#8a8a8a", fontFamily: "JetBrains Mono, monospace", fontSize: 10 },
        rightPriceScale: { borderColor: "#2a2a2a" },
        timeScale: { borderColor: "#2a2a2a" },
        grid: { vertLines: { color: "rgba(42,42,42,0.5)" }, horzLines: { color: "rgba(42,42,42,0.5)" } },
        crosshair: { vertLine: { color: "#ff8c00", width: 1 as const, style: 3, labelBackgroundColor: "#ff8c00" }, horzLine: { color: "#ff8c00", width: 1 as const, style: 3, labelBackgroundColor: "#ff8c00" } },
        autoSize: true,
      });
      chartApiRef.current = chart;
      return () => { chart.remove(); chartApiRef.current = null; };
    } catch (e) { console.error("[PetroleumPanel] chart init error:", e); }
  }, []);

  useEffect(() => {
    const chart = chartApiRef.current;
    if (!chart || !util?.length) return;
    try {
      if (seriesRef.current) chart.removeSeries(seriesRef.current);
      const s = chart.addLineSeries({ color: "#ff8c00", lineWidth: 2, title: "Refinery Util %" });
      const points = [...util]
        .filter((d) => d.value != null && d.period && !isNaN(new Date(d.period).getTime()))
        .reverse()
        .map((d) => ({
          time: Math.floor(new Date(d.period).getTime() / 1000) as UTCTimestamp,
          value: d.value!,
        }));
      if (points.length > 0) {
        s.setData(points);
        seriesRef.current = s;
        chart.timeScale().fitContent();
      }
    } catch (e) { console.error("[PetroleumPanel] chart data error:", e); }
  }, [util]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {(uErr || sErr) && (
        <div className="px-3 py-2 border-b border-term-border bg-term-bg2 text-[11px] text-term-red">
          EIA Error: {(uErr as Error)?.message || (sErr as Error)?.message || "Failed to fetch data"}
        </div>
      )}
      {/* Summary cards */}
      <div className="flex items-center gap-4 px-3 py-2 border-b border-term-border bg-term-bg2">
        <MetricCard label="REFINERY UTIL" value={util?.[0]?.value != null ? `${util[0].value.toFixed(1)}%` : "—"} loading={uLoad} />
        <MetricCard label="CRUDE STOCKS" value={stocks?.[0]?.value != null ? `${(stocks[0].value / 1000).toFixed(1)}M bbl` : "—"} loading={sLoad} />
        <MetricCard label="LATEST" value={util?.[0]?.period ?? "—"} loading={uLoad} muted />
      </div>
      {/* Chart */}
      <div className="flex-1 relative min-h-[150px]">
        <div className="text-[10px] text-term-muted uppercase tracking-wider px-3 pt-1">US REFINERY UTILIZATION (52 WEEKS)</div>
        <div ref={chartRef} className="absolute inset-0 top-5" />
      </div>
      {/* Stocks table */}
      <div className="border-t border-term-border max-h-[35%] overflow-auto scroll-thin">
        <table className="w-full grid-data text-[11px]">
          <thead><tr><th>Period</th><th className="text-right">Crude Stocks (k bbl)</th></tr></thead>
          <tbody>
            {stocks?.slice(0, 20).map((s) => (
              <tr key={s.period}>
                <td className="text-term-text">{s.period}</td>
                <td className="text-right num">{s.value != null ? s.value.toLocaleString() : "—"}</td>
              </tr>
            )) ?? <tr><td colSpan={2} className="text-term-muted">Loading…</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NatGasPanel({ apiKey }: { apiKey: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["eia-ngasstor", apiKey],
    queryFn: () => fetchNatGasStorage(apiKey),
    staleTime: 600_000,
  });

  const chartRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    try {
      const chart = createChart(chartRef.current, {
        layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#8a8a8a", fontFamily: "JetBrains Mono, monospace", fontSize: 10 },
        rightPriceScale: { borderColor: "#2a2a2a" },
        timeScale: { borderColor: "#2a2a2a" },
        grid: { vertLines: { color: "rgba(42,42,42,0.5)" }, horzLines: { color: "rgba(42,42,42,0.5)" } },
        crosshair: { vertLine: { color: "#ff8c00", width: 1 as const, style: 3, labelBackgroundColor: "#ff8c00" }, horzLine: { color: "#ff8c00", width: 1 as const, style: 3, labelBackgroundColor: "#ff8c00" } },
        autoSize: true,
      });
      chartApiRef.current = chart;
      return () => { chart.remove(); chartApiRef.current = null; };
    } catch (e) { console.error("[NatGasPanel] chart init error:", e); }
  }, []);

  useEffect(() => {
    const chart = chartApiRef.current;
    if (!chart || !data?.length) return;
    try {
      if (seriesRef.current) chart.removeSeries(seriesRef.current);
      const s = chart.addLineSeries({ color: "#22ccee", lineWidth: 2, title: "Working Gas (Bcf)" });
      const points = [...data]
        .filter((d) => d.value != null && d.period && !isNaN(new Date(d.period).getTime()))
        .reverse()
        .map((d) => ({
          time: Math.floor(new Date(d.period).getTime() / 1000) as UTCTimestamp,
          value: d.value!,
        }));
      if (points.length > 0) {
        s.setData(points);
        seriesRef.current = s;
        chart.timeScale().fitContent();
      }
    } catch (e) { console.error("[NatGasPanel] chart data error:", e); }
  }, [data]);

  const latest = data?.[0];
  const prev = data?.[1];
  const change = latest?.value != null && prev?.value != null ? latest.value - prev.value : null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {error && (
        <div className="px-3 py-2 border-b border-term-border bg-term-bg2 text-[11px] text-term-red">
          EIA Error: {(error as Error)?.message || "Failed to fetch data"}
        </div>
      )}
      <div className="flex items-center gap-4 px-3 py-2 border-b border-term-border bg-term-bg2">
        <MetricCard label="STORAGE" value={latest?.value != null ? `${latest.value.toLocaleString()} Bcf` : "—"} loading={isLoading} />
        <MetricCard label="WEEKLY CHG" value={change != null ? `${change > 0 ? "+" : ""}${change.toLocaleString()} Bcf` : "—"} loading={isLoading} positive={change != null ? change > 0 : undefined} />
        <MetricCard label="LATEST" value={latest?.period ?? "—"} loading={isLoading} muted />
      </div>
      <div className="flex-1 relative min-h-[150px]">
        <div className="text-[10px] text-term-muted uppercase tracking-wider px-3 pt-1">WORKING GAS IN STORAGE (52 WEEKS)</div>
        <div ref={chartRef} className="absolute inset-0 top-5" />
      </div>
    </div>
  );
}

function ElectricityPanel({ apiKey }: { apiKey: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["eia-elecgen", apiKey],
    queryFn: () => fetchElectricityGeneration(apiKey),
    staleTime: 600_000,
  });

  // Aggregate by fuel type
  const byFuel = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    data.forEach((d) => {
      if (d.value != null) map.set(d.fuelType, (map.get(d.fuelType) ?? 0) + d.value);
    });
    return Array.from(map.entries())
      .map(([fuel, total]) => ({ fuel, total }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  const total = byFuel.reduce((s, f) => s + f.total, 0);
  const fuelColors: Record<string, string> = {
    NG: "#22ccee", NUC: "#22ee22", COL: "#6e6e6e", WND: "#d0d0d0",
    SUN: "#ff8c00", WAT: "#3b82f6", OTH: "#ff69b4", OIL: "#ff3b3b",
    PET: "#ff3b3b",
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {error && (
        <div className="px-3 py-2 border-b border-term-border bg-term-bg2 text-[11px] text-term-red">
          EIA Error: {(error as Error)?.message || "Failed to fetch data"}
        </div>
      )}
      <div className="flex items-center gap-4 px-3 py-2 border-b border-term-border bg-term-bg2">
        <MetricCard label="TOTAL GEN" value={total > 0 ? `${(total / 1000).toFixed(0)} GWh` : "—"} loading={isLoading} />
        <MetricCard label="PERIOD" value={data?.[0]?.period ?? "—"} loading={isLoading} muted />
      </div>

      {/* Fuel mix bar */}
      {total > 0 && (
        <div className="px-3 py-2 border-b border-term-borderSoft">
          <div className="flex h-4 rounded overflow-hidden">
            {byFuel.map((f) => (
              <div key={f.fuel} style={{ width: `${(f.total / total) * 100}%`, backgroundColor: fuelColors[f.fuel] ?? "#6e6e6e" }}
                title={`${f.fuel}: ${((f.total / total) * 100).toFixed(1)}%`} />
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto scroll-thin">
        <table className="w-full grid-data text-[11px]">
          <thead><tr><th>Fuel Type</th><th className="text-right">Generation (MWh)</th><th className="text-right">Share</th></tr></thead>
          <tbody>
            {byFuel.map((f) => (
              <tr key={f.fuel}>
                <td className="flex items-center gap-2">
                  <span className="w-2 h-2 inline-block rounded-sm" style={{ backgroundColor: fuelColors[f.fuel] ?? "#6e6e6e" }} />
                  <span className="text-term-text">{f.fuel}</span>
                </td>
                <td className="text-right num">{f.total.toLocaleString()}</td>
                <td className="text-right num text-term-amber">{total > 0 ? `${((f.total / total) * 100).toFixed(1)}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ label, value, loading, muted, positive }: {
  label: string; value: string; loading?: boolean; muted?: boolean; positive?: boolean;
}) {
  return (
    <div className="shrink-0">
      <div className="text-[9px] uppercase tracking-wider text-term-muted">{label}</div>
      <div className={cn("num text-[14px]",
        loading ? "text-term-muted" : muted ? "text-term-muted" : positive === true ? "text-term-green" : positive === false ? "text-term-red" : "text-term-heading")}>
        {loading ? "…" : value}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// RADAR TAB
// ════════════════════════════════════════════════════════════════════════

function RadarTab() {
  const [ts, setTs] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setTs(Date.now()), 300_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-3 px-3 py-1 border-b border-term-borderSoft bg-term-panel">
        <span className="text-[10px] text-term-muted uppercase tracking-wider">NOAA CONUS RADAR MOSAIC</span>
        <span className="text-[9px] num text-term-muted ml-auto">{new Date(ts).toLocaleTimeString()}</span>
        <button onClick={() => setTs(Date.now())} className="text-[9px] text-term-amber hover:text-term-amberBright uppercase">REFRESH</button>
      </div>
      <div className="flex-1 flex items-center justify-center bg-term-bg p-2">
        <img
          src={`https://radar.weather.gov/ridge/standard/CONUS-LARGE_0.gif?_=${ts}`}
          alt="NOAA CONUS Radar"
          className="max-w-full max-h-full object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
      <div className="px-3 py-1 border-t border-term-border bg-term-panel2 text-[9px] text-term-muted">
        Source: NOAA/NWS · radar.weather.gov · Auto-refreshes every 5 minutes
      </div>
    </div>
  );
}
