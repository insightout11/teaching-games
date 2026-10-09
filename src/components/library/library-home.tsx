'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, FileText, Film, Headphones, Loader2, Search, X } from 'lucide-react';
import { VideoLibraryModal } from '@/components/planner/video-library-modal';
import { TextLibraryModal } from '@/components/planner/text-library-modal';
import { usePlannerStore } from '@/stores/planner-store';
import { FLAP_FONT } from '@/components/ui/split-flap';
import type { Shelf, ShelfItem } from '@/lib/library-shelves';
import type { SourceMaterial } from '@/types/source-material';

// Library (Oct 2026 redesign): one search over everything, rows of picks, and the full video/text browsers behind
// "Browse all". Picking an item plans a lesson with it; a book opens its reading course.

type View = 'overview' | 'videos' | 'texts';
const TINTS = ['#2b5876,#4e4376', '#134e5e,#71b280', '#614385,#516395', '#c06c84,#6c5b7b', '#355c7d,#f67280', '#3a6073,#16222a'];

function tint(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

function Tile({ item, onPick, busy }: { item: ShelfItem & { listening?: boolean }; onPick: (i: ShelfItem) => void; busy: boolean }) {
  const book = !!item.presetId;
  const meta = [item.minutes ? `${item.minutes} MIN` : null, item.lessons ? `${item.lessons} LESSONS` : null, item.level?.toUpperCase()].filter(Boolean).join(' · ');
  return (
    <button type="button" onClick={() => onPick(item)} disabled={busy} className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d1828] text-left transition-colors hover:border-cyan-300/40 disabled:opacity-60">
      <span className="relative block h-24 w-full overflow-hidden" style={item.thumb ? undefined : { background: `linear-gradient(135deg,${tint(item.id)})` }}>
        {item.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumb} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <span className="flex h-full items-center justify-center">
            {book ? <BookOpen className="h-8 w-8 text-white/70" /> : item.kind === 'video' ? <Film className="h-8 w-8 text-white/70" /> : <FileText className="h-8 w-8 text-white/70" />}
          </span>
        )}
        {meta && <span className="absolute bottom-1.5 left-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.1em] text-[#fff4dc]" style={{ fontFamily: FLAP_FONT }}>{meta}</span>}
        {item.listening && <Headphones className="absolute right-1.5 top-1.5 h-5 w-5 rounded bg-black/60 p-0.5 text-amber-300" aria-label="Listening clip" />}
      </span>
      <span className="line-clamp-2 px-2.5 py-2 text-[13px] font-semibold leading-snug text-white/90">{item.title}</span>
    </button>
  );
}

export function LibraryHome({ shelves }: { shelves: Shelf[] }) {
  const router = useRouter();
  const { setSourceMaterial, setTopic } = usePlannerStore();
  const [view, setView] = useState<View>('overview');
  const [q, setQ] = useState('');
  const [kids, setKids] = useState(false);
  const [results, setResults] = useState<ShelfItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    if (q.trim().length < 2) { setResults(null); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/library/search?q=${encodeURIComponent(q.trim())}&limit=20${kids ? '&kids=1' : ''}`);
      const data = (await res.json().catch(() => ({ results: [] }))) as { results: ShelfItem[] };
      setResults(data.results ?? []);
    } finally {
      setSearching(false);
    }
  }

  /** Load the item as lesson material and open the planner with it (same path the old Library used). */
  async function planWith(id: string, source: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/source/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: source, payload: id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError((data && typeof data.error === 'string' && data.error) || "Couldn't load that. It may be unavailable for a moment; try another or try again.");
        return;
      }
      const material: SourceMaterial = {
        sourceType: data.sourceType,
        sourceKey: data.sourceKey,
        title: data.title,
        summary: data.summary,
        duration: data.duration,
        ...(data.rawText ? { rawText: data.rawText } : {}),
        ...(data.slides ? { slides: data.slides } : {}),
      };
      setSourceMaterial(material);
      setTopic(data.title);
      router.push('/lesson-planner');
    } catch {
      setError("Couldn't load that. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const pick = (i: ShelfItem) => (i.presetId ? router.push(`/courses/new?preset=${encodeURIComponent(i.presetId)}`) : void planWith(i.id, i.sourceType));

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4 pt-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/90" style={{ fontFamily: FLAP_FONT }}>Library</p>
          <h1 className="mt-2 font-display text-4xl text-white sm:text-5xl">Find something to <em className="text-amber-300">talk about</em></h1>
        </div>
        <div className="flex gap-1 rounded-xl border border-white/10 bg-black/30 p-1" role="tablist" aria-label="Library view">
          {([['overview', 'Overview'], ['videos', 'All videos'], ['texts', 'All texts']] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${view === k ? 'bg-white/[0.1] text-white' : 'text-white/55 hover:text-white'}`}>{l}</button>
          ))}
        </div>
      </header>

      {error && (
        <p role="alert" className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          <span className="grow">{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss"><X className="h-4 w-4" /></button>
        </p>
      )}

      {loading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <span className="flex items-center gap-3 rounded-xl bg-[#0a121e] px-5 py-3 text-sm text-white"><Loader2 className="h-4 w-4 animate-spin" />Getting it ready…</span>
        </div>
      )}

      {view === 'videos' && <div className="h-[75vh] overflow-hidden rounded-2xl border border-white/[0.07]"><VideoLibraryModal mode="page" onSelect={(id, src) => void planWith(id, src)} /></div>}
      {view === 'texts' && <div className="h-[75vh] overflow-hidden rounded-2xl border border-white/[0.07]"><TextLibraryModal mode="page" onSelect={(id, src) => void planWith(id, src)} /></div>}

      {view === 'overview' && (
        <>
          <form onSubmit={(e) => { e.preventDefault(); void search(); }} className="flex flex-wrap items-center gap-3">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input id="library-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search volcanoes, a city, a book…" aria-label="Search the library" className="w-full rounded-xl border border-white/12 bg-white/[0.05] py-3 pl-10 pr-3 text-[15px] text-lc-text placeholder:text-white/35 focus:border-cyan-300/60 focus:outline-none" />
            </label>
            <button type="button" onClick={() => setKids((v) => !v)} aria-pressed={kids} className={`rounded-full border px-3.5 py-2 text-sm font-semibold ${kids ? 'border-cyan-300 bg-cyan-300 text-[#03202a]' : 'border-white/15 text-white/70'}`}>Include kids content</button>
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-[#03202a] hover:bg-cyan-300">{searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Search</button>
          </form>

          {results && (
            <section className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>Results for &ldquo;{q.trim()}&rdquo;</h2>
                <button onClick={() => { setResults(null); setQ(''); }} className="text-sm text-cyan-300 hover:text-cyan-200">Clear</button>
              </div>
              {results.length === 0 ? (
                <p className="text-sm text-white/55">Nothing found. Try another word, or browse all videos and texts.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{results.map((r) => <Tile key={`${r.sourceType}-${r.id}`} item={r} onPick={pick} busy={loading} />)}</div>
              )}
            </section>
          )}

          {shelves.map((s) => (
            <section key={s.key} className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>{s.title}</h2>
                {s.key === 'books' ? (
                  <button onClick={() => router.push('/courses#reading-courses')} className="text-sm text-cyan-300 hover:text-cyan-200">All reading courses</button>
                ) : s.key === 'talk' ? (
                  <button onClick={() => setView('texts')} className="text-sm text-cyan-300 hover:text-cyan-200">Browse all texts</button>
                ) : (
                  <button onClick={() => setView('videos')} className="text-sm text-cyan-300 hover:text-cyan-200">Browse all videos</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{s.items.map((i) => <Tile key={`${i.sourceType}-${i.id}`} item={i} onPick={pick} busy={loading} />)}</div>
            </section>
          ))}
          <p className="text-xs text-white/40">Pick anything to plan a lesson with it. Books open as a reading course you can edit.</p>
        </>
      )}
    </div>
  );
}
