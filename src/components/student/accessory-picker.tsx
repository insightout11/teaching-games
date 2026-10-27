'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { CrewAvatar } from '@/components/ui/crew-avatar';
import { parseAccessory, type Accessory } from '@/lib/accessories';

/** The market pick on the phone: the city's accessories shown on the student's own avatar; tap to wear one. */
export function AccessoryPicker({ sessionId, clientId, pollId, metadata, seed, name, current, onPicked }: {
  sessionId: string; clientId: string; pollId: string; metadata: unknown; seed: string | null; name: string;
  current: Accessory | null; onPicked: (a: Accessory) => void;
}) {
  const options = (((metadata as { accessories?: unknown[] } | null)?.accessories) ?? []).map(parseAccessory).filter((a): a is Accessory => !!a);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const pick = async (a: Accessory) => {
    setBusy(a.id); setNote(null);
    const res = await fetch('/api/student/accessory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, clientId, pollId, accessory: a }) }).catch(() => null);
    setBusy(null);
    if (res?.ok) { onPicked(a); setNote(`You're wearing the ${a.name}. It stays on your avatar next lesson too.`); return; }
    const err = res ? (await res.json().catch(() => ({}))) as { error?: string } : {};
    setNote(err.error === 'not_on_class_list' ? 'Ask your teacher to add you to the class list to keep it.' : 'Could not save. Try again.');
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {options.map((a) => (
          <button key={a.id} type="button" disabled={!!busy} onClick={() => void pick(a)} className={`flex flex-col items-center gap-1 rounded-2xl border p-2 ${current?.id === a.id ? 'border-emerald-300 bg-emerald-400/15' : 'border-white/15 bg-white/5'} disabled:opacity-60`}>
            <CrewAvatar seed={seed ?? name} name={name} size={64} accessory={a} />
            <span className="text-center text-xs leading-tight text-white">{a.name}</span>
            {current?.id === a.id && <Check className="h-4 w-4 text-emerald-300" />}
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-white/65">{note ?? 'Tap one to wear it.'}</p>
    </div>
  );
}
