'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Crosshair, RotateCcw } from 'lucide-react';
import type { ComprehensionQuestion } from '@/types/source-material';
import type { ActivityProps } from '../types';
import type { InputSpec } from '@/lib/input-spec';
import { KitButton, KitLabel } from '@/components/session/widget-kit';
import { useSessionStore } from '@/stores/session-store';

// Briefing with a mission: instead of a quiz AFTER the video, phones get the questions as a
// "catch these" mission WHILE it plays (answer in any order, change your mind). The debrief
// then walks through each one: the answer, how many caught it, the line that says it.

export type MissionAnswers = Record<string, { name: string; studentId: string | null; picks: Record<number, number> }>;

export function missionSpec(questions: ComprehensionQuestion[]): InputSpec {
  return {
    type: 'confirm',
    gameKey: 'briefing-mission',
    prompt: 'Your mission: catch these while you watch!',
    perStudentData: { __room: true, __mission: questions.map((q) => ({ q: q.question, options: q.options })) },
    allowMultiple: true,
    stableInput: true,
  };
}

/** Apply one phone submission ({ i, a } JSON) to the answers map. */
export function applyMissionVote(prev: MissionAnswers, vote: { clientId: string; displayName: string; studentId?: string | null; choice: string }, count: number): MissionAnswers {
  let msg: { i?: number; a?: number } = {};
  try { msg = JSON.parse(vote.choice); } catch { return prev; }
  if (typeof msg.i !== 'number' || typeof msg.a !== 'number' || msg.i < 0 || msg.i >= count) return prev;
  const cur = prev[vote.clientId] ?? { name: vote.displayName, studentId: vote.studentId ?? null, picks: {} };
  return { ...prev, [vote.clientId]: { ...cur, picks: { ...cur.picks, [msg.i]: msg.a } } };
}

export function MissionDebrief({ questions, answers, onRewatch, onScore, onDone }: { questions: ComprehensionQuestion[]; answers: MissionAnswers; onRewatch?: (seconds: number) => void; onScore?: ActivityProps['onScore']; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const recordStruggle = useSessionStore((s) => s.recordStruggle);
  const [scored] = useState(() => new Set<number>());
  const q = questions[idx];
  const entries = Object.entries(answers);
  const answered = entries.filter(([, a]) => a.picks[idx] != null);
  const caught = answered.filter(([, a]) => a.picks[idx] === q?.correctIndex);

  const next = () => {
    if (q && !scored.has(idx)) {
      scored.add(idx);
      answered.forEach(([cid, a]) => {
        const ok = a.picks[idx] === q.correctIndex;
        void onScore?.({ studentId: a.studentId, clientId: cid, displayName: a.name, promptIndex: idx + 1, points: ok ? 2 : 0, isCorrect: ok });
      });
      if (answered.length && caught.length / answered.length < 0.5) recordStruggle({ stage: 'briefing', text: q.question, fix: q.options[q.correctIndex] });
    }
    if (idx + 1 < questions.length) setIdx((i) => i + 1); else onDone();
  };

  if (!q) return null;
  return (
    <div className="mx-auto max-w-4xl space-y-4 text-white">
      <KitLabel tone="amber">Mission debrief · {idx + 1} of {questions.length}</KitLabel>
      <p className="flex items-start gap-2 font-display text-3xl leading-snug"><Crosshair className="mt-1.5 h-6 w-6 shrink-0 text-amber-300" />{q.question}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {q.options.map((o, i) => {
          const right = i === q.correctIndex;
          const n = answered.filter(([, a]) => a.picks[idx] === i).length;
          return (
            <motion.div key={o} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${right ? 'border-emerald-300 bg-emerald-400/10' : 'border-white/10 bg-slate-950/50 opacity-60'}`}>
              <span className="flex items-center gap-2 text-lg">{right && <Check className="h-5 w-5 text-emerald-300" />}{o}</span>
              <span className="font-mono text-sm text-white/55">{n}</span>
            </motion.div>
          );
        })}
      </div>
      <p className="text-center text-2xl">{answered.length ? `${caught.length} of ${answered.length} caught it` : 'Nobody answered this one'}</p>
      {(q.evidence || q.explanation) && <p className="rounded-2xl border border-amber-300/30 bg-amber-300/[0.06] px-5 py-3 text-center text-lg text-amber-50">{q.evidence ? `“${q.evidence}”` : q.explanation}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {onRewatch && q.timestamp ? <KitButton tone="plain" onClick={() => onRewatch(q.timestamp!)} icon={<RotateCcw className="h-3.5 w-3.5" />}>Watch that moment ({q.timestampLabel})</KitButton> : <span />}
        <KitButton tone="amber" solid onClick={next} icon={<ArrowRight className="h-4 w-4" />}>{idx + 1 < questions.length ? 'Next' : 'Done'}</KitButton>
      </div>
    </div>
  );
}
