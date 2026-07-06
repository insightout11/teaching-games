import { describe, it, expect } from 'vitest';
import { validateTripScript, applyTripTokens, type TripExchangeLine } from './trip-script';

const good: TripExchangeLine[] = [
  { speaker: 'service', text: 'Welcome to {city}. Are you ready to order?' },
  { speaker: 'traveller', text: "Yes — I'd like the {dish}, please." },
  { speaker: 'service', text: 'Good choice. Anything to drink?' },
  { speaker: 'traveller', text: '___, please.', hint: 'water, juice…' },
];

describe('validateTripScript', () => {
  it('accepts a well-formed script with the required token and a blank', () => {
    expect(validateTripScript(good, 'meal')).not.toBeNull();
  });

  it('rejects a script missing the required stop token', () => {
    const noDish = good.map((l) => ({ ...l, text: l.text.replace('{dish}', 'the fish') }));
    expect(validateTripScript(noDish, 'meal')).toBeNull();
  });

  it('rejects a script with no student blank', () => {
    const noBlank = good.map((l) => ({ ...l, text: l.text.replace('___', 'water') }));
    expect(validateTripScript(noBlank, 'meal')).toBeNull();
  });

  it('rejects a script that does not start with the service speaker', () => {
    expect(validateTripScript([...good].reverse(), 'meal')).toBeNull();
  });

  it('rejects more than two consecutive lines from the same speaker', () => {
    const run: TripExchangeLine[] = [
      { speaker: 'service', text: 'One about {dish}.' },
      { speaker: 'traveller', text: 'Two ___.' },
      { speaker: 'traveller', text: 'Three.' },
      { speaker: 'traveller', text: 'Four.' },
    ];
    expect(validateTripScript(run, 'meal')).toBeNull();
  });

  it('rejects too-short scripts and non-arrays', () => {
    expect(validateTripScript(good.slice(0, 2), 'meal')).toBeNull();
    expect(validateTripScript('nope', 'meal')).toBeNull();
  });

  it('has no required token for arrival', () => {
    const arrival: TripExchangeLine[] = [
      { speaker: 'service', text: 'Welcome to {city}. Passport, please.' },
      { speaker: 'traveller', text: 'Here you are.' },
      { speaker: 'service', text: 'How long are you staying?' },
      { speaker: 'traveller', text: 'For ___ days.', hint: 'a number' },
    ];
    expect(validateTripScript(arrival, 'arrival')).not.toBeNull();
  });
});

describe('applyTripTokens', () => {
  it('substitutes known tokens and turns unknown tokens into blanks', () => {
    const out = applyTripTokens(
      [{ speaker: 'traveller', text: 'The {dish} in {city}, and a {mystery}.' }],
      { dish: 'coddle', city: 'Dublin' },
    );
    expect(out[0].text).toBe('The coddle in Dublin, and a ___.');
  });
});
