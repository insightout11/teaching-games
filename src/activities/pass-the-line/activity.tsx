'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessagesSquare, Zap, ChevronRight, Check } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import type { Student } from '@/lib/supabase/types';
import type { ActivityProps } from '../types';
import type { SpeakingFrameCard } from '../shared/speaking-turns';
import { FREE_LINES, ROUNDS, TWIST_AFTER, fallbackPassTheLine, speakerIndex, validPassTheLine } from '@/lib/pass-the-line';

// Pass the Line (Speak v2 main event): the whole class builds ONE conversation together. Every
// line belongs to one of two roles; the mic passes to the next student each line (fair order), so
// nobody performs a scene alone and everyone is in it within a minute. Round 1 follows the cues,
// round 2 drops a twist card in mid-conversation, round 3 has no cues: own words, faster.

type Phase = 'idle' | 'line' | 'between' | 'done';
const ROUND_TITLES = ['Round 1: follow the cues', 'Round 2: the twist', 'Round 3: your own words'];

export function PassTheLineActivity({ students, generatedContent, onSetInputSpec, onScore, onPhaseChange }: ActivityProps) {
  const raw = generatedContent as { topicContext?: string } | null;
  const [content] = useState(() => validPassTheLine(raw) ?? fallbackPassTheLine(raw?.topicContext ?? ''));
  const recordFeature = useSessionStore((s) => s.recordFeature);
  const kitPhrases = useSessionStore((s) => s.lessonKit?.phrases);
  const phrases = useMemo(() => (kitPhrases ?? []).slice(0, 6), [kitPhrases]);

  const rosterKey = students.map((s) => s.id).join(',');
  const rosterRef = useRef(students); rosterRef.current = students;
  const order = useMemo<Student[]>(() => {
    const counts = useSessionStore.getState().callCounts;
    return [...rosterRef.current].sort((a, b) => (counts[a.id] ?? 0) - (counts[b.id] ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-snapshot only when the roster ids change
  }, [rosterKey]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const [line, setLine] = useState(0);
  const [mic, setMic] = useState(0); // lines spoken so far across the activity: the mic position
  const [said, setSaid] = useState<string[]>([]); // who said each line this round

  const linesThisRound = round < 2 ? content.cues.length : FREE_LINES;
  const roleOf = (r: number, i: number) => (r < 2 ? content.cues[i]?.role ?? 0 : (i % 2) as 0 | 1);
  const role = content.roles[roleOf(round, line)];
  const cue = round < 2 ? content.cues[line]?.cue : null;
  const speaker = order.length ? order[speakerIndex(mic, order.length)] : null;
  const next = order.length > 1 ? order[speakerIndex(mic + 1, order.length)] : null;
  const nextRole = line + 1 < linesThisRound ? content.roles[roleOf(round, line + 1)] : null;
  const twist = round === 1 && line >= TWIST_AFTER ? content.twists[0] : null;

  // Phones: the speaker gets their line (role + cue + phrases), the next student gets ready.
  useEffect(() => {
    if (phase !== 'line') { onSetInputSpec?.(null); return; }
    const per: Record<string, unknown> = { __room: true };
    const helpers = phrases.length ? [{ label: 'Lesson phrases', items: phrases }] : [];
    order.forEach((s) => {
      const mine = s.id === speaker?.id;
      const card: SpeakingFrameCard = {
        role: 'speaking-frame',
        title: mine ? `Your line! You're the ${role}` : s.id === next?.id ? `You're next${nextRole ? `: the ${nextRole}` : ''}` : 'Pass the Line',
        prompt: mine ? (cue ?? 'Keep the conversation going, your own words') + (twist ? ` (Twist: ${twist})` : '') : content.setup,
        helpers,
        yourTurn: mine,
      };
      per[s.id] = card;
      per[s.name] = card;
    });
    onSetInputSpec?.({ type: 'confirm', gameKey: 'pass-the-line', prompt: 'Pass the Line', perStudentData: per, stableInput: true });
  }, [phase, order, speaker, next, role, nextRole, cue, twist, phrases, content.setup, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const nextLine = useCallback(() => {
    if (speaker) {
      recordFeature(speaker.id);
      void onScore?.({ studentId: speaker.id, clientId: null, displayName: speaker.name, promptIndex: mic + 1, points: 1, isCorrect: null });
    }
    setSaid((s) => [...s, speaker?.name ?? 'Class']);
    setMic((m) => m + 1);
    if (line + 1 < linesThisRound) { setLine((l) => l + 1); return; }
    if (round + 1 < ROUNDS) { setPhase('between'); return; }
    setPhase('done');
    onPhaseChange?.('finished');
  }, [speaker, mic, line, linesThisRound, round, recordFeature, onScore, onPhaseChange]);

  const startRound = (r: number) => { setRound(r); setLine(0); setSaid([]); setPhase('line'); onPhaseChange?.(`round-${r + 1}`); };

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 py-6 text-center">
        <MessagesSquare className="h-16 w-16 text-cyan-300" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Pass the Line</p>
          <h3 className="mt-2 text-3xl font-game text-white">One conversation, the whole class</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">{content.setup}</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">Each line, the mic passes to the next person. Check your phone: it tells you when it’s your line and who you are.</p>
        </div>
        <div className="flex gap-3">
          {content.roles.map((r) => <span key={r} className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 font-semibold text-cyan-50">{r}</span>)}
        </div>
        <button onClick={() => startRound(0)} className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 px-10 py-4 font-game text-lg text-white shadow-xl transition hover:scale-105">START</button>
      </div>
    );
  }

  if (phase === 'between') {
    return (
      <div className="flex min-h-[340px] flex-col items-center justify-center gap-5 text-center">
        <Check className="h-12 w-12 text-emerald-300" />
        <h3 className="text-2xl font-game text-white">{ROUND_TITLES[round]}: done</h3>
        <p className="max-w-md text-sm text-slate-300">{round === 0 ? 'Same conversation again, but this time something goes wrong in the middle.' : 'Last round: no cues. Keep it going in your own words.'}</p>
        <button onClick={() => startRound(round + 1)} className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 px-8 py-4 font-game text-base text-white shadow-xl transition hover:scale-105">
          {round === 0 && <Zap className="h-4 w-4" aria-hidden />}{ROUND_TITLES[round + 1].toUpperCase()}
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
        <MessagesSquare className="h-12 w-12 text-cyan-300" />
        <h3 className="text-2xl font-game text-white">Three conversations, everyone in them</h3>
        <p className="max-w-md text-sm text-slate-300">{mic} lines, passed round the whole class.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Pass the Line · {ROUND_TITLES[round]}</p>
        <span className="text-sm text-slate-400">line {line + 1} of {linesThisRound}</span>
      </div>

      {twist && (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-rose-400/50 bg-rose-500/10 px-5 py-3">
          <Zap className="h-6 w-6 shrink-0 text-rose-300" aria-hidden />
          <p className="text-lg font-game text-rose-50">Twist: {twist}</p>
        </div>
      )}

      <div className="rounded-2xl border-2 border-cyan-400/40 bg-cyan-500/[0.08] p-6 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">{speaker ? speaker.name : 'Next speaker'}, as the {role}</p>
        <p className="mt-2 text-3xl font-game text-white">{cue ?? 'Keep it going, your own words'}</p>
        {next && <p className="mt-3 text-sm text-slate-400">Next: <span className="text-slate-200">{next.name}</span>{nextRole ? ` (${nextRole})` : ''}</p>}
      </div>

      {round < 2 && (
        <ol className="grid gap-1.5 sm:grid-cols-2">
          {content.cues.map((c, i) => (
            <li key={i} className={`rounded-lg px-3 py-1.5 text-xs ${i === line ? 'bg-cyan-500/15 text-cyan-50' : i < line ? 'text-slate-500' : 'text-slate-400'}`}>
              <span className="font-semibold">{content.roles[c.role]}:</span> {c.cue}{i < line && said[i] ? ` · ${said[i]}` : ''}
            </li>
          ))}
        </ol>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">They say the line out loud, then pass the mic.</p>
        <button onClick={nextLine} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]">
          {line + 1 < linesThisRound ? 'PASS THE MIC' : round + 1 < ROUNDS ? 'END ROUND' : 'FINISH'}<ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
