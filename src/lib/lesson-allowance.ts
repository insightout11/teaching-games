/**
 * Pricing option B (docs/pricing-options-oct-2026.md, owner decision Oct 7 2026): free teachers get 4 full lessons
 * every calendar month (UTC), every flight included. A lesson = a session started. Leftover credits from before still
 * count as extra lessons, used after the monthly ones. Pro and developers are unlimited.
 */
export const FREE_MONTHLY_LESSONS = 4;

/** Start of the current calendar month, UTC, as an ISO string. */
export function monthStartIso(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/** Free lessons left this month after `used` lessons. */
export function freeLessonsLeft(used: number): number {
  return Math.max(0, FREE_MONTHLY_LESSONS - Math.max(0, used));
}

/** Lessons a free teacher can still start: this month's free ones plus any leftover credits. */
export function lessonsAvailable(used: number, credits: number): number {
  return freeLessonsLeft(used) + Math.max(0, credits);
}

/** Minimal query shape shared by the server (service client) and the browser client. */
interface SessionsCounter {
  from: (table: 'sessions') => {
    select: (cols: string, opts: { count: 'exact'; head: true }) => {
      eq: (col: string, v: unknown) => {
        eq: (col: string, v: unknown) => {
          gte: (col: string, v: string) => PromiseLike<{ count: number | null; error: unknown }>;
        };
      };
    };
  };
}

/** Lessons (sessions) this teacher started this month, demo class excluded. */
export async function lessonsUsedThisMonth(client: unknown, teacherId: string, now = new Date()): Promise<number> {
  const { count, error } = await (client as SessionsCounter)
    .from('sessions')
    .select('id, classes!inner(teacher_id, is_demo)', { count: 'exact', head: true })
    .eq('classes.teacher_id', teacherId)
    .eq('classes.is_demo', false)
    .gte('started_at', monthStartIso(now));
  if (error) return 0; // fail open: never block a teacher because counting failed
  return count ?? 0;
}
