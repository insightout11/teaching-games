import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Natural voice for anything the app reads aloud (Radio Check passages, the captain's announcements, Junior
 * questions). Google's speech model, on the same account the app's AI uses. Returns a WAV clip.
 *
 * A clip takes several seconds to make, so the lesson screen asks for clips ahead of time (lib/speech
 * `prepareSpeech`) and plays the browser's own voice whenever a clip is not ready: speech never waits on this.
 */
const MODEL = process.env.TTS_MODEL ?? 'gemini-3.8-flash-tts';
const MAX_CHARS = 700;

/**
 * Who is speaking: each role has its own voice. The model is sent ONLY the words to say: this model reads any
 * delivery instruction aloud ("Say this as a calm airline captain: …" came out as speech), and it does not accept a
 * separate instruction. Pace is adjusted at playback (see lib/speech).
 */
// Chosen by the owner from samples (Oct 2026). The captain is pinned to American English: without it one voice
// came out with a noticeable non-native accent.
const ROLES: Record<string, { voice: string; language?: string }> = {
  presenter: { voice: 'Aoede' },
  captain: { voice: 'Iapetus', language: 'en-US' },
  junior: { voice: 'Kore' },
};

// Clips already made by this server instance (the same line is often asked for again: "Hear it again", a reload).
const made = new Map<string, Buffer>();
const MAX_KEPT = 60;

export async function POST(request: Request) {
  const { teacher, error: authError } = await requireAuth();
  if (authError) return authError;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null) as { text?: unknown; role?: unknown } | null;
  const text = typeof body?.text === 'string' ? body.text.replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS) : '';
  const role = typeof body?.role === 'string' && ROLES[body.role] ? body.role : 'presenter';
  if (text.length < 2) return NextResponse.json({ error: 'text is required' }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Voice is not set up' }, { status: 503 });

  const key = `${role}|${text}`;
  const kept = made.get(key);
  if (kept) return new Response(new Uint8Array(kept), { headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'private, max-age=3600' } });

  try {
    const { voice, language } = ROLES[role];
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { ...(language ? { languageCode: language } : {}), voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
      }),
      signal: AbortSignal.timeout(25_000),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => null) as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }> } | null;
    const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!res.ok || !part?.inlineData?.data) {
      console.error('[tts] no audio returned', res.status);
      return NextResponse.json({ error: 'Voice unavailable' }, { status: 502 });
    }
    let audio = Buffer.from(part.inlineData.data, 'base64');
    // The model returns either a finished WAV or bare 24 kHz 16-bit mono samples: give the browser a WAV either way.
    if (audio.subarray(0, 4).toString('ascii') !== 'RIFF') audio = Buffer.concat([wavHeader(audio.length), audio]);
    if (made.size >= MAX_KEPT) made.delete(made.keys().next().value as string);
    made.set(key, audio);
    return new Response(new Uint8Array(audio), { headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'private, max-age=3600' } });
  } catch (error) {
    console.error('[tts] failed:', error);
    return NextResponse.json({ error: 'Voice unavailable' }, { status: 502 });
  }
}

function wavHeader(dataLength: number, rate = 24_000): Buffer {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + dataLength, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(dataLength, 40);
  return h;
}
