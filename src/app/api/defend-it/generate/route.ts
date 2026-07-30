import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty } from '@/lib/difficulty';
import { difficultyDescriptions } from '@/lib/difficulty';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { resolveSourceContext } from '@/lib/source-context';
import type { SourceMaterial } from '@/types/source-material';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const schema: AISchema = {
  type: 'object',
  properties: {
    statements: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['statements'],
};

export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  // This will hit the AI. Enforce the free-tier weekly cap.
  const limited = await checkAndRecordAiUsage(teacher);
  if (limited) return limited;

  const { topic, difficulty, count = 3, sourceMaterial, avoid } = await request.json() as {
    topic: string;
    difficulty: Difficulty;
    count?: number;
    sourceMaterial?: SourceMaterial;
    avoid?: string[];
  };

  // Springboard the statements off the lesson's source material when one is attached.
  const sourceContext = await resolveSourceContext(sourceMaterial);

  const avoidList = Array.isArray(avoid) ? avoid.filter(Boolean) : [];
  const avoidText = avoidList.length
    ? `\nAlready used this session — generate DIFFERENT statements, do not repeat or lightly reword any of these:\n${avoidList.map((s) => `- ${s}`).join('\n')}\n`
    : '';

  try {
    const prompt = `Generate ${count} statements for an ESL classroom debate game called "Defend the Indefensible".
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}
${sourceContext}${sourceContext ? 'Use ideas, claims, and details from the source material above as the springboard for the statements.\n' : ''}${avoidText}
Rules:
- Each statement is a bold, opinionated assertion students must argue FOR or AGAINST (randomly assigned)
- Make them playfully absurd or mildly provocative — funny, not offensive or inappropriate
- Loosely connect them to the topic, or use the topic as a springboard to something wild
- They should provoke both laughter AND genuine argument
- NEVER use question marks — statements only
- Max 15 words each
- Examples for topic "food": "All meals should be eaten with chopsticks", "Breakfast is the most overrated meal of the day"

Return JSON with a "statements" array of exactly ${count} strings.`;

    const data = await generateJSON<{ statements: string[] }>(prompt, schema, { temperature: 1.1 });
    const statements = Array.isArray(data.statements) ? data.statements.slice(0, count) : [];

    if (statements.length < count) {
      throw new Error('Not enough statements generated');
    }

    return NextResponse.json({ statements }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('defend-it generate error:', error);
    // Fallback: topic-aware statements
    const fallback = [
      `${topic} is the most important subject anyone can learn`,
      `Everyone should study ${topic} for at least one hour every single day`,
      `The world would be a better place without ${topic}`,
      `${topic} is more fun than any sport or hobby`,
      `School should focus only on ${topic} and nothing else`,
    ].slice(0, count);
    return NextResponse.json({ statements: fallback, degraded: true }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
