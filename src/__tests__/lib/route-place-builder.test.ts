import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import bank from '@/data/route-place-briefings.json';
import { buildRoutePlaceCards, validateRoutePlaceCards } from '../../../scripts/dev/build-route-place-cards';

const copy = () => JSON.parse(JSON.stringify(bank.slice(0, 4))) as typeof bank;
describe('route-place compiler rejects editorial regressions', () => {
  it('reproduces the runtime bank from explicit source fields', () => {
    expect(buildRoutePlaceCards(readFileSync('scripts/dev/data/route-place-editorial.tsv', 'utf8'))).toEqual(bank);
  });
  it('does not invent text for a missing card', () => {
    const source = readFileSync('scripts/dev/data/route-place-editorial.tsv', 'utf8');
    expect(() => buildRoutePlaceCards(source.split('\n').filter(line => !line.startsWith('Asia\t5\t')).join('\n'))).toThrow('Card count');
  });
  it('rejects one question used on a fourth distinct place', () => {
    const cards = copy();
    cards.forEach(p => { p.levels.B1.cards[0].questions[0] = 'How could a river help a farmer?'; });
    expect(() => validateRoutePlaceCards(cards)).toThrow('more than three places');
  });
  it('counts a question in both levels of one place only once', () => {
    const cards = copy().slice(0, 1);
    cards[0].levels.A1.cards[0].questions = [...cards[0].levels.B1.cards[0].questions];
    expect(() => validateRoutePlaceCards(cards)).not.toThrow();
  });
  it('does not disguise a repeated question with case, punctuation or spacing', () => {
    const cards = copy();
    const variants = ['How could a river help a farmer?', 'HOW COULD A RIVER HELP A FARMER?', 'How  could a river help a farmer?', 'How could a river help a farmer ?'];
    cards.forEach((p, i) => { p.levels.B1.cards[0].questions[0] = variants[i]; });
    expect(() => validateRoutePlaceCards(cards)).toThrow('more than three places');
  });
  it.each(['repeated headline', 'duplicate headline', 'repeated picture', 'landscape query', 'replacement character', 'country filler'])('rejects %s', defect => {
    const cards = copy().slice(0, 1), card = cards[0].levels.B1.cards[0];
    if (defect === 'repeated headline') card.detail = card.headline + '. ' + card.detail;
    if (defect === 'duplicate headline') card.headline = cards[0].levels.B1.cards[1].headline;
    if (defect === 'repeated picture') card.picture = cards[0].levels.B1.cards[1].picture;
    if (defect === 'landscape query') card.picture = 'Asia landscape';
    if (defect === 'replacement character') card.detail += '\uFFFD';
    if (defect === 'country filler') card.detail = 'Example is a city here. This is a dated estimate. Nothing changes.';
    expect(() => validateRoutePlaceCards(cards)).toThrow();
  });
});
