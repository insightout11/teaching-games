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

const AREA_SIZE = 300;
const CX = AREA_SIZE / 2;
const CY = AREA_SIZE / 2;
const MAX_PULL_R = 112;   // max drag radius (pixels)
const PUCK_R = 20;

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
  const [angleRad, setAngleRad] = useState(0);
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
    const dy = e.clientY - dragStartRef.current.y;
    const dist = Math.hypot(dx, dy);
    const p = Math.min(1, dist / MAX_PULL_R);
    const a = dist > 2 ? Math.atan2(-dy, -dx) : 0;  // shoot opposite to drag direction
    setPower(p);
    setAngleRad(a);

    const now = Date.now();
    if (now - lastBroadcastRef.current >= 50 && channelRef.current) {
      lastBroadcastRef.current = now;
      void channelRef.current.send({ type: 'broadcast', event: 'aim', payload: { power: p, angleRad: a } });
    }
  }, [isDragging]);

  const handlePointerUp = useCallback(async () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (power > 0.05) {
      setHasShot(true);
      await onSubmit(JSON.stringify({ power, angleRad }));
    } else {
      setPower(0);
      setAngleRad(0);
    }
  }, [isDragging, power, angleRad, onSubmit]);

  if (hasShot) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <Target size={52} className="text-cyan-400 animate-bounce" />
        <p className="text-xl font-black text-cyan-400">Shot fired!</p>
        <p className="text-sm text-lc-text2">Watch the board…</p>
      </div>
    );
  }

  const powerHex = power > 0.75 ? '#ef4444' : power > 0.4 ? '#f59e0b' : '#3b82f6';
  const powerLabel = power > 0.75 ? 'MAX' : power > 0.4 ? 'MED' : power > 0.1 ? 'LOW' : '';

  // Drag pull position (clamped within radius)
  const dragDist = isDragging ? Math.min(MAX_PULL_R, power * MAX_PULL_R) : 0;
  const pullAngle = angleRad + Math.PI; // pull direction = opposite of shot
  const pullX = CX + Math.cos(pullAngle) * dragDist;
  const pullY = CY + Math.sin(pullAngle) * dragDist;

  // Shot direction arrow (from center, opposite to pull)
  const arrowLen = power * (MAX_PULL_R + 20);
  const arrowX = CX + Math.cos(angleRad) * arrowLen;
  const arrowY = CY + Math.sin(angleRad) * arrowLen;

  // Arrowhead points
  const headLen = 14;
  const headAngle = 0.42; // radians
  const ah1x = arrowX - headLen * Math.cos(angleRad - headAngle);
  const ah1y = arrowY - headLen * Math.sin(angleRad - headAngle);
  const ah2x = arrowX - headLen * Math.cos(angleRad + headAngle);
  const ah2y = arrowY - headLen * Math.sin(angleRad + headAngle);

  // Compass direction label
  const deg = ((angleRad * 180 / Math.PI) % 360 + 360) % 360;
  const compass = deg < 22.5 || deg >= 337.5 ? '→' : deg < 67.5 ? '↗' : deg < 112.5 ? '↑' : deg < 157.5 ? '↖' : deg < 202.5 ? '←' : deg < 247.5 ? '↙' : deg < 292.5 ? '↓' : '↘';

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {spec.prompt && (
        <p className="text-sm font-semibold text-cyan-400 text-center px-2">{spec.prompt}</p>
      )}

      {/* Aim pad */}
      <div
        className="relative rounded-full overflow-hidden touch-none"
        style={{
          width: AREA_SIZE,
          height: AREA_SIZE,
          background: 'radial-gradient(ellipse at 50% 50%, #071a0e 0%, #040c07 55%, #030712 100%)',
          boxShadow: '0 0 0 2px rgba(34,197,94,0.15) inset, 0 4px 24px rgba(0,0,0,0.6)',
          cursor: 'crosshair',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <svg
          className="absolute inset-0 pointer-events-none"
          width={AREA_SIZE}
          height={AREA_SIZE}
          viewBox={`0 0 ${AREA_SIZE} ${AREA_SIZE}`}
        >
          {/* Guide rings — power zones */}
          <circle cx={CX} cy={CY} r={MAX_PULL_R * 0.35} fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="1" />
          <circle cx={CX} cy={CY} r={MAX_PULL_R * 0.68} fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="1" />
          <circle cx={CX} cy={CY} r={MAX_PULL_R}        fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="1.5" strokeDasharray="4 6" />

          {/* Cardinal tick marks */}
          {[0, 90, 180, 270].map(d => {
            const r = d * Math.PI / 180;
            return (
              <line key={d}
                x1={CX + Math.cos(r) * (MAX_PULL_R + 4)}
                y1={CY + Math.sin(r) * (MAX_PULL_R + 4)}
                x2={CX + Math.cos(r) * (MAX_PULL_R + 12)}
                y2={CY + Math.sin(r) * (MAX_PULL_R + 12)}
                stroke="rgba(99,102,241,0.20)" strokeWidth="1.5" strokeLinecap="round"
              />
            );
          })}

          {/* Idle hint */}
          {!isDragging && (
            <>
              <circle cx={CX} cy={CY} r={22} fill="none" stroke="rgba(99,102,241,0.18)" strokeWidth="1.5" />
              <circle cx={CX} cy={CY} r={3}  fill="rgba(99,102,241,0.30)" />
              <text x={CX} y={CY + 44} textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize="10" fontWeight="600">DRAG TO AIM</text>
            </>
          )}

          {/* Shot direction arrow */}
          {isDragging && power > 0.05 && (
            <>
              {/* Dashed trajectory line */}
              <line x1={CX} y1={CY} x2={arrowX} y2={arrowY}
                stroke={powerHex} strokeWidth="2.5" strokeDasharray="9 6"
                strokeLinecap="round" opacity="0.75" />
              {/* Arrowhead */}
              <polyline points={`${ah1x},${ah1y} ${arrowX},${arrowY} ${ah2x},${ah2y}`}
                fill="none" stroke={powerHex} strokeWidth="2.5" strokeLinejoin="round"
                strokeLinecap="round" opacity="0.80" />
              {/* Landing dot */}
              <circle cx={arrowX} cy={arrowY} r={5} fill={powerHex} opacity="0.45" />
            </>
          )}

          {/* Rubber band lines from pull position to center */}
          {isDragging && power > 0.03 && (
            <>
              <line x1={CX - 12} y1={CY - 12} x2={pullX} y2={pullY}
                stroke={powerHex} strokeWidth="3" strokeLinecap="round" opacity="0.65" />
              <line x1={CX + 12} y1={CY + 12} x2={pullX} y2={pullY}
                stroke={powerHex} strokeWidth="3" strokeLinecap="round" opacity="0.65" />
            </>
          )}
        </svg>

        {/* Puck — at pull position while dragging, at center when idle */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: PUCK_R * 2,
            height: PUCK_R * 2,
            left: (isDragging ? pullX : CX) - PUCK_R,
            top:  (isDragging ? pullY : CY) - PUCK_R,
            background: isDragging
              ? `radial-gradient(circle at 35% 30%, #fff, ${powerHex})`
              : 'radial-gradient(circle at 35% 30%, #bfdbfe, #1d4ed8)',
            border: `2.5px solid ${isDragging ? powerHex : '#60a5fa'}`,
            boxShadow: isDragging
              ? `0 0 22px ${powerHex}90, 0 0 8px ${powerHex}`
              : '0 0 14px #3b82f660',
            transform: isDragging ? 'scale(1.15)' : 'scale(1)',
            transition: isDragging ? 'none' : 'left 0.2s, top 0.2s, transform 0.1s',
          }}
        />

        {/* Power label while dragging */}
        {isDragging && powerLabel && (
          <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none">
            <span
              className="text-xs font-black px-3 py-1 rounded-full"
              style={{ color: powerHex, background: powerHex + '22', border: `1px solid ${powerHex}44` }}
            >
              {powerLabel}
            </span>
          </div>
        )}

        {/* Idle hint at bottom */}
        {!isDragging && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
            <p className="text-[11px] text-white/22 tracking-wide">drag in any direction</p>
          </div>
        )}
      </div>

      {/* Power + direction readout */}
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
          <span className="text-[10px] text-white/30 uppercase tracking-widest w-11 shrink-0">Dir</span>
          <div className="flex-1 relative h-2.5 bg-black/50 rounded-full overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
            <div
              className="absolute top-0.5 bottom-0.5 w-2.5 rounded-full bg-cyan-400"
              style={{ left: `calc(${((angleRad / (2 * Math.PI) + 1) % 1) * 100}% - 5px)`, transition: 'left 0s' }}
            />
          </div>
          <span className="text-[10px] text-white/30 w-8 text-right tabular-nums">{compass}</span>
        </div>
      </div>
    </div>
  );
}
