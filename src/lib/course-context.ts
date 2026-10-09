import type { CourseOutlineLesson } from '@/lib/course';

export interface CourseLessonContext {
  courseTitle: string;
  courseTheme: string;
  lessonNumber: number;
  totalLessons: number;
  previousLessons: Array<{ title: string; topic: string }>;
  reviewTerms: string[];
  /** Course arc: the simple task done in the first lesson and repeated in the last. */
  arcTask?: string;
  arcRole?: 'baseline' | 'compare';
}

function normalizeTerm(term: string): string {
  return term.trim().toLowerCase().replace(/\s+/g, ' ');
}

function uniqueTerms(terms: string[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of terms) {
    const term = normalizeTerm(raw);
    if (!term || seen.has(term)) continue;
    seen.add(term);
    out.push(term);
    if (out.length >= limit) break;
  }
  return out;
}

export function buildCourseLessonContext(params: {
  courseTitle: string;
  courseTheme: string;
  lessons: CourseOutlineLesson[];
  index: number;
  arcTask?: string;
}): CourseLessonContext {
  const previousLessons = params.lessons.slice(0, params.index).map((lesson) => ({
    title: lesson.title,
    topic: lesson.topic,
  }));
  const reviewTerms = uniqueTerms(
    params.lessons
      .slice(0, params.index)
      .flatMap((lesson) => lesson.keywords ?? []),
    8,
  );

  return {
    courseTitle: params.courseTitle,
    courseTheme: params.courseTheme,
    lessonNumber: params.index + 1,
    totalLessons: params.lessons.length,
    previousLessons,
    reviewTerms,
    ...(params.arcTask && params.lessons[params.index]?.arcRole
      ? { arcTask: params.arcTask, arcRole: params.lessons[params.index].arcRole }
      : {}),
  };
}

export function buildCourseContinuityPrompt(context?: CourseLessonContext): string {
  if (!context) return '';

  const previous = context.previousLessons.length
    ? context.previousLessons
        .slice(-3)
        .map((lesson) => `- ${lesson.title}: ${lesson.topic}`)
        .join('\n')
    : '- This is the first lesson in the course.';
  const reviewTerms = context.reviewTerms.length ? context.reviewTerms.join(', ') : 'none yet';

  return `\nCourse continuity context:
Course: "${context.courseTitle}"
Theme: "${context.courseTheme}"
Lesson ${context.lessonNumber} of ${context.totalLessons}
Previous lessons:
${previous}
Review terms from earlier lessons: ${reviewTerms}
${context.arcTask && context.arcRole === 'baseline' ? `Course task: this lesson opens the course with a short task the class will repeat in the last lesson: "${context.arcTask}". Where the lesson has a warm-up or first speaking moment, use this task.
` : ''}${context.arcTask && context.arcRole === 'compare' ? `Course task: this is the last lesson. Where the lesson has a final speaking moment, repeat the task from lesson 1 so the class sees its progress: "${context.arcTask}".
` : ''}
Use this ONLY for continuity: briefly recycle prior vocabulary or connect ideas when natural. Do not change the current lesson topic, and if source material is provided, do not add facts that are not supported by that source.\n`;
}
