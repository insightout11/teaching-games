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

export default function ClassroomActivitiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-lc-bg text-lc-text">
      <header className="sticky top-0 z-50 border-b border-lc-border bg-lc-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/lessoncaptain-logo-on-dark.svg"
              alt="LessonCaptain"
              width={150}
              height={24}
              unoptimized
              priority
              className="h-7 w-auto sm:h-8"
            />
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/classroom-games" className="text-sm font-medium text-lc-text3 transition-colors hover:text-emerald-400">
              Games
            </Link>
            <Link href="/classroom-activities" className="text-sm font-medium text-lc-text2 transition-colors hover:text-emerald-400">
              Activities
            </Link>
            <Link href="/video-lesson" className="text-sm font-medium text-lc-text3 transition-colors hover:text-emerald-400">
              Video to Lesson
            </Link>
            <Link href="/showcase" className="text-sm font-medium text-lc-text3 transition-colors hover:text-emerald-400">
              Showcase
            </Link>
          </nav>
          <Link
            href="/login"
            className="whitespace-nowrap rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#03150f] transition-colors hover:bg-emerald-400"
          >
            Try free
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
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
