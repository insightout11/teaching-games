import { describe, expect, it } from 'vitest';
import { splitNames } from '@/components/discovery/FirstClassSetup';

describe('class list paste', () => {
  it('splits by line, comma or semicolon, trims and drops repeats', () => {
    expect(splitNames('Ana\nBen, Chen;  Dia \n\nBen')).toEqual(['Ana', 'Ben', 'Chen', 'Dia']);
  });
});
