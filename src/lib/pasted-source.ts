import type { SourceMaterial } from '@/types/source-material';

const GENERIC_PASTED_TITLES = new Set(['pasted text', 'untitled text', 'text']);

function cleanTitle(value: string): string {
  return value.replace(/^#{1,6}\s+/, '').trim().slice(0, 120);
}

function looksLikeStandaloneTitle(line: string, nextLine: string | undefined): boolean {
  const title = cleanTitle(line);
  if (!title || title.length > 80 || title.split(/\s+/).length > 10) return false;
  if (/^[\-*+]\s/.test(line) || /[.!?;:]$/.test(title)) return false;
  return Boolean(nextLine?.trim()) && (line.trim().startsWith('#') || title.length <= 60);
}

export function preparePastedSource(rawText: string, explicitTitle?: string | null): {
  title: string;
  body: string;
  detectedTitle: boolean;
} {
  const cleaned = rawText.replace(/\r/g, '').trim();
  const lines = cleaned.split('\n');
  const firstContentIndex = lines.findIndex((line) => line.trim().length > 0);
  const first = firstContentIndex >= 0 ? lines[firstContentIndex] : '';
  const next = firstContentIndex >= 0
    ? lines.slice(firstContentIndex + 1).find((line) => line.trim().length > 0)
    : undefined;
  const supplied = cleanTitle(explicitTitle ?? '');
  const standalone = looksLikeStandaloneTitle(first, next);
  const firstMatchesSupplied = Boolean(supplied)
    && cleanTitle(first).toLowerCase() === supplied.toLowerCase();
  const detected = !supplied && standalone;
  const stripFirstLine = standalone && (!supplied || firstMatchesSupplied);
  const title = supplied || (detected ? cleanTitle(first) : 'Pasted Text');
  const body = stripFirstLine
    ? lines.filter((_, index) => index !== firstContentIndex).join('\n').trim()
    : cleaned;
  return { title, body, detectedTitle: detected };
}

export function normalizePastedSourceMaterial(source?: SourceMaterial | null): SourceMaterial | undefined {
  if (!source) return undefined;
  if (source.sourceType !== 'text') return source;
  const raw = source.rawText ?? source.briefingText ?? source.sourceText ?? '';
  if (!raw.trim()) return source;
  const generic = GENERIC_PASTED_TITLES.has(source.title.trim().toLowerCase());
  const prepared = preparePastedSource(raw, generic ? undefined : source.title);
  if (!generic && prepared.body === raw.trim()) return source;
  return {
    ...source,
    title: prepared.title,
    rawText: prepared.body,
    ...(source.briefingText === raw ? { briefingText: prepared.body } : {}),
  };
}
