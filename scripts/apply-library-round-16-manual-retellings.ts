import fs from 'node:fs';
import path from 'node:path';
import { manualTeenRetellings } from './library-round-16-manual-retellings';
type Version = {text:string;wordCount:number};
type Book = {id:string;summary:string;wordCount:number;retellings:Record<string,Version>};
const file=path.join(process.cwd(),'src/data/book-library.json');
const books=JSON.parse(fs.readFileSync(file,'utf8')) as Book[];
const issues:string[]=[];
for(const book of books){
  const manual=manualTeenRetellings[book.id];if(!manual)continue;
  const paragraphs=manual.b1.split(/\n\s*\n/);
  paragraphs[manual.sharedIndex ?? 1] += ' ' + manual.sharedMore;
  const versions:Record<string,string>={B1:manual.b1,B2:paragraphs.map((part,index)=>part+' '+manual.b2More[index]).join('\n\n')};
  versions.B1=paragraphs.join('\n\n');
  for(const level of ['B1','B2']){
    const text=versions[level],count=text.trim().split(/\s+/).length;
    const min=level==='B2'?400:300,max=level==='B2'?600:500;
    if(count<min||count>max)issues.push(`${book.id} ${level}: ${count}`);
    book.retellings[level].text=text;book.retellings[level].wordCount=count;
    if(level==='B1'){book.summary=text;book.wordCount=count;}
  }
}
if(issues.length)throw new Error(issues.join('\n'));
fs.writeFileSync(file,JSON.stringify(books,null,2)+'\n');
console.log(`Manually reordered ${Object.keys(manualTeenRetellings).length*2} teen retellings.`);
