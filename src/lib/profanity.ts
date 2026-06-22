// Lightweight profanity gate for short, free-text student submissions (e.g. Word Cloud).
// Intentionally conservative: it catches obvious entries by exact token match (so
// "f u c k" / "f.u.c.k" collapse and match) without substring matching, which avoids
// false positives like "class" → "ass" or "peacock" → "cock". Deliberate obfuscation
// ("fuuuck", "fuckface") is left for the teacher's tap-to-remove.

const BLOCKED = new Set<string>([
  'fuck', 'fucker', 'fucking', 'motherfucker', 'shit', 'bullshit', 'bitch', 'bastard',
  'asshole', 'dick', 'dickhead', 'cock', 'pussy', 'cunt', 'slut', 'whore', 'piss',
  'wank', 'wanker', 'twat', 'bollocks', 'prick', 'nigger', 'nigga', 'faggot', 'fag',
  'retard', 'retarded', 'spastic', 'coon', 'chink', 'kike', 'tranny',
]);

/**
 * Returns true when the text is an obvious profanity/slur entry.
 * Tokenizes on non-letters, then checks each token — and the de-spaced whole —
 * against the blocklist by exact match.
 */
export function isProfane(text: string): boolean {
  const tokens = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (tokens.length === 0) return false;
  if (BLOCKED.has(tokens.join(''))) return true; // "f u c k" -> "fuck"
  return tokens.some((token) => BLOCKED.has(token));
}
