'use client';

import { Users, Link2, Hash } from 'lucide-react';

export function CrewBoardingCard() {
  return (
    <div className="bg-lc-card rounded-xl border border-lc-border p-6">
      <h3 className="text-sm font-semibold text-lc-text2 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Users className="w-4 h-4" />
        Crew Boarding
      </h3>

      <div className="space-y-4 opacity-50">
        <div className="flex items-center gap-3 p-3 bg-lc-surface rounded-lg">
          <Link2 className="w-4 h-4 text-lc-text3" />
          <div className="flex-1">
            <p className="text-xs text-lc-text3">Join URL</p>
            <div className="h-5 bg-lc-border/50 rounded mt-1" />
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-lc-surface rounded-lg">
          <Hash className="w-4 h-4 text-lc-text3" />
          <div className="flex-1">
            <p className="text-xs text-lc-text3">Join Code</p>
            <div className="h-5 bg-lc-border/50 rounded mt-1" />
          </div>
        </div>

        <div className="p-4 bg-lc-surface rounded-lg text-center">
          <p className="text-sm text-lc-text3">Students will appear here after launch</p>
        </div>
      </div>
    </div>
  );
}
