'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Crosshair, Loader2, RefreshCw, RotateCw, X } from 'lucide-react';
import type { Student } from '@/lib/supabase/types';
import { useFocusBus } from '@/stores/focus-bus-store';
import { useSessionStore } from '@/stores/session-store';
import { KitButton, KitChip, KitReadout, KitSection } from '../widget-kit';

/**
 * Spinner: a wheel for turns, topics or questions. Fill it with the class, with
 * your own list (one per line), or with suggested topics (written live for what the
 * room is talking about, fresh ones, or ones this class has done before). The result
 * can become the topic with one tap: it never switches the room by itself.
 */
type TopicFlavour = 'around' | 'new' | 'ours';
const FLAVOURS: Array<{ id: TopicFlavour; label: string; hint: string }> = [
  { id: 'around', label: 'Around our topic', hint: 'Parts of what we are talking about now' },
  { id: 'new', label: 'Something new', hint: 'Fresh topics for this class' },
  { id: 'ours', label: 'From our class', hint: 'Topics from earlier lessons' },
];
const SLICE_COLORS = ['#67e8f9', '#c4b5fd', '#6ee7b7', '#fcd34d', '#fda4af', '#93c5fd', '#f0abfc', '#5eead4'];

export function SpinnerContent({ students }: { students: Student[] }) {
  const reduce = useReducedMotion();
  const makeFocus = useFocusBus((s) => s.makeFocus);
  const sessionId = useSessionStore((st) => st.sessionId);
  const roomTopic = useSessionStore((st) => st.settings.customTopic);
  const [source, setSource] = useState<'class' | 'list' | 'topics'>(students.length ? 'class' : 'list');
  const [flavour, setFlavour] = useState<TopicFlavour>('around');
  const [topics, setTopics] = useState<string[]>([]);
  const [topicsBusy, setTopicsBusy] = useState(false);
  const [topicsNote, setTopicsNote] = useState<string | null>(null);
  const [listText, setListText] = useState('');
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const entries = useMemo(() => {
    const raw = source === 'class' ? students.map((s) => s.name) : source === 'topics' ? topics : listText.split('\n');
    return raw.map((e) => e.trim()).filter(Boolean).slice(0, 24);
  }, [listText, source, students, topics]);

  // Fill the wheel with suggested topics. `keep` are topics the teacher wants to stay (a reroll replaces the rest).
  const loadTopics = useCallback(async (which: TopicFlavour, keep: string[] = []) => {
    if (!sessionId) { setTopicsNote('Topics are available during a class.'); return; }
    const topic = roomTopic?.trim() && roomTopic.trim().toLowerCase() !== 'general' ? roomTopic.trim() : '';
    if (which === 'around' && !topic) { setTopics([]); setTopicsNote('Set a topic in the bar at the top first, or choose "Something new".'); return; }
    setTopicsBusy(true);
    setTopicsNote(null);
    setResult(null);
    try {
      const res = await fetch(`/api/session/${encodeURIComponent(sessionId)}/spinner-topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flavour: which, topic, avoid: keep }),
      });
      const data = (await res.json().catch(() => ({}))) as { topics?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not get topics. Try again.');
      const next = [...keep, ...(data.topics ?? [])].slice(0, 8);
      setTopics(next);
      if (next.length < 2) setTopicsNote(which === 'ours' ? 'This class has no earlier topics on record yet.' : 'Could not get topics. Try again.');
    } catch (e) {
      setTopicsNote(e instanceof Error ? e.message : 'Could not get topics. Try again.');
    } finally {
      setTopicsBusy(false);
    }
  }, [roomTopic, sessionId]);

  const chooseTopics = (which: TopicFlavour) => {
    setSource('topics');
    setFlavour(which);
    void loadTopics(which);
  };

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
  // One text size for every slice, so short names are not bigger than long ones.
  const labelSize = useMemo(() => {
    const room = R - 6 - 16;
    const need = entries.map((e) => {
      const w = e.trim().split(' ');
      const half = w.length > 1 ? Math.max(w.slice(0, Math.ceil(w.length / 2)).join(' ').length, w.slice(Math.ceil(w.length / 2)).join(' ').length) : e.length;
      return room / (Math.min(e.length, Math.max(half, e.length > 12 ? half : e.length)) * 0.56);
    });
    return Math.max(7, Math.min(12, ...need));
  }, [entries]);
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
        <KitChip on={source === 'topics'} onClick={() => (source === 'topics' ? undefined : chooseTopics(flavour))}>Topics</KitChip>
      </div>
      {source === 'topics' && (
        <KitSection label="Suggested topics">
          <div className="flex flex-wrap gap-1.5">
            {FLAVOURS.map((f) => (
              <KitChip key={f.id} on={flavour === f.id} onClick={() => chooseTopics(f.id)}>
                <span title={f.hint}>{f.label}</span>
              </KitChip>
            ))}
          </div>
          {/* On the wheel now: tap one to take it off before spinning. */}
          {topics.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {topics.map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={spinning}
                  onClick={() => { setTopics((prev) => prev.filter((x) => x !== t)); setResult(null); }}
                  title="Take this one off the wheel"
                  className="flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 text-xs text-white/85 hover:border-white/35 disabled:opacity-50"
                >
                  {t}
                  <X className="h-3 w-3 text-white/45" aria-hidden />
                </button>
              ))}
            </div>
          )}
          {topicsNote && <p className="mt-2 text-xs text-amber-200/90">{topicsNote}</p>}
          <KitButton
            tone="plain"
            className="mt-2"
            disabled={topicsBusy || spinning}
            icon={topicsBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => void loadTopics(flavour)}
          >
            {topicsBusy ? 'Thinking…' : 'New topics'}
          </KitButton>
        </KitSection>
      )}
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
              return (
                <g key={`${e}-${i}`}>
                  <path d={n === 1 ? `M0,0 m-${R},0 a${R},${R} 0 1,0 ${R * 2},0 a${R},${R} 0 1,0 -${R * 2},0` : arc(i)} fill={SLICE_COLORS[i % SLICE_COLORS.length]} stroke="#0b1220" strokeWidth="1.5" />
                  <SliceLabel text={e} index={i} slice={slice} n={n} r={R} maxSize={labelSize} />
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
          {makeFocus && source !== 'class' && (
            <KitButton tone="amber" className="mx-auto" icon={<Crosshair className="h-3.5 w-3.5" />} onClick={() => makeFocus({ title: result, credit: 'the spinner' })}>
              Make it the topic
            </KitButton>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * A slice's label, running from the centre out to the rim (the long way across a slice), sized to fit: long names
 * break onto two lines, and labels on the left half are turned so none reads upside down.
 */
function SliceLabel({ text, index, slice, n, r, maxSize = 12 }: { text: string; index: number; slice: number; n: number; r: number; maxSize?: number }) {
  const angle = (index + 0.5) * slice - 90; // from the centre towards the middle of the slice
  const flip = angle > 90 && angle < 270;
  const inner = 16, outer = r - 6;
  const length = outer - inner; // room along the radius
  const mid = (inner + outer) / 2;
  // How tall a line may be: the slice's width at the label's middle, shared by up to two lines.
  const across = n === 1 ? 60 : 2 * mid * Math.sin(Math.PI / n);
  const words = text.trim().split(/\s+/);
  const oneLine = text.trim();
  // Two lines when a single line would have to shrink a lot and there is a space to break at.
  const fitOne = Math.min(12, length / (oneLine.length * 0.56), across * 0.62);
  let lines = [oneLine];
  if (fitOne < 8 && words.length > 1) {
    let best = 1;
    let bestDiff = Infinity;
    for (let k = 1; k < words.length; k++) {
      const d = Math.abs(words.slice(0, k).join(' ').length - words.slice(k).join(' ').length);
      if (d < bestDiff) { bestDiff = d; best = k; }
    }
    lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')];
  }
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.max(5, Math.min(maxSize, length / (longest * 0.56), (across * 0.62) / lines.length));
  const shown = lines.map((l) => (l.length * size * 0.56 > length ? `${l.slice(0, Math.max(3, Math.floor(length / (size * 0.56)) - 1))}…` : l));
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * mid, y = Math.sin(rad) * mid;
  return (
    <text
      x={x}
      y={y}
      fill="#0b1220"
      fontSize={size}
      fontWeight={700}
      textAnchor="middle"
      dominantBaseline="middle"
      transform={`rotate(${flip ? angle + 180 : angle}, ${x}, ${y})`}
    >
      {shown.map((l, k) => (
        <tspan key={k} x={x} dy={k === 0 ? `${-(shown.length - 1) * 0.55}em` : '1.1em'}>{l}</tspan>
      ))}
    </text>
  );
}
