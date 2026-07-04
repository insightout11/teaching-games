import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Brain, CheckCircle2, Gauge, RefreshCw } from 'lucide-react';
import { ProductVisualHero } from '@/components/landing/ProductVisualHero';
import { SeoFaqSection, buildSeoHubJsonLd } from '@/components/marketing/SeoFaqSection';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lessoncaptain.com';

export const metadata: Metadata = {
  title: 'ESL Vocabulary Games for Online Classes | LessonCaptain',
  description:
    'ESL vocabulary games for online English classes: retrieval races, word association, synonym practice, topic vocabulary, and live review rounds students join from any browser.',
  alternates: { canonical: `${SITE_URL}/esl-vocabulary-games` },
  openGraph: {
    title: 'ESL Vocabulary Games for Online Classes | LessonCaptain',
    description:
      'A practical hub for vocabulary games that help ESL students retrieve, explain, connect, and reuse new words in live online lessons.',
  },
};

const gameGroups = [
  {
    title: 'Fast retrieval games',
    copy: 'Use these when students need to recall words quickly and turn passive vocabulary into active use.',
    links: [
      { label: 'GridRush', href: '/classroom-games/grid-rush' },
      { label: 'Vocab Sprint', href: '/classroom-games/vocab-sprint' },
      { label: 'Flash Quiz', href: '/classroom-games/flash-quiz' },
    ],
  },
  {
    title: 'Word connection games',
    copy: 'Build stronger lexical networks by asking students to connect, compare, categorize, and explain word choices.',
    links: [
      { label: 'Word Chain', href: '/classroom-games/word-chain' },
      { label: 'Connections', href: '/classroom-games/connections' },
      { label: 'Synonym Showdown', href: '/classroom-games/synonym-showdown' },
    ],
  },
  {
    title: 'Vocabulary from source material',
    copy: 'Pull useful words from a video, article, image, or topic, then reuse them in speaking tasks.',
    links: [
      { label: 'Video to Lesson', href: '/video-lesson' },
      { label: 'Vocab Radar', href: '/classroom-activities/vocab-radar' },
      { label: 'Listening Gap Fill', href: '/classroom-activities/listening-gap-fill' },
    ],
  },
];

const teachingPatterns = [
  {
    title: 'Retrieve before explaining',
    detail:
      'Start with a quick recall round, then slow down. Ask students to use two answers in sentences, explain a contrast, or give a personal example.',
  },
  {
    title: 'Group words by meaning, not lists',
    detail:
      'Students remember more when words live in useful clusters: problems and solutions, weak and strong adjectives, formal and informal phrases.',
  },
  {
    title: 'Recycle words into speaking',
    detail:
      'A vocabulary game should end with output. Students can defend a choice, tell a short story, summarize a video, or use the words in a role-play.',
  },
];

const relatedGuides = [
  { label: 'Vocabulary review activities', href: '/blog/esl-vocabulary-review-activities' },
  { label: 'Online ESL games', href: '/online-esl-games' },
  { label: 'ESL speaking activities', href: '/esl-speaking-activities' },
  { label: 'Classroom games', href: '/classroom-games' },
];

const faqs = [
  {
    q: 'What are good ESL vocabulary games for online classes?',
    a: 'Good online vocabulary games include timed recall, word chains, synonym practice, category sorting, source-based vocabulary, and follow-up speaking tasks that make students reuse the words.',
  },
  {
    q: 'How do vocabulary games help ESL students remember words?',
    a: 'Vocabulary games help when they combine retrieval, meaning, and reuse. Students should recall the word, explain or compare it, then use it again in a sentence or speaking task.',
  },
  {
    q: 'Can I make vocabulary games from a YouTube video?',
    a: 'Yes. Use a video as source material, pull useful words from the topic, check comprehension, then recycle the vocabulary in discussion, prediction, or role-play.',
  },
  {
    q: 'Should vocabulary games use scores or speaking?',
    a: 'Use scores for momentum and retrieval, then switch to speaking for evidence of learning. The best lesson uses both: quick recall first, meaningful output second.',
  },
];

export default function EslVocabularyGamesPage() {
  const jsonLd = buildSeoHubJsonLd({
    name: 'ESL vocabulary games',
    description: metadata.description,
    url: `${SITE_URL}/esl-vocabulary-games`,
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
              ESL vocabulary games
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-lc-text sm:text-5xl">
              ESL vocabulary games that move words into active use
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-lc-text2">
              Run live vocabulary games for online English classes: retrieval races, word chains,
              synonym practice, topic vocabulary, and source-based review. Students join from any
              browser while the teacher leads the shared screen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/classroom-games/vocabulary"
                className="inline-flex items-center gap-2 rounded-lg bg-lc-blue px-5 py-3 font-semibold text-[#070B14] transition-colors hover:bg-lc-blue-hover"
              >
                Browse vocabulary games
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/video-lesson"
                className="inline-flex items-center rounded-lg border border-lc-border px-5 py-3 font-semibold text-lc-text2 transition-colors hover:border-cyan-300/50 hover:text-lc-text"
              >
                Build from a video
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
              icon: Gauge,
              title: 'Quick recall',
              copy: 'Timers and short rounds help students retrieve words without turning practice into a worksheet.',
            },
            {
              icon: Brain,
              title: 'Deeper connections',
              copy: 'Students compare meanings, explain choices, and build stronger links between related words.',
            },
            {
              icon: RefreshCw,
              title: 'Recycled output',
              copy: 'Vocabulary comes back in sentences, discussion, role-play, and final reflections before class ends.',
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
              Choose by vocabulary goal
            </p>
            <h2 className="mt-3 text-3xl font-bold text-lc-text">
              Different vocabulary games train different word skills
            </h2>
            <p className="mt-3 leading-relaxed text-lc-text2">
              Some lessons need speed. Others need precision, associations, examples, or reuse in
              speaking. Pick the game based on what students should do with the words after they
              remember them.
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
              Teaching patterns
            </p>
            <h2 className="mt-3 text-3xl font-bold text-lc-text">
              Make vocabulary practice useful after the game ends
            </h2>
            <p className="mt-4 leading-relaxed text-lc-text2">
              A vocabulary game is not finished when the student gets the word right. The useful
              moment is what happens next: example, contrast, correction, reuse, and recall later
              in the lesson.
            </p>
          </div>
          <div className="grid gap-4">
            {teachingPatterns.map((pattern) => (
              <div key={pattern.title} className="rounded-xl border border-lc-border bg-lc-card p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lc-blue" aria-hidden />
                  <div>
                    <h3 className="font-semibold text-lc-text">{pattern.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-lc-text3">{pattern.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl rounded-xl border border-cyan-300/20 bg-lc-card p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-lc-text">Related paths</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-lc-text3">
                Connect vocabulary practice to broader online ESL games, speaking activities, and
                video-based lessons.
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
