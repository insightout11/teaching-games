import type { PaletteKey, ScenePalette, TimeOfDay } from './types';

// Five palettes keyed to DestinationScene.palette. Structure mirrors the WEATHER
// object in sky-background.tsx (hardcoded hex/rgba — no Tailwind), tuned for a
// side-profile arrival at a characteristic time-of-day per palette.

export const PALETTES: Record<PaletteKey, ScenePalette> = {
  dawn: {
    skyTop: '#1f3a63',
    skyMid: '#6f7fb0',
    skyBottom: '#f2c6a0',
    horizonGlow: 'rgba(255,200,150,0.55)',
    light: 'sun',
    lightColor: '#ffd9a8',
    terrainTop: '#3a5a52',
    terrainBottom: '#1d322f',
    waterTop: '#7fa6c4',
    waterBottom: '#3a5e7c',
    buildingSilhouette: 'rgba(40,52,74,0.92)',
    windowWarm: 'rgba(255,206,120,0.55)',
    windowCool: 'rgba(190,222,255,0.42)',
    foliage: '#2f5a3a',
    trunk: '#3c2a1c',
    landmarkFill: 'rgba(46,58,82,0.94)',
    landmarkAccent: 'rgba(255,210,160,0.35)',
  },
  night: {
    skyTop: '#070b1c',
    skyMid: '#142043',
    skyBottom: '#2a3566',
    horizonGlow: 'rgba(120,150,235,0.40)',
    light: 'moon',
    lightColor: '#dce6ff',
    terrainTop: '#10172b',
    terrainBottom: '#070b16',
    waterTop: '#16284a',
    waterBottom: '#0a1428',
    buildingSilhouette: 'rgba(10,16,32,0.95)',
    windowWarm: 'rgba(255,206,110,0.78)',
    windowCool: 'rgba(150,200,255,0.62)',
    foliage: '#16352a',
    trunk: '#241a12',
    landmarkFill: 'rgba(8,14,30,0.96)',
    landmarkAccent: 'rgba(150,200,255,0.40)',
  },
  golden: {
    skyTop: '#3f4f8a',
    skyMid: '#c98a52',
    skyBottom: '#f6d08a',
    horizonGlow: 'rgba(255,190,110,0.65)',
    light: 'sun',
    lightColor: '#ffcf7a',
    terrainTop: '#9a7b46',
    terrainBottom: '#5c4524',
    waterTop: '#c79a64',
    waterBottom: '#7a5a36',
    buildingSilhouette: 'rgba(58,42,30,0.90)',
    windowWarm: 'rgba(255,214,140,0.60)',
    windowCool: 'rgba(220,210,180,0.40)',
    foliage: '#6e6a2e',
    trunk: '#43301c',
    landmarkFill: 'rgba(70,48,28,0.92)',
    landmarkAccent: 'rgba(255,210,150,0.45)',
  },
  tropical: {
    skyTop: '#2b6f8f',
    skyMid: '#56b6c4',
    skyBottom: '#ffe2b0',
    horizonGlow: 'rgba(255,225,170,0.55)',
    light: 'sun',
    lightColor: '#fff0c4',
    terrainTop: '#2f7a4a',
    terrainBottom: '#16412a',
    waterTop: '#39b6c2',
    waterBottom: '#1d7d8e',
    buildingSilhouette: 'rgba(34,58,62,0.88)',
    windowWarm: 'rgba(255,220,150,0.55)',
    windowCool: 'rgba(200,240,245,0.45)',
    foliage: '#2c7a3e',
    trunk: '#4a3320',
    landmarkFill: 'rgba(34,58,58,0.92)',
    landmarkAccent: 'rgba(255,235,180,0.40)',
  },
  winter: {
    skyTop: '#5b6b86',
    skyMid: '#9aa9bf',
    skyBottom: '#dfe7ee',
    horizonGlow: 'rgba(225,235,245,0.65)',
    light: 'sun',
    lightColor: '#eef4fb',
    terrainTop: '#aab6c4',
    terrainBottom: '#7d8a9a',
    waterTop: '#8ea2b6',
    waterBottom: '#5a6c80',
    buildingSilhouette: 'rgba(70,82,98,0.90)',
    windowWarm: 'rgba(255,214,150,0.58)',
    windowCool: 'rgba(205,225,245,0.45)',
    foliage: '#3f5a48',
    trunk: '#3a2c22',
    landmarkFill: 'rgba(74,86,102,0.92)',
    landmarkAccent: 'rgba(235,242,250,0.42)',
  },
};

export function getPalette(key: PaletteKey): ScenePalette {
  return PALETTES[key] ?? PALETTES.dawn;
}

// ── Time-of-day × climate composition ────────────────────────────────────────
// The baked PALETTES above conflate time-of-day with climate. For the live
// flight we want the scene's TIME to come from the flight clock while the city
// keeps its CLIMATE identity. So we compose a time-of-day BASE (sky/light/
// windows/building/landmark) with a per-destination climate GROUND tint
// (terrain/water/foliage). Landmark SHAPES + iconic accents already carry the
// rest of each city's identity.

export type ClimateKey = 'tropical' | 'arid' | 'temperate' | 'cold';

type GroundFields = Pick<
  ScenePalette,
  'terrainTop' | 'terrainBottom' | 'waterTop' | 'waterBottom' | 'foliage' | 'trunk'
>;

// Full base palettes per time of day (ground fields are placeholders overwritten
// by the climate tint). 'day' is the bright daytime look the baked set lacked.
const TIME_BASE: Record<TimeOfDay, ScenePalette> = {
  dawn: { ...PALETTES.dawn },
  dusk: { ...PALETTES.golden },
  night: { ...PALETTES.night },
  day: {
    skyTop: '#3f74b4',
    skyMid: '#7fb2d8',
    skyBottom: '#d6ebf4',
    horizonGlow: 'rgba(255,255,240,0.45)',
    light: 'sun',
    lightColor: '#fff7da',
    terrainTop: '#3a5a52',
    terrainBottom: '#1d322f',
    waterTop: '#7fb6d4',
    waterBottom: '#3f7ea0',
    buildingSilhouette: 'rgba(78,92,116,0.88)',
    windowWarm: 'rgba(255,220,150,0.30)',
    windowCool: 'rgba(200,225,245,0.30)',
    foliage: '#2f5a3a',
    trunk: '#3c2a1c',
    landmarkFill: 'rgba(86,100,124,0.92)',
    landmarkAccent: 'rgba(255,250,225,0.40)',
  },
};

// Climate ground tints, with a brighter daytime set and a darker night set.
const CLIMATE_GROUND: Record<ClimateKey, { day: GroundFields; night: GroundFields }> = {
  temperate: {
    day: { terrainTop: '#3f6a4a', terrainBottom: '#244031', waterTop: '#7fb0c8', waterBottom: '#3f7090', foliage: '#2f6a3e', trunk: '#3c2a1c' },
    night: { terrainTop: '#16241b', terrainBottom: '#0c160f', waterTop: '#1c324a', waterBottom: '#0c1828', foliage: '#16352a', trunk: '#241a12' },
  },
  tropical: {
    day: { terrainTop: '#2f8a4a', terrainBottom: '#176030', waterTop: '#39c0cc', waterBottom: '#1d8ea0', foliage: '#2c8a44', trunk: '#4a3320' },
    night: { terrainTop: '#143a26', terrainBottom: '#0a2016', waterTop: '#16484e', waterBottom: '#0a2630', foliage: '#15402a', trunk: '#241a12' },
  },
  arid: {
    day: { terrainTop: '#c9a86a', terrainBottom: '#8a6a3a', waterTop: '#9ab6a0', waterBottom: '#5c7a64', foliage: '#7a7a3a', trunk: '#5a4326' },
    night: { terrainTop: '#3a2f1e', terrainBottom: '#221a10', waterTop: '#26323a', waterBottom: '#141c22', foliage: '#2a2a14', trunk: '#2a2012' },
  },
  cold: {
    day: { terrainTop: '#c2cdd8', terrainBottom: '#8a98a8', waterTop: '#8ea6ba', waterBottom: '#5a7286', foliage: '#3f5a48', trunk: '#3a2c22' },
    night: { terrainTop: '#2a323c', terrainBottom: '#161c24', waterTop: '#1e2c3a', waterBottom: '#101820', foliage: '#22342a', trunk: '#241a12' },
  },
};

/** Map a destination's baked palette/terrain to a climate band. */
export function climateForScene(scene: { palette: PaletteKey }): ClimateKey {
  switch (scene.palette) {
    case 'tropical':
      return 'tropical';
    case 'golden':
      return 'arid';
    case 'winter':
      return 'cold';
    default:
      return 'temperate'; // dawn / night
  }
}

/** Compose a palette from a flight-clock time of day + the destination's climate. */
export function composeTimedPalette(timeOfDay: TimeOfDay, scene: { palette: PaletteKey }): ScenePalette {
  const base = TIME_BASE[timeOfDay] ?? TIME_BASE.dusk;
  const isDaylight = timeOfDay === 'day' || timeOfDay === 'dusk';
  const ground = CLIMATE_GROUND[climateForScene(scene)][isDaylight ? 'day' : 'night'];
  return { ...base, ...ground };
}
