import { NextRequest, NextResponse } from 'next/server';
import { requireAuthForGeneration } from '@/lib/auth-credits';
import { generateJSON } from '@/lib/ai';
import { GOAL_LABELS, type GoalTag } from '@/lib/flight-plan-config';
import { DIFFICULTIES, type Difficulty } from '@/lib/difficulty';

export const dynamic = 'force-dynamic';

const GOAL_TAGS = Object.keys(GOAL_LABELS) as GoalTag[];
const DURATIONS = [30, 45, 60, 90] as const;
type Duration = (typeof DURATIONS)[number];

/** Structured lesson spec extracted from a teacher's free-text request. */
export interface LessonIntent {
  goal: GoalTag;
  secondaryGoals: GoalTag[];
  difficulty: Difficulty;
  durationMinutes: Duration;
  topic: string;
}

interface RawIntent {
  goal?: string;
  secondaryGoals?: string[];
  difficulty?: string;
  durationMinutes?: number;
  topic?: string;
}

function clampGoal(value: string | undefined): GoalTag {
  return GOAL_TAGS.includes(value as GoalTag) ? (value as GoalTag) : 'discussion-debate';
}

function clampDifficulty(value: string | undefined): Difficulty {
  return DIFFICULTIES.includes(value as Difficulty) ? (value as Difficulty) : 'Intermediate';
}

function snapDuration(n: number | undefined): Duration {
  if (typeof n !== 'number' || Number.isNaN(n)) return 60;
  return DURATIONS.reduce<Duration>((best, d) => (Math.abs(d - n) < Math.abs(best - n) ? d : best), 60);
}

const SCHEMA = {
  type: 'object' as const,
  properties: {
    goal: { type: 'string' as const },
    secondaryGoals: { type: 'array' as const, items: { type: 'string' as const } },
    difficulty: { type: 'string' as const },
    durationMinutes: { type: 'number' as const },
    topic: { type: 'string' as const },
  },
  required: ['goal', 'difficulty', 'durationMinutes', 'topic'],
};

function buildPrompt(text: string, hasSource: boolean): string {
  return `You convert a teacher's free-text request into a structured spec for an ESL lesson builder.
Pick the BEST single value for each field from the allowed lists only — never invent values.

Teacher's request:
"""
${text}
"""
${hasSource ? 'The teacher has attached a source (video/reading) for the lesson to be based on.' : ''}

Fields:

goal — the PRIMARY learning goal. Exactly one of:
${GOAL_TAGS.map((g) => `- ${g} (${GOAL_LABELS[g]})`).join('\n')}

secondaryGoals — 0 to 2 ADDITIONAL goals from the same list, only if clearly implied. Omit otherwise.

difficulty — student level (CEFR). Exactly one of: Beginner (A1), Easy (A2), Intermediate (B1/B2), Advanced (C1), Expert (C2). Map any level or CEFR mention accordingly. Use Intermediate if unstated.

durationMinutes — lesson length, exactly one of: 30, 45, 60, 90. Use 60 if unstated.

topic — a short, specific topic phrase taken from the request (e.g. "plastic pollution in oceans", "ordering food at a restaurant"). If no topic is named, give a concise, neutral one.

Return JSON only.`;
}

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuthForGeneration();
  if (authError) return authError;

  let body: { text?: string; hasSource?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const text = (body.text ?? '').trim();
  if (text.length < 3) {
    return NextResponse.json({ error: 'Describe your lesson in a few words first.' }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: 'That description is too long — keep it under 2000 characters.' }, { status: 400 });
  }

  try {
    const raw = await generateJSON<RawIntent>(buildPrompt(text, !!body.hasSource), SCHEMA, {
      taskClass: 'bulk-generation',
    });

    const goal = clampGoal(raw.goal);
    const secondaryGoals = Array.from(
      new Set((raw.secondaryGoals ?? []).map(clampGoal).filter((g) => g !== goal)),
    ).slice(0, 2);

    const extractedTopic = (raw.topic ?? '').trim().slice(0, 200);
    const intent: LessonIntent = {
      goal,
      secondaryGoals,
      difficulty: clampDifficulty(raw.difficulty),
      durationMinutes: snapDuration(raw.durationMinutes),
      // Never return an empty topic — fall back to the teacher's own words so the
      // lesson always grounds in what they asked for. An empty topic silently
      // degrades to the 'General' default → generic, off-topic content.
      topic: extractedTopic || text.slice(0, 200),
    };

    return NextResponse.json(intent);
  } catch (err) {
    console.error('Lesson intent extraction error:', err);
    return NextResponse.json({ error: 'Could not read that description. Try rephrasing.' }, { status: 500 });
  }
}
