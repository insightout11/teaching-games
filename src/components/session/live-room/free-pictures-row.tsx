'use client';

import { useEffect, useState } from 'react';
import { ImageIcon, Search, SkipForward, Star } from 'lucide-react';
import type { RoomItem } from '@/stores/live-room-store';
import type { FreePicture } from '@/lib/sources/wikimedia-images';

const QUEUE_MAX = 4;

/**
 * Private window: free Wikimedia pictures for the class's current topic. Click one to show it on the big screen
 * (nothing shows by itself). Star up to 4 to step through while students talk. Google Images is one button away.
 */
export function FreePicturesRow({ sessionId, topic, onShow, onGoogle }: {
  sessionId: string;
  topic: string | null;
  onShow: (item: RoomItem) => void;
  /** Search Google Images (paid) for the topic, in the search below. */
  onGoogle: (query: string) => void;
}) {
  const [pictures, setPictures] = useState<FreePicture[] | null>(null);
  const [queue, setQueue] = useState<FreePicture[]>([]);
  const [next, setNext] = useState(0);

  useEffect(() => {
    setPictures(null);
    setQueue([]);
    setNext(0);
    if (!topic) return;
    let live = true;
    fetch(`/api/sessions/${encodeURIComponent(sessionId)}/sources/free-pictures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: topic }),
    })
      .then((r) => (r.ok ? r.json() : { pictures: [] }))
      .then((d: { pictures?: FreePicture[] }) => { if (live) setPictures(d.pictures ?? []); })
      .catch(() => { if (live) setPictures([]); });
    return () => { live = false; };
  }, [sessionId, topic]);

  const toItem = (p: FreePicture): RoomItem => ({
    id: `wm-${p.id}`, kind: 'image', title: p.title, url: p.pageUrl, publisher: `Wikimedia Commons · ${p.credit}`, imageUrl: p.imageUrl, thumbnailUrl: p.thumbUrl,
  });
  const show = (p: FreePicture) => onShow(toItem(p));
  const toggleQueue = (p: FreePicture) => setQueue((q) => (q.some((x) => x.id === p.id) ? q.filter((x) => x.id !== p.id) : q.length >= QUEUE_MAX ? q : [...q, p]));
  const showNext = () => {
    if (!queue.length) return;
    show(queue[next % queue.length]);
    setNext((n) => n + 1);
  };

  if (!topic) return null;
  return (
    <section className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-white/70">
          <ImageIcon className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
          <span className="truncate">Free pictures: <b className="font-semibold text-white">{topic}</b></span>
        </p>
        {queue.length > 0 && (
          <button type="button" onClick={showNext} className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-300 px-2 py-1 text-[11px] font-semibold text-[#1a1204]" title="Show the next starred picture on the big screen">
            <SkipForward className="h-3 w-3" /> Show next ({(next % queue.length) + 1}/{queue.length})
          </button>
        )}
      </div>
      {pictures === null ? (
        <p className="text-xs text-white/45">Finding pictures…</p>
      ) : pictures.length === 0 ? (
        <p className="text-xs text-white/45">No free pictures for this one. Try Google Images below.</p>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {pictures.map((p) => {
            const starred = queue.some((x) => x.id === p.id);
            return (
              <figure key={p.id} className="group relative overflow-hidden rounded-lg border border-white/10 bg-black/30">
                <button type="button" onClick={() => show(p)} title={`Show on the big screen: ${p.title}`} className="block w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumbUrl} alt={p.title} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleQueue(p)}
                  aria-label={starred ? 'Remove from the queue' : 'Add to the queue'}
                  title={starred ? 'In the queue' : queue.length >= QUEUE_MAX ? `The queue holds ${QUEUE_MAX}` : 'Add to the queue'}
                  className={`absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full ${starred ? 'bg-amber-300 text-[#1a1204]' : 'bg-black/60 text-white/80 opacity-0 group-hover:opacity-100'}`}
                >
                  <Star className="h-3 w-3" fill={starred ? 'currentColor' : 'none'} />
                </button>
                <figcaption className="truncate px-1 py-0.5 text-[9px] text-white/45" title={p.credit}>{p.credit}</figcaption>
              </figure>
            );
          })}
        </div>
      )}
      <button type="button" onClick={() => onGoogle(topic)} className="flex items-center gap-1 text-[11px] text-cyan-200/80 hover:text-cyan-100">
        <Search className="h-3 w-3" /> More from Google Images
      </button>
    </section>
  );
}
