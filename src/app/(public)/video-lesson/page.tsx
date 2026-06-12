import type { Metadata } from 'next';
import { getCachedContent } from '@/lib/content-cache';
import { VideoLessonClient } from './VideoLessonClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lessoncaptain.com';

const BASE_TITLE = 'Turn any YouTube video into a live English lesson | LessonCaptain';
const BASE_DESCRIPTION =
  'Paste a YouTube link and watch a complete ESL lesson preview build itself — suggested level, key vocabulary, comprehension questions, and discussion prompts. Free to try, no sign-up.';

// Dynamic per-video OG card when a shared ?v= resolves to a cached preview (CACHE ONLY —
// never trigger generation here). Otherwise the route renders the default card.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const v = typeof searchParams.v === 'string' ? searchParams.v : undefined;

  let ogImage = `${SITE_URL}/api/og/video-lesson`;
  let title: string | null = null;

  if (v) {
    const cached = await getCachedContent('video-lesson-preview', v, 'Intermediate').catch(() => null);
    title = (cached?.content_json as { title?: string } | undefined)?.title ?? null;
    if (title) {
      ogImage = `${SITE_URL}/api/og/video-lesson?v=${encodeURIComponent(v)}&title=${encodeURIComponent(title)}`;
    }
  }

  const ogTitle = title ? `${title} — a live English lesson` : 'Turn any YouTube video into a live English lesson';
  const canonical = v ? `${SITE_URL}/video-lesson?v=${v}` : `${SITE_URL}/video-lesson`;

  return {
    title: BASE_TITLE,
    description: BASE_DESCRIPTION,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description:
        'Paste a YouTube link and watch a complete ESL lesson preview build itself — vocabulary, comprehension, and discussion.',
      url: canonical,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      images: [ogImage],
    },
  };
}

export default function VideoLessonPage() {
  return <VideoLessonClient />;
}
