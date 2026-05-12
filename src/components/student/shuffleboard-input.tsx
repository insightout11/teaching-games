'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { InputSpec } from '@/lib/input-spec';
import { Eye, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ShuffleboardInputProps {
  spec: InputSpec;
  onSubmit: (value: string) => Promise<void>;
  isSubmitting: boolean;
  displayName?: string;
}

const AREA_W = 300;
const AREA_H = 340;
const CX = AREA_W / 2;
const PEG_Y = 60;           // pegs near top (fork tips)
const PUCK_REST_Y = 78;     // puck rests just below pegs
const PUCK_R = 20;
const PEG_SPREAD = 54;
const MAX_PULL_Y = 200;     // max downward pull
const MAX_PULL_X = 78;

export function ShuffleboardInput({ spec, onSubmit, isSubmitting, displayName }: ShuffleboardInputProps) {
  const isShooter = !!(displayName && (spec.perStudentData?.[displayName] as { isShooter?: boolean } | undefined)?.isShooter);

  if (!isShooter) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <Eye size={48} className="text-lc-text2" />
        <p className="text-lg font-bold text-lc-text">Watch the board!</p>
        <p className="text-sm text-lc-text2">Your teammate is shooting…</p>
      </div>
    );
  }

  return <ShooterUI spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} sessionId={spec.sessionId} />;
}

function ShooterUI({ spec, onSubmit, isSubmitting, sessionId }: Omit<ShuffleboardInputProps, 'displayName'> & { sessionId?: string }) {
  const [power, setPower] = useState(0);
  const [angle, setAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasShot, setHasShot] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastBroadcastRef = useRef(0);

  useEffect(() => {
    if (!sessionId) return;
    const sb = createClient();
    const ch = sb.channel(`${sessionId}-aim`);
    ch.subscribe();
    channelRef.current = ch;
    return () => { void ch.unsubscribe(); channelRef.current = null; };
  }, [sessionId]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (hasShot || isSubmitting) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [hasShot, isSubmitting]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;  // drag DOWN = positive = more power
    const p = Math.min(1, Math.max(0, dy / MAX_PULL_Y));
    const a = Math.min(1, Math.max(-1, dx / MAX_PULL_X));
    setPower(p);
    setAngle(a);

    const now = Date.now();
    if (now - lastBroadcastRef.current >= 50 && channelRef.current) {
      lastBroadcastRef.current = now;
      void channelRef.current.send({ type: 'broadcast', event: 'aim', payload: { power: p, angle: a } });
    }
  }, [isDragging]);

  const handlePointerUp = useCallback(async () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (power > 0.05) {
      setHasShot(true);
      await onSubmit(JSON.stringify({ power, angle }));
    } else {
      setPower(0);
      setAngle(0);
    }
  }, [isDragging, power, angle, onSubmit]);

  if (hasShot) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <Target size={52} className="text-cyan-400 animate-bounce" />
        <p className="text-xl font-black text-cyan-400">Shot fired!</p>
        <p className="text-sm text-lc-text2">Watch the board…</p>
      </div>
    );
  }

  // Puck position: starts at top (PUCK_REST_Y), pulled DOWN as power increases
  const puckX = CX + angle * MAX_PULL_X * 0.85;
  const puckY = PUCK_REST_Y + power * MAX_PULL_Y * 0.88;

  const powerHex = power > 0.75 ? '#ef4444' : power > 0.4 ? '#f59e0b' : '#3b82f6';
  const powerLabel = power > 0.75 ? 'MAX' : power > 0.4 ? 'MED' : power > 0.1 ? 'LOW' : '';

  // Trajectory arc shoots UP from puck toward top of area
  const trajEndX = puckX + angle * 55 * power;
  const trajEndY = Math.max(8, puckY - power * (AREA_H - 60));
  const trajCpX = (puckX + trajEndX) / 2 + angle * 25 * power;
  const trajCpY = puckY - power * (AREA_H - 60) * 0.52;

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {spec.prompt && (
        <p className="text-sm font-semibold text-cyan-400 text-center px-2">{spec.prompt}</p>
      )}

      {/* Main launch area */}
      <div
        className="relative rounded-2xl overflow-hidden touch-none"
        style={{
          width: AREA_W,
          height: AREA_H,
          background: 'radial-gradient(ellipse at 50% 12%, #071a0e 0%, #040c07 55%, #030712 100%)',
          boxShadow: '0 0 0 1px rgba(34,197,94,0.12) inset, 0 4px 24px rgba(0,0,0,0.6)',
          cursor: 'crosshair',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <svg
          className="absolute inset-0 pointer-events-none"
          width={AREA_W}
          height={AREA_H}
          viewBox={`0 0 ${AREA_W} ${AREA_H}`}
        >
          {/* Slingshot Y-frame arms */}
          <line x1={CX} y1={AREA_H - 20} x2={CX - PEG_SPREAD} y2={PEG_Y + 12}
            stroke="#1e293b" strokeWidth="9" strokeLinecap="round" />
          <line x1={CX} y1={AREA_H - 20} x2={CX + PEG_SPREAD} y2={PEG_Y + 12}
            stroke="#1e293b" strokeWidth="9" strokeLinecap="round" />
          {/* Handle */}
          <rect x={CX - 5} y={AREA_H - 65} width={10} height={55} rx="5" fill="#1e293b" />

          {/* Idle targeting rings at top (where puck rests) */}
          {!isDragging && (
            <>
              <circle cx={CX} cy={PUCK_REST_Y} r={46} fill="none" stroke="rgba(99,102,241,0.10)" strokeWidth="1" strokeDasharray="5 5" />
              <circle cx={CX} cy={PUCK_REST_Y} r={28} fill="none" stroke="rgba(99,102,241,0.14)" strokeWidth="1" />
              <line x1={CX} y1={PUCK_REST_Y + 14} x2={CX} y2={PUCK_REST_Y + 32}
                stroke="rgba(99,102,241,0.25)" strokeWidth="1.5" strokeLinecap="round" />
              <text x={CX} y={PUCK_REST_Y + 46} textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize="9" fontWeight="600">PULL DOWN</text>
            </>
          )}

          {/* Trajectory arc (goes UP toward top of area) */}
          {isDragging && power > 0.05 && (
            <>
              <path
                d={`M ${puckX} ${puckY} Q ${trajCpX} ${trajCpY} ${trajEndX} ${trajEndY}`}
                fill="none"
                stroke={powerHex}
                strokeWidth="2.5"
                strokeDasharray="8 6"
                opacity="0.6"
                strokeLinecap="round"
              />
              <circle cx={trajEndX} cy={trajEndY} r={5} fill={powerHex} opacity="0.45" />
            </>
          )}

          {/* Rubber bands */}
          {isDragging && power > 0.03 && (
            <>
              <line
                x1={CX - PEG_SPREAD} y1={PEG_Y}
                x2={puckX} y2={puckY}
                stroke={powerHex} strokeWidth="4" strokeLinecap="round" opacity="0.8"
              />
              <line
                x1={CX + PEG_SPREAD} y1={PEG_Y}
                x2={puckX} y2={puckY}
                stroke={powerHex} strokeWidth="4" strokeLinecap="round" opacity="0.8"
              />
            </>
          )}

          {/* Pegs (fork tips) */}
          <circle cx={CX - PEG_SPREAD} cy={PEG_Y} r={8} fill="#1e293b" stroke={isDragging ? powerHex : '#475569'} strokeWidth="2" />
          <circle cx={CX + PEG_SPREAD} cy={PEG_Y} r={8} fill="#1e293b" stroke={isDragging ? powerHex : '#475569'} strokeWidth="2" />
          <circle cx={CX - PEG_SPREAD} cy={PEG_Y} r={3.5} fill={isDragging ? powerHex : '#64748b'} />
          <circle cx={CX + PEG_SPREAD} cy={PEG_Y} r={3.5} fill={isDragging ? powerHex : '#64748b'} />
        </svg>

        {/* Puck */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: PUCK_R * 2,
            height: PUCK_R * 2,
            left: puckX - PUCK_R,
            top: puckY - PUCK_R,
            background: isDragging
              ? `radial-gradient(circle at 35% 30%, #fff, ${powerHex})`
              : 'radial-gradient(circle at 35% 30%, #bfdbfe, #1d4ed8)',
            border: `2.5px solid ${isDragging ? powerHex : '#60a5fa'}`,
            boxShadow: isDragging
              ? `0 0 22px ${powerHex}90, 0 0 8px ${powerHex}`
              : '0 0 14px #3b82f660',
            transform: isDragging ? 'scale(1.18)' : 'scale(1)',
            transition: 'transform 0.05s, border-color 0.1s, box-shadow 0.1s',
          }}
        />

        {/* Idle hint at bottom */}
        {!isDragging && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
            <p className="text-[11px] text-white/22 tracking-wide">hold &amp; drag down to shoot</p>
          </div>
        )}

        {/* Power label while dragging */}
        {isDragging && powerLabel && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
            <span
              className="text-xs font-black px-3 py-1 rounded-full"
              style={{ color: powerHex, background: powerHex + '22', border: `1px solid ${powerHex}44` }}
            >
              {powerLabel}
            </span>
          </div>
        )}
      </div>

      {/* Power + angle readout */}
      <div className="w-full max-w-[300px] space-y-1.5 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30 uppercase tracking-widest w-11 shrink-0">Power</span>
          <div className="flex-1 h-2.5 bg-black/50 rounded-full overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${power * 100}%`,
                background: power > 0.75
                  ? 'linear-gradient(to right, #dc2626, #f97316)'
                  : power > 0.4
                  ? 'linear-gradient(to right, #d97706, #84cc16)'
                  : 'linear-gradient(to right, #2563eb, #06b6d4)',
                transition: 'width 0s',
              }}
            />
          </div>
          <span className="text-[10px] text-white/30 w-8 text-right tabular-nums">{Math.round(power * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30 uppercase tracking-widest w-11 shrink-0">Angle</span>
          <div className="flex-1 relative h-2.5 bg-black/50 rounded-full overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
            <div
              className="absolute top-0.5 bottom-0.5 w-2.5 rounded-full bg-cyan-400"
              style={{ left: `calc(${(angle * 0.5 + 0.5) * 100}% - 5px)`, transition: 'left 0s' }}
            />
          </div>
          <span className="text-[10px] text-white/30 w-8 text-right tabular-nums">
            {angle > 0.05 ? `R${Math.round(angle * 55)}°` : angle < -0.05 ? `L${Math.round(-angle * 55)}°` : '0°'}
          </span>
        </div>
      </div>
    </div>
  );
}
