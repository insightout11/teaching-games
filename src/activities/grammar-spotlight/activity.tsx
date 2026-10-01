'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Ear, Highlighter, Lightbulb, MessageCircleQuestion, Play, Search, X } from 'lucide-react';
import type { ActivityProps, GrammarSpotlightContent } from '../types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';

// Grammar Spotlight: how the structure is presented. The teacher picks Discover / Watch / Explain
// (smart default: the lesson's source has the structure -> Discover; a matching grammar clip ->
// Watch; else Explain). Every mode ends on the same rule card.
//  - Discover: sentences (from the source when possible) shown plain -> "what do they have in
//    common?" -> the structure lights up -> the rule. Guided discovery.
//  - Watch: the matching Grammar Gameshow clip; phones tap "Heard it!" whenever they hear it.
//  - Explain: the rule card straight away.

type Mode = 'discover' | 'watch' | 'explain';
type Step = 'choose' | 'see' | 'talk' | 'lit' | 'watch' | 'rule';

function Lit({ text, highlight, on }: { text: string; highlight: string; on: boolean }) {
  const i = text.indexOf(highlight);
  if (!on || i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<motion.mark initial={{ backgroundColor: 'rgba(252,211,77,0)' }} animate={{ backgroundColor: 'rgba(252,211,77,0.35)' }} className="rounded px-1 text-amber-50">{highlight}</motion.mark>{text.slice(i + highlight.length)}</>;
}

export function GrammarSpotlightActivity({ generatedContent, onSetInputSpec, onRegisterRemoteVoteHandler, onPhaseChange }: ActivityProps) {
  const content = generatedContent as GrammarSpotlightContent;
  const { rule, discover, clip } = content;
  const canDiscover = discover.sentences.length >= 3;
  const defaultMode: Mode = canDiscover && discover.fromSource ? 'discover' : clip ? 'watch' : canDiscover ? 'discover' : 'explain';

  const [mode, setMode] = useState<Mode>(defaultMode);
  const [step, setStep] = useState<Step>('choose');
  const [taps, setTaps] = useState(0);
  const [tappers, setTappers] = useState<Set<string>>(new Set());

  const go = (s: Step) => { setStep(s); onPhaseChange?.(s); };
  const begin = () => go(mode === 'discover' ? 'see' : mode === 'watch' ? 'watch' : 'rule');

  // Watch it: phones get a "Heard it!" button (tap as often as you hear it).
  useEffect(() => {
    if (step === 'watch') onSetInputSpec?.({ type: 'confirm', gameKey: 'grammar-spotlight', prompt: `Tap every time you hear: ${content.grammarTarget}`, allowMultiple: true, stableInput: true });
    else onSetInputSpec?.(null);
  }, [step, content.grammarTarget, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (step !== 'watch') return;
      setTaps((n) => n + 1);
      setTappers((prev) => (prev.has(vote.clientId) ? prev : new Set(prev).add(vote.clientId)));
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [step, onRegisterRemoteVoteHandler]);

  const header = <KitLabel tone="amber">Grammar Spotlight · {content.grammarTarget}</KitLabel>;
  const modes = useMemo(() => ([
    { k: 'discover' as Mode, label: 'Discover it', icon: Search, note: canDiscover ? (discover.fromSource ? 'Sentences from today’s source first, then the rule' : 'Example sentences first, then the rule') : 'Not available', ok: canDiscover },
    { k: 'watch' as Mode, label: 'Watch it', icon: Play, note: clip ? clip.title.replace(/\s*[-–]\s*The Grammar Gameshow|\s*[-–]\s*Grammar Snacks/i, '') : 'No matching video yet', ok: !!clip },
    { k: 'explain' as Mode, label: 'Explain it', icon: BookOpen, note: 'The rule card straight away', ok: true },
  ]), [canDiscover, discover.fromSource, clip]);

  // ─── CHOOSE ───
  if (step === 'choose') {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-4 text-center text-white">
        <Lightbulb className="mx-auto h-10 w-10 text-amber-300" />
        {header}
        <p className="font-display text-5xl">How shall we meet it?</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {modes.map(({ k, label, icon: Icon, note, ok }) => (
            <button key={k} type="button" disabled={!ok} onClick={() => setMode(k)} className={`rounded-2xl border p-5 text-left transition disabled:opacity-35 ${mode === k ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-slate-950/50 hover:border-white/25'}`}>
              <Icon className={`h-6 w-6 ${mode === k ? 'text-amber-300' : 'text-white/60'}`} />
              <p className="mt-2 font-display text-2xl">{label}{k === defaultMode && <span className="ml-2 align-middle font-mono text-[10px] uppercase tracking-[0.15em] text-amber-300">suggested</span>}</p>
              <p className="text-sm text-white/60">{note}</p>
            </button>
          ))}
        </div>
        <div className="flex justify-center"><KitButton tone="amber" solid onClick={begin} className="!px-8 !py-3 !text-base" icon={<ArrowRight className="h-4 w-4" />}>Start</KitButton></div>
      </div>
    );
  }

  // ─── DISCOVER ───
  if (step === 'see' || step === 'talk' || step === 'lit') {
    const lit = step === 'lit';
    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        <div className="flex items-center justify-between">{header}<KitReadout>{discover.fromSource ? 'from today’s source' : 'example sentences'}</KitReadout></div>
        <div className="space-y-2.5">
          {discover.sentences.map((s, i) => (
            <motion.p key={s.text} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }} className="rounded-2xl border border-white/10 bg-slate-950/55 px-5 py-3 font-display text-2xl leading-snug">
              <Lit text={s.text} highlight={s.highlight} on={lit} />
            </motion.p>
          ))}
        </div>
        {step === 'talk' && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-3 rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] px-5 py-4 text-2xl text-amber-50">
            <MessageCircleQuestion className="h-6 w-6 text-amber-300" />What do these sentences have in common? Can you spot a pattern?
          </motion.p>
        )}
        <div className="flex justify-end gap-2">
          {step === 'see' && <KitButton tone="amber" solid onClick={() => go('talk')} icon={<MessageCircleQuestion className="h-4 w-4" />}>What do you notice?</KitButton>}
          {step === 'talk' && <KitButton tone="amber" solid onClick={() => go('lit')} icon={<Highlighter className="h-4 w-4" />}>Light it up</KitButton>}
          {step === 'lit' && <KitButton tone="amber" solid onClick={() => go('rule')} icon={<Lightbulb className="h-4 w-4" />}>The rule</KitButton>}
        </div>
      </div>
    );
  }

  // ─── WATCH ───
  if (step === 'watch' && clip) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 text-white">
        <div className="flex items-center justify-between">{header}<KitReadout><Ear className="mr-1 inline h-3.5 w-3.5" />{taps} heard · {tappers.size} listening</KitReadout></div>
        <div className="aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-black">
          <iframe src={`https://www.youtube.com/embed/${clip.youtubeId}?rel=0&modestbranding=1`} title={clip.title} allow="autoplay; encrypted-media; fullscreen" allowFullScreen className="h-full w-full" />
        </div>
        <p className="text-center text-lg text-white/70">Tap <span className="text-white">&ldquo;Heard it!&rdquo;</span> on your phone every time you hear <span className="text-amber-200">{content.grammarTarget}</span>.</p>
        <div className="flex justify-end"><KitButton tone="amber" solid onClick={() => go('rule')} icon={<Lightbulb className="h-4 w-4" />}>The rule</KitButton></div>
      </div>
    );
  }

  // ─── RULE (every mode ends here) ───
  return (
    <div className="mx-auto max-w-4xl space-y-4 text-white">
      {header}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-amber-300/40 bg-amber-300/[0.06] px-8 py-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-300/80">How it&apos;s built</p>
        <p className="mt-2 font-display text-4xl">{rule.form}</p>
      </motion.div>
      {rule.whenToUse && <p className="text-center text-xl text-white/80">{rule.whenToUse}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 rounded-2xl border border-white/10 bg-slate-950/50 px-5 py-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/45">Examples</p>
          {rule.examples.map((e) => <p key={e} className="text-lg">&ldquo;{e}&rdquo;</p>)}
        </div>
        {rule.pitfall && (
          <div className="rounded-2xl border border-rose-300/30 bg-rose-400/[0.06] px-5 py-4">
            <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-rose-200"><X className="h-3.5 w-3.5" />Watch out</p>
            <p className="mt-1 text-lg">{rule.pitfall}</p>
          </div>
        )}
      </div>
      <div className="flex justify-end"><KitButton tone="amber" onClick={() => onPhaseChange?.('done')} icon={<ArrowRight className="h-4 w-4" />}>Got it</KitButton></div>
    </div>
  );
}
