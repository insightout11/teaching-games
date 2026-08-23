import type { InputSpecRealtimePayload } from '@/lib/input-spec';

export type RealtimeBroadcastDelivery = {
  status: 'sent' | 'failed';
  elapsedMs: number;
  httpStatus?: number;
  reason?: 'missing-configuration' | 'invalid-configuration' | 'request-failed' | 'timeout';
  errorName?: string;
  errorCode?: string;
};

const BROADCAST_TIMEOUT_MS = 2_500;

function parseSupabaseBaseUrl(rawValue: string): URL | null {
  const trimmedValue = rawValue.trim();
  const hasMatchingQuotes = (
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"'))
    || (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
  );
  const normalizedValue = hasMatchingQuotes
    ? trimmedValue.slice(1, -1).trim()
    : trimmedValue;

  try {
    const url = new URL(normalizedValue);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (url.username || url.password || url.search || url.hash) return null;
    if (url.pathname !== '/' && url.pathname !== '') return null;
    return url;
  } catch {
    return null;
  }
}

function safeErrorMetadata(error: unknown): Pick<RealtimeBroadcastDelivery, 'errorName' | 'errorCode'> {
  if (!(error instanceof Error)) return { errorName: 'UnknownError' };
  const cause = error.cause as { code?: unknown } | undefined;
  return {
    errorName: error.name || 'Error',
    ...(typeof cause?.code === 'string' ? { errorCode: cause.code } : {}),
  };
}

/**
 * Sends the canonical input-spec event through Supabase's HTTP Broadcast API.
 * This is intentionally server-owned: it does not depend on the teacher tab
 * establishing a second WebSocket before students can receive a prompt.
 */
export async function broadcastInputSpecFromServer(
  topic: string,
  event: string,
  payload: InputSpecRealtimePayload,
): Promise<RealtimeBroadcastDelivery> {
  const startedAt = Date.now();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      status: 'failed',
      elapsedMs: Date.now() - startedAt,
      reason: 'missing-configuration',
    };
  }

  const supabaseBaseUrl = parseSupabaseBaseUrl(supabaseUrl);
  if (!supabaseBaseUrl) {
    return {
      status: 'failed',
      elapsedMs: Date.now() - startedAt,
      reason: 'invalid-configuration',
    };
  }

  const broadcastUrl = new URL(
    `realtime/v1/api/broadcast/${encodeURIComponent(topic)}/events/${encodeURIComponent(event)}`,
    `${supabaseBaseUrl.origin}/`,
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BROADCAST_TIMEOUT_MS);

  try {
    const response = await fetch(
      broadcastUrl,
      {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
        signal: controller.signal,
      },
    );

    return {
      status: response.ok ? 'sent' : 'failed',
      elapsedMs: Date.now() - startedAt,
      httpStatus: response.status,
      ...(response.ok ? {} : { reason: 'request-failed' as const }),
    };
  } catch (error) {
    const errorMetadata = safeErrorMetadata(error);
    return {
      status: 'failed',
      elapsedMs: Date.now() - startedAt,
      reason: error instanceof Error && error.name === 'AbortError'
        ? 'timeout'
        : 'request-failed',
      ...errorMetadata,
    };
  } finally {
    clearTimeout(timeout);
  }
}
