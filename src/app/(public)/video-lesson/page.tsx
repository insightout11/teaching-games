import type { Metadata } from 'next';
import { VideoLessonClient } from './VideoLessonClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lessoncaptain.com';

export const metadata: Metadata = {
  title: 'Turn any YouTube video into a live English lesson | LessonCaptain',
  description:
    'Paste a YouTube link and watch a complete ESL lesson preview build itself — suggested level, key vocabulary, comprehension questions, and discussion prompts. Free to try, no sign-up.',
  alternates: { canonical: `${SITE_URL}/video-lesson` },
  openGraph: {
    title: 'Turn any YouTube video into a live English lesson',
    description:
      'Paste a YouTube link and watch a complete ESL lesson preview build itself — vocabulary, comprehension, and discussion.',
    url: `${SITE_URL}/video-lesson`,
    type: 'website',
  },
};

export default function VideoLessonPage() {
  return <VideoLessonClient />;
}
