'use client';

import { DeckMap } from '@/components/live-room/flight/deck-map';
import { ExternalLink, MapPin } from 'lucide-react';
import type { RoomItem } from '@/stores/live-room-store';
import { hostOf } from '@/components/session/live-room/sources-drawer';

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

  if (item.kind === 'place') {
    const c = item.coordinates;
    const mapUrl = c
      ? `https://www.openstreetmap.org/?mlat=${c.latitude}&mlon=${c.longitude}#map=13/${c.latitude}/${c.longitude}`
      : item.url;
    return (
      <div className="flex flex-col gap-3">
        <p className="flex items-center gap-2 font-display text-3xl text-white">
          <MapPin className="h-7 w-7 text-rose-300" aria-hidden />
          {item.title}
        </p>
        {item.address && <p className="text-lg text-white/75">{item.address}</p>}
        {c && (
          <DeckMap
            className="h-[48vh] min-h-[260px] w-full rounded-2xl border border-white/15"
            pins={[{ id: item.id, lat: c.latitude, lng: c.longitude, label: item.title }]}
            focusZoom={11}
          />
        )}
        <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-max items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10">
          <ExternalLink className="h-4 w-4" aria-hidden /> Open map
        </a>
      </div>
    );
  }

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
