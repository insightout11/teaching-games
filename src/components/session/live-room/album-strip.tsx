'use client';

import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';

interface StripData { photos: Array<{ id: string; name: string; rare: boolean; url: string | null }>; toFind: Array<{ id: string; name: string; hint: string }> }

/** The lobby's album strip: the class's newest landmark photos while it boards, and one still to find. */
export function AlbumStrip({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<StripData | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/session/${encodeURIComponent(sessionId)}/album`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: StripData | null) => { if (live && d) setData(d); })
      .catch(() => {});
    return () => { live = false; };
  }, [sessionId]);
  if (!data || (data.photos.length === 0 && data.toFind.length === 0)) return null;
  const shown = data.photos.filter((p) => p.url).slice(0, 4);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-white/55"><Camera className="h-3.5 w-3.5" /> Our album</span>
      {shown.map((p, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={p.id} src={p.url!} alt={p.name} title={p.name} className="h-9 w-14 rounded-[2px] border-2 border-white object-cover shadow" style={{ transform: `rotate(${[-3, 2, -1, 3][i % 4]}deg)` }} />
      ))}
      {data.toFind[0] && <span className="text-xs text-white/60">Still to find: <span className="capitalize text-white/80">{data.toFind[0].name}</span></span>}
    </div>
  );
}
