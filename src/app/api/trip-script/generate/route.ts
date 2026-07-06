import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty } from '@/lib/difficulty';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import {
  buildTripScriptPrompt,
  validateTripScript,
  tripTierFor,
  type TripStopKey,
  type TripExchangeLine,
  type TripScriptAnchors,
} from '@/lib/trip-script';

export const dynamic = 'force-dynamic';

const GAME_KEY = 'trip-script';
// v2: meal scripts now require the {whatItIs} grounding token (waiter no longer invents ingredients).
const SCHEMA_VERSION = 2;
const VALID_STOPS: TripStopKey[] = ['arrival', 'getting-there', 'meal'];

const schema: AISchema = {
  type: 'object',
  properties: {
    lines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          speaker: { type: 'string' },
          text: { type: 'string' },
          hint: { type: 'string' },
        },
        required: ['speaker', 'text'],
      },
    },
  },
  required: ['lines'],
};

// Growing cached pool of AI-varied scripts. Keyed (gameKey=trip-script, topic=city,
// difficulty=tier, variant=stop): each generation is stored and a random unseen variant is
// served, so lessons vary while AI cost tapers off as the pool fills. On any failure the client
// falls back to the stop's permanent deterministic script.
export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const { stop, city, tier: rawTier, difficulty, anchors, excludeCacheIds = [] } = await request.json() as {
    stop: TripStopKey;
    city: string;
    tier?: string;
    difficulty?: Difficulty;
    anchors?: TripScriptAnchors;
    excludeCacheIds?: string[];
  };

  if (!VALID_STOPS.includes(stop) || !city?.trim()) {
    return NextResponse.json({ lines: null }, { status: 400 });
  }

  const diff: Difficulty = difficulty ?? 'Intermediate';
  const tier = (rawTier === 'basic' || rawTier === 'standard' || rawTier === 'advanced') ? rawTier : tripTierFor(diff);

  try {
    // 1. Serve a random unseen variant from the pool if one exists.
    const cached = await getCachedContent(GAME_KEY, city, tier, excludeCacheIds, stop, SCHEMA_VERSION);
    if (cached) {
      const data = cached.content_json as { lines: TripExchangeLine[] };
      const valid = validateTripScript(data.lines, stop);
      if (valid) {
        return NextResponse.json(
          { lines: valid, cacheId: cached.id },
          { headers: { 'Cache-Control': 'no-store' } },
        );
      }
    }

    // 2. Cache miss — enforce the free-tier cap, then generate.
    const limited = await checkAndRecordAiUsage(teacher);
    if (limited) return limited;

    const prompt = buildTripScriptPrompt(stop, city.trim(), tier, anchors ?? {}, diff);
    const data = await generateJSON<{ lines: TripExchangeLine[] }>(prompt, schema, {
      temperature: 1.0,
      taskClass: 'content-generation',
    });

    const valid = validateTripScript(data.lines, stop);
    if (!valid) {
      // AI produced a structurally invalid script — let the client use the deterministic fallback.
      return NextResponse.json({ lines: null }, { headers: { 'Cache-Control': 'no-store' } });
    }

    // 3. Store as a new pool variant.
    const cacheId = await storeCachedContent(GAME_KEY, city, tier, { lines: valid }, SCHEMA_VERSION, stop);

    return NextResponse.json({ lines: valid, cacheId }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[trip-script/generate] error:', error);
    return NextResponse.json({ lines: null }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
