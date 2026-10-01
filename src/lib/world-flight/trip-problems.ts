/**
 * Travel v2, Take 2: after a performed stop's scripted Take 1, the same pair replays the scene
 * with a PROBLEM, in their own words. Deterministic (stops must always work). The traveller's
 * card steers the pick where it fits (the nut-allergy traveller gets the peanut dish, the
 * backpacker hits the pricey taxi), otherwise problems rotate per turn so each pair gets a new one.
 */
import type { TravellerCard } from './traveller-cards';

export type ProblemStop = 'arrival' | 'getting-there' | 'hotel' | 'meal';

export interface TripProblem {
  id: string;
  title: string;
  /** What the service student springs on the traveller (said in their own words). */
  serviceOpener: string;
  /** What the traveller has to achieve. */
  goal: string;
  /** Helper phrases on the phones. */
  phrases: string[];
  /** Fits this traveller especially well. */
  fits?: (card: TravellerCard) => boolean;
}

const PROBLEMS: Record<ProblemStop, TripProblem[]> = {
  arrival: [
    { id: 'no-address', title: 'No hotel address', serviceOpener: 'I need the address where you are staying. It’s not on your form.', goal: 'Explain where you are staying and offer another way to show it.',
      phrases: ['I’m sorry, I don’t have it written down.', 'It’s near ___.', 'Can I show you on my phone?', 'I can call the hotel.'] },
    { id: 'return-ticket', title: 'Where’s your return ticket?', serviceOpener: 'Can I see your return ticket, please?', goal: 'Explain when and how you are going home.',
      phrases: ['I’m flying home on ___.', 'It’s in my email.', 'Can I show you on my phone?', 'I’m staying for ___ days.'] },
    { id: 'bag-check', title: 'Bag check', serviceOpener: 'Please open your bag. What is this food?', goal: 'Explain what is in your bag and why you have it.',
      phrases: ['It’s a present for ___.', 'It’s just snacks.', 'I didn’t know that.', 'Do I need to throw it away?'] },
    { id: 'business-purpose', title: 'More questions', serviceOpener: 'You said holiday, but you have a laptop and business cards. Is this a work trip?', goal: 'Explain your plans clearly and politely.',
      phrases: ['Actually, it’s for ___.', 'I have a meeting on ___.', 'Mainly ___, but also ___.', 'Here is my invitation letter.'],
      fits: (c) => /business/.test(c.persona) },
  ],
  'getting-there': [
    { id: 'line-closed', title: 'The line is closed', serviceOpener: 'Sorry, that line is closed today. There are works on the track.', goal: 'Find another way into the city.',
      phrases: ['Is there another way to get to ___?', 'How long does that take?', 'Where does it leave from?', 'Is there a bus instead?'] },
    { id: 'too-expensive', title: 'Too expensive', serviceOpener: 'A taxi to the city centre is about fifty, plus the motorway fee.', goal: 'Say it’s too much for your budget and find a cheaper option.',
      phrases: ['That’s a bit too expensive for me.', 'Is there anything cheaper?', 'How much is the bus / train?', 'I don’t mind if it takes longer.'],
      fits: (c) => c.budget === '$' },
    { id: 'card-declined', title: 'Card declined', serviceOpener: 'I’m sorry, your card isn’t working.', goal: 'Find another way to pay.',
      phrases: ['Can I try again?', 'Can I pay in cash?', 'Is there a cash machine near here?', 'Do you take ___?'] },
    { id: 'wrong-ticket', title: 'Wrong ticket', serviceOpener: 'This ticket is for the wrong zone. You need a different one.', goal: 'Find out what you need and fix it.',
      phrases: ['I didn’t know that.', 'Which ticket do I need?', 'How much more is it?', 'Can I change it here?'] },
    { id: 'heavy-bags', title: 'Too many bags', serviceOpener: 'That’s a lot of luggage. The bus might be very full.', goal: 'Ask about an easier way with lots of bags and a small child.',
      phrases: ['We have a lot of luggage.', 'Is there a lift / more space?', 'Is there something easier with a child?', 'How much would that cost?'],
      fits: (c) => /family|toddler/.test(c.persona) },
  ],
  hotel: [
    { id: 'lost-booking', title: 'Lost booking', serviceOpener: 'I’m sorry, I can’t find your booking anywhere.', goal: 'Prove you booked and get a room tonight.',
      phrases: ['I booked it on ___.', 'Here is my confirmation email.', 'Could you check again, please?', 'Do you have any free rooms?'] },
    { id: 'room-not-ready', title: 'Room not ready', serviceOpener: 'Your room won’t be ready until four o’clock.', goal: 'Find a solution until the room is ready.',
      phrases: ['Can I leave my bags here?', 'Is there somewhere I can wait?', 'Could you call me when it’s ready?', 'Is there a café nearby?'] },
    { id: 'noisy-room', title: 'Noisy room', serviceOpener: 'Hello, front desk. How can I help?', goal: 'Complain that your room is next to a noisy lift and ask to move.',
      phrases: ['I’m sorry to bother you, but ___.', 'My room is very noisy.', 'Could I change rooms, please?', 'Is there a quieter room?'],
      fits: (c) => /retired|honeymoon/.test(c.persona) },
    { id: 'no-cot', title: 'No cot for the baby', serviceOpener: 'Your room is a standard double. There is no cot.', goal: 'Ask for what your family needs.',
      phrases: ['We’re travelling with a toddler.', 'Do you have a cot / a bigger room?', 'Is there an extra charge?', 'That would be great, thank you.'],
      fits: (c) => /family|toddler/.test(c.persona) },
    { id: 'wifi', title: 'No Wi-Fi', serviceOpener: 'Yes? Is there a problem with the room?', goal: 'Explain the Wi-Fi doesn’t work and you need it.',
      phrases: ['The Wi-Fi isn’t working.', 'I need it for ___.', 'Could someone fix it?', 'Is there anywhere else I can work?'] },
  ],
  meal: [
    { id: 'peanuts', title: 'It has peanuts', serviceOpener: 'Here’s your dish. It has a lovely peanut sauce.', goal: 'Explain your allergy and get something safe.',
      phrases: ['Sorry, I’m allergic to nuts.', 'Does it have nuts in it?', 'Could I have something without nuts?', 'What would you recommend?'],
      fits: (c) => c.food === 'nut allergy' },
    { id: 'meat', title: 'There’s meat in it', serviceOpener: 'Here you are. Enjoy!', goal: 'Explain politely that you ordered a vegetarian dish and there is meat in it.',
      phrases: ['Excuse me, I think there’s meat in this.', 'I’m vegetarian.', 'Could you change it, please?', 'Which dishes are vegetarian?'],
      fits: (c) => c.food === 'vegetarian' },
    { id: 'too-spicy', title: 'Too spicy!', serviceOpener: 'How is everything?', goal: 'Say the food is too spicy and ask for help.',
      phrases: ['It’s a bit too spicy for me.', 'Could I have some water?', 'Is there something milder?', 'It tastes great, but ___.'],
      fits: (c) => c.food === 'picky eater' },
    { id: 'wrong-dish', title: 'Wrong dish', serviceOpener: 'Here’s your order.', goal: 'Explain that this isn’t what you ordered.',
      phrases: ['Sorry, I didn’t order this.', 'I ordered the ___.', 'No problem, I can wait.', 'Could you check, please?'] },
    { id: 'bill-wrong', title: 'Wrong bill', serviceOpener: 'Here’s your bill.', goal: 'Point out a mistake on the bill.',
      phrases: ['Sorry, I think there’s a mistake.', 'We didn’t have the ___.', 'Could you check it, please?', 'Can we pay separately?'] },
  ],
};

/**
 * The problem for one traveller's Take 2. Card-fitting problems first, then rotate by turn so
 * consecutive pairs get different problems.
 */
export function pickTripProblem(stop: ProblemStop, card: TravellerCard | undefined, turnIndex: number): TripProblem {
  const all = PROBLEMS[stop];
  const fitting = card ? all.filter((p) => p.fits?.(card)) : [];
  if (fitting.length) return fitting[turnIndex % fitting.length];
  const general = all.filter((p) => !p.fits);
  return general[turnIndex % general.length];
}

export function tripProblems(stop: ProblemStop): TripProblem[] {
  return PROBLEMS[stop];
}
