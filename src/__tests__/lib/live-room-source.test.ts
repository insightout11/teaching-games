import { describe, expect, it } from 'vitest';
import { roomItemToSource } from '@/components/session/live-room/room-source';
import { buildSourceContext } from '@/lib/source-context';

describe('roomItemToSource', () => {
  it('grounds on full article text when the reader extracted it', () => {
    const src = roomItemToSource({ id: 'a', kind: 'article', title: '48 teams', url: 'https://www.bbc.co.uk/x', publisher: null, text: 'The tournament expands to 48 teams.' });
    expect(src).toMatchObject({ sourceType: 'text', sourceKey: 'https://www.bbc.co.uk/x', rawText: 'The tournament expands to 48 teams.' });
    expect(src.citations?.[0]).toEqual({ title: '48 teams', publisher: 'bbc.co.uk', url: 'https://www.bbc.co.uk/x' });
    expect(buildSourceContext(src)).toContain('ground ALL content ONLY in this source text');
  });

  it('describes images and places without inventing text', () => {
    const img = roomItemToSource({ id: 'i', kind: 'image', title: 'MetLife Stadium', url: 'https://a.com', publisher: 'Wikimedia', description: 'Final venue' });
    expect(img.sourceType).toBe('image');
    expect(img.summary).toContain('An image the class is looking at: MetLife Stadium.');
    expect(img.rawText).toBeUndefined();
    const place = roomItemToSource({ id: 'p', kind: 'place', title: 'Azteca', url: 'https://maps', publisher: null, address: 'Mexico City' });
    expect(place.summary).toContain('Location: Mexico City.');
  });
});
