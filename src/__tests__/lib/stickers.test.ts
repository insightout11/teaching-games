import { describe, expect, it } from 'vitest';
import { stickerIdFor } from '@/lib/stickers';

const ids = new Set(['apple', 'swim', 'mother', 'foot', 'strawberry', 'ice-cream', 'french-fries', 'dance', 'run', 'box']);

describe('stickerIdFor', () => {
  it('matches base forms, plurals and verb forms', () => {
    expect(stickerIdFor('Apples', ids)).toBe('apple');
    expect(stickerIdFor('an apple', ids)).toBe('apple');
    expect(stickerIdFor('strawberries', ids)).toBe('strawberry');
    expect(stickerIdFor('boxes', ids)).toBe('box');
    expect(stickerIdFor('swimming', ids)).toBe('swim');
    expect(stickerIdFor('dancing', ids)).toBe('dance');
    expect(stickerIdFor('ran', ids)).toBe('run');
    expect(stickerIdFor('feet', ids)).toBe('foot');
  });
  it('uses aliases and multi-word ids', () => {
    expect(stickerIdFor('Mum', ids)).toBe('mother');
    expect(stickerIdFor('ice cream', ids)).toBe('ice-cream');
    expect(stickerIdFor('chips', ids)).toBe('french-fries');
  });
  it('gives no picture for unknown words or long phrases', () => {
    expect(stickerIdFor('because', ids)).toBeNull();
    expect(stickerIdFor('I like to eat apples every day', ids)).toBeNull();
    expect(stickerIdFor('', ids)).toBeNull();
  });
});
