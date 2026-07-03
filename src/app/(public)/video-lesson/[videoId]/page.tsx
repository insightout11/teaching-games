import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Clock, Play, Tag, Youtube } from 'lucide-react';
import { DEMO_VIDEOS } from '@/lib/video-lesson-demos';
import { ProductVisualHero } from '@/components/landing/ProductVisualHero';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lessoncaptain.com';

function getVideo(videoId: string) {
  return DEMO_VIDEOS.find((video) => video.videoId === videoId);
}

function formatDuration(seconds?: number) {
  if (!seconds) return null;
  const minutes = Math.round(seconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

function formatList(items: string[]) {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export function generateStaticParams() {
  return DEMO_VIDEOS.map((video) => ({ videoId: video.videoId }));
}

export function generateMetadata({ params }: { params: { videoId: string } }): Metadata {
  const video = getVideo(params.videoId);
  if (!video) return { title: 'Video lesson not found' };

  const title = `ESL Lesson Plan for "${video.title}" | LessonCaptain`;
  const description =
    video.description
      ? `Use "${video.title}" for an ESL video lesson with vocabulary, comprehension checks, discussion prompts, and live student participation.`
      : 'Turn this YouTube video into a live ESL lesson with vocabulary, comprehension questions, discussion prompts, and student participation.';

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
  const duration = formatDuration(video.durationSecs);
  const tags = video.topicTags?.slice(0, 5) ?? [];
  const level = video.difficultyLevel ?? 'Intermediate';
  const sourceLabel = video.speaker ?? video.genre ?? 'Curated video';
  const tagSummary = tags.length > 0 ? formatList(tags.slice(0, 3)) : 'the video topic';
  const lessonFlow = [
    {
      heading: 'Warm-up prediction',
      copy: `Show the title and thumbnail first. Ask students what they expect to hear, what words may appear, and what they already know about ${tagSummary}.`,
    },
    {
      heading: 'Vocabulary radar',
      copy: 'Choose 6-8 useful words before watching. Students predict meanings, then update their definitions after the first viewing.',
    },
    {
      heading: 'Watch with a purpose',
      copy: 'Give students one clear job: find the main claim, note two supporting details, or catch one surprising fact they can explain later.',
    },
    {
      heading: 'Comprehension check',
      copy: 'Use short factual questions before opinion questions. This keeps the discussion grounded in what the video actually said.',
    },
    {
      heading: 'Speaking landing',
      copy: 'End with a choice, ranking, summary, or opinion shift so every student leaves with one complete spoken answer.',
    },
  ];
  const relatedLinks = [
    { label: 'Open in Video to Lesson', href: buildHref },
    { label: 'Prediction Round', href: '/classroom-activities/prediction-round' },
    { label: 'Listening Gap Fill', href: '/classroom-activities/listening-gap-fill' },
    { label: 'Decision Council', href: '/classroom-activities/decision-council' },
    { label: 'Video lesson guide', href: '/blog/conversation-class-activities-for-online-esl' },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: `ESL lesson plan for ${video.title}`,
    learningResourceType: 'Lesson plan',
    educationalUse: 'English language teaching',
    educationalLevel: level,
    about: tags,
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
                {video.description ??
                  'Use this video as the source for a live English lesson: vocabulary, comprehension checks, discussion prompts, games, and a teacher-led flow students join from any browser.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-lc-border px-3 py-1.5 text-sm text-lc-text2">
                  <Tag className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
                  {level}
                </span>
                {duration ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-lc-border px-3 py-1.5 text-sm text-lc-text2">
                    <Clock className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
                    {duration}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-lc-border px-3 py-1.5 text-sm text-lc-text2">
                  {sourceLabel}
                </span>
              </div>
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
                  Free preview: suggested level, key vocabulary, comprehension questions,
                  discussion prompts, and live activity flow.
                </p>
              </div>
            </Link>
          </div>
        </section>

        <section className="border-y border-lc-border bg-lc-surface/70 px-6 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
                ESL lesson fit
              </p>
              <h2 className="mt-3 text-3xl font-bold text-lc-text">
                Why this video can work in class
              </h2>
              <p className="mt-3 text-base leading-relaxed text-lc-text2">
                A good ESL video lesson gives students a reason to predict, listen carefully,
                compare answers, and speak after the clip. This page turns the source video into a
                teacher-led path instead of a passive watch-and-answer worksheet.
              </p>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              ['Topic hook', tags.length > 0 ? `Useful for lessons around ${formatList(tags.slice(0, 3))}.` : 'Useful for lessons that need a clear topic hook and discussion angle.'],
              ['Comprehension', 'Check main ideas and details before moving into opinions, debate, or role-play.'],
              ['Speaking', 'Use the video as evidence students can quote, challenge, summarize, and connect to their own lives.'],
            ].map(([heading, copy]) => (
              <div key={heading} className="rounded-xl border border-lc-border bg-lc-card p-5">
                <h2 className="font-semibold text-lc-text">{heading}</h2>
                <p className="mt-2 text-sm leading-relaxed text-lc-text3">{copy}</p>
              </div>
            ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-12">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-lc-blue">
                Suggested class flow
              </p>
              <h2 className="mt-3 text-3xl font-bold text-lc-text">
                Build a complete ESL lesson around the clip
              </h2>
              <p className="mt-4 text-base leading-relaxed text-lc-text2">
                For most online classes, this works best as a 30-45 minute lesson: short setup,
                focused viewing, quick checks, then speaking. Keep the video as the shared source,
                but make student output the main event.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-4">
              {lessonFlow.map((step, index) => (
                <div key={step.heading} className="rounded-xl border border-lc-border bg-lc-card p-5">
                  <div className="flex items-start gap-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-lc-blue text-sm font-bold text-[#070B14]">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-lc-text">{step.heading}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-lc-text3">{step.copy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-lc-border bg-lc-surface/70 px-6 py-12">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-lc-border bg-lc-card p-6">
              <h2 className="text-2xl font-bold text-lc-text">Best fit</h2>
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-lc-text2">
                <p>
                  <span className="font-semibold text-lc-text">Level:</span> {level}. Adjust by
                  pre-teaching more vocabulary for lower levels or asking students to challenge the
                  speaker&apos;s argument at higher levels.
                </p>
                <p>
                  <span className="font-semibold text-lc-text">Class type:</span> works for 1:1
                  tutoring, small online groups, or a screen-shared classroom where students answer
                  from their own devices.
                </p>
                <p>
                  <span className="font-semibold text-lc-text">Timing:</span>{' '}
                  {duration ? `${duration} of video plus discussion time.` : 'Use a short clip or selected segment, then spend more time on student output than on watching.'}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-lc-border bg-lc-card p-6">
              <h2 className="text-2xl font-bold text-lc-text">Vocabulary and discussion angles</h2>
              <p className="mt-4 text-sm leading-relaxed text-lc-text2">
                Start with concrete words from the title and thumbnail, then move into phrases
                students need for explaining evidence: <span className="text-lc-text">&ldquo;The
                video suggests...&rdquo;</span>, <span className="text-lc-text">&ldquo;One example
                is...&rdquo;</span>, and <span className="text-lc-text">&ldquo;I changed my mind
                because...&rdquo;</span>
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {relatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-lc-border px-3 py-1.5 text-sm text-lc-text2 transition-colors hover:border-cyan-300/50 hover:text-cyan-300"
                  >
                    {link.label}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
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
