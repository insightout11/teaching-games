'use client';

import { useEffect, useState } from 'react';
import { Mail, Stamp } from 'lucide-react';

type Data = { city: string; prompts: string[]; sent: string | null; stamps: Array<{ city: string; at: string }> };

/**
 * After class (Oct 2026, owner): an optional postcard home from the city the class flew to. Writing practice at home or
 * on the way out; sending it puts a postcard stamp on the student's own boarding pass. Hidden when the lesson had no
 * World Flight city or the three days have passed.
 */
export function PostcardHome({ sessionId, clientId }: { sessionId: string; clientId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'failed'>('idle');
  useEffect(() => {
    let stale = false;
    void fetch(`/api/student/postcard?sessionId=${encodeURIComponent(sessionId)}&clientId=${encodeURIComponent(clientId)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null)).then((d: Data | null) => { if (!stale && d) setData(d); }).catch(() => {});
    return () => { stale = true; };
  }, [sessionId, clientId]);
  if (!data) return null;

  const send = async () => {
    if (message.trim().length < 3) return;
    setState('sending');
    const r = await fetch('/api/student/postcard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, clientId, message }) }).catch(() => null);
    if (!r?.ok) { setState('failed'); return; }
    setData({ ...data, sent: message.trim(), stamps: [...data.stamps, { city: data.city, at: new Date().toISOString() }] });
    setState('idle');
  };

  const stamps = (
    data.stamps.length > 0 && (
      <div className="mt-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#1b2233]/55">My postcard stamps · {data.stamps.length}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {data.stamps.map((s, i) => (
            <span key={`${s.city}-${i}`} className="flex rotate-[-3deg] items-center gap-1 rounded-md border-2 border-[#d4537e]/70 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#a3305a]"><Stamp className="h-3 w-3" />{s.city}</span>
          ))}
        </div>
      </div>
    )
  );

  return (
    <div className="mt-3 w-full max-w-md rounded-2xl bg-[#f4efe3] p-4 text-left text-[#1b2233] shadow-xl">
      <p className="flex items-center gap-2 font-display text-xl"><Mail className="h-5 w-5 text-[#d4537e]" /> A postcard home from {data.city}</p>
      {data.sent ? (
        <>
          <p className="mt-2 rounded-xl bg-white/70 p-3 text-sm italic">{data.sent}</p>
          <p className="mt-1 text-sm text-[#1b2233]/70">Sent! A postcard stamp is on your boarding pass.</p>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-[#1b2233]/70">Optional: write to someone at home. You earn a postcard stamp.</p>
          {data.prompts.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-[#1b2233]/80">{data.prompts.map((p) => <li key={p}>{p}</li>)}</ul>
          )}
          <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 600))} rows={4} placeholder={`Dear ..., greetings from ${data.city}!`} aria-label="Your postcard" className="mt-2 w-full rounded-xl border border-[#1b2233]/20 bg-white p-3 text-sm focus:border-[#d4537e] focus:outline-none" />
          <button type="button" disabled={state === 'sending' || message.trim().length < 3} onClick={() => void send()} className="mt-2 w-full rounded-xl bg-[#d4537e] py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {state === 'sending' ? 'Sending…' : state === 'failed' ? 'Try again' : 'Send my postcard'}
          </button>
        </>
      )}
      {stamps}
    </div>
  );
}
