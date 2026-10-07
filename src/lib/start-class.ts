'use client';

/**
 * Start a plan-free class session (the Live Room) through the server, so the lesson is counted against the free
 * monthly allowance (pricing option B). Returns the session id, or throws with a message the teacher can act on.
 */
export async function startClassSession(classId: string): Promise<string> {
  const res = await fetch('/api/session/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ classId }),
  });
  const data = (await res.json().catch(() => ({}))) as { sessionId?: string; error?: string; code?: string };
  if (!res.ok || !data.sessionId) {
    throw new Error(data.error ?? 'Could not start the class. Please try again.');
  }
  try { sessionStorage.removeItem('lessonPlanContent'); } catch { /* storage unavailable */ }
  return data.sessionId;
}
