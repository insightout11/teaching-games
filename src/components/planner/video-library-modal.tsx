'use client';

import { useState, useMemo } from 'react';
import { X, Clock, Search, ChevronRight } from 'lucide-react';

type VideoSource = 'ted' | 'teded';

type TedTalkMeta = {
  id: string;
  title: string;
  speaker: string;
  durationSecs: number;
  topicTags: string[];
  difficultyLevel: string;
  description: string;
  youtubeId?: string;
};

import tedLibraryRaw from '@/data/ted-library.json';
import tededLibraryRaw from '@/data/teded-library.json';

const TED_TALKS: TedTalkMeta[] = (tedLibraryRaw as TedTalkMeta[]).map(
  ({ id, title, speaker, durationSecs, topicTags, difficultyLevel, description, youtubeId }) => ({
    id, title, speaker, durationSecs, topicTags, difficultyLevel, description, youtubeId,
  }),
);
const TEDED_TALKS: TedTalkMeta[] = (tededLibraryRaw as TedTalkMeta[]).map(
  ({ id, title, speaker, durationSecs, topicTags, difficultyLevel, description, youtubeId }) => ({
    id, title, speaker, durationSecs, topicTags, difficultyLevel, description, youtubeId,
  }),
);

const DIFFICULTIES = ['Beginner', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced'];

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

interface Props {
  onSelect: (talkId: string, source: VideoSource) => void;
  onClose: () => void;
}

export function VideoLibraryModal({ onSelect, onClose }: Props) {
  const [activeSource, setActiveSource] = useState<VideoSource>('ted');
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeTalks = activeSource === 'teded' ? TEDED_TALKS : TED_TALKS;

  const ALL_TAGS = useMemo(
    () => Array.from(new Set(activeTalks.flatMap((t) => t.topicTags))).sort(),
    [activeTalks],
  );

  const filtered = useMemo(() => {
    return activeTalks.filter((t) => {
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
  }, [query, activeTag, activeDifficulty, activeTalks]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-lc-bg">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-lc-border shrink-0 bg-lc-card">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="font-bold text-lc-text text-xl tracking-tight">Video Library</h2>
            <p className="text-xs text-lc-text3 mt-0.5">{TED_TALKS.length + TEDED_TALKS.length} curated talks with transcripts & auto-checkpoints</p>
          </div>

          {/* Source tabs */}
          <div className="flex gap-1 bg-lc-bg border border-lc-border rounded-lg p-1">
            <button
              onClick={() => { setActiveSource('ted'); setActiveTag(null); setActiveDifficulty(null); setQuery(''); }}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                activeSource === 'ted' ? 'bg-red-600 text-white' : 'text-lc-text3 hover:text-lc-text'
              }`}
            >
              TED
            </button>
            <button
              onClick={() => { setActiveSource('teded'); setActiveTag(null); setActiveDifficulty(null); setQuery(''); }}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                activeSource === 'teded' ? 'bg-red-600 text-white' : 'text-lc-text3 hover:text-lc-text'
              }`}
            >
              TED-Ed
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-lg text-lc-text3 hover:text-lc-text hover:bg-lc-surface transition-colors"
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
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-xs text-lc-text3 font-medium">Topic:</span>
            {ALL_TAGS.map((tag) => (
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
        <p className="text-xs text-lc-text3">{filtered.length} talk{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
          {filtered.length === 0 && (
            <p className="text-sm text-lc-text3 text-center py-20">No talks match your filters.</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((talk) => {
              const isHovered = hoveredId === talk.id;
              return (
                <button
                  key={talk.id}
                  onClick={() => onSelect(talk.id, activeSource)}
                  onMouseEnter={() => setHoveredId(talk.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`group text-left rounded-xl overflow-hidden border transition-all duration-200 ${
                    isHovered
                      ? 'border-red-500/60 shadow-lg shadow-red-900/20 scale-[1.02]'
                      : 'border-lc-border hover:border-lc-border/80'
                  } bg-lc-surface`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <ThumbnailImage youtubeId={talk.youtubeId} title={talk.title} />
                    {/* Duration badge */}
                    <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDuration(talk.durationSecs)}
                    </span>
                    {/* Play overlay */}
                    <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                        <ChevronRight className="w-5 h-5 text-gray-900 ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-2.5 space-y-1">
                    <p className="text-xs font-semibold text-lc-text leading-snug line-clamp-2 group-hover:text-red-400 transition-colors">
                      {talk.title}
                    </p>
                    <p className="text-[11px] text-lc-text3">{talk.speaker}</p>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      <span className="px-1.5 py-0.5 rounded-full bg-lc-bg border border-lc-border text-[10px] text-lc-text3">
                        {talk.difficultyLevel}
                      </span>
                      {talk.topicTags.slice(0, 2).map((tag) => (
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
