import lessonTexts from '@/data/course-lesson-texts.json';

/**
 * Short original texts written for the ready-course lessons that have no library material (Codex round 30), so
 * every lesson of a ready course has something concrete to read, hear and talk about.
 *
 * The bank is ~120 KB: import this module with `await import(...)` from client code, never statically.
 */
export interface CourseLessonText {
  courseId: string;
  lessonIndex: number;
  title: string;
  level: string;
  text: string;
  words: Array<{ word: string; meaning: string }>;
  questions: Array<{ q: string; a: string }>;
  talk: string[];
}

const TEXTS = lessonTexts as unknown as CourseLessonText[];

/** The texts for one ready course, keyed by lesson index. `presetId` may carry the `ready-` prefix. */
export function courseLessonTexts(presetId: string): Map<number, CourseLessonText> {
  const courseId = presetId.replace(/^ready-/, '');
  return new Map(TEXTS.filter((t) => t.courseId === courseId).map((t) => [t.lessonIndex, t]));
}
