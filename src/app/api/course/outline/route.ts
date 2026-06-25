import { NextRequest, NextResponse } from 'next/server';
import { requireAuthForGeneration } from '@/lib/auth-credits';
import { generateJSON } from '@/lib/ai';
import { GOAL_LABELS, type GoalTag } from '@/lib/flight-plan-config';
import { DIFFICULTIES, difficultyDescriptions, type Difficulty } from '@/lib/difficulty';
import { recommendSources } from '@/lib/source-library';
import type { SourceType } from '@/types/source-material';
import type { CourseOutline, CourseOutlineLesson } from '@/lib/course';

export const dynamic = 'force-dynamic';

const GOAL_TAGS = Object.keys(GOAL_LABELS) as GoalTag[];

function clampGoal(value: string | undefined): GoalTag {
  return GOAL_TAGS.includes(value as GoalTag) ? (value as GoalTag) : 'discussion-debate';
}
function clampDifficulty(value: string | undefined): Difficulty {
  return DIFFICULTIES.includes(value as Difficulty) ? (value as Difficulty) : 'Intermediate';
}
function clampCount(n: unknown): number {
  const v = typeof n === 'number' ? Math.round(n) : 5;
  return Math.max(3, Math.min(8, Number.isNaN(v) ? 5 : v));
}

interface RawOutline {
  courseTitle?: string;
  lessons?: Array<{ title?: string; topic?: string; goal?: string }>;
}

const SCHEMA = {
  type: 'object' as const,
  properties: {
    courseTitle: { type: 'string' as const },
    lessons: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' as const },
          topic: { type: 'string' as const },
          goal: { type: 'string' as const },
        },
        required: ['title', 'topic', 'goal'],
      },
    },
  },
  required: ['courseTitle', 'lessons'],
};

function buildPrompt(theme: string, lessonCount: number, difficulty: Difficulty): string {
  return `Design a coherent multi-lesson ESL course outline.

Theme: "${theme}"
Number of lessons: ${lessonCount}
Student level: ${difficultyDescriptions[difficulty]}

Produce exactly ${lessonCount} lessons that form a connected arc under the theme — they should build on
each other in a logical progression (earlier lessons set up later ones), not ${lessonCount} unrelated
takes on the theme.

Each lesson:
- title — short lesson title (≤6 words)
- topic — a SPECIFIC, concrete topic phrase used to ground the lesson and find a matching video/reading
  (e.g. "ordering food at a restaurant", "the water cycle"), not an abstract heading
- goal — exactly one of: ${GOAL_TAGS.join(', ')}

Also: courseTitle — a short, specific course title.

Return JSON only.`;
}

export async function POST(request: NextRequest) {
  // Course Builder is a Pro feature.
  const { error: authError } = await requireAuthForGeneration({ requestHasProModules: true });
  if (authError) return authError;

  let body: { theme?: string; lessonCount?: number; level?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const theme = (body.theme ?? '').trim();
  if (theme.length < 3) {
    return NextResponse.json({ error: 'Describe your course theme in a few words first.' }, { status: 400 });
  }
  if (theme.length > 500) {
    return NextResponse.json({ error: 'That theme is too long.' }, { status: 400 });
  }
  const difficulty = clampDifficulty(body.level);
  const lessonCount = clampCount(body.lessonCount);

  try {
    const raw = await generateJSON<RawOutline>(buildPrompt(theme, lessonCount, difficulty), SCHEMA, {
      taskClass: 'bulk-generation',
    });

    const rawLessons = Array.isArray(raw.lessons) ? raw.lessons.slice(0, lessonCount) : [];
    const lessons: CourseOutlineLesson[] = rawLessons
      .filter((l) => (l.topic ?? '').trim().length > 0)
      .map((l) => {
        const topic = (l.topic ?? '').trim().slice(0, 200);
        // Attach the best library source for this lesson's topic (Find).
        const [match] = recommendSources(topic, { level: difficulty, limit: 1 });
        return {
          title: (l.title ?? '').trim().slice(0, 80) || topic,
          topic,
          goal: clampGoal(l.goal),
          suggestedSource: match
            ? { kind: match.kind, sourceType: match.sourceType as SourceType, id: match.id, title: match.title }
            : null,
        };
      });

    if (lessons.length === 0) {
      return NextResponse.json({ error: 'Could not build an outline. Try a clearer theme.' }, { status: 502 });
    }

    const outline: CourseOutline = {
      title: (raw.courseTitle ?? '').trim().slice(0, 100) || theme,
      theme,
      difficulty,
      lessons,
    };
    return NextResponse.json(outline);
  } catch (err) {
    console.error('Course outline error:', err);
    return NextResponse.json({ error: 'Could not build a course outline. Try rephrasing.' }, { status: 500 });
  }
}
