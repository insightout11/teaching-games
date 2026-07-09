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

interface LibraryEntry {
  id: string;
  title: string;
  speaker?: string;
  author?: string;
  summary?: string;
  description?: string;
  durationSecs?: number;
  wordCount?: number;
  slides?: string[];
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
    ...(entry.slides ? { slides: entry.slides } : {}),
  };
}
