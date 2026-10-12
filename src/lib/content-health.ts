import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Content health: what went wrong while a lesson's content was being made, so real lessons report their own bugs.
 * SERVER ONLY (uses Node's async context). A request collects its issues here; the route returns them with the
 * response and the lesson screen sends them to analytics (see content-health-client.ts), where each one arrives
 * with the activity, the topic and the level.
 *
 *  - ai_error  the AI call failed (timeout, provider error, unusable JSON)
 *  - rejected  the AI answered, but the answer failed our own checks and was thrown away
 *  - stand_in  the class was given stand-in content instead of what the AI should have written
 */
export interface ContentIssue {
  kind: 'ai_error' | 'rejected' | 'stand_in';
  activity?: string;
  reason: string;
}

const store = new AsyncLocalStorage<ContentIssue[]>();

/** Run `fn` and collect every issue noted while it runs (including inside the generators it calls). */
export async function collectContentIssues<T>(fn: () => Promise<T>): Promise<{ result: T; issues: ContentIssue[] }> {
  const issues: ContentIssue[] = [];
  const result = await store.run(issues, fn);
  return { result, issues };
}

/** Note an issue for the current request. Safe to call anywhere: outside a collected request it only logs. */
export function noteContentIssue(issue: ContentIssue): void {
  const clean: ContentIssue = { kind: issue.kind, ...(issue.activity ? { activity: issue.activity } : {}), reason: issue.reason.slice(0, 200) };
  console.warn(`[content-health] ${clean.kind}${clean.activity ? ` · ${clean.activity}` : ''} · ${clean.reason}`);
  const issues = store.getStore();
  if (issues && issues.length < 20) issues.push(clean);
}
