/**
 * Facts for a named topic (a film, book, singer, band, famous person, team, place) from Wikipedia,
 * so the room's briefing, activities and flights talk about the real thing instead of a vague idea of it.
 * Free, no key. Films and books come without their ending; the teacher can add it.
 */

export type ReferenceKind = 'film' | 'book' | 'music' | 'person' | 'other';

export interface WikiReference {
  title: string;
  url: string;
  kind: ReferenceKind;
  /** What the class may read and the AI may use. */
  text: string;
  /** A film's or book's ending, kept back until the teacher asks for it. */
  ending: string | null;
}

const API = 'https://en.wikipedia.org/w/api.php';
const HEADERS = { 'User-Agent': 'LessonCaptain/1.0 (https://lessoncaptain.com; matt@lessoncaptain.com)' };
const MAX_TEXT = 6000;

const norm = (s: string) => s.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

async function getJSON(params: Record<string, string>): Promise<unknown> {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params }).toString()}`;
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(5000), cache: 'no-store' });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

export function kindFromDescription(desc: string): ReferenceKind {
  const d = desc.toLowerCase();
  if (/\b(singer|rapper|musician|songwriter|band)\b/.test(d)) return 'music';
  if (/\b(film|movie|television series|tv series|miniseries|animated series|sitcom)\b/.test(d)) return 'film';
  if (/\b(novel|book|novella|memoir|manga|comic|play by|poem)\b/.test(d)) return 'book';
  if (/\b(album|song|single|band|singer|rapper|musician|songwriter|composer|dj|group|duo|ep by)\b/.test(d)) return 'music';
  if (/\b(born|died|\d{4}\s*[–-]\s*\d{4}|actor|actress|player|footballer|athlete|politician|scientist|writer|author|artist|youtuber|businessman|businesswoman|president|king|queen)\b/.test(d)) return 'person';
  return 'other';
}

/** Splits a plain-text Wikipedia extract into its lead and `== Section ==` parts. */
export function splitSections(extract: string): { lead: string; sections: Array<{ name: string; body: string }> } {
  // Top-level sections only: a sub-section (=== 2021–2022: Sour ===) stays inside its parent (Career).
  const parts = extract.split(/\n==(?!=)\s*([^=\n]+?)\s*==(?!=)\n/);
  const lead = (parts[0] ?? '').trim();
  const sections: Array<{ name: string; body: string }> = [];
  for (let i = 1; i < parts.length; i += 2) {
    const body = (parts[i + 1] ?? '').replace(/\n={3,}\s*([^=\n]+?)\s*={3,}\n/g, '\n$1:\n').trim();
    sections.push({ name: parts[i].trim(), body });
  }
  return { lead, sections };
}

/** A plot without its last part (the ending), and the ending on its own. */
export function holdBackEnding(plot: string): { story: string; ending: string | null } {
  const paras = plot.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  if (paras.length >= 3) {
    const keep = Math.max(1, Math.ceil(paras.length * 0.6));
    return { story: paras.slice(0, keep).join('\n'), ending: paras.slice(keep).join('\n') };
  }
  // One or two long paragraphs: cut by sentences.
  const sentences = paras.join(' ').match(/[^.!?]+[.!?]+["”’)]*\s*/g) ?? [paras.join(' ')];
  if (sentences.length < 4) return { story: paras.join('\n'), ending: null };
  const keep = Math.ceil(sentences.length * 0.6);
  return { story: sentences.slice(0, keep).join('').trim(), ending: sentences.slice(keep).join('').trim() };
}

const WANTED: Record<ReferenceKind, RegExp> = {
  film: /^(plot|synopsis|premise|story|summary|cast|characters|production|reception)$/i,
  book: /^(plot|synopsis|plot summary|summary|story|characters|themes|reception)$/i,
  music: /^(early life|career|artistry|musical style|discography|albums|songs|background|composition|lyrics|themes|reception|commercial performance|track listing|legacy)/i,
  person: /^(early life|career|personal life|achievements|legacy|life|biography)/i,
  other: /^(history|overview|description|geography|culture|background)/i,
};

/** The best Wikipedia page for a topic title, or null when nothing clearly matches. */
/**
 * `where` (optional): the place the class is flying over ("Australia"). Many names belong to several places (the Blue
 * Mountains are in Australia and in Ontario): the search includes it, and a page that never mentions it is refused,
 * so the class never gets facts about the wrong place.
 */
export async function lookupWikipedia(topic: string, where?: string): Promise<WikiReference | null> {
  const q = topic.trim().replace(/[?!.]+$/, '').slice(0, 120);
  if (q.length < 2 || q.split(/\s+/).length > 8) return null;
  const place = (where ?? '').trim();
  try {
    const search = (await getJSON({ action: 'query', list: 'search', srsearch: place ? `${q} ${place}` : q, srlimit: place ? '6' : '3' })) as
      { query?: { search?: Array<{ title: string }> } } | null;
    const hits = search?.query?.search ?? [];
    const want = norm(q).replace(/^the /, '');
    const name = (t: string) => norm(t).replace(/^the /, '');
    // Only a page whose name really is the topic (a search can drift to something merely related).
    // The page named exactly the topic comes first even when the search ranks it low ("China" searched with the place
    // below the plane found "China at the Asian Games" first, so the facts were all about sport). A longer title that
    // merely starts with the topic is never taken: it is about something narrower.
    const candidates = [
      { title: q },
      ...hits.filter((h) => name(h.title) === want && h.title !== q),
      ...hits.filter((h) => name(h.title) !== want && want.startsWith(name(h.title))),
    ].slice(0, place ? 5 : 2);
    if (!candidates.length) return null;

    type Page = { title: string; extract?: string; description?: string; pageprops?: { disambiguation?: string } };
    let p: Page | undefined;
    for (const hit of candidates) {
      const page = (await getJSON({
        action: 'query', prop: 'extracts|description|pageprops', explaintext: '1', redirects: '1', titles: hit.title,
      })) as { query?: { pages?: Page[] } } | null;
      const c = page?.query?.pages?.[0];
      if (!c?.extract || c.pageprops?.disambiguation !== undefined) continue;
      if (place && !`${c.description ?? ''} ${c.extract.slice(0, 2500)}`.toLowerCase().includes(place.toLowerCase())) continue;
      p = c;
      break;
    }
    if (!p?.extract) return null;

    // The short description ("American singer-songwriter") decides first; the opening line only when it says nothing.
    const fromDesc = kindFromDescription(p.description ?? '');
    const kind = fromDesc !== 'other' ? fromDesc : kindFromDescription(p.extract.slice(0, 300));
    const { lead, sections } = splitSections(p.extract);
    let ending: string | null = null;
    const parts: string[] = [lead];
    for (const s of sections) {
      if (!WANTED[kind].test(s.name) || !s.body) continue;
      let body = s.body;
      if ((kind === 'film' || kind === 'book') && /plot|synopsis|story|summary/i.test(s.name)) {
        const held = holdBackEnding(body);
        body = held.story;
        ending = held.ending;
      } else if (body.length > 1200) {
        // A long section in parts (Career: 2015–2019, 2020–2022: Sour, ...): the start of every part, so the
        // recent years are not cut off by the early ones.
        body = body.split(/\n(?=[^\n]{3,90}:\n)/).map((chunk) => {
          if (chunk.length <= 500) return chunk.trim();
          const cut = chunk.slice(0, 500);
          return cut.slice(0, Math.max(cut.lastIndexOf('. ') + 1, 200)).trim();
        }).join('\n');
      }
      parts.push(`${s.name}:\n${body}`);
    }
    const text = parts.join('\n\n').replace(/\n{3,}/g, '\n\n').slice(0, MAX_TEXT).trim();
    if (text.length < 80) return null;
    return {
      title: p.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
      kind,
      text,
      ending: ending ? ending.slice(0, 1500) : null,
    };
  } catch {
    return null;
  }
}
