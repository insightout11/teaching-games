import { grammarFamily } from '@/lib/grammar';
import { DEFAULT_CLASS_BOARD_KEY, normalizeClassBoardKey } from '@/lib/class-board';

/**
 * Grammar anchor chart: which Class Board template a grammar point uses, and the teacher items
 * Grammar Spotlight pins to it (the rule + examples, sorted into the family's zones).
 */
export function grammarBoardPreset(target?: string | null): string {
  const f = grammarFamily(target);
  return f === 'tenses' ? 'grammar-tenses' : f === 'comparisons' ? 'grammar-comparisons' : f === 'questions' ? 'grammar-questions' : 'grammar-anchor';
}

/** The board key the free Class Board widget uses for a template (matches ClassBoardCanvas). */
export function grammarBoardKey(presetKey: string): string {
  return normalizeClassBoardKey(`${DEFAULT_CLASS_BOARD_KEY}-${presetKey}`);
}

function exampleZone(presetKey: string, target: string, sentence: string): string {
  const s = sentence.toLowerCase();
  if (presetKey === 'grammar-tenses') {
    const t = target.toLowerCase();
    return t.startsWith('past') ? 'past' : t.startsWith('future') || /\b(will|going to)\b/.test(t) ? 'future' : 'present';
  }
  if (presetKey === 'grammar-comparisons') return /\bthe (most|least|\w+est|best|worst)\b/.test(s) ? 'superlative' : 'comparative';
  if (presetKey === 'grammar-questions') return /^(what|where|when|who|whom|whose|which|why|how)\b/.test(s.trim()) ? 'wh' : 'yesno';
  return 'examples';
}

export interface AnchorItem { zoneKey: string; category: 'rule' | 'example'; content: string }

export function grammarAnchorItems(target: string, rule: { form: string; whenToUse: string; pitfall: string; examples: string[] }): { presetKey: string; items: AnchorItem[] } {
  const presetKey = grammarBoardPreset(target);
  const items: AnchorItem[] = [];
  if (rule.form) items.push({ zoneKey: 'rule', category: 'rule', content: `${target}: ${rule.form}` });
  if (rule.whenToUse) items.push({ zoneKey: 'rule', category: 'rule', content: rule.whenToUse });
  if (rule.pitfall) items.push({ zoneKey: 'rule', category: 'rule', content: `Watch out: ${rule.pitfall}` });
  rule.examples.forEach((e) => items.push({ zoneKey: exampleZone(presetKey, target, e), category: 'example', content: e }));
  return { presetKey, items };
}
