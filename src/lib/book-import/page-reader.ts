import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { GenerationConfig } from '@google/generative-ai';
import { getThinkingConfig } from '@/lib/ai/config';

/**
 * Scanned books (docs/scanned-books-proposal.md): the AI reads the story text from page pictures,
 * a few pages per call. Server-side only (the API key). Results are checked by `validPageRead`
 * (scan.ts) before they become book pages.
 */
export const SCAN_MODEL = process.env.GEMINI_SCAN_MODEL || 'gemini-2.5-flash';
// Measured Oct 2026 on real scans: Flash-Lite mixed text between pages and kept line breaks; Flash read them
// cleanly at ~$0.0003-0.0005 a page (scripts/measure-page-reading.ts).

export const PAGE_READ_PROMPT = `These are photos or scans of pages from a book, in order. Each image comes after its label "Page N".
Return one entry for EVERY labelled image (also for pages with only a picture), with:
- page: the image's label number N.
- text: the page's story text exactly as printed, in reading order. Include speech bubbles and captions in reading
  order. Keep the original words, spelling and punctuation. Separate paragraphs with a blank line. Rejoin words split
  by a hyphen at a line end.
- leave OUT: running headers, page numbers, publisher/copyright lines, library stamps, handwritten notes, and
  everything that isn't the story: title pages, author/illustrator credits, contents, dedications, ads.
- heading: the chapter or story title only if a NEW chapter/story starts on this page (e.g. "Chapter 3: The Storm"),
  else "". The book's title or chapter name repeated at the top of every page (often next to the page number) is a
  running header, not a heading: leave it out.
- readable: false only if the page has text that is too blurry, cut off or dark to read. Blank pages, picture-only
  pages and front matter are readable (text "").
A page with only a picture has text "". Never describe the pictures, never add words.`;

export interface RawPageRead { page?: unknown; text?: unknown; heading?: unknown; readable?: unknown }

export async function readPageImages(
  images: Array<{ data: string; mimeType: string }>,
  model = SCAN_MODEL,
): Promise<{ pages: RawPageRead[]; inputTokens: number; outputTokens: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
  const genAI = new GoogleGenerativeAI(apiKey);
  const m = genAI.getGenerativeModel({
    model,
    generationConfig: {
      thinkingConfig: getThinkingConfig(model),
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          pages: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: { page: { type: SchemaType.NUMBER }, text: { type: SchemaType.STRING }, heading: { type: SchemaType.STRING }, readable: { type: SchemaType.BOOLEAN } },
              required: ['page', 'text', 'heading', 'readable'],
            },
          },
        },
        required: ['pages'],
      },
    } as GenerationConfig,
  });
  const result = await m.generateContent({
    contents: [{ role: 'user', parts: [...images.flatMap((i, n) => [{ text: `Page ${n + 1}` }, { inlineData: i }]), { text: PAGE_READ_PROMPT }] }],
  });
  const parsed = JSON.parse(result.response.text()) as { pages?: RawPageRead[] };
  // Line results up with the images by their label (a skipped page stays empty, never shifts the rest).
  const byPage: RawPageRead[] = images.map(() => ({ text: '', heading: '', readable: true }));
  (Array.isArray(parsed.pages) ? parsed.pages : []).forEach((p) => {
    const n = Number(p?.page);
    if (Number.isInteger(n) && n >= 1 && n <= images.length) byPage[n - 1] = p;
  });
  const usage = result.response.usageMetadata;
  return { pages: byPage, inputTokens: usage?.promptTokenCount ?? 0, outputTokens: usage?.candidatesTokenCount ?? 0 };
}

const blocked = (e: unknown) => /RECITATION|SAFETY|blocked/i.test(e instanceof Error ? e.message : String(e));

/**
 * Read a batch; if the model blocks it (Gemini's RECITATION filter can refuse to repeat a known book's
 * text), retry the pages one by one so only the blocked page is lost (returned as unreadable).
 */
export async function readPagesSafely(
  images: Array<{ data: string; mimeType: string }>,
  model = SCAN_MODEL,
): Promise<{ pages: RawPageRead[]; inputTokens: number; outputTokens: number; blocked: number }> {
  try {
    return { ...(await readPageImages(images, model)), blocked: 0 };
  } catch (e) {
    if (!blocked(e) || images.length === 1) {
      if (blocked(e)) return { pages: [{ text: '', heading: '', readable: false }], inputTokens: 0, outputTokens: 0, blocked: 1 };
      throw e;
    }
  }
  const out = { pages: [] as RawPageRead[], inputTokens: 0, outputTokens: 0, blocked: 0 };
  for (const image of images) {
    const r = await readPagesSafely([image], model);
    out.pages.push(...r.pages);
    out.inputTokens += r.inputTokens;
    out.outputTokens += r.outputTokens;
    out.blocked += r.blocked;
  }
  return out;
}
