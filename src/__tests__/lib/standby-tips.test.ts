import { describe, it, expect } from 'vitest';
import {
  WAITING_TIPS,
  standbyDifficultyRank,
  filterStandbyTipsForDifficulty,
  buildStandbyTipPool,
  type StandbyTip,
} from '@/lib/standby-tips';

const IDIOM_BITE_THE_BULLET = /bite the bullet/i;
const ABSTRACT_NOUNS = /abstract nouns/i;
const COLLOCATIONS = /collocations/i;

describe('standby tip difficulty filtering', () => {
  it('never shows Easy+ material in a Beginner session', () => {
    const tips = filterStandbyTipsForDifficulty('Beginner');
    const text = tips.map((t) => t.text).join(' ');

    // The three cards the beginner live-test pass flagged as mismatched.
    expect(text).not.toMatch(IDIOM_BITE_THE_BULLET);
    expect(text).not.toMatch(ABSTRACT_NOUNS);
    expect(text).not.toMatch(COLLOCATIONS);

    // And nothing above Beginner leaks in at all.
    expect(tips.length).toBeGreaterThan(0);
    for (const tip of tips) {
      const source = WAITING_TIPS.find((w) => w.text === tip.text);
      expect(source?.minLevel).toBe('Beginner');
    }
  });

  it('keeps richer tips available at Intermediate and Advanced', () => {
    const beginner = filterStandbyTipsForDifficulty('Beginner');
    const intermediate = filterStandbyTipsForDifficulty('Intermediate');
    const advanced = filterStandbyTipsForDifficulty('Advanced');

    expect(intermediate.length).toBeGreaterThan(beginner.length);
    expect(advanced.length).toBeGreaterThanOrEqual(intermediate.length);
    expect(intermediate.map((t) => t.text).join(' ')).toMatch(ABSTRACT_NOUNS);
  });

  it('clamps an unknown or missing difficulty to the most restrictive level', () => {
    const beginnerCount = filterStandbyTipsForDifficulty('Beginner').length;

    expect(standbyDifficultyRank(undefined)).toBe(0);
    expect(standbyDifficultyRank(null)).toBe(0);
    expect(standbyDifficultyRank('Not A Level')).toBe(0);

    // Must not collapse to an empty pool (which previously rendered an undefined tip).
    for (const value of [undefined, null, '', 'Not A Level']) {
      const tips = filterStandbyTipsForDifficulty(value);
      expect(tips.length).toBe(beginnerCount);
      expect(tips.map((t) => t.text).join(' ')).not.toMatch(IDIOM_BITE_THE_BULLET);
    }
  });
});

describe('standby tip pool ordering', () => {
  const topicTips: StandbyTip[] = [
    { category: 'Daily routines Vocab', color: 'teal', text: 'wake up (verb) — to stop sleeping.' },
    { category: 'Grammar Tip', color: 'blue', text: 'Use the simple present for routines: I get up at seven.' },
  ];

  it('puts topic-aware tips ahead of the generic static pool', () => {
    const pool = buildStandbyTipPool(topicTips, 'Beginner');
    expect(pool.slice(0, topicTips.length)).toEqual(topicTips);
    expect(pool.length).toBe(topicTips.length + filterStandbyTipsForDifficulty('Beginner').length);
  });

  it('still yields a usable pool when no topic tips have loaded', () => {
    const pool = buildStandbyTipPool([], 'Beginner');
    expect(pool.length).toBeGreaterThan(0);
  });

  it('applies difficulty gating to the static portion of the pool', () => {
    const pool = buildStandbyTipPool(topicTips, 'Beginner');
    expect(pool.map((t) => t.text).join(' ')).not.toMatch(IDIOM_BITE_THE_BULLET);
  });
});
