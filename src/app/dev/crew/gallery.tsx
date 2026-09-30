'use client';

import { CrewCharacter } from '@/components/ui/crew-character';
import { HAIR_STYLES, HEADGEAR, SKIN_TONES, resolveLook, type CrewLook } from '@/lib/crew-look';

const base: CrewLook = { skin: 2, hair: 'short', hairColor: 1, headgear: 'captain', gearColor: 'amber', eyewear: 'aviators', shirt: 0 };

export function CrewGallery() {
  return (
    <div className="min-h-screen space-y-8 bg-lc-bg p-8 text-lc-text">
      <section>
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-amber-300">Headgear (with aviators)</p>
        <div className="flex flex-wrap gap-6">
          {HEADGEAR.map((h, i) => (
            <div key={h} className="text-center">
              <CrewCharacter look={{ ...base, headgear: h, gearColor: (['amber', 'teal', 'violet', 'pink', 'blue', 'green', 'violet'] as const)[i], skin: i + 1, eyewear: h === 'hijab' ? 'none' : base.eyewear }} size={120} />
              <p className="text-xs text-lc-text2">{h}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-amber-300">Hijab</p>
        <div className="flex flex-wrap gap-6">
          {(['violet', 'black', 'pink', 'teal', 'white', 'amber'] as const).map((c, i) => (
            <CrewCharacter key={c} look={{ ...base, headgear: 'hijab', gearColor: c, skin: (i * 3) % 8, eyewear: i === 2 ? 'glasses' : i === 4 ? 'aviators' : 'none', shirt: (i + 2) % 8 }} size={110} />
          ))}
        </div>
      </section>
      <section>
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-amber-300">Hair (no hat)</p>
        <div className="flex flex-wrap gap-6">
          {HAIR_STYLES.map((h, i) => (
            <div key={h} className="text-center">
              <CrewCharacter look={{ ...base, headgear: 'none', eyewear: i % 4 === 3 ? 'glasses' : 'none', hair: h, hairColor: i % 9, skin: i % SKIN_TONES.length, shirt: i % 8 }} size={110} />
              <p className="text-xs text-lc-text2">{h}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-amber-300">Old seeds converted · seat size (30px)</p>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#101A2E] p-4">
          {['captain-amber', 'captain-rainbow', 'teal', 'red', 'captain-black', 'navigator', 'white', 'captain-pink'].map((s, i) => (
            <div key={s} className="grid h-11 w-11 place-items-center rounded-[9px_9px_5px_5px] border border-emerald-300 bg-[#0a0f19]">
              <CrewCharacter look={resolveLook(s, `Student ${i}`)} size={30} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
