// Topic -> library source recommender ("Find"). Pure, deterministic, no AI: scores
// the curated video + reading libraries against concrete lesson keywords.
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
  'relationship', 'relationships', 'world', 'around', 'sharing', 'effort', 'efforts',
  'thing', 'things', 'people', 'person', 'topic', 'topics',
  'common', 'different', 'type', 'types', 'their', 'care', 'characteristic', 'characteristics',
  'answer', 'answers', 'question', 'questions', 'ask', 'asking', 'purpose', 'structuring',
  'structure', 'structures', 'effective', 'using', 'method', 'methods', 'smart', 'difficult',
  'handling', 'preparing', 'practicing', 'understanding', 'creating', 'imagining',
  'adventure', 'adventures', 'story', 'stories', 'threat', 'threats', 'protect', 'protecting',
  'protection',
]);

function tokenize(text: string): string[] {
  const tokens = (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
    (t) => t.length > 2 && !STOPWORDS.has(t),
  );
  return Array.from(new Set(tokens));
}

function normalizeToken(token: string): string {
  if (token.endsWith('ies') && token.length > 5) return `${token.slice(0, -3)}y`;
  if (token.endsWith('es') && token.length > 5) return token.slice(0, -2);
  if (token.endsWith('s') && token.length > 4) return token.slice(0, -1);
  return token;
}

function tokenSet(text: string): Set<string> {
  return new Set(tokenize(text).map(normalizeToken));
}

function tokenMatches(query: string, candidate: string): boolean {
  if (query === candidate) return true;
  if (query.length >= 5 && candidate.length >= 5) {
    return query.startsWith(candidate) || candidate.startsWith(query);
  }
  return false;
}

function hasTokenMatch(query: string, candidates: Set<string>): boolean {
  for (const candidate of Array.from(candidates)) {
    if (tokenMatches(query, candidate)) return true;
  }
  return false;
}

function tagMatches(query: string, tag: string): boolean {
  return hasTokenMatch(query, tokenSet(tag));
}

const MIN_RECOMMENDATION_SCORE = 4;

export type RecommendInput = string | string[] | { topic: string; keywords?: string[]; context?: string };

function queryTokensFrom(input: RecommendInput): string[] {
  const rawTokens = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? [input]
      : input.keywords !== undefined
        ? input.keywords
        : [input.topic];
  return Array.from(new Set(rawTokens.flatMap(tokenize).map(normalizeToken)));
}

function contextTokensFrom(input: RecommendInput): string[] {
  if (Array.isArray(input) || typeof input === 'string' || !input.context) return [];
  return tokenize(input.context).map(normalizeToken);
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
 * description/summary only as supporting evidence. Returns only genuinely on-topic
 * matches (tag/title hit above a minimum threshold), filtered by audience (kids)
 * and level, highest first.
 */
export function recommendSources(input: RecommendInput, options: RecommendOptions = {}): LibraryRecommendation[] {
  const queryTokens = queryTokensFrom(input);
  const contextTokens = contextTokensFrom(input);
  if (queryTokens.length === 0) return [];

  const lessonRank = options.level ? levelRank(options.level) : null;
  const pool = options.kind ? ALL_ITEMS.filter((i) => i.kind === options.kind) : ALL_ITEMS;
  const scored: LibraryRecommendation[] = [];

  for (const item of pool) {
    // Audience: young-learner content only when the teacher teaches kids.
    if (!options.allowKids && item.sourceType === 'kids') continue;

    const tags = item.topicTags.map((t) => t.toLowerCase());
    const titleTokens = tokenSet(item.title);
    const bodyTokens = tokenSet(`${item.description} ${item.summary ?? ''}`);
    const contextScore = contextTokens.reduce((total, q) => {
      if (tags.some((t) => tagMatches(q, t))) return total + 4;
      if (hasTokenMatch(q, titleTokens)) return total + 3;
      return total;
    }, 0);
    if (contextTokens.length > 0 && contextScore === 0) continue;

    let score = contextScore;
    let strong = contextScore > 0; // a tag or title hit, not just a stray word in the description
    for (const q of queryTokens) {
      if (tags.some((t) => tagMatches(q, t))) {
        score += 4;
        strong = true;
      } else if (hasTokenMatch(q, titleTokens)) {
        score += 3;
        strong = true;
      } else if (hasTokenMatch(q, bodyTokens)) {
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

    if (score >= MIN_RECOMMENDATION_SCORE) {
      scored.push({ ...item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return scored.slice(0, options.limit ?? 6);
}

export function recommendSource(input: RecommendInput, options: Omit<RecommendOptions, 'limit'> = {}): LibraryRecommendation | null {
  return recommendSources(input, { ...options, limit: 1 })[0] ?? null;
}
