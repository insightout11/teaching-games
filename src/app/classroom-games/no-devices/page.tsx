import type { Metadata } from 'next';
import Link from 'next/link';
import { MonitorPlay, Users, Wifi, Smartphone } from 'lucide-react';
import { getGame } from '@/games/registry';
import { getGameContent } from '@/lib/content-landing';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { FAQSection } from '@/components/landing/FAQSection';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lessoncaptain.com';
const PAGE_PATH = '/classroom-games/no-devices';

// Every game here is tagged `deviceFree: true` in the registry (src/games/types.ts) —
// confirmed by reading each game's actual input mechanics, not assumed. The teacher runs
// the whole round from the projected screen; students never need a phone, tablet, or
// account. If a game isn't listed here, it currently needs at least one student device.
const FEATURED_GAME_KEYS = [
  'vocab-sprint',
  'synonym-showdown',
  'word-chain',
  'sentence-scramble',
  'grammar-boss',
  'error-hunter',
  'story-sprint',
  'dialogue-detective',
  'connections',
  'brain-teasers',
] as const;

const VERBAL_MECHANIC: Record<(typeof FEATURED_GAME_KEYS)[number], string> = {
  'vocab-sprint': 'Project the weak sentence. A student calls out a stronger word — you type it in and the AI scores it on the spot.',
  'synonym-showdown': 'Project the target word. Students shout synonyms as fast as they can think of them; you type each one in as it comes.',
  'word-chain': 'Project the current word. A student says a connected word out loud; you type it in to extend the chain.',
  'sentence-scramble': 'Project the scrambled words. A student calls out the order; you tap the words into place on the shared screen.',
  'grammar-boss': 'Project the challenge. A student speaks their correction; you type it in for instant AI feedback.',
  'error-hunter': 'Project the paragraph. A student points out the error out loud; you click it on the shared screen.',
  'story-sprint': 'Project the story so far. Each student adds the next sentence aloud; you type it in to keep it going.',
  'dialogue-detective': 'Project the conversation with a line missing. A student suggests what to say; you type it in for feedback.',
  'connections': 'Project the 16-word grid. Students call out which four belong together; you click the group for them.',
  'brain-teasers': 'Project the riddle. A student calls out a guess; you type it in and reveal the trick together.',
};

const HOW_IT_WORKS_STEPS = [
  'Pick any game below and launch it from your teacher account — no student sign-up, no app download, no Wi-Fi for the class.',
  'Project your screen so the whole class (or your one student, for 1-on-1 lessons) can see the prompt.',
  'Ask a student to answer out loud, then type or click their answer into the shared screen yourself.',
  'The AI scores it instantly and the leaderboard updates live — no per-student device is ever required.',
];

const FAQ_ITEMS = [
  {
    q: 'Do I need student devices to run these games?',
    a: "No. Every game on this page runs entirely from your projected screen or smart TV. Students answer out loud; you type or click their answers into the shared display yourself. If your students do have phones or tablets, most of these games also support an optional simultaneous per-device mode — but it's never required to play.",
  },
  {
    q: 'My classroom only has a projector and a whiteboard — will these work?',
    a: "That's exactly the setup these are built for. You need one laptop or tablet connected to a projector or smart TV — nothing student-facing, no BYOD policy, no device management. Think of it as a whiteboard game where the AI generates the prompts and scores the answers for you.",
  },
  {
    q: 'Can one student answer at a time instead of the whole class racing?',
    a: 'Yes. You control the pace by picking who answers next, so the class plays turn-by-turn around a single shared prompt. Because there\'s no device-racing requirement, this same turn-based flow works for a class of any size — including exactly one student.',
  },
  {
    q: "How is this different from just running a quiz off a slide deck?",
    a: 'Every prompt is generated fresh for your topic and level, and answers are scored automatically — synonyms, grammar corrections, story sentences, riddle guesses — instead of you judging right or wrong on the fly. You also get a live leaderboard and streak tracking without a spreadsheet.',
  },
  {
    q: 'Do these device-free games work for 1-on-1 online tutoring?',
    a: "Yes — all ten are confirmed solo-friendly. The same \"type or click their spoken answer\" loop works with exactly one student on a screen-share, with no separate student device needed. See the section below for more on running LessonCaptain 1-on-1.",
  },
];

export function generateMetadata(): Metadata {
  const title = 'No-Device Classroom Games for ESL Teachers — LessonCaptain';
  const description =
    'Projector-only ESL games — students answer out loud, you run the shared screen. No student phones, tablets, or accounts needed. Free to try.';
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${PAGE_PATH}` },
    openGraph: { title, description },
    ...(process.env.LANDING_PAGES_NOINDEX ? { robots: 'noindex,nofollow' } : {}),
  };
}

export default function NoDevicesClassroomGamesPage() {
  const games = FEATURED_GAME_KEYS
    .map((key) => ({ key, plugin: getGame(key), content: getGameContent(key) }))
    .filter((g): g is { key: (typeof FEATURED_GAME_KEYS)[number]; plugin: NonNullable<ReturnType<typeof getGame>>; content: NonNullable<ReturnType<typeof getGameContent>> } =>
      !!g.plugin && !!g.content
    );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        name: 'No-Device Classroom Games',
        itemListElement: games.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: g.plugin.name,
          url: `${SITE_URL}/classroom-games/${g.key}`,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <nav className="mb-4 text-sm text-gray-500">
            <Link href="/classroom-games" className="hover:underline">
              Classroom Games
            </Link>{' '}
            / <span className="text-gray-900">No Devices Needed</span>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Classroom games for the projector — no student devices needed
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl">
            One shared screen. Students answer out loud, you type or click their answers in
            yourself, and an AI scores it live. No phones, no tablets, no BYOD policy, no
            student accounts — just a projector or smart TV and a class that talks.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <MonitorPlay className="h-4 w-4" aria-hidden /> Runs on one shared screen
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Smartphone className="h-4 w-4" aria-hidden /> Zero student devices
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wifi className="h-4 w-4" aria-hidden /> No student Wi-Fi needed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" aria-hidden /> Works 1-on-1 or with a full class
            </span>
          </div>

          <div className="mt-8">
            <Link
              href="/login"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition"
            >
              Try free with Google →
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <HowItWorks steps={HOW_IT_WORKS_STEPS} />

      {/* Featured games grid */}
      <section className="py-10 bg-gray-50">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-bold text-gray-900">10 games built to run projector-only</h2>
          <p className="mt-1 text-gray-600">
            Every game below is confirmed device-free in the registry — no student device is ever
            required to play it.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {games.map((g) => (
              <Link
                key={g.key}
                href={`/classroom-games/${g.key}`}
                className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-400 hover:shadow"
              >
                <h3 className="font-semibold text-gray-900">{g.plugin.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-wide text-blue-600">{g.content.headline}</p>
                <p className="mt-2 text-sm text-gray-600">{VERBAL_MECHANIC[g.key]}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 1-on-1 tutors section */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-bold text-gray-900">Teaching 1-on-1? These are built for you too</h2>
          <p className="mt-3 text-gray-600 max-w-3xl">
            A device-free game doesn&apos;t need a crowd — it needs one screen and one student
            willing to talk. Every game above works turn-by-turn with exactly one student on a
            video call: you share your screen, they answer out loud, and you type their answer
            in the same way you would in a classroom. There&apos;s no separate student link to
            send and nothing for them to install.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/classroom-games"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 transition"
            >
              Browse all classroom games →
            </Link>
            <Link
              href="/video-lesson"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 transition"
            >
              Build a lesson from a video →
            </Link>
            <Link
              href="/pro"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 transition"
            >
              See LessonCaptain Pro →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection items={FAQ_ITEMS} />

      {/* CTA */}
      <section className="bg-blue-600 py-12 text-center text-white">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-bold">Ready to run a device-free lesson?</h2>
          <p className="mt-2 text-blue-100">
            Free teacher account — sign in with Google. No student accounts or setup required.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 hover:bg-blue-50 transition"
          >
            Get started free →
          </Link>
        </div>
      </section>

      {/* Cross-link */}
      <section className="py-10 border-t border-gray-100">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-gray-600">
            <Link href="/classroom-activities" className="text-blue-600 hover:underline">
              Looking for discussion activities instead? Browse classroom activities →
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
