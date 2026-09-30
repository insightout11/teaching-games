import fs from 'node:fs';

// Selected after screening the 38 stories listed in the official contents page.
// Stories centered on murder, suicide, war, or frightening ghost encounters were held.
const sourceUrl = 'https://www.gutenberg.org/cache/epub/35853/pg35853-images.html';
const catalogUrl = 'https://www.gutenberg.org/ebooks/35853';
const selected = [
  'THE TEA-KETTLE', 'THE SEA KING AND THE MAGIC JEWELS', 'THE GOOD THUNDER',
  'THE BLACK BOWL', 'THE STAR LOVERS', 'HORAIZAN', 'REFLECTIONS',
  'THE WIND IN THE PINE TREE', 'THE MALLET', 'THE ROBE OF FEATHERS',
  'THE SINGING BIRD OF HEAVEN', 'THE ESPousal OF THE RAT’S DAUGHTER'.toUpperCase(),
  'THE JELLY-FISH TAKES A JOURNEY', 'URASHIMA', 'MOMOTARO',
  'THE MATSUYAMA MIRROR', 'THE TONGUE-CUT SPARROW', 'HANA-SAKA-JIJI',
  'THE MOON MAIDEN', 'THE SPRING LOVER AND THE AUTUMN LOVER',
];
const html = await (await fetch(sourceUrl)).text();
if (!html.includes('THE FULL PROJECT GUTENBERG')) throw new Error('Project Gutenberg source could not be verified.');
const decode = (s) => s.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
  .replace(/&rsquo;|&lsquo;/gi, "'").replace(/&ldquo;|&rdquo;/gi, '"').replace(/&mdash;/gi, '—')
  .replace(/&ndash;/gi, '–').replace(/&nbsp;/gi, ' ').replace(/&#([0-9]+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
const headings = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
const titleOf = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
  .replace(/^[IVXLCDM]+\s+/, '').toUpperCase();
if (process.argv.includes('--list')) { console.log(headings.map((m) => titleOf(m[1])).join('\n')); process.exit(0); }
const paragraphsOf = (s) => [...s.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => decode(m[1]
  .replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\[[^\]]*\]/g, ' ')
  .replace(/\s+/g, ' ').trim()).filter(Boolean);
function fit(paragraphs) {
  const out = []; let count = 0;
  for (const p of paragraphs) {
    const words = p.split(/\s+/);
    if (count + words.length <= 600) { out.push(p); count += words.length; continue; }
    const remaining = 600 - count;
    if (remaining > 0) {
      const partial = words.slice(0, remaining).join(' ');
      const end = Math.max(partial.lastIndexOf('.'), partial.lastIndexOf('!'), partial.lastIndexOf('?'));
      if (end > partial.length * 0.55) out.push(partial.slice(0, end + 1));
    }
    break;
  }
  return out.join('\n\n');
}
const records = [];
for (let i = 0; i < headings.length; i++) {
  const title = titleOf(headings[i][1]);
  if (!selected.includes(title)) continue;
  const end = headings[i + 1]?.index ?? html.indexOf('THE FULL PROJECT GUTENBERG');
  const summary = fit(paragraphsOf(html.slice(headings[i].index + headings[i][0].length, end)));
  const wordCount = summary.split(/\s+/).filter(Boolean).length;
  if (wordCount < 200 || wordCount > 600) throw new Error(`${title}: ${wordCount} words outside 200–600.`);
  const headingSlug = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const anchorMatches = [...html.slice(0, headings[i].index).matchAll(/<a id="Page_(\d+)"/gi)];
  const page = anchorMatches.at(-1)?.[1];
  if (!page) throw new Error(`No page anchor for ${title}.`);
  const pretty = title.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/’S\b/g, '’s');
  records.push({
    id: `pd-japan-${headingSlug}`, title: pretty, kind: 'text', author: 'Japanese traditional tale',
    url: `${sourceUrl}#Page_${page}`, youtubeId: null, durationSecs: null, wordCount, summary, images: [],
    description: `A trimmed Japanese folk tale from Grace James’s Project Gutenberg collection.`,
    topicTags: ['folktale', 'japan', 'traditional-story'], genre: 'narrative',
    difficultyLevel: 'Advanced', cefr: 'B2', ageBand: 'teens', place: { name: 'Japan', lat: 36.2048, lng: 138.2529 },
    license: 'Public domain (United States)',
    attribution: `Japanese Fairy Tales, collected by Grace James and illustrated by Warwick Goble, Project Gutenberg ebook 35853 (${catalogUrl}). Text is trimmed from the source edition.`,
    needsReview: true,
  });
}
if (records.length !== 20) throw new Error(`Expected 20 tales; found ${records.length}: ${records.map((r) => r.title).join(', ')}`);
const outPath = 'src/data/public-domain-library.json';
const old = JSON.parse(fs.readFileSync(outPath, 'utf8').replace(/^\uFEFF/, ''));
if (records.some((r) => old.some((o) => o.id === r.id || o.url === r.url))) throw new Error('A selected tale is already present.');
fs.writeFileSync(outPath, JSON.stringify([...old, ...records], null, 2) + '\n');
for (const r of records) console.log(`${r.title}\t${r.wordCount}`);
console.log(`Added ${records.length} Japanese public-domain tales.`);
