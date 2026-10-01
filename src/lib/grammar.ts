export enum GrammarTarget {
  // Tenses
  PresentSimple = 'present simple',
  PresentContinuous = 'present continuous',
  PastSimple = 'past simple',
  PastContinuous = 'past continuous',
  PresentPerfect = 'present perfect',
  PresentPerfectContinuous = 'present perfect continuous',
  PastPerfect = 'past perfect',
  FutureWill = 'future (will)',
  FutureGoingTo = 'future (going to)',
  FutureContinuous = 'future continuous',
  // Structures
  Conditional = 'conditional',
  Passive = 'passive voice',
  RelativeClause = 'relative clause',
  ReportedSpeech = 'reported speech'
}

export interface GrammarReferenceEntry {
  rule: string;
  examples: string[];
}

export const grammarReference: Record<GrammarTarget, GrammarReferenceEntry> = {
  [GrammarTarget.PresentSimple]: {
    rule: "Use the base form (+ -s/-es for he/she/it) for habits, facts, and routines.",
    examples: ["She walks to school every day.", "Water boils at 100°C."],
  },
  [GrammarTarget.PresentContinuous]: {
    rule: "Use am/is/are + verb-ing for actions happening right now or temporary situations.",
    examples: ["He is talking on the phone.", "They are staying at a hotel this week."],
  },
  [GrammarTarget.PastSimple]: {
    rule: "Use the past form (verb + -ed, or irregular) for completed actions in the past.",
    examples: ["She called me last night.", "We went to the market on Saturday."],
  },
  [GrammarTarget.PastContinuous]: {
    rule: "Use was/were + verb-ing for an action in progress at a specific past moment.",
    examples: ["I was reading when she arrived.", "They were playing outside all afternoon."],
  },
  [GrammarTarget.PresentPerfect]: {
    rule: "Use have/has + past participle for past actions with a connection to the present.",
    examples: ["I have visited Paris twice.", "She has just finished her homework."],
  },
  [GrammarTarget.PresentPerfectContinuous]: {
    rule: "Use have/has been + verb-ing to show how long an action has been in progress.",
    examples: ["He has been working here for five years.", "We have been waiting for an hour."],
  },
  [GrammarTarget.PastPerfect]: {
    rule: "Use had + past participle for an action that finished before another past action.",
    examples: ["By the time I arrived, she had already left.", "He had studied English before moving abroad."],
  },
  [GrammarTarget.FutureWill]: {
    rule: "Use will + base verb for predictions, decisions made at the moment, and promises.",
    examples: ["I think it will rain tomorrow.", "I'll help you carry those bags."],
  },
  [GrammarTarget.FutureGoingTo]: {
    rule: "Use am/is/are going to + base verb for plans or predictions based on evidence.",
    examples: ["She is going to study medicine.", "Look at those clouds — it's going to rain."],
  },
  [GrammarTarget.FutureContinuous]: {
    rule: "Use will be + verb-ing for an action in progress at a specific future time.",
    examples: ["This time tomorrow, I will be flying to Tokyo.", "They will be working when we arrive."],
  },
  [GrammarTarget.Conditional]: {
    rule: "First conditional (real): if + present simple, will + base verb. Second (hypothetical): if + past simple, would + base verb.",
    examples: ["If it rains, we will cancel the trip.", "If I had more time, I would learn the piano."],
  },
  [GrammarTarget.Passive]: {
    rule: "Use am/is/are/was/were + past participle to focus on the action, not the doer.",
    examples: ["The report was written by the team.", "Mistakes are made by everyone."],
  },
  [GrammarTarget.RelativeClause]: {
    rule: "Use who (people), which (things), or that (both) to add information about a noun.",
    examples: ["The man who called you is my uncle.", "That is the book which changed my life."],
  },
  [GrammarTarget.ReportedSpeech]: {
    rule: "Shift tenses back when reporting what someone said (present → past, will → would, etc.).",
    examples: ["She said she was tired. (was = reported from 'I am tired')", "He told me he would call later."],
  },
};

export const GRAMMAR_TARGET_GROUPS: Record<string, GrammarTarget[]> = {
  Tenses: [
    GrammarTarget.PresentSimple,
    GrammarTarget.PresentContinuous,
    GrammarTarget.PastSimple,
    GrammarTarget.PastContinuous,
    GrammarTarget.PresentPerfect,
    GrammarTarget.PresentPerfectContinuous,
    GrammarTarget.PastPerfect,
    GrammarTarget.FutureWill,
    GrammarTarget.FutureGoingTo,
    GrammarTarget.FutureContinuous,
  ],
  Structures: [
    GrammarTarget.Conditional,
    GrammarTarget.Passive,
    GrammarTarget.RelativeClause,
    GrammarTarget.ReportedSpeech,
  ],
};

/**
 * Grammar families (Grammar Flight v2): each grammar point belongs to a family, and the family
 * decides the speaking game, the board template and the presentation frame. Targets outside the
 * enum (free text from teachers) are matched by keyword.
 */
export type GrammarFamily = 'tenses' | 'comparisons' | 'questions' | 'modals' | 'conditionals' | 'passive' | 'reported' | 'prepositions' | 'other';

const TENSE_TARGETS = new Set<string>(GRAMMAR_TARGET_GROUPS.Tenses);

export function grammarFamily(target?: string | null): GrammarFamily {
  const t = (target ?? '').toLowerCase().trim();
  if (!t) return 'other';
  if (TENSE_TARGETS.has(t) || /\b(tense|present|past|future|perfect|continuous|will|going to|used to)\b/.test(t)) return 'tenses';
  if (/\b(compar|superlative|than|as \.\.\. as)\b/.test(t)) return 'comparisons';
  if (/\b(question|wh-|tag)\b/.test(t)) return 'questions';
  if (/\b(modal|must|should|can|could|have to|might|may)\b/.test(t)) return 'modals';
  if (/\b(conditional|if)\b/.test(t)) return 'conditionals';
  if (/\bpassive\b/.test(t)) return 'passive';
  if (/\breported\b/.test(t)) return 'reported';
  if (/\bpreposition/.test(t)) return 'prepositions';
  return 'other';
}
