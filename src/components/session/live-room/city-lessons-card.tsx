'use client';

import { BookOpen, PlayCircle, Stamp } from 'lucide-react';
import { levelLabel } from '@/lib/difficulty';
import type { DestinationFocus, DestinationPack } from '@/lib/world-flight/types';

/** A city lesson is offered once its material has been checked (same rule as the World Flight map). */
export function isPublishedFocus(focus: DestinationFocus) {
  return focus.kind === 'video' ? focus.review.status === 'transcript-verified' : focus.review.status === 'researched';
}

/**
 * The room map's city card: where the class is flying (or a far city it is looking at), and that city's own
 * lessons. Picking a lesson opens the flight panel for it. Flying there with no city lesson is still one tap
 * (the take-off button beside this card).
 */
export function CityLessonsCard({ city, originCity, km, far, visited, locked, onPickLesson, onVote }: {
  city: DestinationPack;
  originCity: string;
  km: number;
  /** Out of the plane's range: its lessons can be taught, but the class does not fly there. */
  far: boolean;
  visited: boolean;
  /** A flight plan is already loaded or the destination is fixed: the lessons are shown but not offered. */
  locked: boolean;
  onPickLesson: (focus: DestinationFocus) => void;
  onVote?: () => void;
}) {
  const lessons = city.focusOptions.filter(isPublishedFocus);
  return (
    <div className="w-[min(24rem,calc(100vw-3rem))] rounded-xl border border-white/15 bg-slate-950/85 px-3 py-2.5 backdrop-blur-md">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sky-300">{far ? 'Out of range today' : 'Where next? Tap a city'}</p>
      <p className="font-display text-lg leading-tight text-white">{far ? city.city : `${originCity} → ${city.city}`}</p>
      <p className="flex flex-wrap items-center gap-x-2 font-mono text-xs text-white/60">
        <span>{km.toLocaleString()} km</span>
        <span>{city.country}</span>
        {visited && <span className="flex items-center gap-1 text-emerald-300"><Stamp className="h-3 w-3" />Stamped</span>}
      </p>
      {lessons.length > 0 && (
        <>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
            {far ? `Teach a ${city.city} lesson from ${originCity}` : `Lessons in ${city.city}`}
          </p>
          <div className="mt-1 max-h-40 space-y-1 overflow-y-auto pr-1">
            {lessons.map((focus) => (
              <button
                key={focus.id}
                type="button"
                disabled={locked}
                onClick={() => onPickLesson(focus)}
                className="flex w-full items-start gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-left transition hover:border-amber-300/50 hover:bg-amber-300/[0.07] disabled:opacity-50 disabled:hover:border-white/10 disabled:hover:bg-white/[0.04]"
              >
                {focus.kind === 'video' ? <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" /> : <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />}
                <span className="min-w-0">
                  <span className="block text-sm leading-snug text-white">{focus.title}</span>
                  <span className="block text-xs text-white/50">{focus.kind === 'video' ? 'Video' : 'Reading'} · {levelLabel(focus.difficulty)}</span>
                </span>
              </button>
            ))}
          </div>
          {far && <p className="mt-1.5 text-xs text-white/50">The class stays in {originCity}: flight hour, stars and the lesson&apos;s clue, but no stamp.</p>}
        </>
      )}
      {onVote && !locked && (
        <button type="button" onClick={onVote} className="mt-2 rounded-lg border border-amber-300/40 px-2 py-0.5 text-xs text-amber-200 hover:bg-amber-300/10">
          Let the class vote (with reasons)
        </button>
      )}
    </div>
  );
}
