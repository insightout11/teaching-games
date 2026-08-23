import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { csvCell, lifecycleDates, reportedLifecycleStatus, selectQualifyingLessons } from '../src/lib/beta/lifecycle';
import { chunkValues, dedupeRows, paginateRows } from '../src/lib/beta/export-data';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const includeNotes = process.argv.includes('--include-notes');
const force = process.argv.includes('--force');
const outputArg = process.argv.find((arg) => arg.startsWith('--output='))?.slice('--output='.length);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = path.resolve(outputArg || `C:\\Users\\insig\\Documents\\Codex\\_outputs\\${stamp}-lessoncaptain-beta-participants.csv`);

const service = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
type Application = Record<string, unknown> & { teacher_id: string | null; status: string };
type ClassRow = { id: string; teacher_id: string; is_demo: boolean };
type SessionRow = { id: string; class_id: string; status: string; started_at: string; ended_at: string | null };
type ParticipantRow = { session_id: string };

async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message?: string } | null }>): Promise<T[]> {
  return paginateRows(async (from, to) => {
    const { data, error } = await build(from, to);
    if (error) throw error;
    return (data ?? []) as T[];
  });
}

async function fetchForIds<T>(
  ids: string[],
  build: (ids: string[], from: number, to: number) => PromiseLike<{ data: unknown; error: { message?: string } | null }>,
  key: (row: T) => string
): Promise<T[]> {
  const rows: T[] = [];
  for (const chunk of chunkValues(ids)) {
    rows.push(...await fetchAll<T>((from, to) => build(chunk, from, to)));
  }
  return dedupeRows(rows, key);
}

async function run() {
  const applicationColumns = [
    'applied_at', 'first_name', 'email', 'teaching_format', 'learner_levels',
    'learner_age_band', 'typical_class_size', 'teaching_platform', 'biggest_challenge',
    'landing_path', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'status', 'cohort_state', 'teacher_id', 'signed_up_at', 'onboarded_at', 'activated_at', 'retained_at',
    'last_activity_at', 'feedback_requested_at', 'testimonial_permission',
    'testimonial_requested_at', 'testimonial_received_at', 'classroom_use_confirmed_at',
    ...(includeNotes ? ['internal_notes'] : []),
  ];
  const typedApplications = await fetchAll<Application>((from, to) => service
    .from('beta_applications').select(`id,${applicationColumns.join(',')}`)
    .order('applied_at', { ascending: true }).order('id', { ascending: true }).range(from, to));
  const teacherIds = typedApplications.map((row) => row.teacher_id).filter(Boolean) as string[];
  const classRows = teacherIds.length ? await fetchForIds<ClassRow>(teacherIds,
    (ids, from, to) => service.from('classes').select('id, teacher_id, is_demo').in('teacher_id', ids).order('id').range(from, to),
    (row) => row.id) : [];
  const classIds = classRows.map((row) => row.id);
  const sessionRows = classIds.length ? await fetchForIds<SessionRow>(classIds,
    (ids, from, to) => service.from('sessions').select('id, class_id, status, started_at, ended_at').in('class_id', ids).order('id').range(from, to),
    (row) => row.id) : [];
  const sessionIds = sessionRows.map((row) => row.id);
  type ParticipantWithId = ParticipantRow & { id: string };
  const participantRows = sessionIds.length ? await fetchForIds<ParticipantWithId>(sessionIds,
    (ids, from, to) => service.from('session_participants').select('id, session_id').in('session_id', ids).order('id').range(from, to),
    (row) => row.id) : [];

  const participantCounts = new Map<string, number>();
  for (const row of participantRows) {
    participantCounts.set(row.session_id, (participantCounts.get(row.session_id) ?? 0) + 1);
  }

  const headers = [
    'application_date', 'first_name', 'email', 'teaching_format', 'learner_levels',
    'learner_age_band', 'typical_class_size', 'teaching_platform', 'biggest_challenge',
    'landing_path', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'stored_lifecycle_status', 'reported_lifecycle_status', 'cohort_state', 'signup_date', 'onboarded_date',
    'first_activation_candidate', 'most_recent_qualifying_session', 'qualifying_session_count',
    'participant_count_summary', 'classroom_use_confirmed_at', 'feedback_requested_at',
    'testimonial_permission', 'testimonial_requested_at', 'testimonial_received_at',
    ...(includeNotes ? ['internal_notes'] : []),
  ];

  const lines = [headers.map(csvCell).join(',')];
  for (const application of typedApplications) {
    const teacherClasses = classRows.filter((row) => row.teacher_id === application.teacher_id);
    const teacherClassIds = new Set(teacherClasses.map((row) => row.id));
    const teacherSessions = sessionRows.filter((row) => teacherClassIds.has(row.class_id));
    const lessons = selectQualifyingLessons(
      teacherClasses.map((row) => ({ id: row.id, isDemo: row.is_demo })),
      teacherSessions.map((row) => ({ id: row.id, classId: row.class_id, status: row.status, startedAt: row.started_at, endedAt: row.ended_at })),
      participantCounts
    );
    const dates = lifecycleDates(lessons);
    const participantSummary = lessons.length
      ? `${lessons.reduce((sum, lesson) => sum + lesson.participantCount, 0)} total; ${lessons.map((lesson) => lesson.participantCount).join('/')} per lesson`
      : '0 total';
    const values = [
      application.applied_at, application.first_name, application.email, application.teaching_format,
      application.learner_levels, application.learner_age_band, application.typical_class_size,
      application.teaching_platform, application.biggest_challenge, application.landing_path,
      application.referrer, application.utm_source, application.utm_medium, application.utm_campaign,
      application.utm_content, application.utm_term, application.status,
      reportedLifecycleStatus(application.status, lessons), application.cohort_state,
      application.signed_up_at, application.onboarded_at,
      dates.activatedAt, dates.lastActivityAt, lessons.length, participantSummary,
      application.classroom_use_confirmed_at, application.feedback_requested_at,
      application.testimonial_permission, application.testimonial_requested_at, application.testimonial_received_at,
      ...(includeNotes ? [application.internal_notes] : []),
    ];
    lines.push(values.map(csvCell).join(','));
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  if (!force) {
    try {
      await access(outputPath);
      throw new Error(`Output already exists: ${outputPath}. Pass --force to overwrite it.`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Output already exists:')) throw error;
      if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT') throw error;
    }
  }
  await writeFile(outputPath, `${lines.join('\r\n')}\r\n`, 'utf8');
  console.log(`Exported ${typedApplications.length} beta participant(s) to ${outputPath}`);
}

run().catch((error) => {
  console.error('Beta export failed:', error instanceof Error ? error.message : 'unknown error');
  process.exitCode = 1;
});
