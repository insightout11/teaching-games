/**
 * How deep the class goes into a topic. Always the teacher's choice (default: Big idea).
 * - big: broad questions anyone can answer, even students who don't know the subject.
 * - deep: the subject itself (a singer's albums and songs, a film's characters and scenes), for classes that know it.
 */
export type TopicDepth = 'big' | 'deep';

/** A line for AI prompts; empty for Big idea (the default behaviour). */
export function depthPromptNote(depth: TopicDepth | undefined): string {
  if (depth !== 'deep') return '';
  return 'DEPTH: DEEP DIVE. The class knows this subject well and wants to go into it. Ask about the subject itself, naming its specific works, people, events and details (for a singer: their albums and songs; for a film or book: its characters and scenes; for a famous person: what they did), not general life questions. This overrides any example questions below. Never give away the ending of a film or book.\n';
}
