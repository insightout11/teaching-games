import { NextRequest, NextResponse } from 'next/server';
import { requireAuthForGeneration } from '@/lib/auth-credits';
import { generateJSON } from '@/lib/ai';
import { GOAL_LABELS, type GoalTag } from '@/lib/flight-plan-config';
import { DIFFICULTIES, difficultyDescriptions, type Difficulty } from '@/lib/difficulty';
import { recommendSource } from '@/lib/source-library';
import type { SourceType } from '@/types/source-material';
import type { CourseOutline, CourseOutlineLesson } from '@/lib/course';
import { LESSON_TYPES, lessonTypeBlocker, lessonTypeById } from '@/lib/course-lesson-types';
import { getLibraryEntry } from '@/lib/library-source-material';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
  arcTask?: string;
  lessons?: Array<{ title?: string; topic?: string; keywords?: string[]; goal?: string; type?: string }>;
}

const SCHEMA = {
  type: 'object' as const,
  properties: {
    courseTitle: { type: 'string' as const },
    arcTask: { type: 'string' as const },
    lessons: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' as const },
          topic: { type: 'string' as const },
          keywords: {
            type: 'array' as const,
            items: { type: 'string' as const },
          },
          goal: { type: 'string' as const },
          type: { type: 'string' as const },
        },
        required: ['title', 'topic', 'keywords', 'goal', 'type'],
      },
    },
  },
  required: ['courseTitle', 'arcTask', 'lessons'],
};

const JUNIOR_LINE = '\n- The class is young children (about 5-9): keep every topic concrete, playful and visual.';

function buildPrompt(theme: string, lessonCount: number, difficulty: Difficulty, junior: boolean): string {
  return `Design a coherent multi-lesson ESL course outline.

Theme: "${theme}"
Number of lessons: ${lessonCount}
Student level: ${difficultyDescriptions[difficulty]}

Produce exactly ${lessonCount} lessons that form a connected arc under the theme - they should build on
each other in a logical progression (earlier lessons set up later ones), not ${lessonCount} unrelated
takes on the theme.

Each lesson:
- title - short lesson title (<=6 words)
- topic - a SPECIFIC, concrete topic phrase used to ground the lesson and find a matching video/reading
  (e.g. "ordering food at a restaurant", "the water cycle"), not an abstract heading
- keywords - 2-4 concrete noun keywords for source matching. Use subject nouns, animals, places,
  jobs, objects, or processes; avoid abstract/connective words like "relationships", "world",
  "sharing", "efforts", "people", or "society".
- goal - exactly one of: ${GOAL_TAGS.join(', ')}
- type - the kind of lesson, exactly one of: speak (practise one real conversation), reading (read a text
  together), listening (listen to a clip), ${junior ? '' : 'debate (argue a question with evidence), grammar (one grammar point), '}mix (a varied
  lesson of games and activities). Use a sensible mix across the course; most lessons should be speak or mix.

Also:
- courseTitle - a short, specific course title.
- arcTask - ONE simple speaking task the class can do in 2-3 minutes in the first lesson and again in the last
  lesson, so everyone sees how far they came (e.g. "Say three things about the food you like"). Plain words for
  this level.${junior ? JUNIOR_LINE : ''}

Return JSON only.`;
}

export async function POST(request: NextRequest) {
  // Course Builder is a Pro feature.
  const { error: authError } = await requireAuthForGeneration({ requiresEntitlement: true });
  if (authError) return authError;

  let body: { theme?: string; lessonCount?: number; level?: string; junior?: boolean };
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
    const junior = body.junior === true;
    const raw = await generateJSON<RawOutline>(buildPrompt(theme, lessonCount, difficulty, junior), SCHEMA, {
      taskClass: 'bulk-generation',
    });

    const rawLessons = Array.isArray(raw.lessons) ? raw.lessons.slice(0, lessonCount) : [];
    const lessons: CourseOutlineLesson[] = rawLessons
      .filter((l) => (l.topic ?? '').trim().length > 0)
      .map((l) => {
        const topic = (l.topic ?? '').trim().slice(0, 200);
        const keywords = (Array.isArray(l.keywords) ? l.keywords : [])
          .map((k) => k.trim().toLowerCase().slice(0, 40))
          .filter((k) => k.length > 0)
          .slice(0, 4);
        // Attach the best library source for this lesson's concrete keywords (Find).
        const match = recommendSource({ topic, keywords, context: theme }, { level: difficulty, allowKids: junior });
        const suggestedSource = match
          ? {
              kind: match.kind,
              sourceType: match.sourceType as SourceType,
              id: match.id,
              title: match.title,
              ...(getLibraryEntry(match.sourceType, match.id)?.listeningPack ? { listening: true } : {}),
            }
          : null;
        // The proposed lesson type, if this lesson's material allows it (Reading needs a text, Listening a clip).
        let type = lessonTypeById(l.type) ?? LESSON_TYPES[5];
        if ((junior && type.juniorHidden) || lessonTypeBlocker(type, suggestedSource)) type = LESSON_TYPES[5];
        return {
          title: (l.title ?? '').trim().slice(0, 80) || topic,
          topic,
          keywords,
          goal: type.id === 'mix' ? clampGoal(l.goal) : type.goal,
          flightPresetId: type.flightPresetId,
          suggestedSource,
        };
      });

    if (lessons.length === 0) {
      return NextResponse.json({ error: 'Could not build an outline. Try a clearer theme.' }, { status: 502 });
    }

    if (lessons.length > 1) {
      lessons[0] = { ...lessons[0], arcRole: 'baseline' };
      lessons[lessons.length - 1] = { ...lessons[lessons.length - 1], arcRole: 'compare' };
    }
    const outline: CourseOutline = {
      title: (raw.courseTitle ?? '').trim().slice(0, 100) || theme,
      theme,
      difficulty,
      lessons,
      arcTask: (raw.arcTask ?? '').trim().slice(0, 200) || undefined,
    };
    return NextResponse.json(outline);
  } catch (err) {
    console.error('Course outline error:', err);
    return NextResponse.json({ error: 'Could not build a course outline. Try rephrasing.' }, { status: 500 });
  }
}
