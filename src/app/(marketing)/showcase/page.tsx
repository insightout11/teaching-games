import type { Metadata } from 'next';
import { ShowcaseClient } from '@/components/homepage/ShowcaseClient';

export const metadata: Metadata = {
  title: 'Showcase — Games & Activities for Live ESL Lessons | LessonCaptain',
  description:
    'Browse the games and activities you can run live with LessonCaptain — speaking drills, vocabulary builders, review games, and full structured lessons for online ESL classes.',
  alternates: { canonical: '/showcase' },
};

export default function ShowcasePage() {
  return <ShowcaseClient />;
}
