'use client';

// Shared primitives for the Video and Text library modals. Both modals are near-identical
// twins; cross-cutting behaviour (drawer a11y, favorites/recent persistence, sorting, filter
// chips, slide lightbox, clamped text) lives here so it stays consistent across the two.

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronDown, ArrowDownUp, Star } from 'lucide-react';
import { DIFFICULTIES } from '@/lib/difficulty';

// ── Drawer accessibility: Escape to close + focus the panel ───────────────────
// `enabled` lets a drawer suspend its own Escape handling while a nested overlay
// (e.g. the slide lightbox) is open, so Escape closes the overlay, not the drawer.
export function useDrawerA11y(onClose: () => void, enabled = true) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, enabled]);
  return ref;
}

// ── Sorting helpers ───────────────────────────────────────────────────────────
const DIFFICULTY_ORDER: Record<string, number> = Object.fromEntries(
  DIFFICULTIES.map((d, i) => [d, i]),
);

export function compareByTitle(a: { title: string }, b: { title: string }) {
  return a.title.localeCompare(b.title);
}
export function compareByDifficulty(a: { difficultyLevel: string }, b: { difficultyLevel: string }) {
  return (DIFFICULTY_ORDER[a.difficultyLevel] ?? 99) - (DIFFICULTY_ORDER[b.difficultyLevel] ?? 99);
}
export function recentRank(id: string, recent: string[]) {
  const idx = recent.indexOf(id);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

// ── localStorage-backed state (survives refresh / reopen; SSR-safe) ───────────
export function usePersistedState<T>(key: string, initial: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setVal(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
  }, [key]);
  const set = useCallback(
    (v: T) => {
      setVal(v);
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {
        /* ignore */
      }
    },
    [key],
  );
  return [val, set];
}

export function useFavorites(namespace: string) {
  const key = `lc-lib-favs-${namespace}`;
  const [favs, setFavs] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setFavs(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore */
    }
  }, [key]);
  const toggle = useCallback(
    (id: string) => {
      setFavs((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        try {
          localStorage.setItem(key, JSON.stringify(Array.from(next)));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [key],
  );
  return { favs, toggle };
}

export function useRecentlyUsed(namespace: string, max = 24) {
  const key = `lc-lib-recent-${namespace}`;
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setRecent(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, [key]);
  const pushRecent = useCallback(
    (id: string) => {
      setRecent((prev) => {
        const next = [id, ...prev.filter((x) => x !== id)].slice(0, max);
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [key, max],
  );
  return { recent, pushRecent };
}

// ── Incremental "show more" paging (resets when the filter signature changes) ──
export function useIncremental(resetKey: string, step = 24) {
  const [count, setCount] = useState(step);
  useEffect(() => {
    setCount(step);
  }, [resetKey, step]);
  const more = useCallback(() => setCount((c) => c + step), [step]);
  return { count, more };
}

// ── Sort dropdown ─────────────────────────────────────────────────────────────
export function SortSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { key: string; label: string }[];
}) {
  return (
    <div className="relative">
      <ArrowDownUp className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-lc-text3 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Sort"
        className="appearance-none pl-8 pr-7 py-2 bg-lc-bg border border-lc-border rounded-lg text-xs font-semibold text-lc-text3 hover:text-lc-text cursor-pointer focus:border-lc-blue focus:outline-none transition-colors"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key} className="bg-lc-card text-lc-text">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-lc-text3 pointer-events-none" />
    </div>
  );
}

// ── Removable active-filter chips ─────────────────────────────────────────────
export function ActiveFilterChips({
  chips,
  onClearAll,
}: {
  chips: { key: string; label: string; onRemove: () => void }[];
  onClearAll: () => void;
}) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-4">
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={c.onRemove}
          className="group flex items-center gap-1 px-2.5 py-1 rounded-full bg-lc-surface border border-lc-border text-[11px] font-medium text-lc-text hover:border-lc-text3 transition-colors"
        >
          <span className="capitalize">{c.label}</span>
          <X className="w-3 h-3 text-lc-text3 group-hover:text-lc-text" />
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="ml-1 text-[11px] text-lc-text3 hover:text-lc-text underline underline-offset-2 transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}

// ── Favorite (saved) star toggle ──────────────────────────────────────────────
export function FavoriteStar({
  active,
  onToggle,
  className = '',
}: {
  active: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={active ? 'Remove from saved' : 'Save'}
      title={active ? 'Remove from saved' : 'Save'}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`rounded-full p-1 backdrop-blur-sm transition-colors ${
        active ? 'bg-amber-400/90 text-white' : 'bg-black/55 text-white/80 hover:bg-black/75 hover:text-white'
      } ${className}`}
    >
      <Star className={`w-3 h-3 ${active ? 'fill-white' : ''}`} />
    </button>
  );
}

// ── Clamped description with Read more / Show less ────────────────────────────
export function ClampText({ text, lines = 6 }: { text: string; lines?: number }) {
  const [expanded, setExpanded] = useState(false);
  const longEnough = text.length > 280;
  return (
    <div>
      <p
        className="text-sm text-lc-text3 leading-relaxed whitespace-pre-line"
        style={
          expanded || !longEnough
            ? undefined
            : { display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
        }
      >
        {text}
      </p>
      {longEnough && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-semibold text-lc-blue hover:underline"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

// ── Full-screen slide viewer (picture books) ──────────────────────────────────
export function SlideLightbox({
  slides,
  startIndex = 0,
  onClose,
}: {
  slides: string[];
  startIndex?: number;
  onClose: () => void;
}) {
  const [i, setI] = useState(startIndex);
  const prev = useCallback(() => setI((v) => (v - 1 + slides.length) % slides.length), [slides.length]);
  const next = useCallback(() => setI((v) => (v + 1) % slides.length), [slides.length]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Slide preview"
    >
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
        <X className="w-5 h-5" />
      </button>
      {slides.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-3 sm:left-6 p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slides[i]}
        alt={`Slide ${i + 1}`}
        className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      {slides.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-3 sm:right-6 p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white/80 text-xs">
        {i + 1} / {slides.length}
      </span>
    </div>
  );
}
