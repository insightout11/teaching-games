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
 * - password: replaced by Hot Seat
 * - defend-it: folded into Hot Take Arena as the Wild card mode
 * - vocab-radar, expert-panel, problem-solvers, listening-gap-fill: merged per the
 *   Sep 2026 catalogue audit (docs/catalogue-audit-sep2026.md)
 */
export const RETIRED_PLUGIN_KEYS: ReadonlySet<string> = new Set([
  'word-chain',
  'brain-teasers',
  'mic-drop',
  'lightning-round',
  'in-your-words',
  'two-truths',
  'password', // replaced by Hot Seat (everyone gives clues, not one team)
  'defend-it', // now Hot Take Arena's "Wild card" mode
  'radar-fix', // merged into Mystery Flight (text clues)
  'world-lens', // merged into Mystery Flight (photo clues)
  'vocab-radar', // into Language Toolkit
  'expert-panel', // into Team Debate
  'problem-solvers', // into Decision Council
  'listening-gap-fill', // listening now = Radio Check / Static / Black Box
]);

export const isRetired = (key: string) => RETIRED_PLUGIN_KEYS.has(key);
