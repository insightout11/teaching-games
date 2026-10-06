import fs from 'node:fs';
import path from 'node:path';
import { kidB1Scenes } from './library-round-16-kid-b1-scenes';
type Book={id:string;retellings:{B1:{text:string;wordCount:number}}};
const file=path.join(process.cwd(),'src/data/book-library.json');
const books=JSON.parse(fs.readFileSync(file,'utf8')) as Book[];
const atTwo=new Set(['book-jungle-2','book-jungle-3','book-jungle-4','book-alice-2','book-oz-1','book-oz-2','book-peter-1','book-sherlock-2','book-aesop-1']);
const issues:string[]=[];let changed=0;
for(const book of books){
  const scene=kidB1Scenes[book.id];if(!scene)continue;
  const paragraphs=book.retellings.B1.text.split(/\n\s*\n/);
  const index=atTwo.has(book.id)?2:1;
  paragraphs[index]+=' '+scene;
  const text=paragraphs.join('\n\n');const count=text.trim().split(/\s+/).length;
  if(count<300||count>500)issues.push(`${book.id}: ${count}`);
  book.retellings.B1.text=text;book.retellings.B1.wordCount=count;changed++;
}
if(issues.length)throw new Error(issues.join('\n'));
fs.writeFileSync(file,JSON.stringify(books,null,2)+'\n');
console.log(`Expanded ${changed} kids B1 retellings to 300–500 words.`);
