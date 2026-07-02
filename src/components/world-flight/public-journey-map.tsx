'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type Popup as MapLibrePopup } from 'maplibre-gl';
import { WORLD_FLIGHT_MAP_STYLE } from '@/data/world-flight/map-style';
import { destinationCoord, greatCircleLine, type WorldFeature, type WorldFeatureCollection } from '@/lib/world-flight/geo';
import type { DestinationPack } from '@/lib/world-flight/types';

export interface PublicJourneyMapStop {
  id: string;
  city: string;
  country: string;
  airport: string;
  region: string;
  lat: number;
  lng: number;
  date: string | null;
}

interface PublicJourneyMapProps {
  stops: PublicJourneyMapStop[];
  totalKm: number;
  className: string;
}

const EMPTY_COLLECTION: WorldFeatureCollection = { type: 'FeatureCollection', features: [] };

function toMapData(data: WorldFeatureCollection) {
  return data as Parameters<GeoJSONSource['setData']>[0];
}

function getSource(sourceId: string, map: MapLibreMap | null) {
  return map?.getSource(sourceId) as GeoJSONSource | undefined;
}

function stopAsDestination(stop: PublicJourneyMapStop): DestinationPack {
  return {
    id: stop.id,
    city: stop.city,
    country: stop.country,
    region: stop.region,
    lat: stop.lat,
    lng: stop.lng,
    primaryAirport: stop.airport,
  } as DestinationPack;
}

function routeFeatures(stops: PublicJourneyMapStop[]): WorldFeatureCollection {
  const features: WorldFeature[] = [];
  for (let index = 1; index < stops.length; index += 1) {
    const origin = stops[index - 1];
    const destination = stops[index];
    features.push({
      ...greatCircleLine(stopAsDestination(origin), stopAsDestination(destination)),
      properties: {
        routeNumber: index,
        originCity: origin.city,
        destinationCity: destination.city,
        completedAt: destination.date ?? '',
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

function stopFeatures(stops: PublicJourneyMapStop[], activeStopId: string | null): WorldFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: stops.map((stop, index) => ({
      type: 'Feature',
      properties: {
        id: stop.id,
        city: stop.city,
        country: stop.country,
        airport: stop.airport,
        region: stop.region,
        stopNumber: index + 1,
        date: stop.date ?? '',
        isOrigin: index === 0,
        isCurrent: index === stops.length - 1,
        active: stop.id === activeStopId,
      },
      geometry: {
        type: 'Point',
        coordinates: destinationCoord(stopAsDestination(stop)),
      },
    })),
  };
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return 'Journey origin';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function createStopPopup(properties: Record<string, unknown>) {
  const wrapper = document.createElement('div');
  wrapper.className = 'wf-map-popup';
  const title = document.createElement('strong');
  title.textContent = `${properties.city}, ${properties.country}`;
  const meta = document.createElement('span');
  meta.textContent = `${properties.airport} - Stop ${properties.stopNumber}`;
  const date = document.createElement('span');
  date.textContent = formatDate(typeof properties.date === 'string' ? properties.date : null);
  wrapper.append(title, meta, date);
  return wrapper;
}

function createRoutePopup(properties: Record<string, unknown>) {
  const wrapper = document.createElement('div');
  wrapper.className = 'wf-map-popup';
  const title = document.createElement('strong');
  title.textContent = `Flight ${properties.routeNumber}`;
  const route = document.createElement('span');
  route.textContent = `${properties.originCity} to ${properties.destinationCity}`;
  const date = document.createElement('span');
  date.textContent = formatDate(typeof properties.completedAt === 'string' ? properties.completedAt : null);
  wrapper.append(title, route, date);
  return wrapper;
}

function fitStops(map: MapLibreMap, stops: PublicJourneyMapStop[]) {
  if (stops.length === 0) return;
  if (stops.length === 1) {
    map.easeTo({ center: [stops[0].lng, stops[0].lat], zoom: 2.8, duration: 800 });
    return;
  }

  const longitudes = stops
    .map((stop) => ((stop.lng % 360) + 360) % 360)
    .sort((a, b) => a - b);
  let largestGap = -1;
  let routeStart = longitudes[0];
  for (let index = 0; index < longitudes.length; index += 1) {
    const current = longitudes[index];
    const next = index === longitudes.length - 1 ? longitudes[0] + 360 : longitudes[index + 1];
    if (next - current > largestGap) {
      largestGap = next - current;
      routeStart = next % 360;
    }
  }

  const unwrappedLongitudes = stops.map((stop) => {
    const normalized = ((stop.lng % 360) + 360) % 360;
    return normalized < routeStart ? normalized + 360 : normalized;
  });
  const latitudes = stops.map((stop) => stop.lat);

  map.fitBounds(
    [
      [Math.min(...unwrappedLongitudes), Math.min(...latitudes)],
      [Math.max(...unwrappedLongitudes), Math.max(...latitudes)],
    ],
    {
      padding: { top: 92, right: 92, bottom: 92, left: 92 },
      maxZoom: 3.8,
      duration: 950,
    },
  );
}

export function PublicJourneyMap({ stops, totalKm, className }: PublicJourneyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<MapLibrePopup | null>(null);
  const [ready, setReady] = useState(false);
  const [activeStopId, setActiveStopId] = useState<string | null>(stops[stops.length - 1]?.id ?? null);

  const routes = useMemo(() => routeFeatures(stops), [stops]);
  const stopPoints = useMemo(() => stopFeatures(stops, activeStopId), [activeStopId, stops]);
  const finalStop = stops[stops.length - 1] ?? null;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: WORLD_FLIGHT_MAP_STYLE,
      center: finalStop ? [finalStop.lng, finalStop.lat] : [12, 20],
      zoom: finalStop ? 2.1 : 1.35,
      minZoom: 1,
      maxZoom: 7,
      attributionControl: false,
      renderWorldCopies: false,
      scrollZoom: false,
      dragRotate: true,
      pitchWithRotate: false,
    });
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      map.setProjection({ type: 'globe' });
      map.addSource('public-journey-routes', {
        type: 'geojson',
        data: toMapData(EMPTY_COLLECTION),
      });
      map.addSource('public-journey-stops', {
        type: 'geojson',
        data: toMapData(EMPTY_COLLECTION),
      });

      map.addLayer({
        id: 'public-journey-routes-glow',
        type: 'line',
        source: 'public-journey-routes',
        paint: {
          'line-color': '#38BDF8',
          'line-width': 8,
          'line-opacity': 0.18,
          'line-blur': 5,
        },
      });
      map.addLayer({
        id: 'public-journey-routes-line',
        type: 'line',
        source: 'public-journey-routes',
        paint: {
          'line-color': '#7DD3FC',
          'line-width': 2.6,
          'line-opacity': 0.9,
        },
      });
      map.addLayer({
        id: 'public-journey-route-arrows',
        type: 'symbol',
        source: 'public-journey-routes',
        layout: {
          'symbol-placement': 'line-center',
          'text-field': '>',
          'text-font': ['Noto Sans Bold'],
          'text-size': 18,
          'text-rotation-alignment': 'map',
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#BDEBFF',
          'text-halo-color': '#071522',
          'text-halo-width': 1.5,
        },
      });
      map.addLayer({
        id: 'public-journey-routes-hitbox',
        type: 'line',
        source: 'public-journey-routes',
        paint: {
          'line-color': '#ffffff',
          'line-width': 18,
          'line-opacity': 0,
        },
      });
      map.addLayer({
        id: 'public-journey-stop-glow',
        type: 'circle',
        source: 'public-journey-stops',
        paint: {
          'circle-radius': ['case', ['get', 'isCurrent'], 21, ['get', 'active'], 18, 14],
          'circle-color': ['case', ['get', 'isCurrent'], '#F59E0B', ['get', 'active'], '#67E8F9', '#4DA3FF'],
          'circle-opacity': ['case', ['get', 'isCurrent'], 0.28, 0.18],
          'circle-blur': 0.28,
        },
      });
      map.addLayer({
        id: 'public-journey-stop-dots',
        type: 'circle',
        source: 'public-journey-stops',
        paint: {
          'circle-radius': ['case', ['get', 'isCurrent'], 9, ['get', 'active'], 8, 6],
          'circle-color': ['case', ['get', 'isCurrent'], '#F59E0B', ['get', 'isOrigin'], '#A78BFA', '#4DA3FF'],
          'circle-stroke-color': ['case', ['get', 'isCurrent'], '#FEF3C7', '#DBEAFE'],
          'circle-stroke-width': ['case', ['get', 'isCurrent'], 3, 2],
          'circle-opacity': 0.98,
        },
      });
      map.addLayer({
        id: 'public-journey-stop-numbers',
        type: 'symbol',
        source: 'public-journey-stops',
        layout: {
          'text-field': ['to-string', ['get', 'stopNumber']],
          'text-font': ['Noto Sans Bold'],
          'text-size': 10,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': '#071522',
          'text-halo-color': 'rgba(255,255,255,0.2)',
          'text-halo-width': 0.4,
        },
      });
      map.addLayer({
        id: 'public-journey-stop-labels',
        type: 'symbol',
        source: 'public-journey-stops',
        layout: {
          'text-field': ['get', 'city'],
          'text-font': ['Noto Sans Bold'],
          'text-size': ['case', ['get', 'isCurrent'], 14, 12],
          'text-offset': [0, 1.25],
          'text-anchor': 'top',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': ['case', ['get', 'isCurrent'], '#FEF3C7', '#EAF1FF'],
          'text-halo-color': '#07111f',
          'text-halo-width': 1.75,
        },
      });

      const showStopPopup = (event: maplibregl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = 'pointer';
        const properties = event.features?.[0]?.properties as Record<string, unknown> | undefined;
        if (!properties) return;
        const stopId = typeof properties.id === 'string' ? properties.id : null;
        setActiveStopId(stopId);
        const popup = popupRef.current ?? new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 14,
          className: 'wf-map-popup-shell',
        });
        popupRef.current = popup;
        popup.setLngLat(event.lngLat).setDOMContent(createStopPopup(properties)).addTo(map);
      };
      const showRoutePopup = (event: maplibregl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = 'pointer';
        const properties = event.features?.[0]?.properties as Record<string, unknown> | undefined;
        if (!properties) return;
        const popup = popupRef.current ?? new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 14,
          className: 'wf-map-popup-shell',
        });
        popupRef.current = popup;
        popup.setLngLat(event.lngLat).setDOMContent(createRoutePopup(properties)).addTo(map);
      };
      const hidePopup = () => {
        map.getCanvas().style.cursor = '';
        popupRef.current?.remove();
      };

      for (const layerId of ['public-journey-stop-dots', 'public-journey-stop-labels', 'public-journey-stop-numbers']) {
        map.on('mouseenter', layerId, showStopPopup);
        map.on('mousemove', layerId, showStopPopup);
        map.on('mouseleave', layerId, hidePopup);
        map.on('click', layerId, showStopPopup);
      }
      map.on('mouseenter', 'public-journey-routes-hitbox', showRoutePopup);
      map.on('mousemove', 'public-journey-routes-hitbox', showRoutePopup);
      map.on('mouseleave', 'public-journey-routes-hitbox', hidePopup);

      setReady(true);
      window.setTimeout(() => {
        map.resize();
        fitStops(map, stops);
      }, 120);
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [finalStop, stops]);

  useEffect(() => {
    if (!ready) return;
    getSource('public-journey-routes', mapRef.current)?.setData(toMapData(routes));
    getSource('public-journey-stops', mapRef.current)?.setData(toMapData(stopPoints));
  }, [ready, routes, stopPoints]);

  return (
    <section className="relative min-h-[520px] overflow-hidden border-y border-cyan-200/15 bg-[#06111f] sm:min-h-[560px] lg:min-h-[660px]">
      <div ref={containerRef} className="absolute inset-0" aria-label={`${className} World Flight route map`} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(103,232,249,0.16),transparent_32%),linear-gradient(90deg,rgba(5,12,22,0.92)_0%,rgba(5,12,22,0.54)_34%,rgba(5,12,22,0.08)_66%,rgba(5,12,22,0.72)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#07111f] to-transparent" />

      <div className="pointer-events-none relative z-10 flex min-h-[520px] flex-col justify-between px-4 py-5 sm:min-h-[560px] sm:px-5 sm:py-6 lg:min-h-[660px] lg:px-10 lg:py-9">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-slate-950/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-100 shadow-2xl shadow-black/30 backdrop-blur">
            Live World Flight map
          </div>
          <h2 className="font-display mt-4 max-w-lg text-3xl leading-tight text-white sm:text-5xl">
            The route so far
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-cyan-50/72">
            {stops.length} passport stamps connected by real city coordinates and great-circle flight paths.
          </p>
        </div>

        <div className="grid max-w-4xl gap-2 sm:grid-cols-3">
          <MapBadge label="Distance flown" value={`${totalKm.toLocaleString()} km`} />
          <MapBadge label="Current city" value={finalStop ? `${finalStop.city}, ${finalStop.country}` : 'Not started'} />
          <MapBadge label="Map controls" value="Drag, pinch, hover" />
        </div>
      </div>
    </section>
  );
}

function MapBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="pointer-events-auto rounded-md border border-cyan-200/18 bg-slate-950/78 px-4 py-3 shadow-xl shadow-black/25 backdrop-blur">
      <p className="font-instrument text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100/60">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-cyan-50">{value}</p>
    </div>
  );
}
