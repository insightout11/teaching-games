import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty, Topic } from '@/stores/session-store';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { dialogueDetectiveFallback } from '@/lib/fallback-content';
import { resolveSourceContext } from '@/lib/source-context';
import type { SourceMaterial } from '@/types/source-material';

export const maxDuration = 60;

const GAME_KEY = 'dialogue-detective';
const SCHEMA_VERSION = 2;

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) level. Use very simple, short dialogue.',
  'Easy': 'Easy (A2) level. Use simple everyday conversation.',
  'Intermediate': 'Intermediate (B1/B2) level. Use natural conversation.',
  'Advanced': 'Advanced (C1) level. Use nuanced, contextual dialogue.',
  'Expert': 'Expert (C2/Native) level. Use sophisticated, idiomatic conversation.'
};

const schema: AISchema = {
  type: 'object',
  properties: {
    speakerA_before: { type: 'string' },
    speakerA_after: { type: 'string' },
    context: { type: 'string' },
    goal: { type: 'string' }
  },
  required: ['speakerA_before', 'speakerA_after', 'context', 'goal']
};

export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const { topic, difficulty, excludeCacheIds = [], sourceMaterial } = await request.json() as {
    topic: Topic;
    difficulty: Difficulty;
    excludeCacheIds?: string[];
    sourceMaterial?: SourceMaterial;
  };

  // Ground the dialogue's setting/topic in the lesson's source material when attached.
  const sourceContext = await resolveSourceContext(sourceMaterial);
  const skipCache = !!sourceMaterial;

  try {
    // 1. Check cache first (skipped when grounding in source material)
    const cached = skipCache ? null : await getCachedContent(GAME_KEY, topic, difficulty, excludeCacheIds);
    if (cached) {
      return NextResponse.json({ ...cached.content_json, cacheId: cached.id });
    }

    // Cache miss — this will hit the AI. Enforce the free-tier weekly cap.
    const limited = await checkAndRecordAiUsage(teacher);
    if (limited) return limited;

    // 2. Cache miss — generate via AI
    const prompt = `Generate a dialogue puzzle for ${difficultyPrompts[difficulty]}
Topic: ${topic}.
${sourceContext}${sourceContext ? 'Set the conversation in a context drawn from the source material above, using its situations and vocabulary.\n' : ''}
Two speakers, A and B, have FIXED, DISTINCT roles (e.g. A = customer / B = agent, A = student / B = teacher). Each speaker only ever says things that THEIR role would say.

Create a 3-line conversation:
- Line 1 — Speaker A says something (in A's role).
- Line 2 — Speaker B responds (in B's role). THIS LINE IS BLANK; the student fills it in.
- Line 3 — Speaker A replies to B (still in A's role).

CRITICAL ROLE-CONSISTENCY RULES:
- Both of A's lines must be spoken by the SAME person in the SAME role. Line 3 must be a natural REACTION by A to what B said — never an action or line that belongs to B's role.
- Example of the trap to AVOID: if A is a customer checking in and B is the check-in agent, then "Here is your boarding pass, your gate is 7" is the AGENT's line and must NOT be put in A's mouth. A's line 3 would instead be something like "Great, thank you!"
- The blank (B's line) must be clearly inferable: it must make sense as a reply to line 1 AND set up line 3.

Provide:
- speakerA_before: A's first line.
- speakerA_after: A's reaction to B — consistent with A's role, and a natural response to the missing B line.
- context: Brief setting that names both roles (e.g., "Customer and agent at an airport check-in counter").
- goal: What B (the blank speaker) is trying to accomplish in their line, phrased from B's side (e.g., "Confirm the booking and hand over the boarding pass", "Politely decline the request").

Requirements:
- The conversation must be natural, realistic, and logically coherent end-to-end.
- There should be multiple valid ways to fill the blank.
- The dialogue should relate to ${topic}.
- Appropriate complexity for ${difficulty} level.`;

    const data = await generateJSON<{ speakerA_before: string; speakerA_after: string; context: string; goal: string }>(prompt, schema, { taskClass: 'content-generation' });

    const result = {
      speakerA_before: data.speakerA_before,
      speakerA_after: data.speakerA_after,
      context: data.context,
      goal: data.goal,
    };

    // 3. Store in cache for future sessions (never cache source-grounded content)
    const cacheId = skipCache ? null : await storeCachedContent(GAME_KEY, topic, difficulty, result, SCHEMA_VERSION);

    return NextResponse.json({ ...result, cacheId });
  } catch (error) {
    console.error('Generate error:', error);
    try {
      const emergency = await getCachedContent(GAME_KEY, topic, difficulty);
      if (emergency) {
        return NextResponse.json({ ...emergency.content_json, cacheId: emergency.id, degraded: true });
      }
    } catch { /* cache also failed */ }
    return NextResponse.json({
      ...dialogueDetectiveFallback(topic),
      cacheId: null,
      degraded: true,
    });
  }
}
