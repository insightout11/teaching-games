'use client';

/** Colour audit (owner, 27 Oct 2026): neon families today vs proposed poster tones, as swatches and a sample card. */
const FAMILIES: Array<{ name: string; uses: string; now: string[]; poster: string[] }> = [
  { name: 'cyan', uses: '~800 uses (links, highlights, phone accents)', now: ['#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2'], poster: ['#cfe3ee', '#a9cde0', '#7fb3d1', '#5b97ba', '#44799c'] },
  { name: 'emerald', uses: '~840 uses (correct, success, done)', now: ['#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669'], poster: ['#d3e6cf', '#b2d4ab', '#8dbd86', '#6c9f66', '#557f50'] },
  { name: 'rose', uses: '~310 uses (wrong, alerts)', now: ['#fecdd3', '#fda4af', '#fb7185', '#f43f5e', '#e11d48'], poster: ['#f3cdc4', '#eeb0a3', '#e08e7d', '#cf6f5d', '#b45a4a'] },
  { name: 'violet', uses: '~260 uses (special, rare)', now: ['#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed'], poster: ['#e2ddf2', '#c7bfe6', '#a99ddb', '#8c7fc6', '#7366ad'] },
  { name: 'success / danger', uses: 'theme colours', now: ['#2FE59B', '#FF4D4D'], poster: ['#8dbd86', '#e06a5a'] },
];

function Card({ c }: { c: { accent: string; good: string; bad: string } }) {
  return (
    <div className="space-y-2 rounded-2xl border border-white/10 bg-[#121a2e] p-4 text-white">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: c.accent }}>Class vote</p>
      <p className="font-display text-lg">Where should we fly next?</p>
      <div className="rounded-xl border p-2 text-sm" style={{ borderColor: c.accent }}>Tokyo <span style={{ color: c.accent }}>· 4 votes</span></div>
      <p className="text-sm" style={{ color: c.good }}>Correct! Great answer.</p>
      <p className="text-sm" style={{ color: c.bad }}>Not quite. Try again.</p>
      <button type="button" className="w-full rounded-xl py-2 text-sm font-semibold text-[#0b1220]" style={{ background: c.accent }}>Vote</button>
    </div>
  );
}

export function PalettePreview() {
  return (
    <main className="min-h-screen space-y-6 bg-[#0b1220] p-6 text-white">
      <h1 className="font-display text-2xl">Colour audit: today vs poster tones</h1>
      {FAMILIES.map((f) => (
        <section key={f.name} className="space-y-1">
          <p className="text-sm"><b>{f.name}</b> <span className="text-white/50">{f.uses}</span></p>
          {(['now', 'poster'] as const).map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span className="w-14 text-xs text-white/60">{k === 'now' ? 'Today' : 'Poster'}</span>
              {f[k].map((h) => <span key={h} className="h-8 w-14 rounded-md" style={{ background: h }} title={h} />)}
            </div>
          ))}
        </section>
      ))}
      <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
        <div><p className="mb-1 text-sm text-white/60">Today</p><Card c={{ accent: '#22d3ee', good: '#34d399', bad: '#fb7185' }} /></div>
        <div><p className="mb-1 text-sm text-white/60">Poster tones</p><Card c={{ accent: '#7fb3d1', good: '#8dbd86', bad: '#e08e7d' }} /></div>
      </div>
    </main>
  );
}
