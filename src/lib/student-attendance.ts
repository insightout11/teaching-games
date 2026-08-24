export interface StoredStudentSession {
  clientId: string;
  studentId: string | null;
  displayName: string;
  avatarSeed?: string;
}

export interface StudentJoinPayload {
  sessionId: string;
  clientId: string;
  avatarSeed?: string;
  studentId?: string;
  newName?: string;
}

export interface StudentAttendanceResult {
  studentId: string | null;
  name: string;
}

type AttendanceResponse = Pick<Response, 'ok' | 'status' | 'json'>;
type AttendanceRequest = (input: RequestInfo | URL, init?: RequestInit) => Promise<AttendanceResponse>;

export function buildStudentRejoinPayload(
  sessionId: string,
  studentSession: StoredStudentSession,
): StudentJoinPayload {
  return {
    sessionId,
    clientId: studentSession.clientId,
    ...(studentSession.avatarSeed ? { avatarSeed: studentSession.avatarSeed } : {}),
    ...(studentSession.studentId
      ? { studentId: studentSession.studentId }
      : { newName: studentSession.displayName }),
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Confirm the attendance write before the student console claims a connection. */
export async function registerStudentAttendance(
  payload: StudentJoinPayload,
  options: {
    request?: AttendanceRequest;
    retryDelaysMs?: number[];
  } = {},
): Promise<StudentAttendanceResult> {
  const request = options.request ?? fetch;
  const retryDelaysMs = options.retryDelaysMs ?? [0, 500, 1_500];
  let lastStatus = 0;

  for (let attempt = 0; attempt < retryDelaysMs.length; attempt += 1) {
    if (retryDelaysMs[attempt] > 0) await wait(retryDelaysMs[attempt]);

    try {
      const response = await request('/api/student/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      lastStatus = response.status;

      if (response.ok) {
        const data = await response.json() as { studentId?: string | null; name?: string };
        return {
          studentId: data.studentId ?? payload.studentId ?? null,
          name: data.name ?? payload.newName ?? 'Student',
        };
      }

      if (response.status > 0 && response.status < 500) break;
    } catch {
      // Network failures use the same bounded retry cadence.
    }
  }

  throw new Error(`Student attendance registration failed${lastStatus ? ` (${lastStatus})` : ''}`);
}
