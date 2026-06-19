'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Scale, Plus, Quote } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';

interface DebatePoint {
  id: string;
  client_id: string;
  display_name: string;
  side: string;
  content: string;
  created_at: string;
}

interface DebatePrepPanelProps {
  sessionId: string;
  spec: InputSpec;
  clientId: string;
  studentId: string | null;
  displayName: string;
}

const SIDE_STYLE = {
  for: { label: 'FOR', text: 'text-sky-300', chip: 'bg-sky-500/15 border-sky-500/40', dot: 'bg-sky-400', btn: 'from-sky-500 to-blue-600' },
  against: { label: 'AGAINST', text: 'text-orange-300', chip: 'bg-orange-500/15 border-orange-500/40', dot: 'bg-orange-400', btn: 'from-orange-500 to-amber-600' },
} as const;

export function DebatePrepPanel({ sessionId, spec, clientId, studentId, displayName }: DebatePrepPanelProps) {
  const side = (studentId ? spec.debateSideByStudentId?.[studentId] : undefined) ?? null;
  const [points, setPoints] = useState<DebatePoint[]>([]);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sideRef = useRef(side);
  sideRef.current = side;

  const loadPoints = useCallback(async () => {
    if (!sideRef.current) return;
    try {
      const res = await fetch(`/api/debate-board/points?sessionId=${sessionId}&side=${sideRef.current}`);
      if (!res.ok) return;
      const data = await res.json();
      setPoints((data.points ?? []) as DebatePoint[]);
    } catch { /* ignore */ }
  }, [sessionId]);

  // Poll the team board while on the prep screen.
  useEffect(() => {
    if (!side) return;
    loadPoints();
    const id = setInterval(loadPoints, 3000);
    return () => clearInterval(id);
  }, [side, loadPoints]);

  const submit = useCallback(async () => {
    const content = draft.trim();
    if (!content || submitting || !side) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/debate-board/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, clientId, displayName, side, content }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.point) setPoints((prev) => [...prev, data.point as DebatePoint]);
        setDraft('');
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? 'Could not add point');
      }
    } catch {
      setError('Network error — try again');
    } finally {
      setSubmitting(false);
    }
  }, [draft, submitting, side, sessionId, clientId, displayName]);

  // Not yet assigned a side (teams not split, or no roster link).
  if (!side) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <Scale className="h-8 w-8 text-indigo-400" />
        <p className="font-bold text-white">Getting your team ready…</p>
        <p className="text-xs text-gray-400">Your teacher is splitting the class into two teams. Stand by.</p>
      </div>
    );
  }

  const st = SIDE_STYLE[side];
  const prompts = side === 'for' ? spec.debateForPrompts : spec.debateAgainstPrompts;
  const sideLabel = (side === 'for' ? spec.debateForLabel : spec.debateAgainstLabel) || st.label;

  return (
    <div className="space-y-4">
      {/* Side banner */}
      <div className={`rounded-xl border px-4 py-3 ${st.chip}`}>
        <p className={`text-xs font-bold uppercase tracking-widest ${st.text}`}>Your team · {st.label}</p>
        {sideLabel !== st.label && <p className="text-sm font-semibold text-white mt-0.5">{sideLabel}</p>}
      </div>

      {/* Motion */}
      {spec.prompt && (
        <p className="text-sm font-semibold text-white leading-snug">&ldquo;{spec.prompt}&rdquo;</p>
      )}

      {/* Side's argument angles */}
      {prompts && prompts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Argument angles</p>
          <ul className="space-y-1">
            {prompts.map((p, i) => (
              <li key={i} className="flex gap-2 text-xs text-gray-300">
                <span className={`mt-1 h-1 w-1 flex-shrink-0 rounded-full ${st.dot}`} />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add a point */}
      <div className="space-y-2">
        <textarea
          className="w-full resize-none rounded-xl border border-white/20 bg-white/10 p-3 text-sm text-white placeholder-gray-500 focus:border-white/40 focus:outline-none"
          rows={2}
          maxLength={200}
          placeholder="Add an argument for your team…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">{draft.length}/200</span>
          <button
            onClick={submit}
            disabled={!draft.trim() || submitting}
            className={`flex items-center gap-1.5 rounded-xl bg-gradient-to-r px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-40 ${st.btn}`}
          >
            <Plus className="h-4 w-4" /> {submitting ? 'Adding…' : 'Add point'}
          </button>
        </div>
      </div>

      {/* Team board */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-gray-500">
          Your team&rsquo;s board · {points.length} point{points.length !== 1 ? 's' : ''}
        </p>
        {points.length === 0 ? (
          <p className="text-xs italic text-gray-500">No points yet — add the first one.</p>
        ) : (
          <div className="space-y-1.5">
            {points.map((p) => (
              <div key={p.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-sm text-gray-100 leading-snug">{p.content}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-500">
                  <Quote className="h-2.5 w-2.5" /> {p.display_name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
