import type { AISchema } from '@/lib/ai';
import { SPOTLIGHT_TAGS, isSpotlightTag, type SpotlightTag } from '@/lib/spotlight';

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
  /** spotlight only — what kind of contribution the pick is. */
  tag?: SpotlightTag;
  /** spotlight only — exact phrase from the submission worth highlighting. */
  highlight?: string;
  sourceSubmissionId?: string;
  sourceStudentName?: string;
  sourceText?: string;
}

export interface CaptainSuggestionsAIResponse {
  suggestions?: Array<Partial<CaptainSuggestion>>;
}

export interface CaptainSuggestionScoreSignal {
  studentName: string;
  outcome?: string | null;
  accuracyStatus?: string | null;
}

export interface CaptainSuggestionPollResult {
  question: string;
  results: Array<{ option: string; votes: number }>;
}

export interface CaptainSuggestionsContext {
  topic: string;
  difficulty: string;
  currentPrompt?: string | null;
  submissions: CaptainSuggestionSourceSubmission[];
  // Live lesson telemetry — every field optional so callers degrade gracefully.
  goal?: string | null;
  stageLabel?: string | null;
  nextStageLabel?: string | null;
  grammarTarget?: string | null;
  vocab?: string[];
  sourceTitle?: string | null;
  sourceSummary?: string | null;
  quietStudents?: string[];
  recentScores?: CaptainSuggestionScoreSignal[];
  lastPoll?: CaptainSuggestionPollResult | null;
}

const MAX_TITLE_LENGTH = 34;
const MAX_RATIONALE_LENGTH = 120;
const MAX_PROMPT_LENGTH = 200;
const MAX_SOURCE_TEXT_LENGTH = 240;
const MAX_HIGHLIGHT_LENGTH = 60;

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
          tag: { type: 'string', enum: [...SPOTLIGHT_TAGS] },
          highlight: { type: 'string' },
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

/** Treat missing/placeholder topics as absent so the model never sees "General". */
function usableTopic(topic: string): string {
  const cleaned = cleanText(topic, 100);
  if (!cleaned || cleaned.toLowerCase() === 'general') return '';
  return cleaned;
}

export function buildFallbackCaptainSuggestions(context: CaptainSuggestionsContext): CaptainSuggestion[] {
  const topic = usableTopic(context.topic) || 'today\'s topic';
  const stage = cleanText(context.stageLabel, 40);
  const standout = findStandoutSubmission(context.submissions);
  const suggestions: CaptainSuggestion[] = [];

  if (standout) {
    suggestions.push({
      id: makeId('fallback', suggestions.length),
      kind: 'spotlight',
      title: 'Spotlight idea',
      rationale: `${standout.displayName || 'A student'} gave the class something concrete to build on.`,
      prompt: standout.content,
      tag: 'idea',
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
    rationale: stage
      ? `Gives you a fast read on the class after ${stage}.`
      : 'Gives you a fast read on where to steer the discussion.',
    prompt: standout
      ? 'Which direction should we discuss next?'
      : `Which part of ${topic} should we focus on next?`,
    options: ['Examples', 'Problems', 'Solutions', 'Personal opinions'],
  });

  return suggestions.slice(0, 3);
}

export function buildCaptainSuggestionsPrompt(context: CaptainSuggestionsContext): string {
  const topic = usableTopic(context.topic);
  const difficulty = cleanText(context.difficulty, 40) || 'Intermediate';
  const currentPrompt = cleanText(context.currentPrompt, 180);
  const goal = cleanText(context.goal, 160);
  const stageLabel = cleanText(context.stageLabel, 60);
  const nextStageLabel = cleanText(context.nextStageLabel, 60);
  const grammarTarget = cleanText(context.grammarTarget, 60);
  const sourceTitle = cleanText(context.sourceTitle, 120);
  const sourceSummary = cleanText(context.sourceSummary, 800);
  const vocab = (context.vocab ?? []).map((w) => cleanText(w, 40)).filter(Boolean).slice(0, 14);
  const quietStudents = (context.quietStudents ?? []).map((n) => cleanText(n, 40)).filter(Boolean).slice(0, 6);

  const lessonLines: string[] = [];
  lessonLines.push(
    topic
      ? `Lesson topic: ${topic}`
      : `Lesson topic: not recorded — infer it from the student writing below and stay on THAT topic.`,
  );
  lessonLines.push(`Level: ${difficulty} ESL students`);
  if (goal) lessonLines.push(`Lesson goal: ${goal}`);
  if (stageLabel) lessonLines.push(`Current stage: ${stageLabel}`);
  if (nextStageLabel) lessonLines.push(`Next stage: ${nextStageLabel} (a suggestion may warm it up)`);
  if (grammarTarget) lessonLines.push(`Grammar focus: ${grammarTarget}`);
  if (vocab.length > 0) lessonLines.push(`Lesson vocabulary: ${vocab.join(', ')} (recycling these is valuable)`);
  if (sourceTitle) {
    lessonLines.push(`Source material: "${sourceTitle}"${sourceSummary ? ` — ${sourceSummary}` : ''}`);
  }
  if (currentPrompt) lessonLines.push(`Current student-device prompt: ${currentPrompt}`);

  const telemetryLines: string[] = [];
  const scores = (context.recentScores ?? []).slice(0, 20);
  if (scores.length > 0) {
    const summary = scores
      .map((s) => `${cleanText(s.studentName, 40) || 'Student'}:${s.accuracyStatus ?? s.outcome ?? 'answered'}`)
      .join('; ');
    telemetryLines.push(`Recent scored answers (newest first): ${summary}`);
  }
  if (quietStudents.length > 0) {
    telemetryLines.push(
      `Quiet so far (no recent answers): ${quietStudents.join(', ')}. A low-pressure question or poll can re-engage them — never name them in a student-facing prompt.`,
    );
  }
  if (context.lastPoll && context.lastPoll.results.length > 0) {
    const tally = context.lastPoll.results.map((r) => `${r.option}=${r.votes}`).join(', ');
    telemetryLines.push(`Latest poll: "${cleanText(context.lastPoll.question, 120)}" → ${tally}`);
  }

  const submissionLines = context.submissions.slice(0, 18).map((sub, index) => {
    const stage = sub.gameKey ? `stage=${sub.gameKey}` : 'stage=class-question';
    return `${index + 1}. id=${sub.id}; student=${cleanText(sub.displayName, 40)}; status=${sub.status ?? 'unknown'}; ${stage}; text="${cleanText(sub.content, 260)}"`;
  });

  return `You are the copilot for a busy English teacher running a live lesson. Your suggestions fill short gaps in the lesson without interrupting the main activity: questions and polls appear in "Crew Radio", a quiet side panel on student devices that students open when they have a spare moment.

${lessonLines.join('\n')}
${telemetryLines.length > 0 ? `\nLive class signals:\n${telemetryLines.join('\n')}\n` : ''}
Recent student writing:
${submissionLines.length > 0 ? submissionLines.join('\n') : '(none yet)'}

Create exactly 3 teacher-facing suggestions — the 3 most valuable moves RIGHT NOW. Keep them short enough to read while teaching.

Allowed kinds:
- spotlight: choose one exact sourceSubmissionId from the list — a student contribution worth celebrating on the shared screen. Add "tag" (question, answer, idea, example, hot-take, or wordcraft) and "highlight": the strongest 2-6 word phrase copied EXACTLY from that submission.
- question: a short side-panel writing prompt. It MUST be answerable only from the student's own head — an opinion, prediction, preference, or personal experience tied to this lesson. Never a fact-recall question that could be looked up or pasted into a chatbot.
- poll: a quick side-panel poll tied to what just happened. Include 2-4 short options.

Rules:
- Do not publish anything yourself; the teacher must tap first.
- Stay concretely tied to THIS lesson: reference the actual submissions, vocabulary, mistakes, or poll results above. Generic prompts that fit any lesson are failures.
- rationale: tell the teacher WHY NOW, citing the concrete evidence you used (a student's idea, a repeated mistake, a poll split, a quiet stretch).
- Prompts must be classroom-safe and appropriate for ${difficulty} ESL students.
- No markdown.
- title <= 5 words.
- rationale <= 16 words.
- prompt <= 28 words.
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
      suggestion.tag = isSpotlightTag(raw.tag) ? raw.tag : 'idea';
      // Highlight must be a real phrase from the submission, or it's dropped.
      const highlight = cleanText(raw.highlight, MAX_HIGHLIGHT_LENGTH);
      if (highlight && source.content.toLowerCase().includes(highlight.toLowerCase())) {
        suggestion.highlight = highlight;
      }
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
