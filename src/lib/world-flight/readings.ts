import type { Difficulty } from '@/lib/difficulty';
import type { SourceBriefingOption, SourceMaterial } from '@/types/source-material';

export interface WorldFlightReadingLevels {
  easy: string;
  standard: string;
  advanced: string;
}

export const WORLD_FLIGHT_READING_LEVELS: Array<{
  id: string;
  label: string;
  description: string;
  difficulties: Difficulty[];
  key: keyof WorldFlightReadingLevels;
}> = [
  {
    id: 'world-flight-easy',
    label: 'Clear language',
    description: 'Shorter sentences and common vocabulary for A1-A2 readers.',
    difficulties: ['Beginner', 'Easy'],
    key: 'easy',
  },
  {
    id: 'world-flight-standard',
    label: 'Standard article',
    description: 'Natural classroom language for B1-B2 readers.',
    difficulties: ['Intermediate'],
    key: 'standard',
  },
  {
    id: 'world-flight-advanced',
    label: 'Extended article',
    description: 'More detail and nuanced language for C1-C2 readers.',
    difficulties: ['Advanced', 'Expert'],
    key: 'advanced',
  },
];

const INSTRUCTIONAL_COPY =
  /\bfor students?\b|\b(students?|the class|learners?|teachers?)\s+(can|could|should|will|must|need to|are asked to|is asked to|learn|practice|compare|design|write|map|debate|discuss|see)\b|\bhelps? (students?|the class|learners?)\b|\bdiscuss (with|in|as) (a|the|your) class\b|\bwrite a\b|\bdesign a\b|\brole-play\b/i;

export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function countParagraphs(text: string): number {
  return text.split(/\n\s*\n/).filter((paragraph) => paragraph.trim().length > 0).length;
}

export function buildWorldFlightBriefingOptions(levels: WorldFlightReadingLevels): SourceBriefingOption[] {
  return WORLD_FLIGHT_READING_LEVELS.map((level) => ({
    id: level.id,
    label: level.label,
    description: level.description,
    text: levels[level.key],
    mode: level.key === 'advanced' ? 'exact' : 'adapted',
    wordCount: countWords(levels[level.key]),
    difficultyLevels: level.difficulties,
  }));
}

export function resolveSourceMaterialForDifficulty(
  sourceMaterial: SourceMaterial | null,
  difficulty: Difficulty,
): SourceMaterial | null {
  if (!sourceMaterial?.briefingOptions?.length) return sourceMaterial;

  const option = sourceMaterial.briefingOptions.find((candidate) =>
    candidate.difficultyLevels?.includes(difficulty),
  );
  if (!option) return sourceMaterial;

  return {
    ...sourceMaterial,
    briefingText: option.text,
    briefingMode: option.mode,
    wordCount: option.wordCount ?? countWords(option.text),
  };
}

export interface WorldFlightReadingQuality {
  publishable: boolean;
  issues: string[];
}

export function assessWorldFlightReadingQuality(sourceMaterial: SourceMaterial): WorldFlightReadingQuality {
  const canonicalText =
    sourceMaterial.sourceText ?? sourceMaterial.originalText ?? sourceMaterial.briefingText ?? sourceMaterial.rawText ?? '';
  const issues: string[] = [];

  if (countWords(canonicalText) < 300) issues.push('canonical article is under 300 words');
  if (countParagraphs(canonicalText) < 4) issues.push('canonical article has fewer than 4 paragraphs');
  if (INSTRUCTIONAL_COPY.test(canonicalText)) issues.push('canonical article contains classroom instructions');

  const options = sourceMaterial.briefingOptions ?? [];
  const minimumLevelWords: Record<keyof WorldFlightReadingLevels, number> = {
    easy: 150,
    standard: 225,
    advanced: 300,
  };
  for (const level of WORLD_FLIGHT_READING_LEVELS) {
    const option = options.find((candidate) => candidate.id === level.id);
    if (!option) {
      issues.push(`missing ${level.label.toLowerCase()} version`);
      continue;
    }
    if (countWords(option.text) < minimumLevelWords[level.key]) {
      issues.push(`${level.label.toLowerCase()} version is too short`);
    }
    if (INSTRUCTIONAL_COPY.test(option.text)) {
      issues.push(`${level.label.toLowerCase()} version contains classroom instructions`);
    }
  }

  return { publishable: issues.length === 0, issues };
}
