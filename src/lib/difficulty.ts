export type Difficulty = 'Beginner' | 'Easy' | 'Intermediate' | 'Advanced' | 'Expert';
export const DIFFICULTIES: Difficulty[] = ['Beginner', 'Easy', 'Intermediate', 'Advanced', 'Expert'];

/**
 * Strong, prominent language-level preamble for AI generation prompts. Prefer this over a buried
 * "Difficulty: ..." line: source-grounded generators otherwise mirror an academic source's register
 * and overshoot the learner's level. Place it at (or near) the top of the prompt.
 */
export function languageRule(difficulty: Difficulty): string {
  return `LANGUAGE RULE (follow strictly, even if any source below is more advanced): ${difficultyDescriptions[difficulty]}`;
}

export const difficultyDescriptions: Record<Difficulty, string> = {
  'Beginner': "A1 level. ONLY use the most common 500 English words. Write short Subject+Verb+Object sentences (max 8 words). No idioms, no metaphors, no literary or dramatic words. Example good sentence: \"It starts to rain. They need to find a place to go.\" Example bad sentence: \"A guttural growl echoes in the encroaching darkness.\"",
  'Easy': 'A2 level. Use simple everyday vocabulary. Sentences should be short and clear (max 12 words). Avoid idioms, figurative language, or complex descriptive words.',
  'Intermediate': 'B1/B2 level. Use natural everyday vocabulary. Moderate sentence length. Some descriptive language is fine. A few common idioms are okay.',
  'Advanced': 'C1 level. Use varied, expressive vocabulary. Complex sentence structures and figurative language welcome.',
  'Expert': 'C2/Native level. Use nuanced, sophisticated language. Academic vocabulary, subtle distinctions, and literary style encouraged.',
};
