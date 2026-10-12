// Speech for anything the app reads aloud (Radio Check, the captain's announcements, Junior questions).
//
// Two voices:
//  1. A NATURAL voice: clips made by the server (/api/tts). Good, but a clip takes several seconds to make, so
//     activities ask for their lines ahead of time with prepareSpeech(), usually as the activity loads.
//  2. The browser's own voice: instant, robotic. Used whenever the natural clip is not ready yet or cannot be made,
//     so speech never waits and never fails silently.
// speak() plays the natural clip when it is ready; otherwise it speaks with the browser voice straight away. An
// activity opts in by naming a role: then a missing clip is also fetched in the background, so the next time
// ("Hear it again") is natural. Callers that name no role keep the browser voice and cost nothing.
//
// Browser voice notes — speed matters: an unspecified voice often means Chrome's ONLINE Google voice (a network
// round-trip, ~1s delay on first use), and calling cancel() right before speak() adds a stall.
// So: load voices early, prefer an on-device English voice, and only cancel when busy.

/** Who is speaking: decides the natural voice and how the line is delivered. */
export type SpeechRole = 'presenter' | 'captain' | 'junior';

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function supported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const rank = (v: SpeechSynthesisVoice) =>
    (v.localService ? 0 : 10) + (v.lang === 'en-US' ? 0 : v.lang === 'en-GB' ? 1 : 2) + (v.default ? 0 : 0.5);
  return english.sort((a, b) => rank(a) - rank(b))[0] ?? null;
}

/** Load the voice list ahead of the first tap (it arrives asynchronously in Chrome). */
export function warmUpSpeech() {
  if (!supported()) return;
  const load = () => { cachedVoice = pickVoice(); };
  load();
  if (!cachedVoice) {
    window.speechSynthesis.addEventListener?.('voiceschanged', load, { once: true });
  }
}

// ─── Natural clips ──────────────────────────────────────────────────────────

type Clip = { url: string | null; promise: Promise<string | null> };
const clips = new Map<string, Clip>();
let current: HTMLAudioElement | null = null;
/** After a few failures in a row the server voice is left alone for this page: the browser voice carries on. */
let failures = 0;

const clipKey = (text: string, role: SpeechRole) => `${role}|${text.replace(/\s+/g, ' ').trim()}`;

function fetchClip(text: string, role: SpeechRole): Clip {
  const key = clipKey(text, role);
  const existing = clips.get(key);
  if (existing) return existing;
  const clip: Clip = { url: null, promise: Promise.resolve(null) };
  clip.promise = (async () => {
    if (typeof window === 'undefined' || failures >= 3 || text.trim().length < 2 || text.length > 700) return null;
    try {
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, role }) });
      if (!res.ok) throw new Error(String(res.status));
      clip.url = URL.createObjectURL(await res.blob());
      failures = 0;
      return clip.url;
    } catch {
      failures += 1;
      clips.delete(key); // allow another try later
      return null;
    }
  })();
  clips.set(key, clip);
  return clip;
}

/** Ask for natural clips ahead of time (as an activity loads), so the first play is already the good voice. */
export function prepareSpeech(texts: Array<string | null | undefined>, role: SpeechRole = 'presenter'): void {
  if (typeof window === 'undefined') return;
  for (const text of texts) if (text && text.trim()) fetchClip(text, role);
}

/** Stop anything being read aloud, natural or browser voice. */
export function stopSpeech(): void {
  try { current?.pause(); } catch { /* nothing playing */ }
  current = null;
  try { if (supported()) window.speechSynthesis.cancel(); } catch { /* no voice */ }
}

function speakWithBrowser(text: string, rate: number, onEnd?: () => void) {
  try {
    if (!supported()) { onEnd?.(); return; }
    const synth = window.speechSynthesis;
    if (cachedVoice === undefined) cachedVoice = pickVoice();
    if (synth.speaking || synth.pending) synth.cancel();
    // Chrome can leave the queue paused (e.g. after the tab was hidden).
    synth.resume();
    const u = new SpeechSynthesisUtterance(text);
    if (cachedVoice) { u.voice = cachedVoice; u.lang = cachedVoice.lang; } else u.lang = 'en-US';
    u.rate = rate;
    if (onEnd) { u.onend = () => onEnd(); u.onerror = () => onEnd(); }
    synth.speak(u);
  } catch {
    // no voice on this device: the button just does nothing
  }
}

/**
 * Read `text` aloud. `rate` is the browser-voice rate (0.9 normal); below 0.8 the natural clip is slowed too.
 * `role` opts in to the natural voice (and picks which one). Without it the browser voice is used unless a clip
 * for this exact line was prepared.
 */
export function speak(text: string, rate = 0.9, onEnd?: () => void, role?: SpeechRole) {
  // With a role: start the fetch if nobody prepared it, so the next play is natural. Without: only what exists.
  const clip = role ? fetchClip(text, role) : clips.get(clipKey(text, 'presenter'));
  if (!clip?.url) {
    speakWithBrowser(text, rate, onEnd);
    return;
  }
  try {
    stopSpeech();
    const audio = new Audio(clip.url);
    // Pace is set here, not in the clip: a slow replay, and a gentler pace for young children.
    audio.playbackRate = rate < 0.8 ? 0.82 : role === 'junior' ? 0.9 : 1;
    if (onEnd) { audio.onended = () => onEnd(); audio.onerror = () => onEnd(); }
    current = audio;
    void audio.play().catch(() => { current = null; speakWithBrowser(text, rate, onEnd); });
  } catch {
    speakWithBrowser(text, rate, onEnd);
  }
}
