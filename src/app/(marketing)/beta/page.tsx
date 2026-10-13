import type { Metadata } from 'next';
import Link from 'next/link';
import { BetaApplicationForm } from './BetaApplicationForm';

export const metadata: Metadata = {
  title: 'Founding Crew | LessonCaptain',
  description: 'Join the LessonCaptain Founding Crew: teach real lessons with it, tell us what happened, and fly Pro for free. Half price for life afterwards.',
  alternates: { canonical: '/beta' },
};

// The Founding Crew page (Oct 2026; was "Teacher beta"). One name, one offer: Pro free while the beta runs, half
// price for life afterwards, and a say in what gets built. The application itself is BetaApplicationForm: what it
// saves and how it is checked are unchanged.

const OFFER = [
  { when: 'Now', what: 'Pro, free' },
  { when: 'After the beta', what: 'Half price, for life' },
  { when: 'Always', what: 'A say in what is built' },
];

const ASK: Array<[string, string]> = [
  ['Use it in real lessons.', 'A few classes is enough to know if it works for you.'],
  ['Tell us what happened.', 'A short message now and then: what worked, what broke, what you wished it did.'],
  ['That is all.', 'No fees, no posts to write, no commitment to stay.'],
];

export default function BetaPage({ searchParams }: { searchParams?: { status?: string } }) {
  const accountMismatch = searchParams?.status === 'account-mismatch';
  const linkageError = searchParams?.status === 'linkage-error';

  return (
    <div className="px-5 pb-20 pt-10 sm:px-6 sm:pt-14">
      <div className="mx-auto max-w-6xl">
        <section className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <p className="font-instrument text-[13px] font-semibold uppercase tracking-[0.14em] text-lc-amber">The first teachers on board</p>
            <h1 className="font-game mt-4 text-[2.75rem] leading-[1.05] text-white sm:text-6xl">Join the Founding Crew.</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl">
              LessonCaptain is new, and it is being shaped by the teachers who use it first. Teach real lessons with it, tell us what happened, and fly Pro for free.
            </p>

            <div className="mt-8 grid overflow-hidden rounded-2xl bg-[#f4efe3] text-[#1b2233] shadow-[0_24px_60px_rgba(0,0,0,.5)] sm:grid-cols-[minmax(0,1fr)_180px]">
              <div className="flex min-w-0 flex-col gap-3 p-6">
                <p className="font-instrument text-[13px] font-semibold uppercase tracking-[0.12em] text-[#4b566b]">Boarding pass · Founding Crew</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                  {OFFER.map((o) => (
                    <div key={o.when}>
                      <dt className="font-instrument text-[13px] font-semibold uppercase tracking-[0.1em] text-[#4b566b]">{o.when}</dt>
                      <dd className="font-game text-[1.4rem] leading-tight">{o.what}</dd>
                    </div>
                  ))}
                </dl>
                <ul className="list-disc space-y-1 pl-5 text-[17px]">
                  <li>Unlimited lessons, courses and your own books while the beta runs</li>
                  <li>$4.50 a month or $39.50 a year afterwards, for as long as you stay</li>
                  <li>Your feedback goes straight to the person building it</li>
                </ul>
              </div>
              <div className="relative flex flex-col items-center justify-center gap-3 border-t-[3px] border-dashed border-[#1b2233]/30 px-4 py-5 text-center sm:border-l-[3px] sm:border-t-0">
                <span aria-hidden className="absolute -left-[11px] -top-[12px] h-[22px] w-[22px] rounded-full bg-[#2a5a99] sm:-left-[12px] sm:-top-[11px]" />
                <span aria-hidden className="absolute -right-[11px] -top-[12px] h-[22px] w-[22px] rounded-full bg-[#2a5a99] sm:-bottom-[11px] sm:-left-[12px] sm:right-auto sm:top-auto" />
                <p className="font-instrument text-[13px] font-semibold uppercase tracking-[0.12em] text-[#4b566b]">Seats are limited</p>
                <div aria-hidden className="hidden h-10 w-[110px] sm:block" style={{ background: 'repeating-linear-gradient(90deg,#1b2233 0 3px,transparent 3px 5px,#1b2233 5px 6px,transparent 6px 10px)' }} />
                <a href="#apply" className="inline-flex min-h-[50px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-300 to-orange-400 px-3 text-base font-semibold text-[#1a1204] transition hover:brightness-105">Apply to join</a>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-[#2a4166] bg-[#0b1524]/90 p-6">
              <h2 className="font-game text-2xl text-white sm:text-3xl">What we ask in return</h2>
              <ul className="mt-4 space-y-3">
                {ASK.map(([title, body]) => (
                  <li key={title} className="relative pl-7 text-[17px] text-white/80">
                    <span aria-hidden className="absolute left-1 top-[11px] h-2.5 w-2.5 rounded-full bg-lc-amber" />
                    <b className="font-semibold text-white">{title}</b> {body}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <h2 className="font-game text-2xl text-white sm:text-3xl">Not ready to apply?</h2>
              <p className="mt-2 max-w-xl text-[17px] text-white/85">You do not need the Founding Crew to start. Every teacher gets 4 full lessons free every month, for good.</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link href="/login" className="inline-flex min-h-[50px] items-center justify-center rounded-xl bg-white px-6 text-base font-semibold text-[#1b2233] transition hover:bg-white/90">Start a Test Flight</Link>
                <Link href="/" className="text-[17px] font-semibold text-white underline underline-offset-4">See what LessonCaptain does</Link>
              </div>
            </div>
          </div>

          <BetaApplicationForm accountMismatch={accountMismatch} linkageError={linkageError} />
        </section>
      </div>
    </div>
  );
}
