/** Build reading packs from reviewed chapter outlines and exact existing retellings. */
import fs from 'node:fs';
import path from 'node:path';
import { chapterSpecs } from './library-round-15-specs';
import { readingPassages, readingSentences } from './library-reading-sentences';

type Book = { id: string; title: string; flightQuestion: string; retellings: Record<string, { text: string }>; readingPack?: unknown };
const file = path.join(process.cwd(), 'src/data/book-library.json');
const books = JSON.parse(fs.readFileSync(file, 'utf8')) as Book[];
const specs = new Map(chapterSpecs.map(spec => [spec.id, spec]));
if (specs.size !== books.length) throw new Error(`Expected ${books.length} chapter specs; found ${specs.size}`);

const glossary: Record<string, string> = {
  accept:'say yes to', accuse:'say someone did wrong', accused:'said to have done wrong', adventure:'an exciting and risky experience', afraid:'feeling scared', agree:'say yes to a plan', alone:'without other people', angry:'feeling strong displeasure', answer:'a reply to a question', argument:'a disagreement with reasons', attack:'try to hurt someone', avoid:'keep away from', believe:'think something is true', brave:'ready to face danger', breath:'air taken into the lungs', careful:'thinking before acting', caught:'held and unable to escape', chance:'an opportunity', change:'become different', choice:'one option you can take', claim:'say something is true', clue:'a sign that helps solve something', comfort:'a feeling of safety and ease', companion:'someone who spends time with you', confidence:'belief in your ability', confuse:'make someone unsure', consequence:'what happens because of an action', courage:'strength to face fear', danger:'a chance of harm', dangerous:'likely to cause harm', decide:'choose what to do', decision:'a choice made after thinking', defend:'protect from attack', delay:'make something happen later', demand:'ask for something firmly', disappear:'go out of sight', discover:'find something new', doubt:'feel unsure', evidence:'facts that support an idea', exhausted:'extremely tired', explain:'make something clear', explore:'travel to learn about a place', fair:'treating people justly', frightened:'scared', generous:'willing to give', gentle:'kind and not rough', gratitude:'thanks for help', guilty:'responsible for doing wrong', habit:'something done often', help:'give support', hidden:'kept out of sight', honest:'telling the truth', hope:'wish for a good result', ignore:'pay no attention to', injured:'hurt', journey:'travel from one place to another', kindness:'caring treatment of others', learn:'gain new understanding', leader:'person or animal guiding others', lonely:'sad because of being alone', loyal:'faithful to a person or group', mercy:'kindness toward someone in your power', mystery:'something not yet explained', nervous:'worried about what may happen', notice:'see or become aware of', offer:'say you are willing to give', ordinary:'usual and not special', patience:'ability to wait calmly', persuade:'lead someone to agree', plan:'an idea for what to do', protect:'keep someone safe', promise:'say you will do something', proud:'pleased with yourself', punish:'make someone suffer for wrongdoing', reason:'an explanation for why', realize:'come to understand', rescue:'save from danger', responsibility:'a duty to care or act', reward:'something given for help', risk:'chance of something bad happening', secret:'something kept from others', selfish:'caring mainly about yourself', shelter:'a safe place to stay', silent:'making no sound', skill:'an ability learned with practice', strength:'power of body or mind', struggle:'try hard against difficulty', survive:'stay alive through danger', suspect:'think someone may be responsible', threat:'a warning of possible harm', trust:'believe someone will act well', truth:'what really happened', unfair:'not just or equal', useful:'able to help', warning:'a sign of danger', weak:'lacking strength', wonder:'think with curiosity', worried:'feeling uneasy',
  ambition:'a strong wish to achieve something', anchored:'held in place', approach:'come nearer', aboard:'on a ship or vehicle', astonished:'very surprised', bargain:'an agreement between people', barrel:'a large round container', betrayed:'let down by someone trusted', cabin:'a small room on a ship', captain:'person in charge of a ship', ceremony:'a formal event', convicted:'found guilty by a court', courtship:'time spent seeking marriage', creature:'a living being', crew:'people working on a ship', cruelty:'pleasure in causing harm', curious:'wanting to know more', disguise:'a changed appearance that hides identity', disturb:'interrupt rest or peace', faint:'hard to see or hear', glancing:'looking quickly', glacier:'a large slow-moving body of ice', greed:'strong desire for more than needed', guard:'person who protects a place', hardship:'a difficult condition', horizon:'line where earth seems to meet sky', island:'land surrounded by water', mutiny:'rebellion by a ship crew', passage:'part of a journey or text', powder:'explosive material used in guns', pursuit:'the act of chasing', quarrel:'an angry disagreement', relatives:'family members', restore:'bring back to a good state', routine:'usual repeated pattern', sailor:'person who works on a ship', scar:'mark left by a healed wound', shore:'land beside water', suspicion:'a feeling that something is wrong', timetable:'a schedule of times', tunnel:'a passage dug underground', vessel:'a ship or boat', voyage:'a long journey by sea', wager:'a bet on an outcome', wilderness:'an area with little human settlement', photograph:'a picture made with a camera', reputation:'what others think of someone', marriage:'a legally recognized partnership', distraction:'something that takes attention away', smoke:'cloud from something burning', intelligence:'ability to understand and reason', investigated:'examined closely to find the truth', judgment:'careful decision or opinion', threatened:'warned that harm might happen', embarrassment:'an uncomfortable feeling of shame', picture:'an image of someone or something', masked:'wearing something that covers the face', visitor:'someone who comes to see another', worker:'person who does a job', country:'a nation with its own government',
  animal:'a living creature that moves and eats', bear:'a large furry animal', cave:'a hollow place in rock', forest:'land filled with trees', jungle:'thick tropical forest', monkey:'a climbing animal', mouse:'a small animal with a long tail', lion:'a large wild cat', lamb:'a young sheep', wolf:'a wild dog-like animal', tiger:'a large striped wild cat', garden:'a place where plants are grown', flower:'the colorful part of a plant', river:'a large natural stream', net:'woven threads used to catch things', rope:'a thick strong cord', stream:'a small flowing river', village:'a small group of homes', castle:'a large fortified building', palace:'a ruler’s grand home', queen:'a female ruler', king:'a male ruler', rabbit:'a small animal with long ears', bread:'food made from baked dough', water:'liquid people and animals drink', food:'something eaten for energy', train:'a vehicle running on tracks', ship:'a large boat', map:'a drawing that shows places', door:'an entrance that opens and closes', key:'an object that opens a lock', winter:'the cold season', snow:'frozen white flakes', fire:'heat and light from burning', gold:'a valuable yellow metal', treasure:'valuable things hidden away', straw:'dry plant stalks used for filling', pole:'a long straight stick', brain:'the organ used for thinking', thoughtful:'showing careful thinking', ability:'power to do something', destination:'place someone is going', fence:'a barrier around a place', machine:'a device that does work', future:'time that has not happened yet', darkness:'absence of light', underground:'below the surface of the earth', inventor:'someone who creates new devices', locked:'closed with a key', scientist:'someone who studies the natural world', laboratory:'a room for scientific work', trial:'a court process to decide guilt', prison:'a place where people are held as punishment', sled:'a vehicle pulled over snow', crossing:'a place to go across', ice:'frozen water', ranch:'a large farm for animals', detective:'someone who investigates a possible crime', railway:'a track and service for trains', robber:'a person who steals', warrant:'an official order for an arrest', temple:'a building for worship', robin:'a small bird with a red breast', plants:'living things that grow in soil', seedlings:'young plants growing from seeds', illness:'a condition of being sick', movement:'the act of changing position', encouragement:'words or acts that give confidence',
};

const castBySeries: Record<string, [string, string, string?][]> = {
  jungle: [['Mowgli','a human child raised by wolves'],['Mother Wolf','the wolf who protects Mowgli'],['Father Wolf','the wolf who raises Mowgli'],['Shere Khan','the tiger threatening Mowgli'],['Baloo','the bear who teaches jungle laws'],['Bagheera','the panther who guides Mowgli'],['Kaa','a python who helps rescue Mowgli'],['Akela','the aging leader of the pack'],['Kotick','a young seal seeking a safe home']],
  alice: [['Alice','a curious girl exploring a strange world'],['White Rabbit','a hurried rabbit Alice follows'],['Cheshire Cat','a cat offering puzzling advice'],['Queen of Hearts','a ruler quick to threaten others'],['Mad Hatter','a guest at the unusual tea party'],['March Hare','another guest at the tea party'],['Dormouse','a sleepy guest at tea'],['Mock Turtle','a creature telling Alice stories'],['Gryphon','a creature guiding Alice around Wonderland'],['Dinah','Alice’s cat who frightens other animals'],['Bill','a lizard sent into the chimney']],
  oz: [['Dorothy','a girl trying to return home'],['Toto','Dorothy’s loyal little dog'],['Scarecrow','a friend who wants a brain'],['Tin Woodman','a friend who wants a heart'],['Cowardly Lion','a lion hoping to find courage'],['Glinda','a good witch who helps Dorothy'],['Wicked Witch','an enemy who threatens the travellers'],['Wizard','the ruler whose power is questioned']],
  peter: [['Peter Pan','a boy who will not grow up','Peter'],['Wendy','a girl caring for lost boys'],['John','Wendy’s brother on the adventure'],['Michael','Wendy’s younger brother on the adventure'],['Tinker Bell','a small fairy close to Peter'],['Captain Hook','a pirate who fears Peter','Hook'],['Mr. Darling','the children’s father in London'],['Mrs. Darling','the children’s mother in London'],['Tiger Lily','a girl Peter helps in Neverland']],
  sherlock: [['Sherlock Holmes','a detective who studies small clues','Holmes'],['Dr. Watson','Holmes’s friend and story narrator','Watson'],['Irene Adler','a clever singer protecting her independence','Irene'],['King of Bohemia','a ruler seeking a private photograph','King'],['Jabez Wilson','a shopkeeper offered a strange job','Wilson'],['Vincent Spaulding (John Clay)','a shop assistant hiding a criminal plan','Spaulding'],['Mary Sutherland','a woman seeking her missing fiancé','Mary'],['Hosmer Angel','the false fiancé in Mary’s case','Hosmer'],['James Windibank','Mary’s stepfather hiding behind a disguise','Windibank'],['James McCarthy','a young man accused of murder','McCarthy'],['John Turner','a man with a dangerous secret','Turner'],['Alice Turner','a friend who believes James is innocent','Alice']],
  aesop: [['lion','a powerful animal who learns humility'],['mouse','a small animal who offers help'],['wolf','an animal using power unfairly'],['lamb','a young sheep answering an accusation'],['ass','an animal trying to copy another'],['grasshopper','a singing insect with different needs'],['crane','a long-beaked bird who helps a wolf']],
  'treasure-island': [['Jim Hawkins','a young boy learning about danger','Jim'],['Billy Bones','an old sailor carrying secret papers','Billy'],['Dr. Livesey','a doctor who helps Jim','Livesey'],['Squire Trelawney','a wealthy man funding the voyage','Trelawney'],['Long John Silver','a charming cook leading the pirates','Silver'],['Captain Smollett','the cautious captain of the ship','Smollett'],['Ben Gunn','a stranded sailor who moved treasure','Ben'],['Israel Hands','a pirate who threatens Jim','Hands'],['Blind Pew','a pirate seeking Billy’s papers','Pew'],['Black Dog','a sailor who confronts Billy Bones'],['Captain Flint','a pirate whose map shows treasure','Flint']],
  'time-machine': [['Time Traveller','the inventor travelling into the future','Traveller'],['Weena','a young Eloi befriending the traveller']],
  frankenstein: [['Victor Frankenstein','a scientist who creates a living being','Victor'],['Robert Walton','an explorer listening to Victor’s account','Walton'],['Elizabeth','Victor’s cousin and later wife'],['Henry Clerval','Victor’s loyal friend from home','Henry'],['William','Victor’s youngest brother who is killed'],['Justine','a servant wrongly convicted of murder'],['creature','Victor’s abandoned creation seeking companionship']],
  'call-of-wild': [['Buck','a dog adapting to harsh northern life'],['Spitz','a rival dog leading the team'],['John Thornton','a man who saves Buck’s life','Thornton'],['Judge Miller','Buck’s first owner in California']],
  'around-world': [['Phileas Fogg','a traveller racing to win a wager','Fogg'],['Passepartout','Fogg’s servant and travelling companion'],['Aouda','a woman rescued during the journey'],['Fix','a detective pursuing Fogg']],
  'secret-garden': [['Mary Lennox','a lonely girl discovering a garden','Mary'],['Mrs. Medlock','a servant who explains house rules','Medlock'],['Martha','a servant who speaks plainly'],['Dickon','a boy who understands plants and animals'],['Colin','Mary’s cousin gaining confidence'],['Archibald Craven','Colin’s grieving father returning home','Mr. Craven']],
};

// The teen retellings contain a short plot section followed by reflective text. These
// summaries keep the early questions focused on the actual chapter events.
const teenOpeningEvents: Record<string, string> = {
  'book6-treasure-island-1': 'Jim meets a frightening sailor at the inn|Billy receives warnings from other pirates|Jim and his mother search Billy’s papers|Pirates arrive looking for the packet|Jim shows a treasure map to Livesey and Trelawney',
  'book6-treasure-island-2': 'Jim meets cheerful Long John Silver|Smollett distrusts the crew and moves the weapons|Silver wins Jim’s trust during the voyage|Jim hears Silver plan a mutiny|The loyal passengers prepare without alerting the pirates',
  'book6-treasure-island-3': 'Jim sees Silver kill a loyal sailor|Jim meets the stranded Ben Gunn|The loyal group defends a stockade|Jim leaves to move the ship|Israel Hands secretly threatens Jim',
  'book6-treasure-island-4': 'Jim struggles with Hands and saves the ship|Silver stops pirates from hurting Jim|Ben Gunn has already moved the treasure|The loyal group regains control and sails home',
  'book6-time-machine-1': 'A traveller shows his guests a time machine|He reaches a future world of gentle Eloi|His machine vanishes before he can return',
  'book6-time-machine-2': 'The traveller rescues Weena and sees the Eloi fear darkness|He finds the machine missing near a locked building|A white figure suggests another people live nearby',
  'book6-time-machine-3': 'The traveller discovers Morlocks working underground|They attack him when he reaches his machine|He tries to protect Weena with fire',
  'book6-time-machine-4': 'Weena is lost as fire spreads through the forest|The traveller escapes and sees the far future|He tells his guests, then leaves again',
  'book6-frankenstein-1': 'Walton meets Victor in the Arctic|Victor describes his drive to create life|He succeeds but abandons the frightened creation',
  'book6-frankenstein-2': 'Victor learns that William has been murdered|He suspects the creature but remains silent|Justine is convicted while Victor feels guilty',
  'book6-frankenstein-3': 'The creature tells Victor how it learned from a family|It asks Victor for a companion|Victor destroys the companion and faces a threat',
  'book6-frankenstein-4': 'The creature kills people close to Victor|Victor pursues it until Walton turns his ship back|Victor dies and the creature mourns him',
  'book6-call-of-wild-1': 'Buck is taken from Judge Miller’s ranch|Harsh treatment teaches him new rules|The northern world demands strength and caution',
  'book6-call-of-wild-2': 'Buck learns new ways to survive the cold|The sled team struggles under heavy work|Buck defeats Spitz and becomes leader',
  'book6-call-of-wild-3': 'Inexperienced owners push the exhausted dogs|Thornton saves Buck from a deadly crossing|Buck loves Thornton but hears the wild calling',
  'book6-call-of-wild-4': 'Buck finds Thornton killed after returning from the forest|He joins the wolves and becomes their leader|His life changes through experience rather than one moment',
  'book6-around-world-1': 'Fogg wagers he can circle the world in eighty days|Fix follows him on suspicion of theft|The travellers rescue Aouda despite losing time',
  'book6-around-world-2': 'A case delays the travellers in Calcutta|Aouda stays because her relative has moved|Passepartout is separated and sails alone',
  'book6-around-world-3': 'The group crosses America by train|Fogg turns back to rescue Passepartout|They lose time but continue the journey',
  'book6-around-world-4': 'Fogg struggles to reach London|Fix arrests him just before his return|Passepartout discovers they gained a day',
  'book6-secret-garden-1': 'Mary comes to her uncle’s lonely house|Martha tells her about life beyond the rooms|Mary finds a key near a locked garden',
  'book6-secret-garden-2': 'Mary enters the hidden garden|Dickon helps her care for its plants|Mary meets Colin, who fears he will never walk',
  'book6-secret-garden-3': 'Mary invites Colin to the garden|Dickon helps him notice living things|The children gain confidence and friendship',
  'book6-secret-garden-4': 'Colin grows stronger through time in the garden|His grieving father returns home|The father sees Colin standing and embraces him',
};
const talkOverrides: Record<string, string> = {
  'book-jungle-2':'Should Baloo ask Kaa to frighten the monkeys?',
  'book-alice-2':'Should Alice mention Dinah after the mouse grows upset?',
  'book-alice-3':'Should Alice give everyone a prize after the race?',
  'book-oz-2':'Should Dorothy trust the people she has just met?',
  'book-peter-2':'Should Wendy leave home to help the Lost Boys?',
  'book-peter-4':'Should Wendy choose home or another adventure?',
  'book-sherlock-1':'Should Holmes help the king take Irene’s photograph?',
  'book-sherlock-4':'Should Holmes tell James what he learned about Turner?',
  'book-aesop-1':'Should the lion release the mouse that disturbed him?',
  'book6-time-machine-1':'Should the traveller trust the Eloi’s peaceful appearance?',
  'book6-time-machine-3':'Should the traveller enter the Morlocks’ underground home?',
  'book6-frankenstein-2':'Should Victor speak up at Justine’s trial?',
  'book6-frankenstein-4':'Should Walton turn his ship back for the crew?',
  'book6-call-of-wild-1':'Should Buck resist the man in the red sweater?',
  'book6-call-of-wild-4':'Should Buck join the wolves after Thornton dies?',
  'book6-around-world-2':'Should Fogg wait for Passepartout or keep his schedule?',
  'book6-around-world-4':'Should Fogg continue his wager after Fix arrests him?',
  'book6-secret-garden-1':'Should Mary open the locked garden?',
  'book6-secret-garden-3':'Should Mary share the garden with Colin?',
  'book6-secret-garden-4':'Should Colin surprise his father or tell him sooner?',
};

function seriesFor(id: string): string { return id.replace(/^book6?-/, '').replace(/-\d+$/, ''); }
function present(text: string, term: string): boolean { return new RegExp(`(^|[^A-Za-z])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z]|$)`, 'i').test(text); }
function options(real: string, wrong1: string, wrong2: string, seed: number): { options: string[]; correctIndex: number } {
  const correctIndex = seed % 3;
  const result = [wrong1, wrong2]; result.splice(correctIndex, 0, real);
  return { options: result, correctIndex };
}
function shortSentence(part: string, used: Set<string>): string {
  const sentences = readingSentences(part);
  const chosen = sentences.find(sentence => !used.has(sentence.toLowerCase())) || sentences[0];
  used.add(chosen.toLowerCase());
  return chosen;
}
function autoEvents(passages: string[]): string[] {
  const used = new Set<string>();
  return passages.map(passage => shortSentence(passage, used));
}
const preferredWords: Record<string, string[]> = {
  'treasure-island': ['mutiny','treasure','packet','sailor','crew','map','vessel','voyage','barrel','captain','stockade','shore','island','greed','danger'],
  'time-machine': ['machine','future','traveller','darkness','underground','creature','fire','danger','suspect','explore','responsibility'],
  frankenstein: ['creature','ambition','scientist','companion','glacier','convicted','trial','guilty','responsibility','abandon','danger'],
  'call-of-wild': ['ranch','sled','wilderness','shelter','strength','cruelty','survive','loyal','danger','struggle'],
  'around-world': ['wager','timetable','railway','detective','robber','warrant','vessel','journey','delay','rescue'],
  'secret-garden': ['garden','robin','locked','seedlings','illness','movement','encouragement','curious','lonely','restore'],
};
function fiveWords(text: string, id: string): {word:string;meaning:string}[] {
  const textWords = new Set((text.match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g) || []).map(word => word.toLowerCase()));
  const words = Object.keys(glossary).filter(word => textWords.has(word));
  const strong = words.filter(word => !['animal','bear','cave','forest','jungle','monkey','mouse','lion','lamb','wolf','tiger','garden','flower','river','stream','village','bread','water','food','train','ship','map','door','key','winter','snow','fire','gold','treasure','help','answer','learn','hope','change','chance'].includes(word));
  const preferred = (preferredWords[seriesFor(id.split(' ')[0])] || []).filter(word => words.includes(word));
  const selected = Array.from(new Set([...preferred, ...strong, ...words])).slice(0, 5);
  if (selected.length !== 5) throw new Error(`Only ${selected.length} glossed words in ${id}`);
  return selected.map(word => ({ word, meaning: glossary[word] }));
}
function cast(id: string, text: string): {name:string;who:string}[] {
  const candidates = castBySeries[seriesFor(id)];
  if (!candidates) throw new Error(`Missing cast for ${id}`);
  const found = candidates.filter(([name,,alias]) => present(text,name) || Boolean(alias && present(text,alias))).map(([name,who]) => ({name,who}));
  if (!found.length) throw new Error(`No cast for ${id}`);
  return found;
}

let total = 0, passagesTotal = 0;
for (let chapterIndex = 0; chapterIndex < books.length; chapterIndex += 1) {
  const book = books[chapterIndex];
  const spec = specs.get(book.id);
  if (!spec) throw new Error(`Missing spec ${book.id}`);
  const packs: Record<string,unknown> = {};
  const levelEntries = Object.entries(book.retellings);
  for (let levelIndex = 0; levelIndex < levelEntries.length; levelIndex += 1) {
    const [level, retelling] = levelEntries[levelIndex];
    const passages = readingPassages(retelling.text);
    const outline = levelIndex === 0 ? spec.events : spec.upper || spec.events;
    const authored = (outline || teenOpeningEvents[book.id] || '').split('|').filter(Boolean);
    const automatic = autoEvents(passages);
    const events = authored.concat(automatic.slice(authored.length));
    if (events.length !== passages.length) throw new Error(`${book.id} ${level}: ${events.length} events, ${passages.length} passages`);
    const gist = passages.map((text, index) => ({
      text,
      gist: { q: level === 'A2' ? 'What is the main idea here?' : 'Which idea best describes this part?', ...options(events[index], events[(index+2)%events.length], events[(index+4)%events.length], chapterIndex+index+levelIndex) },
    }));
    const prediction = options(...spec.predict, chapterIndex+levelIndex);
    const check = spec.check.map(([q,real,wrong1,wrong2], index) => ({ q, ...options(real,wrong1,wrong2,chapterIndex+index+levelIndex) }));
    packs[level] = {
      passages: gist,
      predict: { q: level === 'A2' ? 'What might happen in this story?' : 'What do you think will happen in this chapter?', options: prediction.options, outcomeIndex: prediction.correctIndex },
      check,
      words: fiveWords(retelling.text, `${book.id} ${level}`),
      cast: cast(book.id, retelling.text),
      talk: spec.talk || talkOverrides[book.id] || book.flightQuestion,
    };
    total += 1; passagesTotal += passages.length;
  }
  book.readingPack = packs;
}
fs.writeFileSync(file, JSON.stringify(books,null,2)+'\n');
console.log(`Wrote ${total} reading packs with ${passagesTotal} passages for ${books.length} book lessons.`);
