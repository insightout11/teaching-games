import { describeVerdict, verifyMultipleChoice } from '@/lib/mcq-verify';
import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty } from '@/stores/session-store';
import type { Topic } from '@/stores/session-store';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { difficultyDescriptions } from '@/lib/difficulty';
import { resolveSourceContext, type LessonKit } from '@/lib/source-context';
import type { SourceMaterial } from '@/types/source-material';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface SpeakingResult { question: string }
interface WrittenResult { question: string; options: string[]; correctIndex: number }
type GenerateResult = SpeakingResult | WrittenResult;

const speakingSchema: AISchema = {
  type: 'object',
  properties: {
    question: { type: 'string' },
  },
  required: ['question'],
};

const writtenSchema: AISchema = {
  type: 'object',
  properties: {
    question:     { type: 'string' },
    options:      { type: 'array', items: { type: 'string' } },
    correctIndex: { type: 'number' },
  },
  required: ['question', 'options', 'correctIndex'],
};

const SPEAKING_ANGLES = [
  'a personal experience or memory related to the topic',
  'a comparison between two aspects, options, or viewpoints',
  'a problem you might face and how you would solve it',
  'the pros and cons of something related to the topic',
  'a prediction or hypothetical future scenario',
  'an opinion you would defend and why',
  'a step-by-step explanation of a process',
  'a recommendation with at least two reasons',
  'what advice you would give someone new to the topic',
  'how the topic affects daily life',
];

function speakingPromptSuffix(): string {
  const angle = SPEAKING_ANGLES[Math.floor(Math.random() * SPEAKING_ANGLES.length)];
  return `The question must focus on: ${angle}.

It must:
- Require 2–3 spoken sentences to answer fully
- Not be answerable with a single yes or no

Return JSON: { "question": "..." }`;
}

const WRITTEN_ANGLES = [
  'vocabulary in context — a fill-in-the-blank with the correct word or phrase',
  'grammar in use — identify the grammatically correct sentence or completion',
  'topic knowledge — a factual question where all 4 options are closely related',
  'meaning — choose the best definition or paraphrase of a word or phrase from the topic',
  'word choice — which word fits the meaning and register of the sentence correctly',
  'cause and effect — what best explains why something happens related to the topic',
  'inference — what can logically be concluded from a short scenario',
  'collocation — which word or phrase naturally pairs with a key term from the topic',
  'error correction — which option correctly fixes or completes a sentence with a common learner mistake',
  'function — choose the sentence that best achieves a communicative goal related to the topic',
];

function writtenPromptSuffix(): string {
  const angle = WRITTEN_ANGLES[Math.floor(Math.random() * WRITTEN_ANGLES.length)];
  return `Question type: ${angle}.

Create a multiple choice question with exactly 4 options at the stated language level.
- The correct answer must genuinely require knowledge at this level — not obvious common sense
- The 3 wrong options must be plausible: things a learner at this level might realistically confuse with the correct answer
- Never use distractors that are trivially false (e.g. "It was invented last year", "It only exists in one country")
- All 4 options should be similar in length and grammatical form
- EXACTLY ONE option is correct. A fluent speaker must agree that each of the other three is wrong, not merely less usual. Do not ask which word "collocates", "fits best" or "is most natural" when more than one option is acceptable English: ask about a fact from the topic, a clear meaning, or a clear grammar rule instead
- Before answering, test each wrong option: if you could defend it as also correct, replace it

Return JSON:
{
  "question": "...",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "correctIndex": 0
}
correctIndex is the 0-based index of the correct option (0–3).`;
}

export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  // This will hit the AI. Enforce the free-tier weekly cap.
  const limited = await checkAndRecordAiUsage(teacher);
  if (limited) return limited;

  const { topic, difficulty, qType, sourceMaterial, lessonKit } = await request.json() as {
    topic: Topic;
    difficulty: Difficulty;
    qType: 'speaking' | 'written';
    sourceMaterial?: SourceMaterial; lessonKit?: LessonKit;
  };

  // Ground questions in the lesson's source material when one is attached.
  const sourceContext = await resolveSourceContext(sourceMaterial, lessonKit);

  try {
    const randomSeed = Math.random().toString(36).substring(7);
    const prompt = `LANGUAGE RULE (follow strictly, even if the source is more advanced): ${difficultyDescriptions[difficulty]}

Generate one question about "${topic}" for ESL learners in a FAST-PACED game.
Random seed: ${randomSeed}
${sourceContext}${sourceContext ? 'The question MUST be answerable from the source material above and test what it actually says — but rewrite it in simple, everyday words.\n' : ''}
The QUESTION STEM must be ONE short, plain sentence (≤18 words), quick to read at a glance in a game. No long or nested clauses, no academic jargon, no abstract nominalizations ("public memory is constructed rather than inherited...").
${qType === 'speaking' ? speakingPromptSuffix() : writtenPromptSuffix()}

No preamble, no numbering.`;

    const schema = qType === 'speaking' ? speakingSchema : writtenSchema;
    const noStore = { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } };
    // Written questions get up to two tries: each is checked by an independent blind pass (exactly one right answer,
    // and it is the marked one) before the class sees it.
    let data: GenerateResult | null = null;
    for (let attempt = 0; attempt < (qType === 'written' ? 2 : 1); attempt += 1) {
      data = await generateJSON<GenerateResult>(prompt, schema, {
        temperature: 1.0,
        taskClass: 'content-generation',
      });

      if (!data.question || typeof data.question !== 'string' || data.question.trim().length < 5) {
        throw new Error('Invalid question generated');
      }
      if (qType !== 'written') break;

      const wr = data as WrittenResult;
      if (!Array.isArray(wr.options) || wr.options.length !== 4) throw new Error('Invalid MC options');
      if (typeof wr.correctIndex !== 'number' || wr.correctIndex < 0 || wr.correctIndex > 3) {
        throw new Error('Invalid correctIndex');
      }
      const item = { question: data.question.trim(), options: wr.options.map((o) => String(o).trim()), correctIndex: wr.correctIndex };
      const [verdict] = await verifyMultipleChoice([item], { topic, material: sourceMaterial?.rawText ?? sourceMaterial?.summary });
      if (verdict.ok) return NextResponse.json(item, noStore);
      console.warn(`[sector-strike/generate] question rejected (try ${attempt + 1}): ${describeVerdict(item, verdict)}`);
    }
    if (qType === 'written') {
      // Both tries failed the check. The square becomes a spoken question: a team talking is always better than a
      // wrong "correct" answer on the class screen.
      return NextResponse.json({ question: `Tell the class two things you know about ${topic}.`, checked: 'spoken-instead' }, noStore);
    }
    if (!data) throw new Error('No question generated');

    return NextResponse.json(
      { question: data.question.trim() },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  } catch (error) {
    console.error('[sector-strike/generate] error:', error);

    // Never a made-up multiple choice (the old stand-in invented four "facts" and marked one correct): a failed
    // written question becomes a spoken one.
    return NextResponse.json(
      {
        question: `What do you know about ${topic}? Share at least two ideas.`,
        degraded: true,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  }
}
