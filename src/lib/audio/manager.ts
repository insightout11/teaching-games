/**
 * Sound manager — the only thing in the app that touches audio playback.
 *
 * Design notes (docs/sound-design.md §6):
 * - Audio is ALWAYS additive. Every entry point is wrapped so a failure to play can
 *   never break a lesson; the meaning is always on screen.
 * - Preferences are a per-DEVICE teacher setting in localStorage, deliberately NOT
 *   in SessionSettings — muting your classroom speakers is not lesson content and
 *   must not sync to students or persist into a saved lesson.
 * - Browsers block audio until a user gesture. `unlock()` is called from the
 *   session-start click; before that, every play is a no-op rather than an error.
 */
import { ALL_SOUND_URLS, DESCENT_SOUNDS, SOUNDS, TAKEOFF_SOUNDS, type SoundKey } from './sounds';
import type { EngineClass } from '@/lib/plane-progression';

const PREFS_KEY = 'lc-audio-prefs';

export interface AudioPrefs {
  /** SFX default ON — the cinematic layer is the point of the feature. */
  sfxEnabled: boolean;
  /** Lobby bed default ON: a bed that is off by default can never do its job. */
  musicEnabled: boolean;
  /** 0..1 master trim applied on top of each clip's baked-in level. */
  volume: number;
}

const DEFAULT_PREFS: AudioPrefs = { sfxEnabled: true, musicEnabled: true, volume: 0.8 };

/** The bed sits well under the cues — it plays while people are talking over it. */
const MUSIC_TRIM = 0.55;

let prefs: AudioPrefs = { ...DEFAULT_PREFS };
let unlocked = false;
let loaded = false;
const cache = new Map<string, HTMLAudioElement>();
const listeners = new Set<(p: AudioPrefs) => void>();

function loadPrefs(): AudioPrefs {
  if (loaded || typeof window === 'undefined') return prefs;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AudioPrefs>;
      prefs = {
        sfxEnabled: typeof parsed.sfxEnabled === 'boolean' ? parsed.sfxEnabled : DEFAULT_PREFS.sfxEnabled,
        musicEnabled: typeof parsed.musicEnabled === 'boolean' ? parsed.musicEnabled : DEFAULT_PREFS.musicEnabled,
        volume:
          typeof parsed.volume === 'number' && parsed.volume >= 0 && parsed.volume <= 1
            ? parsed.volume
            : DEFAULT_PREFS.volume,
      };
    }
  } catch {
    /* corrupt or unavailable storage — defaults are fine */
  }
  return prefs;
}

function persist() {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode / quota — preference just won't survive the session */
  }
  listeners.forEach((fn) => fn(prefs));
}

export function getAudioPrefs(): AudioPrefs {
  return loadPrefs();
}

export function setSfxEnabled(enabled: boolean) {
  loadPrefs();
  prefs = { ...prefs, sfxEnabled: enabled };
  if (!enabled) stopAll();
  persist();
}

export function setVolume(volume: number) {
  loadPrefs();
  prefs = { ...prefs, volume: Math.max(0, Math.min(1, volume)) };
  persist();
}

export function subscribeAudioPrefs(fn: (p: AudioPrefs) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function element(url: string): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  let el = cache.get(url);
  if (!el) {
    el = new Audio(url);
    el.preload = 'auto';
    cache.set(url, el);
  }
  return el;
}

/**
 * Prime playback from inside a user gesture. Browsers only grant audio permission
 * synchronously during a real click, so we start-and-immediately-pause each clip to
 * bank the permission and warm the cache.
 */
export function unlock() {
  if (unlocked || typeof window === 'undefined') return;
  unlocked = true;
  ALL_SOUND_URLS.forEach((url) => {
    const el = element(url);
    if (!el) return;
    el.volume = 0;
    el.play()
      .then(() => {
        el.pause();
        el.currentTime = 0;
        el.volume = 1;
      })
      .catch(() => {
        el.volume = 1;
      });
  });
}

export function isUnlocked() {
  return unlocked;
}

export function stopAll() {
  cache.forEach((el) => {
    try {
      el.pause();
      el.currentTime = 0;
    } catch {
      /* element may not be ready; nothing to stop */
    }
  });
}

interface PlayOptions {
  /** Wait this long before starting — used to land a cue on an animation keyframe. */
  delayMs?: number;
  /** Per-cue trim, multiplied with the master volume. */
  gain?: number;
}

function playUrl(url: string, opts: PlayOptions = {}): () => void {
  loadPrefs();
  if (typeof window === 'undefined' || !prefs.sfxEnabled) return () => {};

  let cancelled = false;
  const start = () => {
    if (cancelled) return;
    const base = element(url);
    if (!base) return;
    // Clone so overlapping cues (a touchdown under a fading takeoff) don't cut
    // each other off by rewinding a shared element.
    const node = base.cloneNode(true) as HTMLAudioElement;
    node.volume = Math.max(0, Math.min(1, prefs.volume * (opts.gain ?? 1)));
    node.play().catch(() => {
      /* not unlocked yet, or the tab is backgrounded — additive, so ignore */
    });
  };

  if (opts.delayMs && opts.delayMs > 0) {
    const t = window.setTimeout(start, opts.delayMs);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }
  start();
  return () => {
    cancelled = true;
  };
}

/** Play a one-shot by semantic key. Returns a cancel function for pending delays. */
export function play(key: SoundKey, opts?: PlayOptions): () => void {
  return playUrl(SOUNDS[key], opts);
}

/** Play the takeoff cue for a plane's propulsion family (docs/sound-design.md §2a). */
export function playTakeoff(engineClass: EngineClass, opts?: PlayOptions): () => void {
  return playUrl(TAKEOFF_SOUNDS[engineClass], opts);
}

/** Play the approach bed — same propulsion family as takeoff, heard from further off. */
export function playDescent(engineClass: EngineClass, opts?: PlayOptions): () => void {
  return playUrl(DESCENT_SOUNDS[engineClass], opts);
}

// ─── Music: a separate channel with its own lifecycle ───────────────────────
// Music is NOT a one-shot. It has to be interruptible mid-playback and fade
// rather than cut, and it must stop dead the instant a module starts (§2), so it
// gets one dedicated element rather than the clone-per-play path above.

let musicEl: HTMLAudioElement | null = null;
let musicFade: number | null = null;

function clearMusicFade() {
  if (musicFade !== null) {
    window.clearInterval(musicFade);
    musicFade = null;
  }
}

/** Fade the lobby bed in. No-op if music is disabled or already playing. */
export function startMusic(url: string, fadeMs = 1800) {
  loadPrefs();
  if (typeof window === 'undefined' || !prefs.musicEnabled) return;
  if (musicEl && !musicEl.paused) return;

  clearMusicFade();
  if (!musicEl) {
    musicEl = new Audio(url);
    musicEl.preload = 'auto';
  }
  const target = Math.max(0, Math.min(1, prefs.volume * MUSIC_TRIM));
  musicEl.volume = 0;
  musicEl.play().catch(() => {
    /* no gesture yet — the bed simply doesn't start, which is fine */
  });

  const step = 50;
  let elapsed = 0;
  musicFade = window.setInterval(() => {
    elapsed += step;
    if (!musicEl) return clearMusicFade();
    musicEl.volume = Math.min(target, (elapsed / fadeMs) * target);
    if (elapsed >= fadeMs) clearMusicFade();
  }, step);
}

/** Fade the lobby bed out and stop it. Called the moment a module starts. */
export function stopMusic(fadeMs = 700) {
  if (typeof window === 'undefined' || !musicEl) return;
  clearMusicFade();
  const el = musicEl;
  const from = el.volume;
  const step = 50;
  let elapsed = 0;
  musicFade = window.setInterval(() => {
    elapsed += step;
    el.volume = Math.max(0, from * (1 - elapsed / fadeMs));
    if (elapsed >= fadeMs) {
      clearMusicFade();
      el.pause();
      el.currentTime = 0;
    }
  }, step);
}

export function setMusicEnabled(enabled: boolean) {
  loadPrefs();
  prefs = { ...prefs, musicEnabled: enabled };
  if (!enabled) stopMusic(300);
  persist();
}
