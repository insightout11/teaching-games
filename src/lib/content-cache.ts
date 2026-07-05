import { createServiceClient } from './supabase/service';

/**
 * Stable short hash of a lesson's grounding signals (source text/id, mission context),
 * used as the cache `variant` so grounded content never collides with ungrounded — or
 * cross-lesson — content of the same (gameKey, topic, difficulty). Two lessons with the
 * same grounding share a cache entry (reuse); different grounding gets its own namespace.
 * Returns undefined when there is no grounding, so ungrounded lessons keep sharing the
 * broad topic+difficulty cache (variant IS NULL).
 */
export function groundingVariant(...signals: Array<string | null | undefined>): string | undefined {
  const joined = signals.map((s) => (s ?? '').trim()).filter(Boolean).join('');
  if (!joined) return undefined;
  // FNV-1a 32-bit → base36: short, deterministic, and stable across processes.
  let h = 0x811c9dc5;
  for (let i = 0; i < joined.length; i++) {
    h ^= joined.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return 'g' + (h >>> 0).toString(36);
}

export interface CachedContent {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content_json: any;
}

/**
 * Look up a cached content entry for a given game/topic/difficulty.
 * Randomly picks from available entries, excluding any IDs already seen this session.
 * Filters by schema_version (default 1) and variant (IS NULL when not provided).
 * Returns null on cache miss (caller should generate via AI and then call storeCachedContent).
 */
export async function getCachedContent(
  gameKey: string,
  topic: string,
  difficulty: string,
  excludeIds: string[] = [],
  variant?: string,
  schemaVersion: number = 1,
): Promise<CachedContent | null> {
  try {
    const supabase = createServiceClient();

    // Build query — limit must come last since the mock (and real client) finalises on .limit()
    let query = supabase
      .from('generated_content')
      .select('id, content_json')
      .eq('game_key', gameKey)
      .eq('topic', topic)
      .eq('difficulty', difficulty)
      .eq('schema_version', schemaVersion);

    // Filter by variant: NULL match when not provided, exact match otherwise
    if (variant !== undefined && variant !== null) {
      query = query.eq('variant', variant);
    } else {
      query = query.is('variant', null);
    }

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    // Fetch up to 30 matching entries (random selection happens client-side)
    const { data, error } = await query.limit(30);

    if (error || !data || data.length === 0) return null;

    // Pick a random entry from the available pool
    const entry = data[Math.floor(Math.random() * data.length)];

    // Atomically increment used_count (fire-and-forget)
    void supabase.rpc('increment_content_used_count', { content_id: entry.id });

    return { id: entry.id, content_json: entry.content_json };
  } catch {
    // Cache failures are non-fatal — caller falls back to AI generation
    return null;
  }
}

/**
 * Store an AI-generated content batch in the cache for future reuse.
 * Returns the new entry's ID (to be added to seenCacheIds so it isn't
 * served again in the same session).
 * Returns null on failure (non-fatal).
 */
export async function storeCachedContent(
  gameKey: string,
  topic: string,
  difficulty: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any,
  schemaVersion: number = 1,
  variant?: string,
): Promise<string | null> {
  try {
    const supabase = createServiceClient();

    const row: Record<string, unknown> = {
      game_key: gameKey,
      topic,
      difficulty,
      content_json: content,
      schema_version: schemaVersion,
    };

    if (variant !== undefined && variant !== null) {
      row.variant = variant;
    }

    const { data, error } = await supabase
      .from('generated_content')
      .insert(row)
      .select('id')
      .single();

    if (error || !data) return null;
    return data.id as string;
  } catch {
    return null;
  }
}
