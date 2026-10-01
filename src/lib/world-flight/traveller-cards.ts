/**
 * Travel v2: every student travels as someone. A Traveller Card = a persona, a budget tier and a
 * food need, plus one thing they want from the city. The card carries through the trip: choices
 * cost something (transport, hotel), the meal has a need to respect, and the postcard home is
 * told as this traveller. Budgets are price TIERS because the city data has no prices yet.
 */
export type BudgetTier = '$' | '$$' | '$$$';
export type FoodNeed = 'adventurous' | 'vegetarian' | 'nut allergy' | 'picky eater';

export interface TravellerCard {
  persona: string;     // e.g. "a student backpacker"
  budget: BudgetTier;
  food: FoodNeed;
  want: string;        // e.g. "see the city from somewhere high"
}

const PERSONAS: Array<Omit<TravellerCard, 'want'>> = [
  { persona: 'a student backpacker', budget: '$', food: 'adventurous' },
  { persona: 'a family with a toddler', budget: '$$', food: 'picky eater' },
  { persona: 'a food blogger', budget: '$$$', food: 'adventurous' },
  { persona: 'a business traveller', budget: '$$$', food: 'vegetarian' },
  { persona: 'a retired couple', budget: '$$', food: 'nut allergy' },
  { persona: 'a football fan', budget: '$', food: 'picky eater' },
  { persona: 'an art student', budget: '$', food: 'vegetarian' },
  { persona: 'a honeymooning couple', budget: '$$$', food: 'adventurous' },
];

const WANTS = [
  'see the city from somewhere high',
  'try a dish you have never eaten',
  'find a souvenir for your family',
  'visit a famous museum or landmark',
  'meet and talk to local people',
  'take the best photo of the trip',
  'find somewhere quiet to relax',
  'see something you can only see here',
];

export const BUDGET_LABEL: Record<BudgetTier, string> = { '$': 'tight budget', '$$': 'comfortable budget', '$$$': 'big budget' };

/** Deterministic shuffle (same session → same cards, so a refresh doesn't re-deal). */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}
function shuffled<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** One card per student (personas repeat only when the class is bigger than the deck). */
export function dealTravellerCards(students: Array<{ id: string }>, seed: string): Record<string, TravellerCard> {
  const rand = seeded(seed);
  const personas = shuffled(PERSONAS, rand);
  const wants = shuffled(WANTS, rand);
  const out: Record<string, TravellerCard> = {};
  students.forEach((s, i) => { out[s.id] = { ...personas[i % personas.length], want: wants[i % wants.length] }; });
  return out;
}

/** Rough price tier of a transport mode (the data has cost text, not comparable prices). */
export function transportTier(mode: string): BudgetTier {
  const m = mode.toLowerCase();
  if (/(taxi|private|limo|car service|uber|ride)/.test(m)) return '$$$';
  if (/(express|airport train|shuttle|ferry|coach)/.test(m)) return '$$';
  return '$';
}

/** Can this traveller afford an option of this tier? */
export function affordable(card: TravellerCard, tier: BudgetTier): boolean {
  return tier.length <= card.budget.length;
}
