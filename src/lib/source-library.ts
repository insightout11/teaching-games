// Topic → library source recommender ("Find"). Pure, deterministic, no AI: scores
// the curated video + reading libraries against a topic string by keyword/tag overlap.
// Selection reuses the existing /api/source/extract flow via (sourceType, id).

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
import businessEnglishRaw from '@/data/business-english-library.json';
import internetMemesRaw from '@/data/internet-memes-library.json';
import minecraftRaw from '@/data/minecraft-library.json';
import storiesRaw from '@/data/stories-library.json';
import voaRaw from '@/data/voa-library.json';
import pictureBookRaw from '@/data/picture-books-library.json';

export type LibraryItemKind = 'video' | 'reading';

export interface LibraryItem {
  id: string;
  sourceType: string;   // value passed to /api/source/extract as `type`
  kind: LibraryItemKind;
  title: string;
  topicTags: string[];
  description: string;
  summary?: string;
  difficultyLevel?: string;
  durationSecs?: number;
}

interface RawEntry {
  id: string;
  title: string;
  topicTags?: string[];
  description?: string;
  summary?: string;
  difficultyLevel?: string;
  durationSecs?: number;
}

function take(raw: unknown, sourceType: string, kind: LibraryItemKind): LibraryItem[] {
  return (raw as RawEntry[]).map((e) => ({
    id: e.id,
    sourceType,
    kind,
    title: e.title,
    topicTags: e.topicTags ?? [],
    description: e.description ?? '',
    summary: e.summary,
    difficultyLevel: e.difficultyLevel,
    durationSecs: e.durationSecs,
  }));
}

const ALL_ITEMS: LibraryItem[] = [
  take(tededRaw, 'teded', 'video'),
  take(tedRaw, 'ted', 'video'),
  take(bbcRaw, 'bbc', 'video'),
  take(kurzgesagtRaw, 'kurzgesagt', 'video'),
  take(bbcIdeasRaw, 'bbc-ideas', 'video'),
  take(bigthinkRaw, 'bigthink', 'video'),
  take(voxRaw, 'vox', 'video'),
  take(kidsRaw, 'kids', 'video'),
  take(natgeoRaw, 'natgeo', 'video'),
  take(crashCourseRaw, 'crash-course', 'video'),
  take(travelEnglishRaw, 'travel-english', 'video'),
  take(businessEnglishRaw, 'business-english', 'video'),
  take(internetMemesRaw, 'internet-memes', 'video'),
  take(minecraftRaw, 'minecraft', 'video'),
  take(storiesRaw, 'stories', 'reading'),
  take(voaRaw, 'voa', 'reading'),
  take(pictureBookRaw, 'picture-books', 'reading'),
].flat();

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'about', 'from', 'that', 'this', 'into', 'your', 'you',
  'are', 'was', 'were', 'how', 'why', 'what', 'when', 'who', 'a', 'an', 'of', 'to', 'in',
  'on', 'or', 'is', 'it', 'be', 'as', 'at', 'by', 'lesson', 'class', 'english', 'students',
]);

function tokenize(text: string): string[] {
  const tokens = (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
    (t) => t.length > 2 && !STOPWORDS.has(t),
  );
  return Array.from(new Set(tokens));
}

export interface RecommendOptions {
  /** Restrict to one kind. Omit for a mixed list. */
  kind?: LibraryItemKind;
  /** Max results (default 6). */
  limit?: number;
}

export interface LibraryRecommendation extends LibraryItem {
  score: number;
}

/**
 * Rank library items by topic relevance. Tag hits weigh most, then title, then
 * description/summary. Returns only positive-scoring matches, highest first.
 */
export function recommendSources(topic: string, options: RecommendOptions = {}): LibraryRecommendation[] {
  const queryTokens = tokenize(topic);
  if (queryTokens.length === 0) return [];

  const pool = options.kind ? ALL_ITEMS.filter((i) => i.kind === options.kind) : ALL_ITEMS;
  const scored: LibraryRecommendation[] = [];

  for (const item of pool) {
    const tags = item.topicTags.map((t) => t.toLowerCase());
    const title = item.title.toLowerCase();
    const body = `${item.description} ${item.summary ?? ''}`.toLowerCase();

    let score = 0;
    for (const q of queryTokens) {
      if (tags.some((t) => t.includes(q) || q.includes(t))) score += 3;
      else if (title.includes(q)) score += 2;
      else if (body.includes(q)) score += 1;
    }
    if (score > 0) scored.push({ ...item, score });
  }

  scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return scored.slice(0, options.limit ?? 6);
}
