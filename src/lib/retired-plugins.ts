/**
 * Retired games/activities: hidden from every browse list and never picked for
 * new flight plans, but still resolvable by key (getGame / getActivity /
 * getFlightPlanItem) so saved lessons and the landing demo keep working.
 *
 * Sep 2026 catalogue review (owner-approved):
 * - word-chain, brain-teasers: weakest for language learning
 * - mic-drop, lightning-round: duplicate exit tickets (Final Answer stays)
 * - in-your-words: duplicate of Language Toolkit
 * - two-truths (Spot the Fib): merged into Fact Detective
 */
export const RETIRED_PLUGIN_KEYS: ReadonlySet<string> = new Set([
  'word-chain',
  'brain-teasers',
  'mic-drop',
  'lightning-round',
  'in-your-words',
  'two-truths',
]);

export const isRetired = (key: string) => RETIRED_PLUGIN_KEYS.has(key);
