// EIA API v2 — Free energy data (requires API key from eia.gov/opendata)

const EIA_BASE = "https://api.eia.gov/v2";

export interface EiaDataPoint {
  period: string;
  value: number | null;
}

export interface EiaSeries {
  label: string;
  unit: string;
  data: EiaDataPoint[];
}

export interface RefineryUtilization {
  period: string;
  padd: string;
  value: number | null; // percent
}

export interface PetroleumStock {
  period: string;
  product: string;
  value: number | null; // thousand barrels
}

export interface NatGasStorage {
  period: string;
  region: string;
  value: number | null; // billion cubic feet
}

export interface ElectricityGeneration {
  period: string;
  fuelType: string;
  value: number | null; // MWh
}

// Generic EIA v2 fetcher
async function eiaGet<T>(
  route: string,
  params: Record<string, string>,
  apiKey: string
): Promise<T[]> {
  const qs = new URLSearchParams({ api_key: apiKey, ...params });
  const res = await fetch(`${EIA_BASE}/${route}/data/?${qs}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`EIA ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.response?.data ?? [];
}

export async function fetchRefineryUtilization(apiKey: string): Promise<RefineryUtilization[]> {
  const raw = await eiaGet<any>(
    "petroleum/pnp/wiup",
    {
      frequency: "weekly",
      "data[0]": "value",
      "sort[0][column]": "period",
      "sort[0][direction]": "desc",
      length: "52",
      "facets[duoarea][]": "NUS",
      "facets[process][]": "YUP",
    },
    apiKey
  );
  return raw.map((r: any) => ({
    period: r.period,
    padd: r.duoarea ?? "US",
    value: r.value != null ? Number(r.value) : null,
  }));
}

export async function fetchPetroleumStocks(apiKey: string): Promise<PetroleumStock[]> {
  const raw = await eiaGet<any>(
    "petroleum/stoc/wstk",
    {
      frequency: "weekly",
      "data[0]": "value",
      "sort[0][column]": "period",
      "sort[0][direction]": "desc",
      length: "52",
      "facets[duoarea][]": "NUS",
      "facets[product][]": "EPC0",
      "facets[process][]": "SAX",
    },
    apiKey
  );
  return raw.map((r: any) => ({
    period: r.period,
    product: r.product ?? "Crude",
    value: r.value != null ? Number(r.value) : null,
  }));
}

export async function fetchNatGasStorage(apiKey: string): Promise<NatGasStorage[]> {
  const raw = await eiaGet<any>(
    "natural-gas/stor/wkly",
    {
      frequency: "weekly",
      "data[0]": "value",
      "sort[0][column]": "period",
      "sort[0][direction]": "desc",
      length: "52",
      "facets[process][]": "SWO",
      "facets[duoarea][]": "R48",
    },
    apiKey
  );
  return raw.map((r: any) => ({
    period: r.period,
    region: r.duoarea ?? "US",
    value: r.value != null ? Number(r.value) : null,
  }));
}

export async function fetchElectricityGeneration(apiKey: string): Promise<ElectricityGeneration[]> {
  const raw = await eiaGet<any>(
    "electricity/rto/fuel-type-data",
    {
      frequency: "hourly",
      "data[0]": "value",
      "sort[0][column]": "period",
      "sort[0][direction]": "desc",
      length: "1344",
      "facets[respondent][]": "US48",
    },
    apiKey
  );
  return raw.map((r: any) => ({
    period: r.period,
    fuelType: r.fueltype ?? r["type-name"] ?? "Unknown",
    value: r.value != null ? Number(r.value) : null,
  }));
}
