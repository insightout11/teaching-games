'use client';

import { useState } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';
import { BrandSting } from '@/components/ui/brand-sting';
import {
  FlightTransitionOverlay,
  type FlightTransitionLeg,
} from '@/components/session/flight-transition-overlay';
import { HOME_BASE_ID, HOME_BASE_NAME, HOME_BASE_SCENE } from '@/lib/world-flight/home-base';
import {
  play,
  playTakeoff,
  setMusicEnabled,
  setSfxEnabled,
  setVolume,
  startMusic,
  stopAll,
  stopMusic,
} from '@/lib/audio/manager';
import { LOBBY_BED } from '@/lib/audio/sounds';
import { useAudioPrefs } from '@/lib/audio/use-audio';
import type { EngineClass } from '@/lib/plane-progression';

/**
 * Audio tuning board.
 *
 * The point is watching and listening TOGETHER — a clip played against a blank
 * screen tells you nothing about whether it lands on the beat it is cut for. So
 * the transitions here mount the real FlightTransitionOverlay with the same props
 * session-view passes it, including the home-base departure/arrival scenes, which
 * is what puts takeoff on its 4800ms path rather than the 3200ms one.
 */

/** One representative plane per propulsion family — the overlay resolves the sound. */
const ENGINES: { key: EngineClass; planeKey: string; label: string; planes: string }[] = [
  { key: 'piston', planeKey: 'starter-biplane', label: 'Piston', planes: 'Cadet · Wayfarer · Scout · Cloud Hopper · Trailblazer · Sky Racer' },
  { key: 'twin-prop', planeKey: 'cargo-cruiser', label: 'Twin-prop', planes: 'Cargo Cruiser · Twin-Prop Scout · Storm Runner' },
  { key: 'electric', planeKey: 'aurora-glider', label: 'Electric', planes: 'Solar Flyer · Aurora Glider' },
  { key: 'jet', planeKey: 'comet-jet', label: 'Jet', planes: 'Future Flyer · Starliner Mini · Comet Jet' },
];

const scene = (planeKey: string) => ({
  destinationId: HOME_BASE_ID,
  scene: HOME_BASE_SCENE,
  cityName: HOME_BASE_NAME,
  timeOfDay: 'day' as const,
  weather: 'clear' as const,
  planeKey,
});

interface Running {
  leg: FlightTransitionLeg;
  planeKey: string;
  stageId?: string;
}

/** Cruise micro-events, which replace the plain swell with their own beat. */
const MICRO_EVENTS: { stageId: string; label: string; note: string }[] = [
  { stageId: 'opinion-pulse', label: 'Turbulence', note: 'low rumble on the same gate as the jitter' },
  { stageId: 'navigation-check', label: 'Radar', note: 'sweep wash + blips on G' },
  { stageId: 'accuracy-check', label: 'Instrument', note: 'no cue of its own — falls back to the cruise swell' },
];

export function SoundsDevClient() {
  const { sfxEnabled, musicEnabled, volume } = useAudioPrefs();
  const [bedPlaying, setBedPlaying] = useState(false);
  const [sting, setSting] = useState<'full' | 'short' | null>(null);
  const [flight, setFlight] = useState<Running | null>(null);
  const [engine, setEngine] = useState<EngineClass>('piston');

  const current = ENGINES.find((e) => e.key === engine) ?? ENGINES[0];

  const runLeg = (leg: FlightTransitionLeg, stageId?: string) => {
    stopAll();
    setFlight(null);
    // Remount so the overlay's effects re-fire even on a repeat press.
    window.setTimeout(() => setFlight({ leg, planeKey: current.planeKey, stageId }), 40);
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white p-8">
      {sting && (
        <div className="fixed inset-0 z-50">
          <BrandSting variant={sting} onComplete={() => setSting(null)} />
        </div>
      )}

      {flight && (
        <div className="fixed inset-0 z-50">
          <FlightTransitionOverlay
            from="Warm-up"
            to="Main activity"
            weatherState="golden"
            altitudeFrom={flight.leg === 'takeoff' ? 0 : 0.8}
            altitudeTo={flight.leg === 'descent' ? 0 : 0.8}
            leg={flight.leg}
            planeKey={flight.planeKey}
            weather="clear"
            isMicroEvent={!!flight.stageId}
            stageId={flight.stageId}
            arrivalScene={scene(flight.planeKey)}
            departureScene={scene(flight.planeKey)}
            onDismiss={() => setFlight(null)}
          />
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold">Sound board</h1>
          <p className="text-sm text-white/50">
            Watch and listen together — a clip on its own tells you nothing about whether it
            lands on the beat it was cut for.
          </p>
        </header>

        <section className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Sound effects</span>
            <button
              onClick={() => setSfxEnabled(!sfxEnabled)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm transition-colors"
            >
              {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {sfxEnabled ? 'On' : 'Muted'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Lobby music</span>
            <button
              onClick={() => setMusicEnabled(!musicEnabled)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm transition-colors"
            >
              {musicEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {musicEnabled ? 'On' : 'Muted'}
            </button>
          </div>
          <label className="block space-y-2">
            <span className="flex items-center justify-between text-sm">
              <span className="text-white/70">Master volume</span>
              <span className="tabular-nums text-white/45">{Math.round(volume * 100)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-lc-blue"
            />
          </label>
        </section>

        {/* The real thing */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
              Flight transitions — real overlay
            </h2>
            <p className="text-xs text-white/40 mt-1">
              Same component and props the live session uses. Takeoff runs the 4800ms departure.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {ENGINES.map((e) => (
              <button
                key={e.key}
                onClick={() => setEngine(e.key)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  engine === e.key
                    ? 'bg-lc-blue text-[#070B14] font-semibold'
                    : 'bg-white/10 hover:bg-white/15 text-white/70'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-white/35 -mt-1">{current.planes}</p>

          <div className="grid grid-cols-3 gap-3">
            {(['takeoff', 'cruise', 'descent'] as FlightTransitionLeg[]).map((leg) => (
              <button
                key={leg}
                onClick={() => runLeg(leg)}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium capitalize transition-colors"
              >
                {leg}
              </button>
            ))}
          </div>
          <p className="text-xs text-white/35">
            Descent now carries the same engine family as takeoff, then the touchdown hit.
          </p>

          <button
            onClick={() => runLeg('takeoff', 'opinion-pulse')}
            className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors"
          >
            <span className="block text-sm font-medium">Micro-event on a takeoff leg (slot 1)</span>
            <span className="block text-[11px] text-white/40 leading-snug">
              The case that used to swallow the beat — legs are picked by position, so a
              micro-event at slot 1 rendered as a takeoff. Should show turbulence, not a runway.
            </span>
          </button>

          <h3 className="text-xs font-semibold text-white/55 uppercase tracking-wider pt-2">
            Cruise micro-events
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {MICRO_EVENTS.map((m) => (
              <button
                key={m.stageId}
                onClick={() => runLeg('cruise', m.stageId)}
                className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors"
              >
                <span className="block text-sm font-medium">{m.label}</span>
                <span className="block text-[11px] text-white/40 leading-snug">{m.note}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Brand sting */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
            Brand sting — real component
          </h2>
          <p className="text-xs text-white/40">
            The cloud rush should be scored from the first frame, and the chime should crack
            exactly as the spark bursts.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSting('full')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors"
            >
              <Play className="w-4 h-4 text-lc-blue" />
              <span className="text-sm font-medium">Full — the shipping one</span>
            </button>
            <button
              onClick={() => setSting('short')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors"
            >
              <Play className="w-4 h-4 text-white/40" />
              <span className="text-sm text-white/60">Short — dev only, chime lands late</span>
            </button>
          </div>
        </section>

        {/* Lobby bed */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
            Lobby music
          </h2>
          <p className="text-xs text-white/40">
            In a real session this starts on the lobby phase and stops dead when the first
            module launches. Two minutes long, fades in over ~1.8s, and sits at 55% under the
            cues. The honest test is talking over it.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { startMusic(LOBBY_BED); setBedPlaying(true); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors"
            >
              <Play className="w-4 h-4 text-lc-blue" />
              Start bed
            </button>
            <button
              onClick={() => { stopMusic(); setBedPlaying(false); }}
              className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/60 transition-colors"
            >
              Stop (fade)
            </button>
            {bedPlaying && (
              <span className="self-center text-xs text-white/35">playing</span>
            )}
          </div>
        </section>

        {/* Bare clips, for level work only */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
            Bare clips
          </h2>
          <p className="text-xs text-white/40">
            For comparing levels only — judge timing in the sections above.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => play('touchdown')}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
            >
              Touchdown
            </button>
            <button
              onClick={() => { play('arrivalResolve'); play('captainApplause', { delayMs: 1050 }); }}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
            >
              End summary (chord + captain applause)
            </button>
            <button
              onClick={() => play('arrivalResolve')}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
            >
              Arrival resolve
            </button>
            {ENGINES.map((e) => (
              <button
                key={e.key}
                onClick={() => playTakeoff(e.key)}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
              >
                {e.label} takeoff
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
