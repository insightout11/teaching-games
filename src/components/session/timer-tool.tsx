'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { KitButton, KitChip, KitSection } from './widget-kit';

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
  // Instrument colours: cyan while running, amber in the last 10 s, rose at zero.
  const color = finished ? '#fda4af' : remaining <= 10 && remaining > 0 ? '#fcd34d' : '#67e8f9';
  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <div className="space-y-4 p-4">
      {/* Dial */}
      <div className="relative mx-auto aspect-square w-full max-w-[220px]">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={R} fill="rgba(0,0,0,.25)" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={R} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s', filter: `drop-shadow(0 0 6px ${color}88)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono text-5xl font-bold tracking-wider ${finished ? 'animate-pulse' : ''}`} style={{ color }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          {finished && <span className="mt-1 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-200">Time&apos;s up</span>}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-2">
        {!running ? (
          <KitButton tone="amber" solid className="min-w-[110px]" icon={<Play className="h-3.5 w-3.5" />} onClick={handleStart}>
            {remaining < totalSeconds && remaining > 0 ? 'Resume' : 'Start'}
          </KitButton>
        ) : (
          <KitButton tone="amber" className="min-w-[110px]" icon={<Pause className="h-3.5 w-3.5" />} onClick={handlePause}>Pause</KitButton>
        )}
        <KitButton icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={handleReset}>Reset</KitButton>
      </div>

      <KitSection label="Quick durations">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <KitChip key={p.seconds} on={totalSeconds === p.seconds && !running} onClick={() => handlePreset(p.seconds)}>{p.label}</KitChip>
          ))}
        </div>
      </KitSection>

      <KitSection label="Custom">
        <div className="flex items-center gap-2">
          <input
            type="number" min="0" max="99" value={customMin} onChange={(e) => setCustomMin(e.target.value)} placeholder="min"
            className="w-16 rounded-xl border border-white/15 bg-black/25 px-2 py-1.5 text-center text-sm text-white placeholder:text-white/35 focus:border-cyan-300/60 focus:outline-none"
          />
          <span className="text-white/50">:</span>
          <input
            type="number" min="0" max="59" value={customSec} onChange={(e) => setCustomSec(e.target.value)} placeholder="sec"
            className="w-16 rounded-xl border border-white/15 bg-black/25 px-2 py-1.5 text-center text-sm text-white placeholder:text-white/35 focus:border-cyan-300/60 focus:outline-none"
          />
          <KitButton onClick={handleCustomSet}>Set</KitButton>
        </div>
      </KitSection>
    </div>
  );
}
