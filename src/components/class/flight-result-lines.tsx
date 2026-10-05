import { TrendingUp } from 'lucide-react';
import { flightResultLine, formatMeasure, type FlightResult } from '@/lib/flight-result';

/**
 * Flight results in the logbook: one line per lesson, led by the main measure, the rest on
 * expand. Teacher-only surfaces (class page, end summary); never the public share page.
 */
export function FlightResultLines({ results, title = 'Before → after' }: { results: FlightResult[]; title?: string }) {
  if (results.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-lc-text3">
        <TrendingUp className="h-3 w-3" aria-hidden />{title}
      </p>
      {results.map((r) => (
        <details key={`${r.savedAt}-${r.flight}`} className="group rounded-lg border border-lc-border bg-lc-surface px-2.5 py-1.5">
          <summary className="cursor-pointer list-none text-[12px] text-lc-text2 group-open:text-lc-text">{flightResultLine(r)}</summary>
          <ul className="mt-1.5 space-y-0.5 text-[11px] text-lc-text3">
            {r.focus && <li className="italic">{r.focus}</li>}
            {r.measures.map((m) => <li key={m.label}>{m.label}: <span className="font-semibold text-lc-text2">{formatMeasure(m)}</span></li>)}
            {r.phrases && r.phrases.length > 0 && <li>Phrases: {r.phrases.join(' · ')}</li>}
          </ul>
        </details>
      ))}
    </div>
  );
}
