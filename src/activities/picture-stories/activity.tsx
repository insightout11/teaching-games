'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import type { ActivityProps, RemoteVote } from '../types';
import { speak, warmUpSpeech } from '@/lib/speech';
import { stickerLabel } from '@/lib/stickers';
import { participationFromResponders } from '@/lib/activity-participation';
import { PICTURE_STORIES, pickStory, type PictureStory } from './bank';

type Phase = 'choose' | 'reading' | 'asking' | 'revealed' | 'finished';

/**
 * Picture Stories (Junior): a short story told with sticker pictures. The shared screen shows one page at a time and
 * reads it aloud; then three picture questions on the phones (tap = answer), revealed with class counts only.
 */
export function PictureStoriesActivity({ customTopic, onSetInputSpec, onRegisterRemoteVoteHandler, onParticipationChange, onScore, onPhaseChange }: ActivityProps) {
  const [story, setStory] = useState<PictureStory | null>(() => pickStory(customTopic));
  const [phase, setPhase] = useState<Phase>('choose');
  const [page, setPage] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { option: string; name: string; studentId: string | null }>>({});
  const [level, setLevel] = useState<'all' | 'A1' | 'A2'>('all');
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const question = story?.questions[qIndex];

  const readPage = useCallback(() => {
    const p = story?.pages[page];
    if (!p) return;
    warmUpSpeech();
    speak(p.text, 0.8);
  }, [story, page]);

  const sayQuestion = useCallback(() => {
    if (!question) return;
    warmUpSpeech();
    const opts = question.options.map(stickerLabel);
    speak(`${question.prompt} ${opts.slice(0, -1).join(', ')}, or ${opts.at(-1)}?`, 0.8);
  }, [question]);

  useEffect(() => { if (phase === 'reading') readPage(); }, [phase, page, readPage]);
  useEffect(() => { if (phase === 'asking') sayQuestion(); }, [phase, qIndex, sayQuestion]);

  useEffect(() => {
    if (phase === 'asking' && question && story) {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'picture-stories',
        roundId: `${story.id}:${qIndex}`,
        prompt: question.prompt,
        options: question.options,
        optionLabels: question.options.map(stickerLabel),
        pictureOptions: true,
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [phase, question, story, qIndex, onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote: RemoteVote) => {
      if (vote.gameKey !== 'picture-stories' || phaseRef.current !== 'asking') return;
      const id = vote.clientId || vote.studentId || vote.displayName;
      setAnswers((prev) => ({ ...prev, [id]: { option: vote.choice, name: vote.displayName, studentId: vote.studentId ?? null } }));
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler]);

  useEffect(() => {
    if (!story || (phase !== 'asking' && phase !== 'revealed')) {
      onParticipationChange?.(null);
      return;
    }
    onParticipationChange?.(participationFromResponders('picture-stories', `${story.id}:${qIndex}`, Object.keys(answers)));
  }, [answers, onParticipationChange, phase, story, qIndex]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of Object.values(answers)) c[a.option] = (c[a.option] ?? 0) + 1;
    return c;
  }, [answers]);

  const start = (s: PictureStory) => {
    setStory(s);
    setPage(0);
    setQIndex(0);
    setAnswers({});
    setPhase('reading');
    onPhaseChange?.('reading');
  };

  const reveal = () => {
    if (!question || !story) return;
    setPhase('revealed');
    for (const [clientId, a] of Object.entries(answers)) {
      const isCorrect = question.answer ? a.option === question.answer : null;
      void onScore?.({
        studentId: a.studentId,
        clientId,
        displayName: a.name,
        promptIndex: qIndex,
        points: isCorrect === false ? 5 : 10,
        isCorrect,
        idempotencyKey: `picture-stories:${story.id}:${qIndex}:${clientId}`,
      });
    }
    if (question.answer) speak(`It's ${stickerLabel(question.answer)}!`, 0.85);
  };

  const nextQuestion = () => {
    if (!story) return;
    if (qIndex + 1 >= story.questions.length) {
      setPhase('finished');
      onPhaseChange?.('finished');
      return;
    }
    setQIndex(qIndex + 1);
    setAnswers({});
    setPhase('asking');
  };

  if (phase === 'choose' || !story) {
    const list = PICTURE_STORIES.filter((s) => level === 'all' || s.level === level);
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold text-lc-text">Picture Stories</h3>
            <p className="text-sm text-lc-text2">Pick a story. Each page is shown big and read aloud, then picture questions on the phones.</p>
          </div>
          <div className="flex gap-1.5">
            {(['all', 'A1', 'A2'] as const).map((l) => (
              <button key={l} onClick={() => setLevel(l)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${level === l ? 'border-amber-400 bg-amber-400 text-lc-bg' : 'border-lc-border text-lc-text2'}`}>{l === 'all' ? 'All' : l}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {list.map((s) => (
            <button key={s.id} onClick={() => start(s)} className={`flex flex-col gap-2 rounded-xl border p-3 text-left transition-colors ${story?.id === s.id ? 'border-amber-400 bg-amber-400/10' : 'border-lc-border bg-lc-card hover:border-lc-text3'}`}>
              <span className="flex gap-1">
                {s.pages[0].pictures.slice(0, 3).map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p} src={`/stickers/${p}.webp`} alt="" className="h-12 w-12 rounded-lg bg-white object-contain" />
                ))}
              </span>
              <span className="text-sm font-semibold text-lc-text">{s.title}</span>
              <span className="text-[11px] text-lc-text3">{s.level} · {s.pages.length} pages</span>
            </button>
          ))}
        </div>
        {story && <button onClick={() => start(story)} className="rounded-xl bg-amber-400 px-5 py-2.5 font-bold text-lc-bg">Read {story.title}</button>}
      </div>
    );
  }

  if (phase === 'reading') {
    const p = story.pages[page];
    const last = page + 1 >= story.pages.length;
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-lc-text3">{story.title} · page {page + 1} of {story.pages.length}</p>
          <button onClick={readPage} className="flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/15 px-3 py-1.5 text-sm font-semibold text-amber-200"><Volume2 className="h-4 w-4" aria-hidden />Read it again</button>
        </div>
        <div className="mx-auto flex max-w-3xl justify-center gap-4">
          {p.pictures.map((pic) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={pic} src={`/stickers/${pic}.webp`} alt={stickerLabel(pic)} className="aspect-square w-full max-w-[220px] rounded-2xl bg-white object-contain shadow-lg" />
          ))}
        </div>
        <p className="mx-auto max-w-3xl text-balance text-center text-3xl font-bold leading-snug text-lc-text sm:text-4xl">{p.text}</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="flex items-center gap-1 rounded-xl border border-lc-border px-4 py-2 text-sm text-lc-text disabled:opacity-30"><ChevronLeft className="h-4 w-4" />Back</button>
          {last ? (
            <button onClick={() => { setQIndex(0); setAnswers({}); setPhase('asking'); onPhaseChange?.('asking'); }} className="rounded-xl bg-amber-400 px-5 py-2.5 font-bold text-lc-bg">Questions</button>
          ) : (
            <button onClick={() => setPage(page + 1)} className="flex items-center gap-1 rounded-xl bg-amber-400 px-5 py-2.5 font-bold text-lc-bg">Next page<ChevronRight className="h-4 w-4" /></button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <p className="font-display text-4xl text-amber-300">The end!</p>
        <p className="text-lc-text2">{story.title}. Words from the story:</p>
        <div className="flex flex-wrap justify-center gap-3">
          {story.words.map((w) => (
            <span key={w} className="flex flex-col items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/stickers/${w}.webp`} alt="" className="h-20 w-20 rounded-xl bg-white object-contain" />
              <span className="text-sm font-semibold text-lc-text">{stickerLabel(w)}</span>
            </span>
          ))}
        </div>
        <button onClick={() => setPhase('choose')} className="rounded-xl border border-lc-border px-4 py-2 text-sm text-lc-text">Another story</button>
      </div>
    );
  }

  // Questions
  const revealed = phase === 'revealed';
  const q = question!;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-lc-text3">{story.title} · question {qIndex + 1} of {story.questions.length}</p>
        <button onClick={sayQuestion} className="flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/15 px-3 py-1.5 text-sm font-semibold text-amber-200"><Volume2 className="h-4 w-4" aria-hidden />Say it again</button>
      </div>
      <h3 className="text-center text-3xl font-bold text-lc-text sm:text-4xl">{q.prompt}</h3>
      <div className={`mx-auto grid max-w-3xl gap-4 ${q.options.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : q.options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {q.options.map((o) => {
          const right = revealed && q.answer === o;
          const dim = revealed && q.answer && q.answer !== o;
          return (
            <div key={o} className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 ${right ? 'border-emerald-400 bg-emerald-400/15' : 'border-lc-border bg-lc-card'} ${dim ? 'opacity-40' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/stickers/${o}.webp`} alt="" className="aspect-square w-full rounded-xl bg-white object-contain" />
              <span className="text-xl font-bold text-lc-text">{stickerLabel(o)}</span>
              {revealed && <span className="text-sm text-lc-text2">{counts[o] ?? 0} {counts[o] === 1 ? 'tap' : 'taps'}</span>}
              {right && <Check className="absolute right-2 top-2 h-7 w-7 rounded-full bg-emerald-400 p-1 text-lc-bg" aria-hidden />}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-3">
        <span className="text-sm text-lc-text2">{Object.keys(answers).length} answered</span>
        {!revealed ? (
          <button onClick={reveal} className="rounded-xl bg-amber-400 px-5 py-2.5 font-bold text-lc-bg">{q.answer ? 'Show the answer' : 'Show the class choices'}</button>
        ) : (
          <button onClick={nextQuestion} className="flex items-center gap-1 rounded-xl bg-amber-400 px-5 py-2.5 font-bold text-lc-bg">{qIndex + 1 >= story.questions.length ? 'Finish' : 'Next question'}<ChevronRight className="h-4 w-4" /></button>
        )}
      </div>
    </div>
  );
}
