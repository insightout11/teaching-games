import { describe, expect, it } from 'vitest';
import { cleanVoteOptions, parseWouldYouRather } from '@/lib/live-room/talk-vote';

describe('talk vote options', () => {
  it('parses a typed would-you-rather question', () => {
    expect(parseWouldYouRather('Would you rather live by a river or by the sea?')).toEqual(['Live by a river', 'By the sea']);
    expect(parseWouldYouRather('would you rather fly, or be invisible')).toEqual(['Fly', 'Be invisible']);
  });

  it('ignores other questions', () => {
    expect(parseWouldYouRather('What is your favourite river?')).toBeUndefined();
    expect(parseWouldYouRather('Would you rather?')).toBeUndefined();
  });

  it('keeps exactly two distinct options', () => {
    expect(cleanVoteOptions(['Yes!', 'No'])).toEqual(['Yes', 'No']);
    expect(cleanVoteOptions(['A'])).toBeUndefined();
    expect(cleanVoteOptions(['Same', 'same'])).toBeUndefined();
  });
});
