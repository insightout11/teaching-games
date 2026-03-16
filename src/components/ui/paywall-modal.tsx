'use client';

import { useState } from 'react';
import { Button } from './button';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  creditsUsed?: number;
  isVerified?: boolean;
}

/**
 * Paywall modal shown when a teacher's generation credits are exhausted.
 * Offers email verification (if not verified) or Pro upgrade.
 */
export function PaywallModal({ open, onClose, creditsUsed = 0, isVerified = false }: PaywallModalProps) {
  const [verifying, setVerifying] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  if (!open) return null;

  async function handleVerifyEmail() {
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-email', { method: 'POST' });
      if (res.ok) {
        setVerificationSent(true);
      }
    } catch {
      // Silently fail — verification flow is non-critical
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-lc-card rounded-2xl shadow-2xl border border-lc-border max-w-md w-full p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-lc-text">Free sessions used</h2>
          <p className="text-sm text-lc-text3">
            You&apos;ve used all {creditsUsed} free session generations.
            {!isVerified
              ? ' Verify your email for 3 more, or upgrade to Pro for unlimited.'
              : ' Upgrade to Pro for unlimited content generation.'}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Email verification — only if not yet verified */}
          {!isVerified && (
            <div className="bg-lc-surface rounded-xl border border-lc-border p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-lc-text">Verify your email</p>
                  <p className="text-xs text-lc-text3 mt-0.5">Get 3 more free sessions instantly</p>
                </div>
              </div>
              {verificationSent ? (
                <p className="text-xs text-emerald-400 font-medium">Check your inbox — verification email sent!</p>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleVerifyEmail}
                  disabled={verifying}
                  className="w-full"
                >
                  {verifying ? 'Sending...' : 'Send verification email'}
                </Button>
              )}
            </div>
          )}

          {/* Pro upgrade */}
          <div className="bg-gradient-to-br from-lc-blue/5 to-purple-500/5 rounded-xl border border-lc-blue/20 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-lc-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-lc-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-lc-text">Upgrade to Pro</p>
                <p className="text-xs text-lc-text3 mt-0.5">Unlimited AI content generation, session notes, and more</p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => {
                // Stripe checkout — not yet wired. Opens settings page for now.
                window.location.href = '/settings?tab=billing';
              }}
            >
              Upgrade to Pro
            </Button>
          </div>
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
