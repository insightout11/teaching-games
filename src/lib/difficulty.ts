export type Difficulty = 'Beginner' | 'Easy' | 'Intermediate' | 'Advanced' | 'Expert';
export const DIFFICULTIES: Difficulty[] = ['Beginner', 'Easy', 'Intermediate', 'Advanced', 'Expert'];

/**
 * ONE way to name a level everywhere in the app: the plain word plus its international letter, "Easy · A2".
 * The letters are the CEFR scale (A1 to C2), the standard used by schools, coursebooks and exams worldwide.
 * These pairings match what the AI is told to write for each level (see difficultyDescriptions below).
 */
export const LEVEL_INFO: Record<Difficulty, { cefr: string; means: string }> = {
  Beginner: { cefr: 'A1', means: 'First words and very short sentences: names, colours, food, family.' },
  Easy: { cefr: 'A2', means: 'Simple everyday English: daily life, likes and dislikes, short stories.' },
  Intermediate: { cefr: 'B1', means: 'Can say what happened and give an opinion on familiar topics, with some mistakes.' },
  Advanced: { cefr: 'B2', means: 'Speaks with ease on most topics: can argue a point and follow longer talk.' },
  Expert: { cefr: 'C1', means: 'Fluent and precise: handles complex ideas, idiom and subtle differences.' },
};

/** "Easy · A2": the level's name as shown to teachers. */
export function levelLabel(difficulty: Difficulty | string | null | undefined): string {
  const info = difficulty ? LEVEL_INFO[difficulty as Difficulty] : undefined;
  return info ? `${difficulty} · ${info.cefr}` : (difficulty ?? '');
}

/** The same naming for content that is tagged with a letter only (library videos, texts): "Easy · A2". */
export function cefrLabel(cefr: string | null | undefined): string {
  if (!cefr) return '';
  const letter = cefr.trim().toUpperCase();
  const word = letter === 'A1' ? 'Beginner' : letter === 'A2' ? 'Easy' : letter === 'B1' ? 'Intermediate' : letter === 'B2' ? 'Advanced' : letter === 'C1' || letter === 'C2' ? 'Expert' : null;
  return word ? `${word} · ${letter}` : cefr;
}

/** One line per level, for a "What do the levels mean?" explanation. */
export const LEVELS_EXPLAINED: string = DIFFICULTIES.map((d) => `${d} (${LEVEL_INFO[d].cefr}): ${LEVEL_INFO[d].means}`).join('\n');

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
  'Intermediate': 'B1 level. Use natural everyday vocabulary on familiar topics. Sentences of moderate length (up to about 16 words), mostly simple or joined with common linking words (because, although, so, when). A few very common idioms are fine. Avoid rare, literary or academic words.',
  'Advanced': 'B2 level. Use a wider range of vocabulary, including some less common and topic-specific words where the context makes them clear. Longer sentences with subordinate clauses are fine; common idioms and phrasal verbs are welcome. Avoid literary, archaic or heavily academic language.',
  'Expert': 'C1 level. Use varied, precise, expressive vocabulary. Complex sentence structures, idiom and figurative language are welcome. Keep it clear enough for a strong teenage learner: no obscure words for their own sake.',
};
