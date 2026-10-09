import type { GoalTag } from '@/lib/flight-plan-config';
import type { SourceType } from '@/types/source-material';

/**
 * Course lesson types (Oct 2026 builder upgrade): the teacher picks the flight a lesson flies instead of an abstract
 * goal. Reading needs a text to read, Listening needs a clip with a listening pack.
 */
export type LessonTypeId = 'speak' | 'debate' | 'grammar' | 'reading' | 'listening' | 'mix';

export interface LessonType {
  id: LessonTypeId;
  label: string;
  flightPresetId: string;
  /** The goal stored on the lesson payload (kept for older code paths and planner composition). */
  goal: GoalTag;
  needs?: 'text' | 'listening';
  /** Too much arguing or rule talk for Junior (about 5-9) classes. */
  juniorHidden?: boolean;
}

export const LESSON_TYPES: LessonType[] = [
  { id: 'speak', label: 'Speak', flightPresetId: 'speak-60', goal: 'speaking-fluency' },
  { id: 'reading', label: 'Reading', flightPresetId: 'reading-60', goal: 'vocabulary-building', needs: 'text' },
  { id: 'listening', label: 'Listening', flightPresetId: 'listening-60', goal: 'vocabulary-building', needs: 'listening' },
  { id: 'debate', label: 'Debate', flightPresetId: 'debate-60', goal: 'discussion-debate', juniorHidden: true },
  { id: 'grammar', label: 'Grammar', flightPresetId: 'grammar-60', goal: 'grammar-reinforcement', juniorHidden: true },
  { id: 'mix', label: 'Mix', flightPresetId: 'all-around-flight-60', goal: 'vocabulary-building' },
];

const TEXT_TYPES = new Set<string>(['books', 'stories', 'picture-books', 'storyweaver', 'text', 'pdf', 'voa', 'discussion']);

/** `listening` is set by the server when the library entry carries a listening pack (keeps the libraries off the client). */
type LessonSource = { kind: 'video' | 'reading'; sourceType: SourceType; id: string; listening?: boolean } | null | undefined;

export function lessonTypeById(id: string | undefined): LessonType | undefined {
  return LESSON_TYPES.find((t) => t.id === id);
}

/** The lesson type a stored lesson flies (its named flight, else its goal). */
export function lessonTypeOf(lesson: { flightPresetId?: string; goal: GoalTag }): LessonType {
  return (
    LESSON_TYPES.find((t) => t.flightPresetId === lesson.flightPresetId) ??
    (lesson.goal === 'speaking-fluency' || lesson.goal === 'functional-english' ? LESSON_TYPES[0]
      : lesson.goal === 'discussion-debate' ? LESSON_TYPES[3]
        : lesson.goal === 'grammar-reinforcement' ? LESSON_TYPES[4]
          : LESSON_TYPES[5])
  );
}

/** Why a lesson type can't be used with this lesson's material, or null when it can. */
export function lessonTypeBlocker(type: LessonType, source: LessonSource, hasOwnText = false): string | null {
  if (type.needs === 'text') {
    if (hasOwnText) return null;
    return source && (source.kind === 'reading' || TEXT_TYPES.has(source.sourceType)) ? null : 'Needs a book or text';
  }
  if (type.needs === 'listening') {
    return source && (source.sourceType === 'listening' || source.listening) ? null : 'Needs a listening clip';
  }
  return null;
}
