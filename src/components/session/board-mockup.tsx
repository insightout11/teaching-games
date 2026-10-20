'use client';

import { useState } from 'react';
import { CircleDot, Columns2, Eye, LayoutGrid, ListOrdered, Smartphone, Sparkles, Star, UserX, X, Zap } from 'lucide-react';

/**
 * Class Board redesign: a still mockup for the owner (Oct 2026), not wired to anything. The question and the answers
 * are the board; templates sit behind one Layout button; the controls are one slim toolbar; Cards or Cloud view.
 */

type Answer = { name: string; tone: string; text: string; dots?: number };
const ANSWERS: Answer[] = [
  { name: 'Mai', tone: '#7dd3fc', text: 'Nasi lemak, because I love coconut rice', dots: 3 },
  { name: 'Ken', tone: '#fca5a5', text: 'Satay! Chicken on sticks with peanut sauce', dots: 5 },
  { name: 'Lina', tone: '#c4b5fd', text: 'I want to try durian but I am a little scared', dots: 4 },
  { name: 'Omar', tone: '#86efac', text: 'Roti canai for breakfast every day' },
  { name: 'Sofia', tone: '#fcd34d', text: 'Laksa. Spicy noodle soup is my favourite', dots: 2 },
  { name: 'Ben', tone: '#f9a8d4', text: 'Ice kacang because it is very hot there' },
  { name: 'Aya', tone: '#93c5fd', text: 'Street food at night markets' },
  { name: 'Tom', tone: '#fdba74', text: 'Teh tarik, the pulled tea' },
];
const QUESTION = 'Which Malaysian food would you try first? Why?';
const LAYOUTS = [
  { name: 'Open board', icon: LayoutGrid, shape: 'open' },
  { name: 'T-Chart', icon: Columns2, shape: 't' },
  { name: 'Ranked', icon: ListOrdered, shape: 'rank' },
  { name: 'Venn', icon: CircleDot, shape: 'venn' },
  { name: 'Pros and cons', icon: Columns2, shape: 't' },
  { name: 'Four corners', icon: LayoutGrid, shape: 'four' },
  { name: 'KWL chart', icon: Columns2, shape: 'three' },
  { name: 'Story order', icon: ListOrdered, shape: 'rank' },
  { name: '5 Ws', icon: LayoutGrid, shape: 'five' },
];

function Mini({ shape }: { shape: string }) {
  const box = 'rounded-[3px] bg-white/25';
  if (shape === 't') return <div className="grid h-full grid-cols-2 gap-1"><div className={box} /><div className={box} /></div>;
  if (shape === 'three') return <div className="grid h-full grid-cols-3 gap-1"><div className={box} /><div className={box} /><div className={box} /></div>;
  if (shape === 'four') return <div className="grid h-full grid-cols-2 grid-rows-2 gap-1"><div className={box} /><div className={box} /><div className={box} /><div className={box} /></div>;
  if (shape === 'five') return <div className="grid h-full grid-cols-5 gap-0.5"><div className={box} /><div className={box} /><div className={box} /><div className={box} /><div className={box} /></div>;
  if (shape === 'rank') return <div className="flex h-full flex-col gap-1"><div className={`${box} h-2 w-full`} /><div className={`${box} h-2 w-4/5`} /><div className={`${box} h-2 w-3/5`} /></div>;
  if (shape === 'venn') return <div className="relative h-full"><div className="absolute left-1 top-1 h-7 w-7 rounded-full border-2 border-white/35" /><div className="absolute left-5 top-1 h-7 w-7 rounded-full border-2 border-white/35" /></div>;
  return <div className="grid h-full grid-cols-3 gap-1"><div className={`${box} h-3`} /><div className={`${box} h-4`} /><div className={`${box} h-3`} /><div className={`${box} h-4`} /><div className={`${box} h-3`} /></div>;
}

function Card({ a, anon, big = false, dots }: { a: Answer; anon: boolean; big?: boolean; dots: boolean }) {
  return (
    <div className={`relative rounded-xl bg-[#f6f1e4] text-[#1b2233] shadow-[0_6px_18px_rgba(0,0,0,0.35)] ${big ? 'p-8' : 'p-4'}`} style={{ borderLeft: anon ? undefined : `6px solid ${a.tone}` }}>
      <p className={big ? 'font-display text-4xl leading-tight' : 'text-lg leading-snug'}>{a.text}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-[#1b2233]/55">
        <span>{anon ? '' : a.name}</span>
        {dots && a.dots ? <span className="flex items-center gap-0.5">{Array.from({ length: a.dots }).map((_, i) => <span key={i} className="h-2 w-2 rounded-full bg-amber-500" />)}</span> : null}
      </div>
    </div>
  );
}

function Cloud() {
  const words: Array<[string, number]> = [['satay', 5], ['durian', 4], ['nasi lemak', 4], ['spicy', 3], ['laksa', 3], ['noodles', 2], ['coconut', 2], ['night market', 2], ['roti canai', 2], ['tea', 1], ['breakfast', 1], ['hot', 1], ['peanut', 1], ['rice', 2], ['street food', 2]];
  const tones = ['#fcd34d', '#7dd3fc', '#f9a8d4', '#86efac', '#c4b5fd', '#fdba74'];
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 px-10 py-12">
      {words.map(([w, n], i) => <span key={w} className="font-display leading-none" style={{ fontSize: 18 + n * 11, color: tones[i % tones.length], opacity: 0.6 + n * 0.08 }}>{w}</span>)}
    </div>
  );
}

export function BoardMockup() {
  const [state, setState] = useState<'answers' | 'empty' | 'tchart' | 'cloud' | 'layouts' | 'smart' | 'spotlight'>('answers');
  const [anon, setAnon] = useState(false);
  const dots = state === 'answers' || state === 'spotlight';
  const answered = state === 'empty' ? 0 : 8;
  const tabs: Array<[typeof state, string]> = [['answers', 'Answers coming in'], ['empty', 'Waiting for answers'], ['spotlight', 'Spotlight a card'], ['tchart', 'T-Chart layout'], ['cloud', 'Cloud view'], ['layouts', 'Layout picker'], ['smart', 'Smart menu']];

  return (
    <div className="min-h-screen bg-[#05070d] p-6 text-white">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-2 font-mono text-xs uppercase tracking-[0.16em] text-white/50">Class Board mockup</span>
        {tabs.map(([k, label]) => (
          <button key={k} type="button" onClick={() => setState(k)} className={`rounded-full border px-3 py-1 text-xs ${state === k ? 'border-amber-300/70 bg-amber-300/15 text-amber-100' : 'border-white/15 text-white/70 hover:text-white'}`}>{label}</button>
        ))}
        <button type="button" onClick={() => setAnon((v) => !v)} className="ml-2 rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">{anon ? 'Show names' : 'Anonymous'}</button>
      </div>

      {/* the board as it sits over the windscreen */}
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/12 bg-[radial-gradient(ellipse_at_top,#1a2742,#0b1220_70%)] shadow-2xl">
        {/* slim toolbar */}
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-2.5">
          <button type="button" onClick={() => setState('layouts')} className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/85 hover:bg-white/10">
            <LayoutGrid className="h-3.5 w-3.5" /> {state === 'tchart' ? 'T-Chart' : 'Open board'}
          </button>
          {[Columns2, ListOrdered, CircleDot].map((I, i) => <button key={i} type="button" title="Recent layout" className="rounded-lg p-1.5 text-white/55 hover:bg-white/10 hover:text-white"><I className="h-4 w-4" /></button>)}
          <div className="mx-1 h-5 w-px bg-white/10" />
          <div className="flex rounded-lg border border-white/12 p-0.5 text-xs">
            <button type="button" onClick={() => setState('answers')} className={`rounded-md px-2.5 py-1 ${state !== 'cloud' ? 'bg-white/12 text-white' : 'text-white/55'}`}>Cards</button>
            <button type="button" onClick={() => setState('cloud')} className={`rounded-md px-2.5 py-1 ${state === 'cloud' ? 'bg-white/12 text-white' : 'text-white/55'}`}>Cloud</button>
          </div>
          <button type="button" title="Anonymous" onClick={() => setAnon((v) => !v)} className={`rounded-lg p-1.5 ${anon ? 'bg-white/12 text-white' : 'text-white/55 hover:text-white'}`}><UserX className="h-4 w-4" /></button>
          <button type="button" title="Auto-show new answers" className="rounded-lg p-1.5 text-white/55 hover:text-white"><Zap className="h-4 w-4" /></button>
          <button type="button" title="Reveal the class's dots" className="rounded-lg p-1.5 text-white/55 hover:text-white"><Star className="h-4 w-4" /></button>
          <button type="button" onClick={() => setState('smart')} className="flex items-center gap-1.5 rounded-lg border border-amber-300/40 bg-amber-300/10 px-2.5 py-1.5 text-xs text-amber-100 hover:bg-amber-300/20"><Sparkles className="h-3.5 w-3.5" /> Smart</button>
          <div className="ml-auto flex items-center gap-2 rounded-full border border-emerald-300/50 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100">
            <Smartphone className="h-3.5 w-3.5" /> Open to phones · <b>{answered} of 8</b> answered
          </div>
          <button type="button" aria-label="Close" className="rounded-lg p-1.5 text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        {/* the question */}
        <div className="px-8 pb-2 pt-7">
          <p className="font-display text-4xl leading-tight text-white md:text-5xl">{state === 'tchart' ? 'Living in a big city or a small town?' : QUESTION}</p>
        </div>

        {/* the board */}
        <div className="relative min-h-[420px] px-8 pb-8 pt-4">
          {state === 'empty' && (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 text-center">
              <Smartphone className="h-10 w-10 text-white/40" />
              <p className="font-display text-3xl text-white/85">Answer on your phones</p>
              <p className="text-white/50">Answers appear here as they arrive</p>
              <div className="mt-2 flex gap-1.5">{Array.from({ length: 8 }).map((_, i) => <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < 0 ? 'bg-emerald-300' : 'bg-white/15'}`} />)}</div>
            </div>
          )}
          {(state === 'answers' || state === 'layouts' || state === 'smart') && (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
              {ANSWERS.map((a) => <Card key={a.name} a={a} anon={anon} dots={dots} />)}
            </div>
          )}
          {state === 'spotlight' && (
            <>
              <div className="pointer-events-none columns-1 gap-4 opacity-25 blur-[2px] sm:columns-2 lg:columns-3 [&>*]:mb-4">{ANSWERS.map((a) => <Card key={a.name} a={a} anon={anon} dots={false} />)}</div>
              <div className="absolute inset-0 flex items-center justify-center p-10"><div className="w-full max-w-2xl"><Card a={ANSWERS[2]} anon={anon} big dots={false} /></div></div>
            </>
          )}
          {state === 'tchart' && (
            <div className="grid gap-6 md:grid-cols-2">
              {[['Big city', ['More things to do at night', 'Better schools and jobs', 'Lots of different food']], ['Small town', ['Quieter and safer', 'You know your neighbours', 'Cleaner air']]].map(([h, items]) => (
                <div key={h as string}>
                  <p className="mb-3 border-b border-white/15 pb-1 font-mono text-xs uppercase tracking-[0.16em] text-amber-200/80">{h as string}</p>
                  <div className="space-y-3">{(items as string[]).map((t, i) => <Card key={t} a={{ ...ANSWERS[i + (h === 'Big city' ? 0 : 3)], text: t }} anon={anon} dots={false} />)}</div>
                </div>
              ))}
            </div>
          )}
          {state === 'cloud' && <Cloud />}

          {/* layout picker */}
          {state === 'layouts' && (
            <div className="absolute left-4 top-0 z-10 w-[420px] rounded-2xl border border-white/15 bg-[#0d1526]/95 p-3 shadow-2xl backdrop-blur-md">
              <p className="mb-2 px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Layout</p>
              <div className="grid grid-cols-3 gap-2">
                {LAYOUTS.map((l) => (
                  <button key={l.name} type="button" className="rounded-xl border border-white/10 bg-white/5 p-2 text-left hover:border-amber-300/50">
                    <div className="mb-1.5 h-9"><Mini shape={l.shape} /></div>
                    <span className="text-[11px] text-white/80">{l.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* smart menu: what makes sense now */}
          {state === 'smart' && (
            <div className="absolute right-4 top-0 z-10 w-[400px] rounded-2xl border border-amber-300/25 bg-[#0d1526]/95 p-4 shadow-2xl backdrop-blur-md">
              <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-200/80"><Sparkles className="h-3 w-3" /> Smart · right now</p>
              {[
                ['Group into themes', 'Food · Drinks · Places to eat'],
                ['Spot a common mistake', '3 answers: "I want try" → "I want to try"'],
                ['Vote on the best ideas', 'Top 3 cards to a quick phone vote'],
                ['Make it the topic', 'Malaysian street food'],
                ['Show as a word cloud', "The class's own words"],
                ['Save to the logbook', 'One-line summary of what the class thought'],
              ].map(([t, d]) => (
                <button key={t} type="button" className="mb-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left hover:border-amber-300/40">
                  <p className="text-sm text-white">{t}</p>
                  <p className="text-xs text-white/50">{d}</p>
                </button>
              ))}
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/40"><Eye className="h-3 w-3" /> Who to call on and who has not answered: in your private window</p>
            </div>
          )}
        </div>
      </div>
      <p className="mx-auto mt-3 max-w-6xl text-xs text-white/40">Mockup only: nothing is saved. Cards would arrive one by one with a soft animation.</p>
    </div>
  );
}
