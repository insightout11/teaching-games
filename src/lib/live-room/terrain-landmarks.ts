import { LANDMARK_CATALOG } from '@/data/world/landmark-catalog';
import { drawnKindOf } from './landmarks-ahead';
import { toRoute } from './coast-strip';
import { bearingDeg } from './sun';
import type { LatLng } from './route-terrain';
import type { SurfaceGrid } from './terrain-surface';
import type { WorldLandmark, WorldLandmarkKind } from '@/components/live-room/flight/world-landmarks';

export function naturalLandmark(kind: WorldLandmarkKind): boolean {
  return kind === 'fuji' || kind === 'everest' || kind === 'matterhorn' || kind === 'kilimanjaro' || kind === 'volcano';
}
export const SUMMIT_NAMES: Partial<Record<WorldLandmarkKind, string>> = {
  fuji: 'Mount Fuji', everest: 'Mount Everest', matterhorn: 'Matterhorn', kilimanjaro: 'Kilimanjaro', volcano: 'Volcano',
};

/** Same catalogue IDs and geographic positions used by Look, photo chance and the album. */
export function terrainRouteLandmarks(from: LatLng, to: LatLng, km: number): WorldLandmark[] {
  const heading = bearingDeg(from, to) * Math.PI / 180;
  return LANDMARK_CATALOG.flatMap(place => {
    const kind = drawnKindOf(place.id); if (!kind) return [];
    const [along, lateral] = toRoute(from, heading, place);
    return along >= -40 && along <= km + 180 && Math.abs(lateral) < 145
      ? [{ id: place.id, kind, along, ahead: along, lateral }] : [];
  });
}

/** Restore a sampled summit's prominence locally; no new cone or disconnected geometry. Take-off only. */
export function sharpenTerrainSummits(g: SurfaceGrid, from: LatLng, to: LatLng, km: number): void {
  for (const place of terrainRouteLandmarks(from, to, km)) {
    if (!naturalLandmark(place.kind)) continue;
    const row = Math.round((place.along! - g.ahead0) / g.step), col = Math.round((place.lateral - g.side0) / g.step);
    let best = -1, high = 0;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      const r = row + dr, c = col + dc;
      if (r < 2 || c < 2 || r >= g.rows - 2 || c >= g.cols - 2) continue;
      const i = r * g.cols + c;
      if (g.height[i] > high) { best = i; high = g.height[i]; }
    }
    if (best < 0 || high < 500) continue;
    const br = Math.floor(best / g.cols), bc = best % g.cols;
    const everest = place.kind === 'everest', support = everest ? 3 : 2, lift = everest ? Math.min(650, high * 0.08) : Math.min(180, high * 0.04);
    for (let dr = -support; dr <= support; dr++) for (let dc = -support; dc <= support; dc++) {
      const radius = Math.hypot(dr, dc) / support;
      if (radius >= 1) continue;
      const r = br + dr, c = bc + dc;
      if (r >= 0 && c >= 0 && r < g.rows && c < g.cols && g.height[r * g.cols + c] > 0)
        g.height[r * g.cols + c] += lift * (everest ? (1 - radius * radius) ** 2 : (1 - radius) ** 2);
    }
  }
}

/** Drawing style never participates in detection: natural summits retain their catalogue IDs and positions. */
export function photoLandmarkId(landmarks: ReadonlyMap<string, { x: number; z: number }>, cameraZ: number, focal: number, width: number, near = 3600): string | null {
  let result: string | null = null, closest = Infinity;
  landmarks.forEach((landmark, id) => {
    const z = landmark.z - cameraZ;
    if (z < near || z > 44000 || Math.abs(landmark.x * focal / z) > width * 0.42) return;
    if (z < closest) { result = id; closest = z; }
  });
  return result;
}

/** A quiet, fixed side-window view at the same real landmark, for the existing selfie card. */
export function selfieTerrainRoute(kind: WorldLandmarkKind, id?: string): { from: LatLng; to: LatLng; id: string } | null {
  const place = LANDMARK_CATALOG.find(l => l.id === id) ?? LANDMARK_CATALOG.find(l => drawnKindOf(l.id) === kind);
  if (!place) return null;
  return { id: place.id, from: { lat: place.lat - 0.25, lng: place.lng }, to: { lat: place.lat + 0.25, lng: place.lng } };
}
