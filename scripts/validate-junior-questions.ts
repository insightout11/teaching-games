/** Check the Junior picture question bank against the available sticker IDs. */
import fs from 'node:fs';
import path from 'node:path';

type Sticker = { id: string; word: string };
type Question = { id?: unknown; prompt?: unknown; options?: unknown; answer?: unknown; say?: unknown };
type SetRow = { id?: unknown; topic?: unknown; questions?: unknown };
type Check = 'badSet' | 'setSize' | 'duplicateSetId' | 'badQuestion' | 'duplicateQuestionId' |
  'badOptions' | 'unknownOption' | 'duplicateOption' | 'badAnswer' | 'longPrompt' |
  'duplicatePromptOptions' | 'badSay' | 'fixedAnswerSlot' | 'opinionMix';
const checks: Record<Check, number> = {
  badSet: 0, setSize: 0, duplicateSetId: 0, badQuestion: 0, duplicateQuestionId: 0,
  badOptions: 0, unknownOption: 0, duplicateOption: 0, badAnswer: 0, longPrompt: 0,
  duplicatePromptOptions: 0, badSay: 0, fixedAnswerSlot: 0, opinionMix: 0,
};
const errors: string[] = [];
function fail(check: Check, where: string, message: string): void {
  checks[check] += 1;
  errors.push(`${where}: ${message}`);
}
const dataDir = path.resolve('src/data');
const stickers = JSON.parse(fs.readFileSync(path.join(dataDir, 'sticker-words.json'), 'utf8')) as Sticker[];
const stickerNames = new Map(stickers.map((sticker) => [sticker.id, sticker.word]));
const file = path.join(dataDir, 'junior-picture-questions.json');
if (process.argv.includes('--build')) {
  const seedFile = path.resolve('docs/library-round-21-question-seeds.txt');
  const seed = fs.readFileSync(seedFile, 'utf8');
  const blocks = seed.trim().split(/\n\s*\n/);
  const built = blocks.map((block, setIndex) => {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const [id, topic] = lines[0].split('|').map((part) => part.trim());
    if (!id || !topic) throw new Error(`Bad seed heading: ${lines[0]}`);
    let objective = 0;
    const questions = lines.slice(1).map((line, index) => {
      const [prompt, answerField, optionField] = line.split('|').map((part) => part.trim());
      if (!prompt || !answerField || !optionField) throw new Error(`Bad seed row: ${line}`);
      const others = optionField.split(',').map((part) => part.trim());
      const answer = answerField === '-' ? null : answerField;
      const options = answer === null ? others : others.slice();
      if (answer !== null) {
        options.splice((objective + setIndex) % (others.length + 1), 0, answer);
        objective += 1;
      }
      const words = options.map((option) => {
        const name = stickerNames.get(option);
        if (!name) throw new Error(`Unknown sticker in seed ${id}: ${option}`);
        return name;
      });
      const spoken = words.length === 2 ? `${words[0]} or ${words[1]}` :
        `${words.slice(0, -1).join(', ')}, or ${words[words.length - 1]}`;
      return { id: `${id}-${String(index + 1).padStart(2, '0')}`, prompt, options, answer,
        say: `${prompt} ${spoken}?` };
    });
    return { id, topic, questions };
  });
  fs.writeFileSync(file, JSON.stringify(built, null, 2) + '\n');
  console.log(`Built ${built.length} Junior topic sets from the reviewed seeds.`);
}
if (!fs.existsSync(file)) {
  fail('badSet', file, 'question bank is missing');
  console.error(errors.join('\n'));
  process.exit(1);
}
let raw: unknown;
try { raw = JSON.parse(fs.readFileSync(file, 'utf8')); }
catch (error) { fail('badSet', file, `invalid JSON: ${String(error)}`); raw = []; }
if (!Array.isArray(raw)) { fail('badSet', file, 'top-level value must be an array'); raw = []; }
const sets = raw as SetRow[];
const setIds = new Set<string>();
const questionIds = new Set<string>();
const pairs = new Set<string>();
const used = new Set<string>();
let questions = 0;
let opinions = 0;
for (const [setIndex, set] of Array.from(sets.entries())) {
  const at = `set[${setIndex}]`;
  if (!set || typeof set !== 'object' || Array.isArray(set) || typeof set.id !== 'string' || !set.id.trim() ||
      typeof set.topic !== 'string' || !set.topic.trim() || !Array.isArray(set.questions)) {
    fail('badSet', at, 'id, topic and questions are required');
    continue;
  }
  if (setIds.has(set.id)) fail('duplicateSetId', at, `duplicate set id ${set.id}`);
  setIds.add(set.id);
  const rows = set.questions as Question[];
  if (rows.length < 8 || rows.length > 12) fail('setSize', at, `expected 8–12 questions, found ${rows.length}`);
  const positions = [0, 0, 0, 0];
  let answeredInSet = 0;
  for (const [questionIndex, question] of Array.from(rows.entries())) {
    const where = `${at}.questions[${questionIndex}]`;
    questions += 1;
    if (!question || typeof question !== 'object' || Array.isArray(question) ||
        typeof question.id !== 'string' || !question.id.trim() ||
        typeof question.prompt !== 'string' || !question.prompt.trim() ||
        typeof question.say !== 'string' || !question.say.trim()) {
      fail('badQuestion', where, 'id, prompt and say are required');
      continue;
    }
    if (questionIds.has(question.id)) fail('duplicateQuestionId', where, `duplicate question id ${question.id}`);
    questionIds.add(question.id);
    if (question.prompt.trim().split(/\s+/).length > 8) fail('longPrompt', where, 'prompt exceeds eight words');
    if (!Array.isArray(question.options) || question.options.length < 2 || question.options.length > 4) {
      fail('badOptions', where, 'options must contain 2–4 sticker ids');
      continue;
    }
    const options = question.options as unknown[];
    const optionStrings = options.filter((option): option is string => typeof option === 'string');
    if (optionStrings.length !== options.length) fail('badOptions', where, 'every option must be a string');
    for (const option of optionStrings) {
      if (!stickerNames.has(option)) fail('unknownOption', where, `unknown sticker id ${option}`);
      else used.add(option);
    }
    if (new Set(optionStrings).size !== optionStrings.length) fail('duplicateOption', where, 'options repeat a sticker');
    if (question.answer === null) opinions += 1;
    else if (typeof question.answer !== 'string' || !optionStrings.includes(question.answer)) {
      fail('badAnswer', where, 'answer must be an option or null');
    } else {
      positions[optionStrings.indexOf(question.answer)] += 1;
      answeredInSet += 1;
    }
    const key = `${question.prompt.trim().toLowerCase()}|${optionStrings.slice().sort().join('|')}`;
    if (pairs.has(key)) fail('duplicatePromptOptions', where, 'repeated prompt and option set');
    pairs.add(key);
    const spoken = question.say.toLowerCase();
    if (!spoken.startsWith(question.prompt.toLowerCase()) ||
        optionStrings.some((option) => !spoken.includes((stickerNames.get(option) || option).toLowerCase()))) {
      fail('badSay', where, 'say must contain the prompt and every option word');
    }
  }
  if (answeredInSet > 0 && Math.max(...positions) > answeredInSet / 2) {
    fail('fixedAnswerSlot', at, `answer position repeats too often: ${positions.join('/')}`);
  }
}
const opinionShare = questions ? opinions / questions : 0;
if (questions && (opinionShare < 0.25 || opinionShare > 0.35)) {
  fail('opinionMix', file, `opinion share ${(opinionShare * 100).toFixed(1)}% is outside 25–35%`);
}
console.log(`Junior picture questions: ${sets.length} sets, ${questions} questions, ${opinions} opinion (${(opinionShare * 100).toFixed(1)}%), ${used.size} sticker words used.`);
console.log(`Junior checks: ${Object.entries(checks).map(([key, value]) => `${key} ${value}`).join(', ')}.`);
if (errors.length) {
  console.error(`Junior validation failed with ${errors.length} error(s):\n${errors.slice(0, 50).join('\n')}`);
  process.exitCode = 1;
} else console.log('Junior validation passed.');
