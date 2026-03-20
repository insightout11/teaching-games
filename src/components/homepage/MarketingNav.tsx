'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-lc-bg/80 backdrop-blur-md border-b border-lc-border'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lessoncaptain-logo-on-dark.svg"
            alt="LessonCaptain"
            width={160}
            height={32}
          />
        </Link>

        <Link
          href="/login"
          className="px-4 py-2 rounded-lg bg-lc-blue text-[#070B14] font-semibold text-sm hover:bg-lc-blue-hover transition-colors"
        >
          Start a Test Flight
        </Link>
      </div>
    </header>
  );
}
