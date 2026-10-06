/** Editorial pass over the new scene drafts: remove repeated events and commentary. */
import fs from 'node:fs';
import path from 'node:path';
import { readingSentences } from './library-reading-sentences';

type Version = { text: string; wordCount: number };
type Book = { id: string; summary: string; wordCount: number; retellings: Record<string, Version> };
const file = path.join(process.cwd(), 'src/data/book-library.json');
const books = JSON.parse(fs.readFileSync(file, 'utf8')) as Book[];
const stop = new Set('the and that with from they them then there when this their have were into after before while would could should been each about through whose because which only also some much more very over under again around until what where your than said does begins begin'.split(' '));
const words = (sentence: string): string[] => Array.from(new Set((sentence.toLowerCase().match(/[a-z]+/g) || [])
  .filter(word => word.length > 3 && !stop.has(word))
  .map(word => word.replace(/(ing|ed|s)$/, ''))));
function similarity(a: string, b: string): number {
  const aa = words(a), bb = words(b);
  if (!aa.length || !bb.length) return 0;
  return aa.filter(word => bb.indexOf(word) >= 0).length / Math.min(aa.length, bb.length);
}
const filler = /^(?:This change is not gentle|The chapter of his life|His success did not bring|It began a chain|Every answer creates|He has crossed thousands of years|The danger is real, but so is his responsibility|Each person makes choices with incomplete information|Their teamwork keeps|His progress comes from practice|Their secret place becomes a community|The garden is not magical|The ending shows a household|Buck has not simply become|His experiences have taught him|The final choice belongs to him|The trip has already become more complicated|Their bond is based on trust|The dog now feels two kinds of loyalty|His curiosity gives her a reason)/i;
const extra: Record<string, [number, string]> = {
  'book6-time-machine-2': [1, 'He circles the white stone figure and searches for an opening. The marks around its base suggest that something heavy was pulled across the grass. Weena stays near him, but she has no words that can tell him who moved the machine or how to open the bronze doors.'],
  'book6-call-of-wild-3': [1, 'The drivers argue about what should be left behind, but they keep piling things onto the sled. The animals wait while the people waste their strength. Buck has pulled through many hard days already; this time the team cannot recover before the next stage of the journey.'],
  'book6-call-of-wild-4': [1, 'Buck returns from one of his long runs and smells that something is wrong before he reaches the tents. The people who welcomed him no longer answer. He follows the signs of the attack through the camp. For a while he searches for Thornton among the fallen, then turns toward the men responsible. The wolves call beyond the trees, but he must face the empty camp first.'],
  'book6-around-world-1': [1, 'Fix sends word ahead for an arrest warrant and studies each passenger as the ship docks. Fogg pays little attention to him. Passepartout talks freely about the speed of their journey, giving the detective more reason to keep close to the group.'],
  'book6-call-of-wild-1': [1, 'On the train Buck pushes against the walls of his crate, but the journey continues. At each stop he expects a familiar voice and hears only strangers. When he reaches the North, the ground is cold beneath his paws and the other dogs are already fighting for food. He watches them before making his next move.'],
  'book6-call-of-wild-2': [1, 'The drivers hitch Buck in among dogs that know the work. The traces pull tight whenever the sled starts, and a mistake by one dog slows the others. Buck studies Spitz as the leader turns at commands and holds his place in front. He begins to challenge him whenever he has a chance.'],
  'book6-around-world-2': [1, 'Fix reaches Passepartout in Hong Kong and gives him drink until he can no longer warn his master about the ship leaving early. When Fogg and Aouda arrive at the quay, they find the vessel gone. Fogg hires a smaller boat to catch another connection, unaware that Passepartout has made it aboard the original ship. In Japan, the servant has to earn his food while looking for his friends. The boat they hire meets rough weather at sea, and Fogg watches for the chance to board a ship heading east. He and Aouda cannot know where Passepartout has gone.'],
  'book6-around-world-3': [1, 'The train cannot wait while Fogg searches for Passepartout. He takes armed men back across the plain, watching for the attackers and hoping his servant is still alive. After the rescue, the party has to find new transport because their original seats have gone east without them.'],
  'book6-around-world-4': [0, 'The captain refuses to change course, so Fogg offers the crew money and takes charge of the ship. They burn wooden parts of it to keep the engine going. Passepartout watches the fuel disappear and wonders how they will reach land.'],
  'book6-secret-garden-1': [1, 'Mary asks the gardener Ben Weatherstaff about the locked place. He tells her that no one enters it now, then returns to his work. She sees the robin hopping along the wall and follows it. The little bird is easier company than the silent adults in the house.'],
  'book6-secret-garden-2': [1, 'Dickon arrives carrying a spade and seeds. Mary shows him the hidden door and asks him to keep it secret. They kneel to examine the first green points coming through the ground. He tells her which growth to leave and which dead stems she can clear away.'],
  'book6-secret-garden-3': [1, 'At first Colin asks to be wheeled close to each bed. He looks at the soil where Mary has been working and listens to Dickon talk about the plants. On later visits he reaches out to touch them and then tries standing. Mary stays beside him while he discovers what he can do.'],
  'book6-secret-garden-4': [1, 'Inside the garden, Colin counts the distance he can walk before resting. He wants to be on his feet when his father sees him. Mary and Dickon watch as he tries again, and the three children keep their promise to say nothing until Mr. Craven returns. They wait for his footsteps.'],
};

const issues: string[] = [];
for (const book of books) {
  if (!book.id.startsWith('book6-')) continue;
  for (const level of ['B1', 'B2']) {
    const version = book.retellings[level];
    const seen: string[] = [];
    const paragraphs = version.text.split(/\n\s*\n/).map(paragraph => readingSentences(paragraph).filter(sentence => {
      if (filler.test(sentence)) return false;
      if (seen.some(earlier => similarity(sentence, earlier) >= 0.62)) return false;
      seen.push(sentence);
      return true;
    }).join(' '));
    const addition = extra[book.id];
    if (addition) paragraphs[addition[0]] += ' ' + addition[1];
    const text = paragraphs.filter(Boolean).join('\n\n');
    const count = text.trim().split(/\s+/).length;
    const min = level === 'B2' ? 400 : 300;
    const max = level === 'B2' ? 600 : 500;
    if (count < min || count > max) issues.push(`${book.id} ${level}: ${count} words outside ${min}–${max}`);
    version.text = text; version.wordCount = count;
    if (level === 'B1') { book.summary = text; book.wordCount = count; }
  }
}
if (issues.length) throw new Error(issues.join('\n'));
fs.writeFileSync(file, JSON.stringify(books, null, 2) + '\n');
console.log('Refined 48 teen retellings.');
