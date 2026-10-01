import { createClient } from '@/lib/supabase/client';
import { grammarFamily } from '@/lib/grammar';

/**
 * Grammar Hunt: every phone has a secret mission ("use the past simple twice") while a grammar
 * target is set, in any activity. Stamps travel on a broadcast channel (no table, like the hand
 * queue); each phone re-announces its total, so the teacher's tally recovers after a reload.
 */
export type HuntMessage = { type: 'stamps'; clientId: string; name: string; count: number };

export const HUNT_HEARTBEAT_MS = 8000;
export const HUNT_GOAL = 2;
export const HUNT_MAX = 3; // the goal + one bonus stamp

export function openHuntChannel(sessionId: string, onMessage: (m: HuntMessage) => void) {
  const supabase = createClient();
  const channel = supabase.channel(`hunt:${sessionId}`, { config: { broadcast: { self: false } } });
  channel.on('broadcast', { event: 'hunt' }, ({ payload }: { payload: HuntMessage }) => onMessage(payload));
  channel.subscribe();
  return {
    send: (m: HuntMessage) => { void channel.send({ type: 'broadcast', event: 'hunt', payload: m }); },
    close: () => { void supabase.removeChannel(channel); },
  };
}

/** The mission text for a grammar target (family-aware, spoken). */
export function huntMission(target: string): string {
  switch (grammarFamily(target)) {
    case 'comparisons': return 'Compare two things out loud, twice (bigger than, the best…)';
    case 'questions': return 'Ask two real questions out loud';
    case 'modals': return `Use "${target}" twice when you speak`;
    case 'conditionals': return 'Say two "If…, …" sentences out loud';
    default: return `Use the ${target} twice when you speak`;
  }
}
