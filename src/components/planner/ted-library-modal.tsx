'use client';

import { useState, useMemo } from 'react';
import { X, Clock, Search } from 'lucide-react';

type TedTalkMeta = {
  id: string;
  title: string;
  speaker: string;
  durationSecs: number;
  topicTags: string[];
  difficultyLevel: string;
  description: string;
};

// Client-only metadata — no transcripts/summaries sent to browser
import tedLibraryRaw from '@/data/ted-library.json';
const TED_TALKS: TedTalkMeta[] = (tedLibraryRaw as TedTalkMeta[]).map(
  ({ id, title, speaker, durationSecs, topicTags, difficultyLevel, description }) => ({
    id, title, speaker, durationSecs, topicTags, difficultyLevel, description,
  }),
);

const ALL_TAGS = Array.from(new Set(TED_TALKS.flatMap((t) => t.topicTags))).sort();
const DIFFICULTIES = ['Beginner', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced'];

function formatDuration(secs: number) {
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

interface Props {
  onSelect: (talkId: string) => void;
  onClose: () => void;
}

export function TedLibraryModal({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return TED_TALKS.filter((t) => {
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
  }, [query, activeTag, activeDifficulty]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pb-4 bg-black/70">
      <div className="w-full max-w-3xl bg-lc-card rounded-2xl border border-lc-border flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-lc-border shrink-0">
          <div>
            <h2 className="font-bold text-lc-text text-lg">TED Talk Library</h2>
            <p className="text-xs text-lc-text3">{TED_TALKS.length} curated talks with built-in transcripts</p>
          </div>
          <button onClick={onClose} className="text-lc-text3 hover:text-lc-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-lc-border space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lc-text3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, speaker, or topic…"
              className="w-full pl-9 pr-3 py-2 bg-lc-bg border border-lc-border rounded-lg text-sm text-lc-text placeholder-lc-text3 focus:border-lc-blue focus:ring-1 focus:ring-lc-blue-glow"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all capitalize ${
                  activeTag === tag
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-lc-bg border border-lc-border text-lc-text3 hover:text-lc-text'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setActiveDifficulty(activeDifficulty === d ? null : d)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
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

        {/* Results */}
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
          {filtered.length === 0 && (
            <p className="text-sm text-lc-text3 text-center py-8">No talks match your filters.</p>
          )}
          {filtered.map((talk) => (
            <button
              key={talk.id}
              onClick={() => onSelect(talk.id)}
              className="w-full text-left rounded-xl border border-lc-border bg-lc-surface hover:border-red-500/50 hover:bg-red-500/5 transition-all p-4 space-y-1.5 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-lc-text group-hover:text-red-400 transition-colors truncate">
                    {talk.title}
                  </p>
                  <p className="text-xs text-lc-text3">{talk.speaker}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-lc-text3 shrink-0">
                  <Clock className="w-3 h-3" />
                  {formatDuration(talk.durationSecs)}
                </div>
              </div>
              <p className="text-xs text-lc-text3 leading-relaxed line-clamp-2">{talk.description}</p>
              <div className="flex gap-1 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-lc-bg border border-lc-border text-xs text-lc-text3">
                  {talk.difficultyLevel}
                </span>
                {talk.topicTags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-lc-bg border border-lc-border text-xs text-lc-text3 capitalize">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
