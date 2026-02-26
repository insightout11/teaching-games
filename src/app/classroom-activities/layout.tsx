import Link from 'next/link';

export default function ClassroomActivitiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/classroom-activities" className="text-lg font-bold text-emerald-600">
            LessonCaptain
          </Link>
          <nav className="hidden gap-6 text-sm text-gray-600 sm:flex">
            <Link href="/classroom-games" className="hover:text-blue-600">
              Games
            </Link>
            <Link href="/classroom-activities" className="hover:text-emerald-600">
              Activities
            </Link>
            <Link href="/worksheets" className="hover:text-blue-600">
              Worksheets
            </Link>
          </nav>
          <Link
            href="/login"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
          >
            Try free
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-gray-200 bg-gray-50 py-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} LessonCaptain &middot;{' '}
        <Link href="/classroom-games" className="hover:underline">
          Games
        </Link>{' '}
        &middot;{' '}
        <Link href="/classroom-activities" className="hover:underline">
          Activities
        </Link>{' '}
        &middot;{' '}
        <Link href="/worksheets" className="hover:underline">
          Worksheets
        </Link>
      </footer>
    </div>
  );
}
