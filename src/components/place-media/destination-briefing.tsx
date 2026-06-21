import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coins,
  Compass,
  Globe2,
  Info,
  Languages,
  MapPin,
  Maximize2,
  Sparkles,
  Utensils,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  getDestinationFacts,
  getLanguageHintForCountry,
  type DestinationFactSource,
} from '@/lib/destination-facts';
import type { DestinationPack } from '@/lib/world-flight/types';
import {
  getMediaForUsage,
  getPlaceMediaRecordByDestination,
  type PlaceMediaAsset,
} from '@/lib/place-media';
import { ImageFocusModal } from './image-focus-modal';

function toTitle(value: string) {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function readableLandmark(value?: string) {
  return value ? toTitle(value) : null;
}

function providerForSourceName(sourceName: string) {
  if (sourceName.toLowerCase().includes('wikimedia')) return 'wikimedia';
  if (sourceName.toLowerCase().includes('unsplash')) return 'unsplash';
  return 'external';
}

function imageFromDestinationImage(
  destination: DestinationPack,
  image: DestinationPack['heroImage'],
  id: string,
  title: string,
  kind: PlaceMediaAsset['kind'] = 'cityscape',
): PlaceMediaAsset {
  return {
    id,
    kind,
    title,
    provider: providerForSourceName(image.sourceName),
    usage: ['lesson-intro'],
    difficulty: 'medium',
    url: image.url,
    alt: image.alt,
    caption: image.caption,
    sourceName: image.sourceName,
    sourceUrl: image.sourceUrl,
    creator: image.creator,
    license: image.license,
    focalPoint: image.focalPoint,
  };
}

function imageFromHero(destination: DestinationPack): PlaceMediaAsset {
  return imageFromDestinationImage(
    destination,
    destination.heroImage,
    `${destination.id}-briefing-hero`,
    `${destination.city} arrival view`,
    destination.scene.landmarkSilhouette ? 'cityscape' : 'landscape',
  );
}

function dedupeMedia(media: PlaceMediaAsset[]) {
  const seen = new Set<string>();
  return media.filter((asset) => {
    const imageUrl = asset.url ?? asset.thumbnailUrl;
    if (!imageUrl || seen.has(imageUrl)) return false;
    seen.add(imageUrl);
    return true;
  });
}

export function getBriefingMedia(destination: DestinationPack) {
  const place = getPlaceMediaRecordByDestination(destination.id);
  const focusMedia = destination.focusOptions
    .filter((focus) => focus.kind === 'reading')
    .map((focus) => imageFromDestinationImage(
      destination,
      focus.image,
      `${destination.id}-${focus.id}-briefing`,
      focus.title.includes(' - ') ? focus.title.split(' - ').slice(1).join(' - ') : focus.title,
      'landmark',
    ));
  if (!place) return dedupeMedia([imageFromHero(destination), ...focusMedia]).slice(0, 6);

  return dedupeMedia([
    imageFromHero(destination),
    ...getMediaForUsage(place, 'lesson-intro'),
    ...focusMedia,
    ...getMediaForUsage(place, 'background'),
    ...getMediaForUsage(place, 'reveal'),
  ]).slice(0, 6);
}

function getKnownFor(destination: DestinationPack) {
  return [
    readableLandmark(destination.scene.landmarkSilhouette),
    `${toTitle(destination.scene.terrain)} setting`,
    `${toTitle(destination.scene.skyline)} skyline`,
    `${destination.region} route context`,
  ].filter((item): item is string => Boolean(item));
}

export function DestinationBriefing({
  destination,
  className = '',
  onClose,
  continueLabel = 'Continue to lesson',
}: {
  destination: DestinationPack;
  className?: string;
  onClose?: () => void;
  continueLabel?: string;
}) {
  const media = useMemo(() => getBriefingMedia(destination), [destination]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isImageFocusOpen, setIsImageFocusOpen] = useState(false);
  const factSheet = getDestinationFacts(destination.id);
  const languageHint = factSheet?.language ?? getLanguageHintForCountry(destination.country);
  const knownFor = factSheet?.knownFor?.length ? factSheet.knownFor : getKnownFor(destination);
  const foodCulture = factSheet?.foodCulture ?? [];
  const prompt = factSheet?.prompt ?? `What do the images suggest about daily life in ${destination.city}?`;
  const profile = [
    `${toTitle(destination.scene.terrain)} setting`,
    `${toTitle(destination.scene.skyline)} skyline`,
    readableLandmark(destination.scene.landmarkSilhouette),
  ].filter(Boolean).join(' - ');

  const facts: Array<{
    label: string;
    value: string;
    icon: LucideIcon;
    detail?: string;
    source?: DestinationFactSource;
  }> = [
    { label: 'Country', value: destination.country, icon: Globe2 },
    { label: 'Region', value: destination.region, icon: Compass },
    ...(factSheet?.population ? [{
      label: 'Population',
      value: factSheet.population.value,
      icon: Users,
      detail: `${factSheet.population.label} - ${factSheet.population.year}`,
      source: factSheet.population,
    }] : []),
    { label: 'Language', value: languageHint, icon: Languages },
    ...(factSheet?.currency ? [{ label: 'Currency', value: factSheet.currency, icon: Coins }] : []),
    ...(factSheet?.timeZone ? [{ label: 'Time zone', value: factSheet.timeZone, icon: Clock3 }] : []),
    { label: 'City setting', value: profile, icon: MapPin },
  ];
  const activeMedia = media[Math.min(activeIndex, Math.max(media.length - 1, 0))];
  const activeImageUrl = activeMedia?.url ?? activeMedia?.thumbnailUrl;
  const hasMultipleImages = media.length > 1;
  const setPreviousImage = () => setActiveIndex((index) => (index + media.length - 1) % media.length);
  const setNextImage = () => setActiveIndex((index) => (index + 1) % media.length);

  return (
    <section className={`overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#0d1f35] text-white shadow-[0_0_28px_rgba(34,211,238,0.08)] ${className}`}>
      <div className="border-b border-white/10 px-5 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200/70">Destination Briefing</p>
            <h3 className="mt-1 text-2xl font-game text-white">
              {destination.city}, {destination.country}
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/60">
              Preview the place, then continue to today&apos;s lesson activity.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100">
              {destination.primaryAirport}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-cyan-300/35 hover:bg-cyan-300/10 hover:text-white"
                aria-label="Close destination briefing"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="min-w-0 space-y-3">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
            <div className="relative h-[clamp(320px,44vh,540px)] overflow-hidden bg-slate-950">
              {activeImageUrl ? (
                <>
                  <div
                    aria-hidden
                    className="absolute inset-0 scale-110 bg-cover bg-center opacity-25 blur-2xl"
                    style={{ backgroundImage: `url(${activeImageUrl})` }}
                  />
                  <div className="absolute inset-0 bg-slate-950/35" aria-hidden />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeImageUrl}
                    alt={activeMedia.alt}
                    className="relative z-10 h-full w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setIsImageFocusOpen(true)}
                    className="absolute right-3 top-3 z-20 inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/85 px-3 py-2 text-xs font-semibold text-white shadow-xl transition hover:border-cyan-300/35 hover:bg-cyan-400/20"
                    aria-label="Enlarge destination image"
                  >
                    <Maximize2 className="h-4 w-4" aria-hidden />
                    Enlarge
                  </button>
                  {hasMultipleImages && (
                    <>
                      <button
                        type="button"
                        onClick={setPreviousImage}
                        className="absolute left-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/85 text-white shadow-xl transition hover:bg-cyan-400/20"
                        aria-label="Previous destination image"
                      >
                        <ChevronLeft className="h-5 w-5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={setNextImage}
                        className="absolute right-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/85 text-white shadow-xl transition hover:bg-cyan-400/20"
                        aria-label="Next destination image"
                      >
                        <ChevronRight className="h-5 w-5" aria-hidden />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No destination image available yet.
                </div>
              )}
            </div>
            {activeMedia ? (
              <div className="border-t border-white/10 bg-slate-950/85 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/75">
                      {toTitle(activeMedia.kind)} {media.length > 0 ? `- ${Math.min(activeIndex, media.length - 1) + 1} of ${media.length}` : ''}
                    </p>
                    <h4 className="mt-1 text-base font-semibold leading-tight text-white">{activeMedia.title}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-white/70">{activeMedia.caption}</p>
                  </div>
                  <a
                    href={activeMedia.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] text-white/65 transition-colors hover:border-cyan-300/35 hover:text-cyan-100"
                  >
                    <Info className="h-3 w-3" aria-hidden />
                    {activeMedia.sourceName}{activeMedia.license ? ` - ${activeMedia.license}` : ''}
                  </a>
                </div>
              </div>
            ) : null}
          </div>

          {hasMultipleImages ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {media.map((asset, index) => {
                const imageUrl = asset.url ?? asset.thumbnailUrl;
                if (!imageUrl) return null;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`relative h-14 min-w-[96px] overflow-hidden rounded-xl border transition ${
                      index === Math.min(activeIndex, media.length - 1)
                        ? 'border-cyan-300/70 ring-2 ring-cyan-300/30'
                        : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                    aria-label={`Show destination image ${index + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {activeMedia ? (
          <ImageFocusModal
            media={media}
            initialIndex={activeIndex}
            isOpen={isImageFocusOpen}
            onClose={() => setIsImageFocusOpen(false)}
            label="Destination image"
            placeName={`${destination.city}, ${destination.country}`}
          />
        ) : null}

        <div className="min-w-0 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {facts.map(({ label, value, icon: Icon, detail, source }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-slate-950/60 p-2.5">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/50">
                  <Icon className="h-3.5 w-3.5 text-cyan-200/80" aria-hidden />
                  {label}
                </div>
                <p className="mt-1 text-sm font-semibold leading-snug text-slate-100">{value}</p>
                {detail ? <p className="mt-1 text-[11px] leading-relaxed text-white/45">{detail}</p> : null}
                {source ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200/70 transition-colors hover:text-cyan-100"
                  >
                    Source: {source.name}
                  </a>
                ) : null}
              </div>
            ))}
          </div>

          <div className={foodCulture.length > 0 ? 'grid gap-3 lg:grid-cols-2' : ''}>
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/50">
                <Sparkles className="h-3.5 w-3.5 text-amber-200/80" aria-hidden />
                Known For
              </div>
              <div className="flex flex-wrap gap-2">
                {knownFor.map((item) => (
                  <span key={item} className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-medium text-cyan-50/90">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {foodCulture.length > 0 ? (
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/50">
                  <Utensils className="h-3.5 w-3.5 text-amber-200/80" aria-hidden />
                  Food + Culture
                </div>
                <div className="flex flex-wrap gap-2">
                  {foodCulture.map((item) => (
                    <span key={item} className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-50/90">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className={onClose ? 'grid gap-3 lg:grid-cols-[1fr_220px]' : ''}>
            <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-100/70">Class Question</p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-amber-50/95">{prompt}</p>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="min-h-[82px] w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-game text-sm text-white shadow-xl transition hover:scale-[1.01] active:scale-95"
              >
                {continueLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
