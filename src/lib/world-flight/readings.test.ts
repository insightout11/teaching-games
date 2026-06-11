import { describe, expect, it } from 'vitest';
import type { SourceMaterial } from '@/types/source-material';
import {
  assessWorldFlightReadingQuality,
  buildWorldFlightBriefingOptions,
  resolveSourceMaterialForDifficulty,
} from './readings';

const article = Array.from(
  { length: 4 },
  (_, index) => `Paragraph ${index + 1}. ${'A factual sentence about the city and its public life. '.repeat(18)}`,
).join('\n\n');

const source: SourceMaterial = {
  sourceType: 'text',
  title: 'City article',
  summary: 'A city article.',
  sourceText: article,
  originalText: article,
  briefingOptions: buildWorldFlightBriefingOptions({
    easy: article,
    standard: article,
    advanced: article,
  }),
};

describe('World Flight readings', () => {
  it('selects a controlled reading version for the chosen difficulty', () => {
    const easy = resolveSourceMaterialForDifficulty(source, 'Beginner');
    const advanced = resolveSourceMaterialForDifficulty(source, 'Expert');

    expect(easy?.briefingText).toBe(source.briefingOptions?.[0].text);
    expect(advanced?.briefingText).toBe(source.briefingOptions?.[2].text);
  });

  it('rejects short instructional blurbs as publishable readings', () => {
    const badSource: SourceMaterial = {
      sourceType: 'text',
      title: 'Bad',
      summary: 'Bad',
      sourceText: 'A short fact.\n\nStudents can design a route.',
    };

    const quality = assessWorldFlightReadingQuality(badSource);
    expect(quality.publishable).toBe(false);
    expect(quality.issues).toContain('canonical article is under 300 words');
    expect(quality.issues).toContain('canonical article contains classroom instructions');
  });

  it('rejects classroom narration even when it is phrased as a city insight', () => {
    const badSource: SourceMaterial = {
      ...source,
      sourceText: `${article}\n\nAmsterdam helps students see water management as daily protection.`,
      originalText: `${article}\n\nAmsterdam helps students see water management as daily protection.`,
    };

    expect(assessWorldFlightReadingQuality(badSource).issues).toContain(
      'canonical article contains classroom instructions',
    );
  });

  it('accepts a substantial canonical article with all reading bands', () => {
    expect(assessWorldFlightReadingQuality(source)).toEqual({ publishable: true, issues: [] });
  });
});
