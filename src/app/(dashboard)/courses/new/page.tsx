import { CourseBuilder } from '@/components/course/course-builder';

export default function NewCoursePage({ searchParams }: { searchParams: { preset?: string } }) {
  return <CourseBuilder initialPresetId={searchParams.preset} />;
}
