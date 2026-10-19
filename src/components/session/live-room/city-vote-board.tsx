'use client';

import { useEffect, useState } from 'react';
import { Compass, Gift, MessageSquareQuote, Plane, Route, Stamp, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { FreePicture } from '@/lib/sources/wikimedia-images';

export interface VoteCityCard {
  id: string;
  city: string;
  /** What the flight passes on the way (countries, seas, landmarks). */
  onTheWay: string[];
  newStamp: boolean;
  /** A souvenir still to find there (its name), and whether it is rare. */
  souvenir: string | null;
  souvenirRare: boolean;
  /** "Stop 3 of 5 on your expedition", "Gets you closer to Tokyo". */
  strategy: string | null;
}

// One picture per city, fetched once per page (free Wikimedia pictures).
const pictureCache = new Map<string, Promise<string | null>>();
function cityPicture(sessionId: string, city: string): Promise<string | null> {
  const hit = pictureCache.get(city);
  if (hit) return hit;
  const p = fetch(`/api/sessions/${encodeURIComponent(sessionId)}/sources/free-pictures`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: city }),
  })
    .then((r) => (r.ok ? r.json() : { pictures: [] }))
    .then((d: { pictures?: FreePicture[] }) => d.pictures?.[0]?.thumbUrl ?? null)
    .catch(() => null);
  pictureCache.set(city, p);
  return p;
}

function CityPicture({ sessionId, city }: { sessionId: string; city: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => { let live = true; void cityPicture(sessionId, city).then((s) => { if (live) setSrc(s); }); return () => { live = false; }; }, [sessionId, city]);
  return src
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={src} alt="" className="h-24 w-full object-cover" />
    : <div className="h-24 w-full bg-gradient-to-br from-sky-900/60 to-slate-900" />;
}

/**
 * The where-next vote at the start of the lesson, on the big screen while students board. Results stay hidden
 * until the teacher closes the vote; then the winner, the counts and the students' reasons appear, and take-off
 * goes there. Every flight lasts the class, so no flight time is shown.
 */
export function CityVoteBoard({ sessionId, joinUrl, cards, totalVotes, revealed, tallies, reasons, onReveal, onTakeOff, onCancel }: {
  sessionId: string;
  joinUrl: string;
  cards: VoteCityCard[];
  totalVotes: number;
  revealed: boolean;
  /** Votes per city name. */
  tallies: Record<string, number>;
  reasons: Array<{ name: string; choice: string; reason: string }>;
  onReveal: () => void;
  onTakeOff: (cityId: string) => void;
  onCancel: () => void;
}) {
  const ranked = [...cards].sort((a, b) => (tallies[b.city] ?? 0) - (tallies[a.city] ?? 0));
  const winner = revealed && totalVotes > 0 ? ranked[0] : null;
  const shown = revealed ? ranked : cards;
  return (
    <div className="flex max-h-full w-full max-w-6xl flex-col gap-3 overflow-y-auto rounded-3xl border border-white/15 bg-slate-950/70 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-white p-1.5"><QRCodeSVG value={joinUrl} size={64} level="M" /></span>
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Now boarding · where should we fly?</p>
            <p className="font-display text-3xl leading-tight text-white">{winner ? `We're flying to ${winner.city}!` : 'Vote on your phone, and say why'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!revealed && <span className="font-mono text-sm text-white/70">{totalVotes} vote{totalVotes === 1 ? '' : 's'} in</span>}
          {!revealed && <button type="button" onClick={onReveal} className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-[#1a1204]">Close the vote</button>}
          {winner && (
            <button type="button" onClick={() => onTakeOff(winner.id)} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-300 to-orange-300 px-5 py-2 text-sm font-semibold text-[#1a1204]">
              <Plane className="h-4 w-4" /> Take off to {winner.city}
            </button>
          )}
          <button type="button" onClick={onCancel} aria-label="Stop the vote" title="Stop the vote" className="p-1 text-white/45 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {shown.map((c) => {
          const n = tallies[c.city] ?? 0;
          const isWinner = winner?.id === c.id;
          const why = revealed ? reasons.filter((r) => r.choice === c.city).slice(0, 2) : [];
          return (
            <div
              key={c.id}
              role={revealed ? 'button' : undefined}
              tabIndex={revealed ? 0 : undefined}
              onClick={revealed ? () => onTakeOff(c.id) : undefined}
              title={revealed ? `Take off to ${c.city}` : undefined}
              className={`overflow-hidden rounded-2xl border bg-slate-900/80 ${revealed ? 'cursor-pointer hover:border-amber-300/60' : ''} ${isWinner ? 'border-amber-300 shadow-[0_0_24px_rgba(252,211,77,0.45)]' : 'border-white/10'}`}
            >
              <CityPicture sessionId={sessionId} city={c.city} />
              <div className="space-y-1 p-3 text-[13px] text-white/80">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-lg leading-tight text-white">{c.city}</p>
                  <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${c.newStamp ? 'bg-emerald-300/20 text-emerald-200' : 'bg-white/10 text-white/60'}`}>
                    <Stamp className="h-3 w-3" />{c.newStamp ? 'New stamp' : 'Been here'}
                  </span>
                </div>
                {c.onTheWay.length > 0 && <p className="flex gap-1.5"><Route className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" />On the way: {c.onTheWay.join(', ')}</p>}
                {c.souvenir && <p className="flex gap-1.5"><Gift className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />Souvenir: {c.souvenir}{c.souvenirRare ? ' (rare)' : ''}</p>}
                {c.strategy && <p className="flex gap-1.5 text-emerald-200"><Compass className="mt-0.5 h-3.5 w-3.5 shrink-0" />{c.strategy}</p>}
                {revealed && (
                  <p className="pt-1 font-mono text-sm font-semibold text-amber-200">{n} vote{n === 1 ? '' : 's'}</p>
                )}
                {why.map((r) => (
                  <p key={r.name + r.reason} className="flex gap-1.5 text-xs text-white/85"><MessageSquareQuote className="mt-0.5 h-3 w-3 shrink-0 text-amber-300" /><span><b className="font-semibold text-white">{r.name}:</b> {r.reason}</span></p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {revealed && reasons.length > 0 && <p className="text-center text-sm text-white/60">Ask two or three students to explain their choice.</p>}
      {revealed && <p className="text-center text-xs text-white/45">{totalVotes === 0 ? 'No votes this time: click a city to take off there.' : 'Or click any city to fly there instead.'}</p>}
    </div>
  );
}
