'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { StyleSpecification } from 'maplibre-gl';
import { createExploreMapStyle, createQuizMapStyle, WORLD_FLIGHT_MAP_STYLE } from '@/data/world-flight/map-style';

/** Dev gallery (Oct 2026): the map's looks side by side, for the owner to approve before they go further. */
function Look({ title, note, style, center, zoom, globe = false }: { title: string; note: string; style: StyleSpecification; center: [number, number]; zoom: number; globe?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!box.current) return;
    const map = new maplibregl.Map({ container: box.current, style, center, zoom, attributionControl: false });
    if (globe) map.on('style.load', () => { try { (map as unknown as { setProjection: (p: { type: string }) => void }).setProjection({ type: 'globe' }); } catch { /* older map versions */ } });
    return () => map.remove();
  }, [style, center, zoom, globe]);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mb-2 text-xs text-white/55">{note}</p>
      <div ref={box} className="h-[340px] overflow-hidden rounded-xl" />
    </div>
  );
}

export function MapLooksGallery() {
  return (
    <div className="min-h-screen space-y-4 bg-[#05070d] p-5 text-white">
      <p className="font-display text-3xl">Map looks</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Look title="Quiz · with borders (easier)" note="Pin drop and guessing: no names, no city dots; terrain shading" style={createQuizMapStyle({ borders: true })} center={[100, 15]} zoom={2.6} />
        <Look title="Quiz · no borders (harder)" note="Only coastlines, rivers and the shape of the land" style={createQuizMapStyle({ borders: false })} center={[100, 15]} zoom={2.6} />
        <Look title="Explore · free conversation" note="Terrain, cities then towns as you zoom, rivers, peaks" style={createExploreMapStyle()} center={[9, 46.3]} zoom={5.6} />
        <Look title="Journey · the globe" note="The World Flight map as a turning globe (flat when zoomed right in)" style={WORLD_FLIGHT_MAP_STYLE} center={[100, 20]} zoom={1.4} globe />
      </div>
    </div>
  );
}
