'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { LEARNER_LEVELS } from '@/lib/beta/application';
import { initPostHog, trackEvent } from '@/lib/analytics/posthog';
import {
  betaAnalyticsProperties,
  sanitizeBetaAttribution,
  type BetaAttribution,
} from '@/lib/beta/attribution';

type Status = 'idle' | 'submitting' | 'success' | 'error';
const LEVEL_LABELS: Record<(typeof LEARNER_LEVELS)[number], string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  'pre-intermediate': 'Pre-intermediate',
  intermediate: 'Intermediate',
  'upper-intermediate': 'Upper-intermediate',
  advanced: 'Advanced',
  mixed: 'Mixed levels',
};

export function BetaApplicationForm({ accountMismatch = false, linkageError = false }: { accountMismatch?: boolean; linkageError?: boolean }) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [next, setNext] = useState('/login?next=/home');
  const attribution = useRef<BetaAttribution>(sanitizeBetaAttribution(null));

  useEffect(() => {
    initPostHog();
    const params = new URLSearchParams(window.location.search);
    attribution.current = sanitizeBetaAttribution({
      landingPath: window.location.pathname,
      referrer: document.referrer || undefined,
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      utmContent: params.get('utm_content') || undefined,
      utmTerm: params.get('utm_term') || undefined,
    });
    trackEvent('beta_page_viewed', betaAnalyticsProperties(attribution.current));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    setError('');

    const form = new FormData(event.currentTarget);
    const selectedLevels = form.getAll('learnerLevels');
    if (selectedLevels.length === 0) {
      setError('Choose at least one learner level.');
      setStatus('error');
      return;
    }
    const payload = {
      firstName: form.get('firstName'),
      email: form.get('email'),
      teachingFormat: form.get('teachingFormat'),
      learnerLevels: selectedLevels,
      learnerAgeBand: form.get('learnerAgeBand'),
      typicalClassSize: form.get('typicalClassSize'),
      teachingPlatform: form.get('teachingPlatform'),
      biggestChallenge: form.get('biggestChallenge'),
      contactConsent: form.get('contactConsent') === 'on',
      website: form.get('website'),
      attribution: attribution.current,
    };

    try {
      const response = await fetch('/api/beta/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null) as { error?: string; next?: string } | null;
      if (!response.ok) throw new Error(result?.error || 'Please check the form and try again.');
      setNext(result?.next || '/login?next=/home');
      setStatus('success');
      trackEvent('beta_application_submitted', betaAnalyticsProperties(attribution.current));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Please try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-3xl border border-emerald-300/25 bg-lc-card/90 p-7 shadow-2xl sm:p-9" role="status">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-300/15 text-emerald-300">
          <Check className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-white">Application received</h2>
        <p className="mt-3 leading-relaxed text-lc-text2">
          Thanks. Continue to LessonCaptain. If you are not signed in yet, use Google with the same email address so we can securely connect your teacher account to the beta.
        </p>
        <Link
          href={next}
          onClick={() => {
            if (next !== '/home') {
              trackEvent('beta_google_signin_started', betaAnalyticsProperties(attribution.current));
            }
          }}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lc-blue px-5 py-3 font-bold text-[#070B14] transition-colors hover:bg-lc-blue-hover"
        >
          {next === '/home' ? 'Continue to LessonCaptain' : 'Continue with Google'} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-lc-blue/25 bg-lc-card/90 p-6 shadow-2xl backdrop-blur-md sm:p-8">
      <h2 className="text-2xl font-bold text-white">Join the Teacher Beta</h2>
      <p className="mt-2 text-sm leading-relaxed text-lc-text2">A short application—about two minutes.</p>

      {accountMismatch && (
        <div className="mt-5 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-relaxed text-amber-100" role="alert">
          You are signed in with a different Google email. To continue with this account, submit the form using its email. To use the originally submitted email, sign out first and then return with that Google account.
        </div>
      )}
      {linkageError && (
        <div className="mt-5 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-relaxed text-amber-100" role="alert">
          Your Google sign-in succeeded, but beta linking did not. Resubmit this form with the same signed-in email to retry securely—another Google sign-in is not required.
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" name="firstName" autoComplete="given-name" required maxLength={80} />
          <Field label="Email" name="email" type="email" autoComplete="email" required maxLength={254} />
        </div>

        <input type="hidden" name="teachingFormat" value="online" />
        <div className="rounded-xl border border-lc-border bg-lc-surface px-4 py-3">
          <p className="text-sm font-semibold text-lc-text">Teaching format</p>
          <p className="mt-1 text-sm text-lc-text2">Online</p>
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-lc-text">Learner level(s) <span aria-hidden="true">*</span></legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LEARNER_LEVELS.map((level) => (
              <label key={level} className="flex cursor-pointer items-center gap-2 rounded-lg border border-lc-border bg-lc-surface px-3 py-2 text-xs text-lc-text2 has-[:checked]:border-lc-blue/60 has-[:checked]:text-white">
                <input type="checkbox" name="learnerLevels" value={level} className="accent-blue-400" />
                {LEVEL_LABELS[level]}
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-lc-text3">Choose all that apply.</p>
          {status === 'error' && error === 'Choose at least one learner level.' && (
            <p className="mt-1.5 text-xs text-red-200" role="alert">{error}</p>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Learner age band (optional)" name="learnerAgeBand" options={[
            ['', 'Choose one'], ['children', 'Children'], ['teens', 'Teens'], ['adults', 'Adults'], ['mixed', 'Mixed ages'],
          ]} />
          <Select label="Typical class size (optional)" name="typicalClassSize" options={[
            ['', 'Choose one'], ['1', 'One-to-one'], ['2-5', '2–5 learners'], ['6-12', '6–12 learners'], ['13+', '13+ learners'],
          ]} />
        </div>

        <Field label="Teaching platform (optional)" name="teachingPlatform" placeholder="Zoom, classroom projector…" maxLength={80} />
        <label className="block">
          <span className="text-sm font-semibold text-lc-text">Biggest lesson challenge (optional)</span>
          <textarea name="biggestChallenge" maxLength={1000} rows={3} className={inputClass} placeholder="What slows you down or makes participation difficult?" />
        </label>

        <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label>Website<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
        </div>

        <label className="flex items-start gap-3 text-sm leading-relaxed text-lc-text2">
          <input type="checkbox" name="contactConsent" required className="mt-1 accent-blue-400" />
          <span>
            I agree that Lesson Captain may contact me about beta access, onboarding, and feedback as described in the{' '}
            <Link href="/privacy" className="font-semibold text-lc-blue underline decoration-lc-blue/40 underline-offset-2 hover:text-lc-blue-hover">
              Teacher Beta Privacy Notice
            </Link>. <span aria-hidden="true">*</span>
          </span>
        </label>

        {status === 'error' && error !== 'Choose at least one learner level.' && <p className="rounded-lg bg-red-400/10 p-3 text-sm text-red-200" role="alert">{error}</p>}

        <button type="submit" disabled={status === 'submitting'} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lc-blue px-5 py-3 font-bold text-[#070B14] transition-colors hover:bg-lc-blue-hover disabled:cursor-wait disabled:opacity-60">
          {status === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ArrowRight className="h-4 w-4" aria-hidden />}
          {status === 'submitting' ? 'Sending application…' : 'Join the Teacher Beta'}
        </button>
        <p className="text-center text-xs text-lc-text3">Students do not need accounts. Teacher access uses Google sign-in.</p>
      </form>
    </div>
  );
}

const inputClass = 'mt-2 w-full rounded-xl border border-lc-border bg-lc-surface px-3.5 py-2.5 text-sm text-lc-text outline-none placeholder:text-lc-text3 focus:border-lc-blue/60 focus:ring-1 focus:ring-lc-blue/30';

function Field({ label, name, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return <label className="block"><span className="text-sm font-semibold text-lc-text">{label}{props.required && ' *'}</span><input name={name} {...props} className={inputClass} /></label>;
}

function Select({ label, name, options, required }: { label: string; name: string; options: [string, string][]; required?: boolean }) {
  return <label className="block"><span className="text-sm font-semibold text-lc-text">{label}{required && ' *'}</span><select name={name} required={required} className={inputClass}>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>;
}
