import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType as GeminiSchemaType } from '@google/generative-ai';
import { requireAuthForGeneration } from '@/lib/auth-credits';
import type { SourceBriefingMode, SourceBriefingOption } from '@/types/source-material';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const EXTRACTION_PROMPT = `You are helping an ESL teacher turn uploaded teaching material into a short classroom briefing.
The material may be a story, article, worksheet, textbook page, slide deck, or image.

Return content for two different purposes:

1. summary: a concise teacher-facing note, 120-180 words, describing what the material is about and what it can support in class.
2. studentBriefing: the actual text students can read in Captain's Briefing. This must be direct student-facing prose, not a summary about a text.

Rules for studentBriefing:
- If the material contains a coherent story/article/passage under about 900 words, preserve the original wording as much as possible.
- If it is longer, choose one strong 250-650 word excerpt that can stand alone in class.
- If the source is dense, fragmented, visual, or worksheet-like, adapt it into a clear 250-450 word reading.
- Do not start paragraphs with phrases like "The article explains", "This document discusses", or "The text is about".
- Remove page numbers, headers, footers, answer keys, and OCR artifacts.
- Keep names, facts, examples, and key vocabulary from the uploaded source.

Also return sourceText: the best exact passage or extracted text you used as the basis for the briefing. For long documents, do not return the full document; return the chosen excerpt.

Also return originalText only when the upload contains one clean, coherent original reading passage under about 1,200 words. originalText should preserve the uploaded wording except for OCR cleanup, page numbers, headers, and footers. If the upload is longer, fragmented, worksheet-like, or mostly visual, return an empty string for originalText.

Also return title, documentKind, recommendedMode ("exact", "excerpt", "adapted", or "generated"), and wordCount for sourceText when possible.

Return 1-3 suggestedExcerpts. Each should be a usable teacher choice for the briefing. Include exact excerpts when possible.`;

type ExtractedBriefingOption = {
  label?: string;
  text?: string;
  rationale?: string;
  wordCount?: number;
};

type ExtractedDocumentPayload = {
  title?: string;
  documentKind?: string;
  summary?: string;
  sourceText?: string;
  originalText?: string;
  studentBriefing?: string;
  recommendedMode?: string;
  wordCount?: number;
  suggestedExcerpts?: ExtractedBriefingOption[];
};

function sanitizeText(text: string): string {
  return text
    .split('\n')
    .filter((line) => {
      const lower = line.toLowerCase().trim();
      return !(
        lower.startsWith('ignore') ||
        lower.startsWith('system:') ||
        lower.startsWith('assistant:') ||
        lower.startsWith('<|') ||
        lower.startsWith('[inst]')
      );
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 60000);
}

function filenameToTitle(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeMode(mode: string | undefined, briefingText: string, sourceText: string): SourceBriefingMode {
  if (mode === 'exact' || mode === 'excerpt' || mode === 'adapted' || mode === 'generated') return mode;
  if (sourceText && briefingText && sourceText.trim() === briefingText.trim()) return 'excerpt';
  return 'adapted';
}

function normalizeForComparison(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function textsAreNearDuplicates(a: string, b: string): boolean {
  const aWords = normalizeForComparison(a);
  const bWords = normalizeForComparison(b);
  if (aWords.length === 0 || bWords.length === 0) return false;
  const aText = aWords.join(' ');
  const bText = bWords.join(' ');
  const shorter = aText.length < bText.length ? aText : bText;
  const longer = aText.length < bText.length ? bText : aText;
  if (shorter.length > 200 && longer.includes(shorter)) return true;

  const aSet = new Set(aWords);
  const bSet = new Set(bWords);
  let overlap = 0;
  aSet.forEach((word) => {
    if (bSet.has(word)) overlap += 1;
  });
  return overlap / Math.min(aSet.size, bSet.size) > 0.9;
}

function buildBriefingOptions(params: {
  briefingText: string;
  mode: SourceBriefingMode;
  sourceText: string;
  originalText: string;
  suggestedExcerpts?: ExtractedBriefingOption[];
}): SourceBriefingOption[] {
  const seen = new Set<string>();
  const options: SourceBriefingOption[] = [];

  function addOption(option: SourceBriefingOption) {
    const text = sanitizeText(option.text);
    if (text.length < 50) return;
    const key = text.replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 300);
    if (seen.has(key)) return;
    seen.add(key);
    options.push({ ...option, text, wordCount: option.wordCount ?? countWords(text) });
  }

  addOption({
    id: 'recommended',
    label: 'Recommended student reading',
    description: params.mode === 'adapted'
      ? 'Best fit for a short class briefing, cleaned for student reading.'
      : 'Best fit for a short class briefing.',
    text: params.briefingText,
    mode: params.mode,
  });

  const originalWordCount = countWords(params.originalText);
  const briefingWordCount = countWords(params.briefingText);
  const originalIsMeaningfullyLonger = originalWordCount > briefingWordCount + 40 && originalWordCount > briefingWordCount * 1.2;
  if (
    params.originalText &&
    originalWordCount <= 1200 &&
    (!textsAreNearDuplicates(params.originalText, params.briefingText) || originalIsMeaningfullyLonger)
  ) {
    addOption({
      id: 'original-full',
      label: 'Full original reading',
      description: 'Original upload wording with only cleanup for OCR, headers, and footers.',
      text: params.originalText,
      mode: 'exact',
    });
  }

  if (params.sourceText && !textsAreNearDuplicates(params.sourceText, params.briefingText)) {
    addOption({
      id: 'source-excerpt',
      label: 'Original source passage',
      description: 'Closer to the uploaded wording; may be denser.',
      text: params.sourceText,
      mode: 'excerpt',
    });
  }

  for (const excerpt of params.suggestedExcerpts ?? []) {
    addOption({
      id: `excerpt-${options.length + 1}`,
      label: excerpt.label?.trim() || `Excerpt ${options.length + 1}`,
      description: excerpt.rationale?.trim(),
      text: excerpt.text ?? '',
      mode: 'excerpt',
      wordCount: excerpt.wordCount,
    });
  }

  return options.slice(0, 4);
}

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuthForGeneration({ requiresEntitlement: true });
  if (authError) return authError;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Please upload a PDF or image (JPG, PNG, WebP).' },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'File is too large. Maximum size is 10 MB.' },
      { status: 400 },
    );
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const rawTitle = filenameToTitle(file.name);
  const fallbackTitle = rawTitle || (file.type === 'application/pdf' ? 'Uploaded Document' : 'Uploaded Image');
  const sourceType = file.type === 'application/pdf' ? 'pdf' : 'image';

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: GeminiSchemaType.OBJECT,
          properties: {
            title: { type: GeminiSchemaType.STRING },
            documentKind: { type: GeminiSchemaType.STRING },
            summary: { type: GeminiSchemaType.STRING },
            sourceText: { type: GeminiSchemaType.STRING },
            originalText: { type: GeminiSchemaType.STRING },
            studentBriefing: { type: GeminiSchemaType.STRING },
            recommendedMode: { type: GeminiSchemaType.STRING },
            wordCount: { type: GeminiSchemaType.NUMBER },
            suggestedExcerpts: {
              type: GeminiSchemaType.ARRAY,
              items: {
                type: GeminiSchemaType.OBJECT,
                properties: {
                  label: { type: GeminiSchemaType.STRING },
                  text: { type: GeminiSchemaType.STRING },
                  rationale: { type: GeminiSchemaType.STRING },
                  wordCount: { type: GeminiSchemaType.NUMBER },
                },
                required: ['label', 'text', 'rationale'],
              },
            },
          },
          required: ['summary', 'studentBriefing', 'recommendedMode'],
        },
      },
    });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: file.type, data: base64 } },
          { text: EXTRACTION_PROMPT },
        ],
      }],
    });

    const raw = result.response.text();
    const parsed = JSON.parse(raw) as ExtractedDocumentPayload;
    const title = sanitizeText(parsed.title ?? fallbackTitle).split('\n')[0] || fallbackTitle;
    const summary = sanitizeText(parsed.summary ?? '');
    const sourceText = sanitizeText(parsed.sourceText ?? parsed.studentBriefing ?? summary);
    const originalText = sanitizeText(parsed.originalText ?? '');
    const briefingText = sanitizeText(parsed.studentBriefing ?? (sourceText || summary));
    const briefingMode = normalizeMode(parsed.recommendedMode, briefingText, sourceText);
    const briefingOptions = buildBriefingOptions({
      briefingText,
      mode: briefingMode,
      sourceText,
      originalText,
      suggestedExcerpts: parsed.suggestedExcerpts,
    });
    const wordCount = parsed.wordCount ?? countWords(sourceText || briefingText);

    return NextResponse.json({
      title,
      summary,
      sourceType,
      rawText: briefingText,
      briefingText,
      briefingMode,
      sourceText,
      originalText,
      documentKind: sanitizeText(parsed.documentKind ?? ''),
      wordCount,
      briefingOptions,
    });
  } catch (err) {
    console.error('[extract-document]', err);
    return NextResponse.json(
      { error: 'Failed to extract content. Please try again.' },
      { status: 500 },
    );
  }
}
