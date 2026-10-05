import type { CourseSourceRef } from '@/lib/course';
import type { SourceMaterial, SourceType } from '@/types/source-material';
import tedRaw from '@/data/ted-library.json';
import tededRaw from '@/data/teded-library.json';
import bbcRaw from '@/data/bbc-library.json';
import kurzgesagtRaw from '@/data/kurzgesagt-library.json';
import bbcIdeasRaw from '@/data/bbc-ideas-library.json';
import bigthinkRaw from '@/data/bigthink-library.json';
import voxRaw from '@/data/vox-library.json';
import kidsRaw from '@/data/kids-library.json';
import natgeoRaw from '@/data/natgeo-library.json';
import crashCourseRaw from '@/data/crash-course-library.json';
import travelEnglishRaw from '@/data/travel-english-library.json';
import worldFlightRaw from '@/data/world-flight-library.json';
import businessEnglishRaw from '@/data/business-english-library.json';
import internetMemesRaw from '@/data/internet-memes-library.json';
import minecraftRaw from '@/data/minecraft-library.json';
import sportsRaw from '@/data/sports-library.json';
import storiesRaw from '@/data/stories-library.json';
import voaRaw from '@/data/voa-library.json';
import pictureBookRaw from '@/data/picture-books-library.json';
import grammarRaw from '@/data/grammar-library.json';
import listeningRaw from '@/data/listening-library.json';
import hooksRaw from '@/data/hooks-library.json';
import discussionRaw from '@/data/discussion-library.json';
import bookRaw from '@/data/book-library.json';
import storyweaverRaw from '@/data/storyweaver-library.json';

interface LibraryEntry {
  id: string;
  title: string;
  speaker?: string;
  author?: string;
  summary?: string;
  description?: string;
  durationSecs?: number | null;
  wordCount?: number;
  slides?: string[];
  images?: Array<{ url: string; alt?: string }>;
}

const LIBRARIES: Record<string, LibraryEntry[]> = {
  ted: tedRaw as LibraryEntry[],
  teded: tededRaw as LibraryEntry[],
  bbc: bbcRaw as LibraryEntry[],
  kurzgesagt: kurzgesagtRaw as LibraryEntry[],
  'bbc-ideas': bbcIdeasRaw as LibraryEntry[],
  bigthink: bigthinkRaw as LibraryEntry[],
  vox: voxRaw as LibraryEntry[],
  kids: kidsRaw as LibraryEntry[],
  natgeo: natgeoRaw as LibraryEntry[],
  'crash-course': crashCourseRaw as LibraryEntry[],
  'travel-english': travelEnglishRaw as LibraryEntry[],
  'world-flight': worldFlightRaw as LibraryEntry[],
  'business-english': businessEnglishRaw as LibraryEntry[],
  'internet-memes': internetMemesRaw as LibraryEntry[],
  minecraft: minecraftRaw as LibraryEntry[],
  sports: sportsRaw as LibraryEntry[],
  stories: storiesRaw as LibraryEntry[],
  voa: voaRaw as LibraryEntry[],
  'picture-books': pictureBookRaw as LibraryEntry[],
  grammar: grammarRaw as LibraryEntry[],
  listening: listeningRaw as LibraryEntry[],
  hooks: hooksRaw as LibraryEntry[],
  discussion: discussionRaw as LibraryEntry[],
  books: bookRaw as LibraryEntry[],
  storyweaver: storyweaverRaw as LibraryEntry[],
};

function displayTitle(entry: LibraryEntry): string {
  const creator = entry.speaker ?? entry.author;
  return creator ? `${entry.title} — ${creator}` : entry.title;
}

export function getLibrarySourceMaterial(ref: CourseSourceRef): SourceMaterial | null {
  if (!ref || ref.kind !== 'library') return null;
  const entry = LIBRARIES[ref.sourceType]?.find((candidate) => candidate.id === ref.id);
  if (!entry) return null;
  const summary = entry.summary ?? entry.description ?? ref.title;
  return {
    sourceType: ref.sourceType as SourceType,
    sourceKey: entry.id,
    title: displayTitle(entry),
    summary,
    ...(entry.durationSecs ? { duration: entry.durationSecs } : {}),
    ...(entry.wordCount ? { wordCount: entry.wordCount } : {}),
    ...(entry.slides?.length
      ? { slides: entry.slides }
      : entry.images?.length ? { slides: entry.images.map((image) => image.url) } : {}),
  };
}

/** The raw library entry (any extra fields, e.g. youtubeId, listeningPack) for a source. */
export function getLibraryEntry(sourceType: string, id: string): (LibraryEntry & Record<string, unknown>) | null {
  return (LIBRARIES[sourceType]?.find((e) => e.id === id) as (LibraryEntry & Record<string, unknown>) | undefined) ?? null;
}

/** Every library entry carrying a listening pack, with its source type (for the Listening flight picker). */
export function listLibraryEntriesWithListeningPack(): Array<{ sourceType: string; entry: LibraryEntry & Record<string, unknown> }> {
  const out: Array<{ sourceType: string; entry: LibraryEntry & Record<string, unknown> }> = [];
  Object.keys(LIBRARIES).forEach((sourceType) => {
    LIBRARIES[sourceType].forEach((e) => {
      const x = e as LibraryEntry & Record<string, unknown>;
      if (x.listeningPack) out.push({ sourceType, entry: x });
    });
  });
  return out;
}
