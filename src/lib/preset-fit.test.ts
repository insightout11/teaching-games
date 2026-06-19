import { describe, it, expect } from 'vitest';
import { inferSourceGenre, bestPresetForGenre, fitScore, fitTier } from './preset-fit';

const WF_ELIGIBLE = ['all-around-flight-60', 'speak-60', 'travel-60', 'debate-60'];

describe('inferSourceGenre', () => {
  it('maps opinion/debate/persuasion skills to opinion', () => {
    expect(inferSourceGenre({ skills: ['Speaking', 'Debate'] })).toBe('opinion');
    expect(inferSourceGenre({ skills: ['Persuasion'] })).toBe('opinion');
    // Real WF focus skills.
    expect(inferSourceGenre({ skills: ['listening', 'culture', 'opinion'], lessonGoal: 'Discuss how food culture changes' })).toBe('opinion');
  });

  it('detects opinion from goal text', () => {
    expect(inferSourceGenre({ lessonGoal: 'Should we ban cars in the city centre?' })).toBe('opinion');
  });

  it('detects travelogue from the travel/directions skills (real WF focus)', () => {
    expect(inferSourceGenre({ skills: ['listening', 'travel English', 'directions'], lessonGoal: 'Describe a transport hub and give practical route advice.' })).toBe('travelogue');
    expect(inferSourceGenre({ lessonGoal: 'Getting around the city by public transport' })).toBe('travelogue');
  });

  it('detects discussion from the discussion skill (real WF focus)', () => {
    expect(inferSourceGenre({ skills: ['listening', 'urban culture', 'discussion'], lessonGoal: 'Explain how creative reuse can protect identity.' })).toBe('discussion');
    expect(inferSourceGenre({ skills: ['reading', 'creative economy', 'discussion'] })).toBe('discussion');
  });

  it('detects how-to, dialogue, narrative', () => {
    expect(inferSourceGenre({ title: 'How to use the past conditional' })).toBe('how-to');
    expect(inferSourceGenre({ title: 'In conversation with a chef', skills: ['Listening'] })).toBe('dialogue');
    expect(inferSourceGenre({ skills: ['Creativity'], title: 'A day in the life' })).toBe('narrative');
  });

  it('falls back to expository for plain analytical sources', () => {
    // Real WF focus: comparison/explanatory cultural piece, no talk/opinion/travel skill.
    expect(inferSourceGenre({ skills: ['reading', 'culture', 'comparison'], lessonGoal: 'Explain how a festival can be both sacred tradition and public entertainment.' })).toBe('expository');
    expect(inferSourceGenre({ skills: ['reading', 'urban design', 'problem solving'], lessonGoal: 'Evaluate why parks matter in a hot, crowded city.' })).toBe('expository');
    expect(inferSourceGenre({})).toBe('expository');
  });
});

describe('bestPresetForGenre', () => {
  it('recommends the right plan per genre', () => {
    expect(bestPresetForGenre('opinion', WF_ELIGIBLE)).toBe('debate-60');
    expect(bestPresetForGenre('discussion', WF_ELIGIBLE)).toBe('speak-60');
    expect(bestPresetForGenre('expository', WF_ELIGIBLE)).toBe('all-around-flight-60');
    expect(bestPresetForGenre('travelogue', WF_ELIGIBLE)).toBe('travel-60');
    expect(bestPresetForGenre('narrative', WF_ELIGIBLE)).toBe('speak-60');
  });

  it('only returns an eligible preset', () => {
    // Debate not eligible → opinion should fall to the next best eligible (Captain's/Speak).
    const eligible = ['all-around-flight-60', 'speak-60'];
    expect(eligible).toContain(bestPresetForGenre('opinion', eligible));
  });

  it('breaks ties toward Captain\'s', () => {
    // how-to scores all-around=2 above speak=1/travel=1/debate=0 among this set
    expect(bestPresetForGenre('how-to', WF_ELIGIBLE)).toBe('all-around-flight-60');
  });

  it('returns null for empty eligible set', () => {
    expect(bestPresetForGenre('opinion', [])).toBeNull();
  });
});

describe('fitScore / fitTier', () => {
  it('scores known pairs and tiers them', () => {
    expect(fitScore('opinion', 'debate-60')).toBe(3);
    expect(fitScore('opinion', 'travel-60')).toBe(0);
    expect(fitTier(3)).toBe('best');
    expect(fitTier(0)).toBe('poor');
  });
});
