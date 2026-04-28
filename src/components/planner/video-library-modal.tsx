'use client';

import { useState, useMemo } from 'react';
import { X, Clock, Search, ChevronRight, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { DIFFICULTIES } from '@/lib/difficulty';

// ── Library source config ─────────────────────────────────────────────────────

type LibrarySourceKey = 'ted' | 'teded' | 'bbc' | 'kurzgesagt' | 'bbc-ideas' | 'bigthink' | 'vox' | 'kids' | 'natgeo' | 'crash-course' | 'travel-english' | 'business-english' | 'internet-memes' | 'minecraft';

const SOURCE_CONFIG: { key: LibrarySourceKey; label: string; activeClass: string; inactiveClass: string }[] = [
  { key: 'ted',              label: 'TED',          activeClass: 'bg-red-600 text-white',          inactiveClass: 'bg-red-900/20 text-red-400 border border-red-800/40'          },
  { key: 'teded',            label: 'TED-Ed',        activeClass: 'bg-red-600 text-white',          inactiveClass: 'bg-red-900/20 text-red-400 border border-red-800/40'          },
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
};

type ViewMode = 'grid' | 'list';
type PreviewState = { entry: LibraryEntry; rect: DOMRect } | null;

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
  ...tag(tedRaw, 'ted'),
  ...tag(tededRaw, 'teded'),
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

function PreviewCard({ preview, onSelect }: { preview: PreviewState; onSelect: (id: string, source: LibrarySourceKey) => void }) {
  if (!preview) return null;
  const { entry, rect } = preview;
  const cardWidth = 288;
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const spaceRight = viewportW - rect.right - 16;
  const left = spaceRight >= cardWidth ? rect.right + 12 : rect.left - cardWidth - 12;
  const top = Math.max(8, Math.min(rect.top, viewportH - 340));
  const cfg = SOURCE_CONFIG.find((s) => s.key === entry.sourceType);

  return (
    <div
      className="fixed z-[200] w-72 bg-lc-card border border-lc-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden pointer-events-none animate-in fade-in duration-150"
      style={{ top, left }}
    >
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <ThumbnailImage youtubeId={entry.youtubeId ?? undefined} title={entry.title} />
        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />{formatDuration(entry.durationSecs)}
        </span>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-lc-text leading-snug">{entry.title}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs text-lc-text3">{entry.speaker}</p>
          {cfg && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${cfg.inactiveClass}`}>
              {cfg.label}
            </span>
          )}
        </div>
        <p className="text-xs text-lc-text3 leading-relaxed line-clamp-3">{entry.description}</p>
        <div className="flex flex-wrap gap-1 pt-1">
          <span className="px-2 py-0.5 rounded-full bg-lc-bg border border-lc-border text-[10px] text-lc-text3">{entry.difficultyLevel}</span>
          {entry.topicTags.slice(0, 3).map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-full bg-lc-bg border border-lc-border text-[10px] text-lc-text3 capitalize">{t}</span>
          ))}
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
  const [activeChannel, setActiveChannel] = useState<LibrarySourceKey | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<string | null>(null);
  const [activeDuration, setActiveDuration] = useState<DurationBand | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [preview, setPreview] = useState<PreviewState>(null);

  const baseEntries = useMemo(() => ALL_ENTRIES, []);

  const allTags = useMemo(
    () => Array.from(new Set(baseEntries.flatMap((e) => e.topicTags))).sort(),
    [baseEntries],
  );

  const filtered = useMemo(() => {
    return baseEntries.filter((e) => {
      if (activeChannel && e.sourceType !== activeChannel) return false;
      if (activeTag && !e.topicTags.includes(activeTag)) return false;
      if (activeDifficulty && e.difficultyLevel !== activeDifficulty) return false;
      if (activeDuration && getDurationBand(e.durationSecs) !== activeDuration) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.speaker.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.topicTags.some((t) => t.includes(q))
        );
      }
      return true;
    });
  }, [query, activeChannel, activeTag, activeDifficulty, activeDuration, baseEntries]);

  const activeFilterCount = [activeChannel, activeTag, activeDifficulty, activeDuration].filter(Boolean).length;

  function clearFilters() {
    setActiveChannel(null);
    setActiveTag(null);
    setActiveDifficulty(null);
    setActiveDuration(null);
    setQuery('');
  }

  function handleMouseEnter(e: React.MouseEvent<HTMLButtonElement>, entry: LibraryEntry) {
    const rect = e.currentTarget.getBoundingClientRect();
    setPreview({ entry, rect });
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
          <p className="text-xs text-lc-text3 mt-0.5">{ALL_ENTRIES.length} videos · {filtered.length} shown</p>
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
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {allTags.map((t) => (
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
      <div className="flex-1 overflow-y-auto px-6 py-5" onMouseLeave={() => setPreview(null)}>
        {filtered.length === 0 && (
          <p className="text-sm text-lc-text3 text-center py-20">No videos match your filters.</p>
        )}

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((entry) => (
              <button
                key={`${entry.sourceType}-${entry.id}`}
                onClick={() => onSelect(entry.id, entry.sourceType)}
                onMouseEnter={(e) => handleMouseEnter(e, entry)}
                onMouseLeave={() => setPreview(null)}
                className="group text-left rounded-xl overflow-hidden border border-lc-border hover:border-red-500/60 hover:shadow-lg hover:shadow-red-900/20 hover:scale-[1.02] transition-all duration-200 bg-lc-surface"
              >
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <ThumbnailImage youtubeId={entry.youtubeId ?? undefined} title={entry.title} />
                  <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />{formatDuration(entry.durationSecs)}
                  </span>
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <ChevronRight className="w-5 h-5 text-gray-900 ml-0.5" />
                    </div>
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
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((entry) => (
              <button
                key={`${entry.sourceType}-${entry.id}`}
                onClick={() => onSelect(entry.id, entry.sourceType)}
                onMouseEnter={(e) => handleMouseEnter(e, entry)}
                onMouseLeave={() => setPreview(null)}
                className="group w-full text-left flex items-start gap-3 p-3 rounded-xl border border-lc-border hover:border-red-500/40 hover:bg-lc-surface/60 transition-all bg-lc-surface"
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
                    {entry.topicTags.slice(0, 2).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded-full bg-lc-bg border border-lc-border text-[10px] text-lc-text3 capitalize">{t}</span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <PreviewCard preview={preview} onSelect={onSelect} />
    </div>
  );
}
