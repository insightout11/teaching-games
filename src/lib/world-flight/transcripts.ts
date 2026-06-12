export const WORLD_FLIGHT_MIN_MEANINGFUL_TRANSCRIPT_WORDS = 120;
export const WORLD_FLIGHT_MAX_NON_LATIN_LETTER_RATIO = 0.15;

type TranscriptSegment = {
  text?: string;
  lang?: string;
};

export type WorldFlightTranscriptAssessment = {
  publishable: boolean;
  issues: string[];
  meaningfulWordCount: number;
  nonLatinLetterRatio: number;
};

function isLetter(character: string): boolean {
  return character.toLocaleLowerCase() !== character.toLocaleUpperCase();
}

function isLatinLetter(character: string): boolean {
  return /[A-Za-z\u00c0-\u024f\u1e00-\u1eff]/.test(character);
}

function meaningfulTranscriptText(segments: TranscriptSegment[]): string {
  return segments
    .map((segment) => segment.text ?? '')
    .join(' ')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\((?:music|applause|laughter|cheering|upbeat music|bright music)\)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function assessWorldFlightTranscript(
  segments: TranscriptSegment[],
  declaredLanguage = segments[0]?.lang,
): WorldFlightTranscriptAssessment {
  const issues: string[] = [];
  const text = meaningfulTranscriptText(segments);
  const meaningfulWordCount = text ? text.split(/\s+/).length : 0;
  const letters = Array.from(text).filter(isLetter);
  const nonLatinLetters = letters.filter((character) => !isLatinLetter(character));
  const nonLatinLetterRatio = letters.length > 0 ? nonLatinLetters.length / letters.length : 0;

  if (!declaredLanguage?.toLowerCase().startsWith('en')) {
    issues.push(`LANGUAGE_NOT_ENGLISH:${declaredLanguage ?? 'missing'}`);
  }
  if (meaningfulWordCount < WORLD_FLIGHT_MIN_MEANINGFUL_TRANSCRIPT_WORDS) {
    issues.push(`TRANSCRIPT_TOO_THIN:${meaningfulWordCount}_meaningful_words`);
  }
  if (nonLatinLetterRatio > WORLD_FLIGHT_MAX_NON_LATIN_LETTER_RATIO) {
    issues.push(`TRANSCRIPT_PREDOMINANTLY_NON_LATIN:${Math.round(nonLatinLetterRatio * 100)}%`);
  }

  return {
    publishable: issues.length === 0,
    issues,
    meaningfulWordCount,
    nonLatinLetterRatio,
  };
}
