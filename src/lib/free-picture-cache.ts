import type { FreePicture } from '@/lib/sources/wikimedia-images';

/** No fallback to a word/answer: absent or abstract-word metadata means no picture. */
export function pictureQuery(value: unknown): string {
  if (typeof value !== 'string') return '';
  const query = value.trim().replace(/\s+/g, ' ');
  const count = query.split(' ').length;
  return query.length <= 100 && count >= 2 && count <= 5 ? query : '';
}

/** Free search results are not semantically reviewed. Quiz pictures wait for the reveal,
 * even if a generated query looks neutral: a country's lead picture could show its capital.
 */
export const revealedPictureQuery = (value: unknown, revealed: boolean) => revealed ? pictureQuery(value) : '';

function onHost(value: unknown, host: string): value is string {
  try { const url = new URL(String(value)); return url.protocol === 'https:' && url.hostname === host; } catch { return false; }
}
const onImageHost = (value: unknown) => onHost(value, 'upload.wikimedia.org') || onHost(value, 'thumb.wikimedia.org');

export function checkedPicture(value: unknown): FreePicture | null {
  if (!value || typeof value !== 'object') return null;
  const picture = value as FreePicture;
  return typeof picture.id === 'string' && typeof picture.title === 'string'
    && typeof picture.credit === 'string' && picture.credit.trim().length > 0
    && onImageHost(picture.thumbUrl) && onImageHost(picture.imageUrl)
    && onHost(picture.pageUrl, 'commons.wikimedia.org') ? picture : null;
}

/** One lookup per normalised query/session, including failures and concurrent callers.
 * The shared queue limits all sessions combined to six concurrent requests.
 */
export function createPictureCache(lookup: (sessionId: string, query: string) => Promise<FreePicture | null>) {
  const sessions = new Map<string, Map<string, Promise<FreePicture | null>>>();
  const queue: Array<() => void> = [];
  let active = 0;
  function pump() {
    while (active < 6 && queue.length) {
      const run = queue.shift()!;
      active++;
      run();
    }
  }
  return {
    get(sessionId: string | null | undefined, value: unknown): Promise<FreePicture | null> {
      const query = pictureQuery(value);
      if (!sessionId || !query) return Promise.resolve(null);
      let cache = sessions.get(sessionId);
      if (!cache) { cache = new Map(); sessions.set(sessionId, cache); }
      const key = query.toLowerCase();
      const previous = cache.get(key);
      if (previous) return previous;
      const result = new Promise<FreePicture | null>((resolve) => {
        queue.push(() => {
          Promise.resolve().then(() => lookup(sessionId, query)).then(checkedPicture, () => null)
            .then(resolve).finally(() => { active--; pump(); });
        });
      });
      cache.set(key, result);
      pump();
      return result;
    },
  };
}
