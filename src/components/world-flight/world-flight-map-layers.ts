import type { Map as MapLibreMap } from 'maplibre-gl';
import { STARTER_PLANE_RANGE_KM } from '@/data/world-flight/destinations';
import { destinationFeatures, EMPTY_FEATURE_COLLECTION } from '@/lib/world-flight/map-features';
import type { GeoJSONSource } from 'maplibre-gl';

/**
 * Every source and layer of the World Flight map: the plane's range ring (and the next plane's), the class's journey
 * routes with arrows and numbered steps, expedition routes, the route being planned (drawn by animating its line
 * gradient), and the city dots, labels and visited ticks. Shared by the World Flight page and the Live Room map.
 * (Moved unchanged from world-flight-page.tsx, Oct 2026.)
 */
function toMapData(data: unknown) {
  return data as Parameters<GeoJSONSource['setData']>[0];
}

export function addWorldFlightMapLayers(map: MapLibreMap) {
  map.addSource('world-flight-range', {
    type: 'geojson',
    data: toMapData(EMPTY_FEATURE_COLLECTION),
  });
  map.addSource('world-flight-route', {
    type: 'geojson',
    lineMetrics: true,
    data: toMapData(EMPTY_FEATURE_COLLECTION),
  });
  map.addSource('world-flight-journey-routes', {
    type: 'geojson',
    data: toMapData(EMPTY_FEATURE_COLLECTION),
  });
  map.addSource('world-flight-expedition-routes', {
    type: 'geojson',
    data: toMapData(EMPTY_FEATURE_COLLECTION),
  });
  map.addSource('world-flight-journey-steps', {
    type: 'geojson',
    data: toMapData(EMPTY_FEATURE_COLLECTION),
  });
  map.addSource('world-flight-next-range', {
    type: 'geojson',
    data: toMapData(EMPTY_FEATURE_COLLECTION),
  });
  map.addSource('world-flight-cities', {
    type: 'geojson',
    data: toMapData(destinationFeatures(null, STARTER_PLANE_RANGE_KM)),
  });

  map.addLayer({
    id: 'world-flight-range-glow',
    type: 'line',
    source: 'world-flight-range',
    paint: {
      'line-color': '#38BDF8',
      'line-width': 7,
      'line-opacity': 0.14,
      'line-blur': 4,
    },
  });
  map.addLayer({
    id: 'world-flight-range-line',
    type: 'line',
    source: 'world-flight-range',
    paint: {
      'line-color': '#CFEFFF',
      'line-width': 2.25,
      'line-opacity': 0.85,
    },
  });
  map.addLayer({
    id: 'world-flight-journey-routes-glow',
    type: 'line',
    source: 'world-flight-journey-routes',
    paint: {
      'line-color': '#38BDF8',
      'line-width': 6,
      'line-opacity': ['case', ['get', 'active'], 0.06, 0.1],
      'line-blur': 4,
    },
  });
  map.addLayer({
    id: 'world-flight-journey-routes-line',
    type: 'line',
    source: 'world-flight-journey-routes',
    paint: {
      'line-color': '#7DD3FC',
      'line-width': 2,
      'line-opacity': ['case', ['get', 'active'], 0.2, 0.62],
    },
  });
  map.addLayer({
    id: 'world-flight-journey-routes-selected-glow',
    type: 'line',
    source: 'world-flight-journey-routes',
    filter: ['==', 'active', true],
    paint: {
      'line-color': '#F59E0B',
      'line-width': 9,
      'line-opacity': 0.2,
      'line-blur': 5,
    },
  });
  map.addLayer({
    id: 'world-flight-journey-routes-selected',
    type: 'line',
    source: 'world-flight-journey-routes',
    filter: ['==', 'active', true],
    paint: {
      'line-color': '#F8D28B',
      'line-width': 3.25,
      'line-opacity': 0.96,
    },
  });
  map.addLayer({
    id: 'world-flight-journey-route-arrows',
    type: 'symbol',
    source: 'world-flight-journey-routes',
    layout: {
      'symbol-placement': 'line-center',
      'text-field': '>',
      'text-font': ['Noto Sans Bold'],
      'text-size': 18,
      'text-rotate': 0,
      'text-rotation-alignment': 'map',
      // The arrow must point the way the class flew. By default the map turns text to stay upright, which flips
      // the arrow on routes flown westward.
      'text-keep-upright': false,
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': ['case', ['get', 'active'], '#F8D28B', '#BDEBFF'],
      'text-halo-color': '#071522',
      'text-halo-width': 1.5,
      'text-opacity': ['case', ['get', 'active'], 1, 0.78],
    },
  });
  map.addLayer({
    id: 'world-flight-journey-routes-hitbox',
    type: 'line',
    source: 'world-flight-journey-routes',
    paint: {
      'line-color': '#FFFFFF',
      'line-width': 16,
      'line-opacity': 0,
    },
  });
  map.addLayer({
    id: 'world-flight-expedition-routes-glow',
    type: 'line',
    source: 'world-flight-expedition-routes',
    paint: {
      'line-color': '#FDA4AF',
      'line-width': 9,
      'line-opacity': 0.13,
      'line-blur': 5,
    },
  });
  map.addLayer({
    id: 'world-flight-expedition-routes-line',
    type: 'line',
    source: 'world-flight-expedition-routes',
    paint: {
      'line-color': '#FFE4E6',
      'line-width': 2.5,
      'line-opacity': ['case', ['get', 'suggestedOrder'], 0.9, 0.68],
    },
  });
  map.addLayer({
    id: 'world-flight-expedition-route-arrows',
    type: 'symbol',
    source: 'world-flight-expedition-routes',
    filter: ['==', 'suggestedOrder', true],
    layout: {
      'symbol-placement': 'line-center',
      'text-field': '>',
      'text-font': ['Noto Sans Bold'],
      'text-size': 17,
      'text-rotation-alignment': 'map',
      // The arrow must point the way the class flew. By default the map turns text to stay upright, which flips
      // the arrow on routes flown westward.
      'text-keep-upright': false,
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': '#FFE4E6',
      'text-halo-color': '#071522',
      'text-halo-width': 1.5,
      'text-opacity': 0.92,
    },
  });
  map.addLayer({
    id: 'world-flight-route-glow',
    type: 'line',
    source: 'world-flight-route',
    paint: {
      'line-color': '#38D5FF',
      'line-width': 7,
      'line-opacity': 0.14,
    },
  });
  map.addLayer({
    id: 'world-flight-route-line',
    type: 'line',
    source: 'world-flight-route',
    paint: {
      'line-width': 2.5,
      'line-opacity': 0.88,
      'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, '#67E8F9', 0.01, 'rgba(103,232,249,0)'],
    },
  });
  map.addLayer({
    id: 'world-flight-next-range-line',
    type: 'line',
    source: 'world-flight-next-range',
    paint: {
      'line-color': '#67E8F9',
      'line-width': 1.75,
      'line-opacity': 0.75,
      'line-dasharray': [2, 2],
    },
  });
  map.addLayer({
    id: 'world-flight-passport-city-highlight',
    type: 'circle',
    source: 'world-flight-cities',
    filter: ['==', 'passportHighlight', true],
    paint: {
      'circle-radius': 13,
      'circle-color': '#F59E0B',
      'circle-opacity': 0.12,
      'circle-stroke-color': '#F8D28B',
      'circle-stroke-width': 2.5,
      'circle-stroke-opacity': 0.95,
    },
  });
  map.addLayer({
    id: 'world-flight-expedition-recommended',
    type: 'circle',
    source: 'world-flight-cities',
    filter: ['==', 'expeditionRecommended', true],
    paint: {
      'circle-radius': 16,
      'circle-color': '#FDA4AF',
      'circle-opacity': 0.12,
      'circle-stroke-color': '#FFE4E6',
      'circle-stroke-width': 2.5,
      'circle-stroke-opacity': 0.95,
    },
  });
  map.addLayer({
    id: 'world-flight-expedition-stops',
    type: 'circle',
    source: 'world-flight-cities',
    filter: ['==', 'expeditionStop', true],
    paint: {
      'circle-radius': 12,
      'circle-color': 'rgba(0,0,0,0)',
      'circle-stroke-color': ['case', ['get', 'expeditionComplete'], '#86EFAC', '#FDA4AF'],
      'circle-stroke-width': 2.5,
      'circle-stroke-opacity': 0.95,
    },
  });
  map.addLayer({
    id: 'world-flight-city-dots',
    type: 'circle',
    source: 'world-flight-cities',
    paint: {
      'circle-radius': ['case', ['get', 'isOrigin'], 8, ['get', 'isPreviewOrigin'], 8, ['get', 'newlyReachable'], 8, ['get', 'missionEvidence'], 7, ['get', 'onwardReachable'], 6.5, ['get', 'visited'], 7, ['get', 'reachable'], 6, ['get', 'muted'], 4.5, 5.25],
      'circle-color': ['case', ['get', 'isOrigin'], '#F59E0B', ['get', 'isPreviewOrigin'], '#22D3EE', ['get', 'newlyReachable'], '#F8D28B', ['get', 'missionEvidence'], '#A78BFA', ['get', 'onwardReachable'], '#67E8F9', ['get', 'visited'], '#4DA3FF', ['get', 'reachable'], '#2FE59B', ['get', 'muted'], '#6F7F9C', '#8395B1'],
      'circle-stroke-color': ['case', ['get', 'isPreviewOrigin'], '#ECFEFF', ['get', 'newlyReachable'], '#FFF7D6', ['get', 'missionEvidence'], '#EDE9FE', ['get', 'onwardReachable'], '#CFFAFE', ['get', 'visited'], '#BDE3FF', ['get', 'reachable'], '#07111f', ['get', 'muted'], '#07111f', '#B6C6DA'],
      'circle-stroke-width': ['case', ['get', 'isPreviewOrigin'], 3, ['get', 'newlyReachable'], 3, ['get', 'missionEvidence'], 3, ['get', 'onwardReachable'], 2.5, ['get', 'visited'], 2.5, ['get', 'reachable'], 2, ['get', 'muted'], 2, 1.25],
      'circle-opacity': ['case', ['get', 'isOrigin'], 1, ['get', 'isPreviewOrigin'], 1, ['get', 'newlyReachable'], 1, ['get', 'missionEvidence'], 1, ['get', 'onwardReachable'], 1, ['get', 'visited'], 1, ['get', 'reachable'], 0.95, ['get', 'muted'], 0.55, 0.82],
    },
  });
  map.addLayer({
    id: 'world-flight-expedition-stop-labels',
    type: 'symbol',
    source: 'world-flight-cities',
    filter: ['>', 'expeditionOrder', 0],
    layout: {
      'text-field': ['to-string', ['get', 'expeditionOrder']],
      'text-font': ['Noto Sans Bold'],
      'text-size': 9,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': '#071522',
      'text-halo-color': '#FFE4E6',
      'text-halo-width': 0.5,
    },
  });
  map.addLayer({
    id: 'world-flight-city-labels',
    type: 'symbol',
    source: 'world-flight-cities',
    layout: {
      'text-field': ['get', 'city'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 12,
      'text-offset': [0, 1.2],
      'text-anchor': 'top',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#EAF1FF',
      'text-halo-color': '#07111f',
      'text-halo-width': 1.5,
    },
  });
  map.addLayer({
    id: 'world-flight-visited-checks',
    type: 'symbol',
    source: 'world-flight-cities',
    filter: ['all', ['==', 'visited', true], ['==', 'isOrigin', false]],
    layout: {
      'text-field': '✓',
      'text-font': ['Noto Sans Bold'],
      'text-size': 10,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': '#071522',
    },
  });
  map.addLayer({
    id: 'world-flight-journey-step-dots',
    type: 'circle',
    source: 'world-flight-journey-steps',
    paint: {
      'circle-radius': ['case', ['get', 'active'], 10, 8],
      'circle-color': ['case', ['get', 'active'], '#F59E0B', '#12304A'],
      'circle-stroke-color': ['case', ['get', 'active'], '#F8D28B', '#9EDFFF'],
      'circle-stroke-width': ['case', ['get', 'active'], 2.5, 2],
      'circle-opacity': 0.98,
    },
  });
  map.addLayer({
    id: 'world-flight-journey-step-labels',
    type: 'symbol',
    source: 'world-flight-journey-steps',
    layout: {
      'text-field': ['to-string', ['get', 'routeNumber']],
      'text-font': ['Noto Sans Bold'],
      'text-size': 10,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': '#F7FBFF',
    },
  });
}
