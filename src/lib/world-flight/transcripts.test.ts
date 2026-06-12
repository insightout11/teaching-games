import { describe, expect, it } from 'vitest';
import { assessWorldFlightTranscript } from '@/lib/world-flight/transcripts';

describe('World Flight transcript quality', () => {
  it('accepts a substantial English transcript', () => {
    const sentence = 'A local guide explains how a market connects food, history, work, and daily city life.';
    const assessment = assessWorldFlightTranscript([{ text: Array(10).fill(sentence).join(' '), lang: 'en' }]);

    expect(assessment.publishable).toBe(true);
    expect(assessment.issues).toEqual([]);
  });

  it('rejects music-only and fragmentary captions', () => {
    const assessment = assessWorldFlightTranscript([
      { text: '[Music] [Applause] good [Music] so do [Music] you', lang: 'en' },
    ]);

    expect(assessment.publishable).toBe(false);
    expect(assessment.issues).toContain('TRANSCRIPT_TOO_THIN:4_meaningful_words');
  });

  it('rejects a transcript that is labeled English but predominantly uses another script', () => {
    const russianSentence = 'Этот текст рассказывает о городе, его культуре, истории и повседневной жизни.';
    const assessment = assessWorldFlightTranscript([
      { text: Array(15).fill(russianSentence).join(' '), lang: 'en' },
    ]);

    expect(assessment.publishable).toBe(false);
    expect(assessment.issues.some((issue) => issue.startsWith('TRANSCRIPT_PREDOMINANTLY_NON_LATIN'))).toBe(true);
  });

  it('rejects a transcript whose declared caption language is not English', () => {
    const sentence = 'This sentence is long enough to pass the word-count requirement when repeated many times.';
    const assessment = assessWorldFlightTranscript([{ text: Array(15).fill(sentence).join(' '), lang: 'es' }]);

    expect(assessment.publishable).toBe(false);
    expect(assessment.issues).toContain('LANGUAGE_NOT_ENGLISH:es');
  });
});
