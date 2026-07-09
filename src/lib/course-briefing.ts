import type { CourseLesson } from '@/lib/course';
import type { SourceMaterial, SourceType } from '@/types/source-material';

const VIDEO_SOURCE_TYPES = new Set<SourceType>([
  'youtube',
  'ted',
  'teded',
  'bbc',
  'kurzgesagt',
  'bbc-ideas',
  'bigthink',
  'vox',
  'kids',
  'natgeo',
  'crash-course',
  'travel-english',
  'world-flight',
  'business-english',
  'internet-memes',
  'minecraft',
  'sports',
]);

export interface CourseBriefingPreview {
  kind: 'video' | 'reading' | 'topic';
  label: string;
  title: string;
  preview: string;
  reviewTerms: string[];
}

function compact(text: string | undefined, limit: number): string {
  const cleaned = (text ?? '').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit - 1).trimEnd()}...`;
}

function sourceKind(source?: SourceMaterial): 'video' | 'reading' {
  return source && VIDEO_SOURCE_TYPES.has(source.sourceType) ? 'video' : 'reading';
}

export function getCourseBriefingPreview(lesson: CourseLesson): CourseBriefingPreview {
  const source = lesson.lessonPayload.sourceMaterial;
  const reviewTerms = lesson.lessonPayload.courseContext?.reviewTerms.slice(0, 5) ?? [];

  if (!source) {
    return {
      kind: 'topic',
      label: 'Topic grounded',
      title: lesson.lessonPayload.customTopic,
      preview: 'No library source attached. Activities generate from the lesson topic and course continuity.',
      reviewTerms,
    };
  }

  const kind = sourceKind(source);
  const briefingText = source.briefingText ?? source.rawText ?? source.summary;
  const preview = compact(briefingText, 180) || 'Source material will ground the briefing, vocabulary, checks, and discussion.';
  const label = kind === 'video'
    ? 'Video briefing'
    : source.briefingMode
      ? `Reading briefing (${source.briefingMode})`
      : 'Reading briefing';

  return {
    kind,
    label,
    title: source.title,
    preview,
    reviewTerms,
  };
}
