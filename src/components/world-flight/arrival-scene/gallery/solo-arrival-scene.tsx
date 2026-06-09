'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DestinationScene } from '@/lib/world-flight/types';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { DestinationArrivalScene } from '../destination-arrival-scene';
import type { ArrivalMotion, ArrivalPhase } from '../types';

// Single full-frame scene for high-res inspection / screenshots. All state comes
// from the URL: ?city=&phase=&progress=&motion=. Gallery-local fixtures for the
// three validation cities not in destinations.ts are included here too.
const FIXTURES: Record<string, DestinationScene> = {
  honolulu: { terrain: 'island', vegetation: 'palms', skyline: 'low', landmarkSilhouette: 'diamond-head', palette: 'tropical' },
  reykjavik: { terrain: 'coastal', vegetation: 'none', skyline: 'low', landmarkSilhouette: 'hallgrimskirkja', palette: 'winter' },
  perth: { terrain: 'coastal', vegetation: 'broadleaf', skyline: 'highrise', landmarkSilhouette: 'kings-park-skyline', palette: 'golden' },
};

const PHASES: ArrivalPhase[] = ['approach', 'touchdown', 'taxi', 'landed'];

export function SoloArrivalScene() {
  const byId = useMemo(() => {
    const map = new Map<string, DestinationScene>();
    for (const d of WORLD_DESTINATIONS) map.set(d.id, d.scene);
    for (const [id, scene] of Object.entries(FIXTURES)) map.set(id, scene);
    return map;
  }, []);

  const [city, setCity] = useState('tokyo');
  const [phase, setPhase] = useState<ArrivalPhase>('approach');
  const [progress, setProgress] = useState(0.5);
  const [motion, setMotion] = useState<ArrivalMotion>('animated');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('city');
    const ph = params.get('phase') as ArrivalPhase | null;
    const pr = params.get('progress');
    const mo = params.get('motion');
    if (c && byId.has(c)) setCity(c);
    if (ph && PHASES.includes(ph)) setPhase(ph);
    if (pr != null && !Number.isNaN(Number(pr))) setProgress(Math.min(1, Math.max(0, Number(pr))));
    if (mo === 'static' || mo === 'animated') setMotion(mo);
  }, [byId]);

  const scene = byId.get(city) ?? byId.get('tokyo')!;

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
      <DestinationArrivalScene destinationId={city} scene={scene} phase={phase} progress={progress} motion={motion} />
    </div>
  );
}

export default SoloArrivalScene;
