import type { SourceMaterial, SourceType } from '@/types/source-material';
import type { RoomItem } from '@/stores/live-room-store';

/**
 * Turn a shown room item into the SourceMaterial every generate route already
 * grounds on (src/lib/source-context.ts). Videos and places carry only their
 * title/description: no transcript is fetched at runtime.
 */
export function roomItemToSource(item: RoomItem): SourceMaterial {
  const publisher = item.publisher ?? hostname(item.url);
  const citations = [{ title: item.title, publisher, url: item.url }];
  // Videos keep their identity: Video Player (comprehension questions) needs the
  // video, and library videos read their prefetched transcript by source + id.
  if (item.kind === 'video' && item.videoId) {
    const lib = item.library;
    const summary = item.text ?? [item.title, item.description].filter(Boolean).join('\n');
    return {
      sourceType: (lib?.source ?? 'youtube') as SourceType,
      sourceKey: lib?.id ?? item.videoId,
      title: item.title,
      summary: summary.slice(0, 3000),
      ...(item.text ? { rawText: item.text } : {}),
      citations,
    };
  }
  if (item.text) {
    return {
      sourceType: 'text',
      sourceKey: item.url,
      title: item.title,
      summary: item.text.slice(0, 3000),
      rawText: item.text,
      citations,
    };
  }
  const lines = [
    item.kind === 'image' ? `An image the class is looking at: ${item.title}.` : item.title,
    item.description,
    item.address ? `Location: ${item.address}.` : null,
  ].filter(Boolean);
  return {
    sourceType: item.kind === 'image' ? 'image' : 'text',
    sourceKey: item.url,
    title: item.title,
    summary: lines.join('\n'),
    citations,
  };
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'web';
  }
}
