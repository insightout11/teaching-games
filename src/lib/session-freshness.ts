export const SESSION_MAX_AGE_HOURS = 12;

/**
 * Sessions never expire in the DB, so treat any session older than
 * SESSION_MAX_AGE_HOURS as inactive at read time. A forgotten active
 * session would otherwise be a permanently open anonymous write endpoint.
 */
export function isSessionStale(startedAt: string | null): boolean {
  if (!startedAt) return false;
  return Date.now() - new Date(startedAt).getTime() > SESSION_MAX_AGE_HOURS * 60 * 60 * 1000;
}
