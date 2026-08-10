import { DIFFICULTIES } from '@/lib/difficulty';
import type { Difficulty } from '@/lib/difficulty';

export interface StandbyTip {
  category: string;
  color: string;
  text: string;
}

interface StaticStandbyTip extends StandbyTip {
  /** Minimum difficulty at which this tip may be shown. */
  minLevel: string;
}

// ---------------------------------------------------------------------------
// English Spotlight tips — shown while waiting for an activity to start.
// Kept out of the student controller so the selection rules stay unit-testable.
// ---------------------------------------------------------------------------
export const WAITING_TIPS: StaticStandbyTip[] = [
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Beginner', text: "Use 'a' before consonant sounds and 'an' before vowel sounds — it's about the sound, not the letter. 'An hour' is correct because 'hour' starts with a vowel sound." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Beginner', text: "English borrows words from over 350 languages. 'Café' comes from French, 'yoga' from Sanskrit, 'robot' from Czech, and 'ketchup' from Malay." },
  { category: 'Idiom', color: 'amber', minLevel: 'Easy', text: "'Break a leg' means 'good luck'. It comes from theatre tradition — wishing someone bad luck was thought to bring good luck instead." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Easy', text: "Three useful prefixes: 'un-' means not (unhappy), 're-' means again (rewrite), 'pre-' means before (preview). Spot them and you can guess thousands of new words." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Easy', text: "'I' vs 'me': remove the other person to test it. 'She gave it to I' sounds wrong — so say 'She gave it to me'. 'I' is for subjects; 'me' is for objects." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Intermediate', text: "The word 'nice' originally meant 'foolish' or 'ignorant' in the 14th century. Word meanings shift dramatically over hundreds of years — this is called semantic change." },
  { category: 'Idiom', color: 'amber', minLevel: 'Easy', text: "'Hit the nail on the head' means to be exactly right. 'Cost an arm and a leg' means something is very expensive. Idioms say one thing but mean another." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Intermediate', text: "The suffix '-tion' turns verbs into nouns: communicate → communication, educate → education, inform → information. It's one of the most common noun endings in English." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Easy', text: "Commas join two sentences when paired with 'and', 'but', or 'so'. Without a conjunction, use a semicolon or a full stop instead of a comma alone." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Beginner', text: "Shakespeare invented over 1,700 words still used today — including 'bedroom', 'lonely', 'generous', and 'obscene'. He simply made them up when he needed them." },
  { category: 'Idiom', color: 'amber', minLevel: 'Easy', text: "'Under the weather' means feeling unwell. 'Once in a blue moon' means very rarely. Learning idioms helps you sound natural in everyday English." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Intermediate', text: "Adjectives describe nouns; adverbs modify verbs, adjectives, or other adverbs. Many adverbs end in '-ly': quickly, carefully, honestly — but not always (fast, hard, well)." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Beginner', text: "'There', 'their', and 'they're' sound identical but mean different things. There = place, Their = belonging to them, They're = they are. Context is the key." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Beginner', text: "The longest word in a standard English dictionary is 'pneumonoultramicroscopicsilicovolcanoconiosis' — a lung disease. The most commonly used word is 'the'." },
  { category: 'Idiom', color: 'amber', minLevel: 'Intermediate', text: "'Spill the beans' means to accidentally reveal a secret. 'Let the cat out of the bag' means the same thing — idioms often have quirky origin stories." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Intermediate', text: "Synonyms add variety to your writing. Instead of always using 'said', try: whispered, announced, argued, replied, admitted. Word choice shapes the reader's feeling." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Intermediate', text: "Active voice is usually clearer than passive. 'The dog bit the man' (active) is more direct than 'The man was bitten by the dog' (passive)." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Intermediate', text: "English has around 170,000 words in current use, with another 47,000 obsolete words. A well-educated adult uses about 20,000–35,000 words in daily life." },
  { category: 'Idiom', color: 'amber', minLevel: 'Intermediate', text: "'Bite the bullet' means to endure a painful situation with courage. 'Bite off more than you can chew' means to take on more than you can handle." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Easy', text: "Collocations are words that naturally go together. We say 'make a mistake' (not 'do a mistake'), 'do homework' (not 'make homework'). Learning them sounds more natural." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Beginner', text: "Questions with 'who', 'what', 'where', 'when', 'why', and 'how' need full answers. Yes/no questions only need 'yes' or 'no' — but a full answer is always better." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Easy', text: "'Goodbye' is a contraction of 'God be with ye', shortened over centuries. 'Hello' only became a standard greeting after the telephone was invented in the 1870s." },
  { category: 'Idiom', color: 'amber', minLevel: 'Intermediate', text: "'The ball is in your court' means it's your turn to take action. 'Get the ball rolling' means to start something. Many English idioms come from sport." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Easy', text: "Antonyms are opposites: hot/cold, love/hate, succeed/fail. Using contrast in writing creates emphasis and helps readers feel the difference between two ideas." },
  { category: 'Grammar Tip', color: 'blue', minLevel: 'Intermediate', text: "First conditional: 'If it rains, I will stay inside.' Second conditional: 'If I were rich, I would travel.' The tense shift signals whether something is real or hypothetical." },
  { category: 'Did you know?', color: 'purple', minLevel: 'Beginner', text: "The sentence 'The quick brown fox jumps over the lazy dog' contains every letter of the alphabet. This kind of sentence is called a pangram." },
  { category: 'Idiom', color: 'amber', minLevel: 'Advanced', text: "'Burn the midnight oil' means to work late into the night. It comes from the days when people used oil lamps — and staying up late literally meant burning oil." },
  { category: 'Vocab Boost', color: 'teal', minLevel: 'Intermediate', text: "Abstract nouns name ideas or feelings you can't touch: freedom, justice, happiness, courage. Concrete nouns name physical things: table, rain, book, city." },
];

/**
 * Difficulty rank used for tip gating. An unrecognised or not-yet-loaded difficulty
 * clamps to the most restrictive level (0) rather than -1, which would otherwise
 * filter out every static tip.
 */
export function standbyDifficultyRank(difficulty: string | null | undefined): number {
  const rank = DIFFICULTIES.indexOf((difficulty ?? '') as Difficulty);
  return rank === -1 ? 0 : rank;
}

/** Static tips permitted at this difficulty — never shows tips above the class level. */
export function filterStandbyTipsForDifficulty(difficulty: string | null | undefined): StandbyTip[] {
  const rank = standbyDifficultyRank(difficulty);
  return WAITING_TIPS.filter((t) => DIFFICULTIES.indexOf(t.minLevel as Difficulty) <= rank).map(
    ({ category, color, text }) => ({ category, color, text }),
  );
}

/**
 * Full standby pool. Topic-aware tips come first — they are generated for this lesson's
 * topic AND level, so they take precedence over the generic static pool.
 */
export function buildStandbyTipPool(
  topicTips: StandbyTip[],
  difficulty: string | null | undefined,
): StandbyTip[] {
  return [...topicTips, ...filterStandbyTipsForDifficulty(difficulty)];
}
