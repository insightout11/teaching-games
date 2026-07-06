'use client';

import { useEffect, useState } from 'react';
import { useSessionStore } from '@/stores/session-store';
import type { Difficulty } from '@/lib/difficulty';
import { validateTripScript, type TripStopKey, type TripScriptAnchors, type TransportKind } from '@/lib/trip-script';
import type { ExchangeLine } from './performed-exchange';

interface TripScriptParams {
  stop: TripStopKey;
  city: string;
  difficulty: Difficulty;
  tier: string;
  anchors?: TripScriptAnchors;
  /** Getting There only: ticketed (ticket desk) vs hailed (taxi rank) — picks a different scene. */
  kind?: TransportKind;
}

/**
 * Fetches AI-varied lines for a scripted Travel stop from the growing cached pool. Returns the
 * validated raw lines (tokens NOT yet substituted — the activity applies per-traveller tokens),
 * or null while loading / on any failure so the caller uses its deterministic script.
 */
export function useTripScript(params: TripScriptParams | null): ExchangeLine[] | null {
  const addSeenCacheId = useSessionStore((s) => s.addSeenCacheId);
  const [lines, setLines] = useState<ExchangeLine[] | null>(null);

  const key = params ? `${params.stop}|${params.city}|${params.tier}|${params.kind ?? ''}` : '';

  useEffect(() => {
    if (!params || !params.city) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/trip-script/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stop: params.stop,
            city: params.city,
            tier: params.tier,
            difficulty: params.difficulty,
            anchors: params.anchors,
            kind: params.kind,
            excludeCacheIds: useSessionStore.getState().seenCacheIds,
          }),
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { lines: ExchangeLine[] | null; cacheId?: string | null };
        if (cancelled || !data.lines) return;
        const valid = validateTripScript(data.lines, params.stop);
        if (valid && !cancelled) {
          setLines(valid as ExchangeLine[]);
          if (data.cacheId) addSeenCacheId(data.cacheId);
        }
      } catch {
        /* deterministic fallback — nothing to do */
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return lines;
}
