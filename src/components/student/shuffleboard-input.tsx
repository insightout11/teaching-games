'use client';

import { useState, useRef, useCallback } from 'react';
import type { InputSpec } from '@/lib/input-spec';

interface ShuffleboardInputProps {
  spec: InputSpec;
  onSubmit: (value: string) => Promise<void>;
  isSubmitting: boolean;
  displayName?: string;
}

const MAX_DRAG_PX = 160;
const MAX_LATERAL_PX = 90;
const COURT_H = 260;
const COURT_W = 280;

export function ShuffleboardInput({ spec, onSubmit, isSubmitting, displayName }: ShuffleboardInputProps) {
  const isShooter = !!(displayName && (spec.perStudentData?.[displayName] as { isShooter?: boolean } | undefined)?.isShooter);

  if (!isShooter) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="text-5xl">👀</div>
        <p className="text-lg font-bold text-lc-text">Watch the board!</p>
        <p className="text-sm text-lc-text2">Your teammate is shooting…</p>
      </div>
    );
  }

  return <ShooterUI spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} />;
}

function ShooterUI({ spec, onSubmit, isSubmitting }: Omit<ShuffleboardInputProps, 'displayName'>) {
  const [power, setPower] = useState(0);
  const [angle, setAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasShot, setHasShot] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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
    const dy = dragStartRef.current.y - e.clientY; // positive = dragging up
    setPower(Math.min(1, Math.max(0, dy / MAX_DRAG_PX)));
    setAngle(Math.min(1, Math.max(-1, dx / MAX_LATERAL_PX)));
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
        <div className="text-5xl">🎯</div>
        <p className="text-xl font-black text-cyan-400">Shot fired!</p>
        <p className="text-sm text-lc-text2">Watch the board…</p>
      </div>
    );
  }

  // Puck visual position (center of court, moves as user drags)
  const puckX = COURT_W / 2 + angle * MAX_LATERAL_PX * 0.5;
  const puckY = COURT_H - 40 - power * (COURT_H - 80);

  // Arc preview: quadratic bezier from puck toward target
  const arcEndX = COURT_W / 2 + angle * MAX_LATERAL_PX * 0.8;
  const arcEndY = COURT_H - 40 - power * (COURT_H - 60);
  const arcCpX = COURT_W / 2 + angle * MAX_LATERAL_PX * 0.4;
  const arcCpY = COURT_H - 40 - power * (COURT_H - 50) * 0.5;

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {spec.prompt && (
        <p className="text-base text-cyan-400 font-semibold text-center px-4">{spec.prompt}</p>
      )}

      <div className="flex items-center gap-3">
        {/* Power bar */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-lc-text3 uppercase tracking-widest">Power</span>
          <div className="relative w-4 rounded-full overflow-hidden bg-lc-surface border border-lc-border" style={{ height: COURT_H }}>
            <div
              className="absolute bottom-0 left-0 right-0 rounded-full transition-none"
              style={{
                height: `${power * 100}%`,
                background: power > 0.75
                  ? 'linear-gradient(to top, #ef4444, #f97316)'
                  : power > 0.4
                  ? 'linear-gradient(to top, #f59e0b, #84cc16)'
                  : 'linear-gradient(to top, #3b82f6, #06b6d4)',
              }}
            />
          </div>
        </div>

        {/* Court area */}
        <div
          ref={containerRef}
          className="relative rounded-2xl border border-lc-border overflow-hidden cursor-crosshair touch-none"
          style={{ width: COURT_W, height: COURT_H, background: 'linear-gradient(to bottom, #0f172a, #1e293b)' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Lane lines */}
          {[0.33, 0.66].map((t) => (
            <div
              key={t}
              className="absolute inset-x-0 border-t border-dashed border-white/5"
              style={{ top: `${t * 100}%` }}
            />
          ))}

          {/* Center guide line */}
          <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-white/5" />

          {/* SVG arc preview */}
          {isDragging && power > 0.05 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${COURT_W} ${COURT_H}`}>
              <path
                d={`M ${COURT_W / 2} ${COURT_H - 40} Q ${arcCpX} ${arcCpY} ${arcEndX} ${arcEndY}`}
                fill="none"
                stroke="rgba(99,179,237,0.5)"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <circle cx={arcEndX} cy={arcEndY} r={5} fill="rgba(99,179,237,0.6)" />
            </svg>
          )}

          {/* Puck */}
          <div
            className="absolute w-10 h-10 rounded-full border-2 border-cyan-400 shadow-lg shadow-cyan-400/30 transition-none"
            style={{
              left: puckX - 20,
              top: puckY - 20,
              background: 'radial-gradient(circle at 35% 35%, #7dd3fc, #0369a1)',
              transform: isDragging ? 'scale(1.15)' : 'scale(1)',
            }}
          />

          {/* "Drag up" hint when not dragging */}
          {!isDragging && (
            <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
              <p className="text-xs text-white/30">drag up to shoot</p>
            </div>
          )}
        </div>
      </div>

      {/* Angle indicator */}
      <div className="flex items-center gap-2 text-xs text-lc-text3">
        <span>◀</span>
        <div className="w-32 h-1.5 bg-lc-surface rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-cyan-500 transition-none"
            style={{
              width: '50%',
              marginLeft: `${(angle * 0.5 + 0.25) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          />
        </div>
        <span>▶</span>
      </div>
    </div>
  );
}
