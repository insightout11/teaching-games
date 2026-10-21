import { describe, expect, it } from 'vitest';
import { quickVoteOptions } from '@/lib/live-room/talk-vote';

describe('quick class vote choices', () => {
  it('uses Yes and No only for yes-no questions', () => {
    expect(quickVoteOptions('Do you like giant pandas?')).toEqual(['Yes', 'No']);
    expect(quickVoteOptions('What do these animals eat in the dark?')).toBeUndefined();
    expect(quickVoteOptions('How do cameras survive the water pressure?')).toBeUndefined();
  });
  it('takes the two sides from an either-or question', () => {
    expect(quickVoteOptions('Would you rather swim or fly?')).toEqual(['Swim', 'Fly']);
    expect(quickVoteOptions('Which do you like more: cats or dogs?')).toEqual(['Cats', 'Dogs']);
  });
});
