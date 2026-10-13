import { describe, expect, it } from 'vitest';
import { caughtGist, fallbackGist, listeningWindow, validPack, windowTranscript, WINDOW_CAP } from './listening-pack';
import worldFlight from '../data/world-flight-library.json';
import { listLibraryEntriesWithListeningPack } from './library-source-material';

const pack = { segments: [
  { start: 40, end: 55, question: 'q1', options: ['a', 'b', 'c'], correctIndex: 0, keyLine: 'x' },
  { start: 100, end: 115, question: 'q2', options: ['a', 'b', 'c'], correctIndex: 1, keyLine: 'y' },
  { start: 200, end: 214, question: 'q3', options: ['a', 'b', 'c'], correctIndex: 2, keyLine: 'z' },
] };

describe('listening packs', () => {
  it('World Flight packs have complete questions and usable timed windows', () => {
    let count = 0;
    worldFlight.forEach((entry) => {
      const raw = (entry as unknown as { listeningPack?: unknown }).listeningPack;
      if (!raw) return;
      count++;
      const parsed = validPack(raw);
      expect(parsed, entry.id).not.toBeNull();
      if (!parsed) return;
      expect(parsed.segments.length, entry.id).toBeGreaterThanOrEqual(3);
      expect(parsed.segments.length, entry.id).toBeLessThanOrEqual(5);
      expect(parsed.gist?.length, entry.id).toBe(3);
      expect(parsed.harder, entry.id).toBeDefined();
      expect(parsed.words?.length, entry.id).toBeGreaterThanOrEqual(4);
      expect(parsed.words?.length, entry.id).toBeLessThanOrEqual(6);
      const segments = parsed.segments.slice().sort((a, b) => a.start - b.start);
      segments.forEach((segment, i) => {
        expect(segment.end - segment.start, entry.id).toBeGreaterThanOrEqual(12);
        expect(segment.end - segment.start, entry.id).toBeLessThanOrEqual(30);
        expect(segment.options.length, entry.id).toBe(3);
        expect(segment.keyLine.trim().length, entry.id).toBeGreaterThan(0);
        if (i) expect(segment.start, entry.id).toBeGreaterThanOrEqual(segments[i - 1].end);
      });
      expect(segments[segments.length - 1].end - segments[0].start, entry.id).toBeLessThanOrEqual(WINDOW_CAP);
      [0, 1, 2].forEach((position) => expect(segments.some((s) => s.correctIndex === position), entry.id).toBe(true));
    });
    console.log(`World Flight listening pack checker: ${count} packs checked.`);
  });

  it('every library pack is valid', () => {
    const all = listLibraryEntriesWithListeningPack();
    expect(all.length).toBeGreaterThanOrEqual(30);
    all.forEach(({ entry }) => expect(validPack(entry.listeningPack), entry.id).not.toBeNull());
  });

  it('windows around the segments, capped for kids and teens', () => {
    expect(listeningWindow(pack, false)).toEqual({ start: 32, end: 212 });
    expect(listeningWindow(pack, true)).toEqual({ start: 32, end: 122 });
  });

  it('cuts the transcript to the window', () => {
    const raw = JSON.stringify([{ text: 'before', offset: 10000 }, { text: 'inside', offset: 50000 }, { text: 'after', offset: 300000 }]);
    expect(windowTranscript(raw, 32, 212)).toEqual(['inside']);
    expect(windowTranscript('not json', 0, 10)).toEqual([]);
  });

  it('fallback gist puts the right title among decoys', () => {
    const g = fallbackGist('Busy Ants', ['Rainforests', 'Volcanoes'])[0];
    expect(g.options[g.correctIndex]).toBe('Busy Ants');
  });

  it('counts students who caught the gist (2 of 3)', () => {
    const qs = [{ q: 'a', options: ['x', 'y'], correctIndex: 0 }, { q: 'b', options: ['x', 'y'], correctIndex: 1 }, { q: 'c', options: ['x', 'y'], correctIndex: 0 }];
    expect(caughtGist({ s1: { 0: 0, 1: 1, 2: 1 }, s2: { 0: 1, 1: 0, 2: 0 } }, qs, 3)).toEqual({ caught: 1, of: 2 });
  });
});
