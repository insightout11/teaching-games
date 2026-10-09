/** Build and validate the reviewed Round 24 ready-course bank. */
import fs from 'node:fs';
import path from 'node:path';

type LibraryRow = { id: string; title: string; listeningPack?: unknown };
type Source = { sourceType?: unknown; id?: unknown; title?: unknown };
type Lesson = {
  title?: unknown; topic?: unknown; keywords?: unknown; flight?: unknown;
  source?: unknown; arc?: unknown; motionId?: unknown;
};
type Course = {
  id?: unknown; title?: unknown; audience?: unknown; level?: unknown;
  blurb?: unknown; theme?: unknown; arcTask?: unknown; lessons?: unknown;
};
type Check = 'courseCount' | 'badCourse' | 'duplicateCourseId' | 'duplicateCourseTitle' |
  'lessonCount' | 'badLesson' | 'duplicateTopic' | 'badFlight' | 'juniorFlight' |
  'badSource' | 'badArc' | 'badMotion' | 'courseGroups';
const checks: Record<Check, number> = {
  courseCount: 0, badCourse: 0, duplicateCourseId: 0, duplicateCourseTitle: 0,
  lessonCount: 0, badLesson: 0, duplicateTopic: 0, badFlight: 0, juniorFlight: 0,
  badSource: 0, badArc: 0, badMotion: 0, courseGroups: 0,
};
const errors: string[] = [];
function fail(check: Check, where: string, message: string): void {
  checks[check] += 1;
  errors.push(`${where}: ${message}`);
}
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const flights = new Set([
  'speak-60', 'debate-60', 'listening-60', 'reading-60', 'grammar-60',
  'travel-60', 'all-around-flight-60',
]);
const readingTypes = new Set(['books', 'stories', 'picture-books', 'storyweaver', 'african-storybook', 'public-domain']);
const dataDir = path.resolve('src/data');
const catalogues = new Map<string, Map<string, LibraryRow>>();
for (const filename of fs.readdirSync(dataDir).filter((name) => name.endsWith('-library.json'))) {
  const stem = filename.slice(0, -'-library.json'.length);
  const sourceType = stem === 'book' ? 'books' : stem;
  const rows = JSON.parse(fs.readFileSync(path.join(dataDir, filename), 'utf8')) as LibraryRow[];
  catalogues.set(sourceType, new Map(rows.map((row) => [row.id, row])));
}
const motions = new Set((JSON.parse(fs.readFileSync(path.join(dataDir, 'debate-motions.json'), 'utf8')) as { id: string }[]).map((row) => row.id));
const file = path.join(dataDir, 'ready-courses.json');

if (process.argv.includes('--build')) {
  const seed = fs.readFileSync(path.resolve('docs/library-round-24-course-seeds.txt'), 'utf8');
  const blocks = seed.trim().split(/\r?\n\s*\r?\n/);
  const built = blocks.map((block) => {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const header = lines[0].split('|').map((part) => part.trim());
    if (header.length !== 7 || lines.length < 6 || lines.length > 7) {
      throw new Error(`Bad course seed block: ${lines[0]}`);
    }
    const [id, title, audience, level, blurb, theme, arcTask] = header;
    const lessons = lines.slice(1).map((line, index, all) => {
      const fields = line.split('|').map((part) => part.trim());
      if (fields.length !== 5 && fields.length !== 6) throw new Error(`${id}: bad lesson ${line}`);
      const [lessonTitle, topic, keywords, flight, sourceRef, motionId] = fields;
      const lesson: Record<string, unknown> = {
        title: lessonTitle, topic, keywords: keywords.split(',').map((word) => word.trim()), flight,
      };
      if (index === 0) lesson.arc = 'baseline';
      if (index === all.length - 1) lesson.arc = 'compare';
      if (sourceRef !== '-') {
        const colon = sourceRef.indexOf(':');
        if (colon < 1) throw new Error(`${id}: bad source ref ${sourceRef}`);
        const sourceType = sourceRef.slice(0, colon);
        const sourceId = sourceRef.slice(colon + 1);
        const row = catalogues.get(sourceType)?.get(sourceId);
        if (!row) throw new Error(`${id}: unknown source ${sourceRef}`);
        lesson.source = { sourceType, id: sourceId, title: row.title };
      }
      if (motionId && motionId !== '-') lesson.motionId = motionId;
      return lesson;
    });
    return { id, title, audience, level, blurb, theme, arcTask, lessons };
  });
  fs.writeFileSync(file, JSON.stringify(built, null, 2) + '\n');
  console.log(`Built ${built.length} ready courses from reviewed seeds.`);
}

let raw: unknown;
try { raw = JSON.parse(fs.readFileSync(file, 'utf8')); }
catch (error) { fail('badCourse', file, `cannot parse course bank: ${String(error)}`); raw = []; }
if (!Array.isArray(raw)) { fail('badCourse', file, 'top-level value must be an array'); raw = []; }
const courses = raw as Course[];
const ids = new Set<string>();
const titles = new Set<string>();
const audiences = { kids: 0, teens: 0 };
const groups = { kidsThemes: 0, teenThemes: 0, skills: 0, exam: 0 };
const flightCounts: Record<string, number> = Object.fromEntries(Array.from(flights).map((flight) => [flight, 0]));
let lessonsTotal = 0;
let withSources = 0;
let withoutSources = 0;

for (const [courseIndex, course] of Array.from(courses.entries())) {
  const at = `course[${courseIndex}]`;
  if (!course || typeof course !== 'object' || Array.isArray(course) ||
      !isText(course.id) || !isText(course.title) || !isText(course.blurb) ||
      !isText(course.theme) || !isText(course.arcTask)) {
    fail('badCourse', at, 'id, title, blurb, theme and arcTask are required');
    continue;
  }
  if (ids.has(course.id)) fail('duplicateCourseId', at, `duplicate id ${course.id}`);
  ids.add(course.id);
  const titleKey = course.title.trim().toLowerCase();
  if (titles.has(titleKey)) fail('duplicateCourseTitle', at, `duplicate title ${course.title}`);
  titles.add(titleKey);
  if (course.audience === 'kids' || course.audience === 'teens') audiences[course.audience] += 1;
  else fail('badCourse', at, 'audience must be kids or teens');
  if (course.id.startsWith('kids-')) {
    groups.kidsThemes += 1;
    if (course.audience !== 'kids' || !['Beginner', 'Easy'].includes(String(course.level))) {
      fail('courseGroups', at, 'kids theme must be kids at Beginner or Easy');
    }
  } else if (course.id.startsWith('teens-')) {
    groups.teenThemes += 1;
    if (course.audience !== 'teens' || !['Intermediate', 'Advanced'].includes(String(course.level))) {
      fail('courseGroups', at, 'teen theme must be teens at Intermediate or Advanced');
    }
  } else if (course.id.startsWith('skills-')) groups.skills += 1;
  else if (course.id.startsWith('exam-')) groups.exam += 1;
  else fail('courseGroups', at, 'course id must identify its requested group');
  if (!['Beginner', 'Easy', 'Intermediate', 'Advanced'].includes(String(course.level))) {
    fail('badCourse', at, 'invalid level');
  }
  if (!Array.isArray(course.lessons) || course.lessons.length < 5 || course.lessons.length > 6) {
    fail('lessonCount', at, 'expected 5–6 lessons');
    continue;
  }
  const lessons = course.lessons as Lesson[];
  lessonsTotal += lessons.length;
  const topics = new Set<string>();
  let baselines = 0;
  let comparisons = 0;
  for (const [lessonIndex, lesson] of Array.from(lessons.entries())) {
    const where = `${at}.lessons[${lessonIndex}]`;
    if (!lesson || !isText(lesson.title) || !isText(lesson.topic) ||
        !Array.isArray(lesson.keywords) || lesson.keywords.length < 2 || lesson.keywords.length > 5 ||
        lesson.keywords.some((word) => !isText(word))) {
      fail('badLesson', where, 'title, topic and 2–5 keywords are required');
      continue;
    }
    const topicKey = lesson.topic.trim().toLowerCase().replace(/\s+/g, ' ');
    if (topics.has(topicKey)) fail('duplicateTopic', where, `repeated topic ${lesson.topic}`);
    topics.add(topicKey);
    if (!isText(lesson.flight) || !flights.has(lesson.flight)) fail('badFlight', where, `invalid flight ${String(lesson.flight)}`);
    else {
      flightCounts[lesson.flight] += 1;
      if (course.audience === 'kids' && (lesson.flight === 'debate-60' || lesson.flight === 'grammar-60')) {
        fail('juniorFlight', where, `${lesson.flight} is not for Junior-age kids`);
      }
    }
    if (lesson.arc === 'baseline') baselines += 1;
    else if (lesson.arc === 'compare') comparisons += 1;
    else if (lesson.arc !== undefined) fail('badArc', where, `invalid arc ${String(lesson.arc)}`);
    if (lessonIndex === 0 && lesson.arc !== 'baseline') fail('badArc', where, 'first lesson must be baseline');
    if (lessonIndex === lessons.length - 1 && lesson.arc !== 'compare') fail('badArc', where, 'last lesson must be compare');
    if (lesson.source === undefined) withoutSources += 1;
    else {
      withSources += 1;
      const source = lesson.source as Source;
      if (!source || !isText(source.sourceType) || !isText(source.id) || !isText(source.title)) {
        fail('badSource', where, 'source needs sourceType, id and title');
      } else {
        const row = catalogues.get(source.sourceType)?.get(source.id);
        if (!row || row.title !== source.title) fail('badSource', where, `source not found with exact title: ${source.sourceType}/${source.id}`);
        if (lesson.flight === 'listening-60' && (source.sourceType !== 'listening' || !row?.listeningPack)) {
          fail('badSource', where, 'listening flight needs a listening source with a pack');
        }
        if (lesson.flight === 'reading-60' && !readingTypes.has(source.sourceType)) {
          fail('badSource', where, 'reading flight needs a reading library source');
        }
      }
    }
    if (lesson.motionId !== undefined && (!isText(lesson.motionId) || !motions.has(lesson.motionId))) {
      fail('badMotion', where, `unknown debate motion ${String(lesson.motionId)}`);
    }
    if (course.id === 'skills-debate' && lesson.motionId === undefined) {
      fail('badMotion', where, 'Debate course lesson needs a banked motion');
    }
  }
  if (baselines !== 1 || comparisons !== 1) fail('badArc', at, `expected one baseline and one compare, found ${baselines}/${comparisons}`);
}
if (courses.length !== 24) fail('courseCount', file, `expected 24 courses, found ${courses.length}`);
if (groups.kidsThemes !== 8 || groups.teenThemes !== 8 || groups.skills !== 4 || groups.exam !== 4) {
  fail('courseGroups', file, `expected group split 8/8/4/4, found ${groups.kidsThemes}/${groups.teenThemes}/${groups.skills}/${groups.exam}`);
}
console.log(`Ready courses: ${courses.length} (kids ${audiences.kids}, teens ${audiences.teens}), ${lessonsTotal} lessons.`);
console.log(`Course groups: kids themes ${groups.kidsThemes}, teen themes ${groups.teenThemes}, skills ${groups.skills}, exam-style ${groups.exam}.`);
console.log(`Flight mix: ${Object.entries(flightCounts).map(([key, value]) => `${key} ${value}`).join(', ')}.`);
console.log(`Sources: ${withSources} lessons with, ${withoutSources} without.`);
console.log(`Ready-course checks: ${Object.entries(checks).map(([key, value]) => `${key} ${value}`).join(', ')}.`);
if (errors.length) {
  console.error(`Ready-course validation failed with ${errors.length} error(s):\n${errors.slice(0, 80).join('\n')}`);
  process.exitCode = 1;
} else console.log('Ready-course validation passed.');
