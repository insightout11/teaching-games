'use client';

import { useState, useMemo } from 'react';
import { X, Clock, Search, ChevronRight } from 'lucide-react';
import { DIFFICULTIES } from '@/lib/difficulty';

// ── Library source config ─────────────────────────────────────────────────────

type LibrarySourceKey = 'ted' | 'teded' | 'bbc' | 'kurzgesagt' | 'bbc-ideas' | 'bigthink' | 'vox' | 'kids';
type TabKey = 'all' | LibrarySourceKey;

const SOURCE_CONFIG: { key: TabKey; label: string; activeClass: string }[] = [
  { key: 'all',        label: 'All',        activeClass: 'bg-lc-text text-lc-bg'         },
  { key: 'ted',        label: 'TED',        activeClass: 'bg-red-600 text-white'          },
  { key: 'teded',      label: 'TED-Ed',     activeClass: 'bg-red-600 text-white'          },
  { key: 'bbc',        label: 'BBC',        activeClass: 'bg-amber-500 text-white'        },
  { key: 'kurzgesagt', label: 'Kurzgesagt', activeClass: 'bg-orange-500 text-white'       },
  { key: 'bbc-ideas',  label: 'BBC Ideas',  activeClass: 'bg-cyan-500 text-white'         },
  { key: 'bigthink',   label: 'Big Think',  activeClass: 'bg-purple-600 text-white'       },
  { key: 'vox',        label: 'Vox',        activeClass: 'bg-violet-600 text-white'       },
  { key: 'kids',       label: 'For Kids',   activeClass: 'bg-green-600 text-white'        },
];

// Source badge colors for cards in the ALL tab
const SOURCE_BADGE: Record<LibrarySourceKey, string> = {
  ted:        'bg-red-900/40 text-red-400',
  teded:      'bg-red-900/40 text-red-400',
  bbc:        'bg-amber-900/40 text-amber-400',
  kurzgesagt: 'bg-orange-900/40 text-orange-400',
  'bbc-ideas':'bg-cyan-900/40 text-cyan-400',
  bigthink:   'bg-purple-900/40 text-purple-400',
  vox:        'bg-violet-900/40 text-violet-400',
  kids:       'bg-green-900/40 text-green-400',
};

// ── Types ─────────────────────────────────────────────────────────────────────

type LibraryEntry = {
  id: string;
  title: string;
  speaker: string;
  durationSecs: number;
  topicTags: string[];
  difficultyLevel: string;
  description: string;
  youtubeId?: string | null;
  audience?: 'kids';
  // injected at load time
  sourceType: LibrarySourceKey;
};

// ── Import all library data ───────────────────────────────────────────────────

import tedRaw from '@/data/ted-library.json';
import tededRaw from '@/data/teded-library.json';
import bbcRaw from '@/data/bbc-library.json';
import kurzgesagtRaw from '@/data/kurzgesagt-library.json';
import bbcIdeasRaw from '@/data/bbc-ideas-library.json';
import bigthinkRaw from '@/data/bigthink-library.json';
import voxRaw from '@/data/vox-library.json';
import kidsRaw from '@/data/kids-library.json';

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

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onSelect: (talkId: string, source: LibrarySourceKey) => void;
  onClose: () => void;
}

export function VideoLibraryModal({ onSelect, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const tabEntries = useMemo(() => {
    if (activeTab === 'all') return ALL_ENTRIES.filter((e) => e.audience !== 'kids');
    if (activeTab === 'kids') return ALL_ENTRIES.filter((e) => e.audience === 'kids');
    return ALL_ENTRIES.filter((e) => e.sourceType === activeTab);
  }, [activeTab]);

  const allTags = useMemo(
    () => Array.from(new Set(tabEntries.flatMap((t) => t.topicTags))).sort(),
    [tabEntries],
  );

  const filtered = useMemo(() => {
    return tabEntries.filter((t) => {
      if (activeTag && !t.topicTags.includes(activeTag)) return false;
      if (activeDifficulty && t.difficultyLevel !== activeDifficulty) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.speaker.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.topicTags.some((tag) => tag.includes(q))
        );
      }
      return true;
    });
  }, [query, activeTag, activeDifficulty, tabEntries]);

  const totalCount = ALL_ENTRIES.length;
  const showSourceBadge = activeTab === 'all';

  function switchTab(key: TabKey) {
    setActiveTab(key);
    setActiveTag(null);
    setActiveDifficulty(null);
    setQuery('');
  }

  // Only show tabs that have content (or are 'all')
  const visibleTabs = SOURCE_CONFIG.filter(
    (s) => s.key === 'all' || ALL_ENTRIES.some((e) =>
      s.key === 'kids' ? e.audience === 'kids' : e.sourceType === s.key
    ),
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-lc-bg">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-lc-border shrink-0 bg-lc-card">
        <div className="flex items-center gap-4 min-w-0">
          <div className="shrink-0">
            <h2 className="font-bold text-lc-text text-xl tracking-tight">Video Library</h2>
            <p className="text-xs text-lc-text3 mt-0.5">{totalCount} curated videos with transcripts &amp; auto-checkpoints</p>
          </div>
          {/* Source tabs — scrollable on small screens */}
          <div className="flex gap-1 bg-lc-bg border border-lc-border rounded-lg p-1 overflow-x-auto max-w-full scrollbar-hide">
            {visibleTabs.map((src) => (
              <button
                key={src.key}
                onClick={() => switchTab(src.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === src.key ? src.activeClass : 'text-lc-text3 hover:text-lc-text'
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-lc-text3 hover:text-lc-text hover:bg-lc-surface transition-colors shrink-0 ml-3"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-lc-border bg-lc-card shrink-0 space-y-2">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lc-text3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, speaker, or topic…"
            className="w-full pl-9 pr-3 py-2 bg-lc-bg border border-lc-border rounded-lg text-sm text-lc-text placeholder-lc-text3 focus:border-lc-blue focus:ring-1 focus:ring-lc-blue-glow"
          />
        </div>
        <div className="flex gap-4 flex-wrap items-center">
          {allTags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap items-center">
              <span className="text-xs text-lc-text3 font-medium">Topic:</span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all capitalize ${
                    activeTag === tag
                      ? 'bg-red-600/20 text-red-400 border border-red-500/40'
                      : 'bg-lc-bg border border-lc-border text-lc-text3 hover:text-lc-text'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-xs text-lc-text3 font-medium">Level:</span>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setActiveDifficulty(activeDifficulty === d ? null : d)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                  activeDifficulty === d
                    ? 'bg-lc-blue/20 text-lc-blue border border-lc-blue/40'
                    : 'bg-lc-bg border border-lc-border text-lc-text3 hover:text-lc-text'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          {(activeTag || activeDifficulty || query) && (
            <button
              onClick={() => { setActiveTag(null); setActiveDifficulty(null); setQuery(''); }}
              className="text-xs text-lc-text3 hover:text-lc-text transition-colors underline underline-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>
        <p className="text-xs text-lc-text3">{filtered.length} video{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {filtered.length === 0 && (
          <p className="text-sm text-lc-text3 text-center py-20">
            {tabEntries.length === 0 ? 'Coming soon — this library is being curated.' : 'No videos match your filters.'}
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((entry) => {
            const isHovered = hoveredId === entry.id;
            return (
              <button
                key={`${entry.sourceType}-${entry.id}`}
                onClick={() => onSelect(entry.id, entry.sourceType)}
                onMouseEnter={() => setHoveredId(entry.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group text-left rounded-xl overflow-hidden border transition-all duration-200 ${
                  isHovered
                    ? 'border-red-500/60 shadow-lg shadow-red-900/20 scale-[1.02]'
                    : 'border-lc-border hover:border-lc-border/80'
                } bg-lc-surface`}
              >
                {/* Thumbnail */}
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <ThumbnailImage youtubeId={entry.youtubeId ?? undefined} title={entry.title} />
                  <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDuration(entry.durationSecs)}
                  </span>
                  <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <ChevronRight className="w-5 h-5 text-gray-900 ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-2.5 space-y-1">
                  <p className="text-xs font-semibold text-lc-text leading-snug line-clamp-2 group-hover:text-red-400 transition-colors">
                    {entry.title}
                  </p>
                  <p className="text-[11px] text-lc-text3">{entry.speaker}</p>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {showSourceBadge && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${SOURCE_BADGE[entry.sourceType]}`}>
                        {SOURCE_CONFIG.find((s) => s.key === entry.sourceType)?.label}
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded-full bg-lc-bg border border-lc-border text-[10px] text-lc-text3">
                      {entry.difficultyLevel}
                    </span>
                    {entry.topicTags.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 rounded-full bg-lc-bg border border-lc-border text-[10px] text-lc-text3 capitalize">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
