import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty, Topic, Tone } from '@/stores/session-store';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import { requireAuth } from '@/lib/auth-credits';
import { vocabSprintFallback } from '@/lib/fallback-content';

export interface GameSentence {
  sentence: string;
  weakWord: string;
  hint: string;
}

const GAME_KEY = 'vocab-sprint';

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) level. Use very short, extremely simple sentences (4-6 words). Focus on basic everyday objects and actions.',
  'Easy': 'Easy (A2) level. Use simple sentences about familiar topics. Vocabulary should be basic but functional.',
  'Intermediate': 'Intermediate (B1/B2) level. Use common but slightly simple vocabulary in standard sentences.',
  'Advanced': 'Advanced (C1) level. Use complex sentence structures and natural idioms.',
  'Expert': 'Expert (C2/Native) level. Use very sophisticated, nuanced, and academic language.'
};

const toneInstructions: Record<Tone, string> = {
  'Neutral': 'Maintain a balanced, standard tone.',
  'Casual': 'Use a relaxed, conversational, and everyday tone.',
  'Formal': 'Use strict, serious, and highly polite language.',
  'Humorous': 'Include a touch of wit, irony, or lighthearted fun.',
  'Professional': 'Focus on corporate, clear, and efficient communication.',
  'Kid-friendly': 'Use engaging, simple-to-understand but imaginative language suitable for children.'
};

const schema: AISchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      sentence: { type: 'string' },
      weakWord: { type: 'string' },
      hint: { type: 'string' }
    },
    required: ['sentence', 'weakWord', 'hint']
  }
};

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const { difficulty, topic, tone, seenItems = [], excludeCacheIds = [] } = await request.json() as {
    difficulty: Difficulty;
    topic: Topic;
    tone: Tone;
    seenItems?: string[];      // weakWords seen this session — AI avoids repeating them
    excludeCacheIds?: string[]; // cache entry IDs already served this session
  };

  try {
    // 1. Check cache first (zero AI latency when hit)
    const cached = await getCachedContent(GAME_KEY, topic, difficulty, excludeCacheIds);
    if (cached) {
      return NextResponse.json({
        sentences: cached.content_json as GameSentence[],
        cacheId: cached.id,
      });
    }

    // 2. Cache miss — build exclusion hint for AI prompt
    const exclusionNote = seenItems.length > 0
      ? `\nIMPORTANT: Do NOT use these weak words that were recently shown this session: ${seenItems.join(', ')}. Choose different words.\n`
      : '';

    const prompt = `Generate 5 unique, natural English sentences for an English learner at ${difficultyPrompts[difficulty]}
Topic: ${topic}.
Tone: ${toneInstructions[tone]}
${exclusionNote}
CRITICAL RULES:
1. Each sentence must contain exactly ONE 'generic' or 'weak' word (the 'weakWord') to be replaced.
2. EVERY sentence must use a DIFFERENT weak word - NO REPEATS across the 5 sentences.
3. Prioritize VERBS and ADJECTIVES as weak words, not adverbs like "very" or "really".

Choose weak words from this list (use variety - pick 5 DIFFERENT ones):
- Adjectives: good, bad, big, small, nice, interesting, important, happy, sad, great, amazing, terrible, beautiful, ugly, old, new, fast, slow, hard, easy, fun, boring, cool, weird, strange, normal, different, same, special, basic, simple, difficult, pretty, handsome, smart, dumb, clever, stupid, rich, poor, expensive, cheap, loud, quiet, bright, dark, hot, cold, warm, clean, dirty, empty, full, heavy, light, strong, weak, young, angry, calm, tired, hungry, thirsty, sick, healthy, busy, free, early, late
- Verbs: said, went, got, think, look, make, do, take, give, show, change, tell, walk, run, eat, see, put, come, go, get, want, need, like, love, hate, try, start, stop, move, stay, leave, arrive, return, bring, carry, hold, drop, throw, catch, hit, push, pull, open, close, turn, fix, break, build, create, destroy, help, hurt, save, spend, pay, buy, sell, win, lose, find, keep, use, work, play, watch, listen, speak, talk, ask, answer, learn, teach, read, write, draw, sing, dance, cook, clean, wash, drive, fly, swim, climb, jump, sit, stand, lie, sleep, wake, wait, hope, believe, remember, forget, understand, decide, choose, plan, prepare, finish, complete
- Nouns: thing, stuff, place, person, way, people, man, woman, child, kid, guy, girl, friend, family, home, house, room, food, water, money, time, day, night, morning, evening, work, job, school, class, book, movie, game, problem, idea, question, answer, reason, result, part, group, team, world, country, city, area, situation, experience, moment, chance, opportunity
- Only occasionally use: very, really (max 1 per batch)

Also provide a 'hint' for each sentence—a short, friendly piece of advice (max 10 words) to help the student find a more precise word.

Return exactly 5 objects as a JSON array with varied weak words.`;

    const sentences = await generateJSON<GameSentence[]>(prompt, schema, { taskClass: 'content-generation' });

    // 3. Store in cache for future sessions (fire-and-forget — don't block the response)
    const cacheId = await storeCachedContent(GAME_KEY, topic, difficulty, sentences, 1);

    return NextResponse.json({ sentences, cacheId });
  } catch (error) {
    console.error('Generate error:', error);
    // Emergency: try cache without exclusions
    try {
      const emergency = await getCachedContent(GAME_KEY, topic, difficulty);
      if (emergency) {
        return NextResponse.json({
          sentences: emergency.content_json as GameSentence[],
          cacheId: emergency.id,
          degraded: true,
        });
      }
    } catch { /* cache also failed */ }
    // Topic-aware deterministic fallback
    return NextResponse.json({
      sentences: vocabSprintFallback(topic),
      cacheId: null,
      degraded: true,
    });
  }
}
