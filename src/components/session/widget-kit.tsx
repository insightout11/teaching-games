'use client';

import type { ReactNode, InputHTMLAttributes, ButtonHTMLAttributes } from 'react';

/**
 * The shared look for every widget: cockpit instruments.
 * Colour meanings (same everywhere):
 *   amber   = live / needs attention      cyan    = information
 *   violet  = AI                          rose    = votes, dots, pins
 *   emerald = done / correct
 * Mono uppercase labels, a display font for readouts, pill buttons. All pieces
 * stay readable in Glass mode (they carry their own translucent backgrounds).
 */
export type KitTone = 'amber' | 'cyan' | 'violet' | 'rose' | 'emerald' | 'plain';

const TONES: Record<KitTone, { border: string; text: string; bg: string; solid: string }> = {
  amber: { border: 'border-amber-300/50', text: 'text-amber-100', bg: 'bg-amber-300/12', solid: 'bg-amber-300 text-[#1a1204]' },
  cyan: { border: 'border-cyan-300/45', text: 'text-cyan-100', bg: 'bg-cyan-300/10', solid: 'bg-cyan-300 text-[#04161a]' },
  violet: { border: 'border-violet-300/45', text: 'text-violet-100', bg: 'bg-violet-300/10', solid: 'bg-violet-300 text-[#150a26]' },
  rose: { border: 'border-rose-300/45', text: 'text-rose-100', bg: 'bg-rose-300/10', solid: 'bg-rose-400 text-white' },
  emerald: { border: 'border-emerald-300/45', text: 'text-emerald-100', bg: 'bg-emerald-300/10', solid: 'bg-emerald-300 text-[#04200f]' },
  plain: { border: 'border-white/15', text: 'text-white/80', bg: 'bg-white/[0.04]', solid: 'bg-white text-[#0b1220]' },
};
export const kitTone = (t: KitTone) => TONES[t];

/** Mono uppercase label, e.g. "OPTIONS". */
export function KitLabel({ children, tone = 'plain', className = '' }: { children: ReactNode; tone?: KitTone; className?: string }) {
  const color = tone === 'plain' ? 'text-white/45' : TONES[tone].text;
  return <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.16em] ${color} ${className}`}>{children}</p>;
}

/** Big display readout (a question, a time, a word). */
export function KitReadout({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`font-display text-xl leading-snug text-white [text-shadow:0_1px_8px_rgba(0,0,0,.35)] ${className}`}>{children}</p>;
}

/** Draft / Live / Closed pill with an optional count. */
export function KitStatus({ state, count, countLabel }: { state: 'draft' | 'live' | 'closed'; count?: number; countLabel?: string }) {
  const map = {
    draft: { label: 'Draft', cls: 'border-white/20 text-white/60' },
    live: { label: 'Live', cls: 'border-amber-300/60 bg-amber-300/12 text-amber-100' },
    closed: { label: 'Closed', cls: 'border-emerald-300/45 bg-emerald-300/10 text-emerald-100' },
  }[state];
  return (
    <span className="flex items-center gap-2">
      <span className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${map.cls}`}>
        {state === 'live' && <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />}
        {map.label}
      </span>
      {count !== undefined && <span className="font-mono text-[11px] text-white/55">{count} {countLabel}</span>}
    </span>
  );
}

/** Pill button. `solid` for the one main action. */
export function KitButton({ tone = 'plain', solid = false, icon, children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: KitTone; solid?: boolean; icon?: ReactNode }) {
  const t = TONES[tone];
  const look = solid ? `${t.solid} border-transparent font-semibold hover:brightness-105` : `${t.border} ${t.text} ${t.bg} hover:brightness-125`;
  return (
    <button type="button" {...rest} className={`flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-40 ${look} ${className}`}>
      {icon}
      {children}
    </button>
  );
}

/** Small selectable chip (presets, types). */
export function KitChip({ on = false, tone = 'cyan', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean; tone?: KitTone }) {
  const t = TONES[tone];
  return (
    <button type="button" {...rest} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${on ? `${t.border} ${t.bg} ${t.text}` : 'border-white/12 text-white/55 hover:text-white'}`}>
      {children}
    </button>
  );
}

/** Text input in the kit style. */
export function KitInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-cyan-300/60 focus:outline-none ${props.className ?? ''}`}
    />
  );
}

/** A section with a label, used to stack a widget's parts. */
export function KitSection({ label, tone, right, children }: { label?: string; tone?: KitTone; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-2">
      {(label || right) && (
        <div className="flex items-center justify-between gap-2">
          {label ? <KitLabel tone={tone}>{label}</KitLabel> : <span />}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}
