import type { StyleSpecification } from 'maplibre-gl';

export const WORLD_FLIGHT_MAP_STYLE: StyleSpecification = {
  version: 8,
  name: 'LessonCaptain World Flight',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#17283a' },
    },
    {
      id: 'landcover-ice',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['==', 'class', 'ice'],
      paint: { 'fill-color': '#8ca2b5', 'fill-opacity': 0.38 },
    },
    {
      id: 'landcover-wood',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['==', 'class', 'wood'],
      paint: { 'fill-color': '#173329', 'fill-opacity': 0.7 },
    },
    {
      id: 'landcover-grass',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['in', 'class', 'grass', 'farmland'],
      paint: { 'fill-color': '#1d332d', 'fill-opacity': 0.45 },
    },
    {
      id: 'parks',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'park',
      paint: { 'fill-color': '#183a30', 'fill-opacity': 0.58 },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: { 'fill-color': '#061522' },
    },
    {
      id: 'coastline-glow',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: {
        'line-color': '#4d7893',
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 2.25, 7, 4],
        'line-opacity': 0.16,
        'line-blur': 2.5,
      },
    },
    {
      id: 'coastlines',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: {
        'line-color': '#34536b',
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.55, 7, 1.25],
        'line-opacity': 0.78,
      },
    },
    {
      id: 'waterways',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      paint: {
        'line-color': '#183d56',
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.25, 7, 1.1],
        'line-opacity': 0.7,
      },
    },
    {
      id: 'country-boundaries',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: ['==', 'admin_level', 2],
      paint: {
        'line-color': '#50677e',
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.35, 7, 1.1],
        'line-opacity': 0.4,
      },
    },
    {
      id: 'state-boundaries',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: ['==', 'admin_level', 4],
      minzoom: 4,
      paint: {
        'line-color': '#405267',
        'line-width': 0.55,
        'line-opacity': 0.26,
      },
    },
    {
      id: 'water-labels',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'water_name',
      minzoom: 3,
      layout: {
        'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
        'text-font': ['Noto Sans Italic'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 7, 13],
        'text-letter-spacing': 0.08,
      },
      paint: {
        'text-color': '#6089a5',
        'text-halo-color': '#061522',
        'text-halo-width': 1,
      },
    },
    {
      id: 'country-labels',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['==', 'class', 'country'],
      maxzoom: 7,
      layout: {
        'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
        'text-font': ['Noto Sans Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 2, 10, 6, 14],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.08,
        'text-max-width': 8,
      },
      paint: {
        'text-color': '#8195aa',
        'text-halo-color': '#17283a',
        'text-halo-width': 1.5,
      },
    },
    {
      id: 'capital-labels',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['all', ['==', 'class', 'city'], ['==', 'capital', 2]],
      minzoom: 4,
      layout: {
        'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 7, 13],
        'text-offset': [0, 0.8],
        'text-anchor': 'top',
      },
      paint: {
        'text-color': '#99acbf',
        'text-halo-color': '#17283a',
        'text-halo-width': 1.25,
      },
    },
  ],
};

// ── Map looks (Oct 2026): Quiz (nothing that gives the answer away), Explore (terrain and many more places) ─────────
/** Free public elevation tiles (Mapzen terrarium on AWS open data), for shaded mountains and valleys. */
const TERRAIN_SOURCE = {
  type: 'raster-dem' as const,
  tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
  encoding: 'terrarium' as const,
  tileSize: 256,
  maxzoom: 10,
};
const HILLSHADE_LAYER = {
  id: 'terrain-shade',
  type: 'hillshade' as const,
  source: 'terrain',
  paint: {
    'hillshade-exaggeration': 0.4,
    'hillshade-shadow-color': '#040b14',
    'hillshade-highlight-color': '#6f8aa6',
    'hillshade-accent-color': '#0d1b2b',
  },
};
/** Put the terrain shading on the land, under the water (the elevation data includes the sea floor, which looked busy). */
function withTerrain(layers: StyleSpecification['layers']): StyleSpecification['layers'] {
  const i = layers.findIndex((l) => l.id === 'water');
  const at = i < 0 ? layers.length : i;
  return [...layers.slice(0, at), HILLSHADE_LAYER as StyleSpecification['layers'][number], ...layers.slice(at)];
}

/**
 * The quiz look: no names and no city dots, so nothing gives the answer away. `borders` (easier) keeps the country
 * lines; without them only coastlines, rivers and the shape of the land remain. `terrain` shades the mountains (off on
 * phones, to keep them light).
 */
export function createQuizMapStyle({ borders = true, terrain = true }: { borders?: boolean; terrain?: boolean } = {}): StyleSpecification {
  const layers = WORLD_FLIGHT_MAP_STYLE.layers
    .filter((layer) => layer.type !== 'symbol')
    .filter((layer) => borders || (layer.id !== 'country-boundaries' && layer.id !== 'state-boundaries'))
    // borders a little clearer here: with no names they are what the class finds its way by
    .map((layer) => (layer.id === 'country-boundaries' ? { ...layer, paint: { ...(layer as { paint?: object }).paint, 'line-opacity': 0.75, 'line-color': '#6f88a2' } } : { ...layer })) as StyleSpecification['layers'];
  return {
    ...WORLD_FLIGHT_MAP_STYLE,
    sources: terrain ? { ...WORLD_FLIGHT_MAP_STYLE.sources, terrain: TERRAIN_SOURCE } : WORLD_FLIGHT_MAP_STYLE.sources,
    layers: terrain ? withTerrain(layers) : layers,
  };
}

const label = (id: string, filter: unknown, minzoom: number, size: [number, number, number, number], color: string, font = 'Noto Sans Regular', layer = 'place') => ({
  id, type: 'symbol' as const, source: 'openmaptiles', 'source-layer': layer, filter, minzoom,
  layout: {
    'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
    'text-font': [font],
    'text-size': ['interpolate', ['linear'], ['zoom'], size[0], size[1], size[2], size[3]],
    'text-max-width': 8,
  },
  paint: { 'text-color': color, 'text-halo-color': '#0b1724', 'text-halo-width': 1.2 },
});

/**
 * The explore look, for free conversation: shaded terrain, and more places as you zoom in (big cities, then towns),
 * named rivers, mountain peaks and seas. Everything a class can point at and talk about.
 */
export function createExploreMapStyle(): StyleSpecification {
  const extra = [
    label('city-labels', ['all', ['==', 'class', 'city'], ['!=', 'capital', 2]], 3.5, [3.5, 10, 8, 14], '#a9bbcc'),
    label('town-labels', ['in', 'class', 'town'], 6, [6, 10, 10, 13], '#8ea2b6'),
    label('river-labels', ['==', 'class', 'river'], 5, [5, 10, 9, 12], '#6f9cbc', 'Noto Sans Italic', 'waterway'),
    label('peak-labels', ['has', 'name'], 6, [6, 10, 10, 12], '#c9b99a', 'Noto Sans Italic', 'mountain_peak'),
  ];
  const base = WORLD_FLIGHT_MAP_STYLE.layers.map((layer) => ({ ...layer }));
  return {
    ...WORLD_FLIGHT_MAP_STYLE,
    sources: { ...WORLD_FLIGHT_MAP_STYLE.sources, terrain: TERRAIN_SOURCE },
    layers: [...withTerrain(base), ...(extra as unknown as StyleSpecification['layers'])],
  };
}

export function createWorldFlightGuessMapStyle(showLabels = false): StyleSpecification {
  return {
    ...WORLD_FLIGHT_MAP_STYLE,
    layers: WORLD_FLIGHT_MAP_STYLE.layers
      .filter((layer) => showLabels || layer.type !== 'symbol')
      .map((layer) => ({ ...layer })),
  };
}

/**
 * Street-level city map for the Find Your Way directions game. Same OpenMapTiles planet
 * source as the world map, but adds roads + buildings so a city reads as real streets when
 * zoomed in (~zoom 12-15). Street name labels optional (off by default — students follow the
 * shape of the streets, not the names).
 */
export function createCityStreetMapStyle(showLabels = false): StyleSpecification {
  const roadLayers = [
    {
      id: 'city-buildings',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 13,
      paint: { 'fill-color': '#1b2c3e', 'fill-opacity': 0.55 },
    },
    {
      id: 'city-roads-minor',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'minor', 'service'],
      minzoom: 12,
      paint: { 'line-color': '#2c4257', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.4, 16, 2.2] },
    },
    {
      id: 'city-roads-secondary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'secondary', 'tertiary'],
      minzoom: 10,
      paint: { 'line-color': '#3a5670', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 16, 3.4] },
    },
    {
      id: 'city-roads-major',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'motorway', 'trunk', 'primary'],
      minzoom: 8,
      paint: { 'line-color': '#4d7089', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.8, 16, 5.5] },
    },
  ] as StyleSpecification['layers'];

  const labelLayers = (showLabels
    ? [
        {
          id: 'city-road-labels',
          type: 'symbol',
          source: 'openmaptiles',
          'source-layer': 'transportation_name',
          minzoom: 12,
          layout: {
            'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
            'text-font': ['Noto Sans Regular'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 12, 11, 16, 14],
            'symbol-placement': 'line',
          },
          // Bright enough to actually read street names while following directions.
          paint: { 'text-color': '#b8cbdc', 'text-halo-color': '#0d1b28', 'text-halo-width': 1.6 },
        },
      ]
    : []) as StyleSpecification['layers'];

  return {
    ...WORLD_FLIGHT_MAP_STYLE,
    layers: [
      ...WORLD_FLIGHT_MAP_STYLE.layers.filter((layer) => layer.type !== 'symbol'),
      ...roadLayers,
      ...labelLayers,
    ],
  };
}
