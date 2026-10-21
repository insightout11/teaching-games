import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import bank from '@/data/route-place-briefings.json';
import { buildRoutePlaceCards, validateRoutePlaceCards, validateCountryBasics, validateRoutePlacePhotos, hasRepeatedDetailSentence, isSimpleA1Question } from '../../../scripts/dev/build-route-place-cards';

const copy = () => JSON.parse(JSON.stringify(bank.slice(0, 4))) as typeof bank;
describe('route-place compiler rejects editorial regressions', () => {
  it('reproduces the runtime bank from explicit source fields', () => {
    expect(buildRoutePlaceCards(readFileSync('scripts/dev/data/route-place-editorial.tsv', 'utf8'))).toEqual(bank);
  });
  it.each([
    ['file:Example.jpg', 'CC BY 4.0'],
    ['File:Example.svg', 'CC BY 4.0'],
    ['https://example.org/photo.jpg', 'CC BY 4.0'],
    ['File:Example.jpg ', 'CC BY 4.0'],
    ['File:Example.jpg', ''],
    ['', 'CC BY 4.0'],
    ['File:Example.jpg', 'CC BY-NC 4.0'],
    ['File:Example.jpg', 'CC BY-ND 4.0'],
    ['File:Example.jpg', 'Fair use'],
  ])('rejects an invalid photo pair: %s / %s', (pictureFile, pictureLicense) => {
    const places = copy().slice(0, 1);
    Object.assign(places[0].levels.A1.cards[0], { pictureFile, pictureLicense });
    expect(() => validateRoutePlacePhotos(places)).toThrow();
  });
  it.each(['CC0', 'Public domain', 'CC BY 4.0', 'CC BY-SA 3.0', 'CC BY-SA 3.0 de'])('accepts a reviewed photo with %s', pictureLicense => {
    const places = copy().slice(0, 1);
    for (const level of ['A1', 'B1'] as const) for (const card of places[0].levels[level].cards) Object.assign(card, { pictureFile: '', pictureLicense: '' });
    Object.assign(places[0].levels.A1.cards[0], { pictureFile: 'File:Example.JPG', pictureLicense });
    Object.assign(places[0].levels.B1.cards[0], { pictureFile: 'File:Example.JPG', pictureLicense });
    expect(() => validateRoutePlacePhotos(places)).not.toThrow();
  });
  it('allows blank photo fields without inventing a default file', () => {
    const source = readFileSync('scripts/dev/data/route-place-editorial.tsv', 'utf8');
    const blank = source.split('\n').map(line => line.startsWith('#') || !line ? line : line.split('\t').slice(0, 10).concat(['', '']).join('\t')).join('\n');
    const result = buildRoutePlaceCards(blank);
    expect(result.every(p => p.levels.B1.cards.every(c => c.pictureFile === '' && c.pictureLicense === ''))).toBe(true);
  });
  it('rejects reuse on another card of one place, including underscore aliases', () => {
    const places = copy().slice(0, 1);
    for (const level of ['A1', 'B1'] as const) for (const card of places[0].levels[level].cards) Object.assign(card, { pictureFile: '', pictureLicense: '' });
    Object.assign(places[0].levels.A1.cards[0], { pictureFile: 'File:Same photograph.jpg', pictureLicense: 'CC0' });
    Object.assign(places[0].levels.B1.cards[0], { pictureFile: 'File:Same photograph.jpg', pictureLicense: 'CC0' });
    Object.assign(places[0].levels.B1.cards[1], { pictureFile: 'File:Same_photograph.jpg', pictureLicense: 'CC0' });
    expect(() => validateRoutePlacePhotos(places)).toThrow('Photo reused within place');
  });
  it('requires a shared headline to use the same exact photo across levels', () => {
    const places = copy().slice(0, 1);
    for (const level of ['A1', 'B1'] as const) for (const card of places[0].levels[level].cards) Object.assign(card, { pictureFile: '', pictureLicense: '' });
    Object.assign(places[0].levels.A1.cards[0], { pictureFile: 'File:First.jpg', pictureLicense: 'CC0' });
    Object.assign(places[0].levels.B1.cards[0], { pictureFile: 'File:Second.jpg', pictureLicense: 'CC0' });
    expect(() => validateRoutePlacePhotos(places)).toThrow('Headline photo differs');
  });
  it('checks photo data in editorial input, rather than only testing the built bank', () => {
    const source = readFileSync('scripts/dev/data/route-place-editorial.tsv', 'utf8');
    const invalid = source.split('\n').map(line => line.startsWith('Asia\t1\t') ? line.split('\t').slice(0, 10).concat(['File:Example.jpg', 'CC BY-NC 4.0']).join('\t') : line).join('\n');
    expect(() => buildRoutePlaceCards(invalid)).toThrow('Photo licence');
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
    cards[0].levels.B1.cards[0].questions = [...cards[0].levels.A1.cards[0].questions];
    expect(() => validateRoutePlaceCards(cards)).not.toThrow();
  });
  it.each(['How could a long river help trade?', 'Why might farmers live here?', 'Do you think that these very tall mountains are beautiful?', 'What makes a river useful?'])('rejects an unsuitable beginner question: %s', question => {
    const cards = copy().slice(0, 1);
    cards[0].levels.A1.cards[0].questions[0] = question;
    expect(() => validateRoutePlaceCards(cards)).toThrow('Simple A1 question');
  });
  it.each(['Do you like boats?', 'Is the river long or short?', 'Have you seen a panda?', 'What colour is the fox?', 'Which do you like more: rice or bread?'])('recognises simple question forms within the length limit: %s', question => {
    expect(isSimpleA1Question(question)).toBe(question.split(/\s+/).length <= 8);
  });
  it.each([
    'It links inland plains with the Gulf of Thailand. Boats carry goods. The river reaches the Gulf of Thailand.',
    'The strait connects the Atlantic and Mediterranean. Africa lies nearby. The strait connects Atlantic and Mediterranean waters.',
    'Forests cover the mountain slopes. Rivers cross the valley. FORESTS cover the mountain slopes!',
    'The Danube is one example. It passes several countries before reaching the Black Sea. The Danube flows towards the Black Sea.',
    "Its central tower is a landmark. The temple's surface includes decorative ceramic pieces. Decorative fragments cover parts of its outer surface.",
    "A large weight hangs inside the tower. It helps reduce the building's swaying. A large suspended weight helps control movement.",
  ])('rejects repeated B1 wording: %s', detail => {
    expect(hasRepeatedDetailSentence(detail)).toBe(true);
    const cards = copy().slice(0, 1);
    cards[0].levels.B1.cards[0].detail = detail;
    expect(() => validateRoutePlaceCards(cards)).toThrow('Repeated detail sentence');
  });
  it('keeps new information about the same subject', () => {
    expect(hasRepeatedDetailSentence('The Nile flows north. Its delta reaches the Mediterranean Sea. Boats use the river.')).toBe(false);
  });
  it.each(['capital', 'animal', 'food', 'landmark'])('rejects loss of country %s coverage', subject => {
    const cards = JSON.parse(JSON.stringify(bank)) as typeof bank;
    const china = cards.find(p => p.title === 'China')!;
    const index = { capital: 0, animal: 1, food: 2, landmark: 3 }[subject]!;
    china.levels.A1.cards[index].headline = 'Different checked subject';
    china.levels.A1.cards[index].detail = 'These words are unrelated to the subject. Another sentence belongs here.';
    expect(() => validateCountryBasics(cards)).toThrow(`Country ${subject} missing: China A1`);
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
