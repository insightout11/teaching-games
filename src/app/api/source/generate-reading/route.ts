import { NextRequest, NextResponse } from 'next/server';
import { requireAuthForGeneration } from '@/lib/auth-credits';
import { generateJSON } from '@/lib/ai';
import { DIFFICULTIES, difficultyDescriptions, type Difficulty } from '@/lib/difficulty';
import type { SourceBriefingOption, SourceMaterial } from '@/types/source-material';

export const dynamic = 'force-dynamic';

const WORD_TARGET: Record<Difficulty, string> = {
  Beginner: 'about 100–140 words',
  Easy: 'about 140–180 words',
  Intermediate: 'about 200–260 words',
  Advanced: 'about 280–340 words',
  Expert: 'about 320–400 words',
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function clampDifficulty(value: unknown): Difficulty {
  return DIFFICULTIES.includes(value as Difficulty) ? (value as Difficulty) : 'Intermediate';
}

const SCHEMA = {
  type: 'object' as const,
  properties: {
    title: { type: 'string' as const },
    passage: { type: 'string' as const },
  },
  required: ['title', 'passage'],
};

function buildPrompt(topic: string, difficulty: Difficulty, lens?: string): string {
  return `Write an original, engaging reading passage for an ESL class on this topic:
"${topic}"

Language level: ${difficultyDescriptions[difficulty]}
Length: ${WORD_TARGET[difficulty]}.
${lens ? `Shape the passage so it supports this teaching aim: ${lens}` : ''}

Requirements:
- Factually sensible, self-contained, and classroom-appropriate.
- Clear paragraphs with a natural flow. No headings, no markdown, no bullet points.
- Give it a short, specific title.

Return JSON: { "title": string, "passage": string }.`;
}

export async function POST(request: NextRequest) {
  // Generated readings are a source-based (Pro) feature — match /api/source/extract.
  const { error: authError } = await requireAuthForGeneration({ requestHasProModules: true });
  if (authError) return authError;

  let body: { topic?: string; difficulty?: string; lens?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const topic = (body.topic ?? '').trim();
  if (topic.length < 3) {
    return NextResponse.json({ error: 'Enter a topic to generate a reading.' }, { status: 400 });
  }
  if (topic.length > 300) {
    return NextResponse.json({ error: 'That topic is too long.' }, { status: 400 });
  }
  const difficulty = clampDifficulty(body.difficulty);
  const lens = (body.lens ?? '').trim().slice(0, 500) || undefined;

  try {
    const { title, passage } = await generateJSON<{ title: string; passage: string }>(
      buildPrompt(topic, difficulty, lens),
      SCHEMA,
      { taskClass: 'content-generation' },
    );

    const text = passage.trim();
    if (countWords(text) < 40) {
      return NextResponse.json({ error: 'Could not generate a usable reading. Try a clearer topic.' }, { status: 502 });
    }
    const wordCount = countWords(text);
    const cleanTitle = (title ?? '').trim() || topic;

    const briefingOptions: SourceBriefingOption[] = [
      {
        id: 'recommended',
        label: 'Generated reading',
        description: 'Written for your topic and level.',
        text,
        mode: 'generated',
        wordCount,
      },
    ];

    const material: SourceMaterial = {
      sourceType: 'text',
      title: cleanTitle,
      summary: text, // already topic-grounded — used by downstream source-grounded generators
      rawText: text,
      briefingText: text,
      briefingMode: 'generated',
      briefingOptions,
      wordCount,
    };

    return NextResponse.json(material);
  } catch (err) {
    console.error('Reading generation error:', err);
    return NextResponse.json({ error: 'Failed to generate a reading. Please try again.' }, { status: 500 });
  }
}
