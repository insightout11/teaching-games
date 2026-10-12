/** Validate the original reading material for unsourced ready-course lessons. */
import fs from 'node:fs';
import path from 'node:path';

type Course = { id: string; level: string; lessons: Array<{ title: string; source?: unknown }> };
type Entry = { courseId: string; lessonIndex: number; title: string; level: string; text: string; words: Array<{ word: string; meaning: string }>; questions: Array<{ q: string; a: string }>; talk: string[] };
const dataDir = path.resolve('src/data');
const courses: Course[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'ready-courses.json'), 'utf8'));
const entries: Entry[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'course-lesson-texts.json'), 'utf8'));
const selectedAt = process.argv.indexOf('--course');
const selected = selectedAt >= 0 ? process.argv[selectedAt + 1] : undefined;
if (selectedAt >= 0 && (!selected || !courses.some((course) => course.id === selected))) throw new Error('unknown --course');
const levels: Record<string, string> = { Beginner: 'A1', Easy: 'A2', Intermediate: 'B1', Advanced: 'B2' };
const ranges: Record<string, [number, number]> = { A1: [60, 90], A2: [90, 130], B1: [150, 200], B2: [200, 260] };
const checks: Record<string, number> = { coverage: 0, invalidLesson: 0, sourcedLesson: 0, duplicateEntry: 0, title: 0, level: 0, wordCount: 0, sentenceLength: 0, vocabulary: 0, questions: 0, talk: 0, repeatedText: 0, similarText: 0 };
const errors: string[] = [];
const fail = (check: string, where: string, message: string) => { checks[check] += 1; errors.push(`${where}: ${message}`); };
const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const words = (text: string) => text.trim().split(/\s+/).filter(Boolean);
const normalized = (text: string) => text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const contains = (text: string, phrase: string) => (` ${normalized(text)} `).includes(` ${normalized(phrase)} `);
const courseById = new Map(courses.map((course) => [course.id, course]));
const expected = new Set<string>();
for (const course of courses.filter((course) => !selected || course.id === selected)) for (const [index, lesson] of Array.from(course.lessons.entries())) if (!lesson.source) expected.add(`${course.id}:${index}`);
const seen = new Set<string>();
const byCourse: Record<string, number> = {};
const byLevel: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0 };
const texts: Array<{ where: string; tokens: string[]; normalized: string }> = [];
if (!Array.isArray(entries)) throw new Error('course-lesson-texts.json must contain an array');
for (const [index, entry] of Array.from(entries.entries())) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) { fail('invalidLesson', String(index), 'must be an object'); continue; }
  if (selected && entry.courseId !== selected) continue;
  const where = `${entry.courseId}:${entry.lessonIndex}`;
  const course = courseById.get(entry.courseId);
  const lesson = course?.lessons[entry.lessonIndex];
  if (!course || !Number.isInteger(entry.lessonIndex) || entry.lessonIndex < 0 || !lesson) { fail('invalidLesson', where, 'unknown course or lesson index'); continue; }
  if (lesson.source) fail('sourcedLesson', where, 'sourced lessons must not have an entry');
  if (seen.has(where)) fail('duplicateEntry', where, 'duplicate lesson entry');
  seen.add(where);
  byCourse[entry.courseId] = (byCourse[entry.courseId] || 0) + 1;
  if (entry.title !== lesson.title) fail('title', where, 'title must exactly match the lesson');
  if (entry.level !== levels[course.level]) fail('level', where, `expected ${levels[course.level]}`);
  if (Object.prototype.hasOwnProperty.call(byLevel, entry.level)) byLevel[entry.level] += 1;
  if (!nonEmpty(entry.text)) { fail('wordCount', where, 'text is required'); continue; }
  const count = words(entry.text).length;
  const range = ranges[entry.level];
  if (!range || count < range[0] || count > range[1]) fail('wordCount', where, `${entry.level} has ${count} words; expected ${range?.join('–')}`);
  const limit = entry.level === 'A1' ? 10 : entry.level === 'A2' ? 14 : 0;
  if (limit) for (const sentence of (entry.text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])) if (words(sentence).length > limit) fail('sentenceLength', where, `sentence exceeds ${limit} words: ${sentence.trim()}`);
  if (!Array.isArray(entry.words) || entry.words.length < 5 || entry.words.length > 7) fail('vocabulary', where, 'need 5–7 vocabulary items');
  else {
    const used = new Set<string>();
    for (const item of entry.words) {
      if (!nonEmpty(item?.word) || !contains(entry.text, item.word)) fail('vocabulary', where, `word absent from text: ${String(item?.word)}`);
      else if (used.has(normalized(item.word))) fail('vocabulary', where, `duplicate word ${item.word}`);
      else used.add(normalized(item.word));
      if (!nonEmpty(item?.meaning) || words(item.meaning).length > 8) fail('vocabulary', where, 'meaning must contain 1–8 words');
    }
  }
  if (!Array.isArray(entry.questions) || entry.questions.length !== 3) fail('questions', where, 'need exactly three questions');
  else for (const question of entry.questions) if (!nonEmpty(question?.q) || !question.q.endsWith('?') || !nonEmpty(question?.a) || !contains(entry.text, question.a)) fail('questions', where, 'question needs a short answer found in text');
  if (!Array.isArray(entry.talk) || entry.talk.length !== 2 || entry.talk.some((prompt) => !nonEmpty(prompt) || !prompt.endsWith('?'))) fail('talk', where, 'need exactly two non-empty talk questions');
  texts.push({ where, tokens: normalized(entry.text).split(' '), normalized: normalized(entry.text) });
}
for (const id of Array.from(expected)) if (!seen.has(id)) fail('coverage', id, 'unsourced lesson has no text');
// Longest common subsequence catches reused prose even when small edits are inserted.
function sharedFraction(a: string[], b: string[]): number {
  let previous = new Array<number>(b.length + 1).fill(0);
  for (let i = 0; i < a.length; i += 1) {
    const current = new Array<number>(b.length + 1).fill(0);
    for (let j = 0; j < b.length; j += 1) current[j + 1] = a[i] === b[j] ? previous[j] + 1 : Math.max(previous[j + 1], current[j]);
    previous = current;
  }
  return previous[b.length] / Math.min(a.length, b.length);
}
for (let i = 0; i < texts.length; i += 1) for (let j = i + 1; j < texts.length; j += 1) {
  if (texts[i].normalized === texts[j].normalized) fail('repeatedText', texts[i].where, `repeats ${texts[j].where}`);
  else if (sharedFraction(texts[i].tokens, texts[j].tokens) >= 0.60) fail('similarText', texts[i].where, `at least 60% shared text with ${texts[j].where}`);
}
console.log(`Course texts: ${seen.size}/${expected.size} unsourced lessons${selected ? ` in ${selected}` : ''}. Levels: ${Object.keys(byLevel).map((level) => `${level} ${byLevel[level]}`).join(', ')}.`);
for (const id of Object.keys(byCourse)) console.log(`${id}: ${byCourse[id]}`);
console.log(`Course text checks: ${Object.keys(checks).map((check) => `${check} ${checks[check]}`).join(', ')}.`);
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Course text validation passed.');
