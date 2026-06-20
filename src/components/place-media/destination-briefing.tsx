import React from 'react';
import { BookOpen, Compass, Globe2, Image as ImageIcon, Info, Languages, MapPin, Sparkles } from 'lucide-react';
import type { DestinationPack } from '@/lib/world-flight/types';
import {
  getMediaForUsage,
  getPlaceMediaRecordByDestination,
  type PlaceMediaAsset,
} from '@/lib/place-media';

const COUNTRY_LANGUAGE_HINTS: Record<string, string> = {
  Argentina: 'Spanish',
  Australia: 'English',
  Brazil: 'Portuguese',
  Canada: 'English and French',
  Chile: 'Spanish',
  China: 'Mandarin Chinese, Cantonese, and regional languages',
  Colombia: 'Spanish',
  Egypt: 'Arabic',
  Ethiopia: 'Amharic, Oromo, Tigrinya, English, and other languages',
  Fiji: 'English, Fijian, and Fiji Hindi',
  France: 'French',
  Germany: 'German',
  Iceland: 'Icelandic',
  India: 'Hindi, English, and many regional languages',
  Indonesia: 'Indonesian',
  Ireland: 'English and Irish',
  Italy: 'Italian',
  Japan: 'Japanese',
  Kazakhstan: 'Kazakh and Russian',
  Kenya: 'Swahili and English',
  Mexico: 'Spanish',
  Mongolia: 'Mongolian',
  Netherlands: 'Dutch',
  'New Zealand': 'English and Maori',
  Nigeria: 'English, Yoruba, Igbo, Hausa, and other languages',
  Panama: 'Spanish',
  Peru: 'Spanish, Quechua, Aymara, and other languages',
  Philippines: 'Filipino, English, and regional languages',
  Portugal: 'Portuguese',
  Russia: 'Russian',
  Senegal: 'French, Wolof, and other languages',
  Singapore: 'English, Malay, Mandarin, and Tamil',
  'South Africa': 'English, Afrikaans, Zulu, Xhosa, and other languages',
  'South Korea': 'Korean',
  Spain: 'Spanish',
  Thailand: 'Thai',
  Turkey: 'Turkish',
  'United Arab Emirates': 'Arabic, English, and many community languages',
  'United Kingdom': 'English',
  'United States': 'English, Spanish, and many community languages',
  Vietnam: 'Vietnamese',
};

const CURATED_DESTINATION_NOTES: Record<string, { knownFor: string[]; prompt: string }> = {
  'rio-de-janeiro': {
    knownFor: ['Mountains meeting the ocean', 'Samba and Carnival', 'Tijuca Forest', 'Beach public life'],
    prompt: 'What parts of Rio feel natural, and what parts feel built by people?',
  },
  'panama-city': {
    knownFor: ['Panama Canal', 'Casco Viejo', 'Trade routes', 'Afro-Panamanian culture'],
    prompt: 'How can one city connect local neighborhoods with global movement?',
  },
  delhi: {
    knownFor: ['Markets', 'Food variety', 'Multilingual public life', 'Historic layers'],
    prompt: 'What clues show that Delhi is shaped by many regions and languages?',
  },
  singapore: {
    knownFor: ['Hawker food', 'Multilingual classrooms', 'Port trade', 'Garden city design'],
    prompt: 'How can a small city-state feel connected to many cultures at once?',
  },
  tokyo: {
    knownFor: ['Dense transit', 'Neighborhood routines', 'Public baths', 'Old and new streets'],
    prompt: 'What daily systems help a very large city feel organized?',
  },
  cairo: {
    knownFor: ['Nile River', 'Ancient monuments', 'Desert edge', 'Historic capital life'],
    prompt: 'How does the past stay visible inside a modern city?',
  },
  amsterdam: {
    knownFor: ['Canals', 'Water management', 'Cycling culture', 'Historic streets'],
    prompt: 'When is water beautiful, and when is it infrastructure?',
  },
  nairobi: {
    knownFor: ['Matatu culture', 'Urban wildlife edge', 'Regional business', 'Visual transport language'],
    prompt: 'How can transport become part of a city culture?',
  },
  dakar: {
    knownFor: ['Wolof language', 'Coastal location', 'Music and media', 'West African crossroads'],
    prompt: 'How does multilingual life shape what people hear and see in a city?',
  },
  'addis-ababa': {
    knownFor: ['African Union diplomacy', 'Scripts and languages', 'Highland capital', 'Coffee culture'],
    prompt: 'How can one capital represent many languages and identities?',
  },
  miami: {
    knownFor: ['Caribbean and Latin American migration', 'Bilingual life', 'Coastal risk', 'Music and media'],
    prompt: 'How does migration change the sound and feel of a city?',
  },
  istanbul: {
    knownFor: ['Europe-Asia crossing', 'Historic peninsula', 'Earthquake readiness', 'Layered architecture'],
    prompt: 'What changes when a city is both a bridge and a risk zone?',
  },
  ulaanbaatar: {
    knownFor: ['Extreme winter systems', 'Ger districts', 'Mountain valley setting', 'Mongolian capital life'],
    prompt: 'What does a city need to keep working through a very cold winter?',
  },
};

function toTitle(value: string) {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function readableLandmark(value?: string) {
  return value ? toTitle(value) : null;
}

function imageFromHero(destination: DestinationPack): PlaceMediaAsset {
  const image = destination.heroImage;
  return {
    id: `${destination.id}-briefing-hero`,
    kind: 'cityscape',
    title: `${destination.city} arrival view`,
    provider: image.sourceName.toLowerCase().includes('unsplash') ? 'unsplash' : 'external',
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

function dedupeMedia(media: PlaceMediaAsset[]) {
  const seen = new Set<string>();
  return media.filter((asset) => {
    const imageUrl = asset.url ?? asset.thumbnailUrl;
    if (!imageUrl || seen.has(imageUrl)) return false;
    seen.add(imageUrl);
    return true;
  });
}

function getBriefingMedia(destination: DestinationPack) {
  const place = getPlaceMediaRecordByDestination(destination.id);
  if (!place) return [imageFromHero(destination)];

  return dedupeMedia([
    ...getMediaForUsage(place, 'lesson-intro'),
    ...getMediaForUsage(place, 'background'),
    ...getMediaForUsage(place, 'reveal'),
    imageFromHero(destination),
  ]).slice(0, 5);
}

function getLessonLens(destination: DestinationPack) {
  const published = destination.focusOptions.filter((focus) => focus.review.status !== 'draft');
  const source = published.length > 0 ? published : destination.focusOptions;
  return source.slice(0, 3).map((focus) => {
    const title = focus.title.includes(' - ') ? focus.title.split(' - ').slice(1).join(' - ') : focus.title;
    return {
      title,
      subtitle: focus.subtitle,
    };
  });
}

function getKnownFor(destination: DestinationPack) {
  const curated = CURATED_DESTINATION_NOTES[destination.id]?.knownFor;
  if (curated?.length) return curated;

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
}: {
  destination: DestinationPack;
  className?: string;
}) {
  const media = getBriefingMedia(destination);
  const languageHint = COUNTRY_LANGUAGE_HINTS[destination.country] ?? 'Local and regional languages vary by community';
  const lessonLens = getLessonLens(destination);
  const knownFor = getKnownFor(destination);
  const prompt = CURATED_DESTINATION_NOTES[destination.id]?.prompt
    ?? `What do the images suggest about daily life in ${destination.city}?`;
  const profile = [
    `${toTitle(destination.scene.terrain)} setting`,
    `${toTitle(destination.scene.skyline)} skyline`,
    readableLandmark(destination.scene.landmarkSilhouette),
  ].filter(Boolean).join(' - ');

  const facts = [
    { label: 'Country', value: destination.country, icon: Globe2 },
    { label: 'Region', value: destination.region, icon: Compass },
    { label: 'Language', value: languageHint, icon: Languages },
    { label: 'Arrival profile', value: profile, icon: MapPin },
  ];

  return (
    <section className={`mb-4 overflow-hidden rounded-2xl border border-cyan-300/18 bg-slate-950/70 shadow-2xl ${className}`}>
      <div className="border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200/70">Destination Briefing</p>
            <h3 className="mt-1 text-xl font-game text-white">
              {destination.city}, {destination.country}
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-300">
              Quick place context before today&apos;s lesson activity.
            </p>
          </div>
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100">
            {destination.primaryAirport}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            <ImageIcon className="h-3.5 w-3.5 text-cyan-200" aria-hidden />
            Place Images
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {media.map((asset) => {
              const imageUrl = asset.url ?? asset.thumbnailUrl;
              if (!imageUrl) return null;
              return (
                <article key={asset.id} className="min-w-[230px] max-w-[260px] overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                  <div className="relative h-32 overflow-hidden bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={asset.alt}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: asset.focalPoint ? `${asset.focalPoint.x}% ${asset.focalPoint.y}%` : 'center' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-2 rounded-full bg-slate-950/75 px-2 py-0.5 text-[10px] font-semibold text-cyan-100">
                      {toTitle(asset.kind)}
                    </span>
                  </div>
                  <div className="p-3">
                    <h4 className="line-clamp-1 text-xs font-semibold text-white">{asset.title}</h4>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-300">{asset.caption}</p>
                    <a
                      href={asset.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[10px] text-slate-400 transition-colors hover:text-cyan-200"
                    >
                      <Info className="h-3 w-3" aria-hidden />
                      {asset.sourceName}{asset.license ? ` - ${asset.license}` : ''}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-2 sm:grid-cols-2">
            {facts.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  <Icon className="h-3.5 w-3.5 text-cyan-200/80" aria-hidden />
                  {label}
                </div>
                <p className="mt-1 text-sm font-semibold leading-snug text-slate-100">{value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-amber-200/80" aria-hidden />
                Known For
              </div>
              <div className="flex flex-wrap gap-2">
                {knownFor.map((item) => (
                  <span key={item} className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.08] px-2.5 py-1 text-[11px] font-medium text-cyan-50/90">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                <BookOpen className="h-3.5 w-3.5 text-cyan-200/80" aria-hidden />
                Lesson Lens
              </div>
              <div className="space-y-2">
                {lessonLens.map((lens) => (
                  <div key={lens.title} className="rounded-lg bg-slate-950/45 px-3 py-2">
                    <p className="text-xs font-semibold text-white">{lens.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-400">{lens.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.06] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-100/70">Class Question</p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-amber-50/90">{prompt}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
