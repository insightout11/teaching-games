import type { WouldYouRatherContent, WouldYouRatherDilemma } from '@/activities/types';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { languageRule, type Difficulty } from '@/lib/difficulty';

export interface RawWouldYouRatherContent {
  dilemmas: WouldYouRatherDilemma[];
  potentialFollowUps: Array<{ dilemmaId: string; questions: string[] }>;
}

type WouldYouRatherGenerator = (
  prompt: string,
  schema: AISchema,
) => Promise<RawWouldYouRatherContent>;

export interface BeginnerValidationResult {
  valid: boolean;
  reasons: string[];
}

const WOULD_YOU_RATHER_SCHEMA: AISchema = {
  type: 'object',
  properties: {
    dilemmas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          optionA: { type: 'string' },
          optionB: { type: 'string' },
          discussionPrompt: { type: 'string' },
        },
        required: ['id', 'optionA', 'optionB', 'discussionPrompt'],
      },
    },
    potentialFollowUps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dilemmaId: { type: 'string' },
          questions: { type: 'array', items: { type: 'string' } },
        },
        required: ['dilemmaId', 'questions'],
      },
    },
  },
  required: ['dilemmas', 'potentialFollowUps'],
};

const COMMON_TOPIC_WORDS = new Set(['and', 'about', 'the', 'a', 'an', 'for', 'with', 'of', 'in', 'on']);
const BEGINNER_GROUNDING_GROUPS: Array<{ match: string[]; words: string[] }> = [
  { match: ['food', 'drink', 'meal', 'restaurant'], words: ['food', 'drink', 'eat', 'water', 'pizza', 'rice', 'bread', 'milk', 'tea', 'juice', 'meal', 'cook', 'soup', 'salad', 'fruit', 'breakfast', 'dinner'] },
  { match: ['travel', 'trip', 'holiday'], words: ['travel', 'trip', 'bus', 'train', 'plane', 'car', 'walk', 'hotel', 'city', 'beach'] },
  { match: ['school', 'class', 'study'], words: ['school', 'class', 'study', 'learn', 'book', 'teacher', 'student', 'homework'] },
  { match: ['job', 'work', 'career'], words: ['job', 'work', 'office', 'shop', 'teacher', 'doctor', 'cook', 'driver'] },
  { match: ['weather', 'climate'], words: ['weather', 'rain', 'sun', 'hot', 'cold', 'wind', 'snow', 'climate'] },
];
const HIGH_SIGNAL_BEGINNER_MISMATCHES = [
  'teleport',
  'gentle breeze',
  'enchanted',
  'invisible',
  'mysterious',
  'superhero',
  'dragon',
  'magical kingdom',
];

function words(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

function groundingWords(topic: string): Set<string> {
  const topicWords = words(topic).filter((word) => !COMMON_TOPIC_WORDS.has(word));
  const result = new Set(topicWords);
  for (const group of BEGINNER_GROUNDING_GROUPS) {
    if (group.match.some((word) => topicWords.includes(word))) {
      group.words.forEach((word) => result.add(word));
    }
  }
  return result;
}

function isSimpleLine(value: unknown, maxWords: number): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || words(trimmed).length > maxWords) return false;
  return !/[;:,]|\b(however|although|unless|despite|whereas)\b/i.test(trimmed);
}

export function validateBeginnerWouldYouRather(
  content: RawWouldYouRatherContent,
  topic: string,
): BeginnerValidationResult {
  const reasons: string[] = [];
  if (!Array.isArray(content.dilemmas) || content.dilemmas.length !== 5) {
    reasons.push('Return exactly five dilemmas.');
    return { valid: false, reasons };
  }

  const followUps = new Map(
    Array.isArray(content.potentialFollowUps)
      ? content.potentialFollowUps.map((item) => [item.dilemmaId, item.questions] as const)
      : [],
  );
  const topicWords = groundingWords(topic);
  const topicLower = topic.toLowerCase();

  for (const dilemma of content.dilemmas) {
    const questions = followUps.get(dilemma.id);
    if (!isSimpleLine(dilemma.optionA, 8) || !isSimpleLine(dilemma.optionB, 8)) {
      reasons.push(`${dilemma.id || 'A dilemma'} needs two simple options of eight words or fewer.`);
    }
    if (!isSimpleLine(dilemma.discussionPrompt, 10)) {
      reasons.push(`${dilemma.id || 'A dilemma'} needs a simple discussion question of ten words or fewer.`);
    }
    if (!Array.isArray(questions) || questions.length !== 3 || questions.some((question) => !isSimpleLine(question, 10))) {
      reasons.push(`${dilemma.id || 'A dilemma'} needs three simple follow-up questions.`);
    }

    const allText = [dilemma.optionA, dilemma.optionB, dilemma.discussionPrompt, ...(questions ?? [])]
      .join(' ')
      .toLowerCase();
    if (topicWords.size > 0 && !words(allText).some((word) => topicWords.has(word))) {
      reasons.push(`${dilemma.id || 'A dilemma'} is not clearly grounded in "${topic}".`);
    }
    const mismatch = HIGH_SIGNAL_BEGINNER_MISMATCHES.find(
      (term) => allText.includes(term) && !topicLower.includes(term),
    );
    if (mismatch) reasons.push(`${dilemma.id || 'A dilemma'} uses unsuitable Beginner wording: "${mismatch}".`);
  }

  return { valid: reasons.length === 0, reasons };
}

function normalizeContent(topic: string, raw: RawWouldYouRatherContent): WouldYouRatherContent {
  const followUps: Record<string, string[]> = {};
  for (const item of raw.potentialFollowUps ?? []) {
    if (item.dilemmaId && Array.isArray(item.questions)) followUps[item.dilemmaId] = item.questions;
  }
  return {
    activityKey: 'would-you-rather',
    topicContext: topic,
    dilemmas: raw.dilemmas,
    potentialFollowUps: followUps,
  };
}

function safeBeginnerFallback(topic: string): RawWouldYouRatherContent {
  const topicWords = words(topic).filter((word) => !COMMON_TOPIC_WORDS.has(word)).slice(0, 3);
  const topicLabel = topicWords.join(' ') || 'this topic';
  const foodTopic = topicWords.some((word) => ['food', 'drink', 'meal', 'restaurant'].includes(word));
  const pairs = foodTopic
    ? [
        ['Eat pizza every day', 'Drink only water'],
        ['Cook rice at home', 'Make a sandwich'],
        ['Eat fruit for lunch', 'Drink milk at breakfast'],
        ['Have soup for dinner', 'Have salad for dinner'],
        ['Eat breakfast early', 'Eat dinner late'],
      ]
    : Array.from({ length: 5 }, (_, index) => [
        `Learn about ${topicLabel} at school`,
        `Talk about ${topicLabel} with a friend`,
      ].map((text) => index === 0 ? text : `${text} ${index + 1}`));

  const dilemmas = pairs.map(([optionA, optionB], index) => ({
    id: `beginner-safe-${index + 1}`,
    optionA,
    optionB,
    discussionPrompt: 'Which choice is better for you?',
  }));
  return {
    dilemmas,
    potentialFollowUps: dilemmas.map((dilemma) => ({
      dilemmaId: dilemma.id,
      questions: ['Why do you like this choice?', 'Who can do this with you?', 'When can you do this?'],
    })),
  };
}

function buildPrompt(options: {
  topic: string;
  difficulty: Difficulty;
  context?: string;
  correctionReasons?: string[];
}): string {
  const beginnerRules = options.difficulty === 'Beginner'
    ? `\nBEGINNER OUTPUT CHECK:\n- Every option has at most 8 words.\n- Every discussion and follow-up question has at most 10 words.\n- Use concrete, everyday actions and clearly connect every dilemma to the topic.\n- Do not introduce fantasy or dramatic vocabulary unless the topic explicitly asks for it.`
    : '';
  const correction = options.correctionReasons?.length
    ? `\nCORRECT THE PREVIOUS OUTPUT:\n${options.correctionReasons.map((reason) => `- ${reason}`).join('\n')}`
    : '';
  return `${languageRule(options.difficulty)}

Generate 5 "Would You Rather?" dilemmas for an ESL classroom.
Topic: ${options.topic}
${options.context ?? ''}
Each dilemma needs two options (both appealing OR both unappealing), one discussion prompt, and exactly 3 follow-up questions.
- Each option is one short, plain sentence in everyday words.
- Keep every dilemma concrete and grounded in the requested topic.${beginnerRules}${correction}
Return JSON with 'dilemmas' array and 'potentialFollowUps' array (each with dilemmaId and questions).`;
}

export async function generateValidatedWouldYouRather(options: {
  topic: string;
  difficulty: Difficulty;
  context?: string;
  generate?: WouldYouRatherGenerator;
}): Promise<WouldYouRatherContent> {
  const generate = options.generate
    ?? ((prompt, schema) => generateJSON<RawWouldYouRatherContent>(prompt, schema));
  const first = await generate(buildPrompt(options), WOULD_YOU_RATHER_SCHEMA);
  if (options.difficulty !== 'Beginner') return normalizeContent(options.topic, first);

  const firstValidation = validateBeginnerWouldYouRather(first, options.topic);
  if (firstValidation.valid) return normalizeContent(options.topic, first);

  try {
    const corrected = await generate(buildPrompt({
      ...options,
      correctionReasons: firstValidation.reasons,
    }), WOULD_YOU_RATHER_SCHEMA);
    const correctedValidation = validateBeginnerWouldYouRather(corrected, options.topic);
    return normalizeContent(
      options.topic,
      correctedValidation.valid ? corrected : safeBeginnerFallback(options.topic),
    );
  } catch {
    return normalizeContent(options.topic, safeBeginnerFallback(options.topic));
  }
}
