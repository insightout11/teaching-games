import { describe, expect, it } from 'vitest';
import iso from '../../../scripts/data/iso-3166.json';
import { REGIONS, regionFor, type RegionCharacter } from './regional-character';

// The checker for the regional character table (see regional-character.ts for how places find their region).
// iso-3166.json is the ISO country and subdivision list (generated once from pycountry).

const COUNTRIES = new Set<string>(iso.countries);
const PARENT = iso.subdivisions as Record<string, string | null>;
// Kosovo has no ISO code yet but is a real place under the route.
const EXTRA_COUNTRIES = new Set(['XK']);
// Subdivisions that are their own ISO countries elsewhere in the table (French overseas, Hong Kong and so on).
const OWN_COUNTRY = new Set(['FR-971', 'FR-972', 'FR-973', 'FR-974', 'FR-976', 'FR-BL', 'FR-MF', 'FR-NC', 'FR-PF', 'FR-PM', 'FR-TF', 'FR-WF', 'FR-CP', 'CN-HK', 'CN-MO', 'CN-TW']);
// Places with no region yet. Shrink this list as data arrives; a new gap fails the test.
const KNOWN_GAPS = ['ES-AS', 'ES-CB', 'ES-CN', 'ES-GA', 'ES-PV', 'US (all but New England and Hawaii)'];

const HEX = /^#[0-9a-f]{6}$/i;
const ENUMS = {
  roofShape: ['pitched', 'steep', 'flat', 'hipped', 'tiered', 'mixed'],
  villageLayout: ['walled compounds', 'dense hill town', 'scattered farms', 'linear street', 'grid', 'courtyard blocks', 'stilt houses', 'mixed'],
  density: ['sparse', 'medium', 'dense'],
  where: ['hills', 'valleys', 'towns', 'coast', 'everywhere', 'river banks'],
  pattern: ['terraces', 'rows', 'stripes', 'patchwork', 'circles', 'scattered'],
  confidence: ['high', 'medium', 'low'],
};

const codesFor = (r: RegionCharacter, c: string) => (r.subdivisions ?? []).filter((s) => s.startsWith(c + '-'));
const ancestors = (code: string) => {
  const out: string[] = [];
  for (let p = PARENT[code]; p; p = PARENT[p]) out.push(p);
  return out;
};

describe('regional character table', () => {
  it('has unique ids', () => {
    const ids = REGIONS.map((r) => r.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it('covers every ISO country, with valid country and subdivision codes', () => {
    const listed = new Set(REGIONS.flatMap((r) => r.countries));
    expect(Array.from(COUNTRIES).filter((c) => !listed.has(c))).toEqual([]);
    expect(Array.from(listed).filter((c) => !COUNTRIES.has(c) && !EXTRA_COUNTRIES.has(c))).toEqual([]);
    const bad = REGIONS.flatMap((r) => (r.subdivisions ?? []).filter((s) => !(s in PARENT) || !r.countries.includes(s.split('-')[0])).map((s) => `${r.id}: ${s}`));
    expect(bad).toEqual([]);
  });

  it('never overlaps: one rest-of-country region per country, and no code claimed twice', () => {
    const rest = new Map<string, string[]>();
    const claimed = new Map<string, string[]>();
    for (const r of REGIONS) {
      for (const c of r.countries) {
        const codes = codesFor(r, c);
        if (!codes.length) rest.set(c, [...(rest.get(c) ?? []), r.id]);
        for (const code of codes) claimed.set(code, [...(claimed.get(code) ?? []), r.id]);
      }
    }
    expect(Array.from(rest).filter(([, ids]) => ids.length > 1)).toEqual([]);
    expect(Array.from(claimed).filter(([, ids]) => ids.length > 1)).toEqual([]);
  });

  it('leaves only the known gaps where a country has no rest-of-country region', () => {
    const hasRest = new Set(REGIONS.flatMap((r) => r.countries.filter((c) => !codesFor(r, c).length)));
    const claimed = new Set(REGIONS.flatMap((r) => r.subdivisions ?? []));
    const covered = (code: string) => claimed.has(code) || ancestors(code).some((a) => claimed.has(a));
    const gaps: string[] = [];
    for (const c of Array.from(new Set(REGIONS.flatMap((r) => r.countries)))) {
      if (hasRest.has(c)) continue;
      const top = Object.keys(PARENT).filter((s) => s.startsWith(c + '-') && !PARENT[s] && !OWN_COUNTRY.has(s));
      // A top-level code is covered if it, or every one of its children, is claimed.
      const missing = top.filter((s) => {
        if (covered(s)) return false;
        const kids = Object.keys(PARENT).filter((k) => PARENT[k] === s);
        return !kids.length || !kids.every(covered);
      });
      if (c === 'US') {
        if (missing.length) gaps.push('US (all but New England and Hawaii)');
      } else gaps.push(...missing);
    }
    expect(gaps.sort()).toEqual([...KNOWN_GAPS].sort());
  });

  it('keeps every value drawable: enums, hex colours, months, item limits, sources', () => {
    const problems: string[] = [];
    const months = (id: string, m: number[] | undefined) => (m ?? []).forEach((x) => (Number.isInteger(x) && x >= 1 && x <= 12) || problems.push(`${id}: month ${x}`));
    const hex = (id: string, cs: string[]) => cs.forEach((c) => HEX.test(c) || problems.push(`${id}: colour ${c}`));
    for (const r of REGIONS) {
      const b = r.buildings;
      if (!ENUMS.roofShape.includes(b.roofShape)) problems.push(`${r.id}: roofShape ${b.roofShape}`);
      if (!ENUMS.villageLayout.includes(b.villageLayout)) problems.push(`${r.id}: villageLayout ${b.villageLayout}`);
      if (!ENUMS.density.includes(b.density)) problems.push(`${r.id}: density ${b.density}`);
      if (!ENUMS.confidence.includes(r.confidence)) problems.push(`${r.id}: confidence ${r.confidence}`);
      if (!['N', 'S'].includes(r.hemisphere)) problems.push(`${r.id}: hemisphere`);
      if (b.roofColors.length > 3 || b.wallColors.length > 3 || b.signatureBuildings.length > 2) problems.push(`${r.id}: too many building items`);
      hex(r.id, [...b.roofColors, ...b.wallColors]);
      if (r.plants.signatureTrees.length > 4 || r.plants.signatureCrops.length > 3) problems.push(`${r.id}: too many plants`);
      for (const t of r.plants.signatureTrees) {
        if (!ENUMS.where.includes(t.where)) problems.push(`${r.id}: where ${t.where}`);
        hex(r.id, [t.color, ...(t.seasonColor ? [t.seasonColor.color] : [])]);
        months(r.id, t.seasonColor?.months);
      }
      for (const c of r.plants.signatureCrops) {
        if (!ENUMS.pattern.includes(c.pattern)) problems.push(`${r.id}: pattern ${c.pattern}`);
        hex(r.id, c.colors);
        months(r.id, c.months);
      }
      const s = r.seasons;
      [s.snowMonths, s.wetGreen, s.dryGold, s.autumnColor?.months].forEach((m) => months(r.id, m));
      if (s.autumnColor) hex(r.id, [s.autumnColor.color]);
      if (r.sources.length < 2) problems.push(`${r.id}: needs 2 sources`);
    }
    expect(problems).toEqual([]);
  });
});

describe('regionFor', () => {
  it('picks the most specific code, then the rest-of-country region', () => {
    expect(regionFor('ID', ['ID-BA', 'ID-NU'])?.id).toBe('id-bali');
    expect(regionFor('ID', ['ID-NU'])?.id).toBe('id-nusa-tenggara-timor-leste');
    expect(regionFor('JP', ['JP-13'])?.id).toBe('jp-honshu');
    expect(regionFor('JP', ['JP-40'])?.id).toBe('jp-kyushu-shikoku');
    expect(regionFor('DZ', ['DZ-11'])?.id).toBe('dz-ly-ne-ml-mr-sahara');
    expect(regionFor('DZ', ['DZ-16'])?.id).toBe('dz-tn-tell');
    expect(regionFor('TL')?.id).toBe('id-nusa-tenggara-timor-leste');
  });

  it('returns null where the table has a gap', () => {
    expect(regionFor('US', ['US-TX'])).toBeNull();
  });
});
