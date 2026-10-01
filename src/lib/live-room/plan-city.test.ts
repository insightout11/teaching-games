import { describe, expect, it } from 'vitest';
import { findPlanCity } from './plan-city';

const cities = [
  { id: 'tokyo', city: 'Tokyo', country: 'Japan' },
  { id: 'osaka', city: 'Osaka', country: 'Japan' },
  { id: 'paris', city: 'Paris', country: 'France' },
  { id: 'rome', city: 'Rome', country: 'Italy' },
];

describe('findPlanCity', () => {
  it('finds a city named in the plan', () => {
    expect(findPlanCity('Travel English: ordering food in Paris', cities)?.id).toBe('paris');
  });
  it('falls back to a country, and prefers a city when both appear', () => {
    expect(findPlanCity('Festivals of Japan', cities)?.id).toBe('tokyo');
    expect(findPlanCity('A weekend in Osaka, Japan', cities)?.id).toBe('osaka');
  });
  it('matches whole words only and returns null when nothing fits', () => {
    expect(findPlanCity('Romeo and Juliet', cities)).toBeNull();
    expect(findPlanCity('Should cities ban cars?', cities)).toBeNull();
  });
});
