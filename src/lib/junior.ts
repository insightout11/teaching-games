/**
 * Junior classes (about ages 5-9, classes.junior): games and activities hidden from in-lesson launch lists because
 * they need debating, typing or grammar talk (docs/pictures-and-junior-concept.md, "Hide in Junior mode").
 * They stay launchable from saved plans; this only keeps them out of the menus.
 */
export const JUNIOR_HIDDEN_KEYS: ReadonlySet<string> = new Set([
  'team-debate', 'tag-team-debate', 'evidence-cards', 'hot-take-arena', 'motion-pulse', 'opinion-shift', 'flight-verdict',
  'decision-council', 'scenario-simulator', 'grammar-boss', 'grammar-clarify', 'grammar-proof', 'grammar-spotlight',
  'grammar-check-in', 'tense-time-machine', 'error-hunter', 'fix-the-captain', 'accuracy-micro', 'synonym-showdown',
  'tone-transformer', 'story-sprint', 'two-truths-and-a-lie', 'bluff-definition', 'interview-lab', 'compare-it',
]);

export function hiddenForJunior(key: string, junior: boolean): boolean {
  return junior && JUNIOR_HIDDEN_KEYS.has(key);
}
