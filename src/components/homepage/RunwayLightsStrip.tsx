'use client';

// The warm bottom of the altitude descent: a golden runway-lights strip that sits
// directly above the final Test Flight CTA. Reuses the existing `.runway-edge-light`
// amber-pulse keyframe (globals.css) rather than redrawing it — each light just gets a
// staggered animationDelay so the row shimmers like runway edge lighting on approach.

const LIGHTS = 15;

export function RunwayLightsStrip() {
  return (
    <div
      aria-hidden
      className="relative h-20 w-full overflow-hidden"
    >
      {/* Warm horizon glow rising from the runway */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0.05) 40%, transparent 75%)',
        }}
      />
      {/* The lights row, converging slightly toward center for a runway feel */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-[3.5vw] px-8 sm:gap-10">
        {Array.from({ length: LIGHTS }).map((_, i) => {
          const fromCenter = Math.abs(i - (LIGHTS - 1) / 2) / ((LIGHTS - 1) / 2);
          return (
            <span
              key={i}
              className="runway-edge-light block rounded-full bg-lc-amber"
              style={{
                width: 5,
                height: 5,
                // Edges sit lower + dimmer → subtle perspective toward the runway head.
                marginBottom: `${(1 - fromCenter) * 6}px`,
                opacity: 0.45 + (1 - fromCenter) * 0.4,
                boxShadow: '0 0 8px 2px rgba(245,158,11,0.7)',
                animationDelay: `${i * 0.09}s`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
