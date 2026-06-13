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

const COUNTRY_META: Record<string, { name: string; capital: string; lat: number; lon: number }> = {
  ET: { name: "Ethiopia", capital: "Addis Ababa", lat: 9.032, lon: 38.7469 },
  US: { name: "United States", capital: "New York", lat: 40.7128, lon: -74.006 },
  GB: { name: "United Kingdom", capital: "London", lat: 51.5074, lon: -0.1278 },
  DE: { name: "Germany", capital: "Berlin", lat: 52.52, lon: 13.405 },
  PT: { name: "Portugal", capital: "Lisbon", lat: 38.7223, lon: -9.1393 },
  IN: { name: "India", capital: "Mumbai", lat: 19.076, lon: 72.8777 },
  BR: { name: "Brazil", capital: "São Paulo", lat: -23.5505, lon: -46.6333 },
  CA: { name: "Canada", capital: "Toronto", lat: 43.6532, lon: -79.3832 },
  NL: { name: "Netherlands", capital: "Amsterdam", lat: 52.3676, lon: 4.9041 },
  FR: { name: "France", capital: "Paris", lat: 48.8566, lon: 2.3522 },
  ES: { name: "Spain", capital: "Madrid", lat: 40.4168, lon: -3.7038 },
  KE: { name: "Kenya", capital: "Nairobi", lat: -1.2921, lon: 36.8219 },
  NG: { name: "Nigeria", capital: "Lagos", lat: 6.5244, lon: 3.3792 },
  ZA: { name: "South Africa", capital: "Johannesburg", lat: -26.2041, lon: 28.0473 },
  AE: { name: "United Arab Emirates", capital: "Dubai", lat: 25.2048, lon: 55.2708 },
  AU: { name: "Australia", capital: "Sydney", lat: -33.8688, lon: 151.2093 },
};

const DEFAULT_TARGET_LEADS = 5;
const DEFAULT_MAX_CANDIDATES = 80;
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

function isMapOrDirectoryHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return /openstreetmap|nominatim|google\.|bing\.com|facebook\.com|instagram\.com/i.test(host);
  } catch {
    return true;
  }
}

function prioritizeCandidates(candidates: LocalBusinessCandidate[]): LocalBusinessCandidate[] {
  return [...candidates].sort((a, b) => {
    const aNoSite = a.listedWebsite ? 1 : 0;
    const bNoSite = b.listedWebsite ? 1 : 0;
    return aNoSite - bNoSite;
  });
}

async function evaluateCandidate(
  candidate: LocalBusinessCandidate
): Promise<LocalBusinessLead | null> {
  const listedWebsite = candidate.listedWebsite?.trim();

  if (listedWebsite && !isMapOrDirectoryHost(listedWebsite)) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(listedWebsite, {
        method: "HEAD",
        signal: controller.signal,
        headers: { "User-Agent": "JobHunter-AI/1.0" },
        redirect: "follow",
      });
      clearTimeout(timeout);
      if (res.ok || res.status === 405) return null;
    } catch {
      return {
        ...candidate,
        websiteStatus: "unreachable",
        needsWebsite: true,
        analysisNote: buildAnalysisNote(candidate, "unreachable"),
      };
    }
  }

  // Never pass map listing URLs into domain probe — they always return "found"
  const probe = await probeCompanyWebsite(candidate.name, undefined);
  if (probe.status === "found") return null;

  return {
    ...candidate,
    websiteStatus: listedWebsite ? "unreachable" : probe.status,
    probedUrl: probe.url,
    needsWebsite: true,
    analysisNote: buildAnalysisNote(
      candidate,
      listedWebsite ? "unreachable" : probe.status
    ),
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
    `hotel ${capital} ${countryName}`,
    `restaurant ${capital} ${countryName}`,
    `cafe ${capital}`,
    `guest house ${capital}`,
    `shop ${capital} ${countryName}`,
    `pharmacy ${capital}`,
  ];

  const geo =
    (await geocodeCapital(capital, countryName)) ?? {
      lat: meta.lat,
      lon: meta.lon,
    };

  // Nominatim rate limit: run after geocode, not in parallel with other Nominatim calls
  await sleep(NOMINATIM_DELAY_MS);

  const [nominatimResults, cityOsmResults, countryOsmResults] = await Promise.all([
    searchNominatim(countryCode, nominatimQueries),
    searchOpenStreetMapAroundCity(countryCode, geo),
    searchOpenStreetMapCountry(countryCode),
  ]);

  const candidates = prioritizeCandidates(
    dedupeCandidates([...cityOsmResults, ...nominatimResults, ...countryOsmResults])
  ).slice(0, maxCandidates);

  const leads: LocalBusinessLead[] = [];

  for (const candidate of candidates) {
    const lead = await evaluateCandidate(candidate);
    if (!lead) continue;
    leads.push(lead);
    if (leads.length >= targetLeads) break;
  }

  // Fallback: OSM entries with no website tag are valid leads even if domain guess hits a parked domain
  if (leads.length === 0) {
    for (const candidate of candidates.filter((c) => !c.listedWebsite).slice(0, targetLeads)) {
      leads.push({
        ...candidate,
        websiteStatus: "missing",
        needsWebsite: true,
        analysisNote: buildAnalysisNote(candidate, "missing"),
      });
    }
  }

  return leads;
}

export { COUNTRY_META, DEFAULT_TARGET_LEADS };
