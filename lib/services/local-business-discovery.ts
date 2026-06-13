import { getCountryLabel } from "@/lib/jobs/hunt-preferences";
import { probeCompanyWebsite, type WebsiteStatus } from "@/lib/services/company-web-probe";

export interface LocalBusinessCandidate {
  id: string;
  name: string;
  category: string;
  address?: string;
  location: string;
  source: "google" | "osm";
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
const DEFAULT_MAX_CANDIDATES = 45;

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
    return `${candidate.category} in ${candidate.location} — no website found in maps listing or domain guess. Strong fit for web/design outreach.`;
  }
  return `${candidate.category} — listed site unreachable or low web presence. Good candidate for a website refresh or marketing pitch.`;
}

async function searchGooglePlaces(
  countryCode: string,
  apiKey: string
): Promise<LocalBusinessCandidate[]> {
  const meta = COUNTRY_META[countryCode];
  if (!meta) return [];

  const countryLabel = getCountryLabel(countryCode);
  const queries = [
    `hotels in ${meta.capital} ${meta.name}`,
    `restaurants in ${meta.capital} ${meta.name}`,
    `shops in ${meta.capital} ${meta.name}`,
  ];

  const results: LocalBusinessCandidate[] = [];

  for (const textQuery of queries) {
    try {
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.types,places.googleMapsUri",
        },
        body: JSON.stringify({ textQuery, maxResultCount: 12 }),
        cache: "no-store",
      });

      if (!res.ok) continue;

      const data = (await res.json()) as {
        places?: Array<{
          id?: string;
          displayName?: { text?: string };
          formattedAddress?: string;
          websiteUri?: string;
          googleMapsUri?: string;
          types?: string[];
        }>;
      };

      for (const place of data.places ?? []) {
        const name = place.displayName?.text?.trim();
        if (!name) continue;

        const types = place.types ?? [];
        const category =
          types.find((t) => !t.startsWith("point_of_interest") && t !== "establishment") ??
          types[0] ??
          "local business";

        results.push({
          id: `google-${place.id ?? name}`,
          name,
          category: category.replace(/_/g, " "),
          address: place.formattedAddress,
          location: place.formattedAddress ?? `${meta.capital}, ${countryLabel}`,
          source: "google",
          listingUrl: place.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + meta.capital)}`,
          listedWebsite: place.websiteUri,
          rawData: place as unknown as Record<string, unknown>,
        });
      }
    } catch {
      // try next query
    }
  }

  return results;
}

async function searchOpenStreetMap(countryCode: string): Promise<LocalBusinessCandidate[]> {
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
out center 60;
`;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = (await res.json()) as {
      elements?: Array<{
        id: number;
        type: string;
        tags?: Record<string, string>;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
      }>;
    };

    const results: LocalBusinessCandidate[] = [];

    for (const el of data.elements ?? []) {
      const tags = el.tags ?? {};
      const name = tags.name?.trim();
      if (!name) continue;

      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
      const city = tags["addr:city"] ?? meta.capital;
      const address = street ? `${street}, ${city}` : city;

      const category =
        tags.tourism ?? tags.amenity ?? tags.shop ?? tags.office ?? "local business";

      const listedWebsite = tags.website ?? tags["contact:website"];
      const osmType = el.type === "node" ? "node" : "way";

      results.push({
        id: `osm-${el.type}-${el.id}`,
        name,
        category: String(category).replace(/_/g, " "),
        address,
        location: `${address}, ${countryLabel}`,
        source: "osm",
        listingUrl:
          lat && lon
            ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`
            : `https://www.openstreetmap.org/${osmType}/${el.id}`,
        listedWebsite,
        rawData: { tags, lat, lon },
      });
    }

    return results;
  } catch {
    return [];
  }
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

export async function discoverLocalBusinessLeads(
  countryCode: string,
  options?: { targetLeads?: number; maxCandidates?: number }
): Promise<LocalBusinessLead[]> {
  const targetLeads = options?.targetLeads ?? DEFAULT_TARGET_LEADS;
  const maxCandidates = options?.maxCandidates ?? DEFAULT_MAX_CANDIDATES;

  if (!countryCode) {
    throw new Error("Hunt country is required for local business discovery.");
  }

  if (!COUNTRY_META[countryCode]) {
    throw new Error(`Local business scan is not configured for ${getCountryLabel(countryCode)} yet.`);
  }

  const googleKey = process.env.GOOGLE_PLACES_API_KEY;
  const [googleResults, osmResults] = await Promise.all([
    googleKey ? searchGooglePlaces(countryCode, googleKey) : Promise.resolve([]),
    searchOpenStreetMap(countryCode),
  ]);

  const candidates = dedupeCandidates([...googleResults, ...osmResults]).slice(0, maxCandidates);
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
