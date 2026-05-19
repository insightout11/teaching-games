'use client';

import Link from 'next/link';
import { useTeacherTier } from '@/hooks/use-teacher-tier';

export function CreditBadge() {
  const { loading, isPro, credits } = useTeacherTier();

  if (loading) return null;

  if (isPro) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-lc-blue/15 text-lc-blue font-medium">
        Pro
      </span>
    );
  }

  if (credits >= 3) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
        {credits} Test Flight{credits !== 1 ? 's' : ''} left
      </span>
    );
  }

  if (credits === 2) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">
        2 Test Flights left
      </span>
    );
  }

  if (credits === 1) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-medium">
        1 Test Flight left
      </span>
    );
  }

  return (
    <Link
      href="/pro"
      className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium hover:bg-red-500/20 transition-colors"
    >
      Upgrade to Pro
    </Link>
  );
}
