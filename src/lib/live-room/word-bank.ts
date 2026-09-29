import { createClient } from '@/lib/supabase/client';

/**
 * Word bank: students tap "I used it!" on a key word on their phone while
 * speaking; the teacher's Word bank widget counts who used which word.
 * A live broadcast channel (no table), like the hand-raise queue.
 */
export interface WordUse { word: string; clientId: string; name: string; at: number }

/**
 * Tricky words: while the class reads together, students tap words they don't
 * know on their phones; the reading activity collects them for a vocab round.
 */
export function openTrickyChannel(sessionId: string, onTricky?: (u: WordUse) => void) {
  const supabase = createClient();
  const channel = supabase.channel(`tricky:${sessionId}`, { config: { broadcast: { self: false } } });
  if (onTricky) channel.on('broadcast', { event: 'tricky' }, ({ payload }: { payload: WordUse }) => onTricky(payload));
  channel.subscribe();
  return {
    send: (u: WordUse) => { void channel.send({ type: 'broadcast', event: 'tricky', payload: u }); },
    close: () => { void supabase.removeChannel(channel); },
  };
}

export function openWordBankChannel(sessionId: string, onUse?: (u: WordUse) => void) {
  const supabase = createClient();
  const channel = supabase.channel(`wordbank:${sessionId}`, { config: { broadcast: { self: false } } });
  if (onUse) channel.on('broadcast', { event: 'used' }, ({ payload }: { payload: WordUse }) => onUse(payload));
  channel.subscribe();
  return {
    send: (u: WordUse) => { void channel.send({ type: 'broadcast', event: 'used', payload: u }); },
    close: () => { void supabase.removeChannel(channel); },
  };
}
