// Crew Radio — the side channel. A second, non-interrupting lane to student
// devices: the cockpit pushes one optional prompt here and students answer it
// when they have a spare moment. It never touches the main task (input_spec).
//
// Storage: session_private_state key 'side-channel', payload { item } — the
// table is world-readable + realtime, and the student session API returns the
// current item on its normal 5s poll.

export const SIDE_CHANNEL_KEY = 'side-channel';

/** game_key stamped on side-channel text submissions so the cockpit can label them. */
export const SIDE_CHANNEL_GAME_KEY = 'crew-radio';

export type SideChannelKind = 'write' | 'choice';

export interface SideChannelQuote {
  text: string;
  name: string;
}

export interface SideChannelItem {
  id: string;
  kind: SideChannelKind;
  /** Short header, e.g. "Quick write" or "React to the Captain's Pick". */
  title: string;
  prompt: string;
  /** kind 'choice' only — 2-6 short options. */
  options?: string[];
  /** kind 'choice' only — votes go through the existing poll infrastructure. */
  pollId?: string;
  /** Optional quoted spotlight line the prompt refers to. */
  quote?: SideChannelQuote;
  maxLength?: number;
  createdAt: string;
}

export interface SideChannelDraft {
  kind: SideChannelKind;
  title: string;
  prompt: string;
  options?: string[];
  quote?: SideChannelQuote;
  maxLength?: number;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

/** Validate + bound a client-supplied draft. Returns null when unusable. */
export function sanitizeSideChannelDraft(raw: unknown): SideChannelDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const draft = raw as Record<string, unknown>;

  const kind = draft.kind === 'write' || draft.kind === 'choice' ? draft.kind : null;
  const title = cleanText(draft.title, 60);
  const prompt = cleanText(draft.prompt, 240);
  if (!kind || !prompt) return null;

  const options: string[] = [];
  if (kind === 'choice') {
    const seen = new Set<string>();
    for (const option of Array.isArray(draft.options) ? draft.options : []) {
      const value = cleanText(option, 42);
      const key = value.toLowerCase();
      if (!value || seen.has(key)) continue;
      seen.add(key);
      options.push(value);
      if (options.length >= 6) break;
    }
    if (options.length < 2) return null;
  }

  let quote: SideChannelQuote | undefined;
  if (draft.quote && typeof draft.quote === 'object') {
    const text = cleanText((draft.quote as Record<string, unknown>).text, 240);
    const name = cleanText((draft.quote as Record<string, unknown>).name, 50);
    if (text) quote = { text, name: name || 'A classmate' };
  }

  const maxLength = typeof draft.maxLength === 'number' && Number.isFinite(draft.maxLength)
    ? Math.min(Math.max(Math.round(draft.maxLength), 40), 500)
    : undefined;

  return {
    kind,
    title: title || (kind === 'choice' ? 'Class poll' : 'Quick write'),
    prompt,
    ...(options.length >= 2 ? { options } : {}),
    ...(quote ? { quote } : {}),
    ...(maxLength ? { maxLength } : {}),
  };
}
