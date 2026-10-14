export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Minus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing | LessonCaptain',
  description: 'Students never pay. Teach four full lessons free every month, for good. Pro adds unlimited lessons, courses, your own books and per-student notes.',
};

// The pricing page (Oct 2026): the same two boarding passes as the home page, an honest table of what is free and
// what Pro adds (only things the product really limits to Pro), and how to get Pro today. While the beta runs, Pro
// is given through the Founding Crew, so nothing here says "coming soon".

const FARES = [
  {
    id: 'free',
    label: 'Test Flight · free, for good',
    price: '$0',
    per: '',
    alt: '',
    items: ['4 full lessons every month', 'The live room and all 40+ games and activities', 'All seven flights', 'World Flight for all your classes'],
    cta: 'Start a Test Flight',
    href: '/login',
    note: '',
    gold: false,
  },
  {
    id: 'pro',
    label: 'Pro · for weekly teaching',
    price: '$9',
    per: ' a month',
    alt: 'or $79 a year',
    items: ['Unlimited lessons', 'Any YouTube video read in full, live in the lesson', 'Courses that remember where each class stopped', 'Reading courses from your own books', 'Notes and progress drafts for each student'],
    cta: 'Get Pro',
    href: '/beta#apply',
    note: 'Through the Founding Crew for now',
    gold: true,
  },
];

const ROWS: Array<[string, string | boolean, string | boolean]> = [
  ['Teach full live lessons', '4 a month', 'Unlimited'],
  ['Use the live room, every game and every flight', true, true],
  ['Start from any topic, video, article or page', true, true],
  ['Have any YouTube video read in full during the lesson, so its activities follow what it says (library videos are ready on every plan)', false, true],
  ['Fly World Flight: stamps, planes, expeditions', true, true],
  ['Have students join free, with no accounts', true, true],
  ['Build multi-lesson courses', false, true],
  ['Turn your own books into reading courses', false, true],
  ['Keep notes and progress drafts for each student', false, true],
];

const FAQ = [
  { q: 'How do I get Pro today?', a: 'Through the Founding Crew. Apply, and if there is a seat you get Pro free while the beta runs. Paying by card opens when the beta ends.' },
  { q: 'What counts as one lesson?', a: 'Each class you start counts as one lesson, whether it is a single game, an activity or a full flight, however long it runs. Free teachers get 4 every month, and they come back on the 1st.' },
  { q: 'Do the free lessons run out?', a: 'No. You get four every calendar month for as long as you teach.' },
  { q: 'Do students or parents pay anything?', a: 'No. Students join with a link or a code and never need an account.' },
  { q: 'Is there a school or team plan?', a: 'Not yet. Email hello@lessoncaptain.com if you need access for several teachers.' },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <span className="inline-flex items-center gap-1 font-semibold text-emerald-300"><Check className="h-4 w-4" aria-hidden />Yes</span>;
  if (value === false) return <span className="inline-flex items-center gap-1 text-white/45"><Minus className="h-4 w-4" aria-hidden />No</span>;
  return <span className={value === 'Unlimited' ? 'font-semibold text-emerald-300' : 'text-white'}>{value}</span>;
}

export default function ProPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-1 py-8 sm:px-4 sm:py-12">
      <div>
        <p className="font-instrument text-[13px] font-semibold uppercase tracking-[0.14em] text-lc-amber">Pricing</p>
        <h1 className="font-game mt-3 text-4xl leading-[1.06] text-white sm:text-6xl">Students never pay. Start free.</h1>
        <p className="mt-4 max-w-2xl text-lg text-white/85 sm:text-xl">Teach four full lessons every month at no cost, for as long as you like. Go Pro when you teach every week.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {FARES.map((f) => (
          <div key={f.id} className="grid overflow-hidden rounded-2xl bg-[#f4efe3] text-[#1b2233] shadow-[0_24px_60px_rgba(0,0,0,.5)] sm:grid-cols-[minmax(0,1fr)_190px]">
            <div className="flex min-w-0 flex-col gap-2 p-6">
              <p className="font-instrument text-[13px] font-semibold uppercase tracking-[0.12em] text-[#4b566b]">{f.label}</p>
              <p className="font-game text-[3.25rem] leading-none">{f.price}{f.per && <span className="text-xl">{f.per}</span>}</p>
              {f.alt && <p className="text-[17px] text-[#4b566b]">{f.alt}</p>}
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[17px]">{f.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div className="relative flex flex-col items-center justify-center gap-3 border-t-[3px] border-dashed border-[#1b2233]/30 px-4 py-5 text-center sm:border-l-[3px] sm:border-t-0">
              <span aria-hidden className="absolute -left-[11px] -top-[12px] h-[22px] w-[22px] rounded-full bg-[#0b1322] sm:-left-[12px] sm:-top-[11px]" />
              <span aria-hidden className="absolute -right-[11px] -top-[12px] h-[22px] w-[22px] rounded-full bg-[#0b1322] sm:-bottom-[11px] sm:-left-[12px] sm:right-auto sm:top-auto" />
              <div aria-hidden className="hidden h-10 w-[110px] sm:block" style={{ background: 'repeating-linear-gradient(90deg,#1b2233 0 3px,transparent 3px 5px,#1b2233 5px 6px,transparent 6px 10px)' }} />
              <Link href={f.href} className={`inline-flex min-h-[50px] w-full items-center justify-center rounded-xl px-3 text-base font-semibold leading-tight transition hover:brightness-105 ${f.gold ? 'bg-gradient-to-r from-amber-300 to-orange-400 text-[#1a1204]' : 'bg-[#1b2233] text-[#f4efe3]'}`}>{f.cta}</Link>
              {f.note && <p className="text-sm text-[#4b566b]">{f.note}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-2xl border border-lc-amber/40 bg-lc-amber/[0.08] p-6">
        <div className="min-w-0">
          <h2 className="font-game text-2xl text-white sm:text-3xl">Founding Crew: Pro is free during the beta.</h2>
          <p className="mt-1 text-[17px] text-white/85">The first teachers on board fly Pro at no cost now, and pay half price for life afterwards.</p>
        </div>
        <Link href="/beta" className="inline-flex min-h-[50px] items-center justify-center rounded-xl bg-gradient-to-r from-amber-300 to-orange-400 px-6 text-base font-semibold text-[#1a1204] transition hover:brightness-105">Apply to join</Link>
      </div>

      <div>
        <h2 className="font-game text-3xl text-white sm:text-4xl">What is free, and what Pro adds</h2>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#2a4166] bg-[#0b1524]/90">
          <table className="w-full min-w-[560px] border-collapse text-[17px]">
            <thead>
              <tr className="text-left">
                <th className="px-4 py-3 font-instrument text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">You can</th>
                <th className="w-[120px] px-4 py-3 text-center font-instrument text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">Free</th>
                <th className="w-[120px] px-4 py-3 text-center font-instrument text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">Pro</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, free, pro]) => (
                <tr key={label} className="border-t border-[#1d2f4d]">
                  <td className="px-4 py-3 text-white/90">{label}</td>
                  <td className="px-4 py-3 text-center"><Cell value={free} /></td>
                  <td className="px-4 py-3 text-center"><Cell value={pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="font-game text-3xl text-white sm:text-4xl">Questions</h2>
        <div className="mt-4">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="border-t border-[#2a4166] py-4">
              <summary className="cursor-pointer text-[19px] font-semibold text-white">{q}</summary>
              <p className="mt-2 max-w-3xl text-[17px] text-white/80">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
