export const CANONICAL_BETA_STATUSES = ['applied', 'signed_up', 'onboarded', 'activated', 'retained'] as const;
export type CanonicalBetaStatus = (typeof CANONICAL_BETA_STATUSES)[number];

export type BetaSessionCandidate = {
  id: string;
  classId: string;
  status: string;
  endedAt: string | null;
  startedAt: string;
};

export type BetaClassCandidate = {
  id: string;
  isDemo: boolean;
};

export type QualifyingLesson = {
  sessionId: string;
  occurredAt: string;
  participantCount: number;
};

export function selectQualifyingLessons(
  classes: BetaClassCandidate[],
  sessions: BetaSessionCandidate[],
  participantCounts: Map<string, number>
): QualifyingLesson[] {
  const realClassIds = new Set(classes.filter((item) => !item.isDemo).map((item) => item.id));
  const bySession = new Map<string, QualifyingLesson>();

  for (const session of sessions) {
    const participantCount = participantCounts.get(session.id) ?? 0;
    if (
      !realClassIds.has(session.classId) ||
      session.status !== 'ended' ||
      !session.endedAt ||
      participantCount < 1
    ) continue;

    bySession.set(session.id, {
      sessionId: session.id,
      occurredAt: session.endedAt,
      participantCount,
    });
  }

  return Array.from(bySession.values()).sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt) || a.sessionId.localeCompare(b.sessionId)
  );
}
export function lifecycleDates(lessons: QualifyingLesson[]) {
  const first = lessons[0] ?? null;
  const firstDate = first ? utcDate(first.occurredAt) : null;
  const retained = firstDate
    ? lessons.find((lesson) => utcDate(lesson.occurredAt) > firstDate)
    : null;

  return {
    activatedAt: first?.occurredAt ?? null,
    retainedAt: retained?.occurredAt ?? null,
    lastActivityAt: lessons.at(-1)?.occurredAt ?? null,
  };
}

export function reportedLifecycleStatus(storedStatus: string, lessons: QualifyingLesson[]): string {
  if (!CANONICAL_BETA_STATUSES.includes(storedStatus as CanonicalBetaStatus)) return storedStatus;
  const dates = lifecycleDates(lessons);
  const inferred: CanonicalBetaStatus = dates.retainedAt ? 'retained' : dates.activatedAt ? 'activated' : 'applied';
  return laterCanonicalStatus(storedStatus as CanonicalBetaStatus, inferred);
}

export function laterCanonicalStatus(a: CanonicalBetaStatus, b: CanonicalBetaStatus): CanonicalBetaStatus {
  return CANONICAL_BETA_STATUSES.indexOf(a) >= CANONICAL_BETA_STATUSES.indexOf(b) ? a : b;
}

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let text = Array.isArray(value) ? value.join('; ') : String(value);
  const significant = text.trimStart();
  const safeNegativeNumber = /^-\d+(?:\.\d+)?$/.test(significant);
  if (!safeNegativeNumber && /^[=+\-@\t\r]/.test(significant)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function utcDate(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}
