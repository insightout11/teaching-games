import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';

/**
 * A second, independent check on multiple-choice questions before a class sees them.
 *
 * The AI that writes a question also marks its answer, and it can be wrong: several options may be acceptable, or
 * the marked one may simply be incorrect (Oct 2026 sweep: "inter" marked as the word for leaving bodies exposed).
 * A teacher cannot catch that in the moment, and on a shared screen a wrong "correct" answer teaches the mistake.
 *
 * So each question is answered again, BLIND: a different model (the "evaluation" route, OpenAI first) sees the
 * question and options without the marked answer and lists every option a careful teacher would accept. A
 * question passes only when it lists exactly one, and it is the one that was marked.
 *
 * Fails open: if the check itself cannot run (timeout, provider down), the questions pass unchanged. A lesson must
 * never block on the checker.
 */
export interface McqItem {
  question: string;
  options: string[];
  correctIndex: number;
}

export type McqVerdict =
  | { ok: true }
  /** more than one option is acceptable */
  | { ok: false; reason: 'several'; acceptable: number[] }
  /** exactly one option is acceptable, but not the marked one */
  | { ok: false; reason: 'different'; acceptable: number[] }
  /** no option is acceptable */
  | { ok: false; reason: 'none'; acceptable: number[] };

const schema: AISchema = {
  type: 'object',
  properties: {
    answers: {
      type: 'array',
      items: {
        type: 'object',
        properties: { number: { type: 'integer' }, acceptable: { type: 'array', items: { type: 'integer' } } },
        required: ['number', 'acceptable'],
      },
    },
  },
  required: ['answers'],
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Check a batch of questions in one call. `material` is the text or transcript the questions are about, when they
 * are about one: without it a comprehension question cannot be answered. Returns one verdict per item, in order;
 * every verdict is `{ ok: true }` when the check could not run.
 */
export async function verifyMultipleChoice(items: McqItem[], opts: { material?: string; topic?: string } = {}): Promise<McqVerdict[]> {
  const pass: McqVerdict[] = items.map(() => ({ ok: true }));
  if (!items.length) return pass;

  const block = items
    .map((item, i) => `Question ${i + 1}: ${item.question}\n${item.options.map((option, j) => `  ${LETTERS[j]}. ${option}`).join('\n')}`)
    .join('\n\n');
  const prompt = `You are checking multiple-choice questions written for an English class before students see them. For each question, decide which options are ACCEPTABLE answers.

Be strict about what the question asks, and fair about English:
- An option is acceptable if a careful teacher would have to mark it correct. If two options are both fine English or both true, BOTH are acceptable: list both.
- If no option is correct, return an empty list for that question.
- Do not guess which one the writer intended. Judge each option on its own.
${opts.material ? `\nThe questions are about this material. Judge comprehension questions ONLY against it:\n"""\n${opts.material.slice(0, 9000)}\n"""\n` : opts.topic ? `\nThe questions are about: ${opts.topic}\n` : ''}
${block}

Return { "answers": [ { "number": 1, "acceptable": [0-based option indexes] }, ... ] } with one entry per question, in order.`;

  try {
    const parsed = await generateJSON<{ answers?: Array<{ number?: number; acceptable?: number[] }> }>(prompt, schema, { taskClass: 'evaluation', temperature: 0 });
    const byNumber = new Map((parsed.answers ?? []).map((answer) => [answer.number, answer.acceptable]));
    if (byNumber.size < items.length) return pass; // an incomplete check proves nothing
    return items.map((item, i): McqVerdict => {
      const listed = byNumber.get(i + 1);
      if (!Array.isArray(listed)) return { ok: true };
      const acceptable = Array.from(new Set(listed.filter((n) => Number.isInteger(n) && n >= 0 && n < item.options.length)));
      if (acceptable.length === 1 && acceptable[0] === item.correctIndex) return { ok: true };
      if (acceptable.length === 0) return { ok: false, reason: 'none', acceptable };
      if (acceptable.length === 1) return { ok: false, reason: 'different', acceptable };
      return { ok: false, reason: 'several', acceptable };
    });
  } catch (error) {
    console.warn('[mcq-verify] check could not run; questions pass unchecked:', error instanceof Error ? error.message : error);
    return pass;
  }
}

/** Plain-words reason for logs and the content-health report. */
export function describeVerdict(item: McqItem, verdict: McqVerdict): string {
  if (verdict.ok) return 'ok';
  const marked = item.options[item.correctIndex] ?? '?';
  const others = verdict.acceptable.map((n) => item.options[n]).join(' / ');
  if (verdict.reason === 'none') return `no option is correct (marked: "${marked}") — "${item.question.slice(0, 90)}"`;
  if (verdict.reason === 'different') return `marked "${marked}" but the check says "${others}" — "${item.question.slice(0, 90)}"`;
  return `several acceptable answers (${others}) — "${item.question.slice(0, 90)}"`;
}
