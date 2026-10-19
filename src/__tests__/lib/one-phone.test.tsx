import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { phoneClues, type MysteryClue } from '@/games/mystery-flight/logic';
import { rankItPhoneSpec } from '@/activities/rank-it/phone-spec';
import { sectorPhoneSpec } from '@/games/sector-strike/phone-spec';
import { storyWritingPhoneSpec } from '@/games/story-sprint/phone-spec';
import { councilChallengePhoneSpec } from '@/activities/decision-council/phone-spec';
import { contextForPhone, designPhoneContext, dialoguePhoneContext, pictureStoryPhoneContext, predictionPhoneContext, publicEvidenceContext, readingPhoneContext } from '@/lib/one-phone-context';
import { getInputRemountKey, getInputSpecRevision, type InputSpec } from '@/lib/input-spec';
import { InputContext, SectorBoard } from '@/components/student/input-context';

Object.assign(globalThis, { React });

describe('one-phone primary fixes', () => {
  it('publishes only released Mystery Flight clues, newest first', () => {
    const deck: MysteryClue[] = [{ kind: 'text', category: 'food', text: 'Rice is popular.' }, { kind: 'photo', url: '/photo.jpg', alt: 'ANSWER: Bangkok' }, { kind: 'text', category: 'giveaway', text: 'UNSEEN' }];
    expect(phoneClues(deck, 2)).toEqual([{ text: 'Photo clue', images: [{ url: '/photo.jpg', alt: 'Photo clue' }] }, { text: 'Rice is popular.' }]);
    expect(JSON.stringify(phoneClues(deck, 2))).not.toMatch(/Bangkok|UNSEEN/);
    expect(phoneClues(deck, 0)).toEqual([]);
  });

  it('updates clues without resetting the map or losing a pending pin', () => {
    const spec: InputSpec = { type: 'geo-point', gameKey: 'mystery-flight', roundId: 'opaque-run-0', stableInput: true, context: [{ text: 'First clue' }] };
    const next = { ...spec, context: [{ text: 'Second clue' }, ...spec.context!] };
    expect(getInputRemountKey(next)).toBe(getInputRemountKey(spec));
    expect(getInputSpecRevision(next)).not.toBe(getInputSpecRevision(spec));
    expect(getInputRemountKey({ ...next, roundId: 'opaque-run-1' })).not.toBe(getInputRemountKey(spec));
  });

  it('keeps Rank It facts off the first round, but includes them for re-ranking', () => {
    const challenge = { id: 'r', prompt: 'Rank the journeys', items: [{ id: 'train', name: 'Train', hiddenFact: 'Takes 2 hours' }, { id: 'bus', name: 'Bus', hiddenFact: 'Takes 4 hours' }], correctOrder: ['train', 'bus'], correctRationale: 'SECRET' };
    expect(rankItPhoneSpec(challenge, false).context).toBeUndefined();
    const spec = rankItPhoneSpec(challenge, true);
    expect(spec.context).toEqual([{ text: 'Train: Takes 2 hours' }, { text: 'Bus: Takes 4 hours' }]);
    expect(spec.options).toEqual(['Train', 'Bus']);
    expect(JSON.stringify(spec)).not.toMatch(/correctOrder|SECRET/);
  });

  it('sends a complete public sector board without hidden questions or bonuses', () => {
    const cells = Array.from({ length: 64 }, (_, index) => ({ index, team: index === 0 ? 'x' as const : null, bonus: 'SECRET', question: 'HIDDEN QUESTION', correctIndex: 2 }));
    const spec = sectorPhoneSpec(cells, 'o', 'Mia', [1, 2]);
    expect(spec.sectorBoard).toHaveLength(64);
    expect(spec.sectorBoard?.[0]).toEqual({ label: 'A1', owner: 'Azure', selectable: false });
    expect(spec.sectorBoard?.[1].selectable).toBe(true);
    expect(spec.sectorBoard?.[63].label).toBe('H8');
    expect(JSON.stringify(spec)).not.toMatch(/SECRET|HIDDEN|correctIndex|bonus/);
  });

  it('puts the selected spoken sector question on the phone', () => {
    expect(sectorPhoneSpec([], 'x', 'Mia', [], 'Describe your journey.').prompt).toBe('Describe your journey.');
  });

  it('includes only the last three accepted story lines and preserves submission routing', () => {
    const spec = storyWritingPhoneSpec([{ text: 'Old line' }, { text: 'Starter' }, { text: 'A door opened.' }, { text: 'A dog entered.' }], 'pets', 42);
    expect(spec.context?.map(p => p.text)).toEqual(['Starter', 'A door opened.', 'A dog entered.']);
    expect(spec.reviewMode).toBe('approval');
    expect(spec.startedAt).toBe(42);
    expect(storyWritingPhoneSpec([], '', 43).prompt).toBe('Start the story with one sentence');
  });

  it('shows Council proposal text while retaining exact signal values', () => {
    const spec = councilChallengePhoneSpec('How should we travel?', [{ label: 'C', proposal: { text: 'Take the train.' } }]);
    expect(spec.options).toEqual(['support:C', 'challenge:C', 'evidence:C']);
    expect(spec.optionLabels?.every(label => label.includes('C: Take the train.'))).toBe(true);
    expect(spec.context?.map(p => p.text)).toContain('How should we travel?');
  });

  it('retains the full Council proposal even when the repeated button labels are shortened', () => {
    const text = 'Keep this detail. '.repeat(12) + 'Essential final detail.';
    const spec = councilChallengePhoneSpec('Question', [{ label: 'A', proposal: { text } }]);
    expect(spec.context?.[1].text).toBe('A: ' + text);
    expect(spec.optionLabels?.[0].length).toBeLessThan(120);
  });
});

describe('public context and private reminders', () => {
  it('prediction phones see the cast and only a previously revealed recap', () => {
    const cast = [{ name: 'Mia', who: 'A pilot' }];
    expect(predictionPhoneContext(cast, 'HIDDEN RECAP', false)).toEqual([{ text: 'Mia: A pilot' }]);
    expect(predictionPhoneContext(cast, 'Last time Mia landed.', true).map(p => p.text)).toEqual(['Mia: A pilot', 'Last time Mia landed.']);
  });
  it('includes both dialogue cues and the setting without evaluation/model fields', () => {
    const source = { context: 'At the station', speakerA_before: 'When is the train?', speakerA_after: 'Thanks. I will wait.', modelAnswer: 'SECRET' };
    expect(dialoguePhoneContext(source).map(p => p.text)).toEqual(['At the station', 'A: When is the train?', 'B: …', 'A: Thanks. I will wait.']);
    expect(JSON.stringify(dialoguePhoneContext(source))).not.toContain('SECRET');
  });

  it('sends original reading text/images, excluding question answers', () => {
    const source = [{ text: 'A dog followed Mia.', image: '/dog.jpg', gist: { correctIndex: 2, rationale: 'SECRET' } }];
    expect(readingPhoneContext(source)).toEqual([{ text: 'A dog followed Mia.', images: [{ url: '/dog.jpg', alt: 'Reading illustration' }] }]);
    expect(JSON.stringify(readingPhoneContext(source))).not.toMatch(/correctIndex|SECRET/);
  });

  it('gives Junior story pages text and pictures without sending quiz keys', () => {
    const context = pictureStoryPhoneContext([{ text: 'The dog ran.', pictures: ['dog'] }]);
    expect(context[0].text).toBe('The dog ran.');
    expect(context[0].images?.[0].url).toContain('/stickers/');
    expect(context[0].images?.[0].alt).toBeTruthy();
  });

  it('includes only already-revealed cabin evidence, never implications or solution metadata', () => {
    const cards = [{ label: 'Bag tag', content: 'The tag is blue.', implication: 'SECRET' }, { label: 'Receipt', content: 'UNREVEALED' }];
    const context = publicEvidenceContext('A suitcase is missing.', cards, 1);
    expect(context.map(p => p.text)).toEqual(['A suitcase is missing.', 'Bag tag: The tag is blue.']);
    expect(JSON.stringify(context)).not.toMatch(/SECRET|UNREVEALED/);
    expect(publicEvidenceContext('Setup', cards, 0)).toEqual([{ text: 'Setup' }]);
  });

  it('retains design summaries, option details, benefits and tradeoffs', () => {
    const source = { question: 'Choose a roof', designSummary: 'A small shelter', options: [{ id: 'A', title: 'Glass', description: 'Clear panels', benefit: 'More daylight', tradeoff: 'Gets hot', privateScore: 99 }] };
    const result = designPhoneContext(source);
    expect(result.map(p => p.text).join(' ')).toMatch(/Choose a roof.*small shelter.*Clear panels[\s\S]*More daylight[\s\S]*Gets hot/);
    expect(JSON.stringify(result)).not.toContain('privateScore');
  });

  it('shows only the identified student’s assigned side reminder', () => {
    const spec: InputSpec = { type: 'text', gameKey: 'hot-take-arena', context: [{ text: 'Statement' }], perStudentData: { mia: { phoneContext: [{ text: 'DEFEND' }] }, joe: { phoneContext: [{ text: 'ATTACK' }] } } };
    expect(contextForPhone(spec, ['mia']).map(p => p.text)).toEqual(['Statement', 'DEFEND']);
    expect(contextForPhone(spec, ['late-joiner']).map(p => p.text)).toEqual(['Statement']);
    expect(contextForPhone(spec, [null, 'joe']).map(p => p.text)).toEqual(['Statement', 'ATTACK']);
  });

  it('renders public text as escaped text and pictures with accessible labels', () => {
    const html = renderToStaticMarkup(<InputContext items={[{ text: '<script>bad()</script>', images: [{ url: '/photo.jpg', alt: 'Photo clue' }] }]} />);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('alt="Photo clue"');
  });

  it('lets long reading references expand without hiding the answer controls below the reference', () => {
    const html = renderToStaticMarkup(<><InputContext items={[{ text: 'Original passage' }]} collapsible /><button>Answer</button></>);
    expect(html).toContain('<details');
    expect(html).toContain('Read the passage');
    expect(html).not.toContain('<details open');
    expect(html).toContain('</details><button>Answer</button>');
  });

  it('renders every sector label and announces ownership without relying on colour', () => {
    const spec = sectorPhoneSpec([{ index: 0, team: 'x' }, { index: 1, team: null }], 'x', 'Mia');
    const html = renderToStaticMarkup(<SectorBoard cells={spec.sectorBoard} />);
    expect(html).toContain('aria-label="A1: Azure"');
    expect(html).toContain('aria-label="B1: open, available"');
  });
});
