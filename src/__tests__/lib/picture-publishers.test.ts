import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { getInputRemountKey, type InputSpec } from '@/lib/input-spec';
import { hotSeatClueCard, tabooDescriberCard } from '@/lib/secret-picture-cards';

/** Run the actual publishing effect with fixture data: testing a card formatter
 * alone would miss accidental public placement or a remount when a photo arrives.
 */
function publish(activity: string, bindings: Record<string, unknown>): InputSpec {
  const file = `src/activities/${activity}/activity.tsx`;
  const text = readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback: string | undefined;
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect') {
      const argument = node.arguments[0];
      if (argument && ts.isArrowFunction(argument) && argument.getText(source).includes(`gameKey: '${activity}'`)) callback = argument.getText(source);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!callback) throw new Error('Publisher not found: ' + activity);
  const onSetInputSpec = vi.fn();
  const values = { tabooDescriberCard, hotSeatClueCard, onSetInputSpec, students: [one, two], ...bindings };
  const code = ts.transpileModule(`const run = ${callback}; run();`, { compilerOptions: { target: ts.ScriptTarget.ES2019 } }).outputText;
  new Function(...Object.keys(values), code)(...Object.values(values));
  return onSetInputSpec.mock.calls[0][0] as InputSpec;
}
const one = { id: 'one', name: 'One' }, two = { id: 'two', name: 'Two' };
const card = { word: 'elephant', forbiddenWords: ['trunk'], description: 'A large animal.' };
const picture = { id: 'photo', title: 'Elephant', credit: 'Author · CC BY', pageUrl: 'https://commons.wikimedia.org/wiki/File:Elephant.jpg', thumbUrl: 'https://upload.wikimedia.org/thumb.jpg', imageUrl: 'https://upload.wikimedia.org/original.jpg' };

describe('private picture publishers', () => {
  it('Taboo puts photos only in the describer entry, and photo arrival preserves guesses', () => {
    const bindings = { phase: 'turn', describer: one, card, picture: null, mode: 'teams', describerTeam: 'A', teams: { A: [one], B: [two] }, cardIdx: 0 };
    const initial = publish('taboo-sprint', bindings);
    const next = publish('taboo-sprint', { ...bindings, picture });
    expect(next.perStudentData?.one).toEqual(tabooDescriberCard(card, picture));
    expect(next.perStudentData?.two).toEqual({ role: 'bench' });
    expect(next.context).toBeUndefined(); expect(next.roundId).toBeUndefined(); expect(next.allowMultiple).toBe(true);
    expect(getInputRemountKey(next)).toBe(getInputRemountKey(initial));
    expect(getInputRemountKey(publish('taboo-sprint', { ...bindings, picture, cardIdx: 1 }))).not.toBe(getInputRemountKey(next));
  });
  it('Hot Seat keeps the hot student and public fields free of secret picture data', () => {
    const bindings = { phase: 'turn', hot: one, card, picture: null, cluers: [two], clueGiver: two };
    const initial = publish('hot-seat', bindings), next = publish('hot-seat', { ...bindings, picture });
    expect(next.perStudentData?.one).toEqual({ role: 'hot' });
    expect(next.perStudentData?.two).toEqual(hotSeatClueCard(card, picture, true));
    const publicFields = { ...next };
    delete publicFields.perStudentData;
    expect(JSON.stringify(publicFields)).not.toMatch(/elephant|upload\.wikimedia|trunk/i);
    expect(getInputRemountKey(initial)).toBe(getInputRemountKey(next));
  });
  it('Hot Seat does not publish a card photo before the turn starts', () => {
    const spec = publish('hot-seat', { phase: 'ready', hot: one, card, picture, cluers: [two], clueGiver: two });
    expect(spec.perStudentData?.two).toBeUndefined();
    expect(JSON.stringify(spec)).not.toContain(picture.thumbUrl);
  });
  it('does not expose private pictures through ambiguous display-name aliases', () => {
    const other = { ...two, name: one.name };
    const hot = publish('hot-seat', { students: [one, other], phase: 'turn', hot: one, card, picture, cluers: [other], clueGiver: other });
    expect(hot.perStudentData?.[one.name]).toBeUndefined();
    expect(hot.perStudentData?.one).toEqual({ role: 'hot' });
    const taboo = publish('taboo-sprint', { students: [one, other], phase: 'turn', describer: one, card, picture, mode: 'everyone', describerTeam: null, teams: { A: [], B: [] }, cardIdx: 0 });
    expect(taboo.perStudentData?.[one.name]).toBeUndefined();
    expect(taboo.perStudentData?.two).toBeUndefined();
    expect(taboo.perStudentData?.one).toEqual(tabooDescriberCard(card, picture));
  });
});
