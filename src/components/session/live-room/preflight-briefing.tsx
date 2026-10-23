'use client';

import { Plane, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { FlightPrediction } from '@/lib/live-room/flight-prediction';
import type { SceneryState } from '@/components/live-room/flight/scenery-status';

/**
 * The pre-flight briefing (Oct 2026): between the where-next vote and take-off. The captain's welcome, the flight in
 * numbers and one prediction on the phones, while the route's scenery prepares. The teacher takes off when ready.
 */
export function PreflightBriefing({ joinUrl, city, km, minutes, prediction, tallies, totalVotes, scenery, onTakeOff, onCancel }: {
  joinUrl: string;
  city: string;
  km: number;
  minutes: number;
  prediction: FlightPrediction | null;
  /** Votes per option. */
  tallies: Record<string, number>;
  totalVotes: number;
  scenery: SceneryState | null;
  onTakeOff: () => void;
  onCancel: () => void;
}) {
  const ready = scenery !== 'loading';
  const most = Math.max(1, ...Object.values(tallies));
  return (
    <div className="flex max-h-full w-full max-w-4xl flex-col gap-4 overflow-y-auto rounded-3xl border border-white/15 bg-slate-950/70 p-6 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Pre-flight briefing</p>
          <p className="mt-1 font-display text-2xl leading-snug text-white">
            “This is your captain speaking. We’re flying to {city} today: {km.toLocaleString('en-US')} km, about {minutes} minutes. Please fasten your seat belts.”
          </p>
        </div>
        <button type="button" onClick={onCancel} aria-label="Back to the vote" title="Back to the vote" className="p-1 text-white/45 hover:text-white"><X className="h-4 w-4" /></button>
      </div>

      {prediction && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">Predict on your phone · we’ll find out during the flight</p>
            <span className="flex items-center gap-2 font-mono text-xs text-white/60">
              {totalVotes} answer{totalVotes === 1 ? '' : 's'}
              <span className="rounded-lg bg-white p-1"><QRCodeSVG value={joinUrl} size={36} level="M" /></span>
            </span>
          </div>
          <p className="mt-2 font-display text-3xl leading-tight text-white">{prediction.question}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {prediction.options.map((option) => (
              <div key={option} className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3">
                <div className="absolute inset-y-0 left-0 bg-amber-300/15 transition-[width] duration-500" style={{ width: `${((tallies[option] ?? 0) / most) * 100}%` }} aria-hidden />
                <span className="relative flex items-center justify-between gap-2 text-lg text-white">
                  {option}
                  <span className="font-mono text-sm text-white/55">{tallies[option] ?? 0}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <p role="status" aria-live="polite" className="text-sm text-white/60">
          {scenery === 'loading' ? 'Preparing the scenery for our route…' : scenery === 'basic' ? 'Basic scenery today' : 'Scenery ready'}
        </p>
        <button
          type="button"
          onClick={onTakeOff}
          className={`flex items-center gap-2 rounded-2xl px-6 py-3 font-display text-lg text-[#1a1204] ${ready ? 'bg-gradient-to-r from-amber-300 to-orange-400 shadow-[0_10px_30px_rgba(255,160,60,.35)]' : 'bg-white/70'}`}
        >
          <Plane className="h-5 w-5" /> {ready ? 'Ready for take-off' : 'Take off now'}
        </button>
      </div>
    </div>
  );
}
