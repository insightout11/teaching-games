'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import type { DestinationScene } from '@/lib/world-flight/types';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { HOME_BASE_ID, HOME_BASE_NAME, HOME_BASE_SCENE } from '@/lib/world-flight/home-base';
import { DestinationArrivalScene } from '../destination-arrival-scene';
import { isAuthoredLandmark } from '../scene-registry';
import type { ArrivalMode, ArrivalMotion, ArrivalPhase, TimeOfDay, WeatherCondition } from '../types';
import { ARRIVAL_DURATION_MS, DEPARTURE_DURATION_MS, arrivalTimeline } from '../cinematic-motion';
import { WEATHER_CONDITIONS, rollWeather } from '../weather';

interface GalleryItem {
  id: string;
  label: string;
  scene: DestinationScene;
  fixture?: boolean;
}

// Validation cities NOT in destinations.ts — gallery-local scene fixtures only
// Keep gallery-only fixtures here when validating scenes that are not yet real destinations.
const FIXTURES: GalleryItem[] = [
  // LC International — the home base. Not a real destination (no readings/coords),
  // so it lives here as a fixture for review of the lobby/transition/ground scene.
  { id: HOME_BASE_ID, label: HOME_BASE_NAME, scene: HOME_BASE_SCENE, fixture: true },
  // Shanghai — 50th city. Fixture for art review until the real destination
  // entry (videos/readings) is wired in destinations.ts, at which point this
  // line can be removed. Oriental Pearl (foreground) + Lujiazui trio skyline.
  {
    id: 'shanghai',
    label: 'Shanghai',
    fixture: true,
    scene: {
      terrain: 'urban',
      vegetation: 'broadleaf',
      skyline: 'highrise',
      skylineVariant: 'shanghai',
      landmarkSilhouette: 'oriental-pearl',
      palette: 'night',
    },
  },
];

const PHASES: ArrivalPhase[] = ['approach', 'touchdown', 'taxi', 'landed'];
const ASPECTS: { label: string; value: string }[] = [
  { label: '16:9', value: '16 / 9' },
  { label: '21:9', value: '21 / 9' },
  { label: '32:9', value: '32 / 9' },
];
const TIMES: (TimeOfDay | 'baked')[] = ['baked', 'dawn', 'day', 'dusk', 'night'];
const StaticArrivalScene = memo(DestinationArrivalScene);
StaticArrivalScene.displayName = 'StaticArrivalScene';

export function ArrivalSceneGallery() {
  const items = useMemo<GalleryItem[]>(
    () => [
      ...FIXTURES,
      ...WORLD_DESTINATIONS.map((d) => ({ id: d.id, label: d.city, scene: d.scene })),
    ],
    [],
  );

  const [selectedId, setSelectedId] = useState(items[0].id);
  const [phase, setPhase] = useState<ArrivalPhase>('approach');
  const [progress, setProgress] = useState(0.6);
  const [clientReady, setClientReady] = useState(false);
  const [cinematicRun, setCinematicRun] = useState(0);
  const [cinematicPlaying, setCinematicPlaying] = useState(false);

  // Click-to-enlarge lightbox + its review controls (aspect / time-of-day /
  // motion / arrival mode) so the whole verification matrix runs at large size.
  const [enlarged, setEnlarged] = useState(false);
  const [aspect, setAspect] = useState(ASPECTS[0].value);
  const [tod, setTod] = useState<TimeOfDay | 'baked'>('baked');
  const [mode, setMode] = useState<ArrivalMode>('arrival');
  const [lbMotion, setLbMotion] = useState<ArrivalMotion>('animated');
  const [weather, setWeather] = useState<WeatherCondition>('clear');

  // Esc closes the lightbox.
  useEffect(() => {
    if (!enlarged) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEnlarged(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enlarged]);

  // Seed state from the URL (?city=&phase=&progress=) after mount so a headless
  // screenshot can target any city/phase/progress. Done in an effect to avoid
  // a server/client hydration mismatch.
  useEffect(() => {
    setClientReady(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('city');
    const ph = params.get('phase') as ArrivalPhase | null;
    const pr = params.get('progress');
    const md = params.get('mode');
    if (c && items.some((i) => i.id === c)) setSelectedId(c);
    if (ph && PHASES.includes(ph)) setPhase(ph);
    if (pr != null && !Number.isNaN(Number(pr))) setProgress(Math.min(1, Math.max(0, Number(pr))));
    if (md === 'arrival' || md === 'departure') setMode(md);
    const wthr = params.get('weather') as WeatherCondition | null;
    if (wthr && WEATHER_CONDITIONS.includes(wthr)) setWeather(wthr);
  }, [items]);

  useEffect(() => {
    if (!cinematicRun) return;
    const startedAt = performance.now();
    let frameId = 0;
    setCinematicPlaying(true);
    // Departure drives raw progress (the plane/camera read progress, not phase);
    // arrival walks the shared phase timeline. Mode is captured at play start.
    const isDeparture = mode === 'departure';
    const duration = isDeparture ? DEPARTURE_DURATION_MS : ARRIVAL_DURATION_MS;

    const animate = (now: number) => {
      const timelineProgress = Math.min((now - startedAt) / duration, 1);
      if (isDeparture) {
        setProgress(timelineProgress);
      } else {
        const frame = arrivalTimeline(timelineProgress);
        setPhase(frame.phase);
        setProgress(frame.progress);
      }
      if (timelineProgress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setCinematicPlaying(false);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cinematicRun]);

  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  // This dev inspection tool renders 50+ complex SVG scenes. Client-mount it so
  // early scenes cannot start ambient effects while the root is still hydrating.
  if (!clientReady) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b1120', color: '#9fb0c7', padding: '24px 28px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        Loading arrival scene gallery...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', color: '#e6edf6', padding: '24px 28px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Arrival Scene Gallery</h1>
      <p style={{ margin: '0 0 20px', color: '#9fb0c7', fontSize: 13 }}>
        {items.length} scenes ({WORLD_DESTINATIONS.length} destinations + {FIXTURES.length} fixtures). Thumbnails are static;
        select a city to drive the animated preview through phases. Cities using the
        generic landmark fallback are tagged.
      </p>

      {/* Animated preview for the selected city */}
      <section style={{ marginBottom: 28, background: '#111a2e', borderRadius: 14, padding: 16, border: '1px solid #1f2c45' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <strong style={{ fontSize: 15 }}>{selected.label}</strong>
          <span style={{ fontSize: 12, color: '#9fb0c7' }}>
            {selected.scene.terrain} · {selected.scene.skyline} · {selected.scene.vegetation ?? 'none'} · {selected.scene.palette} · {selected.scene.landmarkSilhouette ?? '—'}
          </span>
          {!isAuthoredLandmark(selected.scene.landmarkSilhouette) && (
            <span style={{ fontSize: 11, color: '#ffce7a', border: '1px solid #5a4a1f', borderRadius: 6, padding: '1px 6px' }}>generic landmark</span>
          )}
          <button
            onClick={() => setEnlarged(true)}
            style={{ marginLeft: 'auto', fontSize: 12, padding: '5px 12px', borderRadius: 7, cursor: 'pointer', background: '#1c2742', color: '#e6edf6', border: '1px solid #2a3a5c' }}
          >
            ⤢ Enlarge
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* live, phase-driven — click to enlarge */}
          <figure style={{ margin: 0, width: 560, maxWidth: '100%' }}>
            <div
              onClick={() => setEnlarged(true)}
              title="Click to enlarge"
              style={{ aspectRatio: '16 / 9', borderRadius: 10, overflow: 'hidden', border: '1px solid #1f2c45', cursor: 'zoom-in' }}
            >
              <DestinationArrivalScene destinationId={selected.id} scene={selected.scene} phase={phase} progress={progress} mode={mode} weather={weather} motion="animated" />
            </div>
            <figcaption style={{ fontSize: 12, color: '#9fb0c7', marginTop: 6 }}>animated · {mode} · {weather} · {phase} · progress {progress.toFixed(2)} · click to enlarge</figcaption>
          </figure>

          {/* approach vs landed comparison */}
          <div style={{ display: 'flex', gap: 12 }}>
            {(['approach', 'landed'] as ArrivalPhase[]).map((ph) => (
              <figure key={ph} style={{ margin: 0, width: 270 }}>
                <div style={{ aspectRatio: '16 / 9', borderRadius: 10, overflow: 'hidden', border: '1px solid #1f2c45' }}>
                  <StaticArrivalScene destinationId={selected.id} scene={selected.scene} phase={ph} progress={ph === 'approach' ? 0.5 : 1} motion="static" />
                </div>
                <figcaption style={{ fontSize: 12, color: '#9fb0c7', marginTop: 6 }}>{ph}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* controls */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['arrival', 'departure'] as ArrivalMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  fontSize: 12, padding: '5px 12px', borderRadius: 7, cursor: 'pointer',
                  background: mode === m ? '#3b82f6' : '#1c2742', color: '#e6edf6',
                  border: '1px solid #2a3a5c',
                }}
              >
                {m}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCinematicRun((value) => value + 1)}
            style={{
              fontSize: 12, padding: '5px 12px', borderRadius: 7, cursor: 'pointer',
              background: '#0f766e', color: '#ecfeff', border: '1px solid #2dd4bf',
            }}
          >
            {cinematicPlaying ? 'Restart' : mode === 'departure' ? 'Play departure' : 'Play cinematic'}
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            {PHASES.map((ph) => (
              <button
                key={ph}
                onClick={() => setPhase(ph)}
                style={{
                  fontSize: 12, padding: '5px 12px', borderRadius: 7, cursor: 'pointer',
                  background: phase === ph ? '#3b82f6' : '#1c2742', color: '#e6edf6',
                  border: '1px solid #2a3a5c',
                }}
              >
                {ph}
              </button>
            ))}
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#9fb0c7' }}>
            progress
            <input type="range" min={0} max={1} step={0.01} value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
          </label>
        </div>
      </section>

      {/* Static thumbnail matrix */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
        {items.map((item) => {
          const generic = !isAuthoredLandmark(item.scene.landmarkSilhouette);
          return (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              style={{
                textAlign: 'left', padding: 0, cursor: 'pointer', background: 'transparent', border: 'none',
                outline: selectedId === item.id ? '2px solid #3b82f6' : 'none', borderRadius: 12,
              }}
            >
              <div style={{ aspectRatio: '16 / 9', borderRadius: 10, overflow: 'hidden', border: '1px solid #1f2c45', background: '#000' }}>
                <StaticArrivalScene destinationId={item.id} scene={item.scene} phase="landed" progress={1} motion="static" />
              </div>
              <div style={{ padding: '6px 4px 2px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center' }}>
                  {item.label}
                  {item.fixture && <span style={{ fontSize: 10, color: '#7fd1c4' }}>fixture</span>}
                  {generic && <span style={{ fontSize: 10, color: '#ffce7a' }}>generic</span>}
                </div>
                <div style={{ fontSize: 11, color: '#7f8ea6' }}>
                  {item.scene.terrain} · {item.scene.skyline} · {item.scene.vegetation ?? 'none'} · {item.scene.palette}
                </div>
                <div style={{ fontSize: 11, color: '#7f8ea6' }}>landmark: {item.scene.landmarkSilhouette ?? '—'}</div>
              </div>
            </button>
          );
        })}
      </section>

      {/* Click-to-enlarge lightbox */}
      {enlarged && (
        <div
          onClick={() => setEnlarged(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(4,8,18,0.92)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 24, gap: 14,
          }}
        >
          {/* header */}
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 12, alignItems: 'center', width: '95vw', maxWidth: 2400 }}>
            <strong style={{ fontSize: 16 }}>{selected.label}</strong>
            <span style={{ fontSize: 12, color: '#9fb0c7' }}>
              {selected.scene.landmarkSilhouette ?? '—'} · {mode} · {weather} · {tod === 'baked' ? `baked (${selected.scene.palette})` : tod} · {lbMotion}
            </span>
            <button
              onClick={() => setEnlarged(false)}
              style={{ marginLeft: 'auto', fontSize: 13, padding: '6px 14px', borderRadius: 7, cursor: 'pointer', background: '#1c2742', color: '#e6edf6', border: '1px solid #2a3a5c' }}
            >
              ✕ Close (Esc)
            </button>
          </div>

          {/* large scene at the chosen aspect ratio */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '95vw', maxWidth: 2400, aspectRatio: aspect, borderRadius: 12, overflow: 'hidden', border: '1px solid #243352', background: '#000' }}
          >
            <DestinationArrivalScene
              destinationId={selected.id}
              scene={selected.scene}
              phase={phase}
              progress={progress}
              motion={lbMotion}
              mode={mode}
              weather={weather}
              timeOfDay={tod === 'baked' ? undefined : tod}
            />
          </div>

          {/* controls */}
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', width: '95vw', maxWidth: 2400 }}>
            <ButtonRow label="aspect" options={ASPECTS.map((a) => a.label)} value={ASPECTS.find((a) => a.value === aspect)!.label} onPick={(l) => setAspect(ASPECTS.find((a) => a.label === l)!.value)} />
            <ButtonRow label="time" options={TIMES} value={tod} onPick={(t) => setTod(t as TimeOfDay | 'baked')} />
            <ButtonRow label="mode" options={['arrival', 'departure']} value={mode} onPick={(m) => setMode(m as ArrivalMode)} />
            <ButtonRow label="motion" options={['animated', 'static']} value={lbMotion} onPick={(m) => setLbMotion(m as ArrivalMotion)} />
            <ButtonRow label="phase" options={PHASES} value={phase} onPick={(p) => setPhase(p as ArrivalPhase)} />
            <ButtonRow label="weather" options={WEATHER_CONDITIONS} value={weather} onPick={(w) => setWeather(w as WeatherCondition)} />
            <button
              onClick={() => setWeather(rollWeather(`${selected.id}:${Date.now()}`, selected.scene, tod === 'night' || (tod === 'baked' && selected.scene.palette === 'night')))}
              style={{ fontSize: 12, padding: '5px 11px', borderRadius: 7, cursor: 'pointer', background: '#0f766e', color: '#ecfeff', border: '1px solid #2dd4bf' }}
            >
              🎲 random
            </button>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#9fb0c7' }}>
              progress
              <input type="range" min={0} max={1} step={0.01} value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// Small labelled segmented control used in the lightbox.
function ButtonRow({ label, options, value, onPick }: { label: string; options: readonly string[]; value: string; onPick: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#7f8ea6' }}>{label}</span>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onPick(o)}
          style={{
            fontSize: 12, padding: '5px 11px', borderRadius: 7, cursor: 'pointer',
            background: value === o ? '#3b82f6' : '#1c2742', color: '#e6edf6', border: '1px solid #2a3a5c',
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export default ArrivalSceneGallery;
