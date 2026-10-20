import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { GrammarSpotlightActivity } from '@/activities/grammar-spotlight/activity';
import type { ActivityProps, GrammarSpotlightContent } from '@/activities/types';

const phase = vi.hoisted(() => ({ step: 'choose' }));
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useState: (initial: unknown) => actual.useState(initial === 'choose' ? phase.step : initial) };
});
Object.assign(globalThis, { React });

const content: GrammarSpotlightContent = {
  activityKey: 'grammar-spotlight', topicContext: 'Journeys', grammarTarget: 'present perfect',
  rule: { form: 'have / has + past participle', whenToUse: 'For experiences.', pitfall: 'Use the past participle.', examples: ['I have visited Japan.'] },
  discover: { fromSource: true, sentences: [
    { text: 'I have seen snow.', highlight: 'have seen' },
    { text: 'She has flown home.', highlight: 'has flown' },
    { text: 'We have been abroad.', highlight: 'have been' },
  ] },
  clip: { id: 'clip', title: 'Grammar clip', youtubeId: 'test' },
};

// Render the actual component at each round phase. No DOM package or network is needed.
function screen(step: string, generatedContent = content) {
  phase.step = step;
  return renderToStaticMarkup(<GrammarSpotlightActivity
    sessionId={null} students={[]} currentStudentId={null}
    sessionSettings={{} as ActivityProps['sessionSettings']}
    onContinue={async () => ({ nextQuestion: '', teacherNote: '' })}
    generatedContent={generatedContent}
  />);
}

describe('Grammar Spotlight rule reveal', () => {
  it.each(['choose', 'see', 'talk', 'lit', 'watch'])('does not reveal the rule or its examples at %s', (step) => {
    const html = screen(step);
    expect(html).not.toContain(content.rule.form);
    expect(html).not.toContain(content.rule.examples[0]);
  });
  it('renders the final rule and each example once', () => {
    const html = screen('rule');
    expect(html.split(content.rule.form)).toHaveLength(2);
    expect(html.split(content.rule.examples[0])).toHaveLength(2);
    expect(html).toContain(content.rule.whenToUse);
    expect(html).toContain(content.rule.pitfall);
  });
  it('still offers Discover, Watch and Explain on the chooser', () => {
    const html = screen('choose');
    ['Discover it', 'Watch it', 'Explain it', 'Start'].forEach(label => expect(html).toContain(label));
  });
  it('keeps the fallback chooser unspoiled when Explain is the only mode', () => {
    const html = screen('choose', { ...content, discover: { sentences: [], fromSource: false }, clip: null });
    expect(html).not.toContain(content.rule.form);
    expect(html).not.toContain(content.rule.examples[0]);
    expect(html).toContain('Explain it');
  });
});
