import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { lookupWikipedia } from '@/lib/sources/wikipedia';
import { freePictures } from '@/lib/sources/wikimedia-images';
import { findRoutePlaceBriefing, topicBriefingLevel } from '@/lib/topic-briefings';
import { generateJSON } from '@/lib/ai';
import { lensById, lensPromptNote } from '@/lib/lens';

export const dynamic = 'force-dynamic';

/**
 * A "look outside" card: a picture and two or three short facts for what the plane is passing (free: Wikipedia and
 * Wikimedia, no AI). The teacher has already chosen to show it.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { title?: unknown; kind?: unknown; lens?: unknown; where?: unknown } | null;
  const lens = lensById(typeof body?.lens === 'string' ? body.lens : null);
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 120) : '';
  if (title.length < 2) return NextResponse.json({ error: 'title is required' }, { status: 400 });
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isEvent = body?.kind === 'event';
  // A class lens: the card is about this place or thing seen through it (Japan with Films: Studio Ghibli)
  if (lens) {
    const where = typeof body?.where === 'string' ? body.where.slice(0, 120) : '';
    const [out, pics] = await Promise.all([
      generateJSON<{ facts?: unknown; question?: unknown; picture?: unknown }>(
        `A live English class (kids or teens) is flying past "${title}"${where ? ` (${where})` : ''} and looks at it for a moment.\n${lensPromptNote(lens)}Write "facts": exactly 3 short, true, specific facts (max 20 words each) about ${title} seen through ${lens.label}; "question": one open question for the class about it; "picture": a 2-5 word photo search for the first fact's subject (never giving away an answer). ${lens.kid ? 'Very easy words for young children.' : 'Simple English for teens.'}`,
        { type: 'object', properties: { facts: { type: 'array', items: { type: 'string' } }, question: { type: 'string' }, picture: { type: 'string' } }, required: ['facts', 'question', 'picture'] },
        { taskClass: 'writing' },
      ).catch(() => null),
      Promise.resolve(null),
    ]);
    void pics;
    const facts = (Array.isArray(out?.facts) ? out!.facts : []).filter((f): f is string => typeof f === 'string' && f.trim().length > 0).map((f) => f.trim()).slice(0, 3);
    if (facts.length) {
      const search = typeof out?.picture === 'string' && out.picture.trim() ? out.picture.trim().slice(0, 60) : title;
      const picture = (await freePictures(search, 1, { strict: true }).catch(() => []))[0] ?? null;
      return NextResponse.json({ facts, picture, question: typeof out?.question === 'string' ? out.question.trim().slice(0, 200) : undefined }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
    }
  }
  const ready = isEvent ? null : findRoutePlaceBriefing(title);
  const cards = ready ? topicBriefingLevel(ready, 'B1')?.cards : null;
  if (cards?.length) {
    const pictures = await freePictures(cards[0].picture, 1, { strict: true }).catch(() => []);
    return NextResponse.json({ facts: cards.map(card => card.headline), picture: pictures[0] ?? null }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
  }
  const lookupTitle = title.replace(/^the /i, '');
  const [ref, pics] = await Promise.all([
    isEvent ? Promise.resolve(null) : lookupWikipedia(lookupTitle).catch(() => null),
    freePictures(isEvent ? title.split(/[-–,]/)[0] : lookupTitle, 1).catch(() => []),
  ]);
  const lead = ref ? ref.text.split(/\n\n/)[0] : '';
  const facts = (lead.match(/[^.!?]+[.!?]+/g) ?? []).map((s) => s.trim()).filter((s) => s.length > 20).slice(0, 3);
  return NextResponse.json({ facts, picture: pics[0] ?? null }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
}
