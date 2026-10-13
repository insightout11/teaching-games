'use client';

// The lower half of the home page: changing course mid-lesson, the student phone, the seven flights, who made it,
// the questions teachers ask first, and the closing call. Everything illustrative is labelled as an example; the
// flights' stages come straight from the presets, so they cannot drift from the product.

import { useState } from 'react';
import Link from 'next/link';
import { PlaneTakeoff } from 'lucide-react';
import { FLIGHT_PLAN_PRESETS } from '@/lib/flight-plan-presets';

const EYEBROW = 'font-instrument text-[13px] font-semibold uppercase tracking-[0.14em] text-lc-amber';
const H2 = 'font-game mt-3 text-3xl leading-tight text-lc-text sm:text-[2.75rem]';
const LEDE = 'mt-4 max-w-2xl text-lg text-lc-text2';
const chip = (on: boolean) => `min-h-[46px] rounded-full border px-4 text-[17px] font-medium transition ${on ? 'border-lc-amber bg-lc-amber font-semibold text-[#1a1204]' : 'border-[#263a58] bg-[#101d31] text-lc-text hover:border-lc-amber/60'}`;

function Points({ items }: { items: Array<[string, string]> }) {
  return (
    <ul className="mt-6 space-y-3.5">
      {items.map(([title, body]) => (
        <li key={title} className="relative pl-7 text-[17px] text-lc-text2">
          <span className="absolute left-1 top-[11px] h-2.5 w-2.5 rounded-full bg-lc-amber" aria-hidden />
          <b className="block font-semibold text-lc-text">{title}</b>
          {body}
        </li>
      ))}
    </ul>
  );
}

// ── Change course mid-flight ─────────────────────────────────────────────────

const DETOURS = [
  { id: 'food', chip: 'Street food', topic: 'Street food', note: 'The plan for today', kind: 'Would you rather', q: 'Eat only street food for a month, or only home cooking?' },
  { id: 'volcano', chip: 'Diego asks: volcanoes?', topic: 'Volcanoes', note: 'Detour · asked by Diego', kind: 'Fact detective', q: 'Three facts about volcanoes. One is false. Which one?' },
  { id: 'word', chip: 'A new word: “queue”', topic: 'The word “queue”', note: 'Detour · a new word', kind: 'Quick fire', q: 'Where do you queue the most, and what do you do while you wait?' },
];

export function ChangeCourseSection() {
  const [id, setId] = useState('food');
  const d = DETOURS.find((x) => x.id === id) ?? DETOURS[0];
  return (
    <section className="border-t border-lc-border bg-[#0b1524] px-5 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div>
          <p className={EYEBROW}>Change course mid-flight</p>
          <h2 className={H2}>A student asks about volcanoes. Go there. Then come back.</h2>
          <p className={LEDE}>The best moments in a lesson are the ones you did not plan. Anything can change the course, and the room follows with fresh activities in seconds. Your original topic waits one tap away.</p>
          <Points items={[
            ['From anything', 'A question a student sends in, a photo, a link, a word nobody knew, or a topic you type.'],
            ['Nothing is lost', 'The room keeps a trail of where the lesson has been, and returns to any point on it.'],
          ]} />
        </div>
        <div className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-[#263a58] bg-[#0b1524] shadow-[0_30px_80px_rgba(0,0,0,.5)]" role="group" aria-label="Example: changing the lesson topic and returning to it">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#263a58] px-4 py-2.5 text-sm text-lc-text2">
              <span>Topic</span><b className="font-semibold text-lc-amber">{d.topic}</b><span className="ml-auto">{d.note}</span>
            </div>
            <div className="flex flex-col gap-3 p-3.5">
              <div className="flex flex-col gap-3 rounded-xl border border-[#263a58] bg-gradient-to-b from-[#132744] to-[#0d1a2c] p-4" aria-live="polite">
                <span className="font-instrument text-[13px] font-semibold uppercase tracking-[0.12em] text-cyan-300">{d.kind}</span>
                <p className="font-game text-2xl leading-tight text-lc-text sm:text-[1.75rem]">{d.q}</p>
              </div>
              <div className="flex flex-wrap gap-2.5" role="group" aria-label="Topic trail">
                {DETOURS.map((x) => <button key={x.id} type="button" aria-pressed={id === x.id} onClick={() => setId(x.id)} className={chip(id === x.id)}>{x.chip}</button>)}
              </div>
            </div>
          </div>
          <p className="mt-2.5 text-[15px] text-lc-text2">An example. Tap a detour, then tap Street food to come back.</p>
        </div>
      </div>
    </section>
  );
}

// ── Phones ───────────────────────────────────────────────────────────────────

function PhoneFrame({ who, title, children }: { who: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[230px] flex-col gap-2 rounded-3xl border-[6px] border-[#0a0f18] bg-[#fbf9f3] px-3 py-3.5 text-[#1b2233] shadow-[0_18px_40px_rgba(0,0,0,.5)]">
      <span className="font-instrument text-[13px] font-semibold text-[#4b566b]">{who}</span>
      <b className="font-game text-xl font-normal">{title}</b>
      {children}
    </div>
  );
}

export function PhonesSection() {
  return (
    <section className="border-t border-lc-border px-5 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div>
          <p className={EYEBROW}>For the students</p>
          <h2 className={H2}>They tap. Then they talk.</h2>
          <p className={LEDE}>Phones are for choosing, voting and buzzing in. The English happens out loud, with you.</p>
          <Points items={[
            ['No typing, no accounts', 'A first name and a seat. That is all a student gives.'],
            ['Everyone answers, not just the fast ones', 'The quiet student votes too, and you can see who has not spoken yet.'],
            ['No phones in your school?', 'Teach from your screen alone: you choose who speaks and mark answers yourself.'],
            ['Young learners', 'Junior mode uses pictures and a read-aloud voice, and never ranks children.'],
          ]} />
        </div>
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <PhoneFrame who="Seat 2B · Mei" title="Which word fits?">
              {['crispy', 'spicy', 'sour'].map((w, i) => <span key={w} className={`rounded-xl border-2 border-[#1b2233] p-2 text-center text-base font-semibold ${i === 1 ? 'bg-[#1b2233] text-white' : ''}`}>{w}</span>)}
            </PhoneFrame>
            <PhoneFrame who="Seat 3A · Yuki" title="Buzz in!">
              <span className="flex h-24 w-24 items-center justify-center self-center rounded-full bg-gradient-to-b from-amber-300 to-orange-400 text-lg font-semibold text-[#1a1204] shadow-[0_6px_0_#9a5a10]">BUZZ</span>
              <span className="text-[15px] text-[#4b566b]">First to buzz describes the picture.</span>
            </PhoneFrame>
            <PhoneFrame who="Seat 1C · Diego" title="I used it!">
              <span className="text-[15px] text-[#4b566b]">Tap when you say today&apos;s phrase: “I&apos;d rather…”</span>
              <span className="-rotate-6 self-center rounded-lg border-[3px] border-[#c23a67] px-3 py-1 text-center font-instrument text-sm font-semibold uppercase tracking-wider text-[#c23a67]">Used it<span className="block text-[13px] opacity-80">Rome</span></span>
            </PhoneFrame>
          </div>
          <p className="mt-2.5 text-[15px] text-lc-text2">Simplified examples of the student phone.</p>
        </div>
      </div>
    </section>
  );
}

// ── Flights ──────────────────────────────────────────────────────────────────

const FLIGHT_IDS: Array<[string, string]> = [
  ['all-around-flight-60', 'One big question, investigated: source, words, discussion, verdict.'],
  ['speak-60', 'The same conversation three times, better each time.'],
  ['grammar-60', 'Notice it, fix it, use it. One point, properly.'],
  ['debate-60', 'Everyone argues, nobody alone. Then switch sides.'],
  ['travel-60', 'One real city, speaking at every stop.'],
  ['listening-60', 'Listen, work on it, listen again. How much more did you catch?'],
  ['reading-60', 'A chapter a lesson, read together, from our library or your own book.'],
];

export function FlightsSection() {
  const flights = FLIGHT_IDS.flatMap(([id, line]) => {
    const preset = FLIGHT_PLAN_PRESETS.find((p) => p.id === id);
    const legs = preset?.flightConfig?.stages.filter((s) => s.kind !== 'micro-event').map((s) => s.label) ?? [];
    return preset && legs.length ? [{ id, name: preset.name, line, legs }] : [];
  });
  const [id, setId] = useState(flights[0]?.id ?? '');
  const f = flights.find((x) => x.id === id) ?? flights[0];
  if (!f) return null;
  return (
    <section id="flights" className="scroll-mt-20 border-t border-lc-border bg-[#0b1524] px-5 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className={EYEBROW}>When you want a full plan</p>
        <h2 className={H2}>{flights.length === 7 ? 'Seven' : flights.length} flights, sized to your lesson.</h2>
        <p className={LEDE}>Set the class to 30, 45, 60 or 90 minutes and the flight fits. Tap one to see how it runs.</p>
        <div className="mt-6 flex flex-wrap gap-2.5" role="group" aria-label="Flights">
          {flights.map((x) => <button key={x.id} type="button" aria-pressed={id === x.id} onClick={() => setId(x.id)} className={chip(id === x.id)}>{x.name}</button>)}
        </div>
        <div className="mt-5 rounded-2xl border border-[#263a58] bg-[#101d31] p-5" aria-live="polite">
          <p className="font-game text-2xl leading-tight text-lc-text">{f.line}</p>
          <ol className="mt-4 flex flex-wrap items-center gap-2">
            {f.legs.map((leg, i) => (
              <li key={leg} className="flex items-center gap-2">
                {i > 0 && <span className="text-lc-text3" aria-hidden>›</span>}
                <span className={`rounded-full border px-3.5 py-1.5 text-base font-medium ${i === 0 ? 'border-emerald-400 text-emerald-300' : i === f.legs.length - 1 ? 'border-lc-amber text-lc-amber' : 'border-[#263a58] bg-[#0a1626] text-lc-text'}`}>{leg}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[15px] text-lc-text2">Each flight opens with what the class can do now and ends by showing what changed. Started halfway through a lesson, it fits the time you have left.</p>
        </div>
      </div>
    </section>
  );
}

// ── Who made this ────────────────────────────────────────────────────────────

export function TeacherSection() {
  return (
    <section className="border-t border-lc-border px-5 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className={EYEBROW}>Who made this</p>
        <h2 className={H2}>Built by a teacher, between classes.</h2>
        <div className="mt-8 grid gap-x-8 gap-y-6 md:grid-cols-3">
          {[
            ['Made to be projected', 'Answers stay hidden until you reveal them, and your private notes never appear on the shared screen.'],
            ['A first name only', 'No student accounts and no student email addresses.'],
            ['Free lessons that do not run out', 'Four every month, for as long as you teach.'],
          ].map(([title, body]) => (
            <div key={title} className="border-t-[3px] border-lc-amber pt-3">
              <p className="font-game text-[1.4rem] leading-tight text-lc-text">{title}</p>
              <p className="mt-1.5 text-[17px] text-lc-text2">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Questions and the closing call ───────────────────────────────────────────

const QUESTIONS: Array<[string, string]> = [
  ['Does it work online and in a classroom?', 'Yes. Online you share the one teaching window on Zoom, Teams, Google Meet or any other video call; in a classroom you put it on the projector.'],
  ['Do students need accounts or an app?', 'No. They open a link or scan a code, type a first name and take a seat. Students never pay.'],
  ['Is it only for children?', 'No. It works for children, teenagers and adults. You set the class level once, from Beginner (A1) to Expert (C1), and the lesson is written for it. Junior mode is there for the youngest classes.'],
  ['Do I have to start with a video?', 'No. Start with a topic, an article, a page of your coursebook, a whole book, a video, or the conversation already happening in class.'],
  ['Does free access expire?', 'No. You get four full lessons every calendar month for as long as you teach.'],
];

export function QuestionsSection() {
  return (
    <section className="border-t border-lc-border bg-[#0b1524] px-5 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="font-game text-3xl leading-tight text-lc-text sm:text-[2.5rem]">Questions teachers ask first</h2>
        <div className="mt-6">
          {QUESTIONS.map(([q, a]) => (
            <details key={q} className="border-t border-[#263a58] py-4">
              <summary className="cursor-pointer text-[19px] font-semibold text-lc-text">{q}</summary>
              <p className="mt-2 max-w-3xl text-[17px] text-lc-text2">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClosingSection() {
  return (
    <section className="border-t border-lc-border px-5 py-20 text-center sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center">
        <h2 className="font-game text-4xl leading-tight text-lc-text sm:text-5xl">Where will your class go next?</h2>
        <p className="mt-4 text-lg text-lc-text2">Open a class, share your screen, and take off.</p>
        <Link href="/login" className="mt-7 inline-flex min-h-[54px] items-center gap-2.5 rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-7 font-game text-xl text-[#1a1204] shadow-[0_10px_30px_rgba(255,160,60,.3)] transition hover:brightness-105">
          <PlaneTakeoff className="h-5 w-5" aria-hidden />
          Start a Test Flight
        </Link>
      </div>
    </section>
  );
}
