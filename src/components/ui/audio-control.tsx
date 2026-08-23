'use client';

import { useEffect, useRef, useState } from 'react';
import { Music, Volume2, VolumeX } from 'lucide-react';
import { useAudioPrefs } from '@/lib/audio/use-audio';

/**
 * Always-reachable audio control.
 *
 * docs/sound-design.md §6.4 calls global mute non-negotiable, and it has to be
 * reachable DURING a lesson — a teacher whose room has gone quiet cannot go
 * hunting through settings. It sits bottom-right so it clears the sidebar in
 * windowed mode and the stage in full screen, and stays dim until hovered
 * because this screen is projected to a class.
 *
 * Deliberately not in SessionSettingsBar: that bar is lesson content which syncs
 * and persists, and muting your own speakers is neither.
 */
export function AudioControl() {
  const { sfxEnabled, musicEnabled, volume, setSfxEnabled, setMusicEnabled, setVolume } =
    useAudioPrefs();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const allMuted = !sfxEnabled && !musicEnabled;

  return (
    <div ref={ref} className="fixed bottom-4 right-4 z-[70] print:hidden">
      {open && (
        <div className="mb-2 w-56 p-3 rounded-xl bg-[#0b1626]/95 border border-white/12 backdrop-blur shadow-xl space-y-3">
          <button
            onClick={() => setSfxEnabled(!sfxEnabled)}
            className="w-full flex items-center justify-between text-sm text-white/80 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Flight sounds
            </span>
            <span className={sfxEnabled ? 'text-lc-blue' : 'text-white/35'}>
              {sfxEnabled ? 'On' : 'Off'}
            </span>
          </button>

          <button
            onClick={() => setMusicEnabled(!musicEnabled)}
            className="w-full flex items-center justify-between text-sm text-white/80 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              Lobby music
            </span>
            <span className={musicEnabled ? 'text-lc-blue' : 'text-white/35'}>
              {musicEnabled ? 'On' : 'Off'}
            </span>
          </button>

          <label className="block space-y-1.5 pt-1 border-t border-white/10">
            <span className="flex items-center justify-between text-xs text-white/55">
              <span>Volume</span>
              <span className="tabular-nums">{Math.round(volume * 100)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-lc-blue"
              aria-label="Audio volume"
            />
          </label>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={allMuted ? 'Audio muted — open audio settings' : 'Open audio settings'}
        className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
          open
            ? 'bg-[#0b1626] border-white/20 text-white opacity-100'
            : allMuted
              ? 'bg-[#0b1626]/70 border-white/12 text-white/50 opacity-70 hover:opacity-100'
              : 'bg-[#0b1626]/60 border-white/10 text-white/45 opacity-40 hover:opacity-100'
        }`}
      >
        {allMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
