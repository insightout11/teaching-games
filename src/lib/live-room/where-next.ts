import type { AISchema } from '@/lib/ai';

/** "Where next?": topics that follow from the current one, each labelled by how it connects. */
export const NEXT_LINKS = ['Bigger picture', 'The other side', 'Closer to home', 'In the news', 'Surprising link'] as const;

export const NEXT_TOPICS_SCHEMA: AISchema = {
  type: 'array',
  items: { type: 'object', properties: { link: { type: 'string' }, title: { type: 'string' } }, required: ['link', 'title'] },
};

export const nextTopicsPrompt = (title: string, covered: string[]) => `- "nextTopics": exactly 5 topics the class could move to next from "${title}", one for each link, in this order: ${NEXT_LINKS.map((l) => `"${l}"`).join(', ')}. Each: "link" (that label) and "title" (a short topic, max 8 words, interesting for kids and teens, in simple English). "Closer to home" connects it to the students' own lives; "In the news" is something recent and real (never invent news; if unsure, a recent trend). Never repeat a topic already covered${covered.length ? `: ${covered.map((c) => `"${c}"`).join(', ')}` : ''}.`;

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Up to 6 suggestions, none already covered and no duplicates. */
export function cleanNextTopics(raw: unknown, covered: string[]): Array<{ link: string; title: string }> {
  const seen = new Set(covered.map((c) => c.toLowerCase()));
  const out: Array<{ link: string; title: string }> = [];
  for (const t of Array.isArray(raw) ? raw : []) {
    const link = clean((t as { link?: unknown })?.link, 30);
    const title = clean((t as { title?: unknown })?.title, 80);
    if (!title || seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());
    out.push({ link, title });
    if (out.length === 6) break;
  }
  return out;
}
