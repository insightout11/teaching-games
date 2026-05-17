import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType as GeminiSchemaType } from '@google/generative-ai';
import { requireAuthForGeneration } from '@/lib/auth-credits';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const EXTRACTION_PROMPT = `You are helping an ESL teacher extract educational content from their own teaching material.
Examine this material carefully. It may be a textbook page, worksheet, article, or lesson handout.

Summarize the educational content in 400–500 words of clear prose. Include:
- Main topic and key vocabulary (bold key terms with *word*)
- Core concepts, facts, or language points
- Any exercises, questions, or activities described
- Contextual details useful for generating ESL lesson activities

Do not include page numbers, headers, footers, or formatting artifacts. Write as clear running text.`;

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
    .slice(0, 60000);
}

function filenameToTitle(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuthForGeneration({ requestHasProModules: true });
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
  const title = rawTitle || (file.type === 'application/pdf' ? 'Uploaded Document' : 'Uploaded Image');
  const sourceType = file.type === 'application/pdf' ? 'pdf' : 'image';

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: GeminiSchemaType.OBJECT,
          properties: { summary: { type: GeminiSchemaType.STRING } },
          required: ['summary'],
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
    const parsed = JSON.parse(raw) as { summary: string };
    const summary = sanitizeText(parsed.summary);

    return NextResponse.json({ title, summary, sourceType });
  } catch (err) {
    console.error('[extract-document]', err);
    return NextResponse.json(
      { error: 'Failed to extract content. Please try again.' },
      { status: 500 },
    );
  }
}
