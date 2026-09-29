import { createClient } from '@/lib/supabase/client';

/**
 * Hand-raise queue: a live broadcast channel between students' phones and the
 * teacher's cabin. No table: a raised phone re-announces itself every few
 * seconds, so a teacher reload rebuilds the queue within moments.
 */
export type HandMessage =
  | { type: 'hand'; clientId: string; name: string; raised: boolean; at: number }
  | { type: 'lower'; clientId: string }
  | { type: 'hello' };

export const HAND_HEARTBEAT_MS = 5000;
/** A raised hand not re-announced for this long is dropped (phone left). */
export const HAND_STALE_MS = 16000;

export function openHandChannel(sessionId: string, onMessage: (m: HandMessage) => void) {
  const supabase = createClient();
  const channel = supabase.channel(`hands:${sessionId}`, { config: { broadcast: { self: false } } });
  channel.on('broadcast', { event: 'hand' }, ({ payload }: { payload: HandMessage }) => onMessage(payload));
  channel.subscribe();
  return {
    send: (m: HandMessage) => { void channel.send({ type: 'broadcast', event: 'hand', payload: m }); },
    close: () => { void supabase.removeChannel(channel); },
  };
}
