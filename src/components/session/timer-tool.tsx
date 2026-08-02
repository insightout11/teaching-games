'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';

const PRESETS = [
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
];

interface TimerContentProps {
  sessionId?: string;
}

interface SharedTimerPayload {
  type?: 'timer';
  totalSeconds?: number;
  remainingSeconds?: number;
  running?: boolean;
  startedAt?: string | null;
}

function getSyncedRemaining(payload: SharedTimerPayload): number {
  const remaining = Math.max(0, Math.floor(payload.remainingSeconds ?? 60));
  if (!payload.running || !payload.startedAt) return remaining;
  const elapsed = Math.floor((Date.now() - new Date(payload.startedAt).getTime()) / 1000);
  return Math.max(0, remaining - Math.max(0, elapsed));
}

export function TimerContent({ sessionId }: TimerContentProps = {}) {
  const [totalSeconds, setTotalSeconds] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [customMin, setCustomMin] = useState('');
  const [customSec, setCustomSec] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const syncTimer = useCallback((state: {
    totalSeconds: number;
    remainingSeconds: number;
    running: boolean;
    startedAt: string | null;
  }) => {
    if (!sessionId || isMockMode()) return;

    void fetch('/api/session/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, state }),
    });
  }, [sessionId]);

  const applySharedTimer = useCallback((payload: SharedTimerPayload) => {
    if (payload.type && payload.type !== 'timer') return;
    const nextTotal = Math.max(1, Math.floor(payload.totalSeconds ?? 60));
    const nextRemaining = getSyncedRemaining(payload);

    setTotalSeconds(nextTotal);
    setRemaining(nextRemaining);
    setRunning(Boolean(payload.running && nextRemaining > 0));
    setFinished(Boolean(payload.running && nextRemaining <= 0));
  }, []);

  useEffect(() => {
    if (!sessionId || isMockMode()) return;

    const supabase = createClient();
    let cancelled = false;

    async function loadTimer() {
      const { data } = await supabase
        .from('session_private_state')
        .select('payload')
        .eq('session_id', sessionId)
        .eq('key', 'timer')
        .maybeSingle();

      if (!cancelled && data?.payload) {
        applySharedTimer(data.payload as SharedTimerPayload);
      }
    }

    void loadTimer();

    const channel = supabase
      .channel(`session-timer:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_private_state',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: { new: unknown }) => {
          const row = payload.new as { key?: string; payload?: SharedTimerPayload } | null;
          if (row?.key === 'timer' && row.payload) {
            applySharedTimer(row.payload);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [sessionId, applySharedTimer]);

  // Countdown logic
  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setRunning(false);
            setFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, remaining]);

  // Auto-clear finished flash after 3s
  useEffect(() => {
    if (finished) {
      const t = setTimeout(() => setFinished(false), 3000);
      return () => clearTimeout(t);
    }
  }, [finished]);

  const handlePreset = useCallback((seconds: number) => {
    setTotalSeconds(seconds);
    setRemaining(seconds);
    setRunning(false);
    setFinished(false);
    syncTimer({
      totalSeconds: seconds,
      remainingSeconds: seconds,
      running: false,
      startedAt: null,
    });
  }, [syncTimer]);

  const handleCustomSet = useCallback(() => {
    const m = parseInt(customMin) || 0;
    const s = parseInt(customSec) || 0;
    const total = m * 60 + s;
    if (total > 0) {
      setTotalSeconds(total);
      setRemaining(total);
      setRunning(false);
      setFinished(false);
      syncTimer({
        totalSeconds: total,
        remainingSeconds: total,
        running: false,
        startedAt: null,
      });
    }
  }, [customMin, customSec, syncTimer]);

  const handleStart = () => {
    const nextRemaining = remaining <= 0 ? totalSeconds : remaining;
    if (remaining <= 0) setRemaining(totalSeconds);
    setFinished(false);
    setRunning(true);
    syncTimer({
      totalSeconds,
      remainingSeconds: nextRemaining,
      running: true,
      startedAt: new Date().toISOString(),
    });
  };
  const handlePause = () => {
    setRunning(false);
    syncTimer({
      totalSeconds,
      remainingSeconds: remaining,
      running: false,
      startedAt: null,
    });
  };
  const handleReset = () => {
    setRunning(false);
    setRemaining(totalSeconds);
    setFinished(false);
    syncTimer({
      totalSeconds,
      remainingSeconds: totalSeconds,
      running: false,
      startedAt: null,
    });
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;

  return (
    <div className="p-4 space-y-4">
      {/* Countdown Display */}
      <div className="text-center">
        <div className={`text-5xl font-mono font-bold tracking-wider ${
          finished ? 'text-red-400 animate-pulse' : remaining <= 10 && remaining > 0 ? 'text-orange-400' : 'text-cyan-400'
        }`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              finished ? 'bg-red-400' : remaining <= 10 ? 'bg-orange-400' : 'bg-cyan-500'
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {finished && (
          <p className="text-red-400 text-sm font-semibold mt-2 animate-pulse">Time&apos;s Up!</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        {!running ? (
          <button
            onClick={handleStart}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-sm font-semibold hover:scale-105 active:scale-95 transition-all text-white"
          >
            {remaining < totalSeconds && remaining > 0 ? 'Resume' : 'Start'}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-sm font-semibold hover:scale-105 active:scale-95 transition-all text-white"
          >
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Presets */}
      <div>
        <p className="text-xs uppercase tracking-wider opacity-60 mb-2">Quick durations</p>
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.seconds}
              onClick={() => handlePreset(p.seconds)}
              className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                totalSeconds === p.seconds && !running
                  ? 'bg-cyan-500/30 text-cyan-300'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom time */}
      <div>
        <p className="text-xs uppercase tracking-wider opacity-60 mb-2">Custom duration</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="99"
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            placeholder="min"
            className="w-16 px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white text-center placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
          <span className="opacity-60">:</span>
          <input
            type="number"
            min="0"
            max="59"
            value={customSec}
            onChange={(e) => setCustomSec(e.target.value)}
            placeholder="sec"
            className="w-16 px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white text-center placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
          <button
            onClick={handleCustomSet}
            className="px-3 py-1.5 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-colors"
          >
            Set timer
          </button>
        </div>
      </div>
    </div>
  );
}
