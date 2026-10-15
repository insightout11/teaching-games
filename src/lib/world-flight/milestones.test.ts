import { describe, expect, it } from 'vitest';
import { aroundTheEarth, milestonePassed } from './milestones';

describe('journey milestones', () => {
  it('names the milestone a flight passes, and only when it is passed', () => {
    expect(milestonePassed(9200, 10400)?.km).toBe(10000);
    expect(milestonePassed(10400, 11000)).toBeNull();
    expect(milestonePassed(800, 6000)?.km).toBe(5000);
  });
  it('describes the distance around the Earth', () => {
    expect(aroundTheEarth(13000)).toBe('about a third of the way around the Earth');
    expect(aroundTheEarth(41000)).toBe('once around the Earth');
    expect(aroundTheEarth(2000)).toBe('a small step around the Earth');
  });
});
