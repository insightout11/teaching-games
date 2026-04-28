'use client';

import { useState, useMemo } from 'react';
import { X, BookOpen, Search, ChevronRight } from 'lucide-react';
import { DIFFICULTIES } from '@/lib/difficulty';

type TextSourceKey = 'stories' | 'voa' | 'picture-books';
type TabKey = 'all' | TextSourceKey;

const SOURCE_CONFIG: { key: TabKey; label: string; activeClass: string }[] = [
  { key: 'all',           label: 'All',           activeClass: 'bg-lc-text text-lc-bg'    },
  { key: 'picture-books', label: 'Picture Books', activeClass: 'bg-rose-500 text-white'   },
  { key: 'stories',       label: 'Stories',       activeClass: 'bg-amber-500 text-white'  },
  { key: 'voa',           label: 'VOA',           activeClass: 'bg-blue-600 text-white'   },
];

const SOURCE_BADGE: Record<TextSourceKey, string> = {
  'picture-books': 'bg-rose-900/40 text-rose-400',
  stories:         'bg-amber-900/40 text-amber-400',
  voa:             'bg-blue-900/40 text-blue-400',
};

const TOPIC_COLORS: Record<string, string> = {
  animals:        'from-amber-900/50 to-amber-950/70',
  'fairy tale':   'from-violet-900/50 to-violet-950/70',
  'folk tale':    'from-rose-900/50 to-rose-950/70',
  fable:          'from-emerald-900/50 to-emerald-950/70',
  identity:       'from-blue-900/50 to-blue-950/70',
  honesty:        'from-emerald-900/50 to-emerald-950/70',
  greed:          'from-red-900/50 to-red-950/70',
  nature:         'from-teal-900/50 to-teal-950/70',
  'hard work':    'from-orange-900/50 to-orange-950/70',
  kindness:       'from-pink-900/50 to-pink-950/70',
  'problem solving': 'from-cyan-900/50 to-cyan-950/70',
  bravery:        'from-orange-900/50 to-orange-950/70',
  teamwork:       'from-teal-900/50 to-teal-950/70',
  adventure:      'from-indigo-900/50 to-indigo-950/70',
  magic:          'from-purple-900/50 to-purple-950/70',
  food:           'from-yellow-900/50 to-yellow-950/70',
  home:           'from-sky-900/50 to-sky-950/70',
  danger:         'from-red-900/50 to-red-950/70',
  pride:          'from-rose-900/50 to-rose-950/70',
};

const TOPIC_ICONS: Record<string, string> = {
  animals: '🦊', 'fairy tale': '🏰', 'folk tale': '🌾', fable: '🦉',
  identity: '🦢', honesty: '🐑', greed: '🥚', nature: '🌤️',
  'hard work': '🐜', kindness: '🦁', 'problem solving': '🐦',
  perseverance: '🐢', trust: '🐺', danger: '🌲', bravery: '🛡️',
  teamwork: '🤝', adventure: '⚔️', magic: '✨', food: '🍞',
  home: '🏡', pride: '🦅',
};

type TextEntry = {
  id: string;
  title: string;
  author: string;
  wordCount: number;
  topicTags: string[];
  difficultyLevel: string;
  description: string;
  summary: string;
  slides?: string[];
  sourceType: TextSourceKey;
};

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

function TextThumbnail({ entry }: { entry: TextEntry }) {
  const primaryTag = entry.topicTags[0] ?? '';
  const gradient = TOPIC_COLORS[primaryTag] ?? 'from-slate-800/50 to-slate-900/70';
  const icon = TOPIC_ICONS[primaryTag] ?? '📖';
  const readMins = Math.ceil(entry.wordCount / 150);
  const coverSlide = entry.slides?.[0];
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2 overflow-hidden`}>
      {coverSlide ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverSlide}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <span className="text-3xl opacity-70">{icon}</span>
      )}
      {entry.slides && entry.slides.length > 0 && (
        <span className="absolute top-1.5 left-1.5 bg-rose-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 z-10">
          🖼 {entry.slides.length} slides
        </span>
      )}
      <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 z-10">
        <BookOpen className="w-2.5 h-2.5" />
        ~{readMins} min
      </span>
    </div>
  );
}

interface Props {
  onSelect: (entryId: string, source: TextSourceKey) => void;
  onClose?: () => void;
  mode?: 'modal' | 'page';
}

export function TextLibraryModal({ onSelect, onClose, mode = 'modal' }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const tabEntries = useMemo(() => {
    if (activeTab === 'all') return ALL_ENTRIES;
    return ALL_ENTRIES.filter((e) => e.sourceType === activeTab);
  }, [activeTab]);

  const allTags = useMemo(
    () => Array.from(new Set(tabEntries.flatMap((e) => e.topicTags))).sort(),
    [tabEntries],
  );

  const filtered = useMemo(() => {
    return tabEntries.filter((e) => {
      if (activeTag && !e.topicTags.includes(activeTag)) return false;
      if (activeDifficulty && e.difficultyLevel !== activeDifficulty) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.author.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.topicTags.some((t) => t.includes(q))
        );
      }
      return true;
    });
  }, [query, activeTag, activeDifficulty, tabEntries]);

  function switchTab(key: TabKey) {
    setActiveTab(key);
    setActiveTag(null);
    setActiveDifficulty(null);
    setQuery('');
  }

  const showSourceBadge = activeTab === 'all';

  return (
    <div className={mode === 'page' ? 'w-full h-full flex flex-col bg-lc-bg' : 'fixed inset-0 z-50 flex flex-col bg-lc-bg'}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-lc-border shrink-0 bg-lc-card">
        <div className="flex items-center gap-4 min-w-0">
          <div className="shrink-0">
            <h2 className="font-bold text-lc-text text-xl tracking-tight">Text Library</h2>
            <p className="text-xs text-lc-text3 mt-0.5">{ALL_ENTRIES.length} texts for classroom reading</p>
          </div>
          <div className="flex gap-1 bg-lc-bg border border-lc-border rounded-lg p-1 overflow-x-auto scrollbar-hide">
            {SOURCE_CONFIG.map((src) => (
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
        {mode !== 'page' && onClose && (
          <button onClick={onClose} className="p-2 rounded-lg text-lc-text3 hover:text-lc-text hover:bg-lc-surface transition-colors shrink-0 ml-3">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-lc-border bg-lc-card shrink-0 space-y-2">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lc-text3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, author, or topic…"
            className="w-full pl-9 pr-3 py-2 bg-lc-bg border border-lc-border rounded-lg text-sm text-lc-text placeholder-lc-text3 focus:border-lc-blue focus:ring-1 focus:ring-lc-blue-glow"
          />
        </div>
        <div className="flex gap-4 flex-wrap items-center">
          {allTags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap items-center">
              <span className="text-xs text-lc-text3 font-medium">Topic:</span>
              {allTags.map((t) => (
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
        <p className="text-xs text-lc-text3">{filtered.length} text{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {filtered.length === 0 && (
          <p className="text-sm text-lc-text3 text-center py-20">No texts match your filters.</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((entry) => {
            const isHovered = hoveredId === entry.id;
            return (
              <button
                key={entry.id}
                onClick={() => onSelect(entry.id, entry.sourceType)}
                onMouseEnter={() => setHoveredId(entry.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group text-left rounded-xl overflow-hidden border transition-all duration-200 ${
                  isHovered
                    ? 'border-amber-500/60 shadow-lg shadow-amber-900/20 scale-[1.02]'
                    : 'border-lc-border hover:border-lc-border/80'
                } bg-lc-surface`}
              >
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <TextThumbnail entry={entry} />
                  <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <ChevronRight className="w-5 h-5 text-gray-900 ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-2.5 space-y-1">
                  <p className="text-xs font-semibold text-lc-text leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors">
                    {entry.title}
                  </p>
                  <p className="text-[11px] text-lc-text3">{entry.author}</p>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {showSourceBadge && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${SOURCE_BADGE[entry.sourceType]}`}>
                        {SOURCE_CONFIG.find((s) => s.key === entry.sourceType)?.label}
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded-full bg-lc-bg border border-lc-border text-[10px] text-lc-text3">
                      {entry.difficultyLevel}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-lc-bg border border-lc-border text-[10px] text-lc-text3">
                      {entry.wordCount}w
                    </span>
                    {entry.topicTags.slice(0, 1).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded-full bg-lc-bg border border-lc-border text-[10px] text-lc-text3 capitalize">
                        {t}
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
