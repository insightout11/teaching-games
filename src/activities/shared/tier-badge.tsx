/** Travel v2 price tier ($ / $$ / $$$), matched against each student's Traveller Card budget. */
export function TierBadge({ tier }: { tier: '$' | '$$' | '$$$' }) {
  const tone = tier === '$' ? 'border-emerald-400/40 text-emerald-200' : tier === '$$' ? 'border-amber-400/40 text-amber-200' : 'border-rose-400/40 text-rose-200';
  return <span className={`rounded-full border px-2 py-0.5 font-sans text-xs font-bold ${tone}`} aria-label={`price tier ${tier.length} of 3`}>{tier}</span>;
}
