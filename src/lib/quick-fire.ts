/** One turn per student aboard, whether or not they have joined on a device. */
export function getQuickFireRoster<T extends { id: string }>(students: readonly T[], deviceless: readonly T[]): T[] {
  const roster = new Map<string, T>();
  for (const student of [...students, ...deviceless]) {
    if (!roster.has(student.id)) roster.set(student.id, student);
  }
  return Array.from(roster.values());
}

/** Quick-fire fallback questions from the topic, so the warm-up never blocks on AI. */
export function fallbackQuickFire(topic: string): string[] {
  const t = topic.trim() || 'your week';
  return [`What's the first word you think of for ${t}?`, `What's one thing you like about ${t}, and why?`, `If you could change one thing about ${t}, what would it be?`];
}

/**
 * Fun questions for Quick-fire's "Mix it up" (pilot 001, Oct 2026: a mode with random questions). Short, easy to
 * answer at any level, safe for kids and teens. Mixed with the topic's own questions, one per student.
 */
export const QUICK_FIRE_FUN: readonly string[] = [
  "What's your favourite food, and why?",
  'If you could fly anywhere tomorrow, where would you go?',
  'What animal would you like to be for one day?',
  'What is the best thing you did last weekend?',
  "What's a sound you love?",
  'If you had a superpower, what would it be?',
  'What would you take to a desert island?',
  "What's your favourite season, and why?",
  'Would you rather live by the sea or in the mountains?',
  'What is something you are good at?',
  'What job would you like to try for a day?',
  'What is the best present you ever got?',
  "What's your favourite place in your town?",
  'If you could meet anyone, who would it be?',
  'What makes you laugh?',
  'What would your perfect day look like?',
  'Which country would you like to visit, and why?',
  "What's a food you don't like?",
  'What do you do to relax?',
  'If you could invent something, what would it be?',
  'What is your favourite thing to do with friends?',
  'Would you rather go to space or to the bottom of the sea?',
  'What song do you listen to a lot right now?',
  "What's something new you learned this week?",
  'If you had a pet dragon, what would you call it?',
];

/** One question per turn for "Mix it up": the topic questions first, then fun ones, shuffled; repeats only if needed. */
export function mixedQuickFire(topicQuestions: readonly string[], turns: number, rand: () => number = Math.random): string[] {
  const shuffle = <T,>(a: readonly T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const pool = [...shuffle(topicQuestions), ...shuffle(QUICK_FIRE_FUN.filter((x) => !topicQuestions.includes(x)))];
  const mixed = shuffle(pool.slice(0, Math.max(turns, 1)));
  return Array.from({ length: Math.max(turns, 1) }, (_, i) => mixed[i % mixed.length]);
}
