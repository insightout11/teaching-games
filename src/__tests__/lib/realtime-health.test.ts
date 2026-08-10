import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEGRADED_RECONCILE_MS,
  effectiveRealtimeHealth,
  HEALTHY_RECONCILE_MS,
  reconcileIntervalFor,
  reconnectDelayForAttempt,
  sendWithOneRetry,
  startRealtimeChannelLifecycle,
  waitForChannelSubscription,
  type SupabaseChannelStatus,
} from '@/lib/realtime-health';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Realtime reliability helpers', () => {
  it('does not report sender readiness when SUBSCRIBED never arrives', async () => {
    vi.useFakeTimers();
    const channel = { subscribe: vi.fn() };
    const ready = waitForChannelSubscription(channel, 750);
    const assertion = expect(ready).rejects.toThrow('timed out');

    await vi.advanceTimersByTimeAsync(750);

    await assertion;
  });

  it('rejects sender readiness immediately on a failed subscription status', async () => {
    let onStatus: ((status: SupabaseChannelStatus) => void) | undefined;
    const channel = {
      subscribe: vi.fn((callback: (status: SupabaseChannelStatus) => void) => {
        onStatus = callback;
      }),
    };
    const ready = waitForChannelSubscription(channel, 5_000);
    const assertion = expect(ready).rejects.toThrow('CHANNEL_ERROR');

    onStatus?.('CHANNEL_ERROR');

    await assertion;
  });

  it('recreates once after a non-ok send result and succeeds on retry', async () => {
    const send = vi.fn()
      .mockResolvedValueOnce('error')
      .mockResolvedValueOnce('ok');
    const reset = vi.fn();

    await expect(sendWithOneRetry(send, reset)).resolves.toBe(true);
    expect(send).toHaveBeenCalledTimes(2);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('stops after one retry when both sends fail', async () => {
    const send = vi.fn().mockResolvedValue('timed out');
    const reset = vi.fn();

    await expect(sendWithOneRetry(send, reset)).resolves.toBe(false);
    expect(send).toHaveBeenCalledTimes(2);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('reconciles before healthy, reconnects after failure, and removes old channels', async () => {
    vi.useFakeTimers();
    const statusCallbacks: Array<(status: SupabaseChannelStatus) => void> = [];
    const channels = [
      { subscribe: (callback: (status: SupabaseChannelStatus) => void) => statusCallbacks.push(callback) },
      { subscribe: (callback: (status: SupabaseChannelStatus) => void) => statusCallbacks.push(callback) },
    ];
    const createChannel = vi.fn(() => channels[createChannel.mock.calls.length - 1]);
    const removeChannel = vi.fn();
    const reconcile = vi.fn().mockResolvedValue(undefined);
    const health: string[] = [];

    const stop = startRealtimeChannelLifecycle({
      scope: 'test',
      createChannel,
      removeChannel,
      reconcile,
      onHealth: (next) => health.push(next),
      reconnectDelay: () => 100,
    });

    expect(createChannel).toHaveBeenCalledTimes(1);
    statusCallbacks[0]('SUBSCRIBED');
    await Promise.resolve();
    expect(reconcile).toHaveBeenCalledTimes(1);
    expect(health.at(-1)).toBe('subscribed');

    statusCallbacks[0]('CHANNEL_ERROR');
    expect(health.at(-1)).toBe('degraded');
    await vi.advanceTimersByTimeAsync(100);
    expect(removeChannel).toHaveBeenCalledWith(channels[0]);
    expect(createChannel).toHaveBeenCalledTimes(2);

    statusCallbacks[1]('SUBSCRIBED');
    await Promise.resolve();
    expect(reconcile).toHaveBeenCalledTimes(2);
    expect(health.at(-1)).toBe('subscribed');

    stop();
    expect(removeChannel).toHaveBeenCalledWith(channels[1]);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(createChannel).toHaveBeenCalledTimes(2);
  });

  it('cancels a queued reconnect when the existing channel recovers first', async () => {
    vi.useFakeTimers();
    let onStatus: ((status: SupabaseChannelStatus) => void) | undefined;
    const channel = {
      subscribe: (callback: (status: SupabaseChannelStatus) => void) => {
        onStatus = callback;
      },
    };
    const createChannel = vi.fn(() => channel);
    const removeChannel = vi.fn();

    const stop = startRealtimeChannelLifecycle({
      scope: 'test-recovered',
      createChannel,
      removeChannel,
      reconcile: vi.fn().mockResolvedValue(undefined),
      onHealth: vi.fn(),
      reconnectDelay: () => 100,
    });

    onStatus?.('CHANNEL_ERROR');
    onStatus?.('SUBSCRIBED');
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(100);

    expect(createChannel).toHaveBeenCalledTimes(1);
    expect(removeChannel).not.toHaveBeenCalled();
    stop();
  });

  it('uses a fast fallback only while the channel is unhealthy', () => {
    expect(reconcileIntervalFor('subscribed')).toBe(HEALTHY_RECONCILE_MS);
    expect(reconcileIntervalFor('connecting')).toBe(DEGRADED_RECONCILE_MS);
    expect(reconcileIntervalFor('degraded')).toBe(DEGRADED_RECONCILE_MS);
    expect(reconcileIntervalFor('closed')).toBe(DEGRADED_RECONCILE_MS);
    expect(reconnectDelayForAttempt(0, () => 0)).toBe(500);
    expect(reconnectDelayForAttempt(99, () => 0)).toBe(8_000);
  });

  it('keeps reload recovery fast until canonical state has actually applied', () => {
    expect(effectiveRealtimeHealth('subscribed', false)).toBe('degraded');
    expect(reconcileIntervalFor(effectiveRealtimeHealth('subscribed', false))).toBe(DEGRADED_RECONCILE_MS);
    expect(effectiveRealtimeHealth('subscribed', true)).toBe('subscribed');
  });
});
