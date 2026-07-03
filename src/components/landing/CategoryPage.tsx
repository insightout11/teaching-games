import Link from 'next/link';
import type { LandingContent } from '@/lib/content-landing';
import type { GamePlugin } from '@/games/types';
import type { ActivityPlugin } from '@/activities/types';

interface GameCategoryPageProps {
  type: 'game';
  categoryKey: string;
  categoryName: string;
  plugins: GamePlugin[];
  contentMap: Record<string, LandingContent>;
  crossLinkHref: string;
  crossLinkLabel: string;
}

interface ActivityCategoryPageProps {
  type: 'activity';
  categoryKey: string;
  categoryName: string;
  plugins: ActivityPlugin[];
  contentMap: Record<string, LandingContent>;
  crossLinkHref: string;
  crossLinkLabel: string;
}

type CategoryPageProps = GameCategoryPageProps | ActivityCategoryPageProps;

const CATEGORY_INTROS: Record<string, string> = {
  vocabulary:
    'These vocabulary games give students immediate feedback on word choice, synonym recall, and vocabulary depth — the kind of active practice that actually builds fluency.',
  grammar:
    'From sentence ordering to error detection, these grammar games make accuracy practice engaging. AI generates fresh content every session so students never see the same exercise twice.',
  logic:
    'These puzzle and reasoning games develop critical thinking and language precision. Students work through deduction, pattern recognition, and conversational inference.',
  icebreakers:
    'These icebreaker activities get students talking from the first minute of class. Each one generates instant discussion without any preparation time from the teacher.',
  learning:
    'These learning activities build content knowledge and vocabulary depth through structured interaction. Students encounter new language in context, not in lists.',
  practice:
    'These practice activities develop speaking fluency through roleplay, simulation, and collaborative problem-solving. Every session adapts to your class topic.',
  debate:
    "These debate and argumentation activities build persuasion language and critical thinking. AI plays devil's advocate so students face real intellectual challenge.",
};

const CATEGORY_FAQS: Record<string, { q: string; a: string }[]> = {
  vocabulary: [
    {
      q: 'How much preparation time do vocabulary games need?',
      a: 'Zero preparation for the teacher. Set a topic, click start, and the AI generates all content on the fly. The whole setup takes under 60 seconds.',
    },
    {
      q: 'Can I run these with any class size?',
      a: 'Yes. All vocabulary games work in any class size — with 3+ students they switch to simultaneous mode where everyone competes at once.',
    },
    {
      q: 'Do students need their own devices?',
      a: 'Yes, students each need a phone or tablet to interact. They join through a browser — no app downloads or accounts required.',
    },
    {
      q: 'Are these suitable for exam preparation?',
      a: "Absolutely. Word precision, synonym range, and contextual vocabulary use are tested in Cambridge, IELTS, and TOEFL exams. These games build those exact skills.",
    },
  ],
  grammar: [
    {
      q: 'Can I target specific grammar points?',
      a: 'Yes. All grammar games accept a topic or grammar target in session settings. Type "past perfect" or "passive voice" and the AI generates appropriate challenges.',
    },
    {
      q: 'How does the AI evaluate grammar answers?',
      a: 'The AI checks for grammatical accuracy and provides structured feedback — identifying the error, explaining the rule, and showing a corrected version.',
    },
    {
      q: 'Do students need devices?',
      a: 'Yes, each student uses their phone or tablet through a browser. No downloads or student accounts needed.',
    },
    {
      q: 'What level are the grammar games suited to?',
      a: 'All levels from A1 to C1. Difficulty settings adjust sentence complexity and the types of grammar structures targeted.',
    },
  ],
  logic: [
    {
      q: 'Are these games suitable for beginners?',
      a: 'Yes. Easy difficulty settings simplify the language and reasoning demands. Even A2 students can succeed at logic puzzles with appropriate scaffolding.',
    },
    {
      q: 'How does AI generate fresh content each time?',
      a: 'Content is generated on demand based on your topic and difficulty settings. No session uses the same puzzles or dialogues as a previous one.',
    },
    {
      q: 'Do students need devices?',
      a: 'Yes, students interact on their phones or tablets through a browser. No app or account required.',
    },
    {
      q: 'Can these be used for exam preparation?',
      a: 'Yes. The deductive reasoning and vocabulary precision in these games transfer directly to reading comprehension and vocabulary tasks in standardised exams.',
    },
  ],
  icebreakers: [
    {
      q: 'Do I need to prepare content in advance?',
      a: 'No. All icebreakers generate content on demand based on your topic. You can start a session in under a minute with zero preparation.',
    },
    {
      q: 'Can these work with beginners?',
      a: 'Yes. Icebreakers are low-pressure activities designed to get students talking. Even A1–A2 students engage because the format demands expression, not perfection.',
    },
    {
      q: 'Do students need devices?',
      a: 'Yes, each student needs a phone or tablet. They join via browser — no download or student account required.',
    },
    {
      q: 'Can I use these for any topic?',
      a: 'Yes. All icebreakers accept a custom topic and the AI generates relevant dilemmas, statements, or items to match your lesson theme.',
    },
  ],
  learning: [
    {
      q: 'How do these activities embed vocabulary learning?',
      a: 'Vocabulary is woven into the content — claims, roles, and facts all incorporate target language. Students encounter words in realistic context before or alongside explicit teaching.',
    },
    {
      q: 'Do I need to prepare content in advance?',
      a: 'No. All learning activities generate content from your topic setting. Set the topic, start the session, and the AI handles everything.',
    },
    {
      q: 'Do students need devices?',
      a: 'Yes, each student uses their phone or tablet through a browser. No app or student account required.',
    },
    {
      q: 'What levels are these suited to?',
      a: 'Learning activities work from A2 upward. Difficulty settings adjust vocabulary complexity and the sophistication of information presented.',
    },
  ],
  practice: [
    {
      q: 'How much speaking do practice activities generate?',
      a: 'A lot. Practice activities are structured around communication tasks — students must speak to progress the scenario or solve the problem. Expect full-lesson speaking output.',
    },
    {
      q: 'Can these be used for professional English?',
      a: 'Yes. Set the topic to a professional context — job interviews, project management, client negotiations — and the AI generates scenarios relevant to that domain.',
    },
    {
      q: 'Do students need devices?',
      a: 'Yes, each student needs a phone or tablet. They join via browser — no download or account required.',
    },
    {
      q: 'How much teacher facilitation is needed?',
      a: 'More than games, but the AI provides scaffolding. Teachers focus on facilitating discussion and introducing complications rather than generating content.',
    },
  ],
  debate: [
    {
      q: 'What makes AI devil\'s advocate effective?',
      a: 'The AI identifies the weakest assumption in each student argument and challenges it specifically — not a generic counterpoint. This pushes students to think more carefully about their reasoning.',
    },
    {
      q: 'Can students change sides during a debate?',
      a: 'Yes. Teachers can open a \'flip\' phase where persuaded students switch positions and explain why. This creates a second productive discussion round.',
    },
    {
      q: 'Do students need devices?',
      a: 'Yes, each student submits arguments on their phone or tablet through a browser. No app or download required.',
    },
    {
      q: 'What level is best for debate activities?',
      a: 'Debate activities work best from B1 upward. Lower levels need more scaffolding — sentence starters and vocabulary support from the teacher.',
    },
  ],
};

export function CategoryPage({
  type,
  categoryKey,
  categoryName,
  plugins,
  contentMap,
  crossLinkHref,
  crossLinkLabel,
}: CategoryPageProps) {
  const basePath = type === 'game' ? '/classroom-games' : '/classroom-activities';
  const hubLabel = type === 'game' ? 'Classroom Games' : 'Classroom Activities';
  const intro = CATEGORY_INTROS[categoryKey] ?? '';
  const faqs = CATEGORY_FAQS[categoryKey] ?? [];
  const accent =
    type === 'game'
      ? { text: 'text-cyan-300', border: 'hover:border-cyan-400/50' }
      : { text: 'text-emerald-300', border: 'hover:border-emerald-400/50' };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${categoryName} — LessonCaptain`,
    itemListElement: plugins.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.name,
      url: `${basePath}/${p.key}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-6">
          <nav className="mb-4 text-sm text-lc-text3">
            <Link href={basePath} className="hover:underline">
              {hubLabel}
            </Link>{' '}
            / <span className="text-lc-text">{categoryName}</span>
          </nav>
          <h1 className="text-3xl font-bold text-lc-text sm:text-4xl">
            {categoryName} for ESL Classes
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-lc-text2">{intro}</p>
        </div>
      </section>

      {/* Card grid */}
      <section className="bg-lc-surface py-10">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plugins.map((plugin) => {
              const content = contentMap[plugin.key];
              return (
                <Link
                  key={plugin.key}
                  href={`${basePath}/${plugin.key}`}
                  className={`rounded-xl border border-lc-border bg-lc-card p-6 transition-colors ${accent.border}`}
                >
                  <h2 className="font-semibold text-lc-text">{plugin.name}</h2>
                  <p className="mt-2 text-sm text-lc-text3">{plugin.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {plugin.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-lc-border bg-lc-surface px-2 py-0.5 text-xs text-lc-text3"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  {'estimatedMinutes' in plugin && (
                    <p className="mt-3 text-xs text-lc-text3">
                      ~{plugin.estimatedMinutes} min
                    </p>
                  )}
                  {content?.estimatedTime && !('estimatedMinutes' in plugin) && (
                    <p className="mt-3 text-xs text-lc-text3">{content.estimatedTime}</p>
                  )}
                  <span className={`mt-4 inline-block text-sm font-medium ${accent.text}`}>
                    Learn more &rarr;
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="py-10">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-2xl font-bold text-lc-text">Common questions</h2>
            <dl className="mt-6 divide-y divide-lc-border rounded-2xl border border-lc-border bg-lc-card px-6">
              {faqs.map((item, i) => (
                <div key={i} className="py-6">
                  <dt className="font-semibold text-lc-text">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-lc-text2">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* Cross-link */}
      <section className="border-t border-lc-border py-8">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <Link href={crossLinkHref} className={`${accent.text} hover:underline`}>
            {crossLinkLabel}
          </Link>
        </div>
      </section>
    </>
  );
}
