'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Images, X } from 'lucide-react';
import { WindowSelfieCard } from '@/components/live-room/flight/window-selfie';
import { CrewAvatar } from '@/components/ui/crew-avatar';
import { CREW_EXPRESSIONS, type CrewExpression } from '@/components/ui/crew-character';
import { MascotFigure } from '@/components/ui/mascot-figure';
import { parseMascotLook, type MascotLook } from '@/lib/mascot';
import { countryItemFor } from '@/data/world-flight/country-items';
import type { Accessory } from '@/lib/accessories';
import { keepSelfie, keptSelfies, openWindowViewChannel, WINDOW_VIEW_STALE_MS, type KeptSelfie, type WindowView } from '@/lib/live-room/window-view';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const titleOf = (v: WindowView) => `Over ${v.name}`;
const captionOf = (v: KeptSelfie) => [v.from && v.to ? `${v.from} to ${v.to}` : '', new Date(v.takenAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), v.seat ? `seat ${v.seat}` : ''].filter(Boolean).join(' · ');

/** On the phone: "Take my window selfie" while the room says a landmark is in view; kept selfies on the boarding pass. */
export function WindowSelfiePhone({ sessionId, name, seed, seat, mascot, classShelf = [], accessory = null }: { sessionId: string; name: string; seed: string | null; seat: string | null; mascot?: { name: string; look: MascotLook } | null; classShelf?: string[]; accessory?: Pick<Accessory, 'type' | 'colors'> | null }) {
  const [view, setView] = useState<WindowView | null>(null);
  const seenAt = useRef(0);
  const [open, setOpen] = useState<KeptSelfie | null>(null);
  const [mine, setMine] = useState<KeptSelfie[]>([]);
  const [shelf, setShelf] = useState(false);
  // Pick a face before the snap (pilot 001: students wanted more say in their selfie)
  const [face, setFace] = useState<CrewExpression>('smile');
  // Bring the class mascot into the selfie (on by default when the class has one)
  const [withMascot, setWithMascot] = useState(true);
  // Hold up a souvenir from the class shelf (a country the class talked about)
  const [item, setItem] = useState<string | null>(null);
  const shelfItems = classShelf.flatMap((c) => { const it = countryItemFor(c); return it ? [it] : []; });
  useEffect(() => { setMine(keptSelfies().filter((s) => s.sessionId === sessionId)); }, [sessionId]);
  useEffect(() => {
    const ch = openWindowViewChannel(sessionId, (v) => { seenAt.current = Date.now(); setView(v); });
    const stale = setInterval(() => { if (Date.now() - seenAt.current > WINDOW_VIEW_STALE_MS) setView(null); }, 3000);
    return () => { clearInterval(stale); ch.close(); };
  }, [sessionId]);

  const take = () => {
    if (!view) return;
    const s: KeptSelfie = { ...view, sessionId, seat, takenAt: Date.now(), expression: face, mascot: mascot && withMascot ? mascot : null, item, accessory: accessory ?? null };
    setMine(keepSelfie(s).filter((x) => x.sessionId === sessionId));
    setOpen(s);
  };
  const already = view ? mine.some((s) => s.landmarkId === view.landmarkId) : false;

  return (
    <>
      {view && !already && (
        <div className="mb-2 flex items-center justify-center gap-1.5" role="radiogroup" aria-label="Your face in the selfie">
          {CREW_EXPRESSIONS.map((e) => (
            <button key={e} type="button" role="radio" aria-checked={face === e} aria-label={e} onClick={() => setFace(e)} className={`rounded-full p-0.5 ${face === e ? 'bg-amber-300' : 'bg-white/10'}`}>
              <CrewAvatar seed={seed ?? name} name={name} size={40} expression={e} accessory={accessory} />
            </button>
          ))}
        </div>
      )}
      {view && !already && shelfItems.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center justify-center gap-1.5" role="radiogroup" aria-label="Hold up a souvenir">
          <span className="text-xs text-white/60">Hold up:</span>
          <button type="button" role="radio" aria-checked={item === null} onClick={() => setItem(null)} className={`rounded-full px-2 py-1 text-xs ${item === null ? 'bg-amber-300 text-slate-950' : 'bg-white/10 text-white/70'}`}>Nothing</button>
          {shelfItems.map((it) => (
            <button key={it.country} type="button" role="radio" aria-checked={item === it.country} aria-label={it.item} title={`${it.item} (${it.country})`} onClick={() => setItem(it.country)} className={`rounded-lg p-0.5 ${item === it.country ? 'bg-amber-300' : 'bg-white/10'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/stickers/${it.sticker ?? 'present'}.webp`} alt="" className="h-8 w-8" />
            </button>
          ))}
        </div>
      )}
      {view && !already && mascot && (
        <button type="button" onClick={() => setWithMascot((v) => !v)} aria-pressed={withMascot} className={`mb-2 flex w-full items-center justify-center gap-2 rounded-full border px-3 py-1 text-sm ${withMascot ? 'border-fuchsia-300/60 bg-fuchsia-300/15 text-fuchsia-100' : 'border-white/15 text-white/60'}`}>
          <MascotFigure look={mascot.look} size={28} /> {withMascot ? `${mascot.name} is in the photo` : `Add ${mascot.name} to the photo`}
        </button>
      )}
      {view && !already && (
        <button type="button" onClick={take} className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-300 px-4 py-3 text-base font-bold text-[#1b2233] shadow-lg">
          <Camera className="h-5 w-5" /> Take my window selfie: {cap(view.name)}
        </button>
      )}
      {mine.length > 0 && (
        <button type="button" onClick={() => setShelf(true)} className="mb-3 flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80">
          <Images className="h-3.5 w-3.5" /> My window selfies · {mine.length}
        </button>
      )}
      {(open || shelf) && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 overflow-y-auto bg-slate-950/90 p-4 backdrop-blur">
          <button type="button" onClick={() => { setOpen(null); setShelf(false); }} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"><X className="h-5 w-5" /></button>
          {(open ? [open] : mine).map((s) => (
            <WindowSelfieCard key={s.landmarkId + s.takenAt} kind={s.kind} landmarkId={s.landmarkId} terrain={s.terrain} region={s.region} timeOfDay={s.timeOfDay} seed={seed} name={name} title={titleOf(s)} caption={captionOf(s)} expression={CREW_EXPRESSIONS.includes(s.expression as CrewExpression) ? s.expression as CrewExpression : undefined} mascot={s.mascot ? (() => { const look = parseMascotLook(s.mascot.look); return look ? { name: s.mascot.name, look } : null; })() : null} item={s.item ?? null} accessory={s.accessory ?? null} />
          ))}
          {open && <p className="text-center text-sm text-white/70">Kept on your boarding pass.</p>}
        </div>
      )}
    </>
  );
}
