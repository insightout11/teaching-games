'use client';

import { useCallback, useEffect, useState } from 'react';
import { Armchair, X } from 'lucide-react';
import { CrewAvatar } from '@/components/ui/crew-avatar';
import { cabinSeatLabel, MAX_CABIN_SEATS } from '@/lib/live-room/seats';

type SeatInfo = { seat: number; name: string; avatarSeed: string | null; mine: boolean; picked: boolean };

/**
 * Pick your seat on the phone (Oct 2026, pilot 001: a student asked to sit next to friends). The cabin looks like the
 * one on the big screen: four across, an aisle, classmates' avatars in their seats. Tap a free seat to move there.
 */
export function SeatPicker({ sessionId, clientId, onSeat }: { sessionId: string; clientId: string; onSeat: (seat: number) => void }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(`lc-seat-picked-${sessionId}`) === '1'; } catch { return false; }
  });
  const [seats, setSeats] = useState<SeatInfo[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/student/seat?sessionId=${sessionId}&clientId=${clientId}`, { cache: 'no-store' }).catch(() => null);
    if (!res?.ok) return;
    const data = await res.json() as { seats: SeatInfo[] };
    setSeats(data.seats);
  }, [sessionId, clientId]);
  useEffect(() => {
    if (!open) return;
    void load();
    const id = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(id);
  }, [open, load]);

  const finish = () => {
    setOpen(false); setDismissed(true);
    try { sessionStorage.setItem(`lc-seat-picked-${sessionId}`, '1'); } catch { /* private mode */ }
  };
  const pick = async (seat: number) => {
    setBusy(true); setNote(null);
    const res = await fetch('/api/student/seat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, clientId, seat }) }).catch(() => null);
    setBusy(false);
    const data = res ? await res.json().catch(() => null) as { seats?: SeatInfo[]; mine?: number | null; error?: string } | null : null;
    if (data?.seats) setSeats(data.seats);
    if (res?.ok && typeof data?.mine === 'number') { onSeat(data.mine); finish(); return; }
    setNote(data?.error === 'taken' ? 'Someone just sat there. Pick another seat.' : 'Could not change seat. Try again.');
  };

  if (!open) {
    return dismissed ? (
      <button type="button" onClick={() => setOpen(true)} className="mb-3 flex items-center gap-1.5 text-xs text-cyan-300/80 hover:text-cyan-200">
        <Armchair className="h-3.5 w-3.5" /> Change seat
      </button>
    ) : (
      <div className="mb-3 flex items-center gap-3 rounded-2xl border border-cyan-400/30 bg-lc-card p-3">
        <Armchair className="h-6 w-6 shrink-0 text-cyan-300" />
        <p className="flex-1 text-sm text-white">Pick your seat. Sit next to your friends!</p>
        <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-cyan-400 px-3 py-1.5 text-sm font-semibold text-slate-950">Choose</button>
        <button type="button" onClick={finish} aria-label="Keep my seat" className="p-1 text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
    );
  }

  const bySeat = new Map(seats.map((s) => [s.seat, s]));
  const used = seats.length ? Math.max(...seats.map((s) => s.seat)) + 1 : 0;
  const rows = Math.min(MAX_CABIN_SEATS / 4, Math.max(3, Math.ceil((used + 4) / 4)));
  return (
    <div className="mb-3 rounded-2xl border border-cyan-400/30 bg-lc-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-lg text-white">Choose your seat</p>
        <button type="button" onClick={finish} aria-label="Close" className="p-1 text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <div className="mx-auto max-w-xs space-y-1.5 rounded-[48px_48px_16px_16px] border border-white/10 bg-slate-950/60 px-3 pb-3 pt-6">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="grid grid-cols-[1fr_1fr_14px_1fr_1fr] items-center gap-1.5">
            {[0, 1, -1, 2, 3].map((c) => {
              if (c === -1) return <span key="aisle" className="text-center font-mono text-[9px] text-white/30">{r + 1}</span>;
              const i = r * 4 + c, who = bySeat.get(i);
              if (who) {
                return (
                  <div key={c} title={`${who.name} · ${cabinSeatLabel(i)}`} className={`grid h-12 place-items-center rounded-[10px_10px_5px_5px] border ${who.mine ? 'border-cyan-300 bg-cyan-400/15' : 'border-white/10 bg-white/5'}`}>
                    <CrewAvatar seed={who.avatarSeed ?? who.name} name={who.name} size={34} />
                  </div>
                );
              }
              return (
                <button key={c} type="button" disabled={busy} onClick={() => void pick(i)} aria-label={`Seat ${cabinSeatLabel(i)}`} className="grid h-12 place-items-center rounded-[10px_10px_5px_5px] border border-dashed border-white/20 font-mono text-[10px] text-white/45 hover:border-cyan-300 hover:text-cyan-200 disabled:opacity-50">
                  {cabinSeatLabel(i)}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-white/55">{note ?? 'Tap a free seat. Your friends show in their seats.'}</p>
    </div>
  );
}
