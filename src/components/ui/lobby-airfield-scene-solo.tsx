'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DestinationScene } from '@/lib/world-flight/types';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { SkyBackground } from '@/components/ui/sky-background';
import { LobbyAirfieldScene } from '@/components/ui/lobby-airfield-scene';
import type { TimeOfDay, WeatherCondition } from '@/components/world-flight/arrival-scene/types';
import { WEATHER_CONDITIONS } from '@/components/world-flight/arrival-scene/weather';

// Full-frame lobby scene for high-res inspection / screenshots. State from the
// URL: ?city=&tod=&weather=. Renders the origin-themed LobbyAirfieldScene over
// the same SkyBackground the live Launch Lobby uses, so reviewers can sweep every
// city's horizon alignment and weather/time without launching a session.
const TIMES: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];

export function SoloLobbyScene() {
  const byId = useMemo(() => {
    const map = new Map<string, DestinationScene>();
    for (const d of WORLD_DESTINATIONS) map.set(d.id, d.scene);
    return map;
  }, []);

  const [city, setCity] = useState('tokyo');
  const [tod, setTod] = useState<TimeOfDay>('dusk');
  const [weather, setWeather] = useState<WeatherCondition>('clear');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('city');
    const td = params.get('tod') as TimeOfDay | null;
    const w = params.get('weather') as WeatherCondition | null;
    if (c && byId.has(c)) setCity(c);
    if (td && TIMES.includes(td)) setTod(td);
    if (w && (WEATHER_CONDITIONS as readonly string[]).includes(w)) setWeather(w);
  }, [byId]);

  const scene = byId.get(city) ?? byId.get('tokyo')!;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#0a0e16', overflow: 'hidden' }}>
      <SkyBackground weatherState="climbing" earthState="takeoff" intensity="subtle" showEarth={false} showMoon />
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <LobbyAirfieldScene originId={city} scene={scene} timeOfDay={tod} weather={weather} className="absolute inset-0" />
      </div>

      {/* Minimal controls */}
      <div style={{ position: 'fixed', top: 12, left: 12, zIndex: 20, display: 'flex', gap: 8, flexWrap: 'wrap', fontFamily: 'monospace', fontSize: 12 }}>
        <select value={city} onChange={(e) => setCity(e.target.value)}>
          {WORLD_DESTINATIONS.map((d) => (
            <option key={d.id} value={d.id}>{d.city}</option>
          ))}
        </select>
        <select value={tod} onChange={(e) => setTod(e.target.value as TimeOfDay)}>
          {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={weather} onChange={(e) => setWeather(e.target.value as WeatherCondition)}>
          {WEATHER_CONDITIONS.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>
    </div>
  );
}

export default SoloLobbyScene;
