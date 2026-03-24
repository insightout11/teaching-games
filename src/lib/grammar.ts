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
