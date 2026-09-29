'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crosshair, Eye, EyeOff, Plus, Sparkles, Swords, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { usePollVotes } from '@/hooks/use-poll-votes';
import { useSessionStore } from '@/stores/session-store';
import { useFocusBus } from '@/stores/focus-bus-store';
import type { Poll } from '@/lib/supabase/types';
import { KitButton, KitChip, KitInput, KitLabel, KitReadout, KitSection, KitStatus } from './widget-kit';

interface PollContentProps {
  sessionId: string;
}

/** One-tap poll types. */
const TYPES = [
  { key: 'yesno', label: 'Yes / No', options: ['Yes', 'No'] },
  { key: 'abcd', label: 'A–D', options: ['A', 'B', 'C', 'D'] },
  { key: 'scale', label: '1–5', options: ['1', '2', '3', '4', '5'] },
  { key: 'mood', label: 'Mood', options: ['Great', 'Good', 'Okay', 'Tired', 'Confused'] },
  { key: 'custom', label: 'Custom', options: ['', ''] },
] as const;

// Bars use the kit colours so they read the same on every widget.
const BAR_COLORS = ['#67e8f9', '#c4b5fd', '#6ee7b7', '#fcd34d', '#fda4af', '#93c5fd'];

export function PollContent({ sessionId }: PollContentProps) {
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [type, setType] = useState<(typeof TYPES)[number]['key']>('yesno');
  const [options, setOptions] = useState<string[]>(['Yes', 'No']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Results stay hidden until the teacher reveals them (no bandwagon voting).
  const [revealed, setRevealed] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const topic = useSessionStore((s) => s.settings.customTopic || s.settings.topic);
  const difficulty = useSessionStore((s) => s.settings.difficulty);
  const makeFocus = useFocusBus((s) => s.makeFocus);

  const { tallies, votes } = usePollVotes(activePoll?.id || null);

  useEffect(() => {
    async function loadActivePoll() {
      const { data } = await supabase
        .from('polls')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const poll = data as Poll;
        const expiresAt = typeof poll.metadata?.expiresAt === 'string'
          ? Date.parse(poll.metadata.expiresAt)
          : Number.POSITIVE_INFINITY;
        const expiredSidePoll = poll.metadata?.channel === 'side' && Date.now() >= expiresAt;
        setActivePoll(expiredSidePoll ? null : poll);
      }
    }
    loadActivePoll();
  }, [sessionId, supabase]);

  const pickType = (key: (typeof TYPES)[number]['key']) => {
    setType(key);
    setOptions([...TYPES.find((t) => t.key === key)!.options]);
  };

  const aiPoll = async () => {
    const t = topic && topic !== 'General' ? topic : '';
    if (!t) { setNote('Set a topic first (the topic bar at the top).'); return; }
    setAiBusy(true);
    try {
      const res = await fetch('/api/widgets/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'poll', topic: t, difficulty }),
      });
      const d = res.ok ? await res.json() : null;
      if (!d?.question) { setNote('Could not write a poll right now.'); return; }
      setQuestion(d.question);
      setType('custom');
      setOptions(d.options);
    } finally {
      setAiBusy(false);
    }
  };

  const handleCreatePoll = async () => {
    const trimmedQuestion = question.trim();
    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!trimmedQuestion || validOptions.length < 2) return;
    setIsSubmitting(true);
    if (activePoll) {
      await supabase.from('polls').update({ is_active: false }).eq('id', activePoll.id);
    }
    const { data, error } = await supabase
      .from('polls')
      .insert({ session_id: sessionId, question: trimmedQuestion, options: validOptions, is_active: true })
      .select()
      .single();
    if (!error && data) {
      setActivePoll(data as Poll);
      setIsCreating(false);
      setRevealed(false);
      setQuestion('');
      pickType('yesno');
    }
    setIsSubmitting(false);
  };

  const handleClosePoll = async () => {
    if (!activePoll) return;
    await supabase.from('polls').update({ is_active: false }).eq('id', activePoll.id);
    setActivePoll(null);
  };

  const totalVotes = votes.length;
  const pollOptions = (activePoll?.options as string[] | undefined) ?? [];
  const ranked = pollOptions.map((o) => ({ o, n: tallies[o] || 0 })).sort((a, b) => b.n - a.n);
  const maxCount = ranked[0]?.n ?? 0;
  const resultsText = ranked.map((r) => `${r.o}: ${r.n}`).join(', ');

  return (
    <div className="space-y-4 overflow-x-hidden p-4">
      {activePoll && !isCreating && (
        <>
          <div className="flex items-center justify-between gap-2">
            <KitStatus state="live" count={totalVotes} countLabel={totalVotes === 1 ? 'vote' : 'votes'} />
            <KitButton tone={revealed ? 'plain' : 'amber'} solid={!revealed && totalVotes > 0} icon={revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} onClick={() => setRevealed((r) => !r)}>
              {revealed ? 'Hide results' : 'Reveal results'}
            </KitButton>
          </div>
          <KitReadout>{activePoll.question}</KitReadout>

          <div className="space-y-2">
            {pollOptions.map((option, index) => {
              const count = tallies[option] || 0;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const leading = revealed && totalVotes > 0 && count === maxCount;
              const color = BAR_COLORS[index % BAR_COLORS.length];
              return (
                <div key={option} className={`relative overflow-hidden rounded-xl border bg-black/20 ${leading ? 'border-white/35' : 'border-white/10'}`}>
                  <motion.div
                    className="absolute inset-y-0 left-0"
                    style={{ background: `${color}40` }}
                    initial={false}
                    animate={{ width: revealed ? `${pct}%` : '0%' }}
                    transition={{ type: 'spring', stiffness: 70, damping: 16, delay: revealed ? index * 0.12 : 0 }}
                  />
                  <div className="relative flex items-center justify-between px-3 py-2.5 text-sm">
                    <span className="flex items-center gap-2 font-medium text-white">
                      <i className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                      {option}
                    </span>
                    {revealed ? (
                      <span className="font-mono font-bold" style={{ color }}>{pct}% <span className="text-xs font-normal text-white/45">({count})</span></span>
                    ) : (
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">hidden</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {revealed && totalVotes > 0 && makeFocus && (
            <KitSection label="Next">
              <div className="flex flex-wrap gap-1.5">
                <KitButton tone="amber" icon={<Crosshair className="h-3.5 w-3.5" />} onClick={() => makeFocus({ title: activePoll.question, text: `Class poll results: ${resultsText}.` })}>
                  Make it the topic
                </KitButton>
                {ranked.length >= 2 && ranked[1].n > 0 && (
                  <KitButton tone="amber" icon={<Swords className="h-3.5 w-3.5" />} onClick={() => makeFocus({ title: `Debate: ${ranked[0].o} or ${ranked[1].o}?`, text: `The class was split on "${activePoll.question}" (${resultsText}). Each side explains why.` })}>
                    Debate it
                  </KitButton>
                )}
              </div>
            </KitSection>
          )}

          <div className="flex gap-2">
            <KitButton className="flex-1" onClick={() => setIsCreating(true)}>New poll</KitButton>
            <KitButton className="flex-1" tone="rose" onClick={handleClosePoll}>Close poll</KitButton>
          </div>
        </>
      )}

      {(isCreating || !activePoll) && (
        <>
          <div className="flex items-center justify-between gap-2">
            <KitStatus state="draft" />
            <KitButton tone="violet" icon={<Sparkles className="h-3.5 w-3.5" />} disabled={aiBusy} onClick={() => void aiPoll()}>
              {aiBusy ? 'Writing…' : 'Poll from topic'}
            </KitButton>
          </div>
          {note && <button type="button" onClick={() => setNote(null)} className="text-left text-xs text-amber-200/80">{note}</button>}

          <KitSection label="Question">
            <KitInput value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask the class something…" />
          </KitSection>

          <KitSection label="Answers">
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => <KitChip key={t.key} on={type === t.key} onClick={() => pickType(t.key)}>{t.label}</KitChip>)}
            </div>
            <div className="space-y-1.5">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: BAR_COLORS[index % BAR_COLORS.length] }} />
                  <KitInput
                    value={option}
                    onChange={(e) => { const next = [...options]; next[index] = e.target.value; setOptions(next); setType('custom'); }}
                    placeholder={`Answer ${index + 1}`}
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => setOptions(options.filter((_, i) => i !== index))} className="text-white/40 hover:text-rose-300" aria-label="Remove answer">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button type="button" onClick={() => setOptions([...options, ''])} className="flex items-center gap-1 text-xs text-cyan-200/80 hover:text-cyan-100">
                <Plus className="h-3.5 w-3.5" /> Add answer
              </button>
            )}
          </KitSection>

          <div className="flex gap-2">
            {activePoll && <KitButton className="flex-1" onClick={() => setIsCreating(false)}>Cancel</KitButton>}
            <KitButton
              className="flex-1"
              tone="amber"
              solid
              onClick={handleCreatePoll}
              disabled={!question.trim() || options.filter((o) => o.trim()).length < 2 || isSubmitting}
            >
              {isSubmitting ? 'Starting…' : 'Start poll'}
            </KitButton>
          </div>
          <KitLabel className="text-center">Results stay hidden until you reveal them</KitLabel>
        </>
      )}
    </div>
  );
}
