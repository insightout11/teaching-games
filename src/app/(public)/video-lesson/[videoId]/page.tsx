import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Play, Youtube } from 'lucide-react';
import { DEMO_VIDEOS } from '@/lib/video-lesson-demos';
import { ProductVisualHero } from '@/components/landing/ProductVisualHero';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lessoncaptain.com';

function getVideo(videoId: string) {
  return DEMO_VIDEOS.find((video) => video.videoId === videoId);
}

export function generateStaticParams() {
  return DEMO_VIDEOS.map((video) => ({ videoId: video.videoId }));
}

export function generateMetadata({ params }: { params: { videoId: string } }): Metadata {
  const video = getVideo(params.videoId);
  if (!video) return { title: 'Video lesson not found' };

  const title = `ESL Lesson Plan for "${video.title}" | LessonCaptain`;
  const description =
    'Turn this YouTube video into a live ESL lesson with vocabulary, comprehension questions, discussion prompts, and student participation.';

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/video-lesson/${video.videoId}` },
    openGraph: {
      title,
      description,
      images: [`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`],
    },
  };
}

export default function VideoLessonSeoPage({ params }: { params: { videoId: string } }) {
  const video = getVideo(params.videoId);
  if (!video) notFound();

  const buildHref = `/video-lesson?v=${video.videoId}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: `ESL lesson plan for ${video.title}`,
    learningResourceType: 'Lesson plan',
    educationalUse: 'English language teaching',
    url: `${SITE_URL}/video-lesson/${video.videoId}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen text-lc-text">
        <section className="px-6 py-14">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <Link href="/video-lesson" className="text-sm font-medium text-lc-blue hover:text-lc-blue-hover">
                Video to Lesson
              </Link>
              <h1 className="mt-3 text-4xl font-bold leading-tight text-lc-text sm:text-5xl">
                ESL lesson plan for &ldquo;{video.title}&rdquo;
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-lc-text2">
                Use this video as the source for a live English lesson: vocabulary, comprehension
                checks, discussion prompts, games, and a teacher-led flow students join from any
                browser.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={buildHref}
                  className="inline-flex items-center gap-2 rounded-lg bg-lc-blue px-5 py-3 font-semibold text-[#070B14] transition-colors hover:bg-lc-blue-hover"
                >
                  Build this lesson
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-lc-border px-5 py-3 font-semibold text-lc-text2 transition-colors hover:border-cyan-300/50 hover:text-lc-text"
                >
                  <Youtube className="h-4 w-4" aria-hidden />
                  Watch source
                </a>
              </div>
            </div>

            <Link
              href={buildHref}
              className="group overflow-hidden rounded-2xl border border-cyan-300/20 bg-lc-card shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]"
            >
              <div className="relative aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
                  alt=""
                  className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                />
                <span className="absolute inset-0 grid place-items-center bg-black/20">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform group-hover:scale-105">
                    <Play className="h-7 w-7 translate-x-0.5" aria-hidden />
                  </span>
                </span>
              </div>
              <div className="p-5">
                <p className="text-sm text-lc-text2">
                  Free preview: suggested level, key vocabulary, comprehension questions, and
                  discussion prompts.
                </p>
              </div>
            </Link>
          </div>
        </section>

        <section className="border-y border-lc-border bg-lc-surface/70 px-6 py-12">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
            {[
              ['Vocabulary', 'Pull useful words from the video topic and turn them into learner-friendly examples.'],
              ['Comprehension', 'Check what students understood before moving into discussion.'],
              ['Speaking', 'Use the video as a reason for opinions, comparisons, and follow-up questions.'],
            ].map(([heading, copy]) => (
              <div key={heading} className="rounded-xl border border-lc-border bg-lc-card p-5">
                <h2 className="font-semibold text-lc-text">{heading}</h2>
                <p className="mt-2 text-sm leading-relaxed text-lc-text3">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-12">
          <div className="mx-auto max-w-5xl">
            <ProductVisualHero />
          </div>
        </section>
      </div>
    </>
  );
}
