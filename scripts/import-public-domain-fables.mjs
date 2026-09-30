import fs from 'node:fs';

const sourceUrl = 'https://www.gutenberg.org/cache/epub/38339/pg38339-images.html';
const catalogUrl = 'https://www.gutenberg.org/ebooks/38339';
const selected = new Set([
  'THE LOST MESSAGE', "THE MONKEY'S FIDDLE", 'THE TIGER, THE RAM, AND THE JACKAL',
  'THE JACKAL AND THE WOLF', 'THE LION, THE JACKAL, AND THE MAN', 'TINK-TINKJE',
  'THE HUNT OF LION AND JACKAL', 'THE LIONESS AND THE OSTRICH',
  'THE DANCE FOR WATER OR RABBIT\'S TRIUMPH', 'JACKAL AND MONKEY', "LION'S SHARE",
  "JACKAL'S BRIDE", 'JACKAL, DOVE, AND HERON',
  'ELEPHANT AND TORTOISE', 'THE JUDGMENT OF BABOON', 'THE ZEBRA STALLION',
  'WHEN LION COULD FLY', 'LION WHO THOUGHT HIMSELF WISER THAN HIS MOTHER',
  "THE ORIGIN OF DEATH", "LION'S DEFEAT",
]);

const html = await (await fetch(sourceUrl)).text();
if (!html.includes('THE FULL PROJECT GUTENBERG')) throw new Error('Project Gutenberg source could not be verified.');
const headings = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
const titleOf = (value) => decode(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().toUpperCase();
function decode(text) {
  return text.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&rsquo;|&ldquo;|&rdquo;/gi, '"').replace(/&lsquo;/gi, "'")
    .replace(/&mdash;/gi, '—').replace(/&ndash;/gi, '–').replace(/&nbsp;/gi, ' ')
    .replace(/&#([0-9]+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
function plainParagraphs(body) {
  return [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => {
    let p = m[1].replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]+>/g, ' ');
    p = decode(p).replace(/\[[0-9]+\]/g, '').replace(/\s+/g, ' ').trim();
    return p;
  }).filter(Boolean);
}
function fitText(paragraphs) {
  const kept = [];
  let count = 0;
  for (const p of paragraphs) {
    const words = p.split(/\s+/);
    if (count + words.length <= 600) { kept.push(p); count += words.length; continue; }
    const remaining = 600 - count;
    if (remaining > 0) {
      const partial = words.slice(0, remaining).join(' ');
      const sentenceEnd = Math.max(partial.lastIndexOf('.'), partial.lastIndexOf('!'), partial.lastIndexOf('?'));
      if (sentenceEnd > partial.length * 0.55) kept.push(partial.slice(0, sentenceEnd + 1));
    }
    break;
  }
  return kept.join('\n\n').trim();
}

const records = [];
for (let i = 0; i < headings.length; i++) {
  const title = titleOf(headings[i][1]);
  if (!selected.has(title)) continue;
  const end = headings[i + 1]?.index ?? html.indexOf('THE FULL PROJECT GUTENBERG');
  const paragraphs = plainParagraphs(html.slice(headings[i].index + headings[i][0].length, end));
  const summary = fitText(paragraphs);
  const wordCount = summary.split(/\s+/).filter(Boolean).length;
  if (wordCount < 200 || wordCount > 600) throw new Error(`${title} fell outside 200–600 words (${wordCount}).`);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const precedingAnchors = [...html.slice(0, headings[i].index).matchAll(/<a id="Page_(\d+)"/gi)];
  const page = precedingAnchors.at(-1)?.[1];
  if (!page) throw new Error(`No page anchor found for ${title}.`);
  records.push({
    id: `pd-safrica-${slug}`, title: title.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/'S\b/g, "'s"),
    kind: 'text', author: 'South African traditional tale', url: `${sourceUrl}#Page_${page}`,
    youtubeId: null, durationSecs: null, wordCount, summary, images: [],
    description: `A trimmed public-domain South African folk tale from the Project Gutenberg collection.`,
    topicTags: ['folktale', 'south-africa', 'traditional-story'], genre: 'narrative',
    difficultyLevel: 'Advanced', cefr: 'B2', ageBand: 'teens', place: null,
    license: 'Public domain (United States)',
    attribution: `South-African Folk-Tales, collected and edited by James A. Honeÿ, Project Gutenberg ebook 38339 (${catalogUrl}). Text is trimmed from the source edition.`,
    needsReview: true,
  });
}
if (records.length !== 20) throw new Error(`Expected 20 selected tales; found ${records.length}.`);

const outPath = 'src/data/public-domain-library.json';
const old = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8').replace(/^\uFEFF/, '')) : [];
const ids = new Set(old.map((x) => x.id));
if (records.some((x) => ids.has(x.id))) throw new Error('A selected tale is already present.');
fs.writeFileSync(outPath, JSON.stringify([...old, ...records], null, 2) + '\n');
for (const item of records) console.log(`${item.title}\t${item.wordCount}`);
console.log(`Added ${records.length} public-domain fables.`);
