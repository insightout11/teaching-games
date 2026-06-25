'use client';

import { CourseDetail } from '@/components/course/course-detail';

export default function CoursePage({ params }: { params: { id: string } }) {
  return <CourseDetail courseId={params.id} />;
}
