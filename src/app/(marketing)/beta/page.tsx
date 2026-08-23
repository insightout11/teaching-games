import type { Metadata } from 'next';
import Image from 'next/image';
import { CheckCircle2, Gamepad2, Globe2, MonitorSmartphone, Users } from 'lucide-react';
import { BetaApplicationForm } from './BetaApplicationForm';

export const metadata: Metadata = {
  title: 'Founding Captain Teacher Beta | LessonCaptain',
  description: 'Join the LessonCaptain teacher beta and run live English lessons your students take part in from their own devices.',
  alternates: { canonical: '/beta' },
};

const proof = [
  { icon: Gamepad2, title: 'You stay in control', copy: 'Run the lesson from the teacher view while your class follows together.' },
  { icon: MonitorSmartphone, title: 'Students take part', copy: 'Students join from their own devices without creating accounts.' },
  { icon: Globe2, title: 'A shared class journey', copy: 'World Flight turns activities into a journey; the cockpit view is always optional.' },
];

export default function BetaPage({ searchParams }: { searchParams?: { status?: string } }) {
  const accountMismatch = searchParams?.status === 'account-mismatch';
  const linkageError = searchParams?.status === 'linkage-error';

  return (
    <div className="px-5 pb-20 pt-10 sm:px-6 sm:pt-16">
      <div className="mx-auto max-w-6xl">
        <section className="grid items-start gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          <div className="pt-2">
            <p className="font-instrument text-xs font-semibold uppercase tracking-[0.22em] text-lc-blue">
              Founding Captain teacher beta
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.06] text-white sm:text-5xl lg:text-6xl">
              Run live English lessons students take part in.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-lc-text2">
              Built for online English teachers worldwide, from independent tutors to small teaching teams. Bring a topic, article, or video; guide the lesson while students answer, vote, play, and speak.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {proof.map(({ icon: Icon, title, copy }) => (
                <div key={title} className="rounded-2xl border border-lc-border bg-lc-card/70 p-4 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-lc-blue" aria-hidden />
                  <h2 className="mt-3 text-sm font-bold text-white">{title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-lc-text3">{copy}</p>
                </div>
              ))}
            </div>

            <section className="mt-8 overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-950/65 p-5">
              <p className="font-instrument text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/75">
                One connected live lesson
              </p>
              <h2 className="mt-2 font-display text-2xl text-white">See the route teachers and students actually use.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-lc-text2">
                Start with lesson material, get a visible Flight Plan, teach from the shared screen, and bring student browsers in for focused participation.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <figure className="overflow-hidden rounded-xl border border-white/10 bg-black/25 sm:col-span-2">
                  <Image
                    src="/beta-proof/flight-plan.png"
                    alt="Lesson Captain launch screen showing the connected Flight Plan from Prediction Round through Read Aloud, discussion and Final Word"
                    width={1100}
                    height={675}
                    className="h-auto w-full"
                  />
                  <figcaption className="border-t border-white/10 px-3 py-2 text-xs text-lc-text3">The complete route stays visible.</figcaption>
                </figure>
                <figure className="overflow-hidden rounded-xl border border-white/10 bg-black/25">
                  <Image
                    src="/beta-proof/shared-reading.png"
                    alt="Teacher shared screen running a live Read Aloud stage from a lesson about repair cafés"
                    width={2048}
                    height={680}
                    className="h-full min-h-48 w-full object-cover object-center"
                  />
                  <figcaption className="border-t border-white/10 px-3 py-2 text-xs text-lc-text3">The teacher guides the shared lesson.</figcaption>
                </figure>
                <figure className="overflow-hidden rounded-xl border border-white/10 bg-black/25">
                  <div className="flex h-64 items-start justify-center overflow-hidden bg-[#06101d] pt-3">
                    <Image
                      src="/beta-proof/student-reading.png"
                      alt="Student browser showing a live reading turn using the same repair-café passage"
                      width={375}
                      height={844}
                      className="h-auto w-44 rounded-t-lg"
                    />
                  </div>
                  <figcaption className="border-t border-white/10 px-3 py-2 text-xs text-lc-text3">The student browser activates for its part.</figcaption>
                </figure>
              </div>
            </section>

            <div className="mt-8 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] p-5">
              <div className="flex gap-3">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
                <div>
                  <h2 className="font-semibold text-white">What being a beta teacher means</h2>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-lc-text2">
                    {[
                      'Early access and a direct say in what improves next.',
                      'Try LessonCaptain in real lessons and share occasional feedback.',
                      'No student accounts. Teachers use Google sign-in.',
                    ].map((item) => (
                      <li key={item} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <BetaApplicationForm accountMismatch={accountMismatch} linkageError={linkageError} />
        </section>
      </div>
    </div>
  );
}
