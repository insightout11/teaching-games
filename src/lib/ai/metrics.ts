/**
 * Lightweight structured logging for beta observability.
 * All output is JSON to stdout — parse with grep/jq during beta.
 */

export function logRouteRequest(fields: {
  route: string;
  latencyMs: number;
  status: number;
  degraded?: boolean;
  cacheHit?: boolean;
  error?: string;
}): void {
  console.log(JSON.stringify({ event: 'route_request', ts: Date.now(), ...fields }));
}

export function logCacheLookup(fields: {
  gameKey: string;
  hit: boolean;
  latencyMs?: number;
}): void {
  console.log(JSON.stringify({ event: 'cache_lookup', ts: Date.now(), ...fields }));
}

export function logDegradedFallback(fields: {
  route: string;
  topic: string;
  reason: string;
  tier: 'relaxed-cache' | 'deterministic-builder';
}): void {
  console.log(JSON.stringify({ event: 'degraded_fallback', ts: Date.now(), ...fields }));
}

export function logSemaphoreQueue(fields: {
  queueDepth: number;
  activeCount: number;
}): void {
  if (fields.queueDepth > 0) {
    console.log(JSON.stringify({ event: 'semaphore_queued', ts: Date.now(), ...fields }));
  }
}
