import { describe, expect, it } from 'vitest';
import { studentFirstName } from './student-name';

describe('studentFirstName', () => {
  it('keeps a first name, turns a surname into an initial, drops the rest', () => {
    expect(studentFirstName('  Mia ')).toBe('Mia');
    expect(studentFirstName('Mia kowalski')).toBe('Mia K');
    expect(studentFirstName('José María García López')).toBe('José M');
    expect(studentFirstName('Ana (Lopez)')).toBe('Ana L');
    expect(studentFirstName('Bartholomewwwwwwwwwwwwwww')).toHaveLength(20);
    expect(studentFirstName('')).toBe('');
  });
});
