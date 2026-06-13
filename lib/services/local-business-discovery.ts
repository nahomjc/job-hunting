import { getCountryLabel } from "@/lib/jobs/hunt-preferences";
import { probeCompanyWebsite, type WebsiteStatus } from "@/lib/services/company-web-probe";

export interface LocalBusinessCandidate {
  id: string;
  name: string;
  category: string;
  address?: string;
  location: string;
  source: "osm";
  listingUrl: string;
  listedWebsite?: string;
  rawData?: Record<string, unknown>;
}

export interface LocalBusinessLead extends LocalBusinessCandidate {
  websiteStatus: WebsiteStatus;
  probedUrl?: string;
  needsWebsite: boolean;
  analysisNote: string;
}

const COUNTRY_META: Record<string, { name: string; capital: string }> = {
  ET: { name: "Ethiopia", capital: "Addis Ababa" },
  US: { name: "United States", capital: "New York" },
  GB: { name: "United Kingdom", capital: "London" },
  DE: { name: "Germany", capital: "Berlin" },
  PT: { name: "Portugal", capital: "Lisbon" },
  IN: { name: "India", capital: "Mumbai" },
  BR: { name: "Brazil", capital: "São Paulo" },
  CA: { name: "Canada", capital: "Toronto" },
  NL: { name: "Netherlands", capital: "Amsterdam" },
  FR: { name: "France", capital: "Paris" },
  ES: { name: "Spain", capital: "Madrid" },
  KE: { name: "Kenya", capital: "Nairobi" },
  NG: { name: "Nigeria", capital: "Lagos" },
  ZA: { name: "South Africa", capital: "Johannesburg" },
  AE: { name: "United Arab Emirates", capital: "Dubai" },
  AU: { name: "Australia", capital: "Sydney" },
};

const DEFAULT_TARGET_LEADS = 5;
const DEFAULT_MAX_CANDIDATES = 60;
const NOMINATIM_DELAY_MS = 1100;
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const NOMINATIM_HEADERS = {
  "User-Agent": "JobHunter-AI/1.0 (local business lead discovery)",
  Accept: "application/json",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dedupeCandidates(candidates: LocalBusinessCandidate[]): LocalBusinessCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((c) => {
    const key = c.name.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildAnalysisNote(
  candidate: LocalBusinessCandidate,
  status: WebsiteStatus
): string {
  if (status === "missing") {
    return `${candidate.category} in ${candidate.location} — no website found on OpenStreetMap or via domain check. Strong fit for web/design outreach.`;
  }
  return `${candidate.category} — listed site unreachable or weak web presence. Good candidate for a website refresh or marketing pitch.`;
}

function osmListingUrl(lat?: number, lon?: number, osmType?: string, osmId?: number) {
  if (lat != null && lon != null) {
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;
  }
  if (osmType && osmId) {
    return `https://www.openstreetmap.org/${osmType}/${osmId}`;
  }
  return "https://www.openstreetmap.org";
}

interface GeoPoint {
  lat: number;
  lon: number;
}

async function geocodeCapital(city: string, country: string): Promise<GeoPoint | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("city", city);
    url.searchParams.set("country", country);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      headers: NOMINATIM_HEADERS,
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const hit = data[0];
    if (!hit?.lat || !hit?.lon) return null;
    return { lat: Number(hit.lat), lon: Number(hit.lon) };
  } catch {
    return null;
  }
}

interface NominatimPlace {
  place_id?: number;
  name?: string;
  display_name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  class?: string;
  extratags?: Record<string, string>;
}

async function searchNominatim(
  countryCode: string,
  queries: string[]
): Promise<LocalBusinessCandidate[]> {
  const meta = COUNTRY_META[countryCode];
  if (!meta) return [];

  const countryLabel = getCountryLabel(countryCode);
  const results: LocalBusinessCandidate[] = [];

  for (const query of queries) {
    await sleep(NOMINATIM_DELAY_MS);
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", query);
      url.searchParams.set("countrycodes", countryCode.toLowerCase());
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "15");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("extratags", "1");

      const res = await fetch(url.toString(), {
        headers: NOMINATIM_HEADERS,
        cache: "no-store",
      });
      if (!res.ok) continue;

      const places = (await res.json()) as NominatimPlace[];
      for (const place of places) {
        const name =
          place.name?.trim() ||
          place.display_name?.split(",")[0]?.trim();
        if (!name) continue;

        const lat = place.lat ? Number(place.lat) : undefined;
        const lon = place.lon ? Number(place.lon) : undefined;
        const category = place.type ?? place.class ?? "local business";
        const listedWebsite =
          place.extratags?.website ?? place.extratags?.["contact:website"];

        results.push({
          id: `nominatim-${place.place_id ?? name}`,
          name,
          category: String(category).replace(/_/g, " "),
          address: place.display_name,
          location: place.display_name ?? `${meta.capital}, ${countryLabel}`,
          source: "osm",
          listingUrl: osmListingUrl(lat, lon),
          listedWebsite,
          rawData: place as unknown as Record<string, unknown>,
        });
      }
    } catch {
      // try next query
    }
  }

  return results;
}

type OverpassElement = {
  id: number;
  type: string;
  tags?: Record<string, string>;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
};

async function runOverpass(query: string): Promise<OverpassElement[]> {
  const body = `data=${encodeURIComponent(query)}`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
      });
      if (!res.ok) continue;

      const data = (await res.json()) as { elements?: OverpassElement[] };
      return data.elements ?? [];
    } catch {
      continue;
    }
  }

  return [];
}

function mapOverpassElements(
  elements: OverpassElement[],
  countryLabel: string,
  defaultCity?: string
): LocalBusinessCandidate[] {
  const results: LocalBusinessCandidate[] = [];

  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = tags.name?.trim();
    if (!name) continue;

    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
    const city = tags["addr:city"] ?? defaultCity ?? "";
    const address = street ? `${street}${city ? `, ${city}` : ""}` : city;
    const category =
      tags.tourism ?? tags.amenity ?? tags.shop ?? tags.office ?? "local business";
    const osmType = el.type === "node" ? "node" : "way";

    results.push({
      id: `osm-${el.type}-${el.id}`,
      name,
      category: String(category).replace(/_/g, " "),
      address: address || undefined,
      location: address ? `${address}, ${countryLabel}` : countryLabel,
      source: "osm",
      listingUrl: osmListingUrl(lat, lon, osmType, el.id),
      listedWebsite: tags.website ?? tags["contact:website"],
      rawData: { tags, lat, lon },
    });
  }

  return results;
}

async function searchOpenStreetMapAroundCity(
  countryCode: string,
  point: GeoPoint
): Promise<LocalBusinessCandidate[]> {
  const meta = COUNTRY_META[countryCode];
  if (!meta) return [];

  const countryLabel = getCountryLabel(countryCode);
  const { lat, lon } = point;
  const query = `
[out:json][timeout:25];
(
  nwr["tourism"~"hotel|motel|guest_house|hostel"](around:20000,${lat},${lon});
  nwr["amenity"~"restaurant|cafe|bar|fast_food|pharmacy|dentist|clinic|bank"](around:20000,${lat},${lon});
  nwr["shop"](around:20000,${lat},${lon});
);
out center 80;
`;

  const rows = await runOverpass(query);
  return mapOverpassElements(rows, countryLabel, meta.capital);
}

async function searchOpenStreetMapCountry(countryCode: string): Promise<LocalBusinessCandidate[]> {
  const meta = COUNTRY_META[countryCode];
  if (!meta) return [];

  const countryLabel = getCountryLabel(countryCode);
  const query = `
[out:json][timeout:25];
area["ISO3166-1"="${countryCode}"][admin_level=2]->.country;
(
  nwr["tourism"~"hotel|motel|guest_house|hostel"](area.country);
  nwr["amenity"~"restaurant|cafe|bar|fast_food|pharmacy|dentist|clinic"](area.country);
  nwr["shop"](area.country);
);
out center 80;
`;

  const rows = await runOverpass(query);
  return mapOverpassElements(rows, countryLabel, meta.capital);
}

async function evaluateCandidate(
  candidate: LocalBusinessCandidate
): Promise<LocalBusinessLead | null> {
  if (candidate.listedWebsite) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(candidate.listedWebsite, {
        method: "HEAD",
        signal: controller.signal,
        headers: { "User-Agent": "JobHunter-AI/1.0" },
        redirect: "follow",
      });
      clearTimeout(timeout);
      if (res.ok || res.status === 405) return null;
    } catch {
      // listed site broken — keep as lead
    }
  }

  const probe = await probeCompanyWebsite(candidate.name, candidate.listingUrl);
  if (probe.status === "found") return null;

  return {
    ...candidate,
    websiteStatus: probe.status,
    probedUrl: probe.url,
    needsWebsite: true,
    analysisNote: buildAnalysisNote(candidate, probe.status),
  };
}

/** Free local discovery — OpenStreetMap + Nominatim only (no Google API key). */
export async function discoverLocalBusinessLeads(
  countryCode: string,
  options?: { targetLeads?: number; maxCandidates?: number }
): Promise<LocalBusinessLead[]> {
  const targetLeads = options?.targetLeads ?? DEFAULT_TARGET_LEADS;
  const maxCandidates = options?.maxCandidates ?? DEFAULT_MAX_CANDIDATES;

  if (!countryCode) {
    throw new Error("Hunt country is required for local business discovery.");
  }

  const meta = COUNTRY_META[countryCode];
  if (!meta) {
    throw new Error(`Local business scan is not configured for ${getCountryLabel(countryCode)} yet.`);
  }

  const capital = meta.capital;
  const countryName = meta.name;

  const nominatimQueries = [
    `hotel ${capital}`,
    `restaurant ${capital}`,
    `cafe ${capital}`,
    `guest house ${capital}`,
    `shop ${capital}`,
  ];

  const geo = await geocodeCapital(capital, countryName);
  await sleep(NOMINATIM_DELAY_MS);

  const [nominatimResults, cityOsmResults, countryOsmResults] = await Promise.all([
    searchNominatim(countryCode, nominatimQueries),
    geo ? searchOpenStreetMapAroundCity(countryCode, geo) : Promise.resolve([]),
    searchOpenStreetMapCountry(countryCode),
  ]);

  const candidates = dedupeCandidates([
    ...cityOsmResults,
    ...nominatimResults,
    ...countryOsmResults,
  ]).slice(0, maxCandidates);

  const leads: LocalBusinessLead[] = [];

  for (const candidate of candidates) {
    const lead = await evaluateCandidate(candidate);
    if (!lead) continue;
    leads.push(lead);
    if (leads.length >= targetLeads) break;
  }

  return leads;
}

export { COUNTRY_META, DEFAULT_TARGET_LEADS };
