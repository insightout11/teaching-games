/**
 * Flight results in the class logbook (docs/logbook-flight-results-proposal.md). When a flight's
 * landing reveal shows, it saves ONE small record for the session: the flight, topic, city and
 * the class-level before → after. Class counts only, never names or individual answers.
 * Stored in session_private_state (key 'flight-result'), so no migration. Teacher-only display
 * (owner decision): the class page and the end summary, never the public share page.
 */
export interface FlightMeasure {
  label: string;
  before: { count: number; of: number } | null;
  after: { count: number; of: number };
}

export interface FlightResult {
  preset: string;
  /** "Speak", "Travel"… shown in the logbook line. */
  flight: string;
  topic: string;
  city?: string;
  focus?: string;
  /** The first measure leads (owner decision); the rest are detail. */
  measures: FlightMeasure[];
  phrases?: string[];
  savedAt: string;
}

export const FLIGHT_RESULT_KEY = 'flight-result';
export const FLIGHT_BEFORE_KEY = 'flight-before';

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const count = (v: unknown): { count: number; of: number } | null => {
  const r = v as { count?: unknown; of?: unknown } | null;
  if (!r || typeof r.count !== 'number' || typeof r.of !== 'number') return null;
  const of = Math.max(0, Math.min(500, Math.round(r.of)));
  return { count: Math.max(0, Math.min(of, Math.round(r.count))), of };
};

/** Server-side guard: keep only the known shape, bounded sizes, counts within range. */
export function sanitizeFlightResult(raw: unknown): FlightResult | null {
  const r = raw as Record<string, unknown> | null;
  if (!r || typeof r !== 'object') return null;
  const flight = clean(r.flight, 40);
  const preset = clean(r.preset, 60);
  const topic = clean(r.topic, 120);
  const measures: FlightMeasure[] = [];
  for (const m of Array.isArray(r.measures) ? r.measures : []) {
    const label = clean((m as Record<string, unknown>)?.label, 80);
    const after = count((m as Record<string, unknown>)?.after);
    if (!label || !after) continue;
    measures.push({ label, before: count((m as Record<string, unknown>)?.before), after });
    if (measures.length >= 3) break;
  }
  if (!flight || !preset || measures.length === 0) return null;
  const city = clean(r.city, 60);
  const focus = clean(r.focus, 160);
  const phrases = (Array.isArray(r.phrases) ? r.phrases : []).map((p) => clean(p, 60)).filter(Boolean).slice(0, 4);
  return { preset, flight, topic, ...(city ? { city } : {}), ...(focus ? { focus } : {}), measures, ...(phrases.length ? { phrases } : {}), savedAt: new Date().toISOString() };
}

/** "3 → 7 of 8" (counts, owner decision), or "7 of 8" with no before. */
export function formatMeasure(m: FlightMeasure): string {
  return m.before ? `${m.before.count} → ${m.after.count} of ${m.after.of}` : `${m.after.count} of ${m.after.of}`;
}

/** The logbook line: "Lisbon · Speak · Café · natural replies 3 → 7 of 8". */
export function flightResultLine(r: FlightResult): string {
  const lead = r.measures[0];
  return [r.city, r.flight, r.topic, lead ? `${lead.label.charAt(0).toLowerCase()}${lead.label.slice(1)} ${formatMeasure(lead)}` : null]
    .filter(Boolean)
    .join(' · ');
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Client: save to the flight-result route (fire-and-forget; a failed save never blocks the lesson). */
export function saveSessionRecord(sessionId: string | null | undefined, key: string, payload: unknown): void {
  if (!sessionId || !UUID_RE.test(sessionId)) return;
  void fetch('/api/session/flight-result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, key, result: payload }),
  }).catch(() => {});
}

/** Client: save this flight's before → after for the logbook. */
export function saveFlightResult(sessionId: string | null | undefined, result: Omit<FlightResult, 'savedAt'>): void {
  saveSessionRecord(sessionId, FLIGHT_RESULT_KEY, result);
}
