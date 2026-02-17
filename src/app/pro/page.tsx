import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pro — LessonCaptain",
  robots: "noindex",
};

export default function ProPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-900">Pro coming soon</h1>
        <p className="mt-3 text-gray-600">
          Get full worksheet packs, priority updates, and more. Join the
          waitlist and we&apos;ll let you know when it&apos;s ready.
        </p>
        <p className="mt-6 text-sm text-gray-400">
          <Link href="/worksheets" className="text-blue-600 hover:underline">
            &larr; Back to worksheets
          </Link>
        </p>
      </div>
    </div>
  );
}
