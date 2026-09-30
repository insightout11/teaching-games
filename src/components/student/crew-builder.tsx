'use client';

import { useMemo, type ReactNode } from 'react';
import { Shuffle } from 'lucide-react';
import { CrewCharacter } from '@/components/ui/crew-character';
import {
  EYEWEAR,
  GEAR_COLORS,
  GEAR_COLOR_KEYS,
  HAIR_COLORS,
  HAIR_STYLES,
  HEADGEAR,
  HEADGEAR_LABEL,
  SHIRT_COLORS,
  SKIN_TONES,
  encodeLook,
  resolveLook,
  type CrewLook,
} from '@/lib/crew-look';

const MONO = 'font-instrument text-[10px] uppercase tracking-[0.18em] text-lc-text3';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className={`${MONO} mb-1.5`}>{label}</p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">{children}</div>
    </div>
  );
}

function Swatch({ color, active, onClick, label }: { color: string; active: boolean; onClick: () => void; label: string }) {
  const bg = color === 'rainbow' ? 'linear-gradient(90deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#8b5cf6)' : color;
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`h-9 w-9 shrink-0 rounded-full border-2 transition-transform ${active ? 'scale-110 border-amber-300' : 'border-white/20'}`}
      style={{ background: bg }}
    />
  );
}

/**
 * Passport photo: build a crew character in a few taps. Emits the look code
 * (stored in avatar_seed). Tiles show the real character so kids see the result.
 */
export function CrewBuilder({ seed, name, onChange }: { seed: string; name: string; onChange: (seed: string) => void }) {
  const look = useMemo(() => resolveLook(seed, name), [seed, name]);
  const set = (patch: Partial<CrewLook>) => onChange(encodeLook({ ...look, ...patch }));
  const shuffle = () => {
    const r = (n: number) => Math.floor(Math.random() * n);
    onChange(encodeLook({
      skin: r(SKIN_TONES.length),
      hair: HAIR_STYLES[r(HAIR_STYLES.length)],
      hairColor: r(HAIR_COLORS.length),
      headgear: HEADGEAR[r(HEADGEAR.length)],
      gearColor: GEAR_COLOR_KEYS[r(GEAR_COLOR_KEYS.length)],
      eyewear: EYEWEAR[r(EYEWEAR.length)],
      shirt: r(SHIRT_COLORS.length),
    }));
  };
  const hatHidesHair = look.headgear === 'hijab';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-[#101A2E] p-2">
          <CrewCharacter look={look} size={96} title="Your passport photo" />
        </div>
        <div className="space-y-2">
          <p className="font-display text-xl leading-tight text-white">Your crew look</p>
          <button type="button" onClick={shuffle} className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-lc-text2 hover:text-white">
            <Shuffle className="h-4 w-4" /> Surprise me
          </button>
        </div>
      </div>

      <Row label="Skin">
        {SKIN_TONES.map((c, i) => (
          <Swatch key={c} color={c} label={`Skin tone ${i + 1}`} active={look.skin === i} onClick={() => set({ skin: i })} />
        ))}
      </Row>

      <Row label="Headgear">
        {HEADGEAR.map((h) => (
          <button
            key={h}
            type="button"
            aria-pressed={look.headgear === h}
            onClick={() => set({ headgear: h })}
            className={`flex shrink-0 flex-col items-center rounded-xl p-1 ${look.headgear === h ? 'bg-amber-400/15 ring-2 ring-amber-300' : 'bg-white/5'}`}
          >
            <CrewCharacter look={{ ...look, headgear: h }} size={52} />
            <span className="text-[10px] text-lc-text2">{HEADGEAR_LABEL[h]}</span>
          </button>
        ))}
      </Row>

      {look.headgear !== 'none' && (
        <Row label={`${HEADGEAR_LABEL[look.headgear]} colour`}>
          {GEAR_COLOR_KEYS.map((k) => (
            <Swatch key={k} color={GEAR_COLORS[k]} label={k} active={look.gearColor === k} onClick={() => set({ gearColor: k })} />
          ))}
        </Row>
      )}

      <Row label="Eyewear">
        {EYEWEAR.map((e) => (
          <button
            key={e}
            type="button"
            aria-pressed={look.eyewear === e}
            onClick={() => set({ eyewear: e })}
            className={`flex shrink-0 flex-col items-center rounded-xl p-1 ${look.eyewear === e ? 'bg-amber-400/15 ring-2 ring-amber-300' : 'bg-white/5'}`}
          >
            <CrewCharacter look={{ ...look, eyewear: e }} size={52} />
            <span className="text-[10px] text-lc-text2">{e === 'none' ? 'None' : e === 'aviators' ? 'Aviators' : 'Glasses'}</span>
          </button>
        ))}
      </Row>

      {!hatHidesHair && (
        <>
          <Row label="Hair">
            {HAIR_STYLES.map((h) => (
              <button
                key={h}
                type="button"
                aria-pressed={look.hair === h}
                aria-label={`Hair: ${h}`}
                onClick={() => set({ hair: h })}
                className={`shrink-0 rounded-xl p-1 ${look.hair === h ? 'bg-amber-400/15 ring-2 ring-amber-300' : 'bg-white/5'}`}
              >
                <CrewCharacter look={{ ...look, hair: h, headgear: 'none', eyewear: 'none' }} size={52} />
              </button>
            ))}
          </Row>
          <Row label="Hair colour">
            {HAIR_COLORS.map((c, i) => (
              <Swatch key={c} color={c} label={`Hair colour ${i + 1}`} active={look.hairColor === i} onClick={() => set({ hairColor: i })} />
            ))}
          </Row>
        </>
      )}

      <Row label="Shirt">
        {SHIRT_COLORS.map((c, i) => (
          <Swatch key={c} color={c} label={`Shirt colour ${i + 1}`} active={look.shirt === i} onClick={() => set({ shirt: i })} />
        ))}
      </Row>
    </div>
  );
}
