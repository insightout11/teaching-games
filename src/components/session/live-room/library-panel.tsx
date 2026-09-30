'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Clock, FileText, Film, MessagesSquare, Plus, Search, Sparkles, SpellCheck, Zap } from 'lucide-react';
import type { RoomItem } from '@/stores/live-room-store';
import { openRoomChannel } from '@/components/session/live-room/room-channel';
import type { LibraryEntry, LibraryKind, LibraryLength } from '@/lib/live-room/library-search';

/**
 * Library tab of the sources drawer: our reviewed videos + texts, filtered by
 * level / age / type / length, with a "for today's topic" shelf. Show / Add
 * work like search results; the item carries its stored transcript summary or
 * text so any activity can ground on it.
 */

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const AGES = [{ key: 'kids', label: 'Kids' }, { key: 'teens', label: 'Teens' }, { key: 'adults', label: 'Adults' }];
const KINDS: Array<{ key: LibraryKind; label: string; icon: typeof Film }> = [
  { key: 'video', label: 'Videos', icon: Film },
  { key: 'hook', label: 'Short hooks', icon: Zap },
  { key: 'grammar', label: 'Grammar', icon: SpellCheck },
  { key: 'text', label: 'Texts', icon: FileText },
  { key: 'debate', label: 'Debate texts', icon: MessagesSquare },
];
const LENGTHS: Array<{ key: LibraryLength; label: string }> = [{ key: 'short', label: 'Short' }, { key: 'medium', label: 'Medium' }, { key: 'long', label: 'Long' }];

function lengthLabel(e: LibraryEntry): string | null {
  if (e.durationSecs != null) {
    const m = Math.floor(e.durationSecs / 60);
    const s = e.durationSecs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  if (e.wordCount != null) return `${e.wordCount} words`;
  return null;
}

const chip = (on: boolean) => [
  'rounded-full border px-2.5 py-1 text-[11px] font-semibold',
  on ? 'border-cyan-400/60 bg-cyan-400/15 text-white' : 'border-white/10 text-white/60 hover:text-white',
].join(' ');

export function LibraryPanel({ sessionId, onShow, onAdd }: { sessionId: string; onShow: (item: RoomItem) => void; onAdd: (item: RoomItem) => void }) {
  const [q, setQ] = useState('');
  const [levels, setLevels] = useState<string[]>([]);
  const [age, setAge] = useState<string | null>(null);
  const [kind, setKind] = useState<LibraryKind | null>(null);
  const [length, setLength] = useState<LibraryLength | null>(null);
  const [data, setData] = useState<{ topic: string | null; shelf: LibraryEntry[]; results: LibraryEntry[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const reqRef = useRef(0);
  // The room's live topic (Focus), sent over the room channel; the server falls back to the saved topic.
  const [liveTopic, setLiveTopic] = useState<string | null>(null);
  useEffect(() => {
    const channel = openRoomChannel(sessionId, (m) => { if (m.type === 'topic') setLiveTopic(m.title); });
    channel?.postMessage({ type: 'hello' });
    return () => channel?.close();
  }, [sessionId]);

  // Remember filters per teacher (a convenience only).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('lc-library-filters') ?? 'null') as { levels?: string[]; age?: string | null } | null;
      if (saved?.levels) setLevels(saved.levels);
      if (saved?.age !== undefined) setAge(saved.age);
    } catch { /* storage blocked */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('lc-library-filters', JSON.stringify({ levels, age })); } catch { /* storage blocked */ }
  }, [levels, age]);

  const load = useCallback(async (query: string) => {
    const id = ++reqRef.current;
    setBusy(true);
    setError(null);
    const p = new URLSearchParams({ sessionId });
    if (query) p.set('q', query);
    if (liveTopic) p.set('topic', liveTopic);
    if (levels.length) p.set('levels', levels.join(','));
    if (age) p.set('age', age);
    if (kind) p.set('kind', kind);
    if (length) p.set('length', length);
    try {
      const res = await fetch(`/api/live-room/library?${p}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      if (id === reqRef.current) setData(json);
    } catch {
      if (id === reqRef.current) setError('Couldn’t load the library. Try again.');
    } finally {
      if (id === reqRef.current) setBusy(false);
    }
  }, [sessionId, levels, age, kind, length, liveTopic]);

  // Filters apply at once; typing waits a moment.
  useEffect(() => {
    const t = setTimeout(() => void load(q.trim()), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q, load]);

  const act = async (e: LibraryEntry, then: (item: RoomItem) => void) => {
    setWorking(e.key);
    setError(null);
    try {
      const res = await fetch(`/api/live-room/library?key=${encodeURIComponent(e.key)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      then((await res.json()).item as RoomItem);
    } catch {
      setError('Couldn’t open that item. Try again.');
    } finally {
      setWorking(null);
    }
  };

  const Card = ({ e }: { e: LibraryEntry }) => {
    const open = openKey === e.key;
    const len = lengthLabel(e);
    return (
      <div className={['rounded-lg border p-2', open ? 'border-white/15 bg-white/[0.04]' : 'border-transparent'].join(' ')}>
        <button type="button" onClick={() => setOpenKey(open ? null : e.key)} className="grid w-full grid-cols-[72px_1fr] gap-2.5 text-left">
          <span className="relative flex h-[46px] w-[72px] items-center justify-center overflow-hidden rounded-md bg-slate-800">
            {e.youtubeId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://i.ytimg.com/vi/${e.youtubeId}/mqdefault.jpg`} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
            ) : (
              <span className="line-clamp-3 px-1.5 font-display text-[9px] leading-tight text-white/60">{e.blurb || e.title}</span>
            )}
            {len && <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 font-mono text-[9px] text-white">{len}</span>}
          </span>
          <span className="min-w-0">
            <span className="line-clamp-2 block text-sm font-semibold text-white">{e.title}</span>
            <span className="flex items-center gap-1.5 truncate text-xs text-white/45">
              {e.cefr && <span className="rounded border border-white/15 px-1 font-mono text-[10px] text-white/70">{e.cefr}</span>}
              {e.publisher}{e.byline ? ` · ${e.byline}` : ''}
            </span>
          </span>
        </button>
        {open && (
          <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-2">
            {e.blurb && <p className="line-clamp-4 text-xs text-white/70">{e.blurb}</p>}
            <div className="flex flex-wrap gap-1.5">
              <button type="button" disabled={working !== null} onClick={() => void act(e, onShow)} className="rounded-md bg-cyan-400 px-2.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50">
                {working === e.key ? 'Opening…' : 'Show'}
              </button>
              <button type="button" disabled={working !== null} onClick={() => void act(e, onAdd)} className="flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-50">
                <Plus className="h-3.5 w-3.5" aria-hidden /> Add to room
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5">
      <form onSubmit={(ev) => { ev.preventDefault(); void load(q.trim()); }} className="flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900 px-3 focus-within:border-cyan-400/60">
        <Search className="h-4 w-4 shrink-0 text-white/50" aria-hidden />
        <input value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Search our library…" maxLength={120} className="min-h-11 w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none" aria-label="Search the library" />
      </form>

      <div className="flex flex-wrap gap-1">
        {KINDS.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => setKind(kind === key ? null : key)} className={`flex items-center gap-1 ${chip(kind === key)}`}>
            <Icon className="h-3 w-3" aria-hidden />{label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {LEVELS.map((l) => (
          <button key={l} type="button" onClick={() => setLevels(levels.includes(l) ? levels.filter((x) => x !== l) : [...levels, l])} className={`font-mono ${chip(levels.includes(l))}`}>{l}</button>
        ))}
        <span className="mx-1 h-4 w-px bg-white/15" aria-hidden />
        {AGES.map((a) => <button key={a.key} type="button" onClick={() => setAge(age === a.key ? null : a.key)} className={chip(age === a.key)}>{a.label}</button>)}
        <span className="mx-1 h-4 w-px bg-white/15" aria-hidden />
        <Clock className="h-3 w-3 text-white/40" aria-hidden />
        {LENGTHS.map((l) => <button key={l.key} type="button" onClick={() => setLength(length === l.key ? null : l.key)} className={chip(length === l.key)}>{l.label}</button>)}
      </div>

      {error && <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{error}</p>}

      <div className="-mr-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-2">
        {busy && !data && <p className="py-4 text-center text-sm text-white/55">Loading…</p>}
        {data && data.shelf.length > 0 && (
          <div className="mb-1 rounded-xl border border-amber-300/25 bg-amber-300/[0.05] p-1.5">
            <p className="flex items-center gap-1.5 px-1.5 pb-1 pt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-200">
              <Sparkles className="h-3 w-3" aria-hidden /> For today&apos;s topic · {data.topic}
            </p>
            {data.shelf.map((e) => <Card key={e.key} e={e} />)}
          </div>
        )}
        {data && data.results.length > 0 && (
          <p className="flex items-center gap-1.5 px-1 pt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
            <BookOpen className="h-3 w-3" aria-hidden /> {q.trim() ? `Results for “${q.trim()}”` : 'Browse'}
          </p>
        )}
        {data?.results.map((e) => <Card key={e.key} e={e} />)}
        {data && !busy && data.results.length === 0 && data.shelf.length === 0 && (
          <p className="py-4 text-center text-sm text-white/55">Nothing matches. Try fewer filters.</p>
        )}
      </div>
    </div>
  );
}
