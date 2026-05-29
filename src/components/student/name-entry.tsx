'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TakeoffSpark } from '@/components/ui/takeoff-spark';
import { AVATAR_SEEDS, DEFAULT_AVATAR_SEED, avatarUrl } from '@/lib/avatar-options';
import type { Team } from '@/lib/supabase/types';

interface RosterStudent {
  id: string;
  name: string;
  avatar_seed: string;
}

interface StudentSession {
  clientId: string;
  studentId: string | null;
  displayName: string;
  team: Team | null;
  avatarSeed: string;
}

interface NameEntryProps {
  sessionId: string;
  onJoin: (data: StudentSession) => void;
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

    try {
      if (freeTextMode || !selected) {
        // Shape B: new name
        const name = freeName.trim();
        if (!name) { setIsJoining(false); return; }
        const res = await fetch('/api/student/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, newName: name, avatarSeed, clientId }),
        });
        if (res.ok) {
          const data = await res.json();
          studentId = data.studentId;
          displayName = data.name ?? name;
        } else {
          displayName = name;
        }
      } else {
        // Shape A: roster pick
        const res = await fetch('/api/student/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, studentId: selected.id, avatarSeed, clientId }),
        });
        if (res.ok) {
          const data = await res.json();
          studentId = data.studentId ?? selected.id;
          displayName = data.name ?? selected.name;
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
    };

    try {
      localStorage.setItem(`studentSession_${sessionId}`, JSON.stringify(sessionData));
    } catch (e) {
      console.error('Failed to save session data:', e);
    }

    onJoin(sessionData);
  };

  const filteredRoster = search.trim()
    ? roster.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : roster;

  const canJoin = freeTextMode ? freeName.trim().length > 0 : selected !== null;

  // Loading state
  if (!rosterLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <TakeoffSpark size={48} loading />
        <p className="text-xs text-gray-500 uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="glass rounded-3xl p-5 sm:p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Join Session</h1>
          <p className="text-gray-400 text-sm">
            {freeTextMode ? 'Enter your name to participate' : 'Find your name to join'}
          </p>
        </div>

        {/* ── Roster picker mode ──────────────────────────────────── */}
        {!freeTextMode && (
          <div className="space-y-4">
            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your name..."
              autoFocus
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            />

            {/* Name list */}
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {filteredRoster.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-4">No match — try scrolling or use &quot;not on the list&quot; below</p>
              ) : (
                filteredRoster.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => handleSelectStudent(student)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                      selected?.id === student.id
                        ? 'bg-cyan-500/20 ring-2 ring-cyan-400'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarUrl(selected?.id === student.id ? avatarSeed : student.avatar_seed)}
                      alt=""
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-lg flex-shrink-0"
                    />
                    <span className="font-semibold text-white">{student.name}</span>
                    {selected?.id === student.id && (
                      <span className="ml-auto text-cyan-400 text-sm font-medium">Selected</span>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Avatar picker — shown only after selecting a name */}
            {selected && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Choose Your Avatar
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {AVATAR_SEEDS.map((seed) => (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => setAvatarSeed(seed)}
                      className={`relative p-1.5 rounded-xl transition-all ${
                        avatarSeed === seed
                          ? 'ring-2 ring-cyan-400 scale-105 bg-white/10'
                          : 'opacity-50 hover:opacity-80 hover:bg-white/5'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarUrl(seed)} alt={seed} width={64} height={64} className="w-full h-auto rounded-lg" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Not on the list */}
            <button
              type="button"
              onClick={() => { setFreeTextMode(true); setSelected(null); }}
              className="w-full py-3 text-sm font-medium text-gray-300 border border-white/20 rounded-xl hover:bg-white/10 hover:border-white/40 hover:text-white transition-all"
            >
              My name isn&apos;t here
            </button>
          </div>
        )}

        {/* ── Free-text mode ──────────────────────────────────────── */}
        {freeTextMode && (
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Your Name
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
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Choose Your Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_SEEDS.map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setAvatarSeed(seed)}
                    className={`relative p-1.5 rounded-xl transition-all ${
                      avatarSeed === seed
                        ? 'ring-2 ring-cyan-400 scale-105 bg-white/10'
                        : 'opacity-50 hover:opacity-80 hover:bg-white/5'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarUrl(seed)} alt={seed} width={64} height={64} className="w-full h-auto rounded-lg" />
                  </button>
                ))}
              </div>
            </div>

            {/* Back to roster if roster was available */}
            {roster.length > 0 && (
              <button
                type="button"
                onClick={() => { setFreeTextMode(false); setFreeName(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors py-1"
              >
                ← Back to class list
              </button>
            )}
          </div>
        )}

        <Button
          onClick={handleJoin}
          disabled={!canJoin || isJoining}
          className="w-full py-4 text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isJoining ? 'Joining...' : 'Join Session'}
        </Button>
      </div>
    </div>
  );
}
