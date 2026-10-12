import { describe, expect, it } from 'vitest';
import { fallbackSpeakSituation, speakSituationIsTalk, type SpeakSituation } from '@/lib/speak-check';

const make = (situation: string, natural: string): SpeakSituation => ({
  situation,
  canDo: 'Talk about it',
  before: { replies: ['Yes.', natural, 'I am of the opinion that it is good.', 'I like it very much the video.'], natural: 1 },
  after: { replies: [natural, 'No.', 'It is acceptable to me.', 'Me like it.'], natural: 0 },
});

describe('speakSituationIsTalk', () => {
  it('rejects a knowledge question with a textbook answer', () => {
    expect(speakSituationIsTalk(make(
      'You are at school with a friend. Your friend asks, "I heard humans are at the top of the food chain, but what is a food chain anyway?"',
      'It is a model that shows how energy flows between living things in an ecosystem.',
    ))).toBe(false);
    expect(speakSituationIsTalk(make('Your friend asks: "What is a food chain?"', 'I think it is about who eats who.'))).toBe(false);
    expect(speakSituationIsTalk(make('Your classmate says: "How does a volcano work?"', 'I am not sure, but I think it gets very hot.'))).toBe(false);
  });

  it('accepts real conversation', () => {
    expect(speakSituationIsTalk(make('You just watched a video with a friend. Your friend says: "That was cool! Which animal did you like best?"', 'I liked the eagle best, because it was so fast. What about you?'))).toBe(true);
    expect(speakSituationIsTalk(make('A new friend asks: "What do you think about football?"', "Honestly, I love it. I play every weekend with my cousins."))).toBe(true);
    expect(speakSituationIsTalk(make('The waiter says: "What is a good time for your table?"', 'Seven would be great, thanks.'))).toBe(true);
    expect(speakSituationIsTalk(fallbackSpeakSituation('space'))).toBe(true);
  });
});
