'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  X, BookOpen, Search, ChevronRight, LayoutGrid, List, SlidersHorizontal, Images, Info, Clock, Star,
  HeartPulse, Cpu, Leaf, Palette, GraduationCap, Brain, Briefcase, Newspaper, Users,
  Hammer, Trophy, Utensils, FlaskConical, Languages, PawPrint, Castle, TreePine,
  UserRound, Scale, Coins, Pickaxe, Heart, Compass, Sparkles, type LucideIcon,
} from 'lucide-react';
import { DIFFICULTIES } from '@/lib/difficulty';
import { recommendedPresetForSource, PRESET_FIT_LABELS, ALL_FIT_PRESET_IDS, type SourceGenre } from '@/lib/preset-fit';
import {
  useDrawerA11y, usePersistedState, useFavorites, useRecentlyUsed, useIncremental,
  SortSelect, ActiveFilterChips, FavoriteStar, ClampText, SlideLightbox,
  compareByTitle, compareByDifficulty, recentRank,
} from './library-shared';

type TextSourceKey = 'stories' | 'voa' | 'picture-books';

const SOURCE_CONFIG: { key: TextSourceKey; label: string; activeClass: string; inactiveClass: string }[] = [
  { key: 'picture-books', label: 'Picture Books', activeClass: 'bg-rose-500 text-white',  inactiveClass: 'bg-rose-900/20 text-rose-400 border border-rose-800/40'  },
  { key: 'stories',       label: 'Stories',       activeClass: 'bg-amber-500 text-white', inactiveClass: 'bg-amber-900/20 text-amber-400 border border-amber-800/40' },
  { key: 'voa',           label: 'VOA',           activeClass: 'bg-blue-600 text-white',  inactiveClass: 'bg-blue-900/20 text-blue-400 border border-blue-800/40'   },
];

const SOURCE_BADGE: Record<TextSourceKey, string> = {
  'picture-books': 'bg-rose-900/40 text-rose-400',
  stories:         'bg-amber-900/40 text-amber-400',
  voa:             'bg-blue-900/40 text-blue-400',
};

const TOPIC_COLORS: Record<string, string> = {
  // VOA subjects
  health:            'from-rose-900/50 to-rose-950/70',
  technology:        'from-indigo-900/50 to-indigo-950/70',
  environment:       'from-green-900/50 to-green-950/70',
  culture:           'from-fuchsia-900/50 to-fuchsia-950/70',
  education:         'from-violet-900/50 to-violet-950/70',
  psychology:        'from-purple-900/50 to-purple-950/70',
  business:          'from-slate-800/60 to-slate-950/80',
  media:             'from-sky-900/50 to-sky-950/70',
  society:           'from-blue-900/50 to-blue-950/70',
  work:              'from-stone-800/60 to-stone-950/80',
  sports:            'from-orange-900/50 to-orange-950/70',
  food:              'from-yellow-900/50 to-yellow-950/70',
  science:           'from-cyan-900/50 to-cyan-950/70',
  language:          'from-teal-900/50 to-teal-950/70',
  // Story / fable subjects
  animals:           'from-amber-900/50 to-amber-950/70',
  'fairy tale':      'from-violet-900/50 to-violet-950/70',
  'folk tale':       'from-rose-900/50 to-rose-950/70',
  fable:             'from-emerald-900/50 to-emerald-950/70',
  identity:          'from-blue-900/50 to-blue-950/70',
  honesty:           'from-emerald-900/50 to-emerald-950/70',
  greed:             'from-red-900/50 to-red-950/70',
  nature:            'from-teal-900/50 to-teal-950/70',
  'hard work':       'from-orange-900/50 to-orange-950/70',
  kindness:          'from-pink-900/50 to-pink-950/70',
  'problem solving': 'from-cyan-900/50 to-cyan-950/70',
  bravery:           'from-orange-900/50 to-orange-950/70',
  teamwork:          'from-teal-900/50 to-teal-950/70',
  adventure:         'from-indigo-900/50 to-indigo-950/70',
  magic:             'from-purple-900/50 to-purple-950/70',
  home:              'from-sky-900/50 to-sky-950/70',
  danger:            'from-red-900/50 to-red-950/70',
  pride:             'from-rose-900/50 to-rose-950/70',
};

const TOPIC_ICONS: Record<string, LucideIcon> = {
  // VOA subjects
  health: HeartPulse, technology: Cpu, environment: Leaf, culture: Palette,
  education: GraduationCap, psychology: Brain, business: Briefcase, media: Newspaper,
  society: Users, work: Hammer, sports: Trophy, food: Utensils, science: FlaskConical,
  language: Languages,
  // Story / fable subjects
  animals: PawPrint, 'fairy tale': Castle, nature: TreePine, identity: UserRound,
  honesty: Scale, justice: Scale, greed: Coins, 'hard work': Pickaxe, kindness: Heart,
  adventure: Compass, magic: Sparkles,
};

type TextEntry = {
  id: string;
  title: string;
  author: string;
  wordCount: number;
  topicTags: string[];
  difficultyLevel: string;
  description: string;
  summary?: string;
  slides?: string[];
  sourceType: TextSourceKey;
  /** LLM-classified genre (populated by scripts/classify-library-genres.ts); drives the "Best for" badge. */
  genre?: SourceGenre;
};

type ViewMode = 'grid' | 'list';

import storiesRaw from '@/data/stories-library.json';
import voaRaw from '@/data/voa-library.json';
import pictureBookRaw from '@/data/picture-books-library.json';

function tag<K extends TextSourceKey>(raw: unknown[], key: K): TextEntry[] {
  return (raw as TextEntry[]).map((e) => ({ ...e, sourceType: key }));
}

const ALL_ENTRIES: TextEntry[] = [
  ...tag(pictureBookRaw as unknown[], 'picture-books'),
  ...tag(storiesRaw, 'stories'),
  ...tag(voaRaw as unknown[], 'voa'),
];

// Stable per-entry key for favorites / recent / React keys (ids can repeat across sources).
const entryKey = (e: TextEntry) => `${e.sourceType}-${e.id}`;

const SORT_OPTIONS = [
  { key: 'relevance', label: 'Default order' },
  { key: 'recent', label: 'Recently used' },
  { key: 'length-asc', label: 'Shortest first' },
  { key: 'length-desc', label: 'Longest first' },
  { key: 'level', label: 'Level: easy → hard' },
  { key: 'title', label: 'Title: A–Z' },
];

function TextThumbnail({ entry }: { entry: TextEntry }) {
  const primaryTag = entry.topicTags[0] ?? '';
  const gradient = TOPIC_COLORS[primaryTag] ?? 'from-slate-800/50 to-slate-900/70';
  const Icon = TOPIC_ICONS[primaryTag] ?? BookOpen;
  const readMins = Math.ceil(entry.wordCount / 150);
  const coverSlide = entry.slides?.[0];
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-1.5 overflow-hidden`}>
      {coverSlide ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverSlide} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
      ) : (
        <>
          <Icon className="w-7 h-7 text-white/70" strokeWidth={1.5} />
          {primaryTag && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/55">{primaryTag}</span>
          )}
        </>
      )}
      {entry.slides && entry.slides.length > 0 && (
        <span className="absolute top-1.5 left-1.5 bg-rose-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 z-10">
          <Images className="w-2.5 h-2.5" />{entry.slides.length} slides
        </span>
      )}
      <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 z-10">
        <BookOpen className="w-2.5 h-2.5" />~{readMins} min
      </span>
    </div>
  );
}

function TextThumbnailSmall({ entry }: { entry: TextEntry }) {
  const primaryTag = entry.topicTags[0] ?? '';
  const gradient = TOPIC_COLORS[primaryTag] ?? 'from-slate-800/50 to-slate-900/70';
  const Icon = TOPIC_ICONS[primaryTag] ?? BookOpen;
  const coverSlide = entry.slides?.[0];
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
      {coverSlide ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverSlide} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
      ) : (
        <Icon className="w-[18px] h-[18px] text-white/70" strokeWidth={1.5} />
      )}
    </div>
  );
}

function TextDetailDrawer({
  entry,
  onClose,
  onUse,
  isFav,
  onToggleFav,
}: {
  entry: TextEntry;
  onClose: () => void;
  onUse: () => void;
  isFav: boolean;
  onToggleFav: () => void;
}) {
  const cfg = SOURCE_CONFIG.find((s) => s.key === entry.sourceType);
  const readMins = Math.ceil(entry.wordCount / 150);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const panelRef = useDrawerA11y(onClose, lightbox === null);
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/50 animate-in fade-in duration-150" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Text details: ${entry.title}`}
        className="relative w-full max-w-md h-full bg-lc-card border-l border-lc-border shadow-2xl shadow-black/50 flex flex-col animate-in slide-in-from-right duration-200 outline-none"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-lc-border shrink-0">
          <p className="text-sm font-semibold text-lc-text">Text details</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-lc-text3 hover:text-lc-text hover:bg-lc-surface transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
            <TextThumbnail entry={entry} />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-lc-text leading-snug">{entry.title}</h3>
            <div className="flex items-center gap-2 flex-wrap text-xs text-lc-text3">
              <span>{entry.author}</span>
              {cfg && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${cfg.inactiveClass}`}>{cfg.label}</span>}
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />~{readMins} min · {entry.wordCount} words</span>
            </div>
          </div>

          {(entry.summary || entry.description) && (
            <ClampText text={entry.summary || entry.description} />
          )}

          {entry.slides && entry.slides.length > 0 && (
            <div>
              <div className="grid grid-cols-3 gap-2">
                {entry.slides.slice(0, 6).map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightbox(i)}
                    className="relative block rounded-lg overflow-hidden border border-lc-border hover:border-rose-400/60 transition-colors"
                    style={{ aspectRatio: '1 / 1' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s}
                      alt={`Slide ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                    {i === 5 && entry.slides!.length > 6 && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm font-semibold">
                        +{entry.slides!.length - 6}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-lc-text3">Tap a slide to flip through all {entry.slides.length}.</p>
            </div>
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
            className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold transition-colors"
          >
            Use this text
          </button>
        </div>
      </div>

      {lightbox !== null && entry.slides && (
        <SlideLightbox slides={entry.slides} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

interface Props {
  onSelect: (entryId: string, source: TextSourceKey) => void;
  onClose?: () => void;
  mode?: 'modal' | 'page';
}

export function TextLibraryModal({ onSelect, onClose, mode = 'modal' }: Props) {
  const [query, setQuery] = useState('');
  const [activeSource, setActiveSource] = usePersistedState<TextSourceKey | null>('lc-lib-text-source', null);
  const [activeTag, setActiveTag] = usePersistedState<string | null>('lc-lib-text-tag', null);
  const [activeDifficulty, setActiveDifficulty] = usePersistedState<string | null>('lc-lib-text-level', null);
  const [activeFit, setActiveFit] = usePersistedState<string | null>('lc-lib-text-fit', null);
  const [tagQuery, setTagQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = usePersistedState<ViewMode>('lc-lib-text-view', 'grid');
  const [sortKey, setSortKey] = usePersistedState<string>('lc-lib-text-sort', 'relevance');
  const [favsOnly, setFavsOnly] = usePersistedState<boolean>('lc-lib-text-favsonly', false);
  const [detail, setDetail] = useState<TextEntry | null>(null);

  const { favs, toggle: toggleFav } = useFavorites('text');
  const { recent, pushRecent } = useRecentlyUsed('text');

  const allTags = useMemo(
    () => Array.from(new Set(ALL_ENTRIES.flatMap((e) => e.topicTags))).sort(),
    [],
  );

  // Best-fit preset per entry (stored genre → heuristic). Drives the badge + fit filter.
  const fitByKey = useMemo(() => {
    const m = new Map<string, { presetId: string; label: string }>();
    for (const e of ALL_ENTRIES) {
      const r = recommendedPresetForSource({ genre: e.genre, title: e.title, lessonGoal: e.description, subtitle: e.summary, skills: e.topicTags });
      if (r) m.set(entryKey(e), r);
    }
    return m;
  }, []);
  const fitLabel = (e: TextEntry) => fitByKey.get(entryKey(e))?.label ?? null;

  const filtered = useMemo(() => {
    return ALL_ENTRIES.filter((e) => {
      if (favsOnly && !favs.has(entryKey(e))) return false;
      if (activeSource && e.sourceType !== activeSource) return false;
      if (activeTag && !e.topicTags.includes(activeTag)) return false;
      if (activeDifficulty && e.difficultyLevel !== activeDifficulty) return false;
      if (activeFit && fitByKey.get(entryKey(e))?.presetId !== activeFit) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.author.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.summary?.toLowerCase().includes(q) ?? false) ||
          e.topicTags.some((t) => t.includes(q))
        );
      }
      return true;
    });
  }, [query, activeSource, activeTag, activeDifficulty, activeFit, fitByKey, favsOnly, favs]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortKey) {
      case 'recent': arr.sort((a, b) => recentRank(entryKey(a), recent) - recentRank(entryKey(b), recent)); break;
      case 'length-asc': arr.sort((a, b) => a.wordCount - b.wordCount); break;
      case 'length-desc': arr.sort((a, b) => b.wordCount - a.wordCount); break;
      case 'level': arr.sort(compareByDifficulty); break;
      case 'title': arr.sort(compareByTitle); break;
      default: break;
    }
    return arr;
  }, [filtered, sortKey, recent]);

  const activeFilterCount = [activeSource, activeTag, activeDifficulty, activeFit, favsOnly].filter(Boolean).length;

  const filterSig = `${query}|${activeSource}|${activeTag}|${activeDifficulty}|${activeFit}|${favsOnly}|${sortKey}`;
  const { count, more } = useIncremental(filterSig, 24);
  const visible = sorted.slice(0, count);
  const hasMore = visible.length < sorted.length;

  // Auto-load the next page as the sentinel nears the bottom of the scroll area.
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
  if (activeSource) chips.push({ key: 'source', label: SOURCE_CONFIG.find((s) => s.key === activeSource)?.label ?? activeSource, onRemove: () => setActiveSource(null) });
  if (activeDifficulty) chips.push({ key: 'level', label: activeDifficulty, onRemove: () => setActiveDifficulty(null) });
  if (activeTag) chips.push({ key: 'tag', label: activeTag, onRemove: () => setActiveTag(null) });
  if (activeFit) chips.push({ key: 'fit', label: `Best for ${PRESET_FIT_LABELS[activeFit] ?? activeFit}`, onRemove: () => setActiveFit(null) });
  if (favsOnly) chips.push({ key: 'saved', label: 'Saved', onRemove: () => setFavsOnly(false) });

  function clearFilters() {
    setActiveSource(null);
    setActiveTag(null);
    setActiveDifficulty(null);
    setActiveFit(null);
    setFavsOnly(false);
    setQuery('');
  }

  return (
    <div className={mode === 'page' ? 'w-full h-full flex flex-col bg-lc-bg' : 'fixed inset-0 z-50 flex flex-col bg-lc-bg'}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-lc-border shrink-0 bg-lc-card">
        <div className="shrink-0">
          <h2 className="font-bold text-lc-text text-xl tracking-tight">Text Library</h2>
          <p className="text-xs text-lc-text3 mt-0.5">{ALL_ENTRIES.length} texts</p>
        </div>

        {/* Search */}
        <div className="flex-1 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lc-text3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, author, topic…"
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

          {mode !== 'page' && onClose && (
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

          {/* Source */}
          <div>
            <p className="text-[11px] font-semibold text-lc-text3 uppercase tracking-wide mb-2">Collection</p>
            <div className="flex flex-wrap gap-1.5">
              {SOURCE_CONFIG.map((src) => (
                <button
                  key={src.key}
                  onClick={() => setActiveSource(activeSource === src.key ? null : src.key)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeSource === src.key ? src.activeClass : src.inactiveClass
                  }`}
                >
                  {src.label}
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
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
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
            Showing {visible.length} of {sorted.length} reading{sorted.length !== 1 ? 's' : ''}
          </p>
        )}

        {filtered.length === 0 && (
          <p className="text-sm text-lc-text3 text-center py-20">
            {favsOnly ? 'No saved texts yet — tap the star on any text to save it.' : 'No texts match your filters.'}
          </p>
        )}

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {visible.map((entry) => (
              <div
                key={entryKey(entry)}
                role="button"
                tabIndex={0}
                onClick={() => setDetail(entry)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetail(entry); } }}
                className="group text-left rounded-xl overflow-hidden border border-lc-border hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-900/20 hover:scale-[1.02] transition-all duration-200 bg-lc-surface cursor-pointer"
              >
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <TextThumbnail entry={entry} />
                  <div className="absolute bottom-1.5 left-1.5 z-10">
                    <FavoriteStar active={favs.has(entryKey(entry))} onToggle={() => toggleFav(entryKey(entry))} />
                  </div>
                  {/* Persistent affordance: always signals the card opens details */}
                  <span className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 rounded-full bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold text-white/85 backdrop-blur-sm group-hover:bg-black/80 group-hover:text-white transition-colors">
                    <Info className="w-2.5 h-2.5" />Details
                  </span>
                  <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <ChevronRight className="w-5 h-5 text-gray-900 ml-0.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">View details</span>
                  </div>
                </div>
                <div className="p-2.5 space-y-1">
                  <p className="text-xs font-semibold text-lc-text leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors">{entry.title}</p>
                  <p className="text-[11px] text-lc-text3">{entry.author}</p>
                  <p className="text-[11px] text-lc-text3 leading-relaxed line-clamp-2">{entry.description}</p>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${SOURCE_BADGE[entry.sourceType]}`}>
                      {SOURCE_CONFIG.find((s) => s.key === entry.sourceType)?.label}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-lc-bg border border-lc-border text-[10px] text-lc-text3">{entry.difficultyLevel}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-lc-bg border border-lc-border text-[10px] text-lc-text3">{entry.wordCount}w</span>
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
            {visible.map((entry) => {
              const readMins = Math.ceil(entry.wordCount / 150);
              return (
                <div
                  key={entryKey(entry)}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetail(entry)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetail(entry); } }}
                  className="group w-full text-left flex items-start gap-3 p-3 rounded-xl border border-lc-border hover:border-amber-500/40 hover:bg-lc-surface/60 transition-all bg-lc-surface cursor-pointer"
                >
                  <div className="relative shrink-0 w-24 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <TextThumbnailSmall entry={entry} />
                    {entry.slides && entry.slides.length > 0 && (
                      <span className="absolute top-0.5 left-0.5 bg-rose-500/90 text-white text-[8px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                        <Images className="w-2 h-2" />{entry.slides.length}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-lc-text leading-snug line-clamp-1 group-hover:text-amber-400 transition-colors">{entry.title}</p>
                    <p className="text-xs text-lc-text3">{entry.author} · ~{readMins} min · {entry.wordCount} words</p>
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
                  {/* Persistent affordance: save + row opens text details */}
                  <div className="shrink-0 self-center flex items-center gap-2 text-lc-text3 group-hover:text-amber-400 transition-colors">
                    <FavoriteStar active={favs.has(entryKey(entry))} onToggle={() => toggleFav(entryKey(entry))} />
                    <span className="hidden sm:inline text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">View details</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
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
        <TextDetailDrawer
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
