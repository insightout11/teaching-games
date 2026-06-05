// Teacher onboarding profile (home §5). Shared by the onboarding flow, the save API,
// and the "Recommended for you" rail so the option sets stay in one place.

import type { Difficulty } from '@/lib/difficulty';

export type ClassSize = 'one-on-one' | 'small-group' | 'classroom' | 'mixed';
export type TeachingLevel = 'beginner' | 'intermediate' | 'advanced' | 'mixed';
export type TeachingFocus = 'speaking' | 'grammar' | 'vocabulary' | 'exam' | 'business' | 'kids';
export type AgeGroup = 'kids' | 'teens' | 'adults';
export type TeachingMode = 'online' | 'in-person';

export interface TeacherProfile {
  classSize: ClassSize | null;
  level: TeachingLevel | null;
  focus: TeachingFocus | null;
  age: AgeGroup | null;
  mode: TeachingMode | null;
}

export const EMPTY_PROFILE: TeacherProfile = {
  classSize: null, level: null, focus: null, age: null, mode: null,
};

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export interface OnboardingStep {
  key: keyof TeacherProfile;
  question: string;
  options: Option<string>[];
}

// The 5-tap flow. Order matters — focus & class size drive the most ranking.
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    key: 'classSize',
    question: 'Who do you teach?',
    options: [
      { value: 'one-on-one', label: '1-on-1', hint: 'Private lessons' },
      { value: 'small-group', label: 'Small group', hint: '2–6 students' },
      { value: 'classroom', label: 'Classroom', hint: '7+ students' },
      { value: 'mixed', label: 'A mix', hint: 'It varies' },
    ],
  },
  {
    key: 'focus',
    question: "What's your main focus?",
    options: [
      { value: 'speaking', label: 'Speaking & fluency' },
      { value: 'grammar', label: 'Grammar & accuracy' },
      { value: 'vocabulary', label: 'Vocabulary' },
      { value: 'exam', label: 'Exam prep' },
      { value: 'business', label: 'Business English' },
      { value: 'kids', label: 'Young learners' },
    ],
  },
  {
    key: 'level',
    question: 'What level are your students?',
    options: [
      { value: 'beginner', label: 'Beginner', hint: 'A1–A2' },
      { value: 'intermediate', label: 'Intermediate', hint: 'B1–B2' },
      { value: 'advanced', label: 'Advanced', hint: 'C1–C2' },
      { value: 'mixed', label: 'Mixed levels' },
    ],
  },
  {
    key: 'age',
    question: 'What age group?',
    options: [
      { value: 'kids', label: 'Kids' },
      { value: 'teens', label: 'Teens' },
      { value: 'adults', label: 'Adults' },
    ],
  },
  {
    key: 'mode',
    question: 'Where do you teach?',
    options: [
      { value: 'online', label: 'Online' },
      { value: 'in-person', label: 'In person' },
    ],
  },
];

/** Map an onboarding level to the app's Difficulty default. */
export function levelToDifficulty(level: TeachingLevel | null): Difficulty | null {
  switch (level) {
    case 'beginner': return 'Beginner';
    case 'intermediate': return 'Intermediate';
    case 'advanced': return 'Advanced';
    default: return null;
  }
}

const FOCUS_LABEL: Record<TeachingFocus, string> = {
  speaking: 'speaking', grammar: 'grammar', vocabulary: 'vocabulary',
  exam: 'exam prep', business: 'business English', kids: 'young learners',
};
const CLASS_SIZE_LABEL: Record<ClassSize, string> = {
  'one-on-one': '1-on-1', 'small-group': 'small groups', classroom: 'your classroom', mixed: 'your classes',
};

/** Short, honest reason string for a recommendation, e.g. "Because you teach 1-on-1 beginners". */
export function buildRecommendationReason(profile: TeacherProfile): string {
  const bits: string[] = [];
  if (profile.classSize) bits.push(CLASS_SIZE_LABEL[profile.classSize]);
  if (profile.level && profile.level !== 'mixed') bits.push(`${profile.level} learners`);
  if (bits.length > 0) return `Because you teach ${bits.join(' ')}`;
  if (profile.focus) return `For ${FOCUS_LABEL[profile.focus]} lessons`;
  return 'Great starting point';
}

export function isProfileComplete(p: TeacherProfile): boolean {
  return !!(p.classSize && p.focus && p.level && p.age && p.mode);
}
