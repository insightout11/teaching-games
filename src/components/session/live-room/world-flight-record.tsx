'use client';

import { useEffect, useState } from 'react';
import { Check, Compass, Loader2, Plane, Search, Stamp, Star, X } from 'lucide-react';
import { WorldFlightUpgradeProgress } from '@/components/session/end-session-summary';
import type { WorldFlightProgressionRewardResult, WorldFlightUpgradeState } from '@/lib/world-flight/progression';

export interface WorldFlightRecordData {
  classId: string;
  currentCity: string | null;
  stamps: Array<{ destinationId: string; city: string; at: string | null }>;
  flights: Array<{ destinationId: string; city: string; from: string | null; lesson: string | null; flew: boolean; km: number; at: string | null }>;
  investigations: Array<{ id: string; title: string; question: string; found: number; total: number; designDone: boolean; clues: Array<{ label: string; done: boolean; where: string | null }> }>;
  expedition: { runId: string; expeditionId: string; paused: boolean; title: string; question: string; done: number; needed: number; remaining: string[] } | null;
  expeditions: Array<{ id: string; title: string; subtitle: string; lessons: string; needed: number; stops: string[] }>;
  hangar: { planeChoices: string[]; flightHours: number; crewStars: number; planeTier: number; planeKey: string; planeSelectionRequired: boolean; rangeKm: number; upgradeState: WorldFlightUpgradeState };
  landing: { city: string; moves: boolean; newCity: boolean; lesson: string | null; everyoneAboard: boolean; strongLanding: boolean; stars: number; after: WorldFlightUpgradeState; hoursAfter: number; starsAfter: number } | null;
}

/** The class's World Flight record for this session (Passport, Hangar, landing card). Null while loading or offline. */
export function useWorldFlightRecord(sessionId: string, refreshKey: unknown) {
  const [data, setData] = useState<WorldFlightRecordData | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    fetch(`/api/session/${encodeURIComponent(sessionId)}/world-flight`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: WorldFlightRecordData) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [sessionId, refreshKey]);
  return { data, failed };
}

const day = (at: string | null) => (at ? new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '');

/**
 * Passport and Hangar, inside the class. Safe on the shared screen: it shows the class's journey, never a student.
 */
export function WorldFlightRecordPanel({ sessionId, className, initialTab = 'passport', canLaunch, onStartDesignMission, onPlaneVote, onClose }: {
  sessionId: string;
  className: string;
  initialTab?: 'passport' | 'hangar';
  /** False while a flight plan is running: a Design mission cannot be started on top of it. */
  canLaunch: boolean;
  onStartDesignMission: (investigationId: string) => void;
  /** Open a class vote on the planes on offer. */
  onPlaneVote: (planes: string[]) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'passport' | 'hangar'>(initialTab);
  const [refresh, setRefresh] = useState(0);
  const { data, failed } = useWorldFlightRecord(sessionId, refresh);
  const [choosing, setChoosing] = useState(false);
  const [busy, setBusy] = useState(false);
  // Start, pause, resume or leave an expedition. Starting a new one ends the one in progress, so that asks first.
  const [confirmStart, setConfirmStart] = useState<string | null>(null);
  const expeditionAction = async (action: 'activate' | 'pause' | 'resume' | 'leave', expeditionId: string, runId?: string) => {
    if (!data || busy) return;
    setBusy(true);
    try {
      await fetch('/api/world-flight/expeditions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classId: data.classId, action, expeditionId, ...(runId ? { runId } : {}) }) });
      setChoosing(false);
      setConfirmStart(null);
      setRefresh((n) => n + 1);
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col rounded-3xl border border-white/10 bg-slate-950 text-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-300">{className}</p>
            <p className="font-display text-2xl">Our journey</p>
          </div>
          {(['passport', 'hangar'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm ${tab === t ? 'border-amber-300 bg-amber-300/10 text-amber-100' : 'border-white/15 text-white/70 hover:text-white'}`}>
              {t === 'passport' ? <Stamp className="h-4 w-4" /> : <Plane className="h-4 w-4" />}{t === 'passport' ? 'Passport' : 'Hangar'}
            </button>
          ))}
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-white/60 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {!data && !failed && <p className="flex items-center gap-2 py-10 text-white/60"><Loader2 className="h-4 w-4 animate-spin" />Opening the passport…</p>}
          {failed && <p className="py-10 text-white/60">The journey could not be loaded just now. Close this and try again.</p>}

          {data && tab === 'passport' && (
            <div className="space-y-6">
              <section>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Stamps · {data.stamps.length} {data.stamps.length === 1 ? 'city' : 'cities'}{data.currentCity ? ` · now in ${data.currentCity}` : ''}</p>
                {data.stamps.length === 0 ? (
                  <p className="mt-2 text-white/60">No stamps yet. The first one arrives when the class lands.</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {data.stamps.map((s, i) => (
                      <span key={s.destinationId} className="rounded-lg border-2 px-3 py-1.5 text-center font-mono text-xs uppercase tracking-[0.08em]" style={{ borderColor: i % 2 ? '#5aa9c9' : '#d4537e', color: i % 2 ? '#a8dcf0' : '#f0a4bf', transform: `rotate(${i % 2 ? 3 : -4}deg)` }}>
                        <span className="block text-sm font-semibold">{s.city}</span>
                        <span className="block text-[10px] opacity-75">{day(s.at)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {data.expedition && (
                <section className="rounded-2xl border border-emerald-300/25 bg-emerald-400/[0.05] p-4">
                  <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-200"><Compass className="h-4 w-4" />Expedition{data.expedition.paused ? ' (paused)' : ''} · {data.expedition.done} of {data.expedition.needed} stops</p>
                  <p className="mt-1 font-display text-xl">{data.expedition.title}</p>
                  <p className="text-sm text-white/65">{data.expedition.question}</p>
                  {data.expedition.remaining.length > 0 && data.expedition.done < data.expedition.needed && (
                    <p className="mt-2 text-sm text-white/65">Still to visit: {data.expedition.remaining.join(', ')}.</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <button type="button" disabled={busy} onClick={() => void expeditionAction(data.expedition!.paused ? 'resume' : 'pause', data.expedition!.expeditionId, data.expedition!.runId)} className="rounded-full border border-white/20 px-3 py-1 text-white/80 hover:text-white disabled:opacity-50">{data.expedition.paused ? 'Resume' : 'Pause'}</button>
                    <button type="button" disabled={busy} onClick={() => setChoosing((v) => !v)} className="rounded-full border border-white/20 px-3 py-1 text-white/80 hover:text-white disabled:opacity-50">Change expedition</button>
                  </div>
                </section>
              )}
              {!data.expedition && !choosing && (
                <button type="button" onClick={() => setChoosing(true)} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-emerald-300/30 px-4 py-3 text-left text-sm text-emerald-100 hover:bg-emerald-400/[0.05]">
                  <Compass className="h-5 w-5 shrink-0" />
                  <span><span className="block font-semibold">Start an expedition</span><span className="block text-white/55">A themed route across several cities with one big question. Visiting its cities counts, whatever you teach there.</span></span>
                </button>
              )}
              {choosing && (
                <section>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Choose an expedition</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {data.expeditions.filter((e) => e.id !== data.expedition?.expeditionId).map((e) => (
                      <div key={e.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="font-semibold">{e.title}</p>
                        <p className="text-xs text-white/55">{e.subtitle}</p>
                        <p className="mt-1 text-xs text-white/45">Visit {e.needed} of: {e.stops.join(', ')}. {e.lessons}.</p>
                        {confirmStart === e.id ? (
                          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-amber-100">
                            This ends the current expedition.
                            <button type="button" disabled={busy} onClick={() => void expeditionAction('activate', e.id)} className="rounded-full bg-amber-300 px-3 py-1 font-semibold text-slate-950 disabled:opacity-50">Start it</button>
                            <button type="button" onClick={() => setConfirmStart(null)} className="text-white/60 hover:text-white">Keep the current one</button>
                          </p>
                        ) : (
                          <button type="button" disabled={busy} onClick={() => (data.expedition ? setConfirmStart(e.id) : void expeditionAction('activate', e.id))} className="mt-2 rounded-full border border-emerald-300/40 px-3 py-1 text-xs text-emerald-100 hover:bg-emerald-400/10 disabled:opacity-50">Start this expedition</button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Investigations · clues come from a city&apos;s own lessons</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {data.investigations.map((inv) => (
                    <div key={inv.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 font-semibold"><Search className="h-4 w-4 text-sky-300" />{inv.title}</span>
                        <span className="font-mono text-xs text-white/55">{inv.found}/{inv.total}</span>
                      </p>
                      <ul className="mt-2 space-y-1">
                        {inv.clues.map((c) => (
                          <li key={c.label} className={`flex items-start gap-1.5 text-sm ${c.done ? 'text-white/85' : 'text-white/40'}`}>
                            <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${c.done ? 'text-emerald-300' : 'opacity-30'}`} />
                            <span>{c.label}{c.where ? <span className="block text-xs text-white/45">{c.where}</span> : null}</span>
                          </li>
                        ))}
                      </ul>
                      {inv.designDone
                        ? <p className="mt-2 text-xs text-emerald-200">Design mission complete.</p>
                        : inv.found >= inv.total && (
                          <div className="mt-2">
                            <p className="text-xs text-amber-200">All clues found: the Design mission is unlocked.</p>
                            <button type="button" disabled={!canLaunch} onClick={() => onStartDesignMission(inv.id)} title={canLaunch ? 'The class designs something from the evidence it collected' : 'Finish the flight plan that is running first'} className="mt-1.5 rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-slate-950 disabled:opacity-40">Start the Design mission</button>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Flight log</p>
                {data.flights.length === 0 ? <p className="mt-2 text-white/60">Nothing logged yet.</p> : (
                  <ul className="mt-2 divide-y divide-white/10 rounded-2xl border border-white/10">
                    {data.flights.slice(0, 40).map((f, i) => (
                      <li key={`${f.destinationId}-${f.at}-${i}`} className="flex items-baseline gap-3 px-3 py-2 text-sm">
                        <span className="w-14 shrink-0 font-mono text-xs text-white/45">{day(f.at)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="text-white">{f.flew ? `${f.from ?? 'LC International'} → ${f.city}` : `${f.city} lesson, taught without flying`}</span>
                          <span className="block truncate text-xs text-white/50">{f.lesson ?? 'No city lesson'}</span>
                        </span>
                        {f.flew && <span className="shrink-0 font-mono text-xs text-white/45">{f.km.toLocaleString()} km</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

          {data && tab === 'hangar' && (
            <div className="space-y-3">
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
                <span className="flex items-center gap-1.5"><Plane className="h-4 w-4 text-sky-300" />{data.hangar.flightHours} flight hour{data.hangar.flightHours === 1 ? '' : 's'}</span>
                <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-amber-300" />{data.hangar.crewStars} crew star{data.hangar.crewStars === 1 ? '' : 's'}</span>
                <span className="font-mono text-xs text-white/50">Range {data.hangar.rangeKm.toLocaleString()} km</span>
              </p>
              <p className="text-sm text-white/55">
                Every finished lesson earns 1 flight hour and up to 2 stars: <span className="text-white/80">Everyone Aboard</span> (most of the class took part) and <span className="text-white/80">Strong Landing</span> (most answers right, or most of the class on task). The class keeps flying its current plane until it chooses a new one.
              </p>
              {data.hangar.planeChoices.length > 1 && (
                <p className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/[0.06] px-3 py-2 text-sm text-amber-100">
                  A new plane is ready: {data.hangar.planeChoices.join(', ')}.
                  <button type="button" onClick={() => onPlaneVote(data.hangar.planeChoices)} className="rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-slate-950">Let the class vote</button>
                  <span className="text-xs text-amber-100/70">Then pick the winner below.</span>
                </p>
              )}
              <div className="-mx-5 theme-Midnight">
                <WorldFlightUpgradeProgress
                  reward={{ ...data.hangar, flightHoursAwarded: 0, crewStarsAwarded: 0, alreadyRecorded: true, snapshot: { participantCount: 0, meaningfulParticipantCount: 0, meaningfulParticipationRate: 0, accuracyAttemptCount: 0, accuracyRate: null, onTaskParticipantCount: 0, onTaskParticipationRate: 0, everyoneAboardEarned: false, strongLandingEarned: false } } as unknown as WorldFlightProgressionRewardResult}
                  classId={data.classId}
                  sessionId={sessionId}
                  teacherView
                  previewMode={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** The landing card's reward lines: what this lesson earned, shown while the class is still there. */
export function LandingRewards({ landing }: { landing: NonNullable<WorldFlightRecordData['landing']> }) {
  const next = landing.after.nextMilestone;
  const ready = landing.after.claimableTier !== null;
  return (
    <div className="mt-3 space-y-1.5 rounded-xl bg-[#1b2233]/[0.06] px-3 py-2 text-sm text-[#1b2233]">
      <p className="flex items-center gap-2"><Stamp className="h-4 w-4 text-[#d4537e]" />{landing.newCity ? `New stamp: ${landing.city}` : `Back in ${landing.city}`}{landing.lesson ? ` · ${landing.lesson}` : ''}</p>
      <p className="flex flex-wrap items-center gap-x-2">
        <Plane className="h-4 w-4" />+1 flight hour
        <Star className="ml-2 h-4 w-4 text-amber-600" />+{landing.stars} star{landing.stars === 1 ? '' : 's'}
        <span className="text-[#1b2233]/60">
          {[landing.everyoneAboard && 'Everyone Aboard', landing.strongLanding && 'Strong Landing'].filter(Boolean).join(' · ') || 'No stars this time'}
        </span>
      </p>
      <p className="text-xs text-[#1b2233]/70">
        {ready
          ? 'A new plane is ready: choose it when you end class, or from the Hangar.'
          : next
            ? `Next plane: ${Math.max(0, next.requiredFlightHours - landing.hoursAfter)} more hour${next.requiredFlightHours - landing.hoursAfter === 1 ? '' : 's'} and ${Math.max(0, next.requiredCrewStars - landing.starsAfter)} more star${next.requiredCrewStars - landing.starsAfter === 1 ? '' : 's'}.`
            : 'The hangar is fully upgraded.'}
      </p>
    </div>
  );
}
