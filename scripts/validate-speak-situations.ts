/** Validate the speaking banks added in library round 26. */
import fs from 'node:fs';
import path from 'node:path';
import { COURSE_PRESETS, READING_COURSE_PRESETS } from '../src/lib/course-presets';
import { validSpeakSituation } from '../src/lib/speak-check';

type Check = 'badArcBank' | 'missingArc' | 'unknownArc' | 'badArcTask' |
  'badSpeakBank' | 'speakCount' | 'duplicateSpeakId' | 'badJuniorFields' |
  'unknownPicture' | 'badReplyRound' | 'longReply' | 'ambiguousReplies' | 'badTopicIds' | 'topicCoverage';
const checks: Record<Check, number> = {
  badArcBank: 0, missingArc: 0, unknownArc: 0, badArcTask: 0,
  badSpeakBank: 0, speakCount: 0, duplicateSpeakId: 0, badJuniorFields: 0,
  unknownPicture: 0, badReplyRound: 0, longReply: 0, ambiguousReplies: 0, badTopicIds: 0, topicCoverage: 0,
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

type ReplyRound = { replies?: unknown; natural?: unknown };
type SpeakSituation = {
  id?: unknown; topics?: unknown; topicIds?: unknown; ageBand?: unknown; cefr?: unknown; situation?: unknown;
  canDo?: unknown; pictures?: unknown; before?: unknown; after?: unknown;
};
const stickerRows = JSON.parse(fs.readFileSync(path.resolve('src/data/sticker-words.json'), 'utf8')) as { id: string }[];
const stickerIds = new Set(stickerRows.map((row) => row.id));
const briefingRows = JSON.parse(fs.readFileSync(path.resolve('src/data/topic-briefings.json'), 'utf8')) as { id: string }[];
const briefingIds = new Set(briefingRows.map((row) => row.id));
const speakFile = path.resolve('src/data/speak-situations.json');
let speakRaw: unknown;
try { speakRaw = JSON.parse(fs.readFileSync(speakFile, 'utf8')); }
catch (error) { fail('badSpeakBank', speakFile, `cannot parse situations: ${String(error)}`); speakRaw = []; }
if (!Array.isArray(speakRaw)) {
  fail('badSpeakBank', speakFile, 'speaking bank must be an array');
  speakRaw = [];
}
const situations = speakRaw as SpeakSituation[];
const situationIds = new Set<string>();
const coveredTopics = new Set<string>();
let juniors = 0;
let linked = 0;
let repliesChecked = 0;
const picturesUsed = new Set<string>();
const beforeSlots = [0, 0, 0, 0];
const afterSlots = [0, 0, 0, 0];
for (const [index, situation] of Array.from(situations.entries())) {
  const at = `situation[${index}]`;
  if (!situation || typeof situation !== 'object' || Array.isArray(situation) ||
      typeof situation.id !== 'string' || !situation.id.trim()) {
    fail('badSpeakBank', at, 'each situation needs an id');
    continue;
  }
  if (situationIds.has(situation.id)) fail('duplicateSpeakId', at, `duplicate id ${situation.id}`);
  situationIds.add(situation.id);
  if (!Array.isArray(situation.topicIds) || new Set(situation.topicIds).size !== situation.topicIds.length) {
    fail('badTopicIds', at, 'topicIds must be an array without duplicates');
  } else {
    if (situation.topicIds.length) linked += 1;
    for (const id of situation.topicIds) {
      if (typeof id !== 'string' || !briefingIds.has(id)) {
        fail('badTopicIds', at, `unknown topic id ${String(id)}`);
      } else {
        const expectedAge = situation.ageBand === 'junior' ? 'kids' : situation.ageBand;
        if (!id.startsWith(`topic-${expectedAge}-`)) fail('badTopicIds', at, `topic ${id} does not match age band`);
        if (situation.ageBand === 'kids' || situation.ageBand === 'teens') coveredTopics.add(id);
      }
    }
  }
  if ((situation.ageBand !== 'kids' && situation.ageBand !== 'teens' && situation.ageBand !== 'junior') ||
      (situation.ageBand === 'junior' && situation.cefr !== 'A1') ||
      (situation.ageBand === 'kids' && situation.cefr !== 'A1' && situation.cefr !== 'A2') ||
      (situation.ageBand === 'teens' && situation.cefr !== 'A2' && situation.cefr !== 'B1' && situation.cefr !== 'B2')) {
    fail('badSpeakBank', at, 'ageBand and cefr are inconsistent');
  }
  if (!validSpeakSituation(situation)) fail('badReplyRound', at, 'situation must meet Speak shape with no before/after overlap');
  const beforeRound = situation.before as ReplyRound | undefined;
  const afterRound = situation.after as ReplyRound | undefined;
  if (!Array.isArray(beforeRound?.replies) || beforeRound.replies.length !== 4 ||
      !Array.isArray(afterRound?.replies) || afterRound.replies.length !== 4 ||
      !Number.isInteger(beforeRound?.natural) || !Number.isInteger(afterRound?.natural) ||
      beforeRound?.natural === afterRound?.natural) {
    fail('badReplyRound', at, 'before and after need four replies and different integer natural positions');
  }
  if (situation.ageBand !== 'junior') continue;
  juniors += 1;
  if (situation.cefr !== 'A1' || !Array.isArray(situation.topics) || situation.topics.length === 0 ||
      situation.topics.some((topic) => typeof topic !== 'string' || !topic.trim()) ||
      typeof situation.situation !== 'string' || !situation.situation.trim() ||
      typeof situation.canDo !== 'string' || !situation.canDo.trim()) {
    fail('badJuniorFields', at, 'Junior rows need A1, topics, a situation and a canDo');
  }
  if (!Array.isArray(situation.pictures) || situation.pictures.length < 1 || situation.pictures.length > 3 ||
      new Set(situation.pictures).size !== situation.pictures.length) {
    fail('badJuniorFields', at, 'pictures need 1–3 distinct sticker ids');
  } else for (const picture of situation.pictures) {
    if (typeof picture !== 'string' || !stickerIds.has(picture)) fail('unknownPicture', at, `unknown sticker ${String(picture)}`);
    else picturesUsed.add(picture);
  }
  const naturalTexts: string[] = [];
  for (const [label, rawRound, slots] of [
    ['before', situation.before, beforeSlots], ['after', situation.after, afterSlots],
  ] as Array<[string, unknown, number[]]>) {
    const round = rawRound as ReplyRound;
    if (!round || typeof round !== 'object' || !Array.isArray(round.replies) || round.replies.length !== 4 ||
        !Number.isInteger(round.natural) || (round.natural as number) < 0 || (round.natural as number) > 3) {
      fail('badReplyRound', `${at}.${label}`, 'four replies and one natural index from 0 to 3 are required');
      continue;
    }
    const replies = round.replies as unknown[];
    const normalized = replies.map((reply) => typeof reply === 'string' ? reply.trim().toLowerCase() : '');
    if (new Set(normalized).size !== 4) fail('ambiguousReplies', `${at}.${label}`, 'reply choices must be distinct');
    for (const reply of replies) {
      repliesChecked += 1;
      if (typeof reply !== 'string' || !reply.trim() || reply !== reply.trim()) {
        fail('badReplyRound', `${at}.${label}`, 'every reply must be a nonempty trimmed string');
      } else if (reply.split(/\s+/).length > 6) {
        fail('longReply', `${at}.${label}`, `reply exceeds six words: ${reply}`);
      }
    }
    slots[round.natural as number] += 1;
    naturalTexts.push(normalized[round.natural as number]);
  }
  if (naturalTexts.length === 2 && naturalTexts[0] === naturalTexts[1]) {
    fail('ambiguousReplies', at, 'before and after natural replies must differ');
  }
}
const kids = situations.filter((row) => row.ageBand === 'kids').length;
const teens = situations.filter((row) => row.ageBand === 'teens').length;
const original = situations.filter((row) => typeof row.id === 'string' && !row.id.startsWith('speak-r27-') && row.ageBand !== 'junior').length;
const teenB2New = situations.filter((row) => typeof row.id === 'string' && row.id.startsWith('speak-r27-') && row.ageBand === 'teens' && row.cefr === 'B2').length;
if (situations.length !== 171 || kids !== 77 || teens !== 64 || juniors !== 30 || original !== 80) {
  fail('speakCount', speakFile, `expected 171 situations (77 kids, 64 teens, 30 junior, 80 original), found ${situations.length} (${kids}/${teens}/${juniors}/${original})`);
}
for (const row of briefingRows) if (!coveredTopics.has(row.id)) fail('topicCoverage', row.id, 'no age-matched Speak situation');
console.log(`Junior Speak: ${juniors}/30 situations, ${repliesChecked} replies checked, ${picturesUsed.size} distinct stickers; natural slots before ${beforeSlots.join('/')}, after ${afterSlots.join('/')}.`);
console.log(`Speak topic links: ${linked}/${situations.length} situations linked; ${briefingRows.length} briefing IDs available.`);
const cefrByAge = ['kids', 'teens', 'junior'].map((age) => {
  const counts = ['A1', 'A2', 'B1', 'B2'].map((level) => `${level} ${situations.filter((row) => row.ageBand === age && row.cefr === level).length}`);
  return `${age} ${counts.join('/')}`;
});
console.log(`Speak coverage: ${coveredTopics.size}/${briefingRows.length} topics; ${cefrByAge.join('; ')}; new teen B2 ${teenB2New}/24; original reviewed ${original}/80.`);
console.log(`Speak checker counts: ${Object.entries(checks).map(([name, count]) => `${name} ${count}`).join(', ')}.`);
if (errors.length) {
  console.error(`Speaking bank validation failed with ${errors.length} error(s):\n${errors.slice(0, 80).join('\n')}`);
  process.exitCode = 1;
} else console.log('Speaking bank validation passed.');
