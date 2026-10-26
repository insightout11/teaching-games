/**
 * Landmark rarity (Oct 2026): which real LessonCaptain routes pass each landmark (both directions, any plane's range,
 * the live view rule), written to src/data/world/landmark-rarity.json: route counts per landmark, and the landmarks
 * on each route. Rerun after adding cities or landmarks:
 *   npx tsx scripts/landmark-rarity.ts
 */
import { writeFileSync } from 'node:fs';
import { LANDMARK_CATALOG } from '../src/data/world/landmark-catalog';
import { routesForLandmark } from '../src/lib/live-room/landmark-gallery-routes';

const counts: Record<string, number> = {};
const routes: Record<string, string[]> = {};
for (const l of LANDMARK_CATALOG) {
  const found = routesForLandmark(l);
  counts[l.id] = found.length;
  for (const r of found) (routes[r.key] ??= []).push(l.id);
}
writeFileSync('src/data/world/landmark-rarity.json', JSON.stringify({ counts, routes }) + '\n');
console.log(Object.keys(routes).length, 'routes pass at least one landmark');
