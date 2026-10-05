/** Quick-fire fallback questions from the topic, so the warm-up never blocks on AI. */
export function fallbackQuickFire(topic: string): string[] {
  const t = topic.trim() || 'your week';
  return [`What's the first word you think of for ${t}?`, `What's one thing you like about ${t}, and why?`, `If you could change one thing about ${t}, what would it be?`];
}
