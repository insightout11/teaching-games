/** Rebuild only the reading packs whose retellings changed in round 16. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readingPassages, readingSentences } from './library-reading-sentences';
import { correctedPackFacts } from './library-round-16-pack-facts';

type Question = {q:string;options:string[];correctIndex:number};
type Pack = {passages:{text:string;gist:Question}[];predict:{q:string;options:string[];outcomeIndex:number};check:Question[];words:{word:string;meaning:string}[];cast:{name:string;who:string}[];talk:string};
type Book = {id:string;retellings:Record<string,{text:string}>;readingPack:Record<string,Pack>};
const file=path.join(process.cwd(),'src/data/book-library.json');
const books=JSON.parse(fs.readFileSync(file,'utf8')) as Book[];
const original=JSON.parse(execFileSync('git',['show','origin/main:src/data/book-library.json'],{encoding:'utf8'})) as Book[];
const glossary=new Map<string,string>();
for(const book of original)for(const pack of Object.values(book.readingPack))for(const entry of pack.words)glossary.set(entry.word.toLowerCase(),entry.meaning);
const extraGlossary:Record<string,string>={
  cyclone:'a powerful spinning storm', shadow:'a dark shape made when light is blocked', curtains:'cloth covers at a window', drawer:'a sliding box in furniture', nursery:'a room for young children', sailor:'a person working on a ship', stockade:'a fenced place built for defence', mutineers:'sailors rebelling against their captain', confession:'a statement admitting an action', disguise:'clothes or behaviour used to hide identity', ceremony:'a formal public event', invitation:'a request to join someone', warrant:'an official order to arrest someone', cellar:'a room below ground', performance:'an event shown to an audience', expedition:'a journey made for a purpose', levers:'handles used to control a machine', laboratory:'a room for scientific work', sled:'a vehicle that slides on snow', garden:'a place where plants are grown', seedlings:'young plants growing from seeds', companion:'a person who travels or spends time with another', frightened:'very afraid', embarrassed:'feeling awkward or ashamed', relieved:'no longer worried', medicine:'something used to treat illness', shadowed:'followed or watched closely', voyage:'a long journey by sea', judge:'a person who decides a court case', clues:'facts that help solve a mystery', figure:'a shape that looks like a person', spring:'water flowing naturally from the ground', powder:'material used in a gun', shelter:'a place that keeps someone safe', journey:'a trip between places', hiding:'staying where others cannot see you', prisoner:'someone held against their will', surprise:'an unexpected event', danger:'a chance of harm', alone:'without other people', trust:'believe someone will act well', protect:'keep someone safe', promise:'say you will do something', discover:'find something new', rescue:'save someone from danger', illness:'a time of being sick', warning:'a sign that harm may come', courage:'bravery when afraid', forest:'land covered with many trees', animal:'a living creature that moves and eats', mystery:'something not yet explained', captain:'person leading a ship', island:'land surrounded by water', treasure:'valuable things hidden away', machine:'a device that does work', secret:'something kept from others', detective:'someone who investigates a possible crime', evidence:'facts that help prove an idea', railway:'tracks and trains used for travel', passage:'a part of a journey or a piece of writing', surprised:'feeling something unexpected has happened', worried:'feeling concern about what may happen', strange:'unfamiliar or unusual', careful:'taking steps to avoid mistakes', loyal:'faithful to someone', weaker:'less strong', stronger:'more strong', anxious:'worried about what may happen', curious:'wanting to know more', escaped:'got away from danger', refused:'said no', returned:'came back', followed:'went after', decided:'made a choice', noticed:'saw or became aware of', whispered:'spoke very quietly', hurried:'moved quickly', carried:'took something while holding it', locked:'closed with a key', watch:'a small clock someone carries', storm:'violent weather', pool:'a small body of water', mouse:'a small animal with a long tail', birds:'animals with feathers and wings', fairy:'a tiny magical being in this story', pirates:'people who attack ships to steal', captaincy:'the job of leading a ship', footsteps:'sounds made by walking feet', courtyard:'an open area beside buildings', orphan:'a child whose parents have died', stranger:'someone not known to a person', aunt:'a parent’s sister', uncle:'a parent’s brother', fiance:'a person promised in marriage', relatives:'members of a family', sheltering:'giving a safe place to stay', search:'look carefully for something', dark:'having little or no light', trail:'a path through land', camp:'a place where people stay outdoors', fence:'a barrier around a place', boat:'a small water vehicle', window:'an opening in a wall with glass', letter:'a written message', map:'a drawing showing places', key:'an object that opens a lock', road:'a path for travel', shoes:'things worn on feet', school:'a place where people learn'
};
for(const [word,meaning] of Object.entries(extraGlossary))if(!glossary.has(word))glossary.set(word,meaning);
const simpleGlossary:Record<string,string>={
  farm:'land where crops or animals are raised', house:'a building where people live', wind:'moving air', sky:'the space above the ground', land:'the ground or a country', bed:'a place used for sleeping', floor:'the lower surface of a room', room:'a space inside a building', family:'people related to one another', home:'the place where someone lives', parents:'a child’s mother and father', child:'a young person', children:'young people', dog:'a common pet animal', cat:'a common pet animal', bird:'an animal with feathers and wings', leaf:'a flat green part of a plant', leaves:'flat green parts of a plant', tree:'a tall plant with a trunk', trees:'tall plants with trunks', rain:'water falling from clouds', cloud:'a mass of tiny water drops in the sky', water:'the clear liquid people drink', food:'things people eat', friend:'someone a person likes and trusts', friends:'people a person likes and trusts', boy:'a male child', girl:'a female child', woman:'an adult female person', man:'an adult male person', people:'more than one person', father:'a male parent', mother:'a female parent', brother:'a male sibling', sister:'a female sibling', voice:'the sound a person makes when speaking', sound:'something a person can hear', light:'brightness that makes things visible', fire:'heat and light from burning', ice:'frozen water', snow:'frozen white flakes', cold:'having little heat', warm:'having comfortable heat', high:'far above the ground', low:'near the ground', large:'big in size', small:'little in size', heavy:'hard to lift', quiet:'making little sound', afraid:'feeling fear', happy:'feeling pleasure', sad:'feeling unhappy', angry:'feeling strong displeasure', tired:'needing rest', lonely:'sad because one is alone', hungry:'wanting food', sick:'not well', safe:'free from danger', unsafe:'not free from danger', lost:'unable to find the way', found:'discovered or seen again', stopped:'came to an end', began:'started', started:'began', walked:'moved on foot', ran:'moved quickly on foot', jumped:'pushed off the ground', looked:'used the eyes to see', saw:'noticed with the eyes', heard:'noticed a sound', asked:'put a question to someone', told:'said something to someone', spoke:'used words aloud', called:'spoke loudly to someone', thought:'used the mind to consider', knew:'understood or was aware', learned:'came to know something', helped:'gave support to someone', wanted:'wished to have or do something', needed:'had to have something', waited:'stayed until something happened', arrived:'came to a place', entered:'went inside', left:'went away', moved:'changed place', climbed:'went upward', fell:'dropped down', held:'kept something in the hands', gave:'passed something to another', took:'picked up or carried away', kept:'continued to have', opened:'made an entrance or container accessible', closed:'shut an entrance or container', changed:'became different', appeared:'came into view', disappeared:'went out of sight', remembered:'brought something back to mind', forgot:'failed to remember', chosen:'selected from choices', reached:'arrived at or touched', carried:'took something along', broken:'damaged so it cannot work', inside:'within a place', outside:'beyond a place', nearby:'not far away', island:'land surrounded by water', river:'a long flow of water', sea:'a large body of salt water', shore:'land beside water', beach:'sand or stones beside water', road:'a way used for travel', path:'a narrow way through land', woods:'an area of many trees', forest:'land covered with trees', garden:'an area where plants grow', village:'a small group of homes', city:'a large town', town:'a place where many people live', ship:'a large boat', train:'a vehicle running on tracks', carriage:'a vehicle pulled by horses', horse:'a large animal people can ride', animal:'a living creature that can move', rabbit:'a small animal with long ears', lion:'a large wild cat', wolf:'a wild dog-like animal', mouse:'a small animal with a long tail', sweets:'small pieces of candy', cake:'a sweet baked food', drink:'liquid taken into the mouth', bottle:'a container for liquid', pocket:'a small space sewn into clothes', table:'furniture with a flat top', chair:'a seat for one person', book:'pages bound together to read', story:'an account of events', picture:'an image of a person or thing', photograph:'a picture made with a camera', clock:'a device that shows time', watch:'a small clock carried by a person', time:'what clocks measure', day:'the time from morning to night', night:'the dark part of a day', morning:'the first part of a day', evening:'the late part of a day', years:'periods of twelve months', month:'one of twelve parts of a year', week:'seven days', hour:'sixty minutes', minutes:'short units of time', moment:'a very short time', place:'a particular area', country:'a nation', world:'the Earth and its people', face:'the front of a head', hand:'the end of an arm', hands:'the ends of arms', eyes:'body parts used for seeing', feet:'body parts used for walking', head:'the top part of a body', body:'the physical form of a person or animal', heart:'an organ that pumps blood', mouth:'body part used for eating and speaking', hair:'strands growing from the head', clothes:'things people wear', shoes:'things worn on feet', coat:'outer clothing for warmth', hat:'a covering worn on the head'
};
for(const [word,meaning] of Object.entries(simpleGlossary))if(!glossary.has(word))glossary.set(word,meaning);
const present=(text:string,term:string)=>new RegExp(`(^|[^A-Za-z])${term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^A-Za-z]|$)`,'i').test(text);
function question(q:string,real:string,wrong1:string,wrong2:string,seed:number):Question{
  const options=[wrong1,wrong2];const correctIndex=seed%3;options.splice(correctIndex,0,real);return {q,options,correctIndex};
}
const actors='Alice|Dorothy|Peter|Wendy|Jim|Silver|Mary|Colin|Buck|Victor|Holmes|Watson|Fogg|Passepartout|Aouda|Traveller|traveller|Weena|Nana|Irene|Dickon|Thornton|Walton|Elizabeth|Henry|Mowgli|Baloo|Bagheera|Kaa|Kotick|Scarecrow|Rabbit|Mouse|Dodo|Lion|Wolf|Crane|Ass|Grasshopper|Fix|Smollett|Gunn';
function mainEvent(text:string):string{
  const sentences=readingSentences(text);
  const lead=new RegExp(`^(?:(?:After|When|While|As|At|In|One day)\\s+)?(?:The\\s+)?(?:White\\s+)?(?:Mrs\\.\\s+|Mr\\.\\s+|Dr\\.\\s+)?(?:${actors})\\b`,'i');
  return sentences.find(sentence=>lead.test(sentence)&&sentence.length<=155)
    ||sentences.find(sentence=>new RegExp(`\\b(?:${actors})\\b`,'i').test(sentence)&&sentence.length<=155)
    ||sentences.find(sentence=>sentence.length<=155)||sentences[0];
}
function gistStem(event:string,index:number):string{
  const actor=(event.match(new RegExp(`\\b(?:Mrs\\.\\s+Darling|Mr\\.\\s+Darling|White Rabbit|Robert Walton|John Thornton|${actors})\\b`,'i'))||[])[0];
  if(!actor)return ['Which event happens in this scene?','What happens at this point in the story?','Which action moves the story forward here?'][index%3];
  const name=actor==='White Rabbit'?'the White Rabbit':actor;
  const stems=[`Which event involving ${name} opens this scene?`,`What happens around ${name} at this point?`,`Which moment involving ${name} appears here?`,`What happens next to ${name} in this part?`,`Which action involves ${name} in this passage?`,`What happens in ${name}'s part of the story?`];
  return stems[index%stems.length];
}
function fiveWords(text:string,old:{word:string;meaning:string}[],id:string):{word:string;meaning:string}[]{
  const tokens=(text.match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g)||[]).map(word=>word.toLowerCase());
  const inText=new Set(tokens);
  const preferredBySeries:Record<string,string[]>={
    jungle:['jungle','wolf','tiger','pack','ruins','seals','forest','cave'],alice:['rabbit','garden','mouse','pool','fan','race','thimble'],oz:['cyclone','prairie','witch','road','scarecrow','forest','storm'],peter:['nursery','shadow','fairy','medicine','pirates','window','flight'],sherlock:['detective','photograph','disguise','bank','tunnel','typed','confession','clues'],aesop:['lion','mouse','wolf','lamb','dew','crane','bone'],treasure:['mutiny','stockade','treasure','map','ship','pirates','sailor'],time:['machine','future','fire','well','palace','underground'],frankenstein:['creature','laboratory','glacier','trial','experiment','ice'],call:['sled','ranch','wolf','harness','ice','camp'],around:['wager','timetable','ship','train','warrant','temple','performance'],secret:['garden','robin','seedlings','manor','illness','key']
  };
  const series=id.replace(/^book6?-/, '').split('-')[0];
  const preferred=(preferredBySeries[series]||[]).filter(word=>inText.has(word)&&glossary.has(word));
  const candidates=old.map(entry=>entry.word.toLowerCase()).filter(word=>inText.has(word));
  const strong=tokens.filter(word=>word.length>=5&&glossary.has(word)&&!['there','their','these','those','which','would','could','should','after','before','again','about','where','while','every','other','first','still','because'].includes(word));
  const selected=Array.from(new Set([...preferred,...candidates,...strong])).slice(0,5);
  if(selected.length!==5)throw new Error(`Only ${selected.length} glossed words for text starting ${text.slice(0,30)}`);
  return selected.map(word=>({word,meaning:glossary.get(word)!}));
}
function fixCast(text:string,old:{name:string;who:string}[]):{name:string;who:string}[]{
  const result:{name:string;who:string}[]=[];
  for(const character of old){
    const unbracketed=character.name.replace(/\s*\([^)]*\)/g,'');
    const parts=unbracketed.replace(/^(?:Dr|Mr|Mrs|Ms)\.\s*/,'').split(/\s+/);
    const choices=[character.name,unbracketed,parts.slice(-1)[0],parts[0]];
    const name=choices.find(choice=>present(text,choice));
    if(name&&!result.some(entry=>entry.name.toLowerCase()===name.toLowerCase()))result.push({name,who:character.who});
  }
  if(!result.length)throw new Error(`No cast appears in text: ${text.slice(0,40)}`);
  return result;
}
let changed=0,passages=0,castRepairs=0;
for(let bookIndex=0;bookIndex<books.length;bookIndex++){
  const book=books[bookIndex],before=original[bookIndex];
  if(book.id!==before.id)throw new Error(`Book order changed at ${bookIndex}`);
  for(const [levelIndex,level] of Array.from(Object.keys(book.retellings).entries())){
    const version=book.retellings[level];
    const oldPack=before.readingPack[level];
    const pack=book.readingPack[level];
    if(version.text!==before.retellings[level].text){
      const parts=readingPassages(version.text);
      const events=parts.map(mainEvent);
      pack.passages=parts.map((text,index)=>({text,gist:question(gistStem(events[index],index+levelIndex),events[index],events[(index+2)%events.length],events[(index+3)%events.length],bookIndex+index+levelIndex)}));
      const facts=correctedPackFacts[book.id];
      if(facts){
        const predict=question(pack.predict.q,...facts.predict,bookIndex+levelIndex);
        pack.predict={q:predict.q,options:predict.options,outcomeIndex:predict.correctIndex};
        pack.check=facts.check.map(([q,real,wrong1,wrong2],index)=>question(q,real,wrong1,wrong2,bookIndex+index+levelIndex));
        if(facts.talk)pack.talk=facts.talk;
      }
      pack.words=fiveWords(version.text,oldPack.words,book.id);
      changed++;passages+=parts.length;
    }
    const repaired=fixCast(version.text,pack.cast);
    if(JSON.stringify(repaired)!==JSON.stringify(pack.cast)){pack.cast=repaired;castRepairs++;}
  }
}
fs.writeFileSync(file,JSON.stringify(books,null,2)+'\n');
console.log(`Rebuilt ${changed} changed reading packs with ${passages} passages; repaired cast names in ${castRepairs} packs.`);

