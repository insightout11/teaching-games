import bank from '@/data/junior-picture-questions.json';
import { topicKey } from '@/lib/topic-briefings';

/** Junior picture questions (Codex round 21): options and answers are sticker ids (public/stickers/<id>.webp). */
export interface JuniorQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: string | null;
  say: string;
}
export interface JuniorSet {
  id: string;
  topic: string;
  topicIds?: string[];
  questions: JuniorQuestion[];
}

export const JUNIOR_SETS = bank as unknown as JuniorSet[];

export { stickerLabel } from '@/lib/stickers';

/** The set that fits the lesson topic (title or briefing topic id), else null so the teacher picks. */
export function pickJuniorSet(topic: string | undefined, sets: JuniorSet[] = JUNIOR_SETS): JuniorSet | null {
  if (!topic || topic === 'General') return null;
  const key = topicKey(topic);
  return (
    sets.find((s) => topicKey(s.topic) === key) ??
    sets.find((s) => (s.topicIds ?? []).some((t) => topicKey(t.replace(/-/g, ' ')) === key)) ??
    sets.find((s) => topicKey(s.topic).includes(key) || key.includes(topicKey(s.topic))) ??
    null
  );
}
