import { describe, expect, it } from 'vitest';
import { hideName } from '@/lib/world-quiz/questions';

const jamaica = { name: 'Jamaica', iso2: 'jm', continent: 'North America', level: 2 } as Parameters<typeof hideName>[1];

describe('clue ladder hides the country name', () => {
  it('swaps the whole word only', () => {
    expect(hideName('Jamaica has colourful hummingbirds', jamaica)).toBe('This country has colourful hummingbirds');
  });
  it('drops a clue with a word made from the name', () => {
    expect(hideName('The Jamaican tody lives here', jamaica)).toBeNull();
  });
  it('leaves other clues alone', () => {
    expect(hideName("Dunn's River Falls flows over steps", jamaica)).toBe("Dunn's River Falls flows over steps");
  });
});
