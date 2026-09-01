/**
 * Cargo Hold â€” reviewed safe deck.
 *
 * Used when generation fails or the lesson carries too little vocabulary. Every line
 * here has been read for the humour rules in the spec: safe absurdity, travel and
 * classroom mishaps, no targets, nothing gross.
 *
 * The deck is deliberately set in the Lesson Captain world rather than being generic
 * filler â€” a degraded round still has to feel like this product, and a few topic cards
 * are woven in whenever a topic is known.
 */

import type { CargoCard, CargoPrompt } from './types';

export const CARGO_FALLBACK_PROMPTS: CargoPrompt[] = [
  {
    id: 'fallback-carryon',
    textBefore: 'The one thing you should never pack in your carry-on is ',
    textAfter: '.',
    acceptedFamilies: ['thing'],
    promptTag: 'carry-on',
    previewLabel: 'a thing',
    explanation: 'Noun phrases as the object of a sentence.',
  },
  {
    id: 'fallback-delay',
    textBefore: 'Our flight is delayed because the captain is ',
    textAfter: '.',
    acceptedFamilies: ['action'],
    promptTag: 'delay',
    previewLabel: 'an action',
    explanation: 'Present continuous for an action happening now.',
  },
  {
    id: 'fallback-passenger',
    textBefore: 'The passenger in seat 14B is extremely ',
    textAfter: '.',
    acceptedFamilies: ['description'],
    promptTag: 'passenger',
    previewLabel: 'a description',
    explanation: 'Adjective phrases after a linking verb.',
  },
  {
    id: 'fallback-announcement',
    textBefore: 'We are turning the plane around because ',
    textAfter: '.',
    acceptedFamilies: ['reason'],
    promptTag: 'announcement',
    previewLabel: 'a reason',
    explanation: 'Clauses that explain a cause.',
  },
  {
    id: 'fallback-souvenir',
    textBefore: 'I got stopped at customs for carrying ',
    textAfter: '.',
    acceptedFamilies: ['thing', 'action'],
    promptTag: 'souvenir',
    previewLabel: 'a thing or an action',
    explanation: 'Noun phrases and gerunds as objects.',
  },
  {
    id: 'fallback-review',
    textBefore: 'This airline lost one star in its review because the crew kept ',
    textAfter: '.',
    acceptedFamilies: ['action'],
    promptTag: 'review',
    previewLabel: 'an action',
    explanation: 'Gerunds after "keep".',
  },
];

const card = (
  id: string,
  family: CargoCard['family'],
  text: string,
  targetTerm: string,
  targetForm: string,
  meaning: string,
  emoji?: string,
): CargoCard => ({
  id,
  family,
  text,
  targetTerm,
  targetForm,
  meaning,
  source: 'safe-fallback',
  ...(emoji ? { emoji } : {}),
});

export const CARGO_FALLBACK_CARDS: CargoCard[] = [
  // things
  card('fb-suitcase-soup', 'thing', 'a suitcase full of warm soup', 'suitcase', 'suitcase', 'a bag for carrying clothes when you travel', 'ðŸ§³'),
  card('fb-emotional-support-cactus', 'thing', 'an emotional support cactus', 'support', 'support', 'help or encouragement given to someone', 'ðŸŒµ'),
  card('fb-boarding-pass', 'thing', 'a boarding pass written in crayon', 'boarding pass', 'boarding pass', 'the ticket that lets you get on a plane', 'ðŸŽ«'),
  card('fb-souvenir-rock', 'thing', 'a souvenir rock the size of a fridge', 'souvenir', 'souvenir', 'an object you keep to remember a trip', 'ðŸª¨'),
  card('fb-expired-map', 'thing', 'a map from forty years ago', 'map', 'map', 'a drawing that shows where places are', 'ðŸ—ºï¸'),
  card('fb-tiny-piano', 'thing', 'a piano that is somehow tiny', 'piano', 'piano', 'a large musical instrument with black and white keys', 'ðŸŽ¹'),
  card('fb-window-seat', 'thing', 'the last window seat on earth', 'window seat', 'window seat', 'a plane seat next to the window', 'ðŸªŸ'),
  card('fb-luggage-tag', 'thing', 'a luggage tag with someone else name', 'luggage', 'luggage', 'the bags you take on a journey', 'ðŸ·ï¸'),

  // actions
  card('fb-negotiate-pigeon', 'action', 'negotiating with a pigeon at Gate 12', 'negotiate', 'negotiating', 'to discuss something in order to reach an agreement', 'ðŸ•Šï¸'),
  card('fb-reorganize-clouds', 'action', 'reorganising the clouds by height', 'reorganise', 'reorganising', 'to arrange things in a different order', 'â˜ï¸'),
  card('fb-apologise-luggage', 'action', 'apologising to the luggage', 'apologise', 'apologising', 'to say sorry for something', 'ðŸ™‡'),
  card('fb-announce-snacks', 'action', 'announcing every snack individually', 'announce', 'announcing', 'to tell people about something publicly', 'ðŸ“£'),
  card('fb-practise-landing', 'action', 'practising the landing in the car park', 'practise', 'practising', 'to do something repeatedly to get better', 'ðŸ›¬'),
  card('fb-argue-seatbelt', 'action', 'arguing with the seatbelt sign', 'argue', 'arguing', 'to disagree with someone in words', 'ðŸ””'),
  card('fb-translate-safety', 'action', 'translating the safety card into song', 'translate', 'translating', 'to change words into another language', 'ðŸŽµ'),
  card('fb-queue-nothing', 'action', 'queueing for absolutely nothing', 'queue', 'queueing', 'to wait in a line', 'ðŸš¶'),

  // descriptions
  card('fb-dramatically-calm', 'description', 'dramatically calm about everything', 'dramatic', 'dramatically', 'showing strong feeling in an obvious way', 'ðŸŽ­'),
  card('fb-suspiciously-cheerful', 'description', 'suspiciously cheerful for 5am', 'suspicious', 'suspiciously', 'making you feel something is not right', 'ðŸ˜ƒ'),
  card('fb-extremely-organised', 'description', 'extremely organised about snacks only', 'organised', 'organised', 'arranged in a careful, tidy way', 'ðŸ“‹'),
  card('fb-mildly-confused', 'description', 'mildly confused by the concept of doors', 'confused', 'confused', 'not able to understand something clearly', 'ðŸšª'),
  card('fb-relentlessly-polite', 'description', 'relentlessly polite to the wrong person', 'polite', 'polite', 'behaving in a respectful, well-mannered way', 'ðŸ™‚'),
  card('fb-unusually-confident', 'description', 'unusually confident about geography', 'confident', 'confident', 'sure that you can do something well', 'ðŸŒ'),

  // reasons
  card('fb-because-forgot-snacks', 'reason', 'the crew forgot the snack trolley', 'forget', 'forgot', 'to fail to remember something', 'ðŸª'),
  card('fb-because-wrong-continent', 'reason', 'we appear to be over the wrong continent', 'appear', 'appear', 'to seem to be something', 'ðŸŒŽ'),
  card('fb-because-captain-nap', 'reason', 'the captain scheduled a nap mid-flight', 'schedule', 'scheduled', 'to plan when something will happen', 'ðŸ˜´'),
  card('fb-because-lost-headset', 'reason', 'nobody can locate the headset', 'locate', 'locate', 'to find where something is', 'ðŸŽ§'),
  card('fb-because-debate', 'reason', 'row 9 started a debate about pineapple', 'debate', 'debate', 'a formal discussion of opposite opinions', 'ðŸ'),
  card('fb-because-timezone', 'reason', 'we arrived before we departed', 'depart', 'departed', 'to leave a place, especially to start a journey', 'ðŸ•'),

  // wildcards â€” declare the prompt tags they genuinely fit, never universal
  {
    ...card('fb-wild-paperwork', 'wildcard', 'an unreasonable amount of paperwork', 'paperwork', 'paperwork', 'documents that must be completed', 'ðŸ“„'),
    compatiblePromptTags: ['carry-on', 'souvenir'],
  },
  {
    ...card('fb-wild-explaining', 'wildcard', 'explaining the situation to a plant', 'explain', 'explaining', 'to make something clear by describing it', 'ðŸª´'),
    compatiblePromptTags: ['delay', 'review', 'souvenir'],
  },
];

/**
 * Weave a handful of topic-shaped cards into the safe deck so a degraded round still
 * points at the lesson instead of drifting into unrelated filler.
 */
export function topicCards(topic: string): CargoCard[] {
  const clean = topic.trim().toLowerCase();
  if (!clean || clean.length > 40) return [];
  return [
    card(`fb-topic-thing-${encodeURIComponent(clean)}`, 'thing', `far too much ${clean} for one bag`, clean, clean, `the subject of today's lesson`),
    card(`fb-topic-action-${encodeURIComponent(clean)}`, 'action', `explaining ${clean} to the flight crew`, 'explain', 'explaining', 'to make something clear by describing it'),
    card(`fb-topic-reason-${encodeURIComponent(clean)}`, 'reason', `everyone started talking about ${clean}`, 'talk', 'talking', 'to speak in order to give information'),
  ];
}

export function buildFallbackDeck(topic = ''): { cards: CargoCard[]; prompts: CargoPrompt[] } {
  return {
    cards: [...CARGO_FALLBACK_CARDS, ...topicCards(topic)],
    prompts: CARGO_FALLBACK_PROMPTS,
  };
}
