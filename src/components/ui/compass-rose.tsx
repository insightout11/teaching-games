'use client';

// Small fixed compass rose overlaid on city street maps (Find Your Way). The maps never
// rotate (north is always up), so a static rose gives the whole class one shared frame:
// the guide says "head north", every device means the same direction.
export function CompassRose({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none select-none rounded-full border border-white/15 bg-slate-950/80 shadow-lg backdrop-blur ${className}`}
      style={{ width: 64, height: 64 }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" className="h-full w-full">
        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth="1" />
        {/* needle */}
        <polygon points="32,12 36,32 32,30 28,32" fill="#f87171" />
        <polygon points="32,52 36,32 32,34 28,32" fill="#94a3b8" />
        {/* cardinal letters */}
        <text x="32" y="10" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fca5a5">N</text>
        <text x="57" y="35" textAnchor="middle" fontSize="8" fill="#cbd5e1">E</text>
        <text x="32" y="61" textAnchor="middle" fontSize="8" fill="#cbd5e1">S</text>
        <text x="7" y="35" textAnchor="middle" fontSize="8" fill="#cbd5e1">W</text>
      </svg>
    </div>
  );
}
