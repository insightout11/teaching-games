import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ComparisonPage } from '@/components/marketing/ComparisonPage';
import { getComparisonPage } from '@/lib/marketing/comparison-pages';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lessoncaptain.com';
const page = getComparisonPage('ai-esl-lesson-plan-generator');

export const metadata: Metadata = page
  ? {
      title: page.title,
      description: page.description,
      alternates: { canonical: `${SITE_URL}/${page.slug}` },
      openGraph: { title: page.title, description: page.description },
    }
  : {};

export default function AiEslLessonPlanGeneratorPage() {
  if (!page) notFound();
  return <ComparisonPage page={page} />;
}
