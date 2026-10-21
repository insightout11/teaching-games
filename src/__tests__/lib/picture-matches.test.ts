import { describe, expect, it } from 'vitest';
import { pictureMatches } from '@/lib/sources/wikimedia-images';

describe('picture matches its search', () => {
  it('keeps a photo of the animal itself', () => {
    expect(pictureMatches('Philippine eagle Philippines', 'File:Philippine Eagle (Pithecophaga jefferyi).jpg')).toBe(true);
    expect(pictureMatches('Giant panda China', 'File:Giant Panda Eating.jpg')).toBe(true);
  });
  it('drops a different animal that shares a word', () => {
    expect(pictureMatches('Philippine eagle Philippines', 'File:Philippine Eagle-Owl (Bubo philippensis).jpg')).toBe(false);
    expect(pictureMatches('Philippine eagle Philippines', 'File:Philippine tarsier on a branch.jpg')).toBe(false);
  });
});
