'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Images, X } from 'lucide-react';
import { WindowSelfieCard } from '@/components/live-room/flight/window-selfie';
import { keepSelfie, keptSelfies, openWindowViewChannel, WINDOW_VIEW_STALE_MS, type KeptSelfie, type WindowView } from '@/lib/live-room/window-view';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const titleOf = (v: WindowView) => `Over ${v.name}`;
const captionOf = (v: KeptSelfie) => [v.from && v.to ? `${v.from} to ${v.to}` : '', new Date(v.takenAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), v.seat ? `seat ${v.seat}` : ''].filter(Boolean).join(' · ');

/** On the phone: "Take my window selfie" while the room says a landmark is in view; kept selfies on the boarding pass. */
export function WindowSelfiePhone({ sessionId, name, seed, seat }: { sessionId: string; name: string; seed: string | null; seat: string | null }) {
  const [view, setView] = useState<WindowView | null>(null);
  const seenAt = useRef(0);
  const [open, setOpen] = useState<KeptSelfie | null>(null);
  const [mine, setMine] = useState<KeptSelfie[]>([]);
  const [shelf, setShelf] = useState(false);
  useEffect(() => { setMine(keptSelfies().filter((s) => s.sessionId === sessionId)); }, [sessionId]);
  useEffect(() => {
    const ch = openWindowViewChannel(sessionId, (v) => { seenAt.current = Date.now(); setView(v); });
    const stale = setInterval(() => { if (Date.now() - seenAt.current > WINDOW_VIEW_STALE_MS) setView(null); }, 3000);
    return () => { clearInterval(stale); ch.close(); };
  }, [sessionId]);

  const take = () => {
    if (!view) return;
    const s: KeptSelfie = { ...view, sessionId, seat, takenAt: Date.now() };
    setMine(keepSelfie(s).filter((x) => x.sessionId === sessionId));
    setOpen(s);
  };
  const already = view ? mine.some((s) => s.landmarkId === view.landmarkId) : false;

  return (
    <>
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
            <WindowSelfieCard key={s.landmarkId + s.takenAt} kind={s.kind} landmarkId={s.landmarkId} terrain={s.terrain} region={s.region} timeOfDay={s.timeOfDay} seed={seed} name={name} title={titleOf(s)} caption={captionOf(s)} />
          ))}
          {open && <p className="text-center text-sm text-white/70">Kept on your boarding pass.</p>}
        </div>
      )}
    </>
  );
}
