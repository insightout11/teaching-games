/**
 * Students give a first name or nickname only (docs/kids-privacy-review.md): no surnames are stored or shown.
 * "Mia" stays "Mia"; "Mia Kowalski" becomes "Mia K"; extra words are dropped; at most 20 characters.
 */
export function studentFirstName(raw: unknown): string {
  const words = String(raw ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (!words.length) return '';
  const first = words[0].slice(0, 20);
  const initial = words[1]?.match(/[A-Za-z0-9À-￿]/)?.[0];
  return initial ? `${first} ${initial.toUpperCase()}` : first;
}
