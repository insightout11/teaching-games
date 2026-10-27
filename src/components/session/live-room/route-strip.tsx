'use client';

import { Plane, PlaneLanding, PlaneTakeoff } from 'lucide-react';

export interface RouteMarker { id: string; label: string; /** minutes before landing */ at: number; done: boolean; onStart: () => void }

/**
 * The middle of the instrument panel (Oct 2026): take-off, the plane on the route, landing, and a few closing markers.
 * The markers are reminders: they glow when their time comes and start on a tap; nothing starts by itself. Shown on
 * the shared screen, so it holds nothing private.
 */
export function RouteStrip({ stage, origin, destination, routeT, minutesLeft, holding, landLabel, endsLabel, onNudge, markers }: {
  stage: 'gate' | 'flying' | 'landing' | 'landed' | string;
  origin: string;
  destination: string;
  routeT: number;
  minutesLeft: number | null;
  holding: boolean;
  landLabel: string | null;
  endsLabel: string;
  onNudge: (delta: number) => void;
  markers: RouteMarker[];
}) {
  const flying = stage === 'flying';
  const t = flying ? Math.min(1, Math.max(0, routeT)) : stage === 'gate' ? 0 : 1;
  // a marker's place on the line: minutes before landing, scaled by the time the whole flight takes
  const total = flying && minutesLeft != null && t < 1 ? minutesLeft / Math.max(0.02, 1 - t) : null;
  const placeOf = (at: number) => (total ? Math.min(0.97, Math.max(0.03, 1 - at / total)) : null);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] uppercase tracking-[0.12em] text-white/55"><PlaneTakeoff className="h-3.5 w-3.5" />{origin}</span>
      <div className="relative h-8 min-w-0 flex-1">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-white/25" />
        <div className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-sky-300/70" style={{ width: `${t * 100}%` }} />
        {markers.map((m) => {
          const at = placeOf(m.at);
          if (at == null) return null;
          const due = minutesLeft != null && minutesLeft <= m.at && !m.done;
          return (
            <button key={m.id} type="button" onClick={m.onStart} disabled={m.done} title={m.done ? `${m.label}: done` : `${m.label} (about ${m.at} min before landing)`}
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold transition ${m.done ? 'border-white/15 text-white/35 line-through' : due ? 'animate-pulse border-amber-300 bg-amber-300/20 text-amber-100 shadow-[0_0_14px_rgba(252,211,77,.45)]' : 'border-white/25 bg-[#0b111d] text-white/70 hover:border-amber-300/60'}`}
              style={{ left: `${at * 100}%` }}>
              {m.label}
            </button>
          );
        })}
        <Plane className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 text-sky-200" style={{ left: `${t * 100}%` }} aria-label="Our plane" />
      </div>
      <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] uppercase tracking-[0.12em] text-white/80"><PlaneLanding className="h-3.5 w-3.5" />{destination}</span>
      <span className="shrink-0 font-mono text-[11px] text-white/55">
        {holding ? 'Circling' : flying && minutesLeft != null ? `${Math.max(0, Math.ceil(minutesLeft))} min${landLabel ? ` · lands ${landLabel}` : ''}` : stage === 'gate' ? 'At the gate' : 'Landed'}
      </span>
      <span className="flex shrink-0 items-center gap-1 border-l border-white/10 pl-3 font-mono text-[11px] text-white/55">
        Class ends {endsLabel}
        <button type="button" onClick={() => onNudge(-5)} aria-label="Class ends 5 minutes earlier" className="rounded border border-white/15 px-1 hover:text-white">−5</button>
        <button type="button" onClick={() => onNudge(5)} aria-label="Class ends 5 minutes later" className="rounded border border-white/15 px-1 hover:text-white">+5</button>
      </span>
    </div>
  );
}
