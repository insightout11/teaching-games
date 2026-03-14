import Image from 'next/image';

export default function WorksheetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="/worksheets" className="flex items-center gap-2">
            <Image src="/lessoncaptain-logo-on-light.svg" alt="LessonCaptain" width={150} height={24} className="h-auto" />
            <span className="text-lg font-bold text-blue-600">Worksheets</span>
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      <footer className="border-t border-gray-200 bg-gray-50 py-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} LessonCaptain
      </footer>
    </div>
  );
}
