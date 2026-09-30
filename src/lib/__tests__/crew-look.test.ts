import { describe, expect, it } from 'vitest';
import { encodeLook, isCrewLookSeed, lookFromName, resolveLook, type CrewLook } from '@/lib/crew-look';
import { resolveAvatarSeed } from '@/lib/avatar-options';

const look: CrewLook = { skin: 5, hair: 'braids', hairColor: 3, headgear: 'hijab', gearColor: 'violet', eyewear: 'glasses', shirt: 7 };

describe('crew look codes', () => {
  it('round-trips and fits the 32-char avatar_seed limit', () => {
    const code = encodeLook(look);
    expect(isCrewLookSeed(code)).toBe(true);
    expect(code.length).toBeLessThanOrEqual(32);
    expect(resolveLook(code)).toEqual(look);
  });

  it('turns old captain caps into a captain character with aviators', () => {
    const l = resolveLook('captain-amber', 'Maya');
    expect(l.headgear).toBe('captain');
    expect(l.eyewear).toBe('aviators');
    expect(l.gearColor).toBe('amber');
  });

  it('turns old flight helmets into a helmet character of that colour', () => {
    const l = resolveLook('teal', 'Leo');
    expect(l.headgear).toBe('helmet');
    expect(l.gearColor).toBe('teal');
  });

  it('gives a stable look from a name when there is no seed', () => {
    expect(resolveLook(null, 'Ana')).toEqual(lookFromName('Ana'));
    expect(resolveLook(null, 'Ana')).toEqual(resolveLook(undefined, 'Ana'));
  });

  it('survives the join-time seed check', () => {
    const code = encodeLook(look);
    expect(resolveAvatarSeed(code, 'X')).toBe(code);
  });

  it('never crashes on junk codes', () => {
    expect(() => resolveLook('c1-zzzzzzz', 'A')).not.toThrow();
    expect(() => resolveLook('c1-12', 'A')).not.toThrow();
  });
});
