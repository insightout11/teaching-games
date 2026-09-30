import 'server-only';
import tedLibrary from '@/data/ted-library.json';
import tededLibrary from '@/data/teded-library.json';
import bbcLibrary from '@/data/bbc-library.json';
import kurzgesagtLibrary from '@/data/kurzgesagt-library.json';
import bbcIdeasLibrary from '@/data/bbc-ideas-library.json';
import bigthinkLibrary from '@/data/bigthink-library.json';
import voxLibrary from '@/data/vox-library.json';
import kidsLibrary from '@/data/kids-library.json';
import natgeoLibrary from '@/data/natgeo-library.json';
import crashCourseLibrary from '@/data/crash-course-library.json';
import travelEnglishLibrary from '@/data/travel-english-library.json';
import worldFlightLibrary from '@/data/world-flight-library.json';
import businessEnglishLibrary from '@/data/business-english-library.json';
import internetMemesLibrary from '@/data/internet-memes-library.json';
import minecraftLibrary from '@/data/minecraft-library.json';
import sportsLibrary from '@/data/sports-library.json';
import grammarLibrary from '@/data/grammar-library.json';
import hooksLibrary from '@/data/hooks-library.json';
import voaLibrary from '@/data/voa-library.json';
import storiesLibrary from '@/data/stories-library.json';
import pictureBookLibrary from '@/data/picture-books-library.json';
import discussionLibrary from '@/data/discussion-library.json';
import { rankLibrary, type LibraryEntry, type LibraryKind } from './library-search';

type Raw = {
  id: string; title: string; speaker?: string; author?: string; url?: string; youtubeId?: string | null;
  durationSecs?: number; wordCount?: number; topicTags?: string[]; description?: string; summary?: string;
  cefr?: string; ageBand?: string; needsReview?: boolean; genre?: string;
};

const PUBLISHER: Record<string, string> = {
  ted: 'TED', teded: 'TED-Ed', bbc: 'BBC', kurzgesagt: 'Kurzgesagt', 'bbc-ideas': 'BBC Ideas', bigthink: 'Big Think',
  vox: 'Vox', kids: 'Kids', natgeo: 'National Geographic', 'crash-course': 'Crash Course', 'travel-english': 'Travel English',
  'world-flight': 'World Flight', 'business-english': 'Business English', 'internet-memes': 'Internet', minecraft: 'Minecraft',
  sports: 'Sports', grammar: 'Grammar', hooks: 'Short hook', voa: 'VOA Learning English', stories: 'Story',
  'picture-books': 'Picture book', discussion: 'LessonCaptain',
};

const SOURCES: Array<{ source: string; kind: LibraryKind; data: unknown }> = [
  { source: 'teded', kind: 'video', data: tededLibrary },
  { source: 'ted', kind: 'video', data: tedLibrary },
  { source: 'bbc', kind: 'video', data: bbcLibrary },
  { source: 'kurzgesagt', kind: 'video', data: kurzgesagtLibrary },
  { source: 'bbc-ideas', kind: 'video', data: bbcIdeasLibrary },
  { source: 'bigthink', kind: 'video', data: bigthinkLibrary },
  { source: 'vox', kind: 'video', data: voxLibrary },
  { source: 'kids', kind: 'video', data: kidsLibrary },
  { source: 'natgeo', kind: 'video', data: natgeoLibrary },
  { source: 'crash-course', kind: 'video', data: crashCourseLibrary },
  { source: 'travel-english', kind: 'video', data: travelEnglishLibrary },
  { source: 'world-flight', kind: 'video', data: worldFlightLibrary },
  { source: 'business-english', kind: 'video', data: businessEnglishLibrary },
  { source: 'internet-memes', kind: 'video', data: internetMemesLibrary },
  { source: 'minecraft', kind: 'video', data: minecraftLibrary },
  { source: 'sports', kind: 'video', data: sportsLibrary },
  { source: 'hooks', kind: 'hook', data: hooksLibrary },
  { source: 'grammar', kind: 'grammar', data: grammarLibrary },
  { source: 'voa', kind: 'text', data: voaLibrary },
  { source: 'stories', kind: 'text', data: storiesLibrary },
  { source: 'picture-books', kind: 'text', data: pictureBookLibrary },
  { source: 'discussion', kind: 'debate', data: discussionLibrary },
];

// Some imported texts carry mis-encoded non-breaking spaces ("SheÂ needs").
export const cleanText = (t: string) => t.replace(/\u00C2(?=[\s\u00A0])/g, '').replace(/\u00A0/g, ' ');

let cache: { entries: LibraryEntry[]; full: Map<string, Raw> } | null = null;

/** Every reviewed item (needsReview hidden), with the fields the Library tab needs. */
export function libraryCatalog() {
  if (cache) return cache;
  const entries: LibraryEntry[] = [];
  const full = new Map<string, Raw>();
  for (const { source, kind, data } of SOURCES) {
    for (const r of data as Raw[]) {
      if (r.needsReview) continue;
      const key = `${source}:${r.id}`;
      if (full.has(key)) continue;
      full.set(key, r);
      entries.push({
        key,
        source,
        kind,
        title: cleanText(r.title),
        publisher: PUBLISHER[source] ?? source,
        byline: (() => { const b = r.speaker ?? r.author ?? null; return b && b !== PUBLISHER[source] ? b : null; })(),
        blurb: cleanText(r.description ?? r.summary ?? '').slice(0, 220),
        tags: r.topicTags ?? [],
        cefr: r.cefr ?? null,
        ageBand: r.ageBand ?? null,
        durationSecs: r.durationSecs ?? null,
        wordCount: r.wordCount ?? null,
        youtubeId: r.youtubeId ?? null,
        url: r.url && /^https?:/.test(r.url) ? r.url : r.youtubeId ? `https://www.youtube.com/watch?v=${r.youtubeId}` : null,
      });
    }
  }
  cache = { entries, full };
  return cache;
}

export function searchLibrary(opts: Parameters<typeof rankLibrary>[1]) {
  return rankLibrary(libraryCatalog().entries, opts);
}

export function libraryRaw(key: string) {
  return libraryCatalog().full.get(key) ?? null;
}
