export type PhraseState = 'new' | 'seen' | 'used' | 'mastered';

// Per-student Pocket Phrasebook progress, kept on the phone.
// new → seen (card opened) → used ("I used it!") → mastered (used in two classes).

export interface SessionWordProgress {
  seenAt?: number;
  usedAt?: number;
}
export type SessionProgress = Record<string, SessionWordProgress>;
/** word → session ids it was used in (across classes, this device). */
export type UsedHistory = Record<string, string[]>;

const sessionKey = (sessionId: string, clientId: string) => `lc-phrasebook:${sessionId}:${clientId}`;
const HISTORY_KEY = 'lc-phrasebook-used';
const norm = (word: string) => word.trim().toLowerCase();

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / full storage: progress just lives in memory this class
  }
}

export function loadProgress(sessionId: string, clientId: string): { progress: SessionProgress; history: UsedHistory } {
  return { progress: read(sessionKey(sessionId, clientId), {}), history: read(HISTORY_KEY, {}) };
}
export function saveProgress(sessionId: string, clientId: string, progress: SessionProgress, history: UsedHistory) {
  write(sessionKey(sessionId, clientId), progress);
  write(HISTORY_KEY, history);
}

export function markSeen(progress: SessionProgress, word: string, now = Date.now()): SessionProgress {
  const k = norm(word);
  if (progress[k]?.seenAt) return progress;
  return { ...progress, [k]: { ...progress[k], seenAt: now } };
}

export function markUsed(
  progress: SessionProgress,
  history: UsedHistory,
  word: string,
  sessionId: string,
  now = Date.now(),
): { progress: SessionProgress; history: UsedHistory } {
  const k = norm(word);
  const sessions = history[k] ?? [];
  return {
    progress: { ...progress, [k]: { seenAt: progress[k]?.seenAt ?? now, usedAt: progress[k]?.usedAt ?? now } },
    history: sessions.includes(sessionId) ? history : { ...history, [k]: [...sessions, sessionId].slice(-10) },
  };
}

export function phraseState(progress: SessionProgress, history: UsedHistory, word: string, sessionId: string): PhraseState {
  const k = norm(word);
  const sessions = history[k] ?? [];
  const usedHere = Boolean(progress[k]?.usedAt) || sessions.includes(sessionId);
  if (usedHere && sessions.length >= 2) return 'mastered';
  if (usedHere) return 'used';
  if (progress[k]?.seenAt) return 'seen';
  return 'new';
}

export function newWordCount(progress: SessionProgress, words: string[]): number {
  return words.filter((w) => !progress[norm(w)]?.seenAt).length;
}
