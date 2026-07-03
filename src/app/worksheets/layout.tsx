import Image from 'next/image';
import Link from 'next/link';

const FOOTER_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Showcase', href: '/showcase' },
  { label: 'Video to Lesson', href: '/video-lesson' },
  { label: 'Classroom Games', href: '/classroom-games' },
  { label: 'No-Device Games', href: '/classroom-games/no-devices' },
  { label: 'Classroom Activities', href: '/classroom-activities' },
  { label: 'Pro', href: '/pro' },
];

export default function WorksheetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-lc-bg text-lc-text">
      <header className="sticky top-0 z-50 border-b border-lc-border bg-lc-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/lessoncaptain-logo-on-dark-v2.svg"
              alt="LessonCaptain"
              width={150}
              height={24}
              unoptimized
              priority
              className="h-7 w-auto sm:h-8"
            />
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/classroom-games" className="text-sm font-medium text-lc-text3 transition-colors hover:text-lc-blue">
              Games
            </Link>
            <Link href="/classroom-activities" className="text-sm font-medium text-lc-text3 transition-colors hover:text-lc-blue">
              Activities
            </Link>
            <Link href="/video-lesson" className="text-sm font-medium text-lc-text3 transition-colors hover:text-lc-blue">
              Video to Lesson
            </Link>
            <Link href="/showcase" className="text-sm font-medium text-lc-text3 transition-colors hover:text-lc-blue">
              Showcase
            </Link>
          </nav>
          <Link
            href="/login"
            className="whitespace-nowrap rounded-lg bg-lc-blue px-4 py-2 text-sm font-semibold text-[#070B14] transition-colors hover:bg-lc-blue-hover"
          >
            Try free
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {/* Worksheet page content still assumes a light page (unchanged per this pass —
            only the shared chrome moved to the dark brand); float it as a readable
            panel on the dark shell instead of leaving it flush against lc-bg. */}
        <div className="rounded-2xl bg-white p-6 text-gray-900 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] sm:p-10">
          {children}
        </div>
      </main>
      <footer className="border-t border-lc-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-lc-text3">&copy; {new Date().getFullYear()} LessonCaptain</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs text-lc-text3 transition-colors hover:text-lc-text">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
