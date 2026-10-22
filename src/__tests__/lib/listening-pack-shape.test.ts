import { describe, expect, it } from 'vitest';
import kidsLibrary from '@/data/kids-library.json';
import tededLibrary from '@/data/teded-library.json';
import natgeoLibrary from '@/data/natgeo-library.json';
import listeningLibrary from '@/data/listening-library.json';
import type { ListeningPack } from '@/lib/listening-pack';
import { validPack } from '@/lib/listening-pack';
import { listLibraryEntriesWithListeningPack } from '@/lib/library-source-material';

interface LibraryEntryWithPack {
  id: string;
  listeningPack?: ListeningPack;
}

function assertValidPackShape(id: string, pack: ListeningPack | undefined) {
  expect(pack, `${id} should have a listeningPack`).toBeDefined();
  if (!pack) return;

  expect(validPack(pack), `${id} should pass validPack()`).not.toBeNull();

  expect(Array.isArray(pack.segments), `${id} segments should be an array`).toBe(true);
  expect(pack.segments.length, `${id} should have at least 3 segments`).toBeGreaterThanOrEqual(3);
  expect(pack.segments.length, `${id} should have at most 4 segments`).toBeLessThanOrEqual(4);

  pack.segments.forEach((segment, idx) => {
    const label = `${id}.segments[${idx}]`;
    expect(typeof segment.start, `${label}.start`).toBe('number');
    expect(typeof segment.end, `${label}.end`).toBe('number');
    expect(segment.start, `${label} start < end`).toBeLessThan(segment.end);

    expect(typeof segment.question, `${label}.question`).toBe('string');
    expect(segment.question.trim().length, `${label}.question non-empty`).toBeGreaterThan(0);

    expect(Array.isArray(segment.options), `${label}.options array`).toBe(true);
    expect(segment.options, `${label} should have 3 options`).toHaveLength(3);
    segment.options.forEach((opt: string, optIdx: number) => {
      expect(typeof opt, `${label}.options[${optIdx}]`).toBe('string');
      expect(opt.trim().length, `${label}.options[${optIdx}] non-empty`).toBeGreaterThan(0);
    });
    expect(new Set(segment.options).size, `${label} options should be distinct`).toBe(3);

    expect(Number.isInteger(segment.correctIndex), `${label}.correctIndex integer`).toBe(true);
    expect(segment.correctIndex, `${label}.correctIndex >= 0`).toBeGreaterThanOrEqual(0);
    expect(segment.correctIndex, `${label}.correctIndex < 3`).toBeLessThan(3);

    expect(typeof segment.keyLine, `${label}.keyLine`).toBe('string');
    expect(segment.keyLine.trim().length, `${label}.keyLine non-empty`).toBeGreaterThan(0);
  });

  expect(Array.isArray(pack.gist), `${id}.gist should be an array`).toBe(true);
  expect(pack.gist, `${id} should have 3 gist questions`).toHaveLength(3);
  (pack.gist ?? []).forEach((gistQ, idx) => {
    const label = `${id}.gist[${idx}]`;
    expect(typeof gistQ.q, `${label}.q`).toBe('string');
    expect(gistQ.q.trim().length, `${label}.q non-empty`).toBeGreaterThan(0);
    expect(gistQ.options, `${label} should have 3 options`).toHaveLength(3);
    expect(new Set(gistQ.options).size, `${label} options should be distinct`).toBe(3);
    expect(Number.isInteger(gistQ.correctIndex), `${label}.correctIndex integer`).toBe(true);
    expect(gistQ.correctIndex, `${label}.correctIndex >= 0`).toBeGreaterThanOrEqual(0);
    expect(gistQ.correctIndex, `${label}.correctIndex < 3`).toBeLessThan(3);
  });

  if (pack.harder) {
    expect(pack.harder.q.trim().length, `${id}.harder.q non-empty`).toBeGreaterThan(0);
    expect(pack.harder.options, `${id}.harder should have 3 options`).toHaveLength(3);
    expect(Number.isInteger(pack.harder.correctIndex), `${id}.harder.correctIndex`).toBe(true);
    expect(pack.harder.correctIndex).toBeGreaterThanOrEqual(0);
    expect(pack.harder.correctIndex).toBeLessThan(3);
  }

  if (pack.words) {
    expect(pack.words.length, `${id}.words non-empty`).toBeGreaterThan(0);
    for (const wordEntry of pack.words) {
      expect(wordEntry.word.trim().length, `${id} word non-empty`).toBeGreaterThan(0);
      expect(wordEntry.meaning.trim().length, `${id} meaning non-empty`).toBeGreaterThan(0);
    }
  }
}

describe('listeningPack shape across libraries', () => {
  it('validates listeningPack shape in kids, teded, natgeo, and listening libraries without exact total-count assertions', () => {
    const libraries: Array<{ name: string; entries: LibraryEntryWithPack[] }> = [
      { name: 'listening-library', entries: listeningLibrary as unknown as LibraryEntryWithPack[] },
      { name: 'kids-library', entries: kidsLibrary as unknown as LibraryEntryWithPack[] },
      { name: 'teded-library', entries: tededLibrary as unknown as LibraryEntryWithPack[] },
      { name: 'natgeo-library', entries: natgeoLibrary as unknown as LibraryEntryWithPack[] },
    ];

    for (const lib of libraries) {
      const withPacks = lib.entries.filter((entry) => Boolean(entry.listeningPack));
      expect(withPacks.length, `${lib.name} should have entries with listeningPack`).toBeGreaterThan(0);
      for (const entry of withPacks) {
        assertValidPackShape(entry.id, entry.listeningPack);
      }
    }
  });

  it('validates every library entry returned by listLibraryEntriesWithListeningPack', () => {
    const all = listLibraryEntriesWithListeningPack();
    expect(all.length).toBeGreaterThan(0);
    for (const { entry } of all) {
      assertValidPackShape(String(entry.id), entry.listeningPack as ListeningPack);
    }
  });
});
