'use client';

import { useState } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';
import { BrandSting } from '@/components/ui/brand-sting';
import { play, playTakeoff, setSfxEnabled, setVolume, stopAll } from '@/lib/audio/manager';
import { useAudioPrefs } from '@/lib/audio/use-audio';
import { TOUCHDOWN_DELAY_MS, brandResolveDelayMs } from '@/lib/audio/sounds';
import type { EngineClass } from '@/lib/plane-progression';

const ENGINES: { key: EngineClass; label: string; planes: string }[] = [
  { key: 'piston', label: 'Piston', planes: 'LC Cadet · Wayfarer · Scout · Cloud Hopper · Trailblazer · Sky Racer' },
  { key: 'twin-prop', label: 'Twin-prop', planes: 'Cargo Cruiser · Twin-Prop Scout · Storm Runner' },
  { key: 'electric', label: 'Electric', planes: 'Solar Flyer · Aurora Glider' },
  { key: 'jet', label: 'Jet', planes: 'Future Flyer · Starliner Mini · Comet Jet' },
];

const ONE_SHOTS = [
  { key: 'brandResolve' as const, label: 'Brand resolve', note: 'chime attack 0.83s into the clip' },
  { key: 'touchdown' as const, label: 'Touchdown', note: 'tyre + gear, shared across all planes' },
  { key: 'arrivalResolve' as const, label: 'Arrival resolve', note: 'chord peak at 1.36s' },
];

function Row({ label, note, onPlay }: { label: string; note: string; onPlay: () => void }) {
  return (
    <button
      onClick={onPlay}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors"
    >
      <Play className="w-4 h-4 shrink-0 text-lc-blue" />
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-white">{label}</span>
        <span className="block text-xs text-white/45 truncate">{note}</span>
      </span>
    </button>
  );
}

export function SoundsDevClient() {
  const { sfxEnabled, volume } = useAudioPrefs();
  const [sting, setSting] = useState<'full' | 'short' | null>(null);

  return (
    <div className="min-h-screen bg-[#07111f] text-white p-8">
      {sting && (
        <div className="fixed inset-0 z-50">
          <BrandSting variant={sting} onComplete={() => setSting(null)} />
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold">Sound board</h1>
          <p className="text-sm text-white/50">
            Tune levels here rather than discovering a bad mix while projecting to a class.
          </p>
        </header>

        {/* Master controls */}
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
          <button
            onClick={stopAll}
            className="text-xs text-white/45 hover:text-white/70 transition-colors"
          >
            Stop everything
          </button>
        </section>

        {/* In-context timing */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">In context</h2>
          <p className="text-xs text-white/40">
            The only honest test of the chime: it should crack exactly as the spark bursts.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Row
              label="Brand sting — full"
              note={`chime scheduled at +${brandResolveDelayMs('full')}ms`}
              onPlay={() => setSting('full')}
            />
            <Row
              label="Brand sting — short"
              note={`chime scheduled at +${brandResolveDelayMs('short')}ms`}
              onPlay={() => setSting('short')}
            />
          </div>
          <Row
            label="Touchdown, on the bounce keyframe"
            note={`fires ${TOUCHDOWN_DELAY_MS}ms after the descent overlay mounts`}
            onPlay={() => play('touchdown', { delayMs: TOUCHDOWN_DELAY_MS })}
          />
        </section>

        {/* Raw clips */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">One-shots</h2>
          <div className="space-y-2">
            {ONE_SHOTS.map((s) => (
              <Row key={s.key} label={s.label} note={s.note} onPlay={() => play(s.key)} />
            ))}
          </div>
        </section>

        {/* Engine classes */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
            Takeoff by engine class
          </h2>
          <p className="text-xs text-white/40">
            Play these back to back — each tier should feel like an upgrade on the one before.
          </p>
          <div className="space-y-2">
            {ENGINES.map((e) => (
              <Row
                key={e.key}
                label={e.label}
                note={e.planes}
                onPlay={() => playTakeoff(e.key)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
