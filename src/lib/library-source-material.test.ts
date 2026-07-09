import { describe, expect, it } from 'vitest';
import { getLibrarySourceMaterial } from './library-source-material';

describe('getLibrarySourceMaterial', () => {
  it('resolves World Flight video library refs into launchable source material', () => {
    const material = getLibrarySourceMaterial({
      kind: 'library',
      sourceType: 'world-flight',
      id: 'world-flight-singapore-hawker-culture-video',
      title: 'Singapore - Why Hawker Culture Matters',
    });

    expect(material).toMatchObject({
      sourceType: 'world-flight',
      sourceKey: 'world-flight-singapore-hawker-culture-video',
      title: expect.stringContaining('Singapore - Why Hawker Culture Matters'),
      duration: expect.any(Number),
    });
    expect(material?.summary).toContain('hawker');
  });

  it('resolves reading library refs into source material', () => {
    const material = getLibrarySourceMaterial({
      kind: 'library',
      sourceType: 'voa',
      id: 'voa-food-waste',
      title: 'Food Waste Around the World',
    });

    expect(material).toMatchObject({
      sourceType: 'voa',
      sourceKey: 'voa-food-waste',
      title: expect.stringContaining('Food Waste Around the World'),
      wordCount: expect.any(Number),
    });
  });

  it('returns null for missing or non-library refs', () => {
    expect(getLibrarySourceMaterial(null)).toBeNull();
    expect(getLibrarySourceMaterial({
      kind: 'library',
      sourceType: 'world-flight',
      id: 'missing',
      title: 'Missing',
    })).toBeNull();
  });
});
