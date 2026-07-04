'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl, { type Map as MapLibreMap, type Marker as MapLibreMarker } from 'maplibre-gl';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createWorldFlightGuessMapStyle, createCityStreetMapStyle } from '@/data/world-flight/map-style';
import type { InputSpec } from '@/lib/input-spec';

interface GeoPointInputProps {
  spec: InputSpec;
  onSubmit: (value: string) => Promise<void>;
  isSubmitting: boolean;
  submitStatus: 'idle' | 'success' | 'error' | 'rate_limited';
  clientId?: string;
}

export function GeoPointInput({ spec, onSubmit, isSubmitting, submitStatus, clientId }: GeoPointInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);
  const lockedRef = useRef(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

  const studentState = clientId
    ? spec.perStudentData?.[clientId] as {
        locked?: boolean;
        /** Directions info-gap: this device is the guide — they see the target and give
         * directions instead of dropping a pin. */
        guide?: boolean;
        target?: { lat: number; lng: number; label?: string };
      } | undefined
    : undefined;
  const isGuide = studentState?.guide === true;
  const locked = submitStatus === 'success' || studentState?.locked === true;
  lockedRef.current = locked || isGuide;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: spec.mapStyle === 'city-streets'
        ? createCityStreetMapStyle(spec.mapLabels ?? false)
        : createWorldFlightGuessMapStyle(spec.mapLabels ?? false),
      center: spec.mapCenter ?? [10, 18],
      zoom: spec.mapZoom ?? 0.8,
      minZoom: 0.5,
      maxZoom: spec.mapMaxZoom ?? 7,
      maxBounds: spec.mapBounds
        ? [[spec.mapBounds[0], spec.mapBounds[1]], [spec.mapBounds[2], spec.mapBounds[3]]]
        : undefined,
      attributionControl: false,
      renderWorldCopies: false,
      dragRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    // Fixed reference markers (e.g. the START point in the directions game) with a small
    // always-visible label so students know where the route begins. `wf-map-popup-shell`
    // is the app's dark popup — the default popup is white and unreadable on this theme.
    const escapeHtml = (value: string) =>
      value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const addLabelledMarker = (lat: number, lng: number, color: string, label?: string) => {
      const marker = new maplibregl.Marker({ color }).setLngLat([lng, lat]).addTo(map);
      if (label) {
        marker.setPopup(
          new maplibregl.Popup({ className: 'wf-map-popup-shell', closeButton: false, closeOnClick: false, offset: 18 })
            .setHTML(`<div class="wf-map-popup"><span style="font-weight:600">${escapeHtml(label)}</span></div>`),
        );
        marker.togglePopup();
      }
    };
    for (const ref of spec.mapMarkers ?? []) {
      addLabelledMarker(ref.lat, ref.lng, ref.color ?? '#34d399', ref.label);
    }
    // The guide's secret: only this device sees the destination.
    if (isGuide && studentState?.target) {
      addLabelledMarker(studentState.target.lat, studentState.target.lng, '#fbbf24', studentState.target.label ?? 'Destination');
    }

    map.on('click', (event) => {
      if (lockedRef.current) return;
      const next = { lat: event.lngLat.lat, lng: event.lngLat.lng };
      setPosition(next);
      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker({ color: '#22d3ee' })
          .setLngLat([next.lng, next.lat])
          .addTo(map);
      } else {
        markerRef.current.setLngLat([next.lng, next.lat]);
      }
    });

    mapRef.current = map;
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // InputSpec updates as classmates submit; the map only needs rebuilding for a new keyed round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!position || isSubmitting || locked) return;
    await onSubmit(JSON.stringify({
      roundId: spec.roundId,
      lat: position.lat,
      lng: position.lng,
    }));
  }, [isSubmitting, locked, onSubmit, position, spec.roundId]);

  return (
    <div className="space-y-4">
      {spec.prompt && <p className="text-center text-sm font-semibold text-cyan-300">{spec.prompt}</p>}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-950">
        <div ref={containerRef} className="h-[360px] w-full" />
        {isGuide && (
          <div className="pointer-events-none absolute inset-x-4 top-4 rounded-xl border border-amber-300/40 bg-slate-950/90 px-3 py-2 text-center text-xs text-amber-100 backdrop-blur">
            You&apos;re the guide! The gold pin is the destination — describe the route from START out loud. Don&apos;t show your screen!
          </div>
        )}
        {!position && !locked && !isGuide && (
          <div className="pointer-events-none absolute inset-x-4 top-4 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-center text-xs text-slate-200 backdrop-blur">
            {spec.mapStyle === 'city-streets' ? 'Tap the map where the directions lead.' : 'Tap the map to place your radar contact.'}
          </div>
        )}
        {locked && !isGuide && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/45">
            <div className="rounded-2xl border border-cyan-300/30 bg-slate-950/90 px-5 py-4 text-center shadow-xl">
              <MapPin className="mx-auto mb-2 h-7 w-7 text-cyan-300" />
              <p className="font-bold text-white">Position locked</p>
              <p className="mt-1 text-xs text-slate-400">Watch the main screen for the reveal.</p>
            </div>
          </div>
        )}
      </div>
      {isGuide ? (
        <p className="text-center text-xs text-amber-200/80">
          Guide the class with words only — left, right, past, across from. No pin for you this round.
        </p>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            {position ? `${Math.abs(position.lat).toFixed(1)} deg ${position.lat >= 0 ? 'N' : 'S'}, ${Math.abs(position.lng).toFixed(1)} deg ${position.lng >= 0 ? 'E' : 'W'}` : 'No position selected'}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!position || isSubmitting || locked}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {isSubmitting ? 'Locking...' : locked ? 'Locked' : 'Lock Position'}
          </Button>
        </div>
      )}
    </div>
  );
}
