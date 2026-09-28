'use client';

import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Search, Trophy, Users } from 'lucide-react';
import type { GamePlugin } from '@/games/types';
import type { ActivityPlugin } from '@/activities/types';
import { useSessionStore } from '@/stores/session-store';
import { countsForLeaderboard } from '@/lib/scoring-reporting';
import { ROOM_PROMPTS } from '@/components/session/live-room/room-prompts';

/**
 * The Live Room — where a session without a lesson plan lives between
 * activities. Students board while the teacher is already talking (warm-up
 * prompt on the stage), any game or activity launches from the dock, and
 * finishing it returns here with scores intact (scores live in the session
 * store, not in this view).
 */

export interface RoomParticipant {
  id: string;
  display_name: string;
  joined_at: string;
}

type Launchable =
  | { kind: 'game'; plugin: GamePlugin }
  | { kind: 'activity'; plugin: ActivityPlugin };

interface LiveRoomViewProps {
  sessionId: string;
  joinUrl: string;
  participants: RoomParticipant[];
  games: GamePlugin[];
  activities: ActivityPlugin[];
  onLaunchGame: (game: GamePlugin) => void;
  onLaunchActivity: (activity: ActivityPlugin) => void;
}

const RECENT_LIMIT = 6;
const recentKey = (sessionId: string) => `lc-room-recent:${sessionId}`;

function readRecent(sessionId: string): string[] {
  try {
    const raw = sessionStorage.getItem(recentKey(sessionId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

function writeRecent(sessionId: string, keys: string[]) {
  try {
    sessionStorage.setItem(recentKey(sessionId), JSON.stringify(keys));
  } catch {
    // storage unavailable — recents are a convenience only
  }
}

export function LiveRoomView({
  sessionId,
  joinUrl,
  participants,
  games,
  activities,
  onLaunchGame,
  onLaunchActivity,
}: LiveRoomViewProps) {
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * ROOM_PROMPTS.length));
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => setRecent(readRecent(sessionId)), [sessionId]);

  const catalogue = useMemo<Launchable[]>(
    () => [
      ...games.map((plugin) => ({ kind: 'game' as const, plugin })),
      ...activities.map((plugin) => ({ kind: 'activity' as const, plugin })),
    ],
    [games, activities],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const recentItems = recent
        .map((key) => catalogue.find((c) => c.plugin.key === key))
        .filter((c): c is Launchable => !!c);
      return { label: recentItems.length ? 'Recent' : 'Suggested', items: recentItems.length ? recentItems : catalogue.slice(0, 8) };
    }
    const items = catalogue.filter(({ plugin }) =>
      plugin.name.toLowerCase().includes(q)
      || plugin.description.toLowerCase().includes(q)
      || (plugin.skills ?? []).some((s) => s.toLowerCase().includes(q)),
    );
    return { label: `${items.length} match${items.length === 1 ? '' : 'es'}`, items: items.slice(0, 12) };
  }, [query, recent, catalogue]);

  const launch = (item: Launchable) => {
    const next = [item.plugin.key, ...recent.filter((k) => k !== item.plugin.key)].slice(0, RECENT_LIMIT);
    writeRecent(sessionId, next);
    setRecent(next);
    if (item.kind === 'game') onLaunchGame(item.plugin);
    else onLaunchActivity(item.plugin);
  };

  const students = useSessionStore((s) => s.students);
  const scores = useSessionStore((s) => s.scores);
  const topCrew = useMemo(() => {
    const totals = new Map<string, { name: string; points: number }>();
    students.forEach((s) => totals.set(s.id, { name: s.name, points: 0 }));
    scores.filter(countsForLeaderboard).forEach((sc) => {
      const key = sc.student_id || sc.client_id;
      if (!key) return;
      const entry = totals.get(key) ?? (sc.display_name ? { name: sc.display_name, points: 0 } : null);
      if (!entry) return;
      entry.points += sc.points;
      totals.set(key, entry);
    });
    return Array.from(totals.values()).filter((e) => e.points > 0).sort((a, b) => b.points - a.points).slice(0, 3);
  }, [students, scores]);

  const sortedParticipants = useMemo(
    () => [...participants].sort((a, b) => a.joined_at.localeCompare(b.joined_at)),
    [participants],
  );
  const newestId = sortedParticipants[sortedParticipants.length - 1]?.id;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* Stage */}
      <section className="flex min-h-[340px] flex-col gap-5 rounded-2xl border border-white/10 bg-slate-950/55 p-6 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
            {participants.length === 0 ? 'Warm-up · while everyone boards' : 'Talking point'}
          </p>
          <button
            type="button"
            onClick={() => setPromptIndex((i) => (i + 1) % ROOM_PROMPTS.length)}
            className="flex min-h-9 shrink-0 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm text-white/80 transition-colors hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Next prompt
          </button>
        </div>
        <p className="max-w-3xl font-display text-3xl leading-tight text-white sm:text-4xl" style={{ textWrap: 'balance' }}>
          {ROOM_PROMPTS[promptIndex].prompt}
        </p>
        {ROOM_PROMPTS[promptIndex].followUps.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {ROOM_PROMPTS[promptIndex].followUps.map((f) => (
              <span key={f} className="rounded-full border border-white/12 bg-slate-900/70 px-3 py-1.5 text-sm text-white/75">
                <span className="font-semibold text-white">Go deeper:</span> {f}
              </span>
            ))}
          </div>
        )}

        {/* Launcher */}
        <div className="mt-auto flex flex-col gap-3 border-t border-white/10 pt-4">
          <label className="flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/80 px-3 focus-within:border-cyan-400/60">
            <Search className="h-4 w-4 shrink-0 text-white/50" aria-hidden />
            <input
              id="live-room-launch-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Launch any of ${catalogue.length} games and activities…`}
              className="min-h-11 w-full bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none"
              aria-label="Search games and activities"
            />
          </label>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">{results.label}</p>
          <div className="flex flex-wrap gap-2">
            {results.items.map((item) => {
              const Icon = item.plugin.icon;
              return (
                <button
                  key={`${item.kind}:${item.plugin.key}`}
                  type="button"
                  onClick={() => launch(item)}
                  title={item.plugin.description}
                  className={[
                    'flex min-h-10 items-center gap-2 rounded-lg border-[1.5px] border-dashed px-3 text-sm font-semibold transition-colors',
                    item.kind === 'game'
                      ? 'border-orange-300/60 text-orange-200 hover:bg-orange-300/10'
                      : 'border-emerald-300/60 text-emerald-200 hover:bg-emerald-300/10',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4" />
                  {item.plugin.name}
                </button>
              );
            })}
            {results.items.length === 0 && <p className="text-sm text-white/55">Nothing matches that. Try a skill like &ldquo;speaking&rdquo; or &ldquo;vocabulary&rdquo;.</p>}
          </div>
        </div>
      </section>

      {/* Right rail */}
      <aside className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/55 p-4">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-white p-1.5">
              <QRCodeSVG value={joinUrl} size={84} level="M" includeMargin={false} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg text-white">Scan to join</p>
              <p className="flex items-center gap-1.5 text-sm text-white/65">
                <Users className="h-4 w-4" aria-hidden />
                {participants.length} on board
              </p>
              <p className="mt-1 text-xs text-white/45">Phones are optional.</p>
            </div>
          </div>
          {sortedParticipants.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {sortedParticipants.map((p) => (
                <span
                  key={p.id}
                  className={[
                    'rounded-full border px-2.5 py-1 text-xs',
                    p.id === newestId
                      ? 'border-amber-300/50 bg-amber-300/10 text-amber-200'
                      : 'border-emerald-300/35 bg-emerald-300/10 text-emerald-200',
                  ].join(' ')}
                >
                  {p.display_name}
                </span>
              ))}
            </div>
          )}
        </div>

        {topCrew.length > 0 && (
          <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-950/55 p-4">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">
              <Trophy className="h-3.5 w-3.5" aria-hidden />
              Top crew
            </p>
            {topCrew.map((e, i) => (
              <div key={`${e.name}-${i}`} className="grid grid-cols-[18px_1fr_auto] items-center gap-2 text-sm">
                <span className="font-mono text-xs text-white/45">{i + 1}</span>
                <span className="truncate text-white">{e.name}</span>
                <span className="font-mono tabular-nums text-white/80">{e.points}</span>
              </div>
            ))}
          </div>
        )}

      </aside>
    </div>
  );
}
