import drawnIds from '@/data/sticker-ids.json';

/**
 * Picture stickers for everyday words (docs/pictures-and-junior-concept.md, part 1). The core set lives in
 * public/stickers/<id>.webp, drawn once by scripts/stickers/. A word gets a picture only when it matches a sticker
 * by its base form ("apples" -> apple, "swimming" -> swim) or a common alias ("mum" -> mother); anything else
 * (phrases, abstract words) gets none rather than a confusing one.
 */

const ALIASES: Record<string, string> = {
  mom: 'mother', mum: 'mother', mommy: 'mother', mummy: 'mother', mama: 'mother',
  dad: 'father', daddy: 'father', papa: 'father',
  grandma: 'grandmother', granny: 'grandmother', nana: 'grandmother', grandpa: 'grandfather', granddad: 'grandfather',
  kid: 'boy', child: 'boy', children: 'family', people: 'family', parent: 'family',
  't-shirt': 'shirt', tshirt: 'shirt', pants: 'trousers', pyjamas: 'pajamas', jumper: 'sweater', sneakers: 'shoes', trainers: 'shoes',
  soccer: 'football', plane: 'airplane', aeroplane: 'airplane', bicycle: 'bike', motorcycle: 'motorbike', lorry: 'truck',
  'fire truck': 'fire-engine', tv: 'television', telly: 'television', cellphone: 'phone', mobile: 'phone', smartphone: 'phone',
  sweets: 'candy', sweet: 'candy', fries: 'french-fries', chips: 'french-fries', doughnut: 'donut', burger: 'hamburger',
  rubber: 'eraser', schoolbag: 'backpack', bunny: 'rabbit', kitty: 'kitten', ocean: 'sea', torch: 'flashlight',
  'movie theater': 'cinema', 'movie theatre': 'cinema', movies: 'cinema', store: 'shop',
  scary: 'scared', afraid: 'scared', frightened: 'scared', mad: 'angry', ill: 'sick',
};

const IRREGULAR: Record<string, string> = {
  feet: 'foot', mice: 'mouse', men: 'man', women: 'woman', knives: 'knife', leaves: 'leaf', teeth: 'teeth', sheep: 'sheep',
  fish: 'fish', geese: 'duck', ran: 'run', swam: 'swim', ate: 'eat', drank: 'drink', slept: 'sleep', wrote: 'write',
  drew: 'draw', sang: 'sing', rode: 'ride-a-bike', threw: 'throw', caught: 'catch', built: 'build', fell: 'fall',
  stood: 'stand', sat: 'sit', thought: 'think', cried: 'cry', flew: 'airplane', woke: 'wake-up',
};

const drawn = new Set<string>(drawnIds as string[]);

function candidates(w: string): string[] {
  const out = [w];
  if (w.endsWith('ies')) out.push(w.slice(0, -3) + 'y');
  if (w.endsWith('es')) out.push(w.slice(0, -2));
  if (w.endsWith('s') && !w.endsWith('ss')) out.push(w.slice(0, -1));
  if (w.endsWith('ing')) {
    const stem = w.slice(0, -3);
    out.push(stem, stem + 'e');
    if (stem.length > 2 && stem.at(-1) === stem.at(-2)) out.push(stem.slice(0, -1)); // swimming -> swim
  }
  if (w.endsWith('ied')) out.push(w.slice(0, -3) + 'y');
  if (w.endsWith('ed')) {
    const stem = w.slice(0, -2);
    out.push(stem, stem + 'e');
    if (stem.length > 2 && stem.at(-1) === stem.at(-2)) out.push(stem.slice(0, -1));
  }
  return out;
}

/** The sticker id for a word or short phrase, or null when there's no good picture for it. */
export function stickerIdFor(text: string, ids: Set<string> = drawn): string | null {
  const clean = text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .replace(/\b(a|an|the|some|my|your)\b/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  if (!clean || clean.split(' ').length > 3) return null;
  const tries = [clean, ALIASES[clean], IRREGULAR[clean], ...candidates(clean)]
    .filter((t): t is string => !!t)
    .flatMap((t) => [t, ALIASES[t]])
    .filter((t): t is string => !!t)
    .map((t) => t.replace(/\s+/g, '-'));
  return tries.find((t) => ids.has(t)) ?? null;
}

/** The public URL of a word's sticker, or null. */
export function stickerUrlFor(text: string): string | null {
  const id = stickerIdFor(text);
  return id ? `/stickers/${id}.webp` : null;
}
