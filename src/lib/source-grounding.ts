import type { SourceMaterial } from '@/types/source-material';
import { extractPlainText } from '@/lib/source-context';

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'because', 'before', 'being', 'could', 'every',
  'first', 'from', 'have', 'into', 'more', 'other', 'should', 'some', 'than', 'that',
  'their', 'there', 'these', 'they', 'this', 'those', 'very', 'what', 'when', 'where',
  'which', 'while', 'with', 'would', 'your', 'them', 'then', 'only', 'most',
]);

export interface SourceGroundingContract {
  title: string;
  teacherTopic: string;
  excerpt: string;
  terms: string[];
}

export function meaningfulTerms(text: string): string[] {
  const matches = text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? [];
  return Array.from(new Set(matches.filter((word) => !STOP_WORDS.has(word))));
}

export function buildSourceGroundingContract(
  source: SourceMaterial | undefined,
  teacherTopic: string,
  rawTranscript?: string,
): SourceGroundingContract | null {
  if (!source) return null;
  const excerpt = (rawTranscript ? extractPlainText(rawTranscript) : source.briefingText ?? source.rawText ?? source.summary).slice(0, 10_000);
  if (!excerpt.trim()) return null;
  return {
    title: source.title,
    teacherTopic,
    excerpt,
    terms: meaningfulTerms(`${source.title} ${teacherTopic} ${excerpt}`),
  };
}

export function validateGroundedStrings(
  values: string[],
  contract: SourceGroundingContract | null,
): { valid: boolean; overlap: string[]; reason?: string } {
  if (!contract) return { valid: true, overlap: [] };
  const generated = new Set(meaningfulTerms(values.join(' ')));
  const overlap = contract.terms.filter((term) => generated.has(term));
  const required = Math.min(3, Math.max(contract.terms.length >= 4 ? 2 : 1, Math.ceil(contract.terms.length * 0.03)));
  if (overlap.length < required) {
    return {
      valid: false,
      overlap,
      reason: `Only ${overlap.length} meaningful source term(s) overlapped; required ${required}.`,
    };
  }
  return { valid: true, overlap };
}
