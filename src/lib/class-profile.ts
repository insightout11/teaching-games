/**
 * How a class usually runs (Phase 2 of the design plan). Chosen once per class; the room opens set up for it.
 * The type decides what is in front of the teacher; it never removes anything.
 * Stored in classes.class_profile (jsonb, migration 067). A class with no profile works exactly as before.
 */

export type ClassType = 'structured' | 'game-time' | 'conversation' | 'free-talk';
export type AgeGroup = 'kids' | 'teens' | 'adults';
export type SecondScreens = 'all' | 'some' | 'none';
export type TeachPlace = 'online' | 'classroom';

export interface ClassProfile {
  type?: ClassType;
  age?: AgeGroup;
  screens?: SecondScreens;
  place?: TeachPlace;
  /** Usual lesson length in minutes (Game time: the game minutes). */
  minutes?: number;
  /** Game time only: students vote on the game (off by default). */
  gameVote?: boolean;
}

export interface ClassTypeInfo {
  key: ClassType;
  name: string;
  line: string;
  example: string;
}

export const CLASS_TYPES: ClassTypeInfo[] = [
  { key: 'structured', name: 'Structured class', line: 'Each lesson follows a plan with clear aims.', example: 'e.g. a coursebook group' },
  { key: 'game-time', name: 'Game time', line: 'You teach the lesson your way; LessonCaptain runs the last 15–20 minutes.', example: 'e.g. textbook first, then a quiz' },
  { key: 'conversation', name: 'Conversation + games', line: 'Talking is the goal; games and activities keep it going.', example: 'e.g. teens who like to chat' },
  { key: 'free-talk', name: 'Free talk', line: 'Open conversation; LessonCaptain brings ideas, pictures and questions.', example: 'e.g. advanced teens' },
];

export const classTypeName = (t: ClassType | undefined) => CLASS_TYPES.find((c) => c.key === t)?.name ?? null;

const pick = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined => (allowed.includes(v as T) ? (v as T) : undefined);

/** A safe profile from whatever is stored (null, old shapes, junk). */
export function readClassProfile(raw: unknown): ClassProfile {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const minutes = typeof r.minutes === 'number' && r.minutes >= 10 && r.minutes <= 240 ? Math.round(r.minutes) : undefined;
  return {
    type: pick(r.type, ['structured', 'game-time', 'conversation', 'free-talk'] as const),
    age: pick(r.age, ['kids', 'teens', 'adults'] as const),
    screens: pick(r.screens, ['all', 'some', 'none'] as const),
    place: pick(r.place, ['online', 'classroom'] as const),
    minutes,
    gameVote: r.gameVote === true ? true : undefined,
  };
}

/** The existing devices column, kept in step: no second screens means one shared screen. */
export const deviceModeFor = (screens: SecondScreens): 'devices' | 'shared-screen' => (screens === 'none' ? 'shared-screen' : 'devices');

/** Usual length when the teacher has not chosen one: Game time uses the game minutes. */
export const defaultMinutes = (type: ClassType | undefined) => (type === 'game-time' ? 20 : 60);
