/**
 * Free pictures for a topic from Wikimedia (Wikipedia's page picture + Wikimedia Commons search). No key, no cost.
 * Strong for places, nature, history, science, animals and famous people; weak for everyday scenes and trends.
 * Every picture carries its credit (licences vary). Nothing here is ever shown to the class automatically.
 */

export interface FreePicture {
  id: string;
  /** Small version for the thumbnail row. */
  thumbUrl: string;
  /** Bigger version for the big screen. */
  imageUrl: string;
  title: string;
  /** "Photographer · CC BY-SA 4.0" */
  credit: string;
  /** The file page on Wikimedia Commons (attribution link). */
  pageUrl: string;
}

const HEADERS = { 'User-Agent': 'LessonCaptain/1.0 (https://lessoncaptain.com; matt@lessoncaptain.com)' };

// Words that keep a picture out of a children's class (titles and descriptions are checked).
const BLOCK = /\b(nude|nudity|naked|topless|erotic|porn|sex|sexual|genital|penis|vagina|breast|nipple|corpse|dead body|gore|wound|injur|blood|autopsy|execution|lynch|hanged|beheading|torture|suicide|massacre|atrocity|nazi rally|swastika|drug use|syringe)/i;

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

async function getJSON(base: string, params: Record<string, string>): Promise<unknown> {
  const url = `${base}?${new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params }).toString()}`;
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(6000), cache: 'no-store' });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

interface CommonsPage {
  pageid: number;
  title: string;
  imageinfo?: Array<{
    url: string;
    thumburl?: string;
    mime?: string;
    descriptionurl?: string;
    extmetadata?: Record<string, { value?: string } | undefined>;
  }>;
}

function toPicture(p: CommonsPage): FreePicture | null {
  const info = p.imageinfo?.[0];
  if (!info?.url || !/^image\/(jpeg|png|webp)$/.test(info.mime ?? '')) return null;
  const meta = info.extmetadata ?? {};
  const name = p.title.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, '').replace(/_/g, ' ');
  const description = stripHtml(meta.ImageDescription?.value ?? '');
  if (BLOCK.test(`${name} ${description} ${stripHtml(meta.Categories?.value ?? '')}`)) return null;
  const artist = stripHtml(meta.Artist?.value ?? '').slice(0, 60) || 'Unknown author';
  const licence = stripHtml(meta.LicenseShortName?.value ?? '') || 'see source';
  return {
    id: String(p.pageid),
    thumbUrl: info.thumburl ?? info.url,
    imageUrl: info.url,
    title: name.slice(0, 100),
    credit: `${artist} · ${licence}`,
    pageUrl: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`,
  };
}

const IMAGE_PROPS = { prop: 'imageinfo', iiprop: 'url|mime|extmetadata', iiurlwidth: '480', iiextmetadatafilter: 'Artist|LicenseShortName|ImageDescription|Categories' };

/** The main picture of the topic's Wikipedia page, when the topic is a named thing. */
async function wikipediaPicture(query: string): Promise<FreePicture | null> {
  const page = (await getJSON('https://en.wikipedia.org/w/api.php', {
    action: 'query', prop: 'pageimages', piprop: 'name', redirects: '1', titles: query,
  })) as { query?: { pages?: Array<{ pageimage?: string }> } } | null;
  const file = page?.query?.pages?.[0]?.pageimage;
  if (!file) return null;
  const info = (await getJSON('https://commons.wikimedia.org/w/api.php', {
    action: 'query', titles: `File:${file}`, ...IMAGE_PROPS,
  })) as { query?: { pages?: CommonsPage[] } } | null;
  const p = info?.query?.pages?.[0];
  return p ? toPicture(p) : null;
}

const STOP = new Set(['with', 'from', 'that', 'this', 'their', 'there', 'about', 'into', 'over', 'under', 'they', 'what', 'when', 'where', 'which', 'some', 'many', 'very', 'more', 'most', 'other', 'than', 'then', 'have', 'been', 'were', 'will', 'your', 'photo', 'picture', 'image']);
/** Does a photo's title share a real word with the search? (A free search drifts: "coral nursery" found a flower catalogue.) */
export function pictureMatches(query: string, title: string): boolean {
  const t = title.toLowerCase();
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !STOP.has(w));
  if (!words.length) return true;
  const stem = (w: string) => w.slice(0, Math.min(w.length, 5));
  // the subject's words must all be in the title; the last word (usually the country) may be missing. One shared
  // word let a Philippine owl and a Philippine tarsier pass for "Philippine eagle".
  const subject = (words.length > 1 ? words.slice(0, -1) : words).map(stem);
  if (!subject.every((w) => t.includes(w))) return false;
  // a search word joined to another animal's name is a different animal ("eagle-owl", "tiger-shark")
  for (const w of words) {
    const m = new RegExp(`${stem(w)}[a-z]*-([a-z]{3,})`).exec(t);
    if (m && !words.some((x) => m[1].startsWith(stem(x)))) return false;
  }
  return true;
}

/**
 * Free pictures for a search. `strict`: only photos whose title shares a real word with the search (facts boards and
 * Look cards: no picture rather than a wrong one); the teacher's own image search stays broad.
 */
export async function freePictures(query: string, limit = 8, opts: { strict?: boolean } = {}): Promise<FreePicture[]> {
  const q = query.trim().replace(/[?!.]+$/, '').slice(0, 100);
  if (q.length < 2) return [];
  const [lead, search] = await Promise.all([
    wikipediaPicture(q).catch(() => null),
    (getJSON('https://commons.wikimedia.org/w/api.php', {
      action: 'query', generator: 'search', gsrsearch: `${q} filetype:bitmap`, gsrnamespace: '6', gsrlimit: String(limit * 2), ...IMAGE_PROPS,
    }) as Promise<{ query?: { pages?: CommonsPage[] } } | null>).catch(() => null),
  ]);
  const found = (search?.query?.pages ?? [])
    .sort((a, b) => ((a as { index?: number }).index ?? 0) - ((b as { index?: number }).index ?? 0))
    .map(toPicture)
    .filter((p): p is FreePicture => !!p)
    .filter((p) => !opts.strict || pictureMatches(q, p.title));
  const out: FreePicture[] = [];
  // the Wikipedia lead picture is checked too in strict mode (it skipped the check and showed a canyon for sea sponges)
  const first = lead && (!opts.strict || pictureMatches(q, lead.title)) ? lead : null;
  for (const p of first ? [first, ...found] : found) {
    if (!out.some((o) => o.id === p.id || o.imageUrl === p.imageUrl)) out.push(p);
    if (out.length === limit) break;
  }
  return out;
}
