/**
 * The regional character table (Oct 2026): for every country, what its buildings, trees, crops and seasons typically
 * look like from a plane. Data in src/data/world-flight/regional-character.json, written by the data agents from
 * docs/regional-character-brief.md. Typical of a region, never a claim about one spot.
 *
 * How a place finds its region:
 * - A region lists ISO countries, and optionally ISO 3166-2 subdivision codes.
 * - If a region lists codes for a country, it covers only those codes (and everything inside them).
 * - If it lists none for that country, it is that country's "rest of country" region: it covers whatever no coded
 *   region claims. Each country has at most one such region.
 * - The most specific code wins, so Bali (ID-BA) beats Nusa Tenggara (ID-NU), which contains it.
 *
 * The checker is regional-character.test.ts: every country covered, valid codes, no overlaps, value limits.
 */
import table from '@/data/world-flight/regional-character.json';

export type Month = number; // 1-12, in the region's own hemisphere

export interface RegionCharacter {
  id: string;
  name: string;
  countries: string[];
  subdivisions?: string[];
  hemisphere: 'N' | 'S';
  buildings: {
    roofColors: string[];
    roofMaterial: string[];
    roofShape: 'pitched' | 'steep' | 'flat' | 'hipped' | 'tiered' | 'mixed';
    wallColors: string[];
    wallMaterial: string[];
    villageLayout: 'walled compounds' | 'dense hill town' | 'scattered farms' | 'linear street' | 'grid' | 'courtyard blocks' | 'stilt houses' | 'mixed';
    density: 'sparse' | 'medium' | 'dense';
    signatureBuildings: string[];
  };
  plants: {
    signatureTrees: Array<{
      name: string;
      color: string;
      seasonColor?: { color: string; months: Month[] };
      where: 'hills' | 'valleys' | 'towns' | 'coast' | 'everywhere' | 'river banks';
    }>;
    signatureCrops: Array<{
      name: string;
      pattern: 'terraces' | 'rows' | 'stripes' | 'patchwork' | 'circles' | 'scattered';
      colors: string[];
      months?: Month[];
    }>;
  };
  seasons: {
    snowMonths?: Month[];
    autumnColor?: { color: string; months: Month[] } | null;
    wetGreen?: Month[];
    dryGold?: Month[];
  };
  sources: string[];
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

export const REGIONS = table as RegionCharacter[];

/** Codes a region lists for one country. */
function codesFor(r: RegionCharacter, country: string): string[] {
  return (r.subdivisions ?? []).filter((s) => s.startsWith(country + '-'));
}

const byCode = new Map<string, RegionCharacter>();
const restOf = new Map<string, RegionCharacter>();
for (const r of REGIONS) {
  for (const c of r.countries) {
    const codes = codesFor(r, c);
    if (codes.length === 0) restOf.set(c, r);
    for (const code of codes) byCode.set(code, r);
  }
}

/**
 * The region for a place. `subdivisions` are the ISO 3166-2 codes known for the spot, from most to least specific
 * (e.g. ['ID-BA', 'ID-NU']). Returns null only for a code the table doesn't know.
 */
export function regionFor(country: string, subdivisions: string[] = []): RegionCharacter | null {
  for (const code of subdivisions) {
    const r = byCode.get(code);
    if (r) return r;
  }
  return restOf.get(country) ?? null;
}
