'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { ConversationRoundsContent } from '../types';

type Phase = 'idle' | 'briefing' | 'conversing' | 'complication' | 'debrief' | 'complete';

export function ConversationRoundsActivity({
  students,
  generatedContent,
  sessionSettings,
  onSetInputSpec,
  onScore,
  onContinue,
  onPhaseChange,
}: ActivityProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [content, setContent] = useState<ConversationRoundsContent>(
    generatedContent as ConversationRoundsContent
  );
  const [roleAIdx, setRoleAIdx] = useState(0);
  const [roleBIdx, setRoleBIdx] = useState(Math.min(1, Math.max(0, students.length - 1)));
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [roundCount, setRoundCount] = useState(0);
  const [complicationIdx, setComplicationIdx] = useState(0);
  const [activeComplication, setActiveComplication] = useState<string | null>(null);
  const [shownLifelinesA, setShownLifelinesA] = useState(0);
  const [shownLifelinesB, setShownLifelinesB] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const promptIndexRef = useRef(1);

  const roleA = content.roles?.[0];
  const roleB = content.roles?.[1];
  const studentA = students[roleAIdx];
  const studentB = students[roleBIdx];
  const remaining = students.filter(s => !completedIds.includes(s.id));
  const complicationsLeft = (content.complications?.length ?? 0) - complicationIdx;

  // Student device — show scenario context + phrase chips during active phases
  useEffect(() => {
    if (phase === 'briefing' || phase === 'conversing' || phase === 'complication') {
      onSetInputSpec?.({
        type: 'confirm',
        gameKey: 'conversation-rounds',
        prompt: content.context,
        buttonLabel: 'Ready',
        keywordGroups: [
          { label: roleA?.title ?? 'Role A', phrases: roleA?.phrases ?? [] },
          { label: roleB?.title ?? 'Role B', phrases: roleB?.phrases ?? [] },
        ],
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [phase, content.context, roleA?.phrases, roleB?.phrases, onSetInputSpec]);

  const startRound = useCallback(() => {
    setShownLifelinesA(0);
    setShownLifelinesB(0);
    setActiveComplication(null);
    setPhase('briefing');
    onPhaseChange?.('briefing');
  }, [onPhaseChange]);

  const startConversation = useCallback(() => {
    setPhase('conversing');
    onPhaseChange?.('conversing');
  }, [onPhaseChange]);

  const triggerComplication = useCallback(() => {
    if (!content.complications?.length || complicationIdx >= content.complications.length) return;
    setActiveComplication(content.complications[complicationIdx]);
    setComplicationIdx(i => i + 1);
    setPhase('complication');
  }, [complicationIdx, content.complications]);

  const dismissComplication = useCallback(() => {
    setPhase('conversing');
  }, []);

  const endRound = useCallback(async () => {
    if (!studentA || !studentB) return;
    const idx = promptIndexRef.current++;
    await onScore?.({ studentId: studentA.id, clientId: null, displayName: studentA.name, promptIndex: idx, points: 3, isCorrect: null });
    await onScore?.({ studentId: studentB.id, clientId: null, displayName: studentB.name, promptIndex: idx, points: 3, isCorrect: null });

    const newCompleted = [...completedIds, studentA.id, studentB.id];
    setCompletedIds(newCompleted);
    setRoundCount(r => r + 1);
    setActiveComplication(null);

    const newRemaining = students.filter(s => !newCompleted.includes(s.id));
    if (newRemaining.length === 0) {
      setPhase('complete');
      onPhaseChange?.('complete');
    } else {
      setPhase('debrief');
    }
  }, [studentA, studentB, completedIds, students, onScore, onPhaseChange]);

  const nextRound = useCallback(() => {
    const newRemaining = students.filter(s => !completedIds.includes(s.id));
    if (newRemaining.length === 0) { setPhase('complete'); return; }
    const nextA = students.indexOf(newRemaining[0]);
    const nextB = newRemaining.length > 1 ? students.indexOf(newRemaining[1]) : students.indexOf(newRemaining[0]);
    setRoleAIdx(nextA >= 0 ? nextA : 0);
    setRoleBIdx(nextB >= 0 && nextB !== nextA ? nextB : 0);
    setShownLifelinesA(0);
    setShownLifelinesB(0);
    setPhase('idle');
    onPhaseChange?.('idle');
  }, [students, completedIds, onPhaseChange]);

  const handleNewScenario = useCallback(async () => {
    setRegenerating(true);
    try {
      const res = await onContinue({
        sessionId: '',
        activityKey: 'conversation-rounds',
        topicContext: content.topicContext,
        previousExchanges: [],
        studentResponse: JSON.stringify({ topic: content.topicContext, difficulty: sessionSettings.difficulty }),
        requestType: 'generate-round',
      });
      if (res.regeneratedContent) {
        setContent(res.regeneratedContent as ConversationRoundsContent);
        setComplicationIdx(0);
        setActiveComplication(null);
        setPhase('idle');
        onPhaseChange?.('idle');
      }
    } finally {
      setRegenerating(false);
    }
  }, [content.topicContext, sessionSettings.difficulty, onContinue, onPhaseChange]);

  if (!roleA || !roleB) {
    return <p className="text-red-400 text-center py-12">Content unavailable. Please regenerate.</p>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-lc-blue">Conversation Rounds</h3>
          {phase !== 'complete' && (
            <p className="text-xs text-lc-text3 mt-0.5">
              {content.scenario} · Round {roundCount + 1}
            </p>
          )}
        </div>
        {(phase === 'idle' || phase === 'complete') && (
          <button
            onClick={handleNewScenario}
            disabled={regenerating}
            className="px-3 py-1.5 glass hover:bg-white/10 rounded-lg text-xs font-medium border border-white/20 transition-all disabled:opacity-40"
          >
            {regenerating ? 'Generating…' : 'New Scenario'}
          </button>
        )}
      </div>

      {/* ─── IDLE ─── */}
      {phase === 'idle' && (
        <div className="space-y-5">
          {/* Scenario context */}
          <div className="glass p-4 rounded-2xl border border-lc-blue/20">
            <p className="text-xs uppercase tracking-widest opacity-40 mb-1">Scenario</p>
            <p className="text-base leading-relaxed">{content.context}</p>
          </div>

          {/* Student roster — who still needs a turn */}
          {students.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest opacity-40 mb-2">Who still needs a turn</p>
              <div className="flex flex-wrap gap-2">
                {students.map(s => {
                  const done = completedIds.includes(s.id);
                  return (
                    <span
                      key={s.id}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        done
                          ? 'opacity-30 border-white/10 text-lc-text3 line-through'
                          : 'border-lc-blue/30 text-lc-blue bg-lc-blue/10'
                      }`}
                    >
                      {s.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Role selectors */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: roleA.title, idx: roleAIdx, setIdx: setRoleAIdx, otherIdx: roleBIdx },
              { label: roleB.title, idx: roleBIdx, setIdx: setRoleBIdx, otherIdx: roleAIdx },
            ].map(({ label, idx, setIdx }, col) => (
              <div key={col} className="glass p-4 rounded-2xl border border-white/10 space-y-2">
                <p className="text-xs font-semibold text-lc-blue uppercase tracking-widest">{label}</p>
                <select
                  value={idx}
                  onChange={e => setIdx(Number(e.target.value))}
                  className="w-full bg-lc-surface border border-lc-border text-lc-text rounded-lg px-3 py-2 text-sm focus:border-lc-blue outline-none"
                >
                  {students.map((s, i) => (
                    <option key={s.id} value={i}>
                      {s.name}{completedIds.includes(s.id) ? ' ✓' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={startRound}
              disabled={roleAIdx === roleBIdx}
              className="px-10 py-4 bg-gradient-to-br from-lc-blue to-blue-500 rounded-full font-game text-xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              START ROUND →
            </button>
          </div>
        </div>
      )}

      {/* ─── BRIEFING ─── */}
      {phase === 'briefing' && (
        <div className="space-y-5">
          <p className="text-center text-sm uppercase tracking-widest opacity-50">Role Cards — Read before starting</p>
          <div className="grid grid-cols-2 gap-4">
            {([roleA, roleB] as const).map((role, i) => {
              const student = i === 0 ? studentA : studentB;
              const borderClass = i === 0 ? 'border-teal-500/40' : 'border-violet-500/40';
              const titleClass = i === 0 ? 'text-teal-400' : 'text-violet-400';
              const chipClass = i === 0 ? 'bg-teal-500/15 text-teal-300' : 'bg-violet-500/15 text-violet-300';
              return (
                <div key={i} className={`glass p-6 rounded-2xl border-2 ${borderClass} space-y-3`}>
                  <div>
                    <p className={`text-xs font-semibold ${titleClass} uppercase tracking-widest`}>{role.title}</p>
                    <p className="font-bold text-lg mt-0.5">{student?.name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-40 uppercase tracking-widest">Goal</p>
                    <p className="text-base mt-0.5">{role.goal}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-40 uppercase tracking-widest">Situation</p>
                    <p className="text-base mt-0.5">{role.situation}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-40 uppercase tracking-widest mb-1">Key Phrases</p>
                    <div className="flex flex-wrap gap-1.5">
                      {role.phrases.map((p, j) => (
                        <span key={j} className={`text-sm px-2.5 py-1 rounded-full ${chipClass}`}>&ldquo;{p}&rdquo;</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center">
            <button
              onClick={startConversation}
              className="px-10 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              START CONVERSATION →
            </button>
          </div>
        </div>
      )}

      {/* ─── CONVERSING / COMPLICATION ─── */}
      {(phase === 'conversing' || phase === 'complication') && (
        <div className="space-y-4">
          {/* Complication overlay */}
          {phase === 'complication' && activeComplication && (
            <div className="glass p-5 rounded-2xl border-2 border-amber-400/50 bg-amber-400/10 space-y-3">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest">⚡ Complication</p>
              <p className="text-xl font-semibold leading-snug">&ldquo;{activeComplication}&rdquo;</p>
              <p className="text-xs opacity-50">Read this aloud — then let them continue</p>
              <div className="flex justify-center">
                <button
                  onClick={dismissComplication}
                  className="px-6 py-2.5 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 rounded-xl font-game text-sm transition-all"
                >
                  CONTINUE CONVERSATION
                </button>
              </div>
            </div>
          )}

          {/* Role cards — condensed */}
          <div className="grid grid-cols-2 gap-4">
            {([roleA, roleB] as const).map((role, i) => {
              const student = i === 0 ? studentA : studentB;
              const shownLifelines = i === 0 ? shownLifelinesA : shownLifelinesB;
              const setShown = i === 0 ? setShownLifelinesA : setShownLifelinesB;
              const hasMoreLifelines = shownLifelines < role.lifelines.length;
              const borderClass = i === 0 ? 'border-teal-500/30' : 'border-violet-500/30';
              const titleClass = i === 0 ? 'text-teal-400' : 'text-violet-400';
              const chipClass = i === 0 ? 'bg-teal-500/15 text-teal-300' : 'bg-violet-500/15 text-violet-300';

              return (
                <div key={i} className={`glass p-4 rounded-2xl border ${borderClass} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-semibold ${titleClass} uppercase tracking-widest`}>{role.title}</p>
                      <p className="text-sm font-medium">{student?.name ?? '—'}</p>
                    </div>
                  </div>
                  <p className="text-xs opacity-60 italic">{role.goal}</p>
                  <div>
                    <p className="text-xs opacity-40 uppercase tracking-widest mb-1">Phrases</p>
                    <div className="flex flex-wrap gap-1">
                      {role.phrases.map((p, j) => (
                        <span key={j} className={`px-2 py-0.5 rounded-full text-xs ${chipClass}`}>&ldquo;{p}&rdquo;</span>
                      ))}
                    </div>
                  </div>

                  {/* Lifelines */}
                  {shownLifelines > 0 && (
                    <div className="space-y-1.5">
                      {role.lifelines.slice(0, shownLifelines).map((l, j) => (
                        <p key={j} className="text-xs text-emerald-300 italic border-l-2 border-emerald-500/40 pl-2">
                          &ldquo;{l}&rdquo;
                        </p>
                      ))}
                    </div>
                  )}

                  {hasMoreLifelines && (
                    <button
                      onClick={() => setShown(n => n + 1)}
                      className="w-full py-1.5 glass hover:bg-white/10 rounded-lg text-xs font-medium border border-emerald-500/30 text-emerald-400 transition-all"
                    >
                      Hint for {student?.name ?? role.title}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action bar */}
          <div className="flex gap-3 justify-between items-center">
            <button
              onClick={triggerComplication}
              disabled={complicationsLeft === 0 || phase === 'complication'}
              className="px-5 py-2.5 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-amber-500/30 text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ⚡ Complicate {complicationsLeft > 0 ? `(${complicationsLeft} left)` : ''}
            </button>
            <button
              onClick={endRound}
              disabled={phase === 'complication'}
              className="px-8 py-3 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-base shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              END ROUND ✓
            </button>
          </div>
        </div>
      )}

      {/* ─── DEBRIEF ─── */}
      {phase === 'debrief' && (
        <div className="space-y-5 text-center">
          <p className="text-2xl font-game text-lc-blue">Round {roundCount} Complete!</p>
          <div className="glass p-4 rounded-2xl border border-green-500/20 space-y-2">
            {[{ student: studentA, role: roleA }, { student: studentB, role: roleB }].map(({ student, role }, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="opacity-70">{role?.title}</span>
                <span className="font-semibold">{student?.name ?? '—'}</span>
                <span className="text-emerald-400 text-xs">+3 pts</span>
              </div>
            ))}
          </div>
          <p className="text-sm opacity-50">
            {remaining.length > 0
              ? `${remaining.length} student${remaining.length !== 1 ? 's' : ''} still need a turn`
              : 'Everyone has had a turn!'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setPhase('complete'); onPhaseChange?.('complete'); }}
              className="px-6 py-2.5 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-white/20"
            >
              FINISH
            </button>
            {remaining.length > 0 && (
              <button
                onClick={nextRound}
                className="px-8 py-3 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-base shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
              >
                NEXT ROUND →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── COMPLETE ─── */}
      {phase === 'complete' && (
        <div className="text-center py-10 space-y-6">
          <p className="text-3xl font-game text-lc-blue">Everyone&apos;s had a turn!</p>
          <div className="flex justify-center gap-8">
            <div>
              <p className="text-4xl font-game">{roundCount}</p>
              <p className="text-sm opacity-50">rounds played</p>
            </div>
            <div>
              <p className="text-4xl font-game">{students.length}</p>
              <p className="text-sm opacity-50">students participated</p>
            </div>
          </div>
          <button
            onClick={handleNewScenario}
            disabled={regenerating}
            className="px-8 py-3 glass hover:bg-white/10 rounded-xl font-game text-base transition-all border border-white/20 disabled:opacity-40"
          >
            {regenerating ? 'Generating…' : 'NEW SCENARIO'}
          </button>
        </div>
      )}
    </div>
  );
}
