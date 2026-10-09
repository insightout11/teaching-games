import bank from '@/data/junior-picture-stories.json';
import { topicKey } from '@/lib/topic-briefings';

/** Junior picture stories (Codex round 23): pictures, options, answers and words are sticker ids. */
export interface StoryPage {
  text: string;
  pictures: string[];
}
export interface StoryQuestion {
  prompt: string;
  options: string[];
  answer: string | null;
}
export interface PictureStory {
  id: string;
  title: string;
  level: 'A1' | 'A2';
  topicIds?: string[];
  cast?: string[];
  pages: StoryPage[];
  questions: StoryQuestion[];
  words: string[];
}

export const PICTURE_STORIES = bank as unknown as PictureStory[];

/** The story that fits the lesson topic (title or briefing topic id), else null so the teacher picks. */
export function pickStory(topic: string | undefined, stories: PictureStory[] = PICTURE_STORIES): PictureStory | null {
  if (!topic || topic === 'General') return null;
  const key = topicKey(topic);
  return (
    stories.find((s) => (s.topicIds ?? []).some((t) => topicKey(t.replace(/^topic-(kids|teens)-/, '').replace(/-/g, ' ')) === key)) ??
    stories.find((s) => topicKey(s.title).includes(key)) ??
    null
  );
}
