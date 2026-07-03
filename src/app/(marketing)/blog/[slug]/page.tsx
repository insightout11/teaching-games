import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { BLOG_POSTS, getBlogPost } from '@/lib/marketing/blog-posts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lessoncaptain.com';

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getBlogPost(params.slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: `${post.title} | LessonCaptain`,
    description: post.description,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.description },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'LessonCaptain' },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="px-6 py-14">
        <div className="mx-auto max-w-3xl">
          <Link href="/blog" className="text-sm font-medium text-lc-blue hover:text-lc-blue-hover">
            Blog
          </Link>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-lc-text sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-lc-text2">{post.description}</p>
          <p className="mt-4 text-sm text-lc-text3">
            {post.audience} · {post.date}
          </p>

          <div className="mt-10 space-y-10">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-bold text-lc-text">{section.heading}</h2>
                <div className="mt-4 space-y-4 text-base leading-relaxed text-lc-text2">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-12 rounded-2xl border border-cyan-300/20 bg-lc-card p-6">
            <h2 className="text-xl font-bold text-lc-text">Try it in LessonCaptain</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {post.links.map((link) => (
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
          </section>
        </div>
      </article>
    </>
  );
}
