import { readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import * as contextHelpers from '@/lib/one-phone-context';
import type { InputSpec } from '@/lib/input-spec';

/** Execute the real publisher object with fixture data, without mounting a lesson
 * or calling generation services. This also catches a missing context wire-up at
 * the component boundary; testing a formatter alone would not catch that regression.
 */
function publishedSpec(file: string, match: string, bindings: Record<string, unknown>): InputSpec {
  const text = readFileSync(path.resolve('src', file), 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression: string | undefined;
  function visit(node: ts.Node) {
    if (!expression && ts.isObjectLiteralExpression(node)) {
      const code = node.getText(source);
      // A direct type field distinguishes an input spec from containing objects/functions.
      const type = node.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText(source) === 'type');
      if (type && code.includes(match)) expression = code;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!expression) throw new Error('No input publisher matched: ' + file + ' / ' + match);
  const js = ts.transpileModule(`const spec = (${expression});`, { compilerOptions: { target: ts.ScriptTarget.ES2019 } }).outputText;
  const values = { ...contextHelpers, ...bindings };
  return new Function(...Object.keys(values), js + '\nreturn spec;')(...Object.values(values)) as InputSpec;
}

describe('one-phone component publisher wiring', () => {
  it('Vocab Sprint carries the sentence but not the expected replacement', () => {
    const spec = publishedSpec('games/vocab-sprint/game.tsx', "gameKey: 'vocab-sprint'", { currentSentence: { sentence: 'The food was good.', weakWord: 'good', level: 'hard', targetWord: 'SECRET' }, sessionSettings: { timerSeconds: 30 }, extraSeconds: 0, raceStartedAtRef: { current: 1 } });
    expect(spec.context).toEqual([{ text: 'The food was good.' }]);
    expect(JSON.stringify(spec)).not.toContain('SECRET');
  });

  it('Dialogue Detective carries both dialogue cues, not the evaluation response', () => {
    const spec = publishedSpec('games/dialogue-detective/game.tsx', "gameKey: 'dialogue-detective'", { challenge: { context: 'At home', goal: 'Make a request', speakerA_before: 'I am busy.', speakerA_after: 'Of course.', exampleResponse: 'SECRET' } });
    expect(spec.context?.map(p => p.text)).toEqual(['At home', 'A: I am busy.', 'B: …', 'A: Of course.']);
    expect(JSON.stringify(spec)).not.toContain('SECRET');
  });

  it('Mission Selector carries the winning question during opening thoughts', () => {
    const spec = publishedSpec('activities/mission-selector/activity.tsx', "type: 'textarea'", { winningQuestion: 'Should we travel by train?' });
    expect(spec.context).toEqual([{ text: 'Should we travel by train?' }]);
  });

  it('Bluff Definition keeps the target word with the vote', () => {
    const spec = publishedSpec('activities/bluff-definition/activity.tsx', "type: 'choice'", { currentRound: { word: 'quokka' }, options: [{ text: 'A small animal', isCorrect: true }, { text: 'A tool', isCorrect: false }] });
    expect(spec.context).toEqual([{ text: 'Word: quokka' }]);
    expect(JSON.stringify(spec)).not.toContain('isCorrect');
  });

  it('Hot Take Arena retains statement and the assigned wild side', () => {
    const spec = publishedSpec('activities/hot-take-arena/activity.tsx', "type: 'text'", { statementText: 'Cars should fly.', wild: true, sideSelections: [{ studentId: 'mia', studentName: 'Mia', side: 'pro' }] });
    expect(spec.context).toEqual([{ text: 'Cars should fly.' }]);
    expect(contextHelpers.contextForPhone(spec, ['mia']).map(p => p.text)).toEqual(['Cars should fly.', 'Your side: DEFEND']);
  });

  it('Scenario Simulator includes read-lines and only the last revealed consequence', () => {
    const spec = publishedSpec('activities/scenario-simulator/activity.tsx', 'prompt: r.situation', { r: { situation: 'Choose a route', readLines: ['The bridge is blocked.'], choices: [{ label: 'A', text: 'Wait', consequence: 'UNREVEALED', goalDelta: 2 }] }, content: { storyContext: 'We must get home.' }, lastConsequence: 'Our bus broke down.' });
    expect(spec.context?.map(p => p.text)).toEqual(['We must get home.', 'Our bus broke down.', 'The bridge is blocked.']);
    expect(JSON.stringify(spec)).not.toMatch(/UNREVEALED|goalDelta/);
  });

  it('Design Studio gives phone voters the descriptions and tradeoffs', () => {
    const spec = publishedSpec('activities/design-studio/activity.tsx', "type: 'choice'", { state: { decisions: [] }, maxDecisions: 5, round: { question: 'Choose a roof', designSummary: 'A bus stop', options: [{ id: 'A', title: 'Glass', description: 'Clear panels', benefit: 'Daylight', tradeoff: 'Heat' }] } });
    expect(spec.context?.map(p => p.text).join(' ')).toContain('Clear panels');
    expect(spec.context?.map(p => p.text).join(' ')).toContain('Tradeoff: Heat');
    expect(spec.options).toEqual(['A']);
  });

  it('Evidence Cards includes the motion without telling students the assigned side', () => {
    const spec = publishedSpec('activities/evidence-cards/activity.tsx', "type: 'binary'", { card: { fact: 'Buses carry more people.', side: 'for' }, motion: { motion: 'Ban cars?' }, SIDES: ['FOR', 'AGAINST'] });
    expect(spec.context).toEqual([{ text: 'Ban cars?' }]);
    expect(spec.prompt).toContain('Buses carry more people.');
    expect(spec).not.toHaveProperty('side');
  });

  it('Evidence Cards shows the full fact while keeping old choice identifiers', () => {
    const fact = 'A long fact. '.repeat(15) + 'Essential final detail.';
    const spec = publishedSpec('activities/evidence-cards/activity.tsx', "type: 'choice'", { cards: [{ fact }], motion: { motion: 'Ban cars?' }, cardLabel: () => 'legacy-short-value' });
    expect(spec.optionLabels).toEqual(['1. ' + fact]);
    expect(spec.options).toEqual(['legacy-short-value']);
  });

  it('Compare It includes the item facts, not the model comparison', () => {
    const spec = publishedSpec('activities/compare-it/activity.tsx', "gameKey: 'compare-it'", { round: { items: [{ name: 'Train', fact: '2 hours' }, { name: 'Bus', fact: '4 hours' }], models: ['SECRET'] }, per: {} });
    expect(spec.context?.map(p => p.text)).toEqual(['Train: 2 hours', 'Bus: 4 hours']);
    expect(JSON.stringify(spec)).not.toContain('SECRET');
  });

  it('the meal menu includes what the dish actually is', () => {
    const spec = publishedSpec('activities/trip-meal/activity.tsx', "type: 'choice'", { content: { city: 'Bangkok' }, dishes: [{ name: 'Som tam', whatItIs: 'Green papaya salad', note: 'Often spicy', price: '50 baht', tier: '$' }] });
    expect(spec.context?.[0].text).toContain('Green papaya salad');
    expect(spec.optionLabels?.[0]).toContain('50 baht');
  });

  it('the transport choice includes price, time and notes', () => {
    const spec = publishedSpec('activities/trip-getting-there/activity.tsx', "type: 'choice'", { content: { city: 'Bangkok' }, options: [{ mode: 'Train', approxTimeMin: 30, approxCost: '50 baht', note: 'Walk upstairs' }] });
    expect(spec.context?.[0].text).toContain('30 minutes');
    expect(spec.context?.[0].text).toContain('Walk upstairs');
    expect(spec.optionLabels?.[0]).toContain('50 baht');
  });

  it('the attractions vote keeps descriptions and prices', () => {
    const spec = publishedSpec('activities/trip-attractions/activity.tsx', "type: 'choice'", { BOARD_KEY: 'trip-attractions', content: { city: 'Bangkok' }, attractions: [{ name: 'Museum', whatItIs: 'Historic boats', price: '100 baht' }] });
    expect(spec.context).toEqual([{ text: 'Museum: Historic boats (100 baht)' }]);
  });

  it('performed exchanges carry the current line and preceding cue', () => {
    const spec = publishedSpec('activities/shared/performed-exchange.tsx', 'prompt: context,', { gameKey: 'trip-hotel', context: 'Check in', lineIndex: 1, script: [{ speaker: 'service', text: 'Your name?' }, { speaker: 'traveller', text: 'My name is ___.', hint: 'your name' }], serviceRole: 'Receptionist', travellerRole: 'Guest', servicePhrases: [], travellerPhrases: [] });
    expect(spec.context?.map(p => p.text)).toEqual(['Receptionist: Your name?', 'Guest: My name is ___. (your name)']);
  });

  it('Take 2 gives the situation and goal without an invented model response', () => {
    const spec = publishedSpec('activities/shared/performed-exchange.tsx', 'prompt: `Take 2:', { gameKey: 'trip-hotel', context: 'Check in', problem: { title: 'No booking', serviceOpener: 'I cannot find your booking.', goal: 'Explain and ask for help.', phrases: ['Could you check again?'], model: 'SECRET' } });
    expect(spec.context?.map(p => p.text)).toContain('I cannot find your booking.');
    expect(spec.instruction).toBe('Explain and ask for help.');
    expect(JSON.stringify(spec)).not.toContain('SECRET');
  });

  it('Picture Stories attaches original pages, not answer fields', () => {
    const spec = publishedSpec('activities/picture-stories/activity.tsx', "type: 'choice'", { story: { id: 's', pages: [{ text: 'A dog ran away.', pictures: ['dog'] }] }, qIndex: 0, question: { prompt: 'Who ran?', options: ['dog', 'cat'], answer: 'dog' }, stickerLabel: (s: string) => s });
    expect(spec.context?.[0].text).toBe('A dog ran away.');
    expect(spec).not.toHaveProperty('answer');
  });

  it('Read Aloud keeps the original passage with a gist question', () => {
    const spec = publishedSpec('activities/read-aloud/activity.tsx', 'prompt: gist.q', { gist: { q: 'Who ran?', options: ['Mia', 'Joe'], correctIndex: 0 }, gistIdx: 0, passages: [{ text: 'Mia ran home.' }] });
    expect(spec.context).toEqual([{ text: 'Mia ran home.' }]);
    expect(spec).not.toHaveProperty('correctIndex');
  });

  it('Cabin Mystery voting includes only released public evidence', () => {
    const spec = publishedSpec('activities/cabin-mystery/activity.tsx', "type: 'cabin-vote'", { content: { incident: 'A bag is missing.', solution: 'SECRET' }, activeCards: [{ label: 'Tag', content: 'Blue tag', implication: 'SECRET' }, { label: 'Receipt', content: 'UNREVEALED' }], revealedCardCount: 1, perStudentData: {} });
    expect(spec.context?.map(p => p.text)).toEqual(['A bag is missing.', 'Tag: Blue tag']);
    expect(JSON.stringify(spec)).not.toMatch(/SECRET|UNREVEALED/);
  });
});
