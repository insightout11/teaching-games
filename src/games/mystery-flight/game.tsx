'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, Cloud, Landmark, MapPin, MessageCircleQuestion, Mic, Plane, PlaneLanding, Sparkles, Trees, Trophy, Users, Utensils } from 'lucide-react';
import type { GameProps, GameRemoteVote } from '../types';
import type { InputSpec } from '@/lib/input-spec';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import cityPacks from '@/data/world-flight/city-packs.json';
import { getDestinationById } from '@/data/world-flight/destinations';
import { getMediaForUsage, getPlaceMediaRecordByDestination, getRevealMediaForDestination } from '@/lib/place-media';
import { WorldLensMap, type WorldLensGuess } from '../world-lens/world-lens-map';
import { parseWorldLensGuess } from '../world-lens/scoring';
import { buildClueDeck, distancePoints, earlyBonus, haversineKm, mostDistantPair, pickDestinations, type ClueStyle, type MysteryClue, type PackClue } from './logic';

type Phase = 'idle' | 'flying' | 'landed' | 'finished';
interface Pin { key: string; clientId: string; studentId: string | null; name: string; lat: number; lng: number; cluesSeen: number }
interface Scored extends Pin { km: number; base: number; bonus: number; total: number }

const PACKS = cityPacks as unknown as Record<string, { id: string; mysteryClues?: PackClue[] }>;
const RECENT_KEY = 'lc-mystery-flight-recent-v1';
const STARTERS = ['It might be…', 'It can’t be … because…', 'I think it’s in … because…', 'It sounds like…'];
const CLUE_ICON: Record<string, typeof Cloud> = { weather: Cloud, food: Utensils, culture: Users, nature: Trees, landmark: Landmark, giveaway: MapPin };

function readRecent(): string[] {
  try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
function writeRecent(ids: string[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, 15))); } catch { /* storage blocked */ }
}

/**
 * Mystery Flight: the class's plane flies to a secret city. Clues arrive one at a
 * time (weather, food, a photo, culture, a landmark, then a giveaway); the class
 * talks between clues; each student pins once on their phone, early + close = bonus.
 * Replaces Radar Fix and World Lens (text and photo clues are both in the deck).
 */
export function MysteryFlightGame({ students, onScore, sessionSettings, config, onSetInputSpec, onRegisterRemoteVoteHandler }: GameProps) {
  const easy = sessionSettings.difficulty === 'Beginner' || sessionSettings.difficulty === 'Easy';
  const [phase, setPhase] = useState<Phase>('idle');
  const [style, setStyle] = useState<ClueStyle>('mixed');
  const [roundCount, setRoundCount] = useState(Number(config.roundCount ?? 3) || 3);
  const [queue, setQueue] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const [shown, setShown] = useState(1);
  const [pins, setPins] = useState<Pin[]>([]);
  const [voices, setVoices] = useState<Pin[] | null>(null);
  const [whySpeaker, setWhySpeaker] = useState(false);
  const [totals, setTotals] = useState<Record<string, { name: string; points: number }>>({});
  const pinsRef = useRef<Pin[]>([]);
  pinsRef.current = pins;
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const scoredRef = useRef<Set<number>>(new Set());

  const destId = queue[round];
  const dest = destId ? getDestinationById(destId) : undefined;
  const deck: MysteryClue[] = useMemo(() => {
    if (!destId) return [];
    const place = getPlaceMediaRecordByDestination(destId);
    const photos = place ? getMediaForUsage(place, 'geo-clue').map((m) => ({ url: (m.url ?? m.thumbnailUrl)!, alt: m.alt, credit: m.creator, spoilerRisk: m.spoilerRisk })) : [];
    return buildClueDeck(PACKS[destId]?.mysteryClues ?? [], photos, style);
  }, [destId, style]);
  const roundId = destId ? `mystery-${round}-${destId}` : '';

  // ─── Phones: one pin each per flight, locked after pinning ───
  useEffect(() => {
    if (phase !== 'flying' || !roundId) { onSetInputSpec?.(null); return; }
    const locked: Record<string, unknown> = {};
    pins.forEach((p) => { locked[p.clientId] = { locked: true }; });
    onSetInputSpec?.({
      type: 'geo-point',
      gameKey: 'mystery-flight',
      prompt: 'Where are we flying? Pin it when you’re sure: earlier (and close) = bonus points!',
      roundId,
      mapCenter: [10, 18],
      mapZoom: 0.8,
      mapLabels: false,
      allowMultiple: true,
      perStudentData: locked,
    } as InputSpec);
  }, [phase, roundId, pins, onSetInputSpec]);

  const handleVote = useCallback((vote: GameRemoteVote) => {
    if (phaseRef.current !== 'flying') return;
    const g = parseWorldLensGuess(vote.choice);
    if (!g || g.roundId !== roundId) return;
    const key = vote.studentId || vote.clientId;
    if (!key || pinsRef.current.some((p) => p.key === key)) return;
    setPins((prev) => [...prev, { key, clientId: vote.clientId, studentId: vote.studentId ?? null, name: vote.displayName, lat: g.lat, lng: g.lng, cluesSeen: shownRef.current }]);
  }, [roundId]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.(handleVote);
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [handleVote, onRegisterRemoteVoteHandler]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  // ─── Flow ───
  const start = () => {
    const ids = Object.keys(PACKS).filter((id) => getDestinationById(id) && (PACKS[id].mysteryClues?.length ?? 0) >= 3);
    const picked = pickDestinations(ids, Math.max(1, Math.min(8, roundCount)), readRecent());
    writeRecent([...picked, ...readRecent()]);
    setQueue(picked);
    setRound(0);
    setTotals({});
    scoredRef.current = new Set();
    beginRound();
  };
  const beginRound = () => {
    setShown(1);
    setPins([]);
    setVoices(null);
    setWhySpeaker(false);
    setPhase('flying');
  };

  const scored: Scored[] = useMemo(() => {
    if (!dest) return [];
    return pins.map((p) => {
      const km = haversineKm(p, dest);
      const base = distancePoints(km, easy);
      const bonus = earlyBonus(p.cluesSeen, deck.length, km, easy);
      return { ...p, km, base, bonus, total: base + bonus };
    }).sort((a, b) => a.km - b.km);
  }, [pins, dest, deck.length, easy]);

  const land = () => {
    setPhase('landed');
    if (scoredRef.current.has(round)) return;
    scoredRef.current.add(round);
    const closest = scored[0];
    scored.forEach((s) => {
      const points = s.total + (closest && s.key === closest.key && scored.length > 1 ? 2 : 0);
      onScore(s.key, { isCorrect: s.base >= 3, points, ...(s.base === 5 ? { outcome: 'standout' as const } : {}), responseData: { clientId: s.clientId, destinationId: destId, distanceKm: Math.round(s.km), cluesSeen: s.cluesSeen } });
      setTotals((t) => ({ ...t, [s.key]: { name: s.name, points: (t[s.key]?.points ?? 0) + points } }));
    });
  };

  const next = () => {
    if (round + 1 >= queue.length) { setPhase('finished'); return; }
    setRound((r) => r + 1);
    beginRound();
  };

  const guesses: WorldLensGuess[] = scored.map((s) => ({ studentKey: s.key, displayName: s.name, lat: s.lat, lng: s.lng, distanceKm: s.km, basePoints: s.base, closestBonus: 0, lessonPoints: s.total }));

  // ─── Pieces ───
  const flightTrack = (
    <div className="relative h-10">
      <div className="absolute left-4 right-10 top-1/2 border-t-2 border-dashed border-white/20" />
      {deck.map((_, i) => (
        <span key={i} className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${i < shown ? 'bg-amber-300' : 'bg-white/20'}`} style={{ left: `calc(1rem + ${(i / Math.max(1, deck.length - 1)) * 100}% - ${(i / Math.max(1, deck.length - 1)) * 3.5}rem)` }} />
      ))}
      <motion.span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" animate={{ left: `calc(1rem + ${((shown - 1) / Math.max(1, deck.length - 1)) * 100}% - ${((shown - 1) / Math.max(1, deck.length - 1)) * 3.5}rem)` }} transition={{ type: 'spring', stiffness: 60, damping: 14 }}>
        <Plane className="h-8 w-8 rotate-45 text-white drop-shadow-[0_0_10px_rgba(252,211,77,0.7)]" />
      </motion.span>
      <PlaneLanding className="absolute right-0 top-1/2 h-6 w-6 -translate-y-1/2 text-white/40" />
    </div>
  );

  const clueCard = (c: MysteryClue, i: number, latest: boolean) => {
    if (c.kind === 'photo') {
      return (
        <motion.figure key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`overflow-hidden rounded-2xl border ${latest ? 'border-amber-300/60' : 'border-white/10'} bg-slate-950/50`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.url} alt={c.alt} className={`w-full object-cover ${latest ? 'max-h-[34vh]' : 'max-h-28'}`} referrerPolicy="no-referrer" />
          <figcaption className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/55"><Camera className="h-3.5 w-3.5" />Photo clue{c.credit ? ` · ${c.credit}` : ''}</figcaption>
        </motion.figure>
      );
    }
    const Icon = CLUE_ICON[c.category] ?? Sparkles;
    return (
      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${c.giveaway ? 'border-rose-300/40 bg-rose-400/[0.07]' : latest ? 'border-amber-300/60 bg-amber-300/[0.07]' : 'border-white/10 bg-slate-950/45'}`}>
        <Icon className={`mt-1 h-5 w-5 shrink-0 ${latest ? 'text-amber-300' : 'text-white/50'}`} />
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/50">{c.giveaway ? 'Final clue' : c.category}</p>
          <p className={`${latest ? 'font-display text-2xl' : 'text-lg text-white/75'} leading-snug`}>{c.text}</p>
        </div>
      </motion.div>
    );
  };

  // ─── IDLE ───
  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4 text-center text-white">
        <Plane className="mx-auto h-10 w-10 rotate-45 text-amber-300" />
        <p className="font-display text-5xl">Mystery Flight.</p>
        <p className="mx-auto max-w-xl text-lg text-white/70">We&apos;re flying somewhere secret. Clues arrive as we fly: the weather, the food, a photo, the culture… Talk it through, then pin the city on your phone. Pin early and close for bonus points!</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <KitLabel>Clues</KitLabel>
          {([['mixed', 'Words + photo'], ['text', 'Words only'], ['photo-first', 'Photo first']] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setStyle(k)} className={`rounded-full border px-3 py-1 text-sm ${style === k ? 'border-amber-300 bg-amber-300/15 text-white' : 'border-white/15 text-white/60'}`}>{label}</button>
          ))}
          <span className="mx-1 h-4 w-px bg-white/15" />
          <KitLabel>Flights</KitLabel>
          {[3, 5].map((n) => <button key={n} type="button" onClick={() => setRoundCount(n)} className={`rounded-full border px-3 py-1 text-sm ${roundCount === n ? 'border-amber-300 bg-amber-300/15 text-white' : 'border-white/15 text-white/60'}`}>{n}</button>)}
        </div>
        <div className="flex justify-center">
          <KitButton tone="amber" solid onClick={start} className="!px-8 !py-3 !text-base" icon={<Plane className="h-4 w-4" />}>Take off</KitButton>
        </div>
      </div>
    );
  }

  // ─── FLYING ───
  if (phase === 'flying' && dest) {
    const visible = deck.slice(0, shown);
    const latest = visible[visible.length - 1];
    const earlier = visible.slice(0, -1).reverse();
    return (
      <div className="mx-auto max-w-5xl space-y-4 text-white">
        <div className="flex items-center justify-between">
          <KitLabel tone="amber">Mystery Flight {round + 1} of {queue.length} · clue {shown} of {deck.length}</KitLabel>
          <KitReadout>{pins.length} / {students.length} pinned</KitReadout>
        </div>
        {flightTrack}
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="space-y-2">
            {latest && clueCard(latest, shown - 1, true)}
            <p className="flex flex-wrap gap-1.5 text-sm text-white/55">{STARTERS.map((s) => <span key={s} className="rounded-full border border-white/10 px-2.5 py-0.5">{s}</span>)}</p>
          </div>
          <div className="max-h-[42vh] space-y-2 overflow-y-auto">{earlier.map((c, i) => clueCard(c, i, false))}</div>
        </div>

        {voices && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid gap-2 sm:grid-cols-2">
            {voices.map((v) => (
              <div key={v.key} className="rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] p-4 text-center">
                <p className="font-display text-3xl">{v.name}</p>
                <p className="mt-1 text-lg text-amber-100">Where did you pin, and why?</p>
              </div>
            ))}
          </motion.div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <KitButton tone="amber" disabled={pins.length < 2} onClick={() => { const pair = mostDistantPair(pins); if (pair) setVoices(pair); }} icon={<MessageCircleQuestion className="h-3.5 w-3.5" />}>{voices ? 'Hear two others' : 'Hear both sides'}</KitButton>
            {pins.length > 0 && <span className="flex flex-wrap items-center gap-1.5">{pins.map((p) => <span key={p.key} className="flex items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-2.5 py-0.5 text-sm text-emerald-100"><MapPin className="h-3 w-3" />{p.name}</span>)}</span>}
          </div>
          <div className="flex gap-2">
            {shown < deck.length && <KitButton tone="amber" solid onClick={() => { setShown((n) => n + 1); setVoices(null); }} className="!px-5 !py-2 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>Next clue</KitButton>}
            <KitButton tone="emerald" solid onClick={land} className="!px-5 !py-2 !text-sm" icon={<PlaneLanding className="h-4 w-4" />}>Land</KitButton>
          </div>
        </div>
      </div>
    );
  }

  // ─── LANDED ───
  if (phase === 'landed' && dest) {
    const reveal = getRevealMediaForDestination(dest.id);
    const img = reveal?.url ?? reveal?.thumbnailUrl ?? dest.heroImage?.url;
    const closest = scored[0];
    return (
      <div className="mx-auto max-w-5xl space-y-4 text-white">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="text-center md:text-left">
              <KitLabel tone="emerald">We landed in</KitLabel>
              <motion.p initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 150, damping: 13 }} className="font-display text-6xl">{dest.city}</motion.p>
              <p className="text-2xl text-white/75">{dest.country}</p>
            </div>
            {img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt={dest.city} className="max-h-[30vh] w-full rounded-2xl object-cover" referrerPolicy="no-referrer" />
            )}
          </div>
          <div className="h-[40vh] min-h-[260px] overflow-hidden rounded-2xl border border-white/10">
            <WorldLensMap answer={{ name: dest.city, country: dest.country, lat: dest.lat, lng: dest.lng }} guesses={guesses} revealed />
          </div>
        </div>

        {scored.length > 0 ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {scored.map((s, i) => (
                <motion.span key={s.key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className={`flex items-center gap-2 rounded-full border px-3 py-1 text-base ${i === 0 ? 'border-amber-300/60 bg-amber-300/10' : 'border-white/12 bg-white/[0.04]'}`}>
                  {i === 0 && <Trophy className="h-4 w-4 text-amber-300" />}{s.name}
                  <span className="font-mono text-xs text-white/60">{Math.round(s.km).toLocaleString()} km · clue {s.cluesSeen}</span>
                  <span className="font-mono text-xs text-emerald-300">+{s.total}{i === 0 && scored.length > 1 ? '+2' : ''}</span>
                </motion.span>
              ))}
            </div>
            {closest && (
              whySpeaker
                ? <p className="flex items-center gap-2 text-lg text-amber-100"><Mic className="h-5 w-5" />{closest.name}, which clue gave it away for you?</p>
                : <KitButton tone="amber" onClick={() => setWhySpeaker(true)} icon={<Mic className="h-3.5 w-3.5" />}>Why there?</KitButton>
            )}
          </div>
        ) : <p className="text-white/55">No pins this flight.</p>}

        <div className="flex justify-end">
          <KitButton tone="amber" solid onClick={next} className="!px-6 !py-2.5 !text-sm" icon={<Plane className="h-4 w-4" />}>{round + 1 < queue.length ? 'Next mystery flight' : 'Final results'}</KitButton>
        </div>
      </div>
    );
  }

  // ─── FINISHED ───
  const board = Object.entries(totals).map(([k, v]) => ({ k, ...v })).sort((a, b) => b.points - a.points);
  return (
    <div className="mx-auto max-w-3xl space-y-5 py-6 text-center text-white">
      <Trophy className="mx-auto h-10 w-10 text-amber-300" />
      <p className="font-display text-5xl">{board[0] ? `${board[0].name} is our top navigator!` : 'Flights complete!'}</p>
      <p className="text-white/65">{queue.map((id) => getDestinationById(id)?.city).filter(Boolean).join(' · ')}</p>
      <div className="mx-auto max-w-md space-y-1.5">
        {board.slice(0, 5).map((b, i) => (
          <div key={b.k} className={`flex items-center justify-between rounded-xl border px-4 py-2 ${i === 0 ? 'border-amber-300/50 bg-amber-300/10' : 'border-white/10 bg-slate-950/40'}`}>
            <span className="font-semibold">{b.name}</span><span className="font-mono text-emerald-300">{b.points}</span>
          </div>
        ))}
      </div>
      <KitButton className="mx-auto" onClick={() => setPhase('idle')}>New flights</KitButton>
    </div>
  );
}
