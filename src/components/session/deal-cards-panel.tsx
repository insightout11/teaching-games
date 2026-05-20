'use client';

import { useState, useCallback } from 'react';
import { Plane } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';

interface DealCardsPanelProps {
  sessionId: string;
  moduleKey: string;
}

export function DealCardsPanel({ sessionId, moduleKey }: DealCardsPanelProps) {
  const inputSpec = useSessionStore((s) => s.inputSpec);
  const isPromptActive = inputSpec !== null;
  const [isDealing, setIsDealing] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const confirmTimeoutRef = { current: null as ReturnType<typeof setTimeout> | null };

  const handleDeal = useCallback(async () => {
    setIsDealing(true);
    setConfirmation(null);
    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);

    try {
      const res = await fetch('/api/session/flight-cards/deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, moduleKey }),
      });
      const data = await res.json() as { studentCount?: number; message?: string; error?: string };

      if (!res.ok) {
        setConfirmation(data.error ?? 'Deal failed');
      } else if (!data.studentCount) {
        setConfirmation('No active participants yet');
      } else {
        const n = data.studentCount;
        setConfirmation(`Cards dealt to ${n} student${n !== 1 ? 's' : ''}`);
        confirmTimeoutRef.current = setTimeout(() => setConfirmation(null), 5000);
      }
    } catch {
      setConfirmation('Deal failed — check connection');
    } finally {
      setIsDealing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, moduleKey]);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Plane className="w-3.5 h-3.5 text-gray-500" />
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Flight Cards</h3>
      </div>
      <button
        onClick={handleDeal}
        disabled={isDealing || isPromptActive}
        className="w-full py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/50 text-xs font-semibold text-amber-300 transition-all disabled:opacity-40 active:scale-95"
      >
        {isDealing ? 'Dealing…' : 'Deal Cards'}
      </button>
      {isPromptActive ? (
        <p className="text-[10px] text-gray-600 mt-2 text-center leading-tight">Available between prompts</p>
      ) : confirmation ? (
        <p className="text-[10px] text-gray-500 mt-2 text-center leading-tight">{confirmation}</p>
      ) : null}
    </div>
  );
}
