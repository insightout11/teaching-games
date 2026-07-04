import type { Metadata } from 'next';
import { getActivitiesGrouped, CATEGORY_INFO } from '@/activities/registry';
import { HubPage } from '@/components/landing/HubPage';
import { ACTIVITY_CATEGORY_SLUGS, getActivityContent } from '@/lib/content-landing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lessoncaptain.com';

export function generateMetadata(): Metadata {
  return {
    title: 'Classroom Activities for ESL Teachers — LessonCaptain',
    description:
      'AI-powered ESL speaking activities. Discussions, debates, and roleplay for any class topic. No preparation needed. Free to try.',
    alternates: { canonical: `${SITE_URL}/classroom-activities` },
    openGraph: {
      title: 'Classroom Activities for ESL Teachers — LessonCaptain',
      description:
        'AI-powered ESL speaking activities. Discussions, debates, and roleplay for any class topic. No preparation needed. Free to try.',
    },
    ...(process.env.LANDING_PAGES_NOINDEX ? { robots: 'noindex,nofollow' } : {}),
  };
}

export default function ClassroomActivitiesHub() {
  const grouped = getActivitiesGrouped();

  const categories = (
    Object.entries(ACTIVITY_CATEGORY_SLUGS) as [keyof typeof ACTIVITY_CATEGORY_SLUGS, string][]
  ).map(([registryKey, displaySlug]) => {
    const info = CATEGORY_INFO[registryKey as keyof typeof CATEGORY_INFO];
    return {
      slug: displaySlug,
      name: info.name,
      description: info.description,
      plugins: (grouped[registryKey as keyof typeof grouped] ?? []).filter((plugin) =>
        getActivityContent(plugin.key)
      ),
    };
  });

  return (
    <HubPage
      type="activity"
      categories={categories}
      crossLinkHref="/classroom-games"
      crossLinkLabel="Looking for scored games? Browse classroom games →"
      guideLinks={[
        {
          label: 'ESL speaking activities',
          href: '/esl-speaking-activities',
          description: 'Structured role-play, debate, decision, and reflection formats for online English classes.',
        },
        {
          label: 'Online ESL games',
          href: '/online-esl-games',
          description: 'A broader guide to live ESL games students can join from any browser.',
        },
        {
          label: 'ESL vocabulary games',
          href: '/esl-vocabulary-games',
          description: 'Vocabulary activities for recall, word connections, video lessons, and speaking reuse.',
        },
      ]}
    />
  );
}
