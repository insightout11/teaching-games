'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { X, Clock, Search, Play, LayoutGrid, List, SlidersHorizontal, Info, ChevronRight, Star } from 'lucide-react';
import { DIFFICULTIES } from '@/lib/difficulty';
import { recommendedPresetForSource, PRESET_FIT_LABELS, ALL_FIT_PRESET_IDS, type SourceGenre } from '@/lib/preset-fit';
import {
  useDrawerA11y, usePersistedState, useFavorites, useRecentlyUsed, useIncremental,
  SortSelect, ActiveFilterChips, FavoriteStar, ClampText,
  compareByTitle, compareByDifficulty, recentRank,
} from './library-shared';

// ── Library source config ─────────────────────────────────────────────────────

type LibrarySourceKey = 'ted' | 'teded' | 'bbc' | 'kurzgesagt' | 'bbc-ideas' | 'bigthink' | 'vox' | 'kids' | 'natgeo' | 'crash-course' | 'travel-english' | 'business-english' | 'internet-memes' | 'minecraft';

const SOURCE_CONFIG: { key: LibrarySourceKey; label: string; activeClass: string; inactiveClass: string }[] = [
  { key: 'teded',            label: 'TED-Ed',        activeClass: 'bg-red-600 text-white',          inactiveClass: 'bg-red-900/20 text-red-400 border border-red-800/40'          },
  { key: 'ted',              label: 'TED',          activeClass: 'bg-red-600 text-white',          inactiveClass: 'bg-red-900/20 text-red-400 border border-red-800/40'          },
  { key: 'bbc',              label: 'BBC',           activeClass: 'bg-amber-500 text-white',        inactiveClass: 'bg-amber-900/20 text-amber-400 border border-amber-800/40'    },
  { key: 'kurzgesagt',       label: 'Kurzgesagt',    activeClass: 'bg-orange-500 text-white',       inactiveClass: 'bg-orange-900/20 text-orange-400 border border-orange-800/40' },
  { key: 'bbc-ideas',        label: 'BBC Ideas',     activeClass: 'bg-cyan-500 text-white',         inactiveClass: 'bg-cyan-900/20 text-cyan-400 border border-cyan-800/40'        },
  { key: 'bigthink',         label: 'Big Think',     activeClass: 'bg-purple-600 text-white',       inactiveClass: 'bg-purple-900/20 text-purple-400 border border-purple-800/40' },
  { key: 'vox',              label: 'Vox',           activeClass: 'bg-violet-600 text-white',       inactiveClass: 'bg-violet-900/20 text-violet-400 border border-violet-800/40' },
  { key: 'kids',             label: 'For Kids',      activeClass: 'bg-green-600 text-white',        inactiveClass: 'bg-green-900/20 text-green-400 border border-green-800/40'    },
  { key: 'natgeo',           label: 'NatGeo',        activeClass: 'bg-yellow-500 text-black',       inactiveClass: 'bg-yellow-900/20 text-yellow-400 border border-yellow-800/40' },
  { key: 'crash-course',     label: 'Crash Course',  activeClass: 'bg-red-500 text-white',          inactiveClass: 'bg-red-900/20 text-red-400 border border-red-800/40'          },
  { key: 'travel-english',   label: 'Travel',        activeClass: 'bg-sky-500 text-white',          inactiveClass: 'bg-sky-900/20 text-sky-400 border border-sky-800/40'          },
  { key: 'business-english', label: 'Business',      activeClass: 'bg-blue-600 text-white',         inactiveClass: 'bg-blue-900/20 text-blue-400 border border-blue-800/40'       },
  { key: 'internet-memes',   label: 'Memes',         activeClass: 'bg-pink-600 text-white',         inactiveClass: 'bg-pink-900/20 text-pink-400 border border-pink-800/40'       },
  { key: 'minecraft',        label: 'Minecraft',     activeClass: 'bg-green-600 text-white',        inactiveClass: 'bg-green-900/20 text-green-400 border border-green-800/40'   },
];

const SOURCE_BADGE: Record<LibrarySourceKey, string> = {
  ted:               'bg-red-900/40 text-red-400',
  teded:             'bg-red-900/40 text-red-400',
  bbc:               'bg-amber-900/40 text-amber-400',
  kurzgesagt:        'bg-orange-900/40 text-orange-400',
  'bbc-ideas':       'bg-cyan-900/40 text-cyan-400',
  bigthink:          'bg-purple-900/40 text-purple-400',
  vox:               'bg-violet-900/40 text-violet-400',
  kids:              'bg-green-900/40 text-green-400',
  natgeo:            'bg-yellow-900/40 text-yellow-400',
  'crash-course':    'bg-red-900/40 text-red-400',
  'travel-english':  'bg-sky-900/40 text-sky-400',
  'business-english':'bg-blue-900/40 text-blue-400',
  'internet-memes':  'bg-pink-900/40 text-pink-400',
  minecraft:         'bg-green-900/40 text-green-400',
};

// ── Duration bands ────────────────────────────────────────────────────────────

type DurationBand = 'short' | 'medium' | 'long';
const DURATION_BANDS: { key: DurationBand; label: string; sublabel: string }[] = [
  { key: 'short',  label: 'Short',  sublabel: '< 5 min'  },
  { key: 'medium', label: 'Medium', sublabel: '5–15 min' },
  { key: 'long',   label: 'Long',   sublabel: '15+ min'  },
];

function getDurationBand(secs: number): DurationBand {
  if (secs < 300) return 'short';
  if (secs < 900) return 'medium';
  return 'long';
}

// ── Types ─────────────────────────────────────────────────────────────────────

type LibraryEntry = {
  id: string;
  title: string;
  speaker: string;
  durationSecs: number;
  topicTags: string[];
  difficultyLevel: string;
  description: string;
  summary?: string;
  youtubeId?: string | null;
  audience?: 'kids';
  sourceType: LibrarySourceKey;
  /** LLM-classified genre (populated by scripts/classify-library-genres.ts); drives the "Best for" badge. */
  genre?: SourceGenre;
};

type ViewMode = 'grid' | 'list';

// ── Import all library data ───────────────────────────────────────────────────

import tedRaw from '@/data/ted-library.json';
import tededRaw from '@/data/teded-library.json';
import bbcRaw from '@/data/bbc-library.json';
import kurzgesagtRaw from '@/data/kurzgesagt-library.json';
import bbcIdeasRaw from '@/data/bbc-ideas-library.json';
import bigthinkRaw from '@/data/bigthink-library.json';
import voxRaw from '@/data/vox-library.json';
import kidsRaw from '@/data/kids-library.json';
import natgeoRaw from '@/data/natgeo-library.json';
import crashCourseRaw from '@/data/crash-course-library.json';
import travelEnglishRaw from '@/data/travel-english-library.json';
import businessEnglishRaw from '@/data/business-english-library.json';
import internetMemesRaw from '@/data/internet-memes-library.json';
import minecraftRaw from '@/data/minecraft-library.json';

function tag<K extends LibrarySourceKey>(raw: unknown[], key: K): LibraryEntry[] {
  return (raw as LibraryEntry[]).map((e) => ({ ...e, sourceType: key }));
}

const ALL_ENTRIES: LibraryEntry[] = [
  ...tag(tededRaw, 'teded'),
  ...tag(tedRaw, 'ted'),
  ...tag(bbcRaw, 'bbc'),
  ...tag(kurzgesagtRaw, 'kurzgesagt'),
  ...tag(bbcIdeasRaw, 'bbc-ideas'),
  ...tag(bigthinkRaw, 'bigthink'),
  ...tag(voxRaw, 'vox'),
  ...tag(kidsRaw, 'kids'),
  ...tag(natgeoRaw, 'natgeo'),
  ...tag(crashCourseRaw, 'crash-course'),
  ...tag(travelEnglishRaw, 'travel-english'),
  ...tag(businessEnglishRaw, 'business-english'),
  ...tag(internetMemesRaw, 'internet-memes'),
  ...tag(minecraftRaw, 'minecraft'),
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(secs: number) {
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

// Stable per-entry key for favorites / recent / React keys (ids can repeat across sources).
const entryKey = (e: LibraryEntry) => `${e.sourceType}-${e.id}`;

const SORT_OPTIONS = [
  { key: 'relevance', label: 'Default order' },
  { key: 'recent', label: 'Recently used' },
  { key: 'duration-asc', label: 'Shortest first' },
  { key: 'duration-desc', label: 'Longest first' },
  { key: 'level', label: 'Level: easy → hard' },
  { key: 'title', label: 'Title: A–Z' },
];

function ThumbnailImage({ youtubeId, title }: { youtubeId?: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (!youtubeId || failed) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 to-red-950/60 flex items-center justify-center">
        <span className="text-3xl opacity-40">🎬</span>
      </div>
    );
  }
  return (
    <img
      src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
      alt={title}
      className="absolute inset-0 w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function VideoDetailDrawer({
  entry,
  onClose,
  onUse,
  isFav,
  onToggleFav,
}: {
  entry: LibraryEntry;
  onClose: () => void;
  onUse: () => void;
  isFav: boolean;
  onToggleFav: () => void;
}) {
  const cfg = SOURCE_CONFIG.find((s) => s.key === entry.sourceType);
  const panelRef = useDrawerA11y(onClose);
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/50 animate-in fade-in duration-150" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Video details: ${entry.title}`}
        className="relative w-full max-w-md h-full bg-lc-card border-l border-lc-border shadow-2xl shadow-black/50 flex flex-col animate-in slide-in-from-right duration-200 outline-none"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-lc-border shrink-0">
          <p className="text-sm font-semibold text-lc-text">Video details</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-lc-text3 hover:text-lc-text hover:bg-lc-surface transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
            {entry.youtubeId ? (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${entry.youtubeId}`}
                title={entry.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <ThumbnailImage youtubeId={undefined} title={entry.title} />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-lc-text leading-snug">{entry.title}</h3>
            <div className="flex items-center gap-2 flex-wrap text-xs text-lc-text3">
              <span>{entry.speaker}</span>
              {cfg && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${cfg.inactiveClass}`}>{cfg.label}</span>}
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(entry.durationSecs)}</span>
            </div>
          </div>

          {(entry.summary || entry.description) && (
            <ClampText text={entry.summary || entry.description} />
          )}

          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-lc-bg border border-lc-border text-[11px] text-lc-text3">{entry.difficultyLevel}</span>
            {entry.topicTags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-lc-bg border border-lc-border text-[11px] text-lc-text3 capitalize">{t}</span>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-lc-border shrink-0 flex items-center gap-2">
          <button
            onClick={onToggleFav}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
              isFav ? 'border-amber-400/50 text-amber-300 bg-amber-400/10' : 'border-lc-border text-lc-text3 hover:text-lc-text'
            }`}
          >
            <Star className={`w-4 h-4 ${isFav ? 'fill-amber-300' : ''}`} />{isFav ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={onUse}
            className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
          >
            Use this video
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onSelect: (talkId: string, source: LibrarySourceKey) => void;
  onClose?: () => void;
  mode?: 'modal' | 'page';
}

export function VideoLibraryModal({ onSelect, onClose, mode = 'modal' }: Props) {
  const [query, setQuery] = useState('');
  const [activeChannel, setActiveChannel] = usePersistedState<LibrarySourceKey | null>('lc-lib-video-channel', null);
  const [activeTag, setActiveTag] = usePersistedState<string | null>('lc-lib-video-tag', null);
  const [activeDifficulty, setActiveDifficulty] = usePersistedState<string | null>('lc-lib-video-level', null);
  const [activeDuration, setActiveDuration] = usePersistedState<DurationBand | null>('lc-lib-video-duration', null);
  const [activeFit, setActiveFit] = usePersistedState<string | null>('lc-lib-video-fit', null);
  const [tagQuery, setTagQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = usePersistedState<ViewMode>('lc-lib-video-view', 'grid');
  const [sortKey, setSortKey] = usePersistedState<string>('lc-lib-video-sort', 'relevance');
  const [favsOnly, setFavsOnly] = usePersistedState<boolean>('lc-lib-video-favsonly', false);
  const [detail, setDetail] = useState<LibraryEntry | null>(null);

  const { favs, toggle: toggleFav } = useFavorites('video');
  const { recent, pushRecent } = useRecentlyUsed('video');

  const baseEntries = useMemo(() => ALL_ENTRIES, []);

  const allTags = useMemo(
    () => Array.from(new Set(baseEntries.flatMap((e) => e.topicTags))).sort(),
    [baseEntries],
  );

  // Best-fit preset per entry (stored genre → heuristic). Computed once; drives both
  // the "Best for" badge and the fit filter.
  const fitByKey = useMemo(() => {
    const m = new Map<string, { presetId: string; label: string }>();
    for (const e of baseEntries) {
      const r = recommendedPresetForSource({ genre: e.genre, title: e.title, lessonGoal: e.description, subtitle: e.summary, skills: e.topicTags });
      if (r) m.set(entryKey(e), r);
    }
    return m;
  }, [baseEntries]);
  const fitLabel = (e: LibraryEntry) => fitByKey.get(entryKey(e))?.label ?? null;

  const filtered = useMemo(() => {
    return baseEntries.filter((e) => {
      if (favsOnly && !favs.has(entryKey(e))) return false;
      if (activeChannel && e.sourceType !== activeChannel) return false;
      if (activeTag && !e.topicTags.includes(activeTag)) return false;
      if (activeDifficulty && e.difficultyLevel !== activeDifficulty) return false;
      if (activeDuration && getDurationBand(e.durationSecs) !== activeDuration) return false;
      if (activeFit && fitByKey.get(entryKey(e))?.presetId !== activeFit) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.speaker.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.summary?.toLowerCase().includes(q) ?? false) ||
          e.topicTags.some((t) => t.includes(q))
        );
      }
      return true;
    });
  }, [query, activeChannel, activeTag, activeDifficulty, activeDuration, activeFit, fitByKey, favsOnly, favs, baseEntries]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortKey) {
      case 'recent': arr.sort((a, b) => recentRank(entryKey(a), recent) - recentRank(entryKey(b), recent)); break;
      case 'duration-asc': arr.sort((a, b) => a.durationSecs - b.durationSecs); break;
      case 'duration-desc': arr.sort((a, b) => b.durationSecs - a.durationSecs); break;
      case 'level': arr.sort(compareByDifficulty); break;
      case 'title': arr.sort(compareByTitle); break;
      default: break;
    }
    return arr;
  }, [filtered, sortKey, recent]);

  const activeFilterCount = [activeChannel, activeTag, activeDifficulty, activeDuration, activeFit, favsOnly].filter(Boolean).length;

  const filterSig = `${query}|${activeChannel}|${activeTag}|${activeDifficulty}|${activeDuration}|${activeFit}|${favsOnly}|${sortKey}`;
  const { count, more } = useIncremental(filterSig, 24);
  const visible = sorted.slice(0, count);
  const hasMore = visible.length < sorted.length;

  // Auto-load the next page as the sentinel nears the bottom of the scroll area,
  // so videos beyond the first page aren't hidden behind an easy-to-miss button.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) more(); },
      { root, rootMargin: '400px' },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [hasMore, more, count]);

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (activeChannel) chips.push({ key: 'channel', label: SOURCE_CONFIG.find((s) => s.key === activeChannel)?.label ?? activeChannel, onRemove: () => setActiveChannel(null) });
  if (activeDuration) chips.push({ key: 'duration', label: DURATION_BANDS.find((d) => d.key === activeDuration)?.label ?? activeDuration, onRemove: () => setActiveDuration(null) });
  if (activeDifficulty) chips.push({ key: 'level', label: activeDifficulty, onRemove: () => setActiveDifficulty(null) });
  if (activeTag) chips.push({ key: 'tag', label: activeTag, onRemove: () => setActiveTag(null) });
  if (activeFit) chips.push({ key: 'fit', label: `Best for ${PRESET_FIT_LABELS[activeFit] ?? activeFit}`, onRemove: () => setActiveFit(null) });
  if (favsOnly) chips.push({ key: 'saved', label: 'Saved', onRemove: () => setFavsOnly(false) });

  function clearFilters() {
    setActiveChannel(null);
    setActiveTag(null);
    setActiveDifficulty(null);
    setActiveDuration(null);
    setActiveFit(null);
    setFavsOnly(false);
    setQuery('');
  }

  const visibleChannels = SOURCE_CONFIG.filter((s) =>
    ALL_ENTRIES.some((e) => s.key === 'kids' ? e.audience === 'kids' : e.sourceType === s.key)
  );

  return (
    <div className={mode === 'page' ? 'flex flex-col h-full bg-lc-bg' : 'fixed inset-0 z-50 flex flex-col bg-lc-bg'}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-lc-border shrink-0 bg-lc-card">
        <div className="shrink-0">
          <h2 className="font-bold text-lc-text text-xl tracking-tight">Video Library</h2>
          <p className="text-xs text-lc-text3 mt-0.5">{ALL_ENTRIES.length} videos</p>
        </div>

        {/* Search */}
        <div className="flex-1 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lc-text3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, speaker, topic…"
            className="w-full pl-9 pr-3 py-2 bg-lc-bg border border-lc-border rounded-lg text-sm text-lc-text placeholder-lc-text3 focus:border-lc-blue focus:ring-1 focus:ring-lc-blue-glow"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Saved toggle */}
          <button
            onClick={() => setFavsOnly(!favsOnly)}
            title="Show saved only"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
              favsOnly ? 'bg-amber-400/15 text-amber-300 border-amber-400/40' : 'border-lc-border text-lc-text3 hover:text-lc-text hover:border-lc-text3'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favsOnly ? 'fill-amber-300' : ''}`} />
            Saved
          </button>

          {/* Sort */}
          <SortSelect value={sortKey} onChange={setSortKey} options={SORT_OPTIONS} />

          {/* View toggle */}
          <div className="flex rounded-lg border border-lc-border overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-lc-text text-lc-bg' : 'text-lc-text3 hover:text-lc-text'}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 border-l border-lc-border transition-colors ${viewMode === 'list' ? 'bg-lc-text text-lc-bg' : 'text-lc-text3 hover:text-lc-text'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
              filtersOpen || activeFilterCount > 0
                ? 'bg-lc-text text-lc-bg border-lc-text'
                : 'border-lc-border text-lc-text3 hover:text-lc-text hover:border-lc-text3'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-lc-amber text-lc-bg text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {mode === 'modal' && onClose && (
            <button onClick={onClose} className="p-2 rounded-lg text-lc-text3 hover:text-lc-text hover:bg-lc-surface transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Collapsible filter panel ── */}
      {filtersOpen && (
        <div className="px-6 py-4 border-b border-lc-border bg-lc-card shrink-0 space-y-4">

          {/* Best for (flight plan) */}
          <div>
            <p className="text-[11px] font-semibold text-lc-text3 uppercase tracking-wide mb-2">Best for</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_FIT_PRESET_IDS.map((pid) => (
                <button
                  key={pid}
                  onClick={() => setActiveFit(activeFit === pid ? null : pid)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeFit === pid
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                      : 'bg-lc-bg border border-lc-border text-lc-text3 hover:text-lc-text'
                  }`}
                >
                  {PRESET_FIT_LABELS[pid] ?? pid}
                </button>
              ))}
            </div>
          </div>

          {/* Channel */}
          <div>
            <p className="text-[11px] font-semibold text-lc-text3 uppercase tracking-wide mb-2">Channel</p>
            <div className="flex flex-wrap gap-1.5">
              {visibleChannels.map((src) => (
                <button
                  key={src.key}
                  onClick={() => setActiveChannel(activeChannel === src.key ? null : src.key)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeChannel === src.key ? src.activeClass : src.inactiveClass
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <p className="text-[11px] font-semibold text-lc-text3 uppercase tracking-wide mb-2">Duration</p>
            <div className="flex gap-1.5">
              {DURATION_BANDS.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setActiveDuration(activeDuration === d.key ? null : d.key)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeDuration === d.key
                      ? 'bg-lc-blue text-white'
                      : 'bg-lc-bg border border-lc-border text-lc-text3 hover:text-lc-text'
                  }`}
                >
                  {d.label} <span className="opacity-60 font-normal">{d.sublabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Level */}
          <div>
            <p className="text-[11px] font-semibold text-lc-text3 uppercase tracking-wide mb-2">Level</p>
            <div className="flex gap-1.5 flex-wrap">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setActiveDifficulty(activeDifficulty === d ? null : d)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeDifficulty === d
                      ? 'bg-lc-blue/20 text-lc-blue border border-lc-blue/40'
                      : 'bg-lc-bg border border-lc-border text-lc-text3 hover:text-lc-text'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <p className="text-[11px] font-semibold text-lc-text3 uppercase tracking-wide mb-2">Topic</p>
            <input
              type="text"
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
              placeholder="Filter topics…"
              className="w-full mb-2 px-2.5 py-1 bg-lc-bg border border-lc-border rounded-lg text-xs text-lc-text placeholder-lc-text3 focus:border-lc-blue focus:ring-1 focus:ring-lc-blue-glow"
            />
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {allTags.filter((t) => !tagQuery || t.includes(tagQuery.toLowerCase())).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTag(activeTag === t ? null : t)}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all capitalize ${
                    activeTag === t
                      ? 'bg-red-600/20 text-red-400 border border-red-500/40'
                      : 'bg-lc-bg border border-lc-border text-lc-text3 hover:text-lc-text'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-lc-text3 hover:text-lc-text underline underline-offset-2 transition-colors">
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* ── Content ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">
        <ActiveFilterChips chips={chips} onClearAll={clearFilters} />

        {sorted.length > 0 && (
          <p className="mb-3 text-xs text-lc-text3">
            Showing {visible.length} of {sorted.length} video{sorted.length !== 1 ? 's' : ''}
          </p>
        )}

        {filtered.length === 0 && (
          <p className="text-sm text-lc-text3 text-center py-20">
            {favsOnly ? 'No saved videos yet — tap the star on any video to save it.' : 'No videos match your filters.'}
          </p>
        )}

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {visible.map((entry) => (
              <div
                key={`${entry.sourceType}-${entry.id}`}
                role="button"
                tabIndex={0}
                onClick={() => setDetail(entry)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetail(entry); } }}
                className="group text-left rounded-xl overflow-hidden border border-lc-border hover:border-red-500/60 hover:shadow-lg hover:shadow-red-900/20 hover:scale-[1.02] transition-all duration-200 bg-lc-surface cursor-pointer"
              >
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <ThumbnailImage youtubeId={entry.youtubeId ?? undefined} title={entry.title} />
                  <div className="absolute bottom-1.5 left-1.5 z-10">
                    <FavoriteStar active={favs.has(entryKey(entry))} onToggle={() => toggleFav(entryKey(entry))} />
                  </div>
                  {/* Persistent affordance: always signals the card opens details */}
                  <span className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold text-white/85 backdrop-blur-sm group-hover:bg-black/80 group-hover:text-white transition-colors">
                    <Info className="w-2.5 h-2.5" />Details
                  </span>
                  <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />{formatDuration(entry.durationSecs)}
                  </span>
                  <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-4 h-4 text-gray-900 ml-0.5 fill-gray-900" />
                    </div>
                    <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">View details</span>
                  </div>
                </div>
                <div className="p-2.5 space-y-1">
                  <p className="text-xs font-semibold text-lc-text leading-snug line-clamp-2 group-hover:text-red-400 transition-colors">{entry.title}</p>
                  <p className="text-[11px] text-lc-text3">{entry.speaker}</p>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${SOURCE_BADGE[entry.sourceType]}`}>
                      {SOURCE_CONFIG.find((s) => s.key === entry.sourceType)?.label}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-lc-bg border border-lc-border text-[10px] text-lc-text3">{entry.difficultyLevel}</span>
                    {fitLabel(entry) && (
                      <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-300">Best: {fitLabel(entry)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((entry) => (
              <div
                key={`${entry.sourceType}-${entry.id}`}
                role="button"
                tabIndex={0}
                onClick={() => setDetail(entry)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetail(entry); } }}
                className="group w-full text-left flex items-start gap-3 p-3 rounded-xl border border-lc-border hover:border-red-500/40 hover:bg-lc-surface/60 transition-all bg-lc-surface cursor-pointer"
              >
                <div className="relative shrink-0 w-28 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <ThumbnailImage youtubeId={entry.youtubeId ?? undefined} title={entry.title} />
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                    <Clock className="w-2 h-2" />{formatDuration(entry.durationSecs)}
                  </span>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-lc-text leading-snug line-clamp-1 group-hover:text-red-400 transition-colors">{entry.title}</p>
                  <p className="text-xs text-lc-text3">{entry.speaker}</p>
                  <p className="text-xs text-lc-text3 line-clamp-2 leading-relaxed">{entry.description}</p>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${SOURCE_BADGE[entry.sourceType]}`}>
                      {SOURCE_CONFIG.find((s) => s.key === entry.sourceType)?.label}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-lc-bg border border-lc-border text-[10px] text-lc-text3">{entry.difficultyLevel}</span>
                    {fitLabel(entry) && (
                      <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-300">Best: {fitLabel(entry)}</span>
                    )}
                    {entry.topicTags.slice(0, 2).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded-full bg-lc-bg border border-lc-border text-[10px] text-lc-text3 capitalize">{t}</span>
                    ))}
                  </div>
                </div>
                {/* Persistent affordance: save + row opens video details */}
                <div className="shrink-0 self-center flex items-center gap-2 text-lc-text3 group-hover:text-red-400 transition-colors">
                  <FavoriteStar active={favs.has(entryKey(entry))} onToggle={() => toggleFav(entryKey(entry))} />
                  <span className="hidden sm:inline text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">View details</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center pt-6">
            <button
              onClick={more}
              className="px-5 py-2 rounded-lg border border-lc-border text-sm font-semibold text-lc-text3 hover:text-lc-text hover:border-lc-text3 transition-colors"
            >
              Load more ({sorted.length - visible.length} more)
            </button>
          </div>
        )}
      </div>

      {detail && (
        <VideoDetailDrawer
          entry={detail}
          onClose={() => setDetail(null)}
          onUse={() => { pushRecent(entryKey(detail)); onSelect(detail.id, detail.sourceType); setDetail(null); }}
          isFav={favs.has(entryKey(detail))}
          onToggleFav={() => toggleFav(entryKey(detail))}
        />
      )}
    </div>
  );
}
