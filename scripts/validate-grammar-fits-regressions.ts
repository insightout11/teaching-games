/** Regression fixtures for the Round 29 checker, including the examples rejected in review. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { exampleUsesGrammarTarget, validateGrammarFitRows } from './library-grammar-fits-validator';

const invalid = [
  ['past simple', 'A track fossil marks where something walked.'],
  ['past simple', 'We have built a robot.'],
  ['passive voice', 'The cook chopped carrots.'],
  ['comparatives & superlatives', 'I drink water.'],
  ['present perfect', 'I have a new bike.'],
  ['conditional', 'We will go outside.'],
  ['future (going to)', 'We will visit Mars.'],
  ['future (will)', 'The rocket launched yesterday.'],
  ['present continuous', 'The cat sleeps on the sofa.'],
  ['past continuous', 'The crowd cheered loudly.'],
  ['past perfect', 'We had a camera.'],
  ['present perfect continuous', 'I have tried Spanish.'],
  ['future continuous', 'We will travel tomorrow.'],
  ['relative clause', 'Editing decides which moments the viewer sees.'],
  ['reported speech', 'Her friend feels upset.'],
  ['question forms', 'Would you draw sunrise or sunset?'],
];
for (const [target, example] of invalid) assert.equal(exampleUsesGrammarTarget(target, example), false, `${target}: ${example}`);
type Row = { id: string; ageBand: string; grammarFits: Array<{ target: string; why: string; example: string }> };
const rows: Row[] = JSON.parse(fs.readFileSync('src/data/topic-briefings.json', 'utf8'));
const clone = (): Row[] => JSON.parse(JSON.stringify(rows));
const errors: string[] = [];
validateGrammarFitRows(rows, (_, message) => errors.push(message));
assert.equal(errors.length, 0);
const duplicate = clone();
duplicate[1].grammarFits[0].why = duplicate[0].grammarFits[0].why;
duplicate[1].grammarFits[0].example = duplicate[0].grammarFits[0].example;
const duplication = validateGrammarFitRows(duplicate, () => undefined);
assert.equal(duplication.repeatedWhys, 1);
assert.equal(duplication.repeatedExamples, 1);
const badKids = clone();
badKids[1].grammarFits[1].example = 'If I saved more, I will buy a dog.';
assert.equal(validateGrammarFitRows(badKids, () => undefined).kidsTargetErrors, 1);
const uniform = rows.map((row) => ({ ...row, grammarFits: [
  { target: 'present simple', why: row.id, example: 'Cats sleep on the sofa.' },
  { target: 'question forms', why: `${row.id} survey`, example: 'Where do you live?' },
] }));
const distributionErrors: string[] = [];
validateGrammarFitRows(uniform, (_, message) => distributionErrors.push(message));
for (const expected of ['exceeds 35%', 'exceeds 20%', 'need 10 targets']) assert.ok(distributionErrors.some((message) => message.includes(expected)), expected);
console.log('Grammar checker regressions passed: 16 invalid forms; repeated why/example, invalid kids conditional, both frequency caps and target diversity rejected.');
