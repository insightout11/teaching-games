import { describe, expect, it } from 'vitest';
import { debriefFirstName } from './debrief-link';

describe('debrief links', () => {
  it('show the first name only', () => {
    expect(debriefFirstName('Mia Kowalski')).toBe('Mia');
    expect(debriefFirstName('', 'Student')).toBe('Student');
  });
});
