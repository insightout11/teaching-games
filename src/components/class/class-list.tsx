'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, PlaneTakeoff, Radio } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { startClassSession } from '@/lib/start-class';
import { CrewAvatar } from '@/components/ui/crew-avatar';
import { FLAP_FONT, Flaps, FlapStyles } from '@/components/ui/split-flap';
import type { BoardRow } from '@/lib/home-board';

// Classes = the hangar (Oct 2026 redesign): one cream boarding pass per class, the same gates and flight numbers as
// the Home board. The stub is where you board.

const PASS = '#fff6e4';
const INK = '#1b2233';
const FAINT = '#8a7a5a';

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <small className="block text-[9px] font-bold tracking-[0.16em]" style={{ color: FAINT, fontFamily: FLAP_FONT }}>{label}</small>
      <b className="block truncate text-[15px] uppercase" style={{ fontFamily: FLAP_FONT }}>{value}</b>
    </div>
  );
}

function ClassPass({ r }: { r: BoardRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Dates only after mount: server and browser time zones differ.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const boardNow = async () => {
    setBusy(true);
    setError(null);
    try {
      router.push(`/sessions/${await startClassSession(r.classId)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the class.');
      setBusy(false);
    }
  };

  const third = r.next
    ? { label: 'COURSE', value: r.next.title }
    : r.nextCity
      ? { label: 'NEXT CITY', value: r.nextCity }
      : { label: 'STUDENTS', value: String(r.students) };

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl shadow-[0_14px_30px_rgba(0,0,0,0.35)]" style={{ background: PASS, color: INK }}>
      <div className="flex items-center justify-between bg-[#14202f] px-4 py-3">
        <Flaps text={r.gate} tone="amber" max={3} />
        <span className="text-[11px] font-bold tracking-[0.18em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>{r.flight}</span>
      </div>
      <Link href={`/classes/${r.classId}`} className="flex flex-1 flex-col gap-2.5 px-4 pb-3 pt-3.5 hover:bg-black/[0.02]">
        <h2 className="truncate text-xl font-bold uppercase tracking-[0.02em]" style={{ fontFamily: FLAP_FONT }}>{r.name}</h2>
        <div className="flex min-h-[30px] items-center gap-2">
          {r.junior && <span className="rounded bg-[#ffe9b8] px-1.5 py-px text-[10px] font-bold tracking-[0.12em] text-[#8a5a00]" style={{ fontFamily: FLAP_FONT }}>JUNIOR</span>}
          <span className="flex items-center">
            {r.crew.slice(0, 4).map((c, i) => (
              <span key={i} className={`rounded-full ring-2 ring-[#fff6e4] ${i ? '-ml-2.5' : ''}`}><CrewAvatar seed={c.seed} name={c.name} size={28} /></span>
            ))}
          </span>
          <span className="text-xs font-bold" style={{ color: FAINT, fontFamily: FLAP_FONT }}>
            {r.students > Math.min(4, r.crew.length) ? `+${r.students - Math.min(4, r.crew.length)}` : r.students === 0 ? 'No students yet' : ''}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Meta label="FLOWN" value={String(r.flown)} />
          <Meta label="STAMPS" value={String(r.stamps)} />
          <Meta label={third.label} value={third.value} />
        </div>
        <p className="truncate text-[13px] text-[#5b5240]">
          {r.liveSessionId ? <span className="font-semibold text-emerald-700">In the air now{r.liveTopic ? ` · ${r.liveTopic}` : ''}</span>
            : r.last ? <>Last: {mounted ? shortDate(r.last.at) : ''} · {r.last.line}</> : 'No lessons yet'}
        </p>
      </Link>
      <div className="relative flex items-center justify-between border-t-2 border-dashed border-[#d8c9a8] px-4 py-2.5">
        <Link href={`/classes/${r.classId}`} className="text-[13px] font-semibold text-[#0b6b85] hover:underline">Open class</Link>
        {r.liveSessionId ? (
          <Link href={`/sessions/${r.liveSessionId}`} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600"><Radio className="h-4 w-4" />Rejoin</Link>
        ) : (
          <button type="button" onClick={() => void boardNow()} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-1.5 text-sm font-semibold text-[#03202a] hover:bg-cyan-400 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlaneTakeoff className="h-4 w-4" />}Board
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="px-4 pb-3 text-xs text-red-700">
          {error} {error.includes('free lessons') && <a href="/pro" className="underline">See Pro</a>}
        </p>
      )}
    </article>
  );
}

export function ClassList({ rows }: { rows: BoardRow[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Gate order (oldest class first), the same gates as the Home board.
  const ordered = [...rows].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Please sign in again.'); setCreating(false); return; }
    const { data } = await supabase.from('classes').insert({ name: name.trim(), teacher_id: user.id }).select('id').single();
    if (!data) { setError('Could not create the class. Please try again.'); setCreating(false); return; }
    router.push(`/classes/${(data as { id: string }).id}`);
  };

  return (
    <>
      <FlapStyles />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {ordered.map((r) => <ClassPass key={r.classId} r={r} />)}
        <form onSubmit={create} className="flex min-h-[250px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 p-6 text-center">
          <span className="text-xs font-bold tracking-[0.18em] text-white/50" style={{ fontFamily: FLAP_FONT }}>NEW CLASS</span>
          <input
            id="new-class-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Class name"
            aria-label="Class name"
            className="w-full max-w-[16rem] rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm text-lc-text placeholder:text-white/35 focus:border-cyan-300/60 focus:outline-none"
          />
          <button type="submit" disabled={creating || !name.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-[#03202a] hover:bg-cyan-300 disabled:opacity-40">
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}Create
          </button>
          <span className="text-xs text-white/40">Add students later, or let them join with the code.</span>
          {error && <span role="alert" className="text-xs text-red-300">{error}</span>}
        </form>
      </div>
    </>
  );
}
