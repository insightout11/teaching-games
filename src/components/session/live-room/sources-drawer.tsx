'use client';

import { useState } from 'react';
import { BookOpen, ExternalLink, Image as ImageIcon, Library, Link2, MapPin, Newspaper, Plus, Search, Tv, X, Globe } from 'lucide-react';
import type { RoomItem } from '@/stores/live-room-store';
import { readSource, searchSources, sourcesMessage, SourcesError, type Surface } from '@/components/session/live-room/sources-client';
import { LibraryPanel } from '@/components/session/live-room/library-panel';

/**
 * Sources drawer: the teacher's five Google tabs in one place. Results are a
 * preview inside the drawer; nothing reaches the stage until Show.
 */

const SURFACES: { key: Surface; label: string; icon: typeof Globe }[] = [
  { key: 'web', label: 'Web', icon: Globe },
  { key: 'images', label: 'Images', icon: ImageIcon },
  { key: 'news', label: 'News', icon: Newspaper },
  { key: 'places', label: 'Maps', icon: MapPin },
  { key: 'videos', label: 'Videos', icon: Tv },
];

const SEARCH_PLACEHOLDER: Record<Surface, string> = {
  web: 'Search the web…',
  images: 'Search images…',
  news: 'Search news…',
  places: 'Search a place or address…',
  videos: 'Search videos…',
};

interface SourcesDrawerProps {
  sessionId: string;
  onShow: (item: RoomItem) => void;
  onAdd: (item: RoomItem) => void;
  onClose: () => void;
  /** Fill the parent's height (pop-out window) instead of capping to the viewport. */
  fill?: boolean;
  /** Shown when the drawer is inline on the shared screen, where the class can see it. */
  visibleWarning?: boolean;
}

export function SourcesDrawer({ sessionId, onShow, onAdd, onClose, fill = false, visibleWarning = false }: SourcesDrawerProps) {
  const [mode, setMode] = useState<'web' | 'library'>('web');
  const [surface, setSurface] = useState<Surface>('web');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RoomItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [link, setLink] = useState('');

  const run = async (nextSurface: Surface = surface) => {
    const q = query.trim();
    if (!q || busy) return;
    setBusy(true);
    setError(null);
    setPreviewId(null);
    try {
      setResults(await searchSources(sessionId, nextSurface, q));
    } catch (e) {
      setResults(null);
      setError(sourcesMessage(e instanceof SourcesError ? e.code : 'UNKNOWN'));
    } finally {
      setBusy(false);
    }
  };

  const pickSurface = (s: Surface) => {
    setSurface(s);
    if (query.trim()) void run(s);
  };

  // Articles: pull readable text so the stage can show it, not just a link.
  const readThen = async (url: string, then: (item: RoomItem) => void) => {
    setReading(url);
    setError(null);
    try {
      then(await readSource(sessionId, url));
    } catch (e) {
      setError(sourcesMessage(e instanceof SourcesError ? e.code : 'UNKNOWN'));
    } finally {
      setReading(null);
    }
  };

  const openLink = () => {
    const url = link.trim();
    if (!url) return;
    void readThen(url, (item) => {
      setResults([item]);
      setPreviewId(item.id);
      setLink('');
    });
  };

  return (
    <aside className={['flex flex-col gap-3 rounded-2xl border border-cyan-400/25 bg-slate-950/95 p-4 shadow-2xl', fill ? 'h-full' : 'max-h-[calc(100vh-10rem)]'].join(' ')}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cyan-200">Sources</p>
        <button type="button" onClick={onClose} className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Close sources">
          <X className="h-4 w-4" />
        </button>
      </div>

      {visibleWarning && (
        <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
          Your browser blocked the private search window, so this panel is visible if you&apos;re sharing this screen.
          Allow pop-ups for LessonCaptain to search privately.
        </p>
      )}

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1" role="tablist" aria-label="Source">
        {([['web', 'Web search', Globe], ['library', 'Our library', Library]] as const).map(([key, label, Icon]) => (
          <button key={key} type="button" role="tab" aria-selected={mode === key} onClick={() => setMode(key)} className={['flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold', mode === key ? 'bg-cyan-400/15 text-white' : 'text-white/55 hover:text-white'].join(' ')}>
            <Icon className="h-3.5 w-3.5" aria-hidden />{label}
          </button>
        ))}
      </div>

      {mode === 'library' ? <LibraryPanel sessionId={sessionId} onShow={onShow} onAdd={onAdd} /> : (<>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
        className="flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900 px-3 focus-within:border-cyan-400/60"
      >
        <Search className="h-4 w-4 shrink-0 text-white/50" aria-hidden />
        <input
          id="live-room-source-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={SEARCH_PLACEHOLDER[surface]}
          maxLength={300}
          className="min-h-11 w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          aria-label="Search sources"
        />
      </form>

      <div className="grid grid-cols-5 gap-1" role="tablist" aria-label="Source type">
        {SURFACES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={surface === key}
            onClick={() => pickSurface(key)}
            className={[
              'flex flex-col items-center gap-1 rounded-lg border py-1.5 text-[11px] font-semibold',
              surface === key ? 'border-cyan-400/50 bg-cyan-400/10 text-white' : 'border-transparent text-white/55 hover:text-white',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{error}</p>}

      <div className="-mr-2 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-2">
        {busy && <p className="py-4 text-center text-sm text-white/55">Searching…</p>}
        {!busy && results?.length === 0 && <p className="py-4 text-center text-sm text-white/55">No results. Try different words.</p>}
        {!busy && results?.map((item) => {
          const open = previewId === item.id;
          const thumb = item.imageUrl ?? item.thumbnailUrl;
          return (
            <div key={item.id} className={['rounded-lg border p-2', open ? 'border-white/15 bg-white/[0.04]' : 'border-transparent'].join(' ')}>
              <button type="button" onClick={() => setPreviewId(open ? null : item.id)} className="grid w-full grid-cols-[56px_1fr] gap-2.5 text-left">
                <span className="flex h-11 w-14 items-center justify-center overflow-hidden rounded-md bg-slate-800">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : item.kind === 'place' ? (
                    <MapPin className="h-4 w-4 text-white/50" />
                  ) : (
                    <Globe className="h-4 w-4 text-white/50" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 block text-sm font-semibold text-white">{item.title}</span>
                  <span className="block truncate text-xs text-white/45">{item.publisher ?? item.address ?? hostOf(item.url)}</span>
                </span>
              </button>
              {open && (
                <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-2">
                  {item.description && <p className="line-clamp-4 text-xs text-white/70">{item.description}</p>}
                  {item.text && <p className="line-clamp-6 whitespace-pre-line text-xs text-white/70">{item.text}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => onShow(item)} className="rounded-md bg-cyan-400 px-2.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-300">
                      Show
                    </button>
                    <button type="button" onClick={() => onAdd(item)} className="flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-white hover:bg-white/10">
                      <Plus className="h-3.5 w-3.5" aria-hidden /> Add to room
                    </button>
                    {(item.kind === 'web' || item.kind === 'news') && (
                      <button
                        type="button"
                        disabled={reading !== null}
                        onClick={() => void readThen(item.url, onShow)}
                        className="flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-50"
                      >
                        <BookOpen className="h-3.5 w-3.5" aria-hidden /> {reading === item.url ? 'Reading…' : 'Show as article'}
                      </button>
                    )}
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-white/60 hover:text-white">
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Open
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          openLink();
        }}
        className="flex items-center gap-2 border-t border-white/10 pt-3"
      >
        <Link2 className="h-4 w-4 shrink-0 text-white/50" aria-hidden />
        <input
          id="live-room-source-link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Or paste an article link"
          className="min-h-9 w-full rounded-md bg-slate-900 px-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
          aria-label="Paste an article link"
        />
        <button type="submit" disabled={reading !== null} className="rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-50">
          {reading && reading === link.trim() ? 'Reading…' : 'Read'}
        </button>
      </form>
      </>)}
    </aside>
  );
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
