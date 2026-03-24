'use client';

import { useTeacherTier } from '@/hooks/use-teacher-tier';

/**
 * Tier badge shown in the sidebar.
 *
 * Pro → blue "Pro" pill
 * Standard + credits remaining → green "N Pro experiences left" pill
 * Standard + no credits → amber "Standard" pill
 */
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

  if (credits > 0) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
        {credits} Pro experience{credits !== 1 ? 's' : ''} left
      </span>
    );
  }

  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-lc-surface text-lc-text3 font-medium border border-lc-border">
      Standard
    </span>
  );
}
