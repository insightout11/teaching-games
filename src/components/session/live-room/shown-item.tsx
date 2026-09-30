'use client';

import { DeckMap } from '@/components/live-room/flight/deck-map';
import { useEffect, useState } from 'react';
import { ExternalLink, Layers, MapPin } from 'lucide-react';
import type { RoomItem } from '@/stores/live-room-store';
import { hostOf } from '@/components/session/live-room/sources-drawer';

/**
 * A shown place always opens on our own map (never an outside tab). Search
 * results without coordinates get looked up from their name + address.
 */
function ShownPlace({ item }: { item: RoomItem }) {
  const given = item.coordinates ? { lat: item.coordinates.latitude, lng: item.coordinates.longitude } : null;
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(given);
  const [looking, setLooking] = useState(!given);
  const [detailed, setDetailed] = useState(true);

  useEffect(() => {
    if (given) return;
    let cancelled = false;
    const q = [item.title, item.address].filter(Boolean).join(', ');
    fetch(`/api/live-room/geocode?q=${encodeURIComponent(q)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setPoint(d?.point ?? null); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLooking(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-display text-3xl text-white">
            <MapPin className="h-7 w-7 shrink-0 text-rose-300" aria-hidden />
            {item.title}
          </p>
          {item.address && <p className="mt-1 text-lg text-white/75">{item.address}</p>}
        </div>
        {point && (
          <button
            type="button"
            onClick={() => setDetailed((v) => !v)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            <Layers className="h-4 w-4" aria-hidden /> {detailed ? 'Simple map' : 'Detailed map'}
          </button>
        )}
      </div>
      {point ? (
        <DeckMap
          className="h-[48vh] min-h-[260px] w-full rounded-2xl border border-white/15"
          pins={[{ id: item.id, lat: point.lat, lng: point.lng, label: item.title }]}
          focusZoom={detailed ? 11 : 5}
          detailed={detailed}
        />
      ) : (
        <p className="text-sm text-white/55">{looking ? 'Finding it on the map…' : 'Couldn’t place this one on the map.'}</p>
      )}
    </div>
  );
}

/** What the class sees on the stage for a shown source. Always attributed. */
export function ShownItem({ item }: { item: RoomItem }) {
  const source = (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-white"
    >
      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      {item.publisher ?? hostOf(item.url)}
    </a>
  );

  if (item.kind === 'image' && item.imageUrl) {
    return (
      <figure className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex min-h-[260px] flex-1 items-center justify-center overflow-hidden rounded-xl bg-black/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt={item.title} referrerPolicy="no-referrer" className="max-h-[52vh] w-auto max-w-full object-contain" />
        </div>
        <figcaption className="flex items-center justify-between gap-3 text-sm text-white/80">
          <span className="line-clamp-1">{item.title}</span>
          {source}
        </figcaption>
      </figure>
    );
  }

  if (item.kind === 'video' && item.videoId) {
    return (
      <div className="flex flex-col gap-2">
        <div className="aspect-video w-full max-w-4xl overflow-hidden rounded-xl bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${item.videoId}?rel=0&modestbranding=1`}
            title={item.title}
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
        <div className="flex items-center justify-between gap-3 text-sm text-white/80">
          <span className="line-clamp-1">{item.title}</span>
          {source}
        </div>
      </div>
    );
  }

  if (item.kind === 'place') return <ShownPlace item={item} />;

  // Article / web / news
  return (
    <article className="flex min-h-0 flex-col gap-3">
      <div className="flex items-start gap-4">
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" referrerPolicy="no-referrer" className="hidden h-24 w-36 shrink-0 rounded-lg object-cover sm:block" />
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-display text-3xl leading-tight text-white" style={{ textWrap: 'balance' }}>{item.title}</h2>
          {source}
        </div>
      </div>
      {item.text ? (
        <div className="max-h-[42vh] overflow-y-auto whitespace-pre-line pr-2 text-lg leading-relaxed text-white/85">{item.text}</div>
      ) : (
        item.description && <p className="max-w-3xl text-lg leading-relaxed text-white/80">{item.description}</p>
      )}
    </article>
  );
}
