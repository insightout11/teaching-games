'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
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
          <Image
            src="/lessoncaptain-logo-on-dark-v2.svg"
            alt="LessonCaptain"
            width={360}
            height={58}
            unoptimized
            priority
            className="h-7 w-auto sm:h-10"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#how-it-works" className="text-sm font-medium text-lc-text3 hover:text-lc-blue transition-colors">
            How it works
          </Link>
          <Link href="/showcase" className="text-sm font-medium text-lc-text3 hover:text-lc-blue transition-colors">
            Explore
          </Link>
          <Link href="/pro" className="text-sm font-medium text-lc-text3 hover:text-lc-blue transition-colors">
            Pricing
          </Link>
        </nav>

        <Link
          href="/login"
          className="px-4 py-2 rounded-lg bg-lc-blue text-[#070B14] font-semibold text-sm hover:bg-lc-blue-hover transition-colors whitespace-nowrap"
        >
          <span className="hidden sm:inline">Start a Test Flight</span>
          <span className="sm:hidden">Try free</span>
        </Link>
      </div>
    </header>
  );
}
