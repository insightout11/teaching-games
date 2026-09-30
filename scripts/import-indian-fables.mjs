import fs from 'node:fs';

// 29 stories were screened from the anthology contents; stories with obvious
// ghost, demon, or revenge framing are held for a later review.
const sourceUrl = 'https://www.gutenberg.org/cache/epub/7128/pg7128-images.html';
const catalogUrl = 'https://www.gutenberg.org/ebooks/7128';
const selected = [
  'THE LION AND THE CRANE', "HOW THE RAJA'S SON WON THE PRINCESS LABAM", 'THE BROKEN POT',
  'LOVING LAILI', 'THE TIGER, THE BRAHMAN, AND THE JACKAL', "THE SOOTHSAYER'S SON",
  'HARISARMAN', 'THE CHARMED RING', 'THE TALKATIVE TORTOISE',
  'A LAC OF RUPEES FOR A BIT OF ADVICE', 'THE GOLD-GIVING SERPENT',
  'A LESSON FOR KINGS', 'PRIDE GOETH BEFORE A FALL', "THE ASS IN THE LION'S SKIN",
  'THE FARMER AND THE MONEY-LENDER', 'THE BOY WHO HAD A MOON ON HIS FOREHEAD AND A STAR ON HIS CHIN',
  'THE PRINCE AND THE FAKIR', 'WHY THE FISH LAUGHED', 'THE IVORY CITY AND ITS FAIRY PRINCESS',
  'HOW SUN, MOON, AND WIND WENT OUT TO DINNER',
];
const html = await (await fetch(sourceUrl)).text();
if (!html.includes('THE FULL PROJECT GUTENBERG')) throw new Error('Project Gutenberg source could not be verified.');
const decode = (s) => s.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
  .replace(/&rsquo;|&lsquo;/gi, "'").replace(/&ldquo;|&rdquo;/gi, '"').replace(/&mdash;/gi, '—')
  .replace(/&ndash;/gi, '–').replace(/&nbsp;/gi, ' ').replace(/&#([0-9]+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
const headings = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
const titleOf = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
  .replace(/^[IVXLCDM]+\.?\s+/, '').replace(/[’]/g, "'").replace(/[.!?]+$/, '').toUpperCase();
if (process.argv.includes('--list')) { console.log(headings.map((m) => titleOf(m[1])).join('\n')); process.exit(0); }
function fit(paragraphs) {
  const out = []; let count = 0;
  for (const p of paragraphs) {
    const words = p.split(/\s+/);
    if (count + words.length <= 600) { out.push(p); count += words.length; continue; }
    const partial = words.slice(0, 600 - count).join(' ');
    const end = Math.max(partial.lastIndexOf('.'), partial.lastIndexOf('!'), partial.lastIndexOf('?'));
    if (end > partial.length * 0.55) out.push(partial.slice(0, end + 1));
    break;
  }
  return out.join('\n\n');
}
const records = [];
for (let i = 0; i < headings.length; i++) {
  const title = titleOf(headings[i][1]);
  if (!selected.includes(title)) continue;
  const end = headings[i + 1]?.index ?? html.indexOf('THE FULL PROJECT GUTENBERG');
  const body = html.slice(headings[i].index + headings[i][0].length, end);
  const paragraphs = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => decode(m[1]
    .replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\[[^\]]*\]/g, ' ')
    .replace(/\s+/g, ' ').trim()).filter(Boolean);
  const summary = fit(paragraphs);
  const wordCount = summary.split(/\s+/).filter(Boolean).length;
  if (wordCount < 200 || wordCount > 600) throw new Error(`${title}: ${wordCount} words outside 200–600.`);
  const slug = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const page = [...html.slice(0, headings[i].index).matchAll(/<a id="Page_(\d+)"/gi)].at(-1)?.[1];
  if (!page) throw new Error(`No page anchor for ${title}.`);
  records.push({
    id: `pd-india-${slug}`, title: title.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    kind: 'text', author: 'Indian traditional tale', url: `${sourceUrl}#Page_${page}`,
    youtubeId: null, durationSecs: null, wordCount, summary, images: [],
    description: 'A trimmed Indian folk tale from Joseph Jacobs’s Project Gutenberg collection.',
    topicTags: ['folktale', 'india', 'traditional-story'], genre: 'narrative',
    difficultyLevel: 'Advanced', cefr: 'B2', ageBand: 'teens',
    place: { name: 'India', lat: 20.5937, lng: 78.9629 },
    license: 'Public domain (United States)',
    attribution: `Indian Fairy Tales, selected and edited by Joseph Jacobs, illustrated by John D. Batten, Project Gutenberg ebook 7128 (${catalogUrl}). Text is trimmed from the source edition.`,
    needsReview: true,
  });
}
if (records.length !== 20) throw new Error(`Expected 20 tales; found ${records.length}: ${records.map((r) => r.title).join(', ')}`);
const outPath = 'src/data/public-domain-library.json';
const old = JSON.parse(fs.readFileSync(outPath, 'utf8').replace(/^\uFEFF/, ''));
if (records.some((r) => old.some((o) => o.id === r.id || o.url === r.url))) throw new Error('A selected tale is already present.');
fs.writeFileSync(outPath, JSON.stringify([...old, ...records], null, 2) + '\n');
for (const r of records) console.log(`${r.title}\t${r.wordCount}`);
console.log(`Added ${records.length} Indian public-domain tales.`);
