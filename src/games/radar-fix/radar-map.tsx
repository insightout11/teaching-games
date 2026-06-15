'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl';
import { createWorldFlightGuessMapStyle } from '@/data/world-flight/map-style';
import type { DestinationPack } from '@/lib/world-flight/types';

export interface RadarGuess {
  studentKey: string;
  displayName: string;
  lat: number;
  lng: number;
  distanceKm: number;
  basePoints: number;
  closestBonus: number;
  lessonPoints: number;
}
interface RadarMapProps {
  answer: DestinationPack;
  guesses: RadarGuess[];
  revealed: boolean;
}

const EMPTY_COLLECTION = { type: 'FeatureCollection', features: [] } as const;

function mapData(data: unknown) {
  return data as Parameters<GeoJSONSource['setData']>[0];
}

export function RadarMap({ answer, guesses, revealed }: RadarMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);

  const ranked = useMemo(
    () => [...guesses].sort((a, b) => a.distanceKm - b.distanceKm),
    [guesses],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createWorldFlightGuessMapStyle(false),
      center: [10, 18],
      zoom: 0.8,
      minZoom: 0.5,
      maxZoom: 6,
      attributionControl: false,
      renderWorldCopies: false,
      dragRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      map.addSource('radar-guesses', { type: 'geojson', data: mapData(EMPTY_COLLECTION) });
      map.addSource('radar-lines', { type: 'geojson', data: mapData(EMPTY_COLLECTION) });
      map.addSource('radar-answer', { type: 'geojson', data: mapData(EMPTY_COLLECTION) });

      map.addLayer({
        id: 'radar-lines',
        type: 'line',
        source: 'radar-lines',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 1.5,
          'line-opacity': 0.5,
          'line-dasharray': [2, 2],
        },
      });
      map.addLayer({
        id: 'radar-guess-glow',
        type: 'circle',
        source: 'radar-guesses',
        paint: {
          'circle-radius': 12,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.18,
          'circle-blur': 0.4,
        },
      });
      map.addLayer({
        id: 'radar-guesses',
        type: 'circle',
        source: 'radar-guesses',
        paint: {
          'circle-radius': 6,
          'circle-color': ['get', 'color'],
          'circle-stroke-color': '#f8fafc',
          'circle-stroke-width': 1.5,
        },
      });
      map.addLayer({
        id: 'radar-ranks',
        type: 'symbol',
        source: 'radar-guesses',
        layout: {
          'text-field': ['get', 'rankLabel'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 10,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#f8fafc',
          'text-halo-color': '#071522',
          'text-halo-width': 1.5,
        },
      });
      map.addLayer({
        id: 'radar-answer-glow',
        type: 'circle',
        source: 'radar-answer',
        paint: {
          'circle-radius': 20,
          'circle-color': '#f59e0b',
          'circle-opacity': 0.2,
          'circle-blur': 0.3,
        },
      });
      map.addLayer({
        id: 'radar-answer',
        type: 'circle',
        source: 'radar-answer',
        paint: {
          'circle-radius': 9,
          'circle-color': '#f59e0b',
          'circle-stroke-color': '#fef3c7',
          'circle-stroke-width': 3,
        },
      });
      map.addLayer({
        id: 'radar-answer-label',
        type: 'symbol',
        source: 'radar-answer',
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 13,
          'text-offset': [0, 1.35],
          'text-anchor': 'top',
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#fef3c7',
          'text-halo-color': '#071522',
          'text-halo-width': 2,
        },
      });
      setReady(true);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const palette = ['#facc15', '#cbd5e1', '#fb923c'];
    const guessFeatures = revealed
      ? ranked.map((guess, index) => ({
          type: 'Feature',
          properties: {
            color: palette[index] ?? '#22d3ee',
            rankLabel: index < 3 ? `${index + 1}. ${guess.displayName}` : '',
          },
          geometry: { type: 'Point', coordinates: [guess.lng, guess.lat] },
        }))
      : [];
    const lineFeatures = revealed
      ? ranked.map((guess, index) => ({
          type: 'Feature',
          properties: { color: palette[index] ?? '#22d3ee' },
          geometry: {
            type: 'LineString',
            coordinates: [[guess.lng, guess.lat], [answer.lng, answer.lat]],
          },
        }))
      : [];
    const answerFeatures = revealed
      ? [{
          type: 'Feature',
          properties: { label: `${answer.city}, ${answer.country}` },
          geometry: { type: 'Point', coordinates: [answer.lng, answer.lat] },
        }]
      : [];

    (map.getSource('radar-guesses') as GeoJSONSource)?.setData(mapData({ type: 'FeatureCollection', features: guessFeatures }));
    (map.getSource('radar-lines') as GeoJSONSource)?.setData(mapData({ type: 'FeatureCollection', features: lineFeatures }));
    (map.getSource('radar-answer') as GeoJSONSource)?.setData(mapData({ type: 'FeatureCollection', features: answerFeatures }));
  }, [answer, ranked, ready, revealed]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-950">
      <div ref={containerRef} className="h-[390px] w-full" />
      {!revealed && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[140%] w-px origin-top -translate-x-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite] bg-gradient-to-b from-cyan-300/70 via-cyan-300/10 to-transparent" />
          <div className="absolute left-4 top-4 rounded-xl border border-cyan-300/20 bg-slate-950/80 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-200 backdrop-blur">
            Contacts received: {guesses.length}
          </div>
        </div>
      )}
    </div>
  );
}
