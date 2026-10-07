/** Pages students (often children) use, or that are shared with families: analytics never loads there. */
const STUDENT_PREFIXES = ['/join', '/questions', '/debrief', '/journey', '/logbook'];

export function isStudentPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return STUDENT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
