'use client';

import { useState, useEffect } from 'react';
import { Plane, PlaneTakeoff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TakeoffSpark } from '@/components/ui/takeoff-spark';
import { StudentSkyShell } from '@/components/student/student-sky-shell';
import { AVATAR_SEEDS, HELMET_AVATAR_SEEDS, CAPTAIN_AVATAR_SEEDS, DEFAULT_AVATAR_SEED, avatarUrl } from '@/lib/avatar-options';
import { CrewAvatar } from '@/components/ui/crew-avatar';
import type { Team } from '@/lib/supabase/types';
import { trackEvent } from '@/lib/analytics/posthog';

interface RosterStudent {
  id: string;
  name: string;
  avatar_seed: string;
  is_captain_of_the_day?: boolean;
}

interface StudentSession {
  clientId: string;
  studentId: string | null;
  displayName: string;
  team: Team | null;
  avatarSeed: string;
  /** Reigning Captain of the Day — wears the wings insignia this session. */
  captain?: boolean;
}

interface NameEntryProps {
  sessionId: string;
  onJoin: (data: StudentSession) => void;
}

// Grouped avatar picker — on-theme flight helmets + captain's caps, shown in labeled rows.
function AvatarPicker({ value, onChange }: { value: string; onChange: (seed: string) => void }) {
  const groups: Array<{ label: string; seeds: readonly string[] }> = [
    { label: 'Flight Helmets', seeds: HELMET_AVATAR_SEEDS },
    { label: "Captain's Caps", seeds: CAPTAIN_AVATAR_SEEDS },
  ];
  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="font-instrument mb-1.5 text-[10px] uppercase tracking-[0.18em] text-lc-text3/70">
            {group.label}
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {group.seeds.map((seed) => (
              <button
                key={seed}
                type="button"
                onClick={() => onChange(seed)}
                className={`relative rounded-xl p-1.5 transition-all ${
                  value === seed
                    ? 'scale-105 bg-white/10 ring-2 ring-cyan-400'
                    : 'opacity-50 hover:bg-white/5 hover:opacity-80'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl(seed)} alt={seed} width={64} height={64} className="h-auto w-full rounded-lg" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getOrCreateClientId(sessionId: string): string {
  const storageKey = `studentSession_${sessionId}`;
  try {
    const existing = localStorage.getItem(storageKey);
    if (existing) {
      const parsed = JSON.parse(existing);
      if (parsed.clientId) return parsed.clientId;
    }
  } catch { /* ignore */ }
  return generateUUID();
}

// The join API upserts on (session_id, client_id) with ignoreDuplicates, and for
// new names it re-matches by name within the class — so replaying the same
// payload is always safe, even if an earlier attempt actually landed.
function scheduleJoinRetry(payload: Record<string, unknown>) {
  const delays = [2000, 5000, 15000];
  let attempt = 0;
  const tryOnce = () => {
    setTimeout(() => {
      fetch('/api/student/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error('join retry failed');
        })
        .catch(() => {
          attempt += 1;
          if (attempt < delays.length) tryOnce();
        });
    }, delays[attempt]);
  };
  tryOnce();
}

export function NameEntry({ sessionId, onJoin }: NameEntryProps) {
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [rosterLoaded, setRosterLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RosterStudent | null>(null);
  const [avatarSeed, setAvatarSeed] = useState<string>(DEFAULT_AVATAR_SEED);
  const [freeTextMode, setFreeTextMode] = useState(false);
  const [freeName, setFreeName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Load class roster on mount
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/student/roster?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setRoster(data.students ?? []);
        setRosterLoaded(true);
        // If roster is empty, go straight to free-text
        if (!data.students || data.students.length === 0) {
          setFreeTextMode(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setRosterLoaded(true);
        setFreeTextMode(true);
      });
    return () => { cancelled = true; };
  }, [sessionId]);

  const handleSelectStudent = (student: RosterStudent) => {
    setSelected(student);
    setAvatarSeed(student.avatar_seed || AVATAR_SEEDS[0]);
  };

  const handleJoin = async () => {
    setIsJoining(true);
    const clientId = getOrCreateClientId(sessionId);

    let studentId: string | null = null;
    let displayName = '';
    let joinPayload: Record<string, unknown> | null = null;
    let joinSucceeded = false;

    try {
      if (freeTextMode || !selected) {
        // Shape B: new name
        const name = freeName.trim();
        if (!name) { setIsJoining(false); return; }
        joinPayload = { sessionId, newName: name, avatarSeed, clientId };
        const res = await fetch('/api/student/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(joinPayload),
        });
        if (res.ok) {
          const data = await res.json();
          studentId = data.studentId;
          displayName = data.name ?? name;
          joinSucceeded = true;
        } else {
          displayName = name;
        }
      } else {
        // Shape A: roster pick
        joinPayload = { sessionId, studentId: selected.id, avatarSeed, clientId };
        const res = await fetch('/api/student/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(joinPayload),
        });
        if (res.ok) {
          const data = await res.json();
          studentId = data.studentId ?? selected.id;
          displayName = data.name ?? selected.name;
          joinSucceeded = true;
        } else {
          studentId = selected.id;
          displayName = selected.name;
        }
      }
    } catch (e) {
      console.error('Failed to call join API:', e);
      displayName = freeTextMode ? freeName.trim() : (selected?.name ?? '');
    }

    const sessionData: StudentSession = {
      clientId,
      studentId,
      displayName,
      team: null,
      avatarSeed,
      captain: !freeTextMode && !!selected?.is_captain_of_the_day,
    };

    try {
      localStorage.setItem(`studentSession_${sessionId}`, JSON.stringify(sessionData));
    } catch (e) {
      console.error('Failed to save session data:', e);
    }

    // Anonymous only — never identify() students or send their name/email.
    trackEvent('student_joined_session', { sessionId });

    onJoin(sessionData);

    // Never block the student on this — retry participant registration
    // silently in the background so scoring/participation aren't lost.
    if (!joinSucceeded && joinPayload) {
      scheduleJoinRetry(joinPayload);
    }
  };

  const filteredRoster = search.trim()
    ? roster.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : roster;

  const canJoin = freeTextMode ? freeName.trim().length > 0 : selected !== null;

  // Same fallback callsign the teacher's departure board shows (LC-XXXX), so the
  // student's pass visibly matches the projected screen.
  const flightCode = `LC-${sessionId.slice(-4).toUpperCase()}`;

  // Loading state
  if (!rosterLoaded) {
    return (
      <StudentSkyShell weather="idle" center>
        <div className="flex flex-col items-center gap-3">
          <TakeoffSpark size={48} loading />
          <p className="font-instrument text-xs uppercase tracking-widest text-lc-text3">Preparing boarding…</p>
        </div>
      </StudentSkyShell>
    );
  }

  return (
    <StudentSkyShell weather="idle" center>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-cyan-300/25 bg-[#0a1424]/90 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)] backdrop-blur-md">
        {/* Ticket header */}
        <div className="flex items-center justify-between border-b border-cyan-300/15 bg-gradient-to-r from-[#0b1c38]/90 to-[#060f1f]/90 px-5 py-3">
          <span className="flex items-center gap-2">
            <Plane className="h-4 w-4 rotate-45 text-cyan-300" aria-hidden />
            <span className="font-instrument text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
              Boarding pass
            </span>
          </span>
          <span className="font-instrument text-[11px] uppercase tracking-[0.18em] text-lc-amber">
            {flightCode}
          </span>
        </div>

        {/* Now-boarding strip — mirrors the teacher lobby's gate-board chip */}
        <div className="flex items-center gap-2 border-b border-cyan-300/10 px-5 py-2">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)] motion-safe:animate-pulse"
            aria-hidden
          />
          <span className="font-instrument text-[10px] uppercase tracking-[0.24em] text-emerald-300/90">
            Now boarding
          </span>
          <span className="ml-auto truncate text-xs text-lc-text3">
            {freeTextMode ? 'Enter your name to board' : 'Find your name to board'}
          </span>
        </div>

        <div className="space-y-4 p-5">
          {/* ── Roster picker mode ──────────────────────────────────── */}
          {!freeTextMode && (
            <div className="space-y-4">
              <div>
                <label htmlFor="passenger-search" className="font-instrument mb-2 block text-[10px] uppercase tracking-[0.22em] text-lc-text3">
                  Passenger
                </label>
                <input
                  id="passenger-search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your name..."
                  autoFocus
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-lc-text3 transition-all focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>

              {/* Name list */}
              <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                {filteredRoster.length === 0 ? (
                  <p className="py-4 text-center text-sm text-lc-text3">No match — try scrolling or use &quot;not on the list&quot; below</p>
                ) : (
                  filteredRoster.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => handleSelectStudent(student)}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                        selected?.id === student.id
                          ? 'bg-cyan-500/20 ring-2 ring-cyan-400'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <CrewAvatar
                        seed={selected?.id === student.id ? avatarSeed : student.avatar_seed}
                        captain={!!student.is_captain_of_the_day}
                        size={40}
                      />
                      <span className="font-semibold text-white">{student.name}</span>
                      {selected?.id === student.id && (
                        <span className="font-instrument ml-auto text-[10px] uppercase tracking-wider text-cyan-400">Seated</span>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Captain of the Day — welcome the returning winner */}
              {selected?.is_captain_of_the_day && (
                <div className="flex items-center gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2.5">
                  <CrewAvatar seed={avatarSeed} captain size={34} />
                  <div>
                    <p className="font-instrument text-[10px] uppercase tracking-[0.2em] text-amber-300/90">
                      Captain of the Day
                    </p>
                    <p className="text-sm font-semibold text-white">Welcome back, Captain — you&apos;re wearing the wings.</p>
                  </div>
                </div>
              )}

              {/* Avatar picker — shown only after selecting a name */}
              {selected && (
                <div>
                  <label className="font-instrument mb-2 block text-[10px] uppercase tracking-[0.22em] text-lc-text3">
                    Passport photo
                  </label>
                  <AvatarPicker value={avatarSeed} onChange={setAvatarSeed} />
                </div>
              )}

              {/* Not on the list */}
              <button
                type="button"
                onClick={() => { setFreeTextMode(true); setSelected(null); }}
                className="w-full rounded-xl border border-white/15 py-3 text-sm font-medium text-lc-text2 transition-all hover:border-white/40 hover:bg-white/10 hover:text-white"
              >
                My name isn&apos;t here
              </button>
            </div>
          )}

          {/* ── Free-text mode ──────────────────────────────────────── */}
          {freeTextMode && (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="font-instrument mb-2 block text-[10px] uppercase tracking-[0.22em] text-lc-text3">
                  Passenger
                </label>
                <input
                  id="name"
                  type="text"
                  value={freeName}
                  onChange={(e) => setFreeName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && freeName.trim()) handleJoin(); }}
                  placeholder="Enter your name..."
                  maxLength={40}
                  autoFocus
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-lc-text3 transition-all focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>

              <div>
                <label className="font-instrument mb-2 block text-[10px] uppercase tracking-[0.22em] text-lc-text3">
                  Passport photo
                </label>
                <AvatarPicker value={avatarSeed} onChange={setAvatarSeed} />
              </div>

              {/* Back to roster if roster was available */}
              {roster.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setFreeTextMode(false); setFreeName(''); }}
                  className="w-full py-1 text-sm text-lc-text3 transition-colors hover:text-lc-text2"
                >
                  ← Back to class list
                </button>
              )}
            </div>
          )}
        </div>

        {/* Perforated ticket divider */}
        <div className="relative px-5" aria-hidden>
          <span className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[#070B14]" />
          <span className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[#070B14]" />
          <div className="border-t border-dashed border-cyan-300/25" />
        </div>

        <div className="space-y-3 p-5">
          <Button
            onClick={handleJoin}
            disabled={!canJoin || isJoining}
            variant="hero"
            className="w-full gap-2 py-4 text-lg font-bold"
          >
            <PlaneTakeoff className="h-5 w-5" aria-hidden />
            {isJoining ? 'Boarding…' : 'Board Flight'}
          </Button>
          {/* Ticket barcode */}
          <div
            aria-hidden
            className="mx-auto h-7 w-44 opacity-40"
            style={{
              background:
                'repeating-linear-gradient(90deg, #EAF1FF 0 2px, transparent 2px 5px, #EAF1FF 5px 6px, transparent 6px 10px, #EAF1FF 10px 13px, transparent 13px 16px)',
            }}
          />
        </div>
      </div>
    </StudentSkyShell>
  );
}
