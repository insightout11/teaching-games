'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronRight, Flame, Hand, Mic, Scale, Sparkles, Star, Swords, Timer } from 'lucide-react';
import type { ActivityProps } from '../types';
import { ActivityStatus, type Side, type SideSelection, type SpokeEntry, type DevilsAdvocateChallenge, type HotTakeArenaContent } from './types';
import { VocabPill } from '@/components/ui/vocab-pill';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';

// PRO = cyan, CON = rose (kit colours), everywhere in this activity.
const SIDE = {
  pro: { label: 'Agree', text: 'text-cyan-300', border: 'border-cyan-300/50', bg: 'bg-cyan-400/10', bar: 'bg-cyan-400' },
  con: { label: 'Disagree', text: 'text-rose-300', border: 'border-rose-300/50', bg: 'bg-rose-400/10', bar: 'bg-rose-400' },
} as const;
const PICK_LABELS = ['AGREE (PRO)', 'DISAGREE (CON)'];
const sideOf = (choice: string): Side => (choice === PICK_LABELS[0] ? 'pro' : 'con');
const other = (s: Side): Side => (s === 'pro' ? 'con' : 'pro');

type Mode = 'classic' | 'quick';

interface RaisedHand { claimTag: string; timestamp: number; clientId: string; displayName: string }
interface FinalVote { clientId: string; displayName: string; side: Side }

/** Live tug-of-war: how the class splits. */
function TugOfWar({ pro, con, big = false }: { pro: number; con: number; big?: boolean }) {
  const total = pro + con;
  const p = total ? (pro / total) * 100 : 50;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between font-mono text-xs uppercase tracking-[0.14em]">
        <span className="text-cyan-300">Agree · {pro}</span>
        <span className="text-rose-300">{con} · Disagree</span>
      </div>
      <div className={`relative flex overflow-hidden rounded-full bg-white/10 ${big ? 'h-5' : 'h-3'}`}>
        <motion.div className="h-full bg-cyan-400" animate={{ width: `${p}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} />
        <motion.div className="h-full flex-1 bg-rose-400" />
        <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/80" aria-hidden />
      </div>
    </div>
  );
}

export function HotTakeArenaActivity({
  generatedContent,
  onContinue,
  onPhaseChange,
  customTopic,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as HotTakeArenaContent;
  const reduce = useReducedMotion();

  const [mode, setMode] = useState<Mode>('classic');
  const [status, setStatus] = useState<ActivityStatus>(ActivityStatus.IDLE);
  const [sideSelections, setSideSelections] = useState<SideSelection[]>([]);
  const [raisedHands, setRaisedHands] = useState<Map<string, RaisedHand>>(new Map());
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [spokeLog, setSpokeLog] = useState<SpokeEntry[]>([]);
  const [finalVotes, setFinalVotes] = useState<FinalVote[]>([]);
  const [reasons, setReasons] = useState<Map<string, string>>(new Map());
  const [currentChallenge, setCurrentChallenge] = useState<DevilsAdvocateChallenge | null>(null);
  const [challengeIndex, setChallengeIndex] = useState({ pro: 0, con: 0 });
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
  const promptIndexRef = useRef(1);
  const resultsPointsAwarded = useRef(false);

  // Quick take reuses the MIND_CHANGE_VOTE slot as its "one reason" phase.
  const collectingReasons = mode === 'quick' && status === ActivityStatus.MIND_CHANGE_VOTE;

  // ─── What phones see ──────────────────────────────────────────────────────
  useEffect(() => {
    if (status === ActivityStatus.SIDE_SELECTION) {
      onSetInputSpec?.({ type: 'binary', gameKey: 'hot-take-arena', prompt: `"${content.statement}" Pick a side!`, optionLabels: PICK_LABELS });
    } else if (status === ActivityStatus.DEBATE) {
      onSetInputSpec?.({
        type: 'text',
        gameKey: 'hot-take-arena',
        prompt: 'Raise your hand with your point. Start with "I agree because…" or "I disagree because…"',
        placeholder: 'I agree because…',
        maxLength: 80,
      });
    } else if (collectingReasons) {
      onSetInputSpec?.({ type: 'text', gameKey: 'hot-take-arena', prompt: 'Why? One sentence for your side.', placeholder: 'Because…', maxLength: 120 });
    } else if (status === ActivityStatus.MIND_CHANGE_VOTE) {
      onSetInputSpec?.({ type: 'binary', gameKey: 'hot-take-arena', prompt: 'After the debate: where do you stand now?', optionLabels: PICK_LABELS });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, collectingReasons, content?.statement, onSetInputSpec]);

  // ─── Phone replies ────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === ActivityStatus.SIDE_SELECTION) {
      onRegisterRemoteVoteHandler?.((vote) => {
        const side = sideOf(vote.choice);
        setSideSelections((prev) => [...prev.filter((s) => s.studentId !== vote.clientId), { studentId: vote.clientId, studentName: vote.displayName, side }]);
      });
    } else if (status === ActivityStatus.DEBATE) {
      onRegisterRemoteVoteHandler?.((vote) => {
        const claimTag = vote.choice?.trim();
        if (!claimTag || !sideSelections.some((s) => s.studentId === vote.clientId)) return;
        setRaisedHands((prev) => new Map(prev).set(vote.clientId, { claimTag, timestamp: Date.now(), clientId: vote.clientId, displayName: vote.displayName }));
      });
    } else if (collectingReasons) {
      onRegisterRemoteVoteHandler?.((vote) => {
        const text = vote.choice?.trim();
        if (text) setReasons((prev) => new Map(prev).set(vote.clientId, text));
      });
    } else if (status === ActivityStatus.MIND_CHANGE_VOTE) {
      onRegisterRemoteVoteHandler?.((vote) => {
        if (!sideSelections.some((s) => s.studentId === vote.clientId)) return;
        const side = sideOf(vote.choice);
        setFinalVotes((prev) => [...prev.filter((v) => v.clientId !== vote.clientId), { clientId: vote.clientId, displayName: vote.displayName, side }]);
      });
    } else {
      return;
    }
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [status, collectingReasons, sideSelections, onRegisterRemoteVoteHandler]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const teams = useMemo(() => ({
    pro: sideSelections.filter((s) => s.side === 'pro'),
    con: sideSelections.filter((s) => s.side === 'con'),
  }), [sideSelections]);

  const handsBySide = useMemo(() => {
    const hands = Array.from(raisedHands.values());
    const of = (side: Side) => hands.filter((h) => sideSelections.find((s) => s.studentId === h.clientId)?.side === side).sort((a, b) => a.timestamp - b.timestamp);
    return { pro: of('pro'), con: of('con') };
  }, [raisedHands, sideSelections]);

  // Opinion shift: everyone's final side (no re-vote = unchanged).
  const shift = useMemo(() => {
    const finalOf = (id: string, start: Side) => finalVotes.find((v) => v.clientId === id)?.side ?? start;
    const after = { pro: 0, con: 0 };
    const switched: Array<{ name: string; from: Side; to: Side }> = [];
    for (const s of sideSelections) {
      const f = finalOf(s.studentId, s.side);
      after[f] += 1;
      if (f !== s.side) switched.push({ name: s.studentName, from: s.side, to: f });
    }
    const wonTo = { pro: switched.filter((x) => x.to === 'pro').length, con: switched.filter((x) => x.to === 'con').length };
    const winner: Side | null = wonTo.pro > wonTo.con ? 'pro' : wonTo.con > wonTo.pro ? 'con' : null;
    return { before: { pro: teams.pro.length, con: teams.con.length }, after, switched, wonTo, winner };
  }, [finalVotes, sideSelections, teams]);

  // ─── Flow ─────────────────────────────────────────────────────────────────
  const go = useCallback((next: ActivityStatus, phase: string) => {
    setStatus(next);
    onPhaseChange?.(phase);
  }, [onPhaseChange]);

  const startSideSelection = () => { setSideSelections([]); go(ActivityStatus.SIDE_SELECTION, 'side-selection'); };
  const afterSides = () => (mode === 'quick' ? go(ActivityStatus.MIND_CHANGE_VOTE, 'reasons') : go(ActivityStatus.DEBATE, 'debate'));

  const callOn = (clientId: string) => setCurrentSpeaker(clientId);
  // Fair turns: the next speaker comes from the other side when it has a hand up.
  const lastSide: Side | null = spokeLog.length ? spokeLog[spokeLog.length - 1].side : null;
  const nextHand = useMemo(() => {
    const prefer = lastSide ? other(lastSide) : (handsBySide.pro[0]?.timestamp ?? Infinity) <= (handsBySide.con[0]?.timestamp ?? Infinity) ? 'pro' : 'con';
    return handsBySide[prefer][0] ?? handsBySide[other(prefer)][0] ?? null;
  }, [handsBySide, lastSide]);

  const markDone = useCallback((clientId: string, starred: boolean) => {
    const hand = raisedHands.get(clientId);
    const selection = sideSelections.find((s) => s.studentId === clientId);
    if (!hand || !selection) return;
    setSpokeLog((prev) => [...prev, { id: `spoke-${Date.now()}`, studentId: clientId, studentName: hand.displayName, side: selection.side, claimTag: hand.claimTag, timestamp: Date.now(), isStarred: starred }]);
    setRaisedHands((prev) => { const n = new Map(prev); n.delete(clientId); return n; });
    setCurrentSpeaker(null);
    void onScore?.({ studentId: null, clientId, displayName: hand.displayName, promptIndex: promptIndexRef.current++, points: starred ? 10 : 5, isCorrect: null });
  }, [raisedHands, sideSelections, onScore]);

  const triggerDevilsAdvocate = useCallback(async (targetSide: Side) => {
    setIsLoadingChallenge(true);
    setCurrentChallenge(null);
    try {
      const pool = targetSide === 'pro' ? content.devilsAdvocate?.proChallenges : content.devilsAdvocate?.conChallenges;
      const i = challengeIndex[targetSide];
      if (pool?.[i]) {
        setCurrentChallenge({ targetSide, challenge: pool[i] });
        setChallengeIndex((prev) => ({ ...prev, [targetSide]: prev[targetSide] + 1 }));
      } else {
        const sideEntries = spokeLog.filter((e) => e.side === targetSide);
        const response = await onContinue({
          sessionId: '',
          activityKey: 'hot-take-arena',
          topicContext: content.topicContext,
          previousExchanges: sideEntries.map((e) => ({ role: 'student' as const, content: `${e.studentName} (${e.side}): ${e.claimTag}`, timestamp: e.timestamp })),
          studentResponse: `The ${targetSide} side has spoken ${sideEntries.length} times`,
          requestType: 'challenge',
        });
        setCurrentChallenge({ targetSide, challenge: response.challenge || 'Can you think of a weakness in your argument?' });
      }
    } catch {
      setCurrentChallenge({ targetSide, challenge: 'Can you think of a weakness in your argument?' });
    } finally {
      setIsLoadingChallenge(false);
    }
  }, [content, spokeLog, challengeIndex, onContinue]);

  const endDebate = () => { setCurrentChallenge(null); setCurrentSpeaker(null); setFinalVotes([]); go(ActivityStatus.MIND_CHANGE_VOTE, 'mind-change-vote'); };

  const showResults = useCallback(() => {
    if (resultsPointsAwarded.current) return;
    resultsPointsAwarded.current = true;
    go(ActivityStatus.RESULTS, 'results');
    if (mode === 'quick') {
      reasons.forEach((_, clientId) => {
        const s = sideSelections.find((x) => x.studentId === clientId);
        if (s) void onScore?.({ studentId: null, clientId, displayName: s.studentName, promptIndex: promptIndexRef.current++, points: 3, isCorrect: null });
      });
      return;
    }
    finalVotes.forEach((v) => {
      void onScore?.({ studentId: null, clientId: v.clientId, displayName: v.displayName, promptIndex: promptIndexRef.current++, points: 2, isCorrect: null });
    });
    // The side that won people over: its original members earn the bonus.
    if (shift.winner) {
      sideSelections.filter((s) => s.side === shift.winner).forEach((s) => {
        void onScore?.({ studentId: null, clientId: s.studentId, displayName: s.studentName, promptIndex: promptIndexRef.current++, points: 15, isCorrect: null });
      });
    }
  }, [go, mode, reasons, finalVotes, shift.winner, sideSelections, onScore]);

  const restart = () => {
    setSideSelections([]); setRaisedHands(new Map()); setCurrentSpeaker(null); setSpokeLog([]); setFinalVotes([]); setReasons(new Map());
    setCurrentChallenge(null); setChallengeIndex({ pro: 0, con: 0 }); setIsLoadingChallenge(false);
    promptIndexRef.current = 1; resultsPointsAwarded.current = false;
    go(ActivityStatus.IDLE, 'idle');
  };

  const speaker = currentSpeaker ? raisedHands.get(currentSpeaker) : null;
  const speakerSide = currentSpeaker ? sideSelections.find((s) => s.studentId === currentSpeaker)?.side : null;
  const starred = spokeLog.filter((e) => e.isStarred);

  const Statement = ({ size = 'lg' }: { size?: 'lg' | 'sm' }) => (
    <p className={`text-center font-display leading-tight text-white ${size === 'lg' ? 'text-4xl' : 'text-2xl'}`} style={{ textWrap: 'balance' }}>
      &ldquo;{content.statement}&rdquo;
    </p>
  );

  // ─── Setup ────────────────────────────────────────────────────────────────
  if (status === ActivityStatus.IDLE) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-white">
        <div className="text-center">
          <KitLabel tone="amber">Hot Take Arena{customTopic && customTopic !== 'General' ? ` · ${customTopic}` : ''}</KitLabel>
          <p className="mt-2 font-display text-4xl">Pick a side. Defend it.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            { key: 'classic', icon: Swords, title: 'Full debate', blurb: 'Pick sides, speak in turns, AI challenges both sides, then see who changed minds.', time: '~15 min' },
            { key: 'quick', icon: Timer, title: 'Quick take', blurb: 'Everyone picks a side and gives one reason on their phone. A fast warm-up.', time: '~5 min' },
          ] as const).map((m) => {
            const on = mode === m.key;
            const Icon = m.icon;
            return (
              <button key={m.key} type="button" onClick={() => setMode(m.key)} className={`rounded-2xl border p-4 text-left transition-colors ${on ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}>
                <Icon className={`h-5 w-5 ${on ? 'text-amber-300' : 'text-white/50'}`} />
                <p className="mt-2 font-display text-2xl">{m.title}</p>
                <p className="mt-1 text-sm text-white/65">{m.blurb}</p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">{m.time}</p>
              </button>
            );
          })}
        </div>
        <div className="flex justify-center">
          <KitButton tone="amber" solid onClick={() => go(ActivityStatus.PRESENTING, 'presenting')} className="!px-8 !py-3 !text-base" icon={<Flame className="h-4 w-4" />}>
            Reveal the hot take
          </KitButton>
        </div>
      </div>
    );
  }

  // ─── The statement ────────────────────────────────────────────────────────
  if (status === ActivityStatus.PRESENTING) {
    return (
      <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-6 text-white">
        <div className="text-center"><KitLabel tone="amber">Today&apos;s hot take</KitLabel></div>
        <Statement />
        {(content.vocabularyHighlights?.length ?? 0) > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {content.vocabularyHighlights.map((w, i) => <VocabPill key={i} word={w} className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-sm" />)}
          </div>
        )}
        <div className="flex justify-center">
          <KitButton tone="amber" solid onClick={startSideSelection} className="!px-8 !py-3 !text-base" icon={<Scale className="h-4 w-4" />}>Pick sides on your phones</KitButton>
        </div>
      </motion.div>
    );
  }

  // ─── Picking sides ────────────────────────────────────────────────────────
  if (status === ActivityStatus.SIDE_SELECTION) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 text-white">
        <Statement size="sm" />
        <TugOfWar pro={teams.pro.length} con={teams.con.length} big />
        <div className="grid grid-cols-2 gap-4">
          {(['pro', 'con'] as const).map((side) => (
            <div key={side} className={`min-h-[120px] rounded-2xl border p-4 ${SIDE[side].border} ${SIDE[side].bg}`}>
              <p className={`font-mono text-xs uppercase tracking-[0.16em] ${SIDE[side].text}`}>{SIDE[side].label}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {teams[side].map((s) => (
                  <motion.span key={s.studentId} initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-full bg-white/10 px-3 py-1 text-sm">{s.studentName}</motion.span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <KitReadout>{sideSelections.length} picked</KitReadout>
          <KitButton tone="amber" solid disabled={mode === 'classic' && (teams.pro.length === 0 || teams.con.length === 0)} onClick={afterSides} className="!px-6 !py-2.5 !text-sm" icon={<ChevronRight className="h-4 w-4" />}>
            {mode === 'quick' ? 'Now: one reason each' : 'Start the debate'}
          </KitButton>
        </div>
        {mode === 'classic' && (teams.pro.length === 0 || teams.con.length === 0) && sideSelections.length > 0 && (
          <p className="text-center text-sm text-white/55">Everyone agrees? A debate needs both sides. Ask someone to play devil&apos;s advocate.</p>
        )}
      </div>
    );
  }

  // ─── Debate ───────────────────────────────────────────────────────────────
  if (status === ActivityStatus.DEBATE) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 text-white">
        <Statement size="sm" />
        {(isLoadingChallenge || currentChallenge) && (
          <div className={`rounded-2xl border p-4 ${currentChallenge ? `${SIDE[currentChallenge.targetSide].border} ${SIDE[currentChallenge.targetSide].bg}` : 'border-violet-300/40 bg-violet-400/10'}`}>
            {isLoadingChallenge ? (
              <p className="flex items-center gap-2 text-sm text-violet-200"><Sparkles className="h-4 w-4 animate-pulse" /> Writing a challenge…</p>
            ) : currentChallenge && (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <KitLabel tone="violet">Devil&apos;s advocate · to {SIDE[currentChallenge.targetSide].label}</KitLabel>
                  <p className="mt-1 font-display text-2xl leading-snug">{currentChallenge.challenge}</p>
                </div>
                <KitButton onClick={() => setCurrentChallenge(null)}>Done</KitButton>
              </div>
            )}
          </div>
        )}

        {speaker && speakerSide ? (
          <motion.div initial={reduce ? false : { y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`rounded-2xl border-2 p-5 ${SIDE[speakerSide].border} ${SIDE[speakerSide].bg}`}>
            <KitLabel tone={speakerSide === 'pro' ? 'cyan' : 'rose'}>Speaking now · {SIDE[speakerSide].label}</KitLabel>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-4xl">{speaker.displayName}</p>
                <p className="mt-1 text-lg text-white/80">&ldquo;{speaker.claimTag}&rdquo;</p>
              </div>
              <div className="flex gap-2">
                <KitButton tone="amber" onClick={() => markDone(speaker.clientId, true)} className="!py-2 !text-sm" icon={<Star className="h-4 w-4" />}>Great point</KitButton>
                <KitButton onClick={() => markDone(speaker.clientId, false)} className="!py-2 !text-sm">Done</KitButton>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <KitButton tone="emerald" solid disabled={!nextHand} onClick={() => nextHand && callOn(nextHand.clientId)} className="!px-6 !py-2.5 !text-sm" icon={<Mic className="h-4 w-4" />}>
              {nextHand ? `Next speaker: ${nextHand.displayName}` : 'Waiting for hands on phones…'}
            </KitButton>
            {lastSide && nextHand && <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">sides take turns</span>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {(['pro', 'con'] as const).map((side) => (
            <div key={side} className={`rounded-2xl border p-3 ${SIDE[side].border} bg-slate-950/40`}>
              <div className="mb-2 flex items-center justify-between">
                <p className={`font-mono text-xs uppercase tracking-[0.16em] ${SIDE[side].text}`}>{SIDE[side].label} · {teams[side].length}</p>
                <span className="flex items-center gap-1 font-mono text-[11px] text-white/50"><Hand className="h-3.5 w-3.5" />{handsBySide[side].length}</span>
              </div>
              <div className="min-h-[70px] space-y-1.5">
                {handsBySide[side].length === 0 && <p className="pt-3 text-center text-xs text-white/40">No hands up yet</p>}
                {handsBySide[side].map((h) => (
                  <button key={h.clientId} type="button" disabled={!!currentSpeaker} onClick={() => callOn(h.clientId)} className={`flex w-full items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-left hover:bg-white/5 disabled:cursor-default ${nextHand?.clientId === h.clientId && !currentSpeaker ? 'ring-1 ring-emerald-300/60' : ''}`}>
                    <span className={`text-sm font-semibold ${SIDE[side].text}`}>{h.displayName}</span>
                    <span className="truncate text-sm text-white/70">{h.claimTag}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {spokeLog.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <KitLabel>Said so far · {spokeLog.length}</KitLabel>
            <div className="mt-2 space-y-1">
              {spokeLog.slice(-4).map((e) => (
                <p key={e.id} className="flex items-center gap-2 text-sm">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${SIDE[e.side].bar}`} />
                  <span className="font-semibold">{e.studentName}</span>
                  <span className="truncate text-white/70">{e.claimTag}</span>
                  {e.isStarred && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-300 text-amber-300" />}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <KitButton tone="violet" disabled={isLoadingChallenge} onClick={() => void triggerDevilsAdvocate('pro')} icon={<Sparkles className="h-3.5 w-3.5" />}>Challenge Agree</KitButton>
            <KitButton tone="violet" disabled={isLoadingChallenge} onClick={() => void triggerDevilsAdvocate('con')} icon={<Sparkles className="h-3.5 w-3.5" />}>Challenge Disagree</KitButton>
          </div>
          <KitButton tone="amber" solid onClick={endDebate} className="!px-5 !py-2 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>End debate · vote again</KitButton>
        </div>
      </div>
    );
  }

  // ─── Quick take reasons / final re-vote ───────────────────────────────────
  if (status === ActivityStatus.MIND_CHANGE_VOTE) {
    const count = collectingReasons ? reasons.size : finalVotes.length;
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-center text-white">
        <KitLabel tone="amber">{collectingReasons ? 'One reason each' : 'Vote again'}</KitLabel>
        <Statement size="sm" />
        <p className="text-lg text-white/75">{collectingReasons ? 'Type one reason on your phone.' : 'After hearing both sides: where do you stand now? You can switch.'}</p>
        <p className="font-display text-5xl">{count}<span className="text-2xl text-white/50"> / {sideSelections.length}</span></p>
        <KitButton tone="amber" solid onClick={showResults} className="mx-auto !px-8 !py-3 !text-base" icon={<ChevronRight className="h-4 w-4" />}>See the results</KitButton>
      </div>
    );
  }

  // ─── Results ──────────────────────────────────────────────────────────────
  if (status === ActivityStatus.RESULTS) {
    if (mode === 'quick') {
      return (
        <div className="mx-auto max-w-4xl space-y-5 text-white">
          <Statement size="sm" />
          <TugOfWar pro={teams.pro.length} con={teams.con.length} big />
          <div className="grid grid-cols-2 gap-4">
            {(['pro', 'con'] as const).map((side) => (
              <div key={side} className={`rounded-2xl border p-4 ${SIDE[side].border} ${SIDE[side].bg}`}>
                <p className={`mb-2 font-mono text-xs uppercase tracking-[0.16em] ${SIDE[side].text}`}>{SIDE[side].label}</p>
                <div className="space-y-2">
                  {teams[side].filter((s) => reasons.has(s.studentId)).map((s) => (
                    <p key={s.studentId} className="text-base"><span className="font-semibold">{s.studentName}:</span> <span className="text-white/80">{reasons.get(s.studentId)}</span></p>
                  ))}
                  {!teams[side].some((s) => reasons.has(s.studentId)) && <p className="text-sm text-white/45">No reasons yet</p>}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2">
            <KitButton onClick={restart}>Another hot take</KitButton>
            <KitButton tone="amber" solid onClick={() => go(ActivityStatus.FINISHED, 'finished')}>Finish</KitButton>
          </div>
        </div>
      );
    }
    const w = shift.winner;
    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        <div className="text-center">
          <KitLabel tone="amber">The opinion shift</KitLabel>
          <p className="mt-2 font-display text-4xl">
            {w ? <><span className={SIDE[w].text}>{SIDE[w].label}</span> won people over!</> : 'Nobody switched sides: a strong stand-off!'}
          </p>
        </div>
        <div className="space-y-3">
          <div><KitLabel>Before</KitLabel><TugOfWar pro={shift.before.pro} con={shift.before.con} /></div>
          <div><KitLabel tone="amber">After</KitLabel><TugOfWar pro={shift.after.pro} con={shift.after.con} big /></div>
        </div>
        {shift.switched.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <KitLabel>Changed their mind</KitLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {shift.switched.map((x) => (
                <span key={x.name} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm">
                  {x.name} <span className={SIDE[x.from].text}>{SIDE[x.from].label}</span> <ArrowRight className="h-3.5 w-3.5" /> <span className={SIDE[x.to].text}>{SIDE[x.to].label}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        {starred.length > 0 && (
          <div className="rounded-2xl border border-amber-300/40 bg-amber-300/[0.06] p-4">
            <KitLabel tone="amber">Best points</KitLabel>
            <div className="mt-2 space-y-1.5">
              {starred.map((e) => (
                <p key={e.id} className="flex items-center gap-2 text-base">
                  <Star className="h-4 w-4 shrink-0 fill-amber-300 text-amber-300" />
                  <span className="font-semibold">{e.studentName}</span>
                  <span className={`font-mono text-[11px] uppercase ${SIDE[e.side].text}`}>{SIDE[e.side].label}</span>
                  <span className="text-white/80">{e.claimTag}</span>
                </p>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-center gap-2">
          <KitButton onClick={restart}>Another hot take</KitButton>
          <KitButton tone="amber" solid onClick={() => go(ActivityStatus.FINISHED, 'finished')}>Finish</KitButton>
        </div>
      </div>
    );
  }

  // ─── Finished ─────────────────────────────────────────────────────────────
  return (
    <div className="py-12 text-center text-white">
      <p className="font-display text-4xl">Great debate!</p>
      <p className="mt-2 text-white/65">{spokeLog.length} points made{starred.length ? ` · ${starred.length} great ones` : ''}</p>
      <KitButton onClick={restart} className="mx-auto mt-6 !px-6 !py-2.5 !text-sm">Start a new hot take</KitButton>
    </div>
  );
}
