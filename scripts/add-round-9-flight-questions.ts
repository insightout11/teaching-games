/** Add grounded, age-appropriate debate prompts to prioritized library items. */
import fs from 'node:fs';
import path from 'node:path';

type Item = {
  id?: string;
  title?: string;
  summary?: string;
  shortSummary?: string;
  description?: string;
  topicTags?: unknown;
  ageBand?: string;
  series?: unknown;
  flightQuestion?: string;
  kind?: string;
  genre?: string;
  needsReview?: boolean;
  reviewNote?: string;
};

type Candidate = { file: string; index: number; item: Item; sourceRank: number; needsReview: boolean };

const dataDir = path.resolve('src/data');
const targetTotal = 728; // 128 existing + at least 600 more from this round.
const sourceOrder = [
  'teded-library.json', 'bbc-library.json', 'bbc-ideas-library.json', 'kids-library.json',
  'natgeo-library.json', 'voa-library.json', 'stories-library.json', 'book-library.json',
  'picture-books-library.json', 'storyweaver-library.json', 'african-storybook-library.json',
  'public-domain-library.json', 'ted-library.json',
];

function lowerWords(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9 -]/g, ' ').replace(/\s+/g, ' ').trim();
}

function choose(item: Item, options: string[]): string {
  const id = String(item.id || '');
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) hash = (hash + id.charCodeAt(index)) % options.length;
  return options[hash];
}

function sourceRank(file: string): number {
  const index = sourceOrder.indexOf(file);
  return index < 0 ? sourceOrder.length : index;
}

function makeQuestion(item: Item): string | null {
  const summary = item.summary || item.shortSummary || item.description || '';
  if (summary.trim().length < 40) return null;
  // Base the prompt on the item's title and its text/transcript-derived summary.
  // Topic tags are omitted because the legacy metadata is sometimes noisy.
  const title = lowerWords(item.title || '');
  const evidence = lowerWords(`${title} ${summary}`);
  const age = item.ageBand || 'all';

  if (/artificial intelligence|\bai\b/.test(title)) return 'Should people let AI make important everyday decisions?';
  if (/can you solve|riddle|logic puzzle|prisoner hat/.test(title)) return 'Should groups share information to help everyone succeed?';
  if (/plastic pollution/.test(title)) return 'Should people use less plastic even when it makes life less convenient?';
  if (/home sweet habitat/.test(title)) return 'Should communities protect animal habitats when they need more space?';
  if (/smelly girl|jealous/.test(title)) return 'Should people forgive friends who take something valuable?';
  if (/social media|internet|influencers|online communit|digital life/.test(evidence)) {
    return age === 'kids'
      ? choose(item, ['Should children have limits on screen time?', 'Should kids use social media with adult guidance?'])
      : choose(item, ['Should teens have limits on social media time?', 'Should teens choose their own screen-time rules?']);
  }
  if (/tragedy of the commons/.test(title)) return 'Should shared resources have limits when everyone needs them?';
  if (/jazz|music/.test(title)) return 'Should schools teach more music from different cultures?';
  if (/science of lunch|\blunch\b/.test(title)) return 'Should students have more choice in school meals?';
  if (/sugar/.test(title)) return 'Should schools limit sugary snacks even if students enjoy them?';
  if (/weathering|erosion/.test(title)) return 'Should people spend more to protect soil from erosion?';
  if (/\bwedding\b/.test(title)) return 'Should relatives travel together for important family celebrations?';
  if (/missing bat/.test(title)) return 'Should traditional cricket bat workshops stay in small towns?';
  if (/ramya|star/.test(title) && /earring/.test(evidence)) return 'Should people take natural things to make beautiful gifts?';
  if (/left home for the city/.test(title)) return 'Is city life worth leaving a familiar home?';
  if (/\bstress\b/.test(title)) return 'Should schools teach students ways to manage stress?';
  if (/depression|mental health/.test(title)) return 'Should schools teach mental health as carefully as physical health?';
  if (/exercise|fitness/.test(title)) return 'Should schools make daily exercise part of every student’s routine?';
  if (/\bdreams?\b/.test(title)) return 'Are dreams useful, or just random brain activity?';
  if (/\bsleep\b/.test(title)) return 'Should schools teach students how much sleep they need?';
  if ((item.genre === 'narrative' || item.kind === 'text' || item.kind === 'picture-book')
    && (item.ageBand === 'kids' || item.ageBand === 'teens')) {
    if (/phone|mobile|text message|make a call|calls (her|him|them)/.test(evidence)
      && /family|granny|grandmother|mother|parent/.test(evidence)) {
      return 'Should children use phones to stay connected with family?';
    }
    if (/rain water|rainwater|save water|collect water/.test(evidence)) return 'Should every home collect rainwater when it rains?';
    if (/share|give|borrow|vegetable|food/.test(evidence) && /lazy|hungry|cook|work|help/.test(evidence)) {
      return 'Should people share food even when sharing takes effort?';
    }
    if (/plant a tree|planting a tree|tree to grow|grow with/.test(evidence)) return 'Should children plant trees they can watch grow?';
    if (/elephant|long nose|curious/.test(evidence)) return 'Should children keep asking questions when answers seem strange?';
    if (/calf|herd|farm animal/.test(evidence)) return 'Should children help care for farm animals?';
    if (/season|spring|winter|festival|celebrat|tradition/.test(evidence)
      && /season|spring|winter|autumn|monsoon|rain/.test(evidence)) {
      return 'Should families keep traditions linked to the seasons?';
    }
    if (/food fair|market/.test(evidence) && /food|eat|meal/.test(evidence)) return 'Should communities keep local food fairs for children?';
    if (/promise|loyal|friend|help|rescue/.test(evidence)) return 'Should people risk comfort to help a friend?';
    if (/rule|law|obey|choice|decision/.test(evidence)) return 'Should people follow rules when they seem unfair?';
    return age === 'kids'
      ? 'Is it better to be brave or careful in a new adventure?'
      : 'Should people take risks to discover something new?';
  }
  if (/food chain|food web/.test(evidence)) return 'Should people protect every link in a food chain?';
  if (/solar energy|solar power|sunlight|renewable energy/.test(evidence)
    || (/\bsun\b/.test(title) && /energy|power/.test(evidence))) return 'Should communities invest more in clean energy?';
  if (/gravity|force|falling|falls down/.test(evidence)) return 'Should students learn about forces through examples or experiments?';
  if (/health|brain|sleep|exercise|wellbeing|well-being|body|medical|sugar|nutrition|organisms eat|living things need to eat/.test(evidence)) {
    return age === 'kids'
      ? choose(item, ['Should schools teach healthy habits every day?', 'Should children learn how sleep and food affect health?'])
      : choose(item, ['Should schools spend more time teaching healthy habits?', 'Should students make more choices about their own health?']);
  }
  if (/climate|environment|pollution|carbon|recycl|conservation|warming|erosion|flood|storm|weathering/.test(evidence)) {
    return choose(item, ['Who should act first on climate change: people or governments?', 'Should communities change daily habits to protect the environment?']);
  }
  if (/animal|wildlife|species|habitat|migration|shark|turtle|bird|whale|insect|plant|forest|rainforest|ecosystem|reef|ocean|nature/.test(evidence)) {
    if (/migration|migrat|journey|travel across/.test(evidence)) return 'Should people protect migration routes even when it costs more?';
    if (/animal|wildlife|species|shark|turtle|bird|whale|insect/.test(evidence)) {
      return age === 'kids'
        ? choose(item, ['Should people protect wild animals even when it costs more?', 'Should wild animals live near towns or far away?'])
        : choose(item, ['Should communities limit development to protect wild animals?', 'Should people protect wild animals even when it costs more?']);
    }
    return choose(item, ['Should communities change daily habits to protect local nature?', 'Who should do more to protect nature: people or leaders?']);
  }
  if (/street food/.test(evidence)) return 'Should cities make street food safer even if prices rise?';
  if (/food|cook|recipe|meal|restaurant|dish|eat|farm|agriculture/.test(evidence)) {
    return age === 'kids'
      ? choose(item, ['Should schools serve local foods alongside familiar meals?', 'Should children try new foods at school?'])
      : choose(item, ['Should people choose local food even when it costs more?', 'Should schools offer more plant-based meals?']);
  }
  if (/space|planet|moon|mars|astronom|rocket|universe|star/.test(evidence)) {
    return 'Should people explore space despite the risks and costs?';
  }
  if (/city|cities|urban|transport|traffic|commut|public transit|travel|touris|destination|world-flight|bangkok|tokyo|paris/.test(evidence)) {
    return 'Should cities make more room for people than cars?';
  }
  if (/school|student|classroom|education|learn|teacher|homework|language|grammar|english/.test(evidence)) {
    if (/language|grammar|english|speaking|listening|vocabulary/.test(evidence)) {
      return age === 'kids'
        ? 'Should students practice English by speaking or writing?'
        : choose(item, ['Should language classes focus more on speaking or writing?', 'Should students learn grammar through examples or rules?']);
    }
    return age === 'kids'
      ? 'Should students learn by doing projects or reading books?'
      : 'Should schools teach more through projects or traditional lessons?';
  }
  if (/robot|artificial intelligence|technology|machine|computer|invention|internet|device|app|phone|mobile/.test(evidence)) {
    return choose(item, ['Should people use new technology more, or set clearer limits?', 'Should children use phones to learn or mostly to play?']);
  }
  if (/sport|football|soccer|basketball|athlet|game|fitness/.test(evidence)) {
    return 'Should every child have more time to play sports?';
  }
  if (/music|art|creative|dance|painting|culture|festival|tradition/.test(evidence)) {
    return 'Should schools spend more time on arts and culture?';
  }
  if (/money|business|career|job|workplace|salary|future work/.test(evidence)) {
    return 'Should schools teach more practical skills for adult life?';
  }
  if (/story|fable|fiction|character|adventure|journey|friend|family|promise|choice|decision/.test(evidence)) {
    if (/lazy|share|greed|selfish|food/.test(evidence)) return 'Should people share when they have enough for themselves?';
    if (/promise|loyal|friend|help|rescue/.test(evidence)) return 'Should people risk comfort to help a friend?';
    if (/rule|law|obey|choice|decision/.test(evidence)) return 'Should people follow rules when they seem unfair?';
    return age === 'kids'
      ? 'Is it better to be brave or careful in a new adventure?'
      : 'Should people take risks to discover something new?';
  }
  if (/science|experiment|engineering|measure|physics|chemistry|biology|math/.test(evidence)) {
    return age === 'kids'
      ? 'Should students learn science by experiments or explanations?'
      : 'Should schools spend more time on hands-on science?';
  }
  if (/history|past|ancient|historical|war|empire|in the past/.test(evidence)) {
    return 'Should communities preserve old traditions or welcome new ideas?';
  }
  return null;
}

function supportsFlightQuestion(item: Item, file: string): boolean {
  if (item.genre === 'opinion' || item.genre === 'expository' || file === 'book-library.json') return true;
  return item.ageBand === 'kids' && (item.kind === 'text' || item.kind === 'picture-book')
    && item.genre === 'narrative';
}

function main(): void {
  const files = fs.readdirSync(dataDir).filter((file) => file.endsWith('-library.json')).sort();
  const candidates: Candidate[] = [];
  const parsed: Record<string, Item[]> = {};
  let existingQuestions = 0;
  for (const file of files) {
    const items = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8')) as Item[];
    parsed[file] = items;
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (item.flightQuestion) { existingQuestions += 1; continue; }
      if (!supportsFlightQuestion(item, file)) continue;
      const hasSourceSummary = !!(item.summary || item.shortSummary);
      const description = item.description || '';
      if (!hasSourceSummary && description.trim().length < 100) continue;
      if (!makeQuestion(item)) continue;
      candidates.push({ file, index, item, sourceRank: sourceRank(file), needsReview: !hasSourceSummary });
    }
  }
  candidates.sort((a, b) => {
    const aSeries = a.item.series ? 0 : 1;
    const bSeries = b.item.series ? 0 : 1;
    if (aSeries !== bSeries) return aSeries - bSeries;
    const aAge = a.item.ageBand === 'kids' || a.item.ageBand === 'teens' ? 0 : 1;
    const bAge = b.item.ageBand === 'kids' || b.item.ageBand === 'teens' ? 0 : 1;
    if (aAge !== bAge) return aAge - bAge;
    if (a.sourceRank !== b.sourceRank) return a.sourceRank - b.sourceRank;
    return a.file.localeCompare(b.file) || String(a.item.id).localeCompare(String(b.item.id));
  });
  const needed = Math.max(0, targetTotal - existingQuestions);
  if (candidates.length < needed) throw new Error(`Only ${candidates.length} grounded candidates for ${needed} questions`);
  const selected = candidates.slice(0, needed);
  const counts: Record<string, number> = {};
  const changedFiles: Record<string, boolean> = {};
  let seriesCount = 0;
  let youthCount = 0;
  for (const candidate of selected) {
    const question = makeQuestion(candidate.item);
    if (!question) throw new Error(`Question generation failed for ${candidate.item.id}`);
    const words = question.trim().split(/\s+/).length;
    if (words > 12 || !question.endsWith('?')) throw new Error(`Question failed format for ${candidate.item.id}: ${question}`);
    parsed[candidate.file][candidate.index].flightQuestion = question;
    if (candidate.needsReview) {
      parsed[candidate.file][candidate.index].needsReview = true;
      if (!parsed[candidate.file][candidate.index].reviewNote) {
        parsed[candidate.file][candidate.index].reviewNote = 'Round 9 question is grounded in the item description because no full summary is available; review before classroom use.';
      }
    }
    changedFiles[candidate.file] = true;
    counts[candidate.file] = (counts[candidate.file] || 0) + 1;
    if (candidate.item.series) seriesCount += 1;
    if (candidate.item.ageBand === 'kids' || candidate.item.ageBand === 'teens') youthCount += 1;
  }
  for (const file of files) {
    if (changedFiles[file]) fs.writeFileSync(path.join(dataDir, file), `${JSON.stringify(parsed[file], null, 2)}\n`, 'utf8');
  }
  console.log(JSON.stringify({ added: selected.length, questionsBefore: existingQuestions, questionsAfter: existingQuestions + selected.length, availableCandidates: candidates.length, inSeries: seriesCount, kidsOrTeens: youthCount, byFile: counts }, null, 2));
}

main();
