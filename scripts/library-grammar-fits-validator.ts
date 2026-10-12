/** Round 29 editorial checks. Form heuristics flag mistakes; they do not judge teaching value. */
import fs from 'node:fs';
import path from 'node:path';
import { GRAMMAR_TARGET_GROUPS, GrammarTarget } from '../src/lib/grammar';

type Fail = (where: string, message: string) => void;
export type GrammarFitAudit = {
  topics: number; fits: number;
  byAge: Record<string, Record<string, number>>;
  presentSimpleTopics: number; questionTopics: number; targetsWithEight: number;
  repeatedWhys: number; repeatedExamples: number; formErrors: number; kidsTargetErrors: number;
};
const key = (text: string) => text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const participle = '(?:[a-z]+ed|beaten|been|become|begun|broken|brought|built|bought|caught|chosen|come|cut|done|drawn|driven|eaten|fallen|felt|flown|forgotten|found|given|gone|grown|had|heard|held|kept|known|left|led|learnt|lost|made|met|paid|put|read|reached|ridden|run|said|seen|sent|sewn|shown|slept|sold|spent|spoken|stood|stopped|taken|taught|thought|told|understood|won|worn|written)';
const past = /\b(?:[a-z]+ed|was|were|ate|became|began|bought|broke|brought|built|came|caught|chose|cut|did|drew|drank|drove|fell|felt|flew|forgot|found|gave|got|grew|had|heard|held|kept|knew|left|led|lost|made|met|paid|put|ran|read|rode|said|sang|sat|saw|sent|shook|slept|sold|spoke|spent|stood|swam|taught|thought|told|took|understood|went|won|wore|wrote)\b/i;
const perfect = new RegExp('\\b(?:have|has)\\s+(?:(?:already|just|never|ever|recently|yet)\\s+)*' + participle + '\\b', 'i');
const pastPerfect = new RegExp('\\bhad\\s+(?:(?:already|just|never)\\s+)*' + participle + '\\b', 'i');
const passive = new RegExp('\\b(?:am|is|are|was|were|be|been|being)\\s+(?:(?:already|often|usually|carefully|regularly)\\s+)*' + participle + '\\b', 'i');

export function exampleUsesGrammarTarget(target: string, example: string): boolean {
  // Check a past-simple verb in the main clause, so "marks where something walked" fails.
  const main = example.split(/\b(?:who|which|that|where|because|when|before|after|while)\b/i)[0];
  switch (target) {
    case GrammarTarget.PastSimple:
      return past.test(main) && !pastPerfect.test(main) && !perfect.test(main) && !/\b(?:was|were)\s+[a-z]+ing\b/i.test(main);
    case GrammarTarget.Passive: return passive.test(example);
    case GrammarTarget.Comparatives:
      return /\b(?:than|more|most|[a-z]{3,}est|bigger|smaller|larger|longer|shorter|higher|lower|faster|slower|lighter|heavier|brighter|steeper|harder|softer|sweeter|louder|easier|better|worse)\b/i.test(example);
    case GrammarTarget.PresentPerfect: return perfect.test(example) && !/\b(?:have|has)\s+been\s+[a-z]+ing\b/i.test(example);
    case GrammarTarget.PresentPerfectContinuous: return /\b(?:have|has)\s+been\s+[a-z]+ing\b/i.test(example);
    case GrammarTarget.PastPerfect: return pastPerfect.test(example);
    case GrammarTarget.Conditional: return /\bif\b/i.test(example) && /\b(?:will|would)\b|['’]ll\b/i.test(example);
    case GrammarTarget.FutureGoingTo: return /\b(?:am|is|are)\s+going\s+to\s+[a-z]+/i.test(example);
    case GrammarTarget.FutureWill: return (/\bwill\b|['’]ll\b/i.test(example)) && !/\bwill\s+be\s+[a-z]+ing\b/i.test(example);
    case GrammarTarget.FutureContinuous: return /\bwill\s+be\s+[a-z]+ing\b/i.test(example);
    case GrammarTarget.PresentContinuous: return /\b(?:am|is|are)\s+[a-z]+ing\b/i.test(example) && !/\bgoing\s+to\b/i.test(example);
    case GrammarTarget.PastContinuous: return /\b(?:was|were)\s+[a-z]+ing\b/i.test(example);
    case GrammarTarget.RelativeClause:
      return /\b[a-z]+\s+(?:who|which|that|where)\s+[a-z]+/i.test(example)
        && !/^\s*(?:who|which|where)\b/i.test(example)
        && !/\b(?:decides?|knows?|wonders?|asks?|asked|said|told|reveals?|explains?|checks?)\s+(?:who|which|that|where)\b/i.test(example);
    case GrammarTarget.ReportedSpeech: return /\b(?:said|told|asked)\b/i.test(example);
    case GrammarTarget.QuestionForms:
      return /^(?:what|which|where|when|why|how|do|does|did|is|are|can)\b/i.test(example.trim()) && /\?$/.test(example.trim());
    case GrammarTarget.PresentSimple:
      // Screen obvious competing forms without limiting authors to a verb whitelist.
      return main.trim().split(/\s+/).length >= 3
        && !/\b(?:will|would|can|could|may|might|must|should|was|were|did|had)\b/i.test(main)
        && !/\b(?:am|is|are)\s+[a-z]+ing\b|\b(?:have|has)\s+(?:been|[a-z]+ed)\b/i.test(main);
    default: return false;
  }
}

export function validateGrammarFitRows(rows: unknown[], fail: Fail): GrammarFitAudit {
  const counts: GrammarFitAudit = { topics: rows.length, fits: 0, byAge: { kids: {}, teens: {} }, presentSimpleTopics: 0, questionTopics: 0, targetsWithEight: 0, repeatedWhys: 0, repeatedExamples: 0, formErrors: 0, kidsTargetErrors: 0 };
  const allowed = new Set<string>(Object.keys(GRAMMAR_TARGET_GROUPS).reduce<string[]>((all, group) => all.concat(GRAMMAR_TARGET_GROUPS[group]), []));
  const kids = new Set<string>([GrammarTarget.PresentSimple, GrammarTarget.PresentContinuous, GrammarTarget.PastSimple, GrammarTarget.FutureGoingTo, GrammarTarget.FutureWill, GrammarTarget.Comparatives, GrammarTarget.QuestionForms, GrammarTarget.Conditional]);
  const whys = new Map<string, string>();
  const examples = new Map<string, string>();
  const distribution: Record<string, number> = {};
  for (const [index, raw] of Array.from(rows.entries())) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const topic = raw as Record<string, unknown>;
    const where = `topic-briefings.json[${index}].grammarFits`;
    if (!Array.isArray(topic.grammarFits)) continue; // The main topic validator reports missing structure.
    const used = new Set<string>();
    for (const [fitIndex, fit] of Array.from(topic.grammarFits.entries())) {
      if (!fit || typeof fit !== 'object' || Array.isArray(fit)) continue;
      const at = `${where}[${fitIndex}]`;
      const { target, why, example } = fit as Record<string, unknown>;
      if (typeof target !== 'string' || !allowed.has(target)) continue;
      counts.fits += 1;
      if (!used.has(target)) {
        used.add(target);
        distribution[target] = (distribution[target] || 0) + 1;
        if (topic.ageBand === 'kids' || topic.ageBand === 'teens') {
          const bucket = counts.byAge[topic.ageBand];
          bucket[target] = (bucket[target] || 0) + 1;
        }
      }
      if (typeof why === 'string') {
        const normalized = key(why);
        if (whys.has(normalized)) { counts.repeatedWhys += 1; fail(at, `why repeats ${whys.get(normalized)}`); }
        else whys.set(normalized, String(topic.id));
      }
      if (typeof example === 'string') {
        const normalized = key(example);
        if (examples.has(normalized)) { counts.repeatedExamples += 1; fail(at, `example repeats ${examples.get(normalized)}`); }
        else examples.set(normalized, String(topic.id));
        if (!exampleUsesGrammarTarget(target, example)) { counts.formErrors += 1; fail(at, `example does not clearly demonstrate ${target}`); }
      }
      if (topic.ageBand === 'kids') {
        const condition = typeof example === 'string' ? (example.match(/\bif\s+([^,.!?]+)/i)?.[1] || '') : '';
        const pastCondition = condition.split(/\s+/).some((word) => word.length > 3 && past.test(word));
        const firstConditional = typeof example === 'string' && condition.length > 0 && !pastCondition
          && /\bwill\b|['’]ll\b/i.test(example) && !/\b(?:would|had|were|was)\b/i.test(example)
          && !/\bwill\b|['’]ll\b/i.test(condition);
        if (!kids.has(target) || (target === GrammarTarget.Conditional && !firstConditional)) {
          counts.kidsTargetErrors += 1; fail(at, 'kids require an allowed target and first conditional only');
        }
      }
    }
  }
  counts.presentSimpleTopics = distribution[GrammarTarget.PresentSimple] || 0;
  counts.questionTopics = distribution[GrammarTarget.QuestionForms] || 0;
  counts.targetsWithEight = Object.keys(distribution).filter((target) => distribution[target] >= 8).length;
  if (counts.presentSimpleTopics > rows.length * 0.35) fail('topic-briefings.json', `present simple exceeds 35% (${counts.presentSimpleTopics}/${rows.length})`);
  if (counts.questionTopics > rows.length * 0.20) fail('topic-briefings.json', `question forms exceeds 20% (${counts.questionTopics}/${rows.length})`);
  if (counts.targetsWithEight < 10) fail('topic-briefings.json', `need 10 targets on at least 8 topics each (found ${counts.targetsWithEight})`);
  return counts;
}

export function validateGrammarFits(dataDir: string, fail: Fail): GrammarFitAudit {
  try {
    const rows = JSON.parse(fs.readFileSync(path.join(dataDir, 'topic-briefings.json'), 'utf8'));
    if (!Array.isArray(rows)) throw new Error('expected an array');
    return validateGrammarFitRows(rows, fail);
  } catch (error) {
    fail('topic-briefings.json', `cannot audit grammar fits: ${String(error)}`);
    return validateGrammarFitRows([], () => undefined);
  }
}
