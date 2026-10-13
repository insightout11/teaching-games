'use client';

// "Anything can be the lesson": four hand-written examples (instant, labelled as examples), and a box for the
// visitor's own topic that calls the real generator through the rate-limited public preview endpoint.

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Sparkles } from 'lucide-react';

type Activity = { kind: string; prompt: string; how: string };

const EXAMPLES: Array<{ id: string; label: string; activities: Activity[] }> = [
  { id: 'food', label: 'Street food', activities: [
    { kind: 'Would you rather', prompt: 'Eat only street food for a month, or only home cooking?', how: 'Everyone votes, then two students explain why.' },
    { kind: 'Words for today', prompt: 'crispy · spicy · stall · queue · bargain', how: 'Each word with its meaning, an example and a question to answer aloud.' },
    { kind: 'Hot Seat', prompt: 'Describe a street food without saying its name.', how: 'One student describes; the class buzzes in to guess.' },
  ] },
  { id: 'football', label: 'Football', activities: [
    { kind: 'Hot take', prompt: 'Video replays have made football worse.', how: 'The class lines up from agree to disagree, then defends its spot.' },
    { kind: 'Words for today', prompt: 'referee · offside · penalty · draw · transfer', how: 'Each word with its meaning, an example and a question to answer aloud.' },
    { kind: 'Quick fire', prompt: 'Who is the best player you have ever seen, and why?', how: 'Thirty seconds each. The class votes for the most convincing answer.' },
  ] },
  { id: 'mars', label: 'Living on Mars', activities: [
    { kind: 'Decision council', prompt: 'Six people can go to Mars. Who do you send?', how: 'Groups choose from ten candidates and argue for their list.' },
    { kind: 'Words for today', prompt: 'gravity · oxygen · colony · supplies · orbit', how: 'Each word with its meaning, an example and a question to answer aloud.' },
    { kind: 'Fact detective', prompt: 'Three facts about Mars. One is false.', how: 'The class votes, then says what gave it away.' },
  ] },
  { id: 'pets', label: 'Pets', activities: [
    { kind: 'Would you rather', prompt: 'Have a dog that can talk, or a cat that can fly?', how: 'Everyone votes, then two students explain why.' },
    { kind: 'Words for today', prompt: 'feed · walk · train · fur · vet', how: 'Each word with its meaning, an example and a question to answer aloud.' },
    { kind: 'Imposter', prompt: 'Everyone gets the same pet, except one student.', how: 'Ask questions to find who is bluffing.' },
  ] },
];

export function TopicSection() {
  const [exampleId, setExampleId] = useState<string | null>('food');
  const [own, setOwn] = useState<{ topic: string; activities: Activity[] } | null>(null);
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const shown = own && exampleId === null ? own.activities : EXAMPLES.find((e) => e.id === exampleId)?.activities ?? EXAMPLES[0].activities;

  const build = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = topic.trim();
    if (!value || busy) { if (!value) setMessage('Type a topic first.'); return; }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/public/topic-preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: value }) });
      const data = await res.json().catch(() => null) as { topic?: string; activities?: Activity[]; error?: string } | null;
      if (!res.ok || !data?.activities?.length) { setMessage(data?.error ?? 'The preview could not be built just now. The examples above show the same thing.'); return; }
      setOwn({ topic: data.topic ?? value, activities: data.activities });
      setExampleId(null);
    } catch {
      setMessage('The preview could not be built just now. The examples above show the same thing.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="try" className="scroll-mt-20 border-t border-lc-border bg-[#0b1524]/60 px-5 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="font-instrument text-[13px] font-semibold uppercase tracking-[0.14em] text-lc-amber">Anything can be the lesson</p>
        <h2 className="font-game mt-3 text-3xl leading-tight text-lc-text sm:text-[2.75rem]">Pick a topic. Watch it become a lesson.</h2>
        <p className="mt-4 max-w-2xl text-lg text-lc-text2">Tap an example to see the first three activities the room would build.</p>

        <div className="mt-6 flex flex-wrap gap-2.5" role="group" aria-label="Example topics">
          {EXAMPLES.map((ex) => (
            <button key={ex.id} type="button" aria-pressed={exampleId === ex.id} onClick={() => setExampleId(ex.id)}
              className={`min-h-[46px] rounded-full border px-4 text-[17px] font-medium transition ${exampleId === ex.id ? 'border-lc-amber bg-lc-amber font-semibold text-[#1a1204]' : 'border-[#263a58] bg-[#101d31] text-lc-text hover:border-lc-amber/60'}`}>
              {ex.label}
            </button>
          ))}
          {own && (
            <button type="button" aria-pressed={exampleId === null} onClick={() => setExampleId(null)}
              className={`min-h-[46px] rounded-full border px-4 text-[17px] font-medium transition ${exampleId === null ? 'border-lc-amber bg-lc-amber font-semibold text-[#1a1204]' : 'border-[#263a58] bg-[#101d31] text-lc-text hover:border-lc-amber/60'}`}>
              Yours: {own.topic}
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-3.5 md:grid-cols-3" aria-live="polite">
          {shown.map((a, i) => (
            <div key={`${a.kind}-${i}`} className="flex min-w-0 flex-col gap-2 rounded-2xl border border-[#263a58] bg-[#101d31] p-5">
              <span className="font-instrument text-[13px] font-semibold uppercase tracking-[0.12em] text-cyan-300">{a.kind}</span>
              <p className="font-game text-[1.4rem] leading-tight text-lc-text">{a.prompt}</p>
              <p className="text-base text-lc-text2">{a.how}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[15px] text-lc-text2">
          {exampleId === null ? 'Built just now for your topic, by the same engine the classroom uses.' : 'These four examples are written by hand, to show the kind of thing the room builds.'}
        </p>

        <form onSubmit={build} className="mt-7 flex flex-wrap items-center gap-2.5">
          <label htmlFor="own-topic" className="basis-full text-[17px] text-lc-text">Or type what you are teaching tomorrow:</label>
          <input id="own-topic" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={60} autoComplete="off" placeholder="e.g. recycling, my weekend, the past simple"
            className="min-h-[48px] min-w-0 flex-1 basis-60 rounded-xl border border-[#263a58] bg-[#0a1626] px-3.5 text-[17px] text-lc-text placeholder-lc-text3 outline-none focus:border-lc-amber" />
          <button type="submit" disabled={busy} className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-lc-amber px-5 text-[17px] font-semibold text-lc-amber transition hover:bg-lc-amber/10 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
            {busy ? 'Building…' : 'Build it'}
          </button>
          {message && <p className="basis-full text-[15px] text-lc-amber" role="status">{message}</p>}
        </form>

        <p className="mt-8 max-w-3xl text-lg text-lc-text2">
          <b className="font-semibold text-lc-text">More than 40 games and activities,</b> every one written for your topic and your class&apos;s level: Would You Rather, Hot Seat, Fact Detective, Imposter, Taboo Sprint, Flash Quiz, Hot Take Arena, Conversation Rounds, Black Box, VocabSprint and many more.
        </p>
        <p className="mt-3 text-[15px] text-lc-text2">
          It also starts from an article, a page of your coursebook, a whole book, or a video:{' '}
          <Link href="/video-lesson" className="font-semibold text-lc-text underline underline-offset-4 hover:text-lc-amber">try it with a YouTube link</Link>.
        </p>
      </div>
    </section>
  );
}
