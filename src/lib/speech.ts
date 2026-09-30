'use client';

// Text-to-speech for phrase cards (and later the Listening Flight).
// Speed matters: an unspecified voice often means Chrome's ONLINE Google voice (a network
// round trip before any sound), and cancel() immediately followed by speak() can stall.
// So: load voices early, prefer an on-device English voice, and only cancel when busy.

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function supported() {
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
  if (!supported() || cachedVoice !== undefined) return;
  const load = () => { cachedVoice = pickVoice() ?? cachedVoice; };
  load();
  if (!cachedVoice) {
    cachedVoice = undefined;
    window.speechSynthesis.addEventListener?.('voiceschanged', load, { once: true });
  }
}

export function speak(text: string, rate = 0.9) {
  try {
    if (!supported()) return;
    const synth = window.speechSynthesis;
    if (cachedVoice === undefined) cachedVoice = pickVoice();
    if (synth.speaking || synth.pending) synth.cancel();
    // Chrome can leave the queue paused (e.g. after the tab was hidden).
    synth.resume();
    const u = new SpeechSynthesisUtterance(text);
    if (cachedVoice) { u.voice = cachedVoice; u.lang = cachedVoice.lang; } else u.lang = 'en-US';
    u.rate = rate;
    synth.speak(u);
  } catch {
    // no voice on this device: the button just does nothing
  }
}
