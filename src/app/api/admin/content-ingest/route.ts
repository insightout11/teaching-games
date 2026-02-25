import { NextRequest, NextResponse } from 'next/server';
import { storeCachedContent } from '@/lib/content-cache';

const ALLOWED_GAME_KEYS = [
  'vocab-sprint',
  'synonym-showdown',
  'sentence-scramble',
  'grammar-boss',
  'error-hunter',
  'dialogue-detective',
  'connections',
  'story-sprint',
  'word-chain',
] as const;

const MAX_CONTENT_SIZE_BYTES = 50 * 1024; // 50 KB

export async function POST(request: NextRequest) {
  // Auth: Bearer token check
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token || token !== process.env.CONTENT_INGEST_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    game_key?: unknown;
    topic?: unknown;
    difficulty?: unknown;
    content_json?: unknown;
    schema_version?: unknown;
    variant?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { game_key, topic, difficulty, content_json, schema_version, variant } = body;

  // Required field validation
  if (!game_key || typeof game_key !== 'string' || game_key.trim() === '') {
    return NextResponse.json({ error: 'Missing or invalid field: game_key' }, { status: 400 });
  }
  if (!topic || typeof topic !== 'string' || topic.trim() === '') {
    return NextResponse.json({ error: 'Missing or invalid field: topic' }, { status: 400 });
  }
  if (!difficulty || typeof difficulty !== 'string' || difficulty.trim() === '') {
    return NextResponse.json({ error: 'Missing or invalid field: difficulty' }, { status: 400 });
  }
  if (content_json === undefined || content_json === null) {
    return NextResponse.json({ error: 'Missing field: content_json' }, { status: 400 });
  }

  // game_key allowlist
  if (!ALLOWED_GAME_KEYS.includes(game_key as typeof ALLOWED_GAME_KEYS[number])) {
    return NextResponse.json(
      { error: `Invalid game_key. Must be one of: ${ALLOWED_GAME_KEYS.join(', ')}` },
      { status: 400 },
    );
  }

  // schema_version validation
  const schemaVersionNum = schema_version === undefined ? 1 : Number(schema_version);
  if (!Number.isInteger(schemaVersionNum) || schemaVersionNum < 1) {
    return NextResponse.json(
      { error: 'schema_version must be a positive integer' },
      { status: 400 },
    );
  }

  // variant validation
  if (variant !== undefined && variant !== null && typeof variant !== 'string') {
    return NextResponse.json({ error: 'variant must be a string if provided' }, { status: 400 });
  }

  // Payload size check
  const contentSize = Buffer.byteLength(JSON.stringify(content_json), 'utf8');
  if (contentSize > MAX_CONTENT_SIZE_BYTES) {
    return NextResponse.json(
      { error: `content_json exceeds maximum size of ${MAX_CONTENT_SIZE_BYTES / 1024}KB` },
      { status: 400 },
    );
  }

  const id = await storeCachedContent(
    game_key,
    topic,
    difficulty,
    content_json,
    schemaVersionNum,
    typeof variant === 'string' ? variant : undefined,
  );

  if (!id) {
    return NextResponse.json({ error: 'Failed to store content' }, { status: 500 });
  }

  return NextResponse.json({ id, created_at: new Date().toISOString() });
}
