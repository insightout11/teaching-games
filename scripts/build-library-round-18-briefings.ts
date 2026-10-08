/** Build the ready Focus bank from reviewed topic-specific facts and questions. */
import fs from 'node:fs';
import path from 'node:path';
import { kidsContent, teensContent } from './library-round-18-content';
import { kidsExtraTerms, teensExtraTerms } from './library-round-18-vocab';
import { vocabSupplement } from './library-round-18-vocab-supplement';

type Term = { word: string; definition: string; example: string };
type Bank = { basic: Term[]; extended: Term[] };
const terms = (rows: string): Term[] => rows.trim().split('\n').map((row) => {
  const [word, definition, example] = row.split('|');
  if (!word || !definition || !example) throw new Error(`Bad vocab: ${row}`);
  return { word, definition, example };
});

// Six reusable discussion words per category and level. {t} is replaced by this topic's title.
const banks: Record<string, Bank> = {
  animals: {
    basic: terms(`animal|A living thing that eats and moves.|{t} are animals.
body|All the parts of a living thing.|The body of {t} helps them move.
food|Things living things eat.|{t} need food to grow.
home|A place to live or rest.|{t} need a safe home.
young|Not fully grown.|Young {t} grow and learn.
move|To change place or position.|{t} move to find what they need.`),
    extended: terms(`habitat|The natural place where an animal lives.|A habitat gives {t} space and food.
behavior|The way an animal acts.|The behavior of {t} can reveal their needs.
adapt|To change or be suited to conditions.|{t} adapt to the places where they live.
survival|Continuing to live despite challenges.|Food and shelter support the survival of {t}.
observe|To watch carefully and notice details.|We can observe {t} without disturbing them.
protect|To keep something safe from harm.|Healthy habitats help protect {t}.`),
  },
  'earth and space': {
    basic: terms(`place|An area or location.|{t} have a place in our world.
shape|The form or outline of something.|We can study the shape of {t}.
change|To become different.|Ideas about {t} can change with evidence.
look|To direct your eyes toward something.|We can look for clues about {t}.
far|At a great distance.|Some things about {t} are far away.
learn|To gain knowledge or a skill.|We can learn new facts about {t}.`),
    extended: terms(`evidence|Information that supports an explanation.|Evidence helps us explain {t}.
surface|The outside or top layer.|The surface matters when we study {t}.
process|A series of connected steps.|A process can explain changes in {t}.
measure|To find a size or amount.|Scientists measure features of {t}.
pattern|A repeated form or arrangement.|Patterns help us understand {t}.
explore|To travel through or investigate.|People explore questions about {t}.`),
  },
  'weather and nature': {
    basic: terms(`nature|Plants, animals, land, and weather.|We can find {t} in nature.
water|The clear liquid living things need.|Water is connected with {t}.
air|The gas around Earth that we breathe.|Air can affect {t}.
grow|To become larger over time.|We can watch ideas about {t} grow.
outside|Beyond a building.|We can notice {t} outside.
change|To become different.|{t} can change what we see.`),
    extended: terms(`climate|Usual weather in a place over many years.|Climate can shape where we find {t}.
cycle|A set of events that repeats.|A cycle can help explain {t}.
conditions|The surrounding things that affect an event.|Conditions affect how we experience {t}.
observe|To watch and notice carefully.|We can observe {t} over time.
environment|The surroundings of living things.|The environment shapes our experience of {t}.
variation|A difference between related things.|Variation makes {t} interesting to compare.`),
  },
  'everyday life': {
    basic: terms(`person|A human being.|A person can learn about {t}.
share|To use or enjoy together.|We can share ideas about {t}.
help|To make something easier for someone.|Talking can help us understand {t}.
choose|To pick between options.|People choose how to discuss {t}.
need|Something important or necessary.|People have different needs around {t}.
together|With other people.|We can learn about {t} together.`),
    extended: terms(`routine|Something done regularly.|A routine can shape our experience of {t}.
custom|A way of acting shared by a group.|Customs can affect how people approach {t}.
responsibility|A duty to care for something.|Responsibility matters in conversations about {t}.
community|People connected by place or interest.|A community can share ideas about {t}.
respect|Care for others and their choices.|Respect helps us discuss {t}.
decision|A choice made after thinking.|A decision about {t} can affect others.`),
  },
  'play and creativity': {
    basic: terms(`play|To do something for enjoyment.|People can play with ideas about {t}.
try|To attempt something new.|We can try an activity about {t}.
make|To create or build something.|We can make a picture about {t}.
learn|To gain a skill or knowledge.|We can learn by exploring {t}.
fun|Something enjoyable.|Learning about {t} can be fun.
idea|A thought or plan.|We can share an idea about {t}.`),
    extended: terms(`design|To plan how something will work.|We can design an activity about {t}.
practice|To repeat an action to improve.|Practice helps us talk clearly about {t}.
imagine|To form an idea in your mind.|We can imagine a new use for {t}.
balance|An even or steady arrangement.|Balance can matter in activities about {t}.
creative|Using new and imaginative ideas.|A creative question can start a talk about {t}.
collaborate|To work together on a goal.|Friends can collaborate on a project about {t}.`),
  },
  'digital life': {
    basic: terms(`screen|A display showing digital images or text.|A screen can change how people experience {t}.
online|Connected through the internet.|People may discuss {t} online.
choice|An option someone selects.|Choices shape how we use {t}.
tool|Something used to do a task.|A tool can make {t} easier to explore.
share|To let others see or use something.|People share ideas about {t}.
control|The ability to direct what happens.|Users want some control over {t}.`),
    extended: terms(`algorithm|A set of steps a computer follows.|An algorithm can influence experiences of {t}.
privacy|Control over personal information.|Privacy matters when people discuss {t} online.
interface|The part of a system a user works with.|An interface affects how people use {t}.
feedback|Information about the result of an action.|Feedback helps improve tools for {t}.
accessibility|Making something usable by different people.|Accessibility shapes who can take part in {t}.
trade-off|A choice where gaining one thing costs another.|A trade-off can arise when designing {t}.`),
  },
  'culture and relationships': {
    basic: terms(`culture|Shared practices and ideas in a group.|Culture influences how people understand {t}.
respect|Care for others and their choices.|Respect helps people talk about {t}.
express|To show an idea or feeling.|People express views about {t} differently.
choice|An option someone selects.|Personal choice matters in {t}.
share|To make something available to others.|People share experiences of {t}.
connect|To bring people into contact.|{t} can connect people in different ways.`),
    extended: terms(`identity|How people understand themselves or a group.|Identity can shape someone's view of {t}.
tradition|A practice passed between people over time.|Tradition can influence {t}.
interpret|To explain the meaning of something.|Two people may interpret {t} differently.
perspective|A person's way of seeing an issue.|Different perspectives deepen a talk about {t}.
belonging|The feeling of being accepted in a group.|Belonging can influence experiences of {t}.
boundary|A limit someone chooses for themselves.|A boundary can matter when discussing {t}.`),
  },
  'school and work': {
    basic: terms(`goal|Something a person aims to do.|A goal can guide choices about {t}.
plan|A set of steps for doing something.|A plan can make {t} easier to manage.
skill|An ability learned through practice.|A skill can be useful for {t}.
time|The period available for an activity.|Time affects decisions about {t}.
choice|An option someone selects.|Students make choices about {t}.
practice|Repeated work to improve.|Practice can support progress in {t}.`),
    extended: terms(`priority|Something considered more important than others.|A priority can change decisions about {t}.
feedback|Advice about what worked and what can improve.|Feedback can improve experiences of {t}.
opportunity|A chance to do something useful.|An opportunity can grow from {t}.
responsibility|A duty to act or care.|Responsibility matters when dealing with {t}.
balance|A fair mix of different needs.|Balance matters when planning {t}.
adaptability|The ability to adjust to change.|Adaptability can help people succeed with {t}.`),
  },
  'science and environment': {
    basic: terms(`system|Connected parts that work together.|We can study {t} as a system.
energy|The ability to make things happen.|Energy can be connected to {t}.
effect|A change caused by something.|{t} can have an effect on people.
resource|Something useful that people can use.|Resources matter in decisions about {t}.
measure|To find an amount or size.|We can measure something related to {t}.
change|To become different.|Our knowledge of {t} can change.`),
    extended: terms(`evidence|Information supporting an explanation.|Evidence improves decisions about {t}.
impact|An effect or influence.|The impact of {t} can vary by place.
innovation|A useful new idea or method.|Innovation can change how we approach {t}.
sustainability|Meeting needs without using up future resources.|Sustainability matters when planning {t}.
trade-off|A choice with a cost and a benefit.|A trade-off can arise in {t}.
evaluate|To judge using evidence and criteria.|We should evaluate claims about {t}.`),
  },
  'wellbeing and adventure': {
    basic: terms(`experience|Something a person does or lives through.|People can have different experiences of {t}.
challenge|Something difficult that needs effort.|A challenge can make {t} rewarding.
prepare|To get ready for an activity.|People prepare for {t} in different ways.
choice|An option someone selects.|Choices can change an experience of {t}.
support|Help given to another person.|Support can help someone try {t}.
goal|Something someone hopes to achieve.|A goal can make {t} meaningful.`),
    extended: terms(`perspective|A person's way of understanding something.|Perspective changes how people describe {t}.
resilience|The ability to recover after difficulty.|Resilience can develop through experiences of {t}.
strategy|A plan for reaching a goal.|A strategy helps people approach {t}.
uncertainty|Not knowing exactly what will happen.|Uncertainty can be part of {t}.
motivation|A reason for doing something.|Motivation affects how people engage with {t}.
reflection|Careful thought about an experience.|Reflection helps us learn from {t}.`),
  },
};

type Topic = { id: string; title: string; aliases: string[]; ageBand: 'kids' | 'teens'; category: string };
const dataPath = path.resolve('src/data/topic-briefings.json');
const topics = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as Topic[];
const content = [...kidsContent, ...teensContent];
if (topics.length !== 150 || content.length !== 150) throw new Error('Expected 150 topics and content seeds');

const trimPeriod = (sentence: string) => sentence.replace(/[.!?]$/, '');
const lowerFirst = (sentence: string) => sentence.charAt(0).toLowerCase() + sentence.slice(1);
const wordCount = (text: string) => text.trim().split(/\s+/).length;
const overviewTerms: Record<string, string> = {
  'Plant Growth': 'Plants', 'Caring for Pets': 'Pet care',
  'Festivals Around the World': 'Festivals', 'Jobs People Do': 'Jobs',
  'Digital Footprints': 'digital footprint', 'Robots and Automation': 'Automation',
  'Money and Saving': 'Saving', 'Sleep and Learning': 'Sleep',
  'Gap Years': 'gap year', 'Cities of the Future': 'Future cities',
  'Mysteries and Clues': 'Mystery stories',
};

function makeLevel(topic: Topic, seed: typeof content[number], level: 'A1' | 'A2' | 'B1' | 'B2') {
  const bank = banks[topic.category];
  if (!bank) throw new Error(`Missing category bank: ${topic.category}`);
  const firstExtras = (topic.ageBand === 'kids' ? kidsExtraTerms : teensExtraTerms)[topic.title];
  const extraVocab = level === 'A1' ? firstExtras : [...(firstExtras || []), ...(vocabSupplement[topic.title] || [])];
  if (!firstExtras || firstExtras.length !== 3 || !vocabSupplement[topic.title] || vocabSupplement[topic.title].length !== 2 || extraVocab.length !== (level === 'A1' ? 3 : 5)) {
    throw new Error(`Missing topic vocabulary: ${topic.title}`);
  }
  const options = level === 'A1' || (level === 'B1' && topic.ageBand === 'teens') ? bank.basic : bank.extended;
  const used = new Set(extraVocab.map((term) => term.word.toLowerCase()));
  const selected = options.filter((term) => !used.has(term.word.toLowerCase())).slice(0, level === 'A1' ? 3 : 1);
  if (selected.length !== (level === 'A1' ? 3 : 1)) throw new Error(`Category vocabulary shortage: ${topic.title}`);
  const t = topic.title.toLowerCase();
  const first = {
    word: overviewTerms[topic.title] || topic.title,
    definition: seed.overview,
    partOfSpeech: (overviewTerms[topic.title] || topic.title).split(' ').length > 2 ? 'phrase' : 'noun',
    example: seed.overview,
    starter: `I want to discuss ${t} because…`,
  };
  const vocab = [first, ...extraVocab.map((term, index) => {
    const example = [seed.overview, ...seed.facts].find((sentence) => sentence.toLowerCase().includes(term.word.toLowerCase()));
    if (!example) throw new Error(`${topic.title}: no example sentence for ${term.word}`);
    return {
      word: term.word,
      definition: term.definition,
      partOfSpeech: /^(swim|breathe|filter|store|melt|bring|listen|travel|bounce|revise|share|volunteer|navigate)$/.test(term.word) ? 'verb' : 'noun',
      example,
      starter: [`I can use ${term.word} to explain…`, `When I hear ${term.word}, I think of…`, `A question about ${term.word} is…`, `I would compare ${term.word} with…`, `One example of ${term.word} is…`][index],
    };
  }), ...selected.map((term, index) => ({
    word: term.word,
    definition: term.definition,
    partOfSpeech: /^(move|adapt|observe|protect|look|learn|grow|share|help|choose|play|try|make|imagine|collaborate|express|connect|practice|measure|change|prepare|evaluate)$/.test(term.word) ? 'verb' : /^(young|far|outside|fun|creative|online|together)$/.test(term.word) ? 'adjective' : 'noun',
    example: term.example.replace(/\{t\}/g, t).replace(/^./, (c) => c.toUpperCase()),
    starter: level === 'A1'
      ? [`I know about ${term.word} because…`, `My picture of ${term.word} shows…`, `I want to ask about ${term.word} because…`][index]
      : [`I want to compare ${term.word} with…`, `One example of ${term.word} is…`, `I would describe ${term.word} as…`][index],
  }))];
  const sentence = (index: number) => seed.facts[index];
  const briefing = level === 'A1'
    ? [seed.overview, sentence(0), sentence(1)].join(' ')
    : level === 'A2'
      ? [seed.overview, sentence(1), sentence(2), sentence(3)].join(' ')
      : level === 'B1'
        ? [seed.overview, sentence(0), sentence(2), sentence(3)].join(' ')
        : [seed.overview, `${trimPeriod(sentence(0))}; ${lowerFirst(sentence(1))}`, `${trimPeriod(sentence(2))}; ${lowerFirst(sentence(3))}`].join(' ');
  const expressions = level === 'A1' ? [
    { phrase: 'I think…', example: `I think ${lowerFirst(sentence(0))}` },
    { phrase: 'I can see…', example: `I can see ${t} in pictures.` },
    { phrase: 'I would choose…', example: `I would choose to learn about ${t}.` },
    { phrase: 'I wonder…', example: `I wonder about ${t}.` },
    { phrase: 'For example…', example: `For example, ${lowerFirst(sentence(2))}` },
    { phrase: 'What if…', example: `What if we studied ${t}?` },
  ] : [
    { phrase: 'One reason is…', example: `One reason is that ${lowerFirst(sentence(0))}` },
    { phrase: 'The evidence suggests…', example: `The evidence suggests that ${lowerFirst(sentence(1))}` },
    { phrase: 'For example…', example: `For example, ${lowerFirst(sentence(2))}` },
    { phrase: 'I would compare…', example: `I would compare ${t} with a related topic.` },
    { phrase: 'Another thing to consider is…', example: `Another thing to consider is that ${lowerFirst(sentence(3))}` },
    { phrase: 'This matters because…', example: `This matters because ${lowerFirst(sentence(0))}` },
  ];
  if (level === 'A1' || level === 'A2') {
    const limit = level === 'A1' ? 10 : 14;
    for (const text of [seed.overview, ...seed.facts]) {
      if (wordCount(text) > limit) throw new Error(`${topic.title} ${level} has a ${wordCount(text)}-word source sentence: ${text}`);
    }
  }
  return { briefing, facts: seed.facts, angles: seed.angles, vocab, expressions };
}

for (let index = 0; index < topics.length; index += 1) {
  const topic = topics[index];
  const seed = content[index];
  if (topic.title !== seed.title) throw new Error(`Topic order mismatch: ${topic.title} / ${seed.title}`);
  const levels = topic.ageBand === 'kids' ? ['A1', 'A2', 'B1'] as const : ['B1', 'B2'] as const;
  (topic as Topic & { levels: Record<string, unknown> }).levels = Object.fromEntries(levels.map((level) => [level, makeLevel(topic, seed, level)]));
}
fs.writeFileSync(dataPath, JSON.stringify(topics, null, 2) + '\n');
console.log(`Built ${topics.length} briefings (${kidsContent.length} kids, ${teensContent.length} teens; 380 levels).`);
