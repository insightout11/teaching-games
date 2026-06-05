import type { AISchema } from '@/lib/ai';

export type CaptainSuggestionKind = 'spotlight' | 'question' | 'poll';

export interface CaptainSuggestionSourceSubmission {
  id: string;
  displayName: string;
  content: string;
  status?: string | null;
  gameKey?: string | null;
  createdAt?: string | null;
}

export interface CaptainSuggestion {
  id: string;
  kind: CaptainSuggestionKind;
  title: string;
  rationale: string;
  prompt: string;
  options?: string[];
  sourceSubmissionId?: string;
  sourceStudentName?: string;
  sourceText?: string;
}

export interface CaptainSuggestionsAIResponse {
  suggestions?: Array<Partial<CaptainSuggestion>>;
}

export interface CaptainSuggestionsContext {
  topic: string;
  difficulty: string;
  currentPrompt?: string | null;
  submissions: CaptainSuggestionSourceSubmission[];
}

const MAX_TITLE_LENGTH = 34;
const MAX_RATIONALE_LENGTH = 110;
const MAX_PROMPT_LENGTH = 180;
const MAX_SOURCE_TEXT_LENGTH = 240;

export const captainSuggestionsSchema: AISchema = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['spotlight', 'question', 'poll'] },
          title: { type: 'string' },
          rationale: { type: 'string' },
          prompt: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          sourceSubmissionId: { type: 'string' },
        },
        required: ['kind', 'title', 'rationale', 'prompt'],
      },
    },
  },
  required: ['suggestions'],
};

function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function isSuggestionKind(value: unknown): value is CaptainSuggestionKind {
  return value === 'spotlight' || value === 'question' || value === 'poll';
}

function uniqueOptions(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const option of options) {
    const value = cleanText(option, 42);
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    cleaned.push(value);
    if (cleaned.length >= 5) break;
  }

  return cleaned;
}

function makeId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}

function findStandoutSubmission(submissions: CaptainSuggestionSourceSubmission[]) {
  return (
    submissions.find((sub) => sub.content.trim().length >= 28) ??
    submissions.find((sub) => sub.content.trim().length >= 12) ??
    submissions[0] ??
    null
  );
}

export function buildFallbackCaptainSuggestions(context: CaptainSuggestionsContext): CaptainSuggestion[] {
  const topic = cleanText(context.topic, 80) || 'today\'s topic';
  const standout = findStandoutSubmission(context.submissions);
  const suggestions: CaptainSuggestion[] = [];

  if (standout) {
    suggestions.push({
      id: makeId('fallback', suggestions.length),
      kind: 'spotlight',
      title: 'Spotlight idea',
      rationale: `${standout.displayName || 'A student'} gave the class something concrete to build on.`,
      prompt: standout.content,
      sourceSubmissionId: standout.id,
      sourceStudentName: standout.displayName,
      sourceText: cleanText(standout.content, MAX_SOURCE_TEXT_LENGTH),
    });
  }

  suggestions.push({
    id: makeId('fallback', suggestions.length),
    kind: 'question',
    title: standout ? 'Follow-up write' : 'Quick write',
    rationale: standout
      ? 'Turns one student idea into short written responses from everyone.'
      : 'Collects student ideas before choosing the next discussion direction.',
    prompt: standout
      ? `What do you agree or disagree with in ${standout.displayName || 'this student'}'s idea? Explain briefly.`
      : `What is one idea about ${topic} that you want the class to discuss next?`,
  });

  suggestions.push({
    id: makeId('fallback', suggestions.length),
    kind: 'poll',
    title: 'Class pulse',
    rationale: 'Gives you a fast read on where to steer the discussion.',
    prompt: standout
      ? 'Which direction should we discuss next?'
      : `Which part of ${topic} should we focus on next?`,
    options: ['Examples', 'Problems', 'Solutions', 'Personal opinions'],
  });

  return suggestions.slice(0, 3);
}

export function buildCaptainSuggestionsPrompt(context: CaptainSuggestionsContext): string {
  const topic = cleanText(context.topic, 100) || 'General English';
  const difficulty = cleanText(context.difficulty, 40) || 'Intermediate';
  const currentPrompt = cleanText(context.currentPrompt, 180);
  const submissionLines = context.submissions.slice(0, 18).map((sub, index) => {
    const stage = sub.gameKey ? `stage=${sub.gameKey}` : 'stage=class-question';
    return `${index + 1}. id=${sub.id}; student=${cleanText(sub.displayName, 40)}; status=${sub.status ?? 'unknown'}; ${stage}; text="${cleanText(sub.content, 260)}"`;
  });

  return `You are helping a busy English teacher run a live lesson.

Lesson topic: ${topic}
Level: ${difficulty}
Current student-device prompt: ${currentPrompt || 'none'}

Recent student writing:
${submissionLines.join('\n')}

Create exactly 3 teacher-facing suggestions. Keep them short enough to read while teaching.

Allowed kinds:
- spotlight: choose one exact sourceSubmissionId from the list. Use this when a student idea is worth displaying.
- question: a short writing prompt the teacher can push to every student.
- poll: a quick poll the teacher can launch. Include 2-4 short options.

Rules:
- Do not publish anything yourself; the teacher must tap first.
- Prefer student ideas that can start discussion, feedback, comparison, or revision.
- Prompts must be classroom-safe and appropriate for ${difficulty} ESL students.
- No markdown.
- title <= 5 words.
- rationale <= 14 words.
- prompt <= 26 words.
- Poll options <= 5 words each.
- Use a real sourceSubmissionId only when kind is spotlight.`;
}

export function sanitizeCaptainSuggestions(
  rawSuggestions: Array<Partial<CaptainSuggestion>> | undefined,
  submissions: CaptainSuggestionSourceSubmission[],
  fallback: CaptainSuggestion[],
): CaptainSuggestion[] {
  const sourceById = new Map(submissions.map((sub) => [sub.id, sub]));
  const cleaned: CaptainSuggestion[] = [];

  for (const raw of rawSuggestions ?? []) {
    const kind = isSuggestionKind(raw.kind) ? raw.kind : null;
    if (!kind) continue;

    const title = cleanText(raw.title, MAX_TITLE_LENGTH);
    const rationale = cleanText(raw.rationale, MAX_RATIONALE_LENGTH);
    const prompt = cleanText(raw.prompt, MAX_PROMPT_LENGTH);
    if (!title || !rationale || !prompt) continue;

    const suggestion: CaptainSuggestion = {
      id: makeId('ai', cleaned.length),
      kind,
      title,
      rationale,
      prompt,
    };

    if (kind === 'spotlight') {
      const sourceId = cleanText(raw.sourceSubmissionId, 80);
      const source = sourceById.get(sourceId);
      if (!source) continue;
      suggestion.sourceSubmissionId = source.id;
      suggestion.sourceStudentName = source.displayName;
      suggestion.sourceText = cleanText(source.content, MAX_SOURCE_TEXT_LENGTH);
      suggestion.prompt = cleanText(source.content, MAX_PROMPT_LENGTH) || prompt;
    }

    if (kind === 'poll') {
      const options = uniqueOptions(raw.options);
      if (options.length < 2) continue;
      suggestion.options = options;
    }

    cleaned.push(suggestion);
    if (cleaned.length >= 3) break;
  }

  if (cleaned.length >= 2) return cleaned;
  return fallback;
}
