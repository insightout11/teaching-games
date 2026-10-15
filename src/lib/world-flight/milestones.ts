/**
 * Distance milestones for the class's journey: a line on the route map ("12,400 km flown: about a third of the way
 * around the Earth") and a small celebration on the landing card when a flight passes one.
 */
export const EARTH_KM = 40075;
const MOON_KM = 384400;

export const MILESTONES: Array<{ km: number; text: string }> = [
  { km: 1000, text: '1,000 km flown' },
  { km: 5000, text: '5,000 km flown' },
  { km: 10000, text: '10,000 km: a quarter of the way around the Earth' },
  { km: 20000, text: '20,000 km: halfway around the Earth' },
  { km: EARTH_KM, text: 'Once around the whole Earth' },
  { km: EARTH_KM * 2, text: 'Twice around the Earth' },
  { km: 100000, text: '100,000 km flown' },
  { km: MOON_KM, text: 'As far as the Moon' },
];

/** The milestone a flight from `before` to `after` km passes (the biggest, if it passes several). */
export function milestonePassed(before: number, after: number): { km: number; text: string } | null {
  const passed = MILESTONES.filter((m) => before < m.km && after >= m.km);
  return passed.length ? passed[passed.length - 1] : null;
}

/** "about a third of the way around the Earth", for the route map line. */
export function aroundTheEarth(km: number): string {
  if (km <= 0) return '';
  if (km >= EARTH_KM) {
    const times = km / EARTH_KM;
    return times < 1.1 ? 'once around the Earth' : `${times.toFixed(1)} times around the Earth`;
  }
  const f = km / EARTH_KM;
  const words: Array<[number, string]> = [[0.08, 'a small step around the Earth'], [0.2, 'a tenth of the way around the Earth'], [0.3, 'a quarter of the way around the Earth'], [0.42, 'a third of the way around the Earth'], [0.6, 'halfway around the Earth'], [0.8, 'two thirds of the way around the Earth'], [1, 'almost all the way around the Earth']];
  return `about ${words.find(([max]) => f < max)?.[1] ?? 'all the way around the Earth'}`.replace('about a small step', 'a small step');
}
