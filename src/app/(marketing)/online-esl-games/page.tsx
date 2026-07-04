import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, MonitorSmartphone, Timer, UsersRound } from 'lucide-react';
import { ProductVisualHero } from '@/components/landing/ProductVisualHero';
import { SeoFaqSection, buildSeoHubJsonLd } from '@/components/marketing/SeoFaqSection';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lessoncaptain.com';

export const metadata: Metadata = {
  title: 'Online ESL Games for Live English Classes | LessonCaptain',
  description:
    'Online ESL games for Zoom, Google Meet, tutoring, and group classes. Build vocabulary, speaking, comprehension, and review games students join from any browser.',
  alternates: { canonical: `${SITE_URL}/online-esl-games` },
  openGraph: {
    title: 'Online ESL Games for Live English Classes | LessonCaptain',
    description:
      'A practical hub for online ESL games: vocabulary races, speaking activities, video lessons, quizzes, and no-prep live class formats.',
  },
};

const gameGroups = [
  {
    title: 'Vocabulary and review games',
    copy: 'Fast retrieval games for words, phrases, grammar patterns, and end-of-unit review.',
    links: [
      { label: 'GridRush', href: '/classroom-games/grid-rush' },
      { label: 'Vocab Sprint', href: '/classroom-games/vocab-sprint' },
      { label: 'Word Chain', href: '/classroom-games/word-chain' },
      { label: 'Flash Quiz', href: '/classroom-games/flash-quiz' },
    ],
  },
  {
    title: 'Speaking-first activities',
    copy: 'Use these when the goal is explanation, opinion, persuasion, role-play, or reflection.',
    links: [
      { label: 'Scenario Simulator', href: '/classroom-activities/scenario-simulator' },
      { label: 'Decision Council', href: '/classroom-activities/decision-council' },
      { label: 'Hot Take Arena', href: '/classroom-activities/hot-take-arena' },
      { label: 'In Your Words', href: '/classroom-activities/in-your-words' },
    ],
  },
  {
    title: 'Video and listening lessons',
    copy: 'Turn a YouTube clip into vocabulary, comprehension checks, prediction, and discussion.',
    links: [
      { label: 'Video to Lesson', href: '/video-lesson' },
      { label: 'Prediction Round', href: '/classroom-activities/prediction-round' },
      { label: 'Listening Gap Fill', href: '/classroom-activities/listening-gap-fill' },
      { label: 'Vocab Radar', href: '/classroom-activities/vocab-radar' },
    ],
  },
];

const lessonFlows = [
  {
    title: '15-minute warm-up',
    steps: ['Quick Pulse', 'GridRush', 'one spoken sentence from every student'],
  },
  {
    title: '45-minute online class',
    steps: ['topic hook', 'vocabulary game', 'speaking activity', 'Final Word reflection'],
  },
  {
    title: '1:1 tutoring session',
    steps: ['teacher-vs-student challenge', 'deduction game', 'personalized follow-up'],
  },
];

const relatedGuides = [
  {
    label: 'Online ESL games for one-on-one lessons',
    href: '/blog/online-esl-games-for-one-on-one-lessons',
  },
  {
    label: 'Zoom ESL games students can join from phones',
    href: '/blog/zoom-esl-games-students-join-from-phones',
  },
  {
    label: 'Kahoot alternative for ESL',
    href: '/kahoot-alternative-for-esl',
  },
  {
    label: 'Wordwall alternative for ESL',
    href: '/wordwall-alternative-for-esl',
  },
];

const faqs = [
  {
    q: 'What makes a good online ESL game?',
    a: 'A good online ESL game has a clear language target, fast setup, visible teacher control, and a reason for students to speak after they answer. The game should create English output, not only screen taps.',
  },
  {
    q: 'Can students join these ESL games from phones?',
    a: 'Yes. LessonCaptain activities are designed for screen-share teaching where students answer from any browser on a phone, tablet, or laptop without student accounts.',
  },
  {
    q: 'Do online ESL games work for one-on-one lessons?',
    a: 'Yes. One-on-one lessons work best with timed challenges, deduction games, teacher-versus-student rhythms, and follow-up questions that turn each answer into a sentence.',
  },
  {
    q: 'How do I stop an ESL game from becoming filler?',
    a: 'Choose the target language first, run a short round, then require output: explain the answer, use the word in context, defend a choice, or reflect on what changed.',
  },
];

export default function OnlineEslGamesPage() {
  const jsonLd = buildSeoHubJsonLd({
    name: 'Online ESL games',
    description: metadata.description,
    url: `${SITE_URL}/online-esl-games`,
    faqs,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="px-6 py-14">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-lc-blue">
              Online ESL games
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-lc-text sm:text-5xl">
              Online ESL games for live English classes
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-lc-text2">
              Use LessonCaptain to run vocabulary games, speaking activities, video lessons, and
              review rounds in Zoom, Google Meet, Teams, or a tutoring classroom. Students join
              from any browser while the teacher controls the shared screen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/classroom-games"
                className="inline-flex items-center gap-2 rounded-lg bg-lc-blue px-5 py-3 font-semibold text-[#070B14] transition-colors hover:bg-lc-blue-hover"
              >
                Browse games
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/video-lesson"
                className="inline-flex items-center rounded-lg border border-lc-border px-5 py-3 font-semibold text-lc-text2 transition-colors hover:border-cyan-300/50 hover:text-lc-text"
              >
                Build a video lesson
              </Link>
            </div>
          </div>
          <ProductVisualHero />
        </div>
      </section>

      <section className="border-y border-lc-border bg-lc-surface/70 px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            {
              icon: MonitorSmartphone,
              title: 'Students join from phones',
              copy: 'No student accounts or app installs. Share a link or QR code and keep the teacher screen in control.',
            },
            {
              icon: Timer,
              title: 'Built for live timing',
              copy: 'Use timers, reveals, rounds, scores, and short prompts so online lessons keep moving.',
            },
            {
              icon: UsersRound,
              title: 'Works for 1:1 or groups',
              copy: 'Run teacher-versus-student challenges, small group speaking, or whole-class response rounds.',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-xl border border-lc-border bg-lc-card p-5">
                <Icon className="h-6 w-6 text-cyan-300" aria-hidden />
                <h2 className="mt-4 font-semibold text-lc-text">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-lc-text3">{item.copy}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
              Choose by lesson goal
            </p>
            <h2 className="mt-3 text-3xl font-bold text-lc-text">
              The best online ESL game depends on the language output
            </h2>
            <p className="mt-3 leading-relaxed text-lc-text2">
              Start with the class outcome, then choose the format. Review games should make
              recall faster. Speaking games should make students explain, compare, persuade, or
              revise an answer.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {gameGroups.map((group) => (
              <div key={group.title} className="rounded-xl border border-lc-border bg-lc-card p-6">
                <h3 className="text-xl font-bold text-lc-text">{group.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-lc-text3">{group.copy}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {group.links.map((link) => (
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
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-lc-border bg-lc-surface/70 px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-lc-blue">
              Ready-to-use flows
            </p>
            <h2 className="mt-3 text-3xl font-bold text-lc-text">
              Turn games into a complete online lesson
            </h2>
            <p className="mt-4 leading-relaxed text-lc-text2">
              A game is strongest when it sits inside a lesson arc: hook, retrieval, output, and
              landing. These flows help the activity produce useful English instead of becoming
              filler.
            </p>
          </div>
          <div className="grid gap-4">
            {lessonFlows.map((flow) => (
              <div key={flow.title} className="rounded-xl border border-lc-border bg-lc-card p-5">
                <h3 className="font-semibold text-lc-text">{flow.title}</h3>
                <ul className="mt-3 space-y-2">
                  {flow.steps.map((step) => (
                    <li key={step} className="flex gap-3 text-sm text-lc-text2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lc-blue" aria-hidden />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl rounded-xl border border-cyan-300/20 bg-lc-card p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-lc-text">Related guides</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-lc-text3">
                Keep building from here with practical guides and comparison pages for online ESL
                teachers.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {relatedGuides.map((guide) => (
                <Link
                  key={guide.href}
                  href={guide.href}
                  className="rounded-full border border-lc-border px-3 py-1.5 text-sm text-lc-text2 transition-colors hover:border-cyan-300/50 hover:text-cyan-300"
                >
                  {guide.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SeoFaqSection faqs={faqs} />
    </>
  );
}
