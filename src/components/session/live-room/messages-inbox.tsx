'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Archive, Crosshair, Eye, MessageSquareReply, Sparkles, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import type { StudentSubmission } from '@/lib/supabase/types';
import { useSessionStore } from '@/stores/session-store';
import type { RoomMessage } from '@/components/session/live-room/room-channel';

/**
 * The teacher's private inbox for student messages, in the pop-out window
 * (never on the shared screen). Similar messages are grouped so the teacher
 * sees how many students wonder the same thing; each message gets one-tap
 * actions: show the class, make it the topic, reply privately, save, dismiss.
 */
interface MessageGroup { label: string; ids: string[] }

const MAX_SHOWN = 5;

export function MessagesInbox({ sessionId, send }: { sessionId: string; send: (m: RoomMessage) => void }) {
  const supabase = useMemo(() => createClient(), []);
  const [waiting, setWaiting] = useState<StudentSubmission[]>([]);
  const [shown, setShown] = useState<StudentSubmission[]>([]);
  const [groups, setGroups] = useState<MessageGroup[]>([]);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const topic = useSessionStore((s) => s.settings.customTopic || s.settings.topic);
  const difficulty = useSessionStore((s) => s.settings.difficulty);

  const load = useCallback(async () => {
    if (isMockMode()) return;
    const [{ data: w }, { data: p }] = await Promise.all([
      supabase.from('student_submissions').select('*')
        .eq('session_id', sessionId).eq('status', 'pending').eq('published_to_class', false).is('game_key', null)
        .order('created_at', { ascending: true }),
      supabase.from('student_submissions').select('*')
        .eq('session_id', sessionId).eq('published_to_class', true)
        .order('published_at', { ascending: false }),
    ]);
    if (w) setWaiting(w as StudentSubmission[]);
    if (p) setShown(p as StudentSubmission[]);
  }, [sessionId, supabase]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => { void load(); }, 3000);
    return () => window.clearInterval(t);
  }, [load]);

  // Group similar messages (only when there are a few, and only when they change).
  const groupKey = waiting.map((m) => m.id).join(',');
  const lastKey = useRef('');
  useEffect(() => {
    if (waiting.length < 3) { setGroups([]); return; }
    if (groupKey === lastKey.current) return;
    lastKey.current = groupKey;
    const t = window.setTimeout(() => {
      void fetch('/api/live-room/group-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: waiting.map((m) => ({ id: m.id, text: m.content })) }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setGroups(Array.isArray(d?.groups) ? d.groups : []))
        .catch(() => {});
    }, 1500);
    return () => window.clearTimeout(t);
    // Re-group when the set of waiting messages changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupKey]);

  const update = async (ids: string[], patch: Record<string, unknown>) => {
    await supabase.from('student_submissions').update(patch).in('id', ids).eq('session_id', sessionId);
    setWaiting((prev) => prev.filter((m) => !ids.includes(m.id)));
    void load();
  };
  const done = (ids: string[]) => update(ids, { status: 'answered', answered_at: new Date().toISOString(), published_to_class: false });

  const showClass = async (m: StudentSubmission) => {
    setBusy(m.id);
    await update([m.id], { published_to_class: true, published_at: new Date().toISOString() });
    send({ type: 'show', item: { id: `msg-${m.id}`, kind: 'note', title: m.content, url: `note:msg-${m.id}`, publisher: m.display_name ?? 'A student' } });
    setBusy(null);
  };
  const makeTopic = async (ids: string[], title: string, credit?: string) => {
    send({ type: 'focus', title, credit });
    await done(ids);
  };
  const save = async (m: StudentSubmission) => {
    send({ type: 'add', item: { id: `msg-${m.id}`, kind: 'note', title: m.content, url: `note:msg-${m.id}`, publisher: m.display_name ?? 'A student' } });
    await done([m.id]);
  };
  const draft = async (m: StudentSubmission) => {
    setDrafting(true);
    try {
      const res = await fetch('/api/class-questions/draft-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: m.content, topic, difficulty }),
      });
      const d = await res.json().catch(() => null);
      setReply([d?.answer, d?.example].filter(Boolean).join('\n\n'));
    } finally {
      setDrafting(false);
    }
  };
  const sendReply = async (m: StudentSubmission) => {
    if (!reply.trim()) return;
    await update([m.id], { ai_feedback: reply.trim(), ai_score: null, status: 'answered', answered_at: new Date().toISOString(), published_to_class: false });
    setReplyFor(null);
    setReply('');
  };

  const grouped = new Set(groups.flatMap((g) => g.ids));
  const byId = new Map(waiting.map((m) => [m.id, m]));
  const singles = waiting.filter((m) => !grouped.has(m.id));

  const card = (m: StudentSubmission) => (
    <div key={m.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-sm leading-snug text-white">{m.content}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">{m.display_name ?? 'A student'}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Action icon={<Eye className="h-3.5 w-3.5" />} label="Show the class" tone="sky" disabled={busy === m.id || shown.length >= MAX_SHOWN} onClick={() => void showClass(m)} />
        <Action icon={<Crosshair className="h-3.5 w-3.5" />} label="Make it the topic" tone="amber" onClick={() => void makeTopic([m.id], m.content, m.display_name ?? undefined)} />
        <Action icon={<MessageSquareReply className="h-3.5 w-3.5" />} label="Reply privately" onClick={() => { setReplyFor(replyFor === m.id ? null : m.id); setReply(''); }} />
        <Action icon={<Archive className="h-3.5 w-3.5" />} label="Save" onClick={() => void save(m)} />
        <Action icon={<Trash2 className="h-3.5 w-3.5" />} label="Dismiss" onClick={() => void update([m.id], { status: 'rejected' })} />
      </div>
      {replyFor === m.id && (
        <div className="mt-2 space-y-1.5">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            placeholder={`Only ${m.display_name ?? 'this student'} will see this`}
            className="w-full resize-none rounded-lg border border-white/15 bg-black/30 p-2 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
          <div className="flex justify-between gap-2">
            <button type="button" onClick={() => void draft(m)} disabled={drafting} className="flex items-center gap-1 rounded-lg border border-violet-300/30 px-2 py-1 text-xs text-violet-200 hover:bg-violet-300/10 disabled:opacity-50">
              <Sparkles className="h-3.5 w-3.5" /> {drafting ? 'Writing…' : 'Draft for me'}
            </button>
            <button type="button" onClick={() => void sendReply(m)} disabled={!reply.trim()} className="rounded-lg bg-cyan-400/20 px-3 py-1 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/30 disabled:opacity-40">
              Send to {m.display_name ?? 'student'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-1">
      {waiting.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/50">
          No new messages. When a student sends one, the Messages button in the room lights up.
        </p>
      )}
      {groups.map((g) => {
        const members = g.ids.map((id) => byId.get(id)).filter((m): m is StudentSubmission => !!m);
        if (members.length < 2) return null;
        return (
          <div key={g.ids.join()} className="space-y-2 rounded-2xl border border-amber-300/25 bg-amber-300/[0.04] p-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-sm text-amber-100"><b>{members.length} students</b> · {g.label}</p>
              <button type="button" onClick={() => void makeTopic(members.map((m) => m.id), g.label, `${members.length} students`)} className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-300/40 px-2 py-1 text-xs text-amber-200 hover:bg-amber-300/10">
                <Crosshair className="h-3.5 w-3.5" /> Make it the topic
              </button>
            </div>
            {members.map(card)}
          </div>
        );
      })}
      {singles.map(card)}
      {shown.length > 0 && (
        <div className="space-y-1.5 border-t border-white/10 pt-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Showing to the class</p>
          {shown.map((m) => (
            <div key={m.id} className="flex items-start justify-between gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
              <p className="text-sm text-white/80">{m.content}</p>
              <button type="button" onClick={() => void done([m.id])} className="shrink-0 rounded-md border border-white/15 px-2 py-0.5 text-xs text-white/70 hover:text-white">Done</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Action({ icon, label, onClick, tone, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; tone?: 'sky' | 'amber'; disabled?: boolean }) {
  const colors = tone === 'sky' ? 'border-sky-300/40 text-sky-100 hover:bg-sky-300/10'
    : tone === 'amber' ? 'border-amber-300/40 text-amber-100 hover:bg-amber-300/10'
      : 'border-white/15 text-white/75 hover:bg-white/5 hover:text-white';
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs disabled:opacity-40 ${colors}`}>
      {icon} {label}
    </button>
  );
}
