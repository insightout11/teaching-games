import { describe, expect, it, vi } from 'vitest';
import { checkedPicture, createPictureCache, pictureQuery, revealedPictureQuery } from '@/lib/free-picture-cache';
import type { FreePicture } from '@/lib/sources/wikimedia-images';

const photo: FreePicture = { id: '1', title: 'A cat', credit: 'Photographer · CC BY-SA', pageUrl: 'https://commons.wikimedia.org/wiki/File:Cat.jpg',
  thumbUrl: 'https://upload.wikimedia.org/cat-thumb.jpg', imageUrl: 'https://upload.wikimedia.org/cat.jpg' };

describe('free picture queries and metadata', () => {
  it('accepts only explicit short search phrases, never inferring from a word', () => {
    expect(pictureQuery('  red  apple fruit  ')).toBe('red apple fruit');
    [undefined, null, '', 'honesty', 'although', 'one two three four five six', 123, 'x'.repeat(101)].forEach(value => expect(pictureQuery(value)).toBe(''));
  });
  it('does not expose a quiz/gap/precise-word query until reveal', () => {
    expect(revealedPictureQuery('France country map', false)).toBe('');
    expect(revealedPictureQuery('Eiffel Tower Paris', false)).toBe('');
    expect(revealedPictureQuery('red apple fruit', true)).toBe('red apple fruit');
    expect(revealedPictureQuery('', true)).toBe('');
  });
  it('requires an attribution link, credit and Wikimedia image URLs', () => {
    expect(checkedPicture(photo)).toEqual(photo);
    expect(checkedPicture({ ...photo, thumbUrl: 'https://thumb.wikimedia.org/cat.jpg' })).not.toBeNull();
    [{ ...photo, credit: '' }, { ...photo, thumbUrl: 'https://example.com/a.jpg' }, { ...photo, pageUrl: 'javascript:alert(1)' },
      { ...photo, imageUrl: 'http://upload.wikimedia.org/a.jpg' }, {}, null].forEach(value => expect(checkedPicture(value)).toBeNull());
  });
});

describe('per-session lookup cache', () => {
  it('deduplicates in-flight and completed lookups including case and whitespace', async () => {
    const lookup = vi.fn(async () => photo);
    const cache = createPictureCache(lookup);
    const first = cache.get('s', 'red apple');
    expect(cache.get('s', ' RED   APPLE ')).toBe(first);
    expect(await first).toEqual(photo);
    expect(await cache.get('s', 'red apple')).toEqual(photo);
    expect(lookup).toHaveBeenCalledTimes(1);
    await cache.get('other', 'red apple');
    expect(lookup).toHaveBeenCalledTimes(2);
  });
  it('caches empty results, rejected requests and synchronous errors', async () => {
    const lookup = vi.fn().mockResolvedValueOnce(null).mockRejectedValueOnce(new Error('offline')).mockImplementationOnce(() => { throw new Error('offline'); });
    const cache = createPictureCache(lookup);
    for (const query of ['empty result', 'network failure', 'sync failure']) {
      expect(await cache.get('s', query)).toBeNull();
      expect(await cache.get('s', query)).toBeNull();
    }
    expect(lookup).toHaveBeenCalledTimes(3);
  });
  it('does not make requests without a session or with absent/abstract metadata', async () => {
    const lookup = vi.fn(async () => photo);
    const cache = createPictureCache(lookup);
    await Promise.all([cache.get(null, 'red apple'), cache.get('s', ''), cache.get('s', undefined)]);
    expect(lookup).not.toHaveBeenCalled();
  });
  it('runs at most six requests across sessions and drains the queue', async () => {
    let active = 0, maximum = 0;
    const releases: Array<() => void> = [];
    const lookup = vi.fn(() => new Promise<FreePicture | null>(resolve => {
      active++; maximum = Math.max(active, maximum);
      releases.push(() => { active--; resolve(photo); });
    }));
    const cache = createPictureCache(lookup);
    const pending = Array.from({ length: 14 }, (_, i) => cache.get(`session-${i % 2}`, `picture number ${i}`));
    await vi.waitFor(() => expect(lookup).toHaveBeenCalledTimes(6));
    while (releases.length) {
      releases.splice(0).forEach(release => release());
      // Flush completion/finally and the next queued wave.
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    expect(await Promise.all(pending)).toHaveLength(14);
    expect(maximum).toBe(6);
    expect(active).toBe(0);
  });
});
