import Link from 'next/link';

const LINKS = [
  { label: 'Showcase', href: '/showcase' },
  { label: 'Classroom Games', href: '/classroom-games' },
  { label: 'Classroom Activities', href: '/classroom-activities' },
  { label: 'Video to Lesson', href: '/video-lesson' },
  { label: 'Blog', href: '/blog' },
  { label: 'AI Lesson Generator', href: '/ai-esl-lesson-plan-generator' },
  { label: 'Pricing', href: '/pro' },
  { label: 'Login', href: '/login' },
];

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-lc-border py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-lc-text3">
          © {year} LessonCaptain. All rights reserved.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-lc-text3 hover:text-lc-text transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
