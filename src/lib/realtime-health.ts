export type RealtimeHealth = 'connecting' | 'subscribed' | 'degraded' | 'closed';

export type SupabaseChannelStatus =
  | 'SUBSCRIBED'
  | 'TIMED_OUT'
  | 'CLOSED'
  | 'CHANNEL_ERROR'
  | string;

// Temporary beta safety net while server-owned Broadcast delivery is monitored.
// This caps a missed prompt at roughly five seconds without turning normal use
// into the aggressive degraded-mode polling path.
export const HEALTHY_RECONCILE_MS = 5_000;
export const DEGRADED_RECONCILE_MS = 1_500;
export const CHANNEL_READY_TIMEOUT_MS = 2_000;
export const CONNECTION_WARNING_GRACE_MS = 3_000;
export const CANONICAL_OFFLINE_MS = 10_000;

export type StudentConnectionState = 'checking' | 'connected' | 'syncing' | 'reconnecting' | 'offline';

export function isChannelFailureStatus(status: SupabaseChannelStatus): boolean {
  return status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED';
}

export function reconcileIntervalFor(health: RealtimeHealth): number {
  return health === 'subscribed' ? HEALTHY_RECONCILE_MS : DEGRADED_RECONCILE_MS;
}

export function effectiveRealtimeHealth(
  channelHealth: RealtimeHealth,
  canonicalReady: boolean,
): RealtimeHealth {
  return channelHealth === 'subscribed' && canonicalReady ? 'subscribed' : 'degraded';
}

export function studentConnectionState(options: {
  channelHealth: RealtimeHealth;
  canonicalReady: boolean;
  lastCanonicalSuccessAt: number | null;
  lastParticipationSuccessAt?: number | null;
  degradedSince: number | null;
  now?: number;
}): StudentConnectionState {
  const now = options.now ?? Date.now();
  const channelSubscribed = options.channelHealth === 'subscribed';
  const degradedFor = options.degradedSince == null
    ? Number.POSITIVE_INFINITY
    : Math.max(0, now - options.degradedSince);

  if (channelSubscribed) return options.canonicalReady ? 'connected' : 'syncing';

  const lastEffectiveSuccessAt = Math.max(
    options.lastCanonicalSuccessAt ?? Number.NEGATIVE_INFINITY,
    options.lastParticipationSuccessAt ?? Number.NEGATIVE_INFINITY,
  );

  if (!Number.isFinite(lastEffectiveSuccessAt)) {
    if (degradedFor < CONNECTION_WARNING_GRACE_MS) return 'checking';
    return channelSubscribed ? 'syncing' : 'reconnecting';
  }

  const canonicalAge = Math.max(0, now - lastEffectiveSuccessAt);
  if (degradedFor < CONNECTION_WARNING_GRACE_MS && canonicalAge < CANONICAL_OFFLINE_MS) {
    return 'connected';
  }
  // A recent successful canonical fetch or participation request proves the device is
  // online even while realtime is resubscribing. Describe that as syncing; reserve
  // "Reconnecting" for a genuine retry state with no working path yet.
  if (canonicalAge < CANONICAL_OFFLINE_MS) return 'syncing';
  return 'offline';
}

export function reconnectDelayForAttempt(attempt: number, random = Math.random): number {
  const boundedAttempt = Math.max(0, Math.min(attempt, 4));
  const base = Math.min(500 * (2 ** boundedAttempt), 8_000);
  return base + Math.round(random() * Math.min(500, base / 2));
}

export function logRealtimeDiagnostic(
  scope: string,
  event: string,
  details: Record<string, string | number | boolean | null | undefined> = {},
): void {
  const fields = Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(' ');
  console.info(`[realtime] scope=${scope} event=${event}${fields ? ` ${fields}` : ''}`);
}

interface SubscribableChannel {
  subscribe(callback: (status: SupabaseChannelStatus) => void): unknown;
}

export function waitForChannelSubscription(
  channel: SubscribableChannel,
  timeoutMs = CHANNEL_READY_TIMEOUT_MS,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve();
    };
    const timeout = setTimeout(
      () => finish(new Error(`Realtime subscription timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') finish();
      else if (isChannelFailureStatus(status)) finish(new Error(`Realtime subscription ${status}`));
    });
  });
}

export async function sendWithOneRetry(
  send: () => Promise<unknown>,
  reset: () => void | Promise<void>,
): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await send();
      if (result === 'ok') return true;
    } catch {
      // The caller records scoped diagnostics; retry behavior is identical for
      // thrown errors and Supabase's non-ok resolved send statuses.
    }
    if (attempt === 0) await reset();
  }
  return false;
}

interface LifecycleChannel {
  subscribe(callback: (status: SupabaseChannelStatus) => void): unknown;
}

interface RealtimeChannelLifecycleOptions<TChannel extends LifecycleChannel> {
  scope: string;
  createChannel: () => TChannel;
  removeChannel: (channel: TChannel) => void | Promise<unknown>;
  reconcile: () => void | Promise<void>;
  onHealth: (health: RealtimeHealth) => void;
  reconnectDelay?: (attempt: number) => number;
}

/** Owns one active channel, reconnects boundedly, and reconciles before healthy. */
export function startRealtimeChannelLifecycle<TChannel extends LifecycleChannel>(
  options: RealtimeChannelLifecycleOptions<TChannel>,
): () => void {
  let activeChannel: TChannel | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempt = 0;
  let generation = 0;
  let stopped = false;

  const removeActiveChannel = () => {
    const channel = activeChannel;
    activeChannel = null;
    if (channel) void options.removeChannel(channel);
  };

  function scheduleReconnect() {
    if (stopped || reconnectTimer) return;
    const delay = (options.reconnectDelay ?? reconnectDelayForAttempt)(reconnectAttempt);
    reconnectAttempt += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      removeActiveChannel();
      connect();
    }, delay);
  }

  function connect() {
    if (stopped) return;
    const currentGeneration = ++generation;
    const connectionStartedAt = Date.now();
    options.onHealth('connecting');
    logRealtimeDiagnostic(options.scope, 'connecting', { attempt: reconnectAttempt });
    const channel = options.createChannel();
    activeChannel = channel;
    channel.subscribe((status) => {
      if (stopped || currentGeneration !== generation) return;
      if (status === 'SUBSCRIBED') {
        const subscribedAt = Date.now();
        logRealtimeDiagnostic(options.scope, 'channel_status', {
          status,
          elapsed_ms: subscribedAt - connectionStartedAt,
        });
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = null;
        reconnectAttempt = 0;
        Promise.resolve(options.reconcile())
          .then(() => {
            if (stopped || currentGeneration !== generation) return;
            options.onHealth('subscribed');
            logRealtimeDiagnostic(options.scope, 'subscribed', {
              reconcile_ms: Date.now() - subscribedAt,
            });
          })
          .catch(() => {
            if (stopped || currentGeneration !== generation) return;
            options.onHealth('degraded');
            logRealtimeDiagnostic(options.scope, 'reconcile_failed');
            scheduleReconnect();
          });
        return;
      }
      if (isChannelFailureStatus(status)) {
        const health = status === 'CLOSED' ? 'closed' : 'degraded';
        options.onHealth(health);
        logRealtimeDiagnostic(options.scope, 'channel_status', { status });
        scheduleReconnect();
      }
    });
  }

  connect();

  return () => {
    stopped = true;
    generation += 1;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
    removeActiveChannel();
    options.onHealth('closed');
  };
}
