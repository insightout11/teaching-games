// Speech for anything the app reads aloud (Radio Check, the captain's announcements, Junior questions).
//
// Two voices:
//  1. A NATURAL voice: clips made by the server (/api/tts). Good, but a clip takes several seconds to make, so
//     activities ask for their lines ahead of time with prepareSpeech(), usually as the activity loads.
//  2. The browser's own voice: instant, robotic. Used whenever the natural clip is not ready yet or cannot be made,
//     so speech never waits and never fails silently.
// An activity asks for the natural voice by naming a role. speak() then plays the clip, waiting a few seconds for
// it when it is not ready yet; the browser voice steps in only if the clip fails or is too slow. Callers that name
// no role (student phones, which are not signed in) keep the browser voice and cost nothing.
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
  turn += 1;
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

/** Each speak() or stopSpeech() takes a new number: a clip that arrives late for an old request is not played. */
let turn = 0;
/** How long a named-role line waits for its natural clip before the browser voice takes over. */
const WAIT_FOR_CLIP_MS = 6000;

function playClip(url: string, text: string, rate: number, onEnd: (() => void) | undefined, role: SpeechRole | undefined) {
  try {
    const audio = new Audio(url);
    // Pace is set here, not in the clip: a slow replay, and a gentler pace for young children.
    audio.playbackRate = rate < 0.8 ? 0.82 : role === 'junior' ? 0.9 : 1;
    if (onEnd) { audio.onended = () => onEnd(); audio.onerror = () => onEnd(); }
    current = audio;
    void audio.play().catch(() => { current = null; speakWithBrowser(text, rate, onEnd); });
  } catch {
    speakWithBrowser(text, rate, onEnd);
  }
}

/**
 * Read `text` aloud. `rate` is the browser-voice rate (0.9 normal); below 0.8 the natural clip is slowed too.
 * `role` asks for the natural voice (and picks which one): if its clip is not ready yet, the line WAITS a few
 * seconds for it, so the class hears the good voice the first time too. The browser voice only steps in when the
 * clip cannot be made or takes too long. Without a role the browser voice is used unless a clip for this exact
 * line was prepared.
 */
export function speak(text: string, rate = 0.9, onEnd?: () => void, role?: SpeechRole) {
  const clip = role ? fetchClip(text, role) : clips.get(clipKey(text, 'presenter'));
  stopSpeech();
  const mine = turn;
  if (clip?.url) { playClip(clip.url, text, rate, onEnd, role); return; }
  if (!role || !clip) { speakWithBrowser(text, rate, onEnd); return; }
  let settled = false;
  const timer = setTimeout(() => {
    if (settled || mine !== turn) return;
    settled = true;
    speakWithBrowser(text, rate, onEnd);
  }, WAIT_FOR_CLIP_MS);
  void clip.promise.then((url) => {
    if (settled || mine !== turn) return;
    settled = true;
    clearTimeout(timer);
    if (url) playClip(url, text, rate, onEnd, role);
    else speakWithBrowser(text, rate, onEnd);
  });
}
