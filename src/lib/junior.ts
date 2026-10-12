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

/**
 * Junior classes also change WHAT the AI writes, not only how phones look. Every request the lesson screen makes
 * for a Junior class carries this header, and the AI layer adds JUNIOR_LANGUAGE_RULE to whatever it is asked to
 * write (see lib/ai). One place, so no activity can forget it.
 */
export const JUNIOR_HEADER = 'x-lc-junior';

/**
 * The class's level setting still decides how hard the English is (there are advanced Junior classes); this rule
 * decides what the content is ABOUT and how it is put, so a strong class of seven-year-olds gets harder language
 * about a child's world, not teenage or adult subject matter.
 */
export const JUNIOR_LANGUAGE_RULE = `

JUNIOR CLASS (children of about 5 to 9). This rule comes on top of the language level above; it does not replace it.
- Write about a child's world: home, family, school, friends, animals, food, toys, play, weather, things they can see, touch or do.
- Concrete, not abstract. Ask what a child knows from their own life, never facts they would have to have studied ("Which food never spoils?" is wrong; "Which food is sweet?" is right).
- No adult or teenage subject matter: money, jobs, politics, news, dating, death, crime, exams.
- Short, clear sentences and common words for the level. Kind, playful, encouraging. Nothing scary or sad.
- Anything read aloud must sound natural when spoken slowly to a small child.`;
