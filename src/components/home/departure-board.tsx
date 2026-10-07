'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, Compass, Globe2, Library, Loader2, Map, PenLine, Plane, PlaneTakeoff, Plus, Radio, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { launchCourseLesson } from '@/lib/launch-course-lesson';
import type { BoardRow } from '@/lib/home-board';
import type { CourseLesson } from '@/lib/course';

// Home = the departures board (docs/home-page-concept.md): one click from sign-in to a live class. Choosing the
// flight happens inside the Live Room ("where are we flying next?"), so Home never asks.

function greeting(d: Date): string {
  const h = d.getHours();
  return h < 12 ? 'Good morning, Captain' : h < 18 ? 'Good afternoon, Captain' : 'Good evening, Captain';
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Start a plan-free session for a class (same as the Classes page) and open the room. */
async function board(classId: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.from('sessions').insert({ class_id: classId }).select('id').single();
  if (!data) return null;
  try { sessionStorage.removeItem('lessonPlanContent'); } catch { /* storage unavailable */ }
  return (data as { id: string }).id;
}

export function DepartureBoard({ rows }: { rows: BoardRow[] }) {
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
    const id = await board(classId);
    if (!id) throw new Error('Could not start the class. Please try again.');
    router.push(`/sessions/${id}`);
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
    const id = await board((cls as { id: string }).id);
    if (!id) throw new Error('Could not start the class. Please try again.');
    router.push(`/sessions/${id}`);
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

  const clock = now ? now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const day = now ? now.toLocaleDateString(undefined, { weekday: 'long' }) : '';

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-instrument text-[11px] uppercase tracking-[0.22em] text-cyan-300/90">{now ? greeting(now) : 'Welcome, Captain'}</p>
          <h1 className="mt-1 text-3xl font-bold text-lc-text sm:text-4xl">{rows.length ? 'Departures' : 'Welcome aboard'}</h1>
        </div>
        <div className="flex items-baseline gap-3 rounded-xl border border-amber-300/25 bg-black/50 px-4 py-2 font-mono tabular-nums">
          <span className="text-2xl font-semibold text-amber-200">{clock}</span>
          <span className="text-xs uppercase tracking-[0.18em] text-white/50">{day}</span>
        </div>
      </header>

      {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>}

      {rows.length === 0 ? (
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-cyan-300/25 bg-[#0b1626]/90 px-6 py-14 text-center">
          <PlaneTakeoff className="h-10 w-10 text-cyan-300" />
          <h2 className="max-w-xl text-2xl font-bold text-lc-text sm:text-3xl">Your first class is one click away</h2>
          <p className="max-w-md text-sm text-lc-text3">Open the room, share your screen, and students join on their phones with the code. Try it first with your own phone as the student.</p>
          <button type="button" onClick={() => void startFirstClass()} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-[#04202b] hover:bg-cyan-300 disabled:opacity-50">
            {busy === 'first' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plane className="h-4 w-4" />}Start your first class
          </button>
          <p className="text-xs text-lc-text3">It creates a class called &ldquo;My class&rdquo;. Rename it and add students any time.</p>
        </section>
      ) : (
        <section aria-label="Your classes" className="overflow-hidden rounded-2xl border border-white/10 bg-[#05090f]">
          <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)_5rem_9rem] gap-4 border-b border-white/10 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-amber-300/90 md:grid">
            <span>Class</span><span>Next flight</span><span>Crew</span><span className="text-right">Status</span>
          </div>
          <ul>
            {rows.map((r) => (
              <li key={r.classId} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-t border-white/[0.06] px-5 py-4 first:border-t-0 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)_5rem_9rem]">
                <Link href={`/classes/${r.classId}`} className="min-w-0 truncate font-mono text-base font-semibold uppercase tracking-[0.04em] text-[#fff4dc] hover:text-white">{r.name}</Link>
                <div className="col-span-2 row-start-2 min-w-0 md:col-span-1 md:row-start-auto">
                  {r.liveSessionId ? (
                    <p className="truncate font-mono text-sm uppercase text-emerald-200">In the air{r.liveTopic ? ` · ${r.liveTopic}` : ''}</p>
                  ) : r.next ? (
                    <button type="button" onClick={() => void boardNext(r)} disabled={!!busy} title={`Board with ${r.next.courseTitle}: ${r.next.title}`} className="group flex max-w-full items-center gap-1.5 text-left font-mono text-sm uppercase text-[#fff4dc] hover:text-cyan-200 disabled:opacity-50">
                      {busy === `next-${r.classId}` ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : <BookOpen className="h-3.5 w-3.5 shrink-0 text-cyan-300" />}
                      <span className="truncate">{r.next.title}</span>
                    </button>
                  ) : (
                    <p className="font-mono text-sm text-white/45">Choose in the room</p>
                  )}
                  {r.last && <p className="mt-0.5 truncate text-xs text-white/45">Last: {shortDate(r.last.at)} · {r.last.line}</p>}
                </div>
                <span className="hidden items-center gap-1.5 font-mono text-sm text-white/70 md:flex"><Users className="h-3.5 w-3.5 text-white/40" />{r.students}</span>
                <div className="col-start-2 row-start-1 flex justify-end md:col-start-auto md:row-start-auto">
                  {r.liveSessionId ? (
                    <Link href={`/sessions/${r.liveSessionId}`} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#03261a] hover:bg-emerald-300"><Radio className="h-4 w-4" />Rejoin</Link>
                  ) : (
                    <button type="button" onClick={() => void boardClass(r.classId)} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-[#04202b] hover:bg-cyan-300 disabled:opacity-50">
                      {busy === `board-${r.classId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlaneTakeoff className="h-4 w-4" />}Board
                    </button>
                  )}
                </div>
              </li>
            ))}
            <li className="border-t border-white/[0.06]">
              <Link href="/classes" className="flex items-center gap-2 px-5 py-3 font-mono text-sm text-white/50 hover:text-white"><Plus className="h-4 w-4" />New class</Link>
            </li>
          </ul>
        </section>
      )}

      <nav aria-label="More" className="flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-5 text-sm">
        {[
          { href: '/lesson-planner', label: 'Prepare ahead', Icon: PenLine },
          { href: '/courses', label: 'Courses', Icon: BookOpen },
          { href: '/flights', label: 'Flights and activities', Icon: Compass },
          { href: '/library', label: 'Library', Icon: Library },
          { href: '/world-flight', label: 'World Flight map', Icon: Globe2 },
          { href: '/classes', label: 'Classes', Icon: Map },
        ].map(({ href, label, Icon }) => (
          <Link key={href} href={href} className="group inline-flex items-center gap-2 text-lc-text2 hover:text-lc-text">
            <Icon className="h-4 w-4 text-cyan-300/80" />{label}<ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </nav>
    </div>
  );
}
