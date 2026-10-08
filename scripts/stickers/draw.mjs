// Draws the core picture stickers (src/data/sticker-words.json) with Gemini's image model, about 4 cents each.
// People, actions and feelings are drawn in the crew-avatar style from scripts/stickers/crew-reference.png.
// Skips words that already have a raw PNG, so it can be re-run; delete a PNG to redraw it.
// Run: node scripts/stickers/draw.mjs <rawDir> [id ...]   (GEMINI_API_KEY in env)
import fs from 'fs';
import path from 'path';

const MODEL = 'gemini-2.5-flash-image';
const CONCURRENCY = 4;
const [rawDir, ...only] = process.argv.slice(2);
if (!rawDir) throw new Error('usage: draw.mjs <rawDir> [id ...]');
fs.mkdirSync(rawDir, { recursive: true });
const key = process.env.GEMINI_API_KEY;
const words = JSON.parse(fs.readFileSync('src/data/sticker-words.json', 'utf8'));
const ref = fs.readFileSync('scripts/stickers/crew-reference.png').toString('base64');

const COMMON =
  'Thick white sticker outline following the shape, soft drop shadow, plain pure white background, centred and filling most of the frame. Absolutely no text, letters or numbers anywhere. No circle or badge background, no extra scenery, minimal props only.';

function prompt(e) {
  if (e.kind === 'thing') {
    const subject = e.hint ?? `"${e.word}"`;
    return `Die-cut sticker illustration showing ${subject}, for a children's English picture card for the word "${e.word}". The most literal, obvious depiction a 5-year-old would recognise instantly. Flat bright colours, simple rounded shapes. ${COMMON}`;
  }
  return `The reference image shows our app's crew characters. Draw a NEW die-cut sticker for the children's English picture card "${e.word}": ${e.hint}. Draw the character(s) in EXACTLY the reference style: big round head, small solid dark dot eyes with a tiny white highlight, round pink cheek circles, a simple dark curved line for the mouth (change it to show the feeling when needed), very simple hair shapes, flat solid colours, no black outlines, no gradients, simple rounded body and limbs in the same flat way. ${COMMON}`;
}

async function draw(e) {
  const parts = e.kind === 'thing' ? [{ text: prompt(e) }] : [{ inlineData: { mimeType: 'image/png', data: ref } }, { text: prompt(e) }];
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } } }),
    });
    const j = await r.json().catch(() => ({}));
    const img = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (img) {
      fs.writeFileSync(path.join(rawDir, `${e.id}.png`), Buffer.from(img.inlineData.data, 'base64'));
      return true;
    }
    console.log(e.id, 'attempt', attempt, 'failed', r.status, JSON.stringify(j).slice(0, 160));
    await new Promise((res) => setTimeout(res, 5000 * attempt));
  }
  return false;
}

const todo = words.filter((e) => (only.length ? only.includes(e.id) : !fs.existsSync(path.join(rawDir, `${e.id}.png`))));
console.log(todo.length, 'to draw');
let done = 0;
const failed = [];
async function worker() {
  while (todo.length) {
    const e = todo.shift();
    if (!(await draw(e))) failed.push(e.id);
    if (++done % 20 === 0) console.log(done, 'drawn');
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log('done', done, 'failed', failed.join(' ') || 'none');
