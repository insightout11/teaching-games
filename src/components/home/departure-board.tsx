'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { B612_Mono } from 'next/font/google';
import { BookOpen, BookUp, Compass, Library, Loader2, PenLine, PlaneTakeoff, Plus, Radio } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { launchCourseLesson } from '@/lib/launch-course-lesson';
import { startClassSession } from '@/lib/start-class';
import { CrewAvatar } from '@/components/ui/crew-avatar';
import type { BoardRow, BoardSummary } from '@/lib/home-board';
import type { CourseLesson } from '@/lib/course';

// Home = the departures board (docs/home-page-concept.md): one click from sign-in to a live class. Choosing the
// flight happens inside the Live Room ("where are we flying next?"), so Home never asks. Split-flap look (Oct 2026):
// B612 Mono is the typeface Airbus designed for cockpit screens.
const flapFont = B612_Mono({ subsets: ['latin'], weight: ['400', '700'], display: 'swap' });

function greeting(d: Date): string {
  const h = d.getHours();
  return h < 12 ? 'Good morning, Captain' : h < 18 ? 'Good afternoon, Captain' : 'Good evening, Captain';
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Split-flap letters: each tile flips down into place once, left to right. */
function Flaps({ text, tone = 'cream', max = 14, size = 'md' }: { text: string; tone?: 'cream' | 'amber'; max?: number; size?: 'md' | 'lg' }) {
  const chars = text.toUpperCase().slice(0, max).split('');
  const box = size === 'lg' ? 'h-9 w-6 text-xl leading-9' : 'h-7 w-[18px] text-[15px] leading-7';
  return (
    <span className="inline-flex gap-[2px]" aria-label={text}>
      {chars.map((c, i) => (
        <span
          key={`${i}-${c}`}
          aria-hidden
          className={`lc-flap relative inline-block rounded-[3px] text-center font-bold ${box} ${tone === 'amber' ? 'text-amber-300' : 'text-[#fff4dc]'}`}
          style={{ animationDelay: `${i * 35}ms`, background: 'linear-gradient(#141b24 0 49%, #000 49% 51%, #19212b 51%)' }}
        >
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </span>
  );
}

type Status = { label: string; color: string; led: string; blink?: boolean };
function statusOf(r: BoardRow): Status {
  if (r.liveSessionId) return { label: 'Boarding', color: 'text-emerald-300', led: 'bg-emerald-400 shadow-[0_0_10px_#34d399]', blink: true };
  if (r.next) return { label: 'On time', color: 'text-amber-300', led: 'bg-amber-300' };
  return { label: 'Scheduled', color: 'text-white/45', led: 'bg-white/25' };
}

/** Start a plan-free session for a class through the server (counted in the free monthly lessons). */
const board = (classId: string) => startClassSession(classId);

const COLS = 'grid-cols-[4.5rem_minmax(0,1.25fr)_minmax(0,1.7fr)_8rem_8.5rem_7rem]';

export function DepartureBoard({ summary }: { summary: BoardSummary }) {
  const { rows, stats, log, journey } = summary;
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const go = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.'); setBusy(null); }
  };

  const boardClass = (classId: string) => go(`board-${classId}`, async () => {
    router.push(`/sessions/${await board(classId)}`);
  });

  const boardNext = (row: BoardRow) => go(`next-${row.classId}`, async () => {
    if (!row.next) return;
    const res = await fetch(`/api/course/${row.next.courseId}`);
    if (!res.ok) throw new Error('Could not open the course lesson.');
    const course = (await res.json()) as { lessons?: CourseLesson[] };
    const lesson = course.lessons?.find((l) => l.id === row.next!.lessonId);
    if (!lesson) throw new Error('That lesson is no longer in the course.');
    await launchCourseLesson(lesson, row.classId, course.lessons ?? []);
  });

  const startFirstClass = () => go('first', async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Please sign in again.');
    const { data: cls } = await supabase.from('classes').insert({ name: 'My class', teacher_id: user.id }).select('id').single();
    if (!cls) throw new Error('Could not create your class. Please try again.');
    router.push(`/sessions/${await board((cls as { id: string }).id)}`);
  });

  // Enter boards the first class (live classes are listed first, so Enter rejoins one).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || busy || !rows.length) return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName)) return;
      const first = rows[0];
      if (first.liveSessionId) router.push(`/sessions/${first.liveSessionId}`);
      else void boardClass(first.classId);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const clock = now ? now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--';
  const day = now ? now.toLocaleDateString(undefined, { weekday: 'long' }) : '';

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes lc-flap-in { 0% { transform: rotateX(90deg); filter: brightness(1.8); } 60% { transform: rotateX(-12deg); } 100% { transform: rotateX(0); } }
        .lc-flap { animation: lc-flap-in 420ms cubic-bezier(.2,.7,.3,1) both; transform-origin: 50% 50%; font-family: ${flapFont.style.fontFamily}; }
        @keyframes lc-led { 50% { opacity: .25; } }
        .lc-led-blink { animation: lc-led 1.4s infinite; }
        @media (prefers-reduced-motion: reduce) { .lc-flap, .lc-led-blink { animation: none; } }
      ` }} />

      <header className="flex flex-wrap items-end justify-between gap-6 pt-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/90" style={{ fontFamily: flapFont.style.fontFamily }}>{now ? greeting(now) : 'Welcome, Captain'}</p>
          <h1 className="mt-2 font-display text-4xl text-white sm:text-5xl">
            {rows.length ? <>Ready for <em className="text-amber-300">departure</em>.</> : <>Welcome <em className="text-amber-300">aboard</em>.</>}
          </h1>
        </div>
        {rows.length > 0 && (
          <dl className="flex gap-8 text-[13px] text-white/55">
            {[
              { n: stats.lessonsThisMonth, l: stats.lessonsThisMonth === 1 ? 'lesson this month' : 'lessons this month' },
              { n: stats.students, l: stats.students === 1 ? 'student' : 'students' },
              { n: stats.cities, l: stats.cities === 1 ? 'city visited' : 'cities visited' },
            ].map((s) => (
              <div key={s.l}>
                <dd className="text-2xl font-bold text-[#fff4dc]" style={{ fontFamily: flapFont.style.fontFamily }}>{s.n}</dd>
                <dt>{s.l}</dt>
              </div>
            ))}
          </dl>
        )}
      </header>

      {error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}{error.includes('free lessons') && <> <Link href="/pro" className="font-semibold underline">See Pro</Link></>}
        </p>
      )}

      <section
        aria-label="Departures"
        className="relative overflow-hidden rounded-2xl border border-[#1d2632] bg-[#05080d] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_60px_rgba(0,0,0,0.5)]"
        style={{ fontFamily: flapFont.style.fontFamily }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.012) 0 2px, transparent 2px 4px)' }} />
        <div className="flex items-center gap-3 px-6 pb-3 pt-4">
          <PlaneTakeoff className="h-4 w-4 text-amber-300" aria-hidden />
          <span className="text-[13px] font-bold tracking-[0.32em] text-amber-300">DEPARTURES</span>
          <span className="ml-auto text-2xl font-bold tabular-nums tracking-wider text-amber-300">
            {clock}<span className="ml-2 text-[11px] tracking-[0.22em] text-amber-300/60">{day.toUpperCase()}</span>
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-5 border-t border-[#18202b] px-6 py-14 text-center">
            <Flaps text="Your first flight" size="lg" max={17} />
            <p className="max-w-md font-sans text-sm text-white/60">Open the room, share your screen, and students join on their phones with the code. Try it first with your own phone as the student.</p>
            <button type="button" onClick={() => void startFirstClass()} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-sans font-semibold text-[#04202b] hover:bg-cyan-300 disabled:opacity-50">
              {busy === 'first' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlaneTakeoff className="h-4 w-4" />}Start your first class
            </button>
            <p className="font-sans text-xs text-white/40">It creates a class called &ldquo;My class&rdquo;. Rename it and add students any time.</p>
          </div>
        ) : (
          <>
            <div className={`grid ${COLS} items-center gap-4 border-y border-[#18202b] px-6 py-2 text-[10.5px] font-bold tracking-[0.22em] text-amber-300/60`}>
              <span>GATE</span><span>CLASS</span><span>NEXT FLIGHT</span><span>CREW</span><span>STATUS</span><span />
            </div>
            <ul>
              {rows.map((r) => {
                const st = statusOf(r);
                return (
                  <li key={r.classId} className={`grid ${COLS} items-center gap-4 border-b border-[#121921] px-6 py-4 last:border-b-0`}>
                    <Flaps text={r.gate} tone="amber" max={3} />
                    <div className="min-w-0">
                      <Link href={`/classes/${r.classId}`} className="block truncate text-[15px] font-bold uppercase tracking-[0.04em] text-[#fff4dc] hover:text-white">{r.name}</Link>
                      <p className="mt-1 flex items-center gap-2 font-sans text-xs text-white/45">
                        {r.junior && <span className="rounded bg-amber-300/15 px-1.5 py-px text-[10px] font-bold tracking-[0.12em] text-amber-300" style={{ fontFamily: flapFont.style.fontFamily }}>JUNIOR</span>}
                        <span style={{ fontFamily: flapFont.style.fontFamily }}>{r.flight}</span>
                      </p>
                    </div>
                    <div className="min-w-0">
                      {r.liveSessionId ? (
                        <p className="truncate text-[15px] font-bold uppercase text-emerald-200">In the air{r.liveTopic ? ` · ${r.liveTopic}` : ''}</p>
                      ) : r.next ? (
                        <button type="button" onClick={() => void boardNext(r)} disabled={!!busy} title={`Board with ${r.next.courseTitle}: ${r.next.title}`} className="flex max-w-full items-center gap-1.5 text-left text-[15px] font-bold uppercase text-[#fff4dc] hover:text-cyan-200 disabled:opacity-50">
                          {busy === `next-${r.classId}` ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : <BookOpen className="h-3.5 w-3.5 shrink-0 text-cyan-300" />}
                          <span className="truncate">{r.next.title}</span>
                        </button>
                      ) : (
                        <p className="text-[15px] font-bold uppercase text-white/40">Free flight</p>
                      )}
                      <p className="mt-1 truncate font-sans text-xs text-white/45">
                        {r.next && !r.liveSessionId && <span className="text-cyan-300/80">{r.next.courseTitle} · </span>}
                        {r.last ? <>last: {now ? shortDate(r.last.at) : ''} · {r.last.line}</> : !r.next && !r.liveSessionId ? 'choose in the room' : null}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {r.crew.slice(0, 4).map((c, i) => (
                        <span key={i} className={i ? '-ml-2' : ''}><CrewAvatar seed={c.seed} name={c.name} size={30} /></span>
                      ))}
                      <span className="ml-1.5 text-xs font-bold text-white/50">{r.students > Math.min(4, r.crew.length) ? `+${r.students - Math.min(4, r.crew.length)}` : r.students === 0 ? 'No crew yet' : ''}</span>
                    </div>
                    <span className={`flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.14em] ${st.color}`}>
                      <span className={`h-2 w-2 rounded-full ${st.led} ${st.blink ? 'lc-led-blink' : ''}`} />{st.label}
                    </span>
                    <div className="flex justify-end font-sans">
                      {r.liveSessionId ? (
                        <Link href={`/sessions/${r.liveSessionId}`} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#03261a] hover:bg-emerald-300"><Radio className="h-4 w-4" />Rejoin</Link>
                      ) : (
                        <button type="button" onClick={() => void boardClass(r.classId)} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-[#04202b] hover:bg-cyan-300 disabled:opacity-50">
                          {busy === `board-${r.classId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlaneTakeoff className="h-4 w-4" />}Board
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <Link href="/classes" className="flex items-center gap-2 border-t border-dashed border-[#1c2530] px-6 py-3 text-xs font-bold tracking-[0.16em] text-white/35 hover:text-white/70">
              <Plus className="h-3.5 w-3.5" />ADD A CLASS
            </Link>
          </>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
        <section className="flex min-w-0 flex-col gap-2 rounded-2xl border border-white/[0.07] bg-[#0a121e]/85 p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300" style={{ fontFamily: flapFont.style.fontFamily }}>Captain&apos;s logbook</h2>
          {log.length ? (
            <ul className="divide-y divide-white/[0.06]">
              {log.map((e, i) => (
                <li key={i} className="flex justify-between gap-3 py-2 text-sm text-white/75">
                  <span className="min-w-0 truncate"><span className="font-semibold text-white/90">{e.className}</span> · {e.line}</span>
                  <span className="shrink-0 text-xs text-white/40" style={{ fontFamily: flapFont.style.fontFamily }}>{now ? shortDate(e.at) : ''}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/50">After your first lesson, what each class covered shows up here.</p>
          )}
        </section>

        <Link href="/world-flight" className="group flex min-w-0 flex-col gap-2 rounded-2xl border border-white/[0.07] bg-[#0a121e]/85 p-5 hover:border-cyan-300/30">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300" style={{ fontFamily: flapFont.style.fontFamily }}>World Flight</h2>
          <svg viewBox="0 0 300 80" className="h-20 w-full rounded-lg bg-[#0d1b2e]" aria-hidden>
            <path d="M24 60 C 90 12, 170 14, 236 40" fill="none" stroke="#4fd1e8" strokeWidth="2" strokeDasharray="4 5" />
            <circle cx="24" cy="60" r="4" fill="#fcd34d" />
            <circle cx="236" cy="40" r="5" fill="#34d399" />
            <text x="200" y="66" fill="#fff4dc" fontSize="11" fontFamily={flapFont.style.fontFamily}>{(journey?.city ?? 'Choose a city').toUpperCase().slice(0, 14)}</text>
          </svg>
          <p className="text-sm text-white/70">
            {journey ? <>{journey.className} {journey.stamps ? `has ${journey.stamps} ${journey.stamps === 1 ? 'stamp' : 'stamps'} and ` : ''}is heading for {journey.city}.</> : 'Fly your class around the world, one city per lesson.'}
          </p>
        </Link>

        <section className="flex min-w-0 flex-col gap-2 rounded-2xl border border-white/[0.07] bg-[#0a121e]/85 p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300" style={{ fontFamily: flapFont.style.fontFamily }}>Prepare ahead</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: '/lesson-planner', label: 'Plan a lesson', Icon: PenLine },
              { href: '/courses/book', label: 'Upload a book', Icon: BookUp },
              { href: '/explore', label: 'Explore flights', Icon: Compass },
              { href: '/library', label: 'Library', Icon: Library },
            ].map(({ href, label, Icon }) => (
              <Link key={label} href={href} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2.5 text-sm text-white/80 hover:bg-white/[0.08] hover:text-white">
                <Icon className="h-4 w-4 shrink-0 text-cyan-300" />{label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
