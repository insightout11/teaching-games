import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BLOG_POSTS } from '@/lib/marketing/blog-posts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lessoncaptain.com';

export const metadata: Metadata = {
  title: 'ESL Teaching Ideas | LessonCaptain Blog',
  description:
    'Practical online ESL teaching ideas: live games, conversation activities, video lessons, and student participation.',
  alternates: { canonical: `${SITE_URL}/blog` },
};

export default function BlogIndexPage() {
  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-lc-blue">
          ESL teaching ideas
        </p>
        <h1 className="mt-3 text-4xl font-bold text-lc-text sm:text-5xl">
          Practical ideas for live online English lessons
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-lc-text2">
          Short guides for teachers who want students doing more than watching a screen share.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="rounded-2xl border border-lc-border bg-lc-card p-6 transition-colors hover:border-cyan-300/50"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                {post.audience}
              </p>
              <h2 className="mt-3 text-xl font-bold leading-snug text-lc-text">{post.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-lc-text3">{post.description}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-lc-blue">
                Read guide
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
