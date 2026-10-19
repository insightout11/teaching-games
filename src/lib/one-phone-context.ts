import type { InputContextItem, InputSpec } from './input-spec';
import { stickerLabel, stickerUrlFor } from './stickers';

export function phoneText(...lines: Array<string | null | undefined>): InputContextItem[] {
  return lines.filter((line): line is string => !!line?.trim()).map(text => ({ text }));
}

/** Explicit selection prevents answer keys/marking data leaking with source objects. */
export function dialoguePhoneContext(c: { context: string; speakerA_before: string; speakerA_after: string }): InputContextItem[] {
  return phoneText(c.context, `A: ${c.speakerA_before}`, 'B: …', `A: ${c.speakerA_after}`);
}

export function readingPhoneContext(passages: Array<{ text: string; image?: string }>): InputContextItem[] {
  return passages.map(p => ({ text: p.text, ...(p.image ? { images: [{ url: p.image, alt: 'Reading illustration' }] } : {}) }));
}

export function predictionPhoneContext(cast: Array<{ name: string; who: string }>, summary: string | undefined, shown: boolean): InputContextItem[] {
  return phoneText(...cast.map(p => `${p.name}: ${p.who}`), shown ? summary : undefined);
}

export function pictureStoryPhoneContext(pages: Array<{ text: string; pictures: string[] }>): InputContextItem[] {
  return pages.map(page => ({
    text: page.text,
    images: page.pictures.flatMap(id => {
      const url = stickerUrlFor(id);
      return url ? [{ url, alt: stickerLabel(id) }] : [];
    }),
  }));
}

export function publicEvidenceContext(setup: string, cards: Array<{ label: string; content: string }>, shown: number): InputContextItem[] {
  return phoneText(setup, ...cards.slice(0, Math.max(0, shown)).map(card => `${card.label}: ${card.content}`));
}

export function designPhoneContext(round: { question: string; designSummary: string; options: Array<{ id: string; title: string; description: string; benefit: string; tradeoff: string }> }): InputContextItem[] {
  return phoneText(round.question, round.designSummary, ...round.options.map(o => `${o.id}: ${o.title}. ${o.description}\nBenefit: ${o.benefit}\nTradeoff: ${o.tradeoff}`));
}

/** Own optional reminder only: never fall back to another student's role/context. */
export function contextForPhone(spec: InputSpec, keys: Array<string | null | undefined>): InputContextItem[] {
  for (const key of keys) {
    const value = key ? spec.perStudentData?.[key] : undefined;
    if (!value || typeof value !== 'object') continue;
    const items = (value as { phoneContext?: InputContextItem[] }).phoneContext;
    if (Array.isArray(items)) return [...(spec.context ?? []), ...items];
  }
  return spec.context ?? [];
}
