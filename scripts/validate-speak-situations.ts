/** Validate the speaking banks added in library round 26. */
import fs from 'node:fs';
import path from 'node:path';
import { COURSE_PRESETS, READING_COURSE_PRESETS } from '../src/lib/course-presets';

type Check = 'badArcBank' | 'missingArc' | 'unknownArc' | 'badArcTask';
const checks: Record<Check, number> = {
  badArcBank: 0, missingArc: 0, unknownArc: 0, badArcTask: 0,
};
const errors: string[] = [];
function fail(check: Check, where: string, message: string): void {
  checks[check] += 1;
  errors.push(`${where}: ${message}`);
}

const file = path.resolve('src/data/course-arc-tasks.json');
let raw: unknown;
try { raw = JSON.parse(fs.readFileSync(file, 'utf8')); }
catch (error) { fail('badArcBank', file, `cannot parse tasks: ${String(error)}`); raw = {}; }
if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
  fail('badArcBank', file, 'course arc tasks must be an object');
  raw = {};
}
const tasks = raw as Record<string, unknown>;
const expectedIds = COURSE_PRESETS.concat(READING_COURSE_PRESETS).map((preset) => preset.id);
const expected = new Set(expectedIds);
let valid = 0;
for (const id of expectedIds) {
  if (!Object.prototype.hasOwnProperty.call(tasks, id)) fail('missingArc', id, 'course has no arc task');
}
for (const [id, task] of Object.entries(tasks)) {
  if (!expected.has(id)) fail('unknownArc', id, 'no matching older course preset');
  if (typeof task !== 'string' || !task.trim() || task !== task.trim() || task.trim().split(/\s+/).length > 20) {
    fail('badArcTask', id, 'task must be a nonempty trimmed sentence of at most 20 words');
  } else valid += 1;
}
console.log(`Course arc tasks: ${valid}/${expectedIds.length} valid (${COURSE_PRESETS.length} themes, ${READING_COURSE_PRESETS.length} reading courses).`);
console.log(`Speak checker counts: ${Object.entries(checks).map(([name, count]) => `${name} ${count}`).join(', ')}.`);
if (errors.length) {
  console.error(`Speaking bank validation failed with ${errors.length} error(s):\n${errors.slice(0, 80).join('\n')}`);
  process.exitCode = 1;
} else console.log('Speaking bank validation passed.');
