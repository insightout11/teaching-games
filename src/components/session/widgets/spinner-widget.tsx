'use client';

import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Crosshair, RotateCw } from 'lucide-react';
import type { Student } from '@/lib/supabase/types';
import { useFocusBus } from '@/stores/focus-bus-store';
import { KitButton, KitChip, KitReadout, KitSection } from '../widget-kit';

/**
 * Spinner: a wheel for turns, topics or questions. Fill it with the class, or
 * with your own list (one per line). The result can become the topic.
 */
const SLICE_COLORS = ['#67e8f9', '#c4b5fd', '#6ee7b7', '#fcd34d', '#fda4af', '#93c5fd', '#f0abfc', '#5eead4'];

export function SpinnerContent({ students }: { students: Student[] }) {
  const reduce = useReducedMotion();
  const makeFocus = useFocusBus((s) => s.makeFocus);
  const [source, setSource] = useState<'class' | 'list'>(students.length ? 'class' : 'list');
  const [listText, setListText] = useState('');
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const entries = useMemo(() => {
    const raw = source === 'class' ? students.map((s) => s.name) : listText.split('\n');
    return raw.map((e) => e.trim()).filter(Boolean).slice(0, 24);
  }, [listText, source, students]);

  const n = entries.length;
  const slice = n ? 360 / n : 360;

  const spin = () => {
    if (n < 2 || spinning) return;
    const pick = Math.floor(Math.random() * n);
    // Land the picked slice under the pointer at the top, after a few full turns.
    const target = 360 - (pick * slice + slice / 2);
    const turns = 5 + Math.floor(Math.random() * 3);
    const base = angle - (angle % 360);
    const next = base + turns * 360 + target;
    setResult(null);
    setSpinning(true);
    setAngle(next);
    window.setTimeout(() => { setSpinning(false); setResult(entries[pick]); }, reduce ? 50 : 4200);
  };

  const R = 100;
  const arc = (i: number) => {
    const a0 = ((i * slice - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * slice - 90) * Math.PI) / 180;
    const large = slice > 180 ? 1 : 0;
    return `M0,0 L${R * Math.cos(a0)},${R * Math.sin(a0)} A${R},${R} 0 ${large} 1 ${R * Math.cos(a1)},${R * Math.sin(a1)} Z`;
  };

  return (
    <div className="space-y-3 p-3">
      <div className="flex flex-wrap gap-1.5">
        <KitChip on={source === 'class'} onClick={() => setSource('class')}>The class ({students.length})</KitChip>
        <KitChip on={source === 'list'} onClick={() => setSource('list')}>My list</KitChip>
      </div>
      {source === 'list' && (
        <KitSection label="One per line">
          <textarea
            value={listText}
            onChange={(e) => setListText(e.target.value)}
            rows={4}
            placeholder={'Pizza\nSushi\nTacos\nCurry'}
            className="w-full resize-none rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-cyan-300/60 focus:outline-none"
          />
        </KitSection>
      )}

      <div className="relative mx-auto aspect-square w-full max-w-[320px]">
        {/* Pointer */}
        <div className="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[18px] border-x-transparent border-t-amber-300 drop-shadow" />
        <motion.svg
          viewBox="-105 -105 210 210"
          className="h-full w-full"
          animate={{ rotate: angle }}
          transition={reduce ? { duration: 0 } : { duration: 4, ease: [0.12, 0.8, 0.2, 1] }}
        >
          {n === 0 ? (
            <circle r={R} fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.2)" />
          ) : (
            entries.map((e, i) => {
              const mid = ((i + 0.5) * slice - 90) * (Math.PI / 180);
              return (
                <g key={`${e}-${i}`}>
                  <path d={n === 1 ? `M0,0 m-${R},0 a${R},${R} 0 1,0 ${R * 2},0 a${R},${R} 0 1,0 -${R * 2},0` : arc(i)} fill={SLICE_COLORS[i % SLICE_COLORS.length]} stroke="#0b1220" strokeWidth="1.5" />
                  <text
                    x={Math.cos(mid) * R * 0.62}
                    y={Math.sin(mid) * R * 0.62}
                    fill="#0b1220"
                    fontSize={n > 12 ? 7 : n > 6 ? 9 : 11}
                    fontWeight={700}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${(i + 0.5) * slice}, ${Math.cos(mid) * R * 0.62}, ${Math.sin(mid) * R * 0.62})`}
                  >
                    {e.length > 14 ? `${e.slice(0, 13)}…` : e}
                  </text>
                </g>
              );
            })
          )}
          <circle r="12" fill="#0b1220" stroke="#fcd34d" strokeWidth="2" />
        </motion.svg>
      </div>

      <KitButton tone="amber" solid className="w-full" disabled={n < 2 || spinning} icon={<RotateCw className="h-3.5 w-3.5" />} onClick={spin}>
        {spinning ? 'Spinning…' : n < 2 ? 'Add at least two' : 'Spin'}
      </KitButton>

      {result && (
        <div className="space-y-2 text-center">
          <KitReadout className="text-2xl">{result}</KitReadout>
          {makeFocus && source === 'list' && (
            <KitButton tone="amber" className="mx-auto" icon={<Crosshair className="h-3.5 w-3.5" />} onClick={() => makeFocus({ title: result, credit: 'the spinner' })}>
              Make it the topic
            </KitButton>
          )}
        </div>
      )}
    </div>
  );
}
