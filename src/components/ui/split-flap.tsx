import { B612_Mono } from 'next/font/google';

// Split-flap pieces shared by Home and the class pages (Oct 2026). B612 Mono is the typeface Airbus designed for
// cockpit screens.
export const flapFont = B612_Mono({ subsets: ['latin'], weight: ['400', '700'], display: 'swap' });
export const FLAP_FONT = flapFont.style.fontFamily;

/** The flip-in and status-light animations; render once per page that uses <Flaps>. */
export function FlapStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        @keyframes lc-flap-in { 0% { transform: rotateX(90deg); filter: brightness(1.8); } 60% { transform: rotateX(-12deg); } 100% { transform: rotateX(0); } }
        .lc-flap { animation: lc-flap-in 420ms cubic-bezier(.2,.7,.3,1) both; transform-origin: 50% 50%; font-family: ${FLAP_FONT}; }
        @keyframes lc-led { 50% { opacity: .25; } }
        .lc-led-blink { animation: lc-led 1.4s infinite; }
        @media (prefers-reduced-motion: reduce) { .lc-flap, .lc-led-blink { animation: none; } }
      `,
      }}
    />
  );
}

/** Split-flap letters: each tile flips down into place once, left to right. */
export function Flaps({ text, tone = 'cream', max = 14, size = 'md' }: { text: string; tone?: 'cream' | 'amber'; max?: number; size?: 'md' | 'lg' }) {
  const chars = text.toUpperCase().slice(0, max).split('');
  const box = size === 'lg' ? 'h-9 w-6 text-xl leading-9' : 'h-7 w-[18px] text-[15px] leading-7';
  return (
    <span className="inline-flex gap-[2px]" aria-label={text}>
      {chars.map((c, i) => (
        <span
          key={`${i}-${c}`}
          aria-hidden
          className={`lc-flap relative inline-block rounded-[3px] text-center font-bold ${box} ${tone === 'amber' ? 'text-amber-300' : 'text-[#fff4dc]'}`}
          style={{ animationDelay: `${i * 35}ms`, background: 'linear-gradient(#141b24 0 49%, #000 49% 51%, #19212b 51%)' }}
        >
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </span>
  );
}
