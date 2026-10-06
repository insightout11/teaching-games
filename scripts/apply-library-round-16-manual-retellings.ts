import fs from 'node:fs';
import path from 'node:path';
import { manualTeenRetellings } from './library-round-16-manual-retellings';
import { readingSentences } from './library-reading-sentences';
type Version = {text:string;wordCount:number};
type Book = {id:string;summary:string;wordCount:number;retellings:Record<string,Version>};
const file=path.join(process.cwd(),'src/data/book-library.json');
const books=JSON.parse(fs.readFileSync(file,'utf8')) as Book[];
const issues:string[]=[];
const proper=/^(?:Jim|Billy|Silver|Smollett|Ben|Dr\.|Mr\.|Mrs\.|Mary|Colin|Dickon|Victor|Henry|Walton|Elizabeth|Buck|Spitz|Thornton|Fogg|Passepartout|Aouda|Fix|Alice|Dorothy|Peter|Wendy|Toto|Nana|Holmes|Watson|Irene|Windibank|Turner|Weena|The Time Traveller|The Traveller)\b/;
function tighten(text:string):string{
  const paragraphs=text.split(/\n\s*\n/).map(readingSentences);
  let total=paragraphs.reduce((count,part)=>count+part.length,0);
  while(total>32){
    let best:{paragraph:number;sentence:number;words:number}|undefined;
    for(let paragraph=0;paragraph<paragraphs.length;paragraph++)for(let sentence=0;sentence<paragraphs[paragraph].length-1;sentence++){
      const left=paragraphs[paragraph][sentence],right=paragraphs[paragraph][sentence+1];
      const words=(left+' '+right).trim().split(/\s+/).length;
      if(!left.endsWith('.')||!right.endsWith('.')||words>32||left.includes('“')||right.includes('”'))continue;
      if(!best||words<best.words)best={paragraph,sentence,words};
    }
    if(!best)throw new Error('Cannot tighten a retelling to eight passages');
    const part=paragraphs[best.paragraph],left=part[best.sentence];
    let right=part[best.sentence+1];
    if(!proper.test(right))right=right[0].toLowerCase()+right.slice(1);
    part.splice(best.sentence,2,left.slice(0,-1)+'; '+right);
    total--;
  }
  return paragraphs.map(part=>part.join(' ')).join('\n\n');
}
for(const book of books){
  const manual=manualTeenRetellings[book.id];if(!manual)continue;
  const paragraphs=manual.b1.split(/\n\s*\n/);
  if(book.id==='book6-frankenstein-1'){
    paragraphs[1]=paragraphs[1].replace('He works alone for months',manual.sharedMore+' He works alone for months');
  }else paragraphs[manual.sharedIndex ?? 1] += ' ' + manual.sharedMore;
  const versions:Record<string,string>={B1:manual.b1,B2:paragraphs.map((part,index)=>part+' '+manual.b2More[index]).join('\n\n')};
  versions.B1=paragraphs.join('\n\n');
  for(const level of ['B1','B2']){
    const text=tighten(versions[level]),count=text.trim().split(/\s+/).length;
    const min=level==='B2'?400:300,max=level==='B2'?600:500;
    if(count<min||count>max)issues.push(`${book.id} ${level}: ${count}`);
    book.retellings[level].text=text;book.retellings[level].wordCount=count;
    if(level==='B1'){book.summary=text;book.wordCount=count;}
  }
}
if(issues.length)throw new Error(issues.join('\n'));
fs.writeFileSync(file,JSON.stringify(books,null,2)+'\n');
console.log(`Manually reordered ${Object.keys(manualTeenRetellings).length*2} teen retellings.`);
