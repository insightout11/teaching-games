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
