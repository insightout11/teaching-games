import { allLibraryItems, type LibraryItem } from '@/lib/source-library';
import { getLibraryEntry } from '@/lib/library-source-material';
import { READING_COURSE_PRESETS } from '@/lib/course-presets';

/**
 * The Library page's shelves (Oct 2026 redesign): a few rows of picks per kind, chosen deterministically so the page
 * is stable between visits. Server-side only (the libraries stay off the client).
 */
export interface ShelfItem {
  sourceType: string;
  id: string;
  title: string;
  kind: 'video' | 'reading';
  level?: string;
  minutes?: number;
  thumb?: string;
  /** Book shelf: opens the reading course in the builder instead of the planner. */
  presetId?: string;
  lessons?: number;
}
export interface Shelf {
  key: string;
  title: string;
  items: ShelfItem[];
}

export function shelfItemFor(i: LibraryItem): ShelfItem {
  const entry = getLibraryEntry(i.sourceType, i.id);
  const youtubeId = typeof entry?.youtubeId === 'string' ? entry.youtubeId : null;
  return {
    sourceType: i.sourceType,
    id: i.id,
    title: i.title,
    kind: i.kind,
    ...(i.difficultyLevel ? { level: i.difficultyLevel } : {}),
    ...(i.durationSecs ? { minutes: Math.max(1, Math.round(i.durationSecs / 60)) } : {}),
    ...(youtubeId ? { thumb: `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg` } : {}),
  };
}

/** Up to n items, taking turns across source types so one channel doesn't fill the row. */
function roundRobin(items: LibraryItem[], n: number): LibraryItem[] {
  const by = new Map<string, LibraryItem[]>();
  items.forEach((i) => by.set(i.sourceType, [...(by.get(i.sourceType) ?? []), i]));
  const lists = Array.from(by.values());
  const out: LibraryItem[] = [];
  for (let k = 0; out.length < n && lists.some((l) => l.length > k); k++) {
    for (const l of lists) if (l[k] && out.length < n) out.push(l[k]);
  }
  return out;
}

export function libraryShelves(): Shelf[] {
  const all = allLibraryItems();
  const videos = all.filter((i) => i.kind === 'video' && !['kids', 'grammar', 'listening', 'hooks'].includes(i.sourceType));
  const short = videos.filter((i) => (i.durationSecs ?? 0) > 0 && (i.durationSecs ?? 0) <= 420);
  const kids = all.filter((i) => ['kids', 'storyweaver', 'picture-books'].includes(i.sourceType));
  const listening = all.filter((i) => getLibraryEntry(i.sourceType, i.id)?.listeningPack);
  const talk = all.filter((i) => ['discussion', 'voa', 'stories'].includes(i.sourceType));

  return [
    { key: 'short', title: 'Short videos', items: roundRobin(short, 10).map(shelfItemFor) },
    { key: 'kids', title: 'For young learners', items: roundRobin(kids, 10).map(shelfItemFor) },
    {
      key: 'books',
      title: 'Books and reading courses',
      items: READING_COURSE_PRESETS.slice(0, 10).map((p) => ({
        sourceType: 'books',
        id: p.id,
        title: p.title.replace(/ \(reading course\)$/, ''),
        kind: 'reading' as const,
        level: p.level,
        presetId: p.id,
        lessons: p.lessons.length,
      })),
    },
    { key: 'listening', title: 'Listening clips', items: roundRobin(listening, 10).map(shelfItemFor) },
    { key: 'talk', title: 'Texts to talk about', items: roundRobin(talk, 10).map(shelfItemFor) },
  ].filter((s) => s.items.length > 0);
}
