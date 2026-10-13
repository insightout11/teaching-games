'use client';

// The first screen: what LessonCaptain is, shown as the room itself. The room picture is a simplified example
// (labelled as one) that the visitor operates: tapping a choice on the student's phone makes the room answer with
// the spoken follow-up, which is the whole product in one tap. No invented vote counts.

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, MonitorUp, PlaneTakeoff, Smartphone } from 'lucide-react';
import { CrewAvatar } from '@/components/ui/crew-avatar';
import { getPlaneAsset } from '@/lib/plane-progression';
import { DynamicInput } from '@/components/student/dynamic-input';
import type { InputSpec } from '@/lib/input-spec';

const CHOICES = [
  { id: 'a', label: 'Street food', follow: 'Yuki chose street food. The room asks: “What would you eat first, and why?” Yuki answers out loud.' },
  { id: 'b', label: 'Home cooking', follow: 'Yuki chose home cooking. The room asks: “Whose cooking, and what makes it the best?” Yuki answers out loud.' },
] as const;

// The phone in the picture is the product's own student screen (the same component a real phone runs), given a
// sample question. Nothing is sent anywhere: the answer only changes this example.
const PHONE_SPEC: InputSpec = { type: 'choice', gameKey: 'would-you-rather', prompt: 'Would you rather…', options: CHOICES.map((c) => c.label) };

const STAGES = ['Boarded', 'Take-off', 'Talk', 'Game', 'Land in Rome'];

export function HomeHero() {
  const [choice, setChoice] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const follow = CHOICES.find((c) => c.label === choice)?.follow ?? 'Everyone chooses on their phone. Try it: you are Yuki.';
  const plane = getPlaneAsset('scout-monoplane');

  return (
    <section className="px-5 pb-14 pt-10 sm:px-6 sm:pt-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.12fr]">
          <div>
            <p className="font-instrument text-[13px] font-semibold uppercase tracking-[0.14em] text-lc-amber">Live English lessons</p>
            <h1 className="font-game mt-4 text-[2.75rem] leading-[1.05] text-lc-text sm:text-6xl lg:text-7xl">Every lesson is a flight.</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-lc-text2 sm:text-xl">
              A live English lesson on one shared screen. Your class talks, plays and votes, then lands in a new city.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link href="/login" className="inline-flex min-h-[54px] items-center gap-2.5 rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-7 font-game text-xl text-[#1a1204] shadow-[0_10px_30px_rgba(255,160,60,.3)] transition hover:brightness-105">
                <PlaneTakeoff className="h-5 w-5" aria-hidden />
                Start a Test Flight
              </Link>
              <a href="#try" className="text-lg font-semibold text-lc-text underline decoration-lc-text3 underline-offset-[6px] hover:decoration-lc-amber">Try a topic first</a>
            </div>
            <p className="mt-4 text-[15px] text-lc-text2">4 full lessons free every month. For good. No card.</p>
          </div>

          <div className="min-w-0">
            <div className="-mb-2 flex justify-end pr-4">
              <Image src={plane.png} alt="" width={260} height={130} className="h-auto w-[min(250px,56%)] drop-shadow-[0_10px_18px_rgba(0,0,0,.55)]" priority />
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#263a58] bg-[#0b1524] shadow-[0_30px_80px_rgba(0,0,0,.6)]" role="group" aria-label="Example: the teacher's screen during a lesson, with one student's phone">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#263a58] px-4 py-2.5 text-sm text-lc-text2">
                <span>Flight <b className="font-semibold text-lc-amber">The Explorers</b></span>
                <span>Madrid to Rome</span>
                <span className="ml-auto">Topic: street food</span>
              </div>
              <div className="grid gap-3.5 p-3.5 sm:grid-cols-[minmax(0,1fr)_250px]">
                <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#263a58] bg-gradient-to-b from-[#132744] to-[#0d1a2c] p-4">
                  <span className="font-instrument text-[13px] font-semibold uppercase tracking-[0.12em] text-cyan-300">Would you rather</span>
                  <p className="font-game text-2xl leading-tight text-lc-text sm:text-[1.75rem]">Eat only street food for a month, or only home cooking?</p>
                  <p className="rounded-lg border-l-4 border-lc-amber bg-[#0a1626] px-3 py-2.5 text-base text-lc-text" aria-live="polite">{follow}</p>
                </div>
                <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-1">
                  {['Mei', 'Diego'].map((name) => (
                    <div key={name} className="flex items-center gap-2 rounded-lg border border-[#263a58] bg-[#0c1929] px-2.5 py-1.5 text-[15px] text-lc-text">
                      <CrewAvatar seed={name} name={name} size={28} className="rounded-full" />
                      {name}
                      <span className="ml-auto text-[13px] text-emerald-300">voted</span>
                    </div>
                  ))}
                  <div className="theme-Midnight col-span-2 flex flex-col gap-2 rounded-[26px] border-[5px] border-[#05080f] bg-lc-bg p-3 text-lc-text shadow-[0_14px_34px_rgba(0,0,0,.55)] sm:col-span-1">
                    <span className="font-instrument text-[13px] font-semibold text-lc-text2">Yuki&apos;s phone · seat 3A</span>
                    <DynamicInput key={round} spec={PHONE_SPEC} onSubmit={async (value) => setChoice(value)} isSubmitting={false} submitStatus={choice ? 'success' : 'idle'} waitSeconds={0} displayName="Yuki" />
                    {choice && (
                      <button type="button" onClick={() => { setChoice(null); setRound((n) => n + 1); }} className="text-[15px] font-semibold text-lc-text2 underline underline-offset-4 hover:text-lc-text">Choose again</button>
                    )}
                  </div>
                </div>
              </div>
              <p className="mx-3.5 mb-3 inline-block rounded-full border border-[#263a58] px-3 py-1 font-instrument text-[13px] text-lc-text2">Below us: the Massif Central · France · 7:54 pm · cloudy</p>
              <div className="flex flex-wrap gap-1.5 px-3.5 pb-3.5">
                {STAGES.map((s, i) => (
                  <span key={s} className={`rounded-full border px-2.5 py-1 font-instrument text-[13px] ${i === 2 ? 'border-lc-amber bg-lc-amber text-[#1a1204]' : i < 2 ? 'border-emerald-700 text-emerald-300' : 'border-[#263a58] text-lc-text3'}`}>{s}</span>
                ))}
              </div>
            </div>
            <p className="mt-2.5 text-[15px] text-lc-text2">An example lesson. The phone is the real student screen: choose an answer and send it.</p>
          </div>
        </div>

        <ul className="mt-10 grid gap-x-6 gap-y-3 border-y border-lc-border py-4 text-[17px] text-lc-text2 sm:grid-cols-3">
          <li className="flex items-center gap-2.5"><MonitorUp className="h-5 w-5 shrink-0 text-lc-amber" aria-hidden />Share on any video call, or project in class</li>
          <li className="flex items-center gap-2.5"><Smartphone className="h-5 w-5 shrink-0 text-lc-amber" aria-hidden />Student phones are optional</li>
          <li className="flex items-center gap-2.5"><Check className="h-5 w-5 shrink-0 text-lc-amber" aria-hidden />Students join free, without accounts</li>
        </ul>
      </div>
    </section>
  );
}
