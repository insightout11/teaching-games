'use client';

import { Button } from './button';
import { useRouter } from 'next/navigation';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
}

export function PaywallModal({ open, onClose }: PaywallModalProps) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-lc-card rounded-2xl shadow-2xl border border-lc-border max-w-md w-full p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-lc-amber/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-lc-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-lc-text">You&apos;ve used your free Test Flights</h2>
          <p className="text-sm text-lc-text3">
            Upgrade to Pro to keep teaching live — unlimited lessons, saved classes, and full debriefs.
          </p>
        </div>

        {/* Upgrade CTA */}
        <div className="bg-gradient-to-br from-lc-blue/5 to-purple-500/5 rounded-xl border border-lc-blue/20 p-4 space-y-3">
          <ul className="space-y-1.5 text-sm text-lc-text2">
            {[
              'Unlimited live lessons',
              'Saved & reusable Flight Plans',
              'Full session history and debriefs',
              'Source-based lessons from video, text, and PDF',
              'Custom topics for your exact curriculum',
            ].map((benefit) => (
              <li key={benefit} className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-lc-blue shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => {
              onClose();
              router.push('/pro');
            }}
          >
            Upgrade to Pro
          </Button>
        </div>

        {/* Dismiss */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="text-xs text-lc-text3 hover:text-lc-text2 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
