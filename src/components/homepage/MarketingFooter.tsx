import Link from 'next/link';

const LINKS = [
  { label: 'Classroom Games', href: '/classroom-games' },
  { label: 'Classroom Activities', href: '/classroom-activities' },
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
        <nav className="flex items-center gap-5">
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
