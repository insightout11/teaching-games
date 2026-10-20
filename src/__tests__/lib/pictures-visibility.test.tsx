import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActivityProps } from '@/activities/types';
import type { GameProps } from '@/games/types';
import type { InputSpec } from '@/lib/input-spec';
import type { FreePicture } from '@/lib/sources/wikimedia-images';
import { FlashQuizGame } from '@/games/flash-quiz/game';
import { TabooSprintActivity } from '@/activities/taboo-sprint/activity';
import { HotSeatActivity } from '@/activities/hot-seat/activity';
import { VocabMicroActivity } from '@/activities/vocab-micro/activity';
import { VocabRadarActivity } from '@/activities/vocab-radar/activity';
import { LanguageToolkitActivity } from '@/activities/language-toolkit/activity';
import { TabooSprintPanel } from '@/components/student/taboo-sprint-panel';
import { HotSeatPanel } from '@/components/student/hot-seat-panel';
import { SceneScriptPanel } from '@/components/student/scene-script-panel';
import { FreePictureView } from '@/components/ui/free-picture';
import { tabooDescriberCard, hotSeatClueCard } from '@/lib/secret-picture-cards';
import { bankedPictureQuery } from '@/data/banked-picture-queries';
import { pictureQuery } from '@/lib/free-picture-cache';

// Set the real component's initial state for each render; effects do not run in
// server rendering. A resolved teacher lookup is supplied without any network calls.
const state = vi.hoisted(() => ({ values: {} as Record<number, unknown>, index: 0 }));
vi.mock('react', async importOriginal => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useState: (initial: unknown) => {
    const i = state.index++;
    return actual.useState(Object.prototype.hasOwnProperty.call(state.values, i) ? state.values[i] : initial);
  } };
});
vi.mock('@/lib/use-free-picture', () => ({ useFreePicture: (_session: unknown, query: unknown) => typeof query === 'string' && query.trim() ? photo : null }));
vi.mock('@/stores/live-room-store', () => ({ useRoom: () => ({ material: [] }) }));
vi.mock('@/stores/session-store', async importOriginal => ({
  ...await importOriginal<typeof import('@/stores/session-store')>(),
  useSessionStore: (selector: (store: Record<string, unknown>) => unknown) => selector({ seenCacheIds: [], seenItemsByGame: {}, sourceMaterial: null, lessonKit: null, tripLog: [], recordFeature: vi.fn(), addSeenCacheId: vi.fn(), addFlightLogEntry: vi.fn() }),
}));
Object.assign(globalThis, { React });

const photo: FreePicture = { id: '1', title: 'SECRET elephant photo', credit: 'Example photographer · CC BY',
  thumbUrl: 'https://upload.wikimedia.org/thumb.jpg', imageUrl: 'https://upload.wikimedia.org/photo.jpg', pageUrl: 'https://commons.wikimedia.org/wiki/File:Photo.jpg' };
const card = { word: 'elephant', description: 'A large animal.', forbiddenWords: ['trunk'], picture: 'African elephant animal' };
const person = { id: 'one', name: 'One' };
const settings: ActivityProps['sessionSettings'] = { difficulty: 'Easy', timerSeconds: 30, topic: 'General', customTopic: 'Animals', tone: 'Neutral', scoringMode: 'competitive', grammarTarget: null };
const base = { sessionId: 'session', students: [], currentStudentId: null, sessionSettings: settings, config: {}, onPickStudent: vi.fn(), onContinue: async () => ({ nextQuestion: '', teacherNote: '' }) };
beforeEach(() => { state.index = 0; state.values = {}; });
function render(element: React.ReactElement, values: Record<number, unknown> = {}) {
  state.index = 0; state.values = values;
  return renderToStaticMarkup(element);
}

describe('actual shared-screen picture boundaries', () => {
  const question = { question: 'What is the capital of France?', options: ['Paris', 'Rome', 'Tokyo', 'Cairo'], correctIndex: 0, explanation: 'Paris is the capital.', picture: 'France country map' };
  it.each(['setup', 'betting', 'answering'])('has no quiz photo or revealing alt/credit at %s', phase => {
    const html = render(<FlashQuizGame {...base} onScore={vi.fn() as GameProps['onScore']} />, { 0: phase, 3: [question] });
    expect(html).not.toContain('<img'); expect(html).not.toContain(photo.title); expect(html).not.toContain(photo.credit);
  });
  it('shows the credited quiz photo after reveal', () => {
    const html = render(<FlashQuizGame {...base} onScore={vi.fn() as GameProps['onScore']} />, { 0: 'revealing', 3: [question] });
    expect(html).toContain(photo.thumbUrl); expect(html).toContain(photo.credit);
  });
  it('keeps the current Taboo secret and photo off the projected screen', () => {
    const html = render(<TabooSprintActivity {...base} generatedContent={{ activityKey: 'taboo-sprint', topicContext: 'Animals', rounds: [card], topic: 'Animals' }} />,
      { 1: 'turn', 6: person, 7: [card] });
    expect(html).not.toContain(card.word); expect(html).not.toContain('<img'); expect(html).not.toContain(photo.title);
  });
  it('keeps the current Hot Seat secret and photo off the projected screen', () => {
    const html = render(<HotSeatActivity {...base} generatedContent={{ activityKey: 'hot-seat', topicContext: 'Animals', cards: [card], topic: 'Animals' }} />,
      { 0: 'turn', 1: person, 3: [card] });
    expect(html).not.toContain(card.word); expect(html).not.toContain('<img'); expect(html).not.toContain(photo.title);
  });
  it.each(['idle', 'voting'])('keeps a Vocab Micro target photo out at %s', phase => {
    const html = render(<VocabMicroActivity {...base} generatedContent={{ activityKey: 'vocab-micro', topicContext: 'Animals', sentence: 'The ___ has a trunk.', options: ['elephant', 'dog'], correctIndex: 0, word: 'elephant', explanation: 'A large animal.', picture: card.picture }} />, { 0: phase });
    expect(html).not.toContain('<img');
  });
  it('shows the Micro word picture with its revealed meaning', () => {
    const html = render(<VocabMicroActivity {...base} generatedContent={{ activityKey: 'vocab-micro', topicContext: 'Animals', sentence: 'The ___ has a trunk.', options: ['elephant', 'dog'], correctIndex: 0, word: 'elephant', explanation: 'A large animal.', picture: card.picture }} />, { 0: 'reveal', 3: true });
    expect(html).toContain(photo.thumbUrl);
  });
  it('does not cue a Radar familiarity rating, but illustrates the meaning reveal', () => {
    const element = <VocabRadarActivity {...base} generatedContent={{ activityKey: 'vocab-radar', topicContext: 'Animals', words: [{ word: card.word, definition: card.description, picture: card.picture }] }} />;
    expect(render(element, { 0: 'prompting' })).not.toContain('<img');
    expect(render(element, { 0: 'revealing' })).toContain(photo.thumbUrl);
  });
  it('illustrates public Toolkit word-and-meaning cards', () => {
    const html = render(<LanguageToolkitActivity {...base} generatedContent={{ activityKey: 'language-toolkit', topicContext: 'Animals', items: [{ term: card.word, meaning: card.description, example: 'It walked.', picture: card.picture }] }} />, { 0: 'presenting' });
    expect(html).toContain(photo.thumbUrl);
  });
});

describe('private phone pictures and complete jobs', () => {
  it('shows a credited picture only on the Taboo describer phone', () => {
    const spec: InputSpec = { type: 'confirm', gameKey: 'taboo-sprint', perStudentData: { one: tabooDescriberCard(card, photo), two: { role: 'bench' } } };
    expect(render(<TabooSprintPanel spec={spec} studentId="one" onSubmit={vi.fn()} />)).toContain(photo.credit);
    expect(render(<TabooSprintPanel spec={spec} studentId="two" onSubmit={vi.fn()} />)).not.toContain('<img');
    expect(render(<TabooSprintPanel spec={spec} studentId="other" onSubmit={vi.fn()} />)).not.toContain(photo.title);
  });
  it('hides the Hot Seat photo from the guesser and waiting phones', () => {
    const spec: InputSpec = { type: 'confirm', gameKey: 'hot-seat', perStudentData: { __room: { phase: 'turn', hotSeat: 'One' }, one: { role: 'hot' }, two: hotSeatClueCard(card, photo, true) } };
    expect(render(<HotSeatPanel spec={spec} studentId="two" />)).toContain(photo.credit);
    expect(render(<HotSeatPanel spec={spec} studentId="one" />)).not.toContain(photo.title);
    expect(render(<HotSeatPanel spec={spec} studentId="other" />)).not.toContain('<img');
  });
  it.each(['director', 'narrator', 'critic'])('keeps the %s job and action on its own phone', job => {
    const spec: InputSpec = { type: 'confirm', gameKey: 'scene-igniter', perStudentData: { __room: true, one: { role: 'audience', job, title: job, instruction: 'When the teacher calls you, speak.', context: 'At a station.', scene: 'A lost bag', progress: 'Take 1 · line 2 of 24' } } };
    const html = render(<SceneScriptPanel spec={spec} studentId="one" />);
    expect(html).toContain(job); expect(html).toContain('When the teacher calls you, speak.'); expect(html).toContain('At a station.');
  });
  it('requires checked attribution metadata and preserves text-only fallbacks', () => {
    expect(render(<FreePictureView picture={photo} />)).toContain(photo.credit);
    expect(render(<FreePictureView picture={{ ...photo, credit: '' }} />)).toBe('');
    expect(render(<FreePictureView picture={null} />)).toBe('');
    ['honesty', 'although', 'bank', 'unknown word'].forEach(word => expect(bankedPictureQuery(word)).toBe(''));
    expect(pictureQuery(bankedPictureQuery('elephant'))).not.toBe('');
  });
});
