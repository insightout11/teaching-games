import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, MessagesSquare, Repeat2, Vote } from 'lucide-react';
import { ProductVisualHero } from '@/components/landing/ProductVisualHero';
import { SeoFaqSection, buildSeoHubJsonLd } from '@/components/marketing/SeoFaqSection';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lessoncaptain.com';

export const metadata: Metadata = {
  title: 'ESL Speaking Activities for Online Classes | LessonCaptain',
  description:
    'Structured ESL speaking activities for online English lessons: role-play, debate, decision tasks, conversation rounds, and reflection activities students join from any browser.',
  alternates: { canonical: `${SITE_URL}/esl-speaking-activities` },
  openGraph: {
    title: 'ESL Speaking Activities for Online Classes | LessonCaptain',
    description:
      'A practical hub for ESL speaking activities that create real output in Zoom, Google Meet, tutoring, and group classes.',
  },
};

const activityGroups = [
  {
    title: 'Role-play and real-world practice',
    copy: 'Use role-play when students need functional English for interviews, complaints, travel, meetings, or social situations.',
    links: [
      { label: 'Scenario Simulator', href: '/classroom-activities/scenario-simulator' },
      { label: 'Conversation Rounds', href: '/classroom-activities/conversation-rounds' },
      { label: 'Scene Igniter', href: '/classroom-activities/scene-igniter' },
    ],
  },
  {
    title: 'Debate and opinion activities',
    copy: 'Give opinions a structure: choose a side, use evidence, respond to pushback, and revise the answer.',
    links: [
      { label: 'Hot Take Arena', href: '/classroom-activities/hot-take-arena' },
      { label: 'Decision Council', href: '/classroom-activities/decision-council' },
      { label: 'Would You Rather', href: '/classroom-activities/would-you-rather' },
    ],
  },
  {
    title: 'Low-pressure speaking starters',
    copy: 'Start quiet groups with short answers, prediction, ranking, or personal response before asking for longer speaking.',
    links: [
      { label: 'Quick Pulse', href: '/classroom-activities/quick-pulse' },
      { label: 'Rank It', href: '/classroom-activities/rank-it' },
      { label: 'In Your Words', href: '/classroom-activities/in-your-words' },
    ],
  },
];

const classroomPatterns = [
  {
    title: 'For quiet classes',
    detail:
      'Collect written answers first, then call on students with something already on screen. This lowers pressure and gives hesitant speakers a starting sentence.',
  },
  {
    title: 'For mixed levels',
    detail:
      'Make the first response simple and the follow-up harder. Everyone can choose, but stronger students must justify, challenge, or improve the answer.',
  },
  {
    title: 'For exam or academic classes',
    detail:
      'Use debate, decision, and evidence tasks to practise reasons, concessions, counterarguments, and more precise transitions.',
  },
];

const relatedGuides = [
  {
    label: 'Conversation class activities guide',
    href: '/blog/conversation-class-activities-for-online-esl',
  },
  {
    label: 'Online ESL games',
    href: '/online-esl-games',
  },
  {
    label: 'Classroom activities',
    href: '/classroom-activities',
  },
  {
    label: 'AI ESL lesson generator',
    href: '/ai-esl-lesson-plan-generator',
  },
];

const faqs = [
  {
    q: 'What are the best ESL speaking activities for online classes?',
    a: 'The best online speaking activities give students a concrete task: decide, rank, role-play, defend, predict, or reflect. That structure creates more useful language than a loose list of questions.',
  },
  {
    q: 'How do I get quiet students to speak online?',
    a: 'Collect short written answers first, then invite students to explain what they already submitted. This gives hesitant speakers a sentence to start from and lets the teacher choose useful answers.',
  },
  {
    q: 'Can speaking activities work in one-on-one ESL tutoring?',
    a: 'Yes. In one-on-one lessons, the teacher can take the second role, challenge an answer, or ask the student to revise a response after feedback.',
  },
  {
    q: 'How should an ESL speaking activity end?',
    a: 'End with a visible landing: a final answer, vote, ranking, opinion shift, corrected sentence, or reflection. Students remember the last clear thing they said.',
  },
];

export default function EslSpeakingActivitiesPage() {
  const jsonLd = buildSeoHubJsonLd({
    name: 'ESL speaking activities',
    description: metadata.description,
    url: `${SITE_URL}/esl-speaking-activities`,
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
              ESL speaking activities
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-lc-text sm:text-5xl">
              ESL speaking activities that give conversation a clear job
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-lc-text2">
              Run online speaking tasks where students choose, defend, compare, role-play, revise,
              and reflect. LessonCaptain keeps the teacher screen in control while students answer
              from their own devices.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/classroom-activities"
                className="inline-flex items-center gap-2 rounded-lg bg-lc-blue px-5 py-3 font-semibold text-[#070B14] transition-colors hover:bg-lc-blue-hover"
              >
                Browse activities
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/blog/conversation-class-activities-for-online-esl"
                className="inline-flex items-center rounded-lg border border-lc-border px-5 py-3 font-semibold text-lc-text2 transition-colors hover:border-cyan-300/50 hover:text-lc-text"
              >
                Read the guide
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
              icon: MessagesSquare,
              title: 'More than discussion questions',
              copy: 'Students get a task with an outcome, not just a topic. That creates better turns and clearer feedback.',
            },
            {
              icon: Repeat2,
              title: 'Built for second attempts',
              copy: 'The strongest speaking lessons let students answer once, hear feedback, then try again with better language.',
            },
            {
              icon: Vote,
              title: 'Clear class landing',
              copy: 'Votes, final answers, rankings, and reflections make the speaking work visible before class ends.',
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
              Choose by speaking goal
            </p>
            <h2 className="mt-3 text-3xl font-bold text-lc-text">
              Match the activity to the language students need
            </h2>
            <p className="mt-3 leading-relaxed text-lc-text2">
              Conversation improves when the task changes the language. Role-play creates
              functional phrases. Debate creates reasons and concessions. Ranking creates
              comparison. Reflection creates clearer summaries.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {activityGroups.map((group) => (
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
              Make online speaking easier to manage
            </h2>
            <p className="mt-4 leading-relaxed text-lc-text2">
              The activity format should reduce teacher load: students know what to do, observers
              have a listening focus, and the class ends with visible output.
            </p>
          </div>
          <div className="grid gap-4">
            {classroomPatterns.map((pattern) => (
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
                Build a wider speaking cluster with the conversation guide, online ESL game hub,
                and the full activity library.
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
