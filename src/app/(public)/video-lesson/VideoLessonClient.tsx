'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlaneTakeoff,
  Sparkles,
  Lock,
  BookOpen,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { FEATURED_CHIPS } from '@/lib/video-lesson-demos';

interface PreviewVocab {
  word: string;
  definition: string;
  example: string;
}

interface PreviewResponse {
  videoId: string;
  title: string;
  thumbnail: string;
  cached: boolean;
  transcriptUsed: boolean;
  suggestedLevel: string;
  hook: string;
  keyVocab: PreviewVocab[];
  comprehensionQuestions: string[];
  discussionPrompts: string[];
  stageLabels: string[];
  error?: string;
  code?: string;
}

const PENDING_SOURCE_KEY = 'lc-pending-source';

// Aviation-voiced staged progress while the (uncached) request runs.
const LOADING_STAGES = [
  'Extracting the transcript…',
  'Reading the video…',
  'Planning the flight…',
];

export function VideoLessonClient() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [error, setError] = useState<{ message: string; atCapacity: boolean } | null>(null);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (stageTimer.current) clearInterval(stageTimer.current);
    };
  }, []);

  async function build(targetUrl: string) {
    const trimmed = targetUrl.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    setStage(0);
    stageTimer.current = setInterval(() => {
      setStage((s) => Math.min(s + 1, LOADING_STAGES.length - 1));
    }, 2600);

    try {
      const res = await fetch('/api/public/video-lesson-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = (await res.json()) as PreviewResponse;
      if (!res.ok) {
        setError({
          message: data.error ?? 'We couldn’t build a lesson from that link. Try another video.',
          atCapacity: data.code === 'DEMO_BUSY',
        });
        return;
      }
      setPreview(data);
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch {
      setError({ message: 'Something went wrong. Please try again.', atCapacity: false });
    } finally {
      if (stageTimer.current) clearInterval(stageTimer.current);
      setLoading(false);
    }
  }

  function goSignup() {
    if (preview) {
      try {
        localStorage.setItem(
          PENDING_SOURCE_KEY,
          JSON.stringify({
            sourceType: 'youtube',
            sourceKey: preview.videoId,
            title: preview.title,
            summary: preview.hook,
          }),
        );
      } catch {
        /* ignore */
      }
    }
    router.push('/login?next=/home');
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="text-center">
        <span className="font-instrument inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
          <Sparkles className="h-3 w-3" aria-hidden />
          Free · No sign-up
        </span>
        <h1 className="mt-5 text-3xl font-bold leading-tight text-lc-text sm:text-[2.6rem]">
          Turn any YouTube video into a live English lesson
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-lc-text2">
          Paste a link and watch a lesson preview build itself — suggested level, key vocabulary,
          comprehension questions, and discussion prompts.
        </p>

        {/* Input */}
        <div className="mx-auto mt-7 flex max-w-xl flex-col gap-2 sm:flex-row">
          <input
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') build(url);
            }}
            disabled={loading}
            placeholder="https://youtube.com/watch?v=…"
            className="min-w-0 flex-1 rounded-xl border border-lc-border bg-lc-surface px-4 py-3 text-sm text-lc-text placeholder-lc-text3 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 disabled:opacity-60"
          />
          <button
            onClick={() => build(url)}
            disabled={loading || !url.trim()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-lc-amber px-5 py-3 text-sm font-bold text-[#1a0f00] transition-colors hover:bg-lc-amber/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PlaneTakeoff className="h-4 w-4" aria-hidden />}
            {loading ? 'Building…' : 'Build my lesson'}
          </button>
        </div>

        {/* Instant-gratification chips */}
        {!preview && !loading && (
          <div className="mx-auto mt-5 flex max-w-xl flex-wrap items-center justify-center gap-2">
            <span className="font-instrument text-[11px] uppercase tracking-wider text-lc-text3">or try one of these</span>
            {FEATURED_CHIPS.map((chip) => (
              <button
                key={chip.videoId}
                onClick={() => {
                  setUrl(chip.url);
                  build(chip.url);
                }}
                className="rounded-full border border-cyan-300/20 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-lc-text2 transition-colors hover:border-cyan-300/45 hover:text-lc-text"
              >
                {chip.title}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Loading ──────────────────────────────────────────── */}
      {loading && (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-cyan-300/15 bg-[#04101f]/70 p-8">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-300" aria-hidden />
          <p className="font-instrument text-sm uppercase tracking-[0.16em] text-cyan-200">{LOADING_STAGES[stage]}</p>
          <div className="flex gap-1.5">
            {LOADING_STAGES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-8 rounded-full transition-colors ${i <= stage ? 'bg-cyan-400' : 'bg-cyan-400/15'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="mt-8 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-6 text-center">
          <p className="text-sm font-medium text-amber-200">{error.message}</p>
          {error.atCapacity && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {FEATURED_CHIPS.map((chip) => (
                <button
                  key={chip.videoId}
                  onClick={() => {
                    setUrl(chip.url);
                    build(chip.url);
                  }}
                  className="rounded-full border border-cyan-300/20 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-lc-text2 transition-colors hover:border-cyan-300/45 hover:text-lc-text"
                >
                  {chip.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Result ───────────────────────────────────────────── */}
      {preview && !loading && (
        <div ref={resultRef} className="mt-10 space-y-6">
          {/* Header: thumbnail + title + level + hook */}
          <div className="overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#04101f]/80">
            <div className="relative aspect-video w-full bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.thumbnail} alt={preview.title} className="h-full w-full object-cover" />
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-400/15 px-2.5 py-0.5 text-xs font-semibold text-cyan-200">
                  {preview.suggestedLevel}
                </span>
                {!preview.transcriptUsed && (
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-lc-text3">
                    Based on the video’s topic
                  </span>
                )}
              </div>
              <h2 className="mt-3 text-xl font-bold text-lc-text">{preview.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-lc-text2">{preview.hook}</p>
            </div>
          </div>

          {/* Route strip — the 9-stage Captain's Flight */}
          {preview.stageLabels.length > 0 && (
            <div className="rounded-2xl border border-cyan-300/15 bg-[#04101f]/70 p-5">
              <p className="font-instrument mb-4 text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">
                The lesson, stage by stage
              </p>
              <div className="flex flex-wrap gap-x-2 gap-y-3">
                {preview.stageLabels.map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/10 text-[10px] font-bold text-cyan-200">
                      {i + 1}
                    </span>
                    <span className="font-instrument text-[11px] uppercase tracking-wide text-lc-text2">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vocabulary */}
          {preview.keyVocab.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-lc-text">
                <BookOpen className="h-4 w-4 text-emerald-300" aria-hidden /> Key vocabulary
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {preview.keyVocab.map((v) => (
                  <div key={v.word} className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
                    <p className="text-sm font-bold text-emerald-200">{v.word}</p>
                    <p className="mt-1 text-sm text-lc-text2">{v.definition}</p>
                    <p className="mt-1.5 text-xs italic text-lc-text3">“{v.example}”</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comprehension */}
          {preview.comprehensionQuestions.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-lc-text">
                <HelpCircle className="h-4 w-4 text-cyan-300" aria-hidden /> Comprehension questions
              </h3>
              <ol className="space-y-2">
                {preview.comprehensionQuestions.map((q, i) => (
                  <li key={i} className="flex gap-3 rounded-xl border border-lc-border bg-lc-surface/60 p-3 text-sm text-lc-text2">
                    <span className="font-bold text-cyan-300">{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Discussion */}
          {preview.discussionPrompts.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-lc-text">
                <MessageSquare className="h-4 w-4 text-violet-300" aria-hidden /> Discussion prompts
              </h3>
              <div className="space-y-2">
                {preview.discussionPrompts.map((p, i) => (
                  <div key={i} className="rounded-xl border border-violet-400/20 bg-violet-400/[0.05] p-3 text-sm text-lc-text2">
                    {p}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked section + CTA */}
          <div className="relative overflow-hidden rounded-2xl border border-lc-amber/30 bg-gradient-to-br from-lc-amber/[0.08] to-transparent p-6">
            <div aria-hidden className="pointer-events-none absolute inset-0 select-none space-y-2 p-6 opacity-30 blur-[3px]">
              <div className="h-4 w-1/2 rounded bg-white/20" />
              <div className="h-4 w-2/3 rounded bg-white/15" />
              <div className="h-4 w-1/3 rounded bg-white/20" />
            </div>
            <div className="relative">
              <p className="flex items-center gap-2 text-sm font-semibold text-lc-amber">
                <Lock className="h-4 w-4" aria-hidden />
                + 4 more activities, live student devices, and scoring
              </p>
              <p className="mt-2 text-sm leading-relaxed text-lc-text2">
                Sign up free to run this as a full live lesson — students join from their phones, you
                run the whole flight, and scores track in real time.
              </p>
              <button
                onClick={goSignup}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-lc-amber px-5 py-3 text-sm font-bold text-[#1a0f00] transition-colors hover:bg-lc-amber/90"
              >
                Sign up free and fly this lesson
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
