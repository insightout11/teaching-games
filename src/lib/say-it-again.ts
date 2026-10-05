/** Say it again, better (4-3-2): the three shrinking turn lengths, in seconds. */
export const SAY_AGAIN_SECONDS = [40, 30, 20];

/** Fallback question from the topic, so the stage never blocks on AI. */
export function fallbackSayItAgain(topic: string): string {
  const t = topic.trim() || 'your weekend';
  return `Tell us about ${t} in your life: what, why, and one example.`;
}
