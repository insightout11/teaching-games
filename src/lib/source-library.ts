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
import sportsRaw from '@/data/sports-library.json';

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
  take(sportsRaw, 'sports', 'video'),
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
  /** Lesson level — down-ranks far-off difficulty, hard-excludes extreme mismatches. */
  level?: string;
  /** Allow young-learner ('kids') content. Default false. */
  allowKids?: boolean;
}

export interface LibraryRecommendation extends LibraryItem {
  score: number;
}

/** Map any level label (lesson Difficulty or library difficultyLevel) to a 1–5 band. */
function levelRank(label: string): number {
  const l = label.toLowerCase();
  if (l.includes('beginner')) return 1;
  if (l.includes('pre-intermediate')) return 2;
  if (l.includes('upper-intermediate')) return 4;
  if (l.includes('intermediate')) return 3;
  if (l.includes('easy')) return 2;
  if (l.includes('advanced')) return 5;
  if (l.includes('expert')) return 5;
  return 3;
}

/**
 * Rank library items by topic relevance. Tag hits weigh most, then title, then
 * description/summary. Returns only genuinely on-topic matches (tag/title hit),
 * filtered by audience (kids) and level, highest first.
 */
export function recommendSources(topic: string, options: RecommendOptions = {}): LibraryRecommendation[] {
  const queryTokens = tokenize(topic);
  if (queryTokens.length === 0) return [];

  const lessonRank = options.level ? levelRank(options.level) : null;
  const pool = options.kind ? ALL_ITEMS.filter((i) => i.kind === options.kind) : ALL_ITEMS;
  const scored: LibraryRecommendation[] = [];

  for (const item of pool) {
    // Audience: young-learner content only when the teacher teaches kids.
    if (!options.allowKids && item.sourceType === 'kids') continue;

    const tags = item.topicTags.map((t) => t.toLowerCase());
    const title = item.title.toLowerCase();
    const body = `${item.description} ${item.summary ?? ''}`.toLowerCase();

    let score = 0;
    let strong = false; // a tag or title hit — not just a stray word in the description
    for (const q of queryTokens) {
      if (tags.some((t) => t.includes(q) || q.includes(t))) {
        score += 3;
        strong = true;
      } else if (title.includes(q)) {
        score += 2;
        strong = true;
      } else if (body.includes(q)) {
        score += 1;
      }
    }
    // Require a real topical match (tag/title); body-only matches are noise.
    if (!strong) continue;

    // Level fit: hard-exclude extreme mismatches, softly down-rank near misses.
    if (lessonRank !== null && item.difficultyLevel) {
      const dist = Math.abs(lessonRank - levelRank(item.difficultyLevel));
      if (dist >= 3) continue;
      score -= dist;
    }

    scored.push({ ...item, score });
  }

  scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return scored.slice(0, options.limit ?? 6);
}
