import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Difficulty, Topic, Tone } from '@/stores/session-store';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface GameSentence {
  sentence: string;
  weakWord: string;
  hint: string;
}

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

export async function POST(request: NextRequest) {
  try {
    const { difficulty, topic, tone } = await request.json() as {
      difficulty: Difficulty;
      topic: Topic;
      tone: Tone;
    };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              sentence: { type: SchemaType.STRING },
              weakWord: { type: SchemaType.STRING },
              hint: { type: SchemaType.STRING }
            },
            required: ['sentence', 'weakWord', 'hint']
          }
        }
      }
    });

    const prompt = `Generate 5 unique, natural English sentences for an English learner at ${difficultyPrompts[difficulty]}
Topic: ${topic}.
Tone: ${toneInstructions[tone]}

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

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const sentences: GameSentence[] = JSON.parse(text);
    return NextResponse.json({ sentences });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sentences' },
      { status: 500 }
    );
  }
}
