'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  PlaneTakeoff,
  Sparkles,
  Lock,
  BookOpen,
  MessageSquare,
  Loader2,
  Link as LinkIcon,
  Check,
  FileText,
  X,
} from 'lucide-react';
import { FEATURED_CHIPS, type DemoVideo } from '@/lib/video-lesson-demos';
import { createClient } from '@/lib/supabase/client';
import { getFeaturedRoute } from '@/lib/discovery-shelves';
import { parseEmphasis } from '@/lib/emphasis';
import { MarketingRouteStrip } from '@/components/homepage/MarketingRouteStrip';
import { trackEvent } from '@/lib/analytics/posthog';
import { EmailCaptureCard } from '@/components/marketing/EmailCaptureCard';
import { DynamicInput } from '@/components/student/dynamic-input';
import type { InputSpec } from '@/lib/input-spec';
import { cefrLabel } from '@/lib/difficulty';

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
const SAMPLE_VIDEO = FEATURED_CHIPS[0]; // pre-loaded so the payoff is visible above the fold
// The real Captain's Flight route, client-safe static data.
const FEATURED_ROUTE = getFeaturedRoute();

// Aviation-voiced staged progress while the (uncached) request runs.
const LOADING_STAGES = [
  'Finding the transcript…',
  'Reading the video…',
  'Building the lesson…',
];

// Renders the AI's *word* emphasis markers as styled (non-italic) accents.
function Emphasis({ text }: { text: string }) {
  return (
    <>
      {parseEmphasis(text).map((seg, i) =>
        seg.emphasis ? (
          <em key={i} className="font-semibold not-italic text-cyan-200">
            {seg.text}
          </em>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

// One stage of the lesson: a numbered header + its content (or a locked chip).
function StageSection({
  order,
  label,
  animate,
  locked = false,
  children,
}: {
  order: number;
  label: string;
  animate: boolean;
  locked?: boolean;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: animate ? 0.2 + order * 0.12 : 0 }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[13px] font-bold ${
            locked
              ? 'border-lc-border bg-white/[0.03] text-lc-text3'
              : 'border-cyan-300/40 bg-cyan-400/10 text-cyan-200'
          }`}
        >
          {order + 1}
        </span>
        <span className="font-instrument text-[13px] font-semibold uppercase tracking-[0.14em] text-white/85">
          {label}
        </span>
        {locked && <Lock className="h-3.5 w-3.5 text-white/60" aria-hidden />}
      </div>
      {children}
    </motion.div>
  );
}

// Honest "made when you teach it" chip — sells the full product without faking content.
function LockedChip({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-[#2a4166] bg-[#0b1524]/70 px-4 py-3">
      <Lock className="mt-1 h-4 w-4 shrink-0 text-white/60" aria-hidden />
      <p className="text-[17px] leading-relaxed text-white/75">{children}</p>
    </div>
  );
}

// The level the preview suggests arrives as "B2 — Upper Intermediate"; the site names levels one way ("Advanced · B2").
function levelFromPreview(suggested: string): string {
  const letter = suggested.match(/\b([ABC][12])\b/i)?.[1];
  return letter ? cefrLabel(letter) : suggested;
}

// What the button does: a signed-in teacher goes home with this video attached and the launcher open; anyone else
// signs in first and lands in the same place.
function ctaLabel(isLoggedIn: boolean): string {
  return isLoggedIn ? 'Teach this lesson' : 'Start a Test Flight';
}

function RunItPanel({ isLoggedIn, onCta }: { isLoggedIn: boolean; onCta: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-2xl border border-lc-amber/40 bg-lc-amber/[0.08] p-6">
      <div className="min-w-0 max-w-xl">
        <h2 className="font-game text-2xl text-white sm:text-3xl">Run this lesson with your class.</h2>
        <p className="mt-1 text-[17px] leading-relaxed text-white/85">
          {isLoggedIn
            ? 'It opens with this video attached. You choose the level, and the rest is made as you teach.'
            : 'Share one screen on a video call or project it in class. Students join free from their phones, or you run it from the one screen. 4 full lessons free every month.'}
        </p>
      </div>
      <button
        onClick={onCta}
        className="inline-flex min-h-[54px] items-center gap-2.5 rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-7 font-game text-xl text-[#1a1204] shadow-[0_10px_30px_rgba(255,160,60,.3)] transition hover:brightness-105"
      >
        <PlaneTakeoff className="h-5 w-5" aria-hidden />
        {ctaLabel(isLoggedIn)}
      </button>
    </div>
  );
}

// The lesson as it looks in the room: a word check made from this video's own vocabulary, on the teaching screen
// and on the product's real student screen. Nothing is sent anywhere; the answer only changes this picture.
function RoomPicture({ preview }: { preview: PreviewResponse }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const words = preview.keyVocab.slice(0, 4);
  if (words.length < 2) return null;
  const target = words[0];
  // A fixed order that differs from video to video, so the answer is not always first.
  const shift = preview.videoId.charCodeAt(0) % words.length;
  const options = [...words.slice(shift), ...words.slice(0, shift)].map((w) => w.word);
  const spec: InputSpec = { type: 'choice', gameKey: 'would-you-rather', prompt: 'Which word?', options };
  const follow = !choice
    ? 'Everyone chooses on their phone. Try it: you are Yuki.'
    : choice === target.word
      ? `Yes, “${target.word}”.`
      : `Not this time. The word is “${target.word}”.`;

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-[#263a58] bg-[#0b1524] text-left shadow-[0_30px_80px_rgba(0,0,0,.6)]" role="group" aria-label="Example: the teacher's screen during this lesson, with one student's phone">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#263a58] px-4 py-2.5 text-[15px] text-lc-text2">
          <span className="min-w-0 truncate">From the video: <b className="font-semibold text-lc-amber">{preview.title}</b></span>
          <span className="ml-auto shrink-0">{levelFromPreview(preview.suggestedLevel)}</span>
        </div>
        <div className="grid gap-3.5 p-3.5 sm:grid-cols-[minmax(0,1fr)_250px]">
          <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#263a58] bg-gradient-to-b from-[#132744] to-[#0d1a2c] p-4">
            <span className="font-instrument text-[13px] font-semibold uppercase tracking-[0.12em] text-cyan-300">Word check</span>
            <p className="font-game text-2xl leading-tight text-lc-text sm:text-[1.75rem]">Which word means: {target.definition}</p>
            <p className="rounded-lg border-l-4 border-lc-amber bg-[#0a1626] px-3 py-2.5 text-base text-lc-text" aria-live="polite">
              {follow}
              {choice && (
                <span className="mt-1 block text-white/80">
                  “<Emphasis text={target.example} />”
                </span>
              )}
            </p>
            {preview.discussionPrompts[0] && (
              <div className="mt-auto border-t border-[#263a58] pt-3">
                <span className="font-instrument text-[13px] font-semibold uppercase tracking-[0.12em] text-lc-text2">Next · talk about it</span>
                <p className="mt-1 text-[17px] text-white/85"><Emphasis text={preview.discussionPrompts[0]} /></p>
              </div>
            )}
          </div>
          <div className="theme-Midnight flex min-w-0 flex-col gap-2 rounded-[26px] border-[5px] border-[#05080f] bg-lc-bg p-3 text-lc-text shadow-[0_14px_34px_rgba(0,0,0,.55)]">
            <span className="font-instrument text-[13px] font-semibold text-lc-text2">Yuki&apos;s phone · seat 3A</span>
            <DynamicInput key={round} spec={spec} onSubmit={async (value) => setChoice(value)} isSubmitting={false} submitStatus={choice ? 'success' : 'idle'} waitSeconds={0} displayName="Yuki" />
            {choice && (
              <button type="button" onClick={() => { setChoice(null); setRound((n) => n + 1); }} className="text-[15px] font-semibold text-lc-text2 underline underline-offset-4 hover:text-lc-text">Choose again</button>
            )}
          </div>
        </div>
      </div>
      <p className="mt-2.5 text-[15px] text-white/85">How this lesson looks in the room, with words from this video. The phone is the real student screen.</p>
    </div>
  );
}

// The built lesson, stage-mapped and animated. Remounted per build (via key) so the
// reveal re-runs; the pre-loaded sample renders calm (animate=false).
function LessonResult({
  preview,
  isSample,
  isLoggedIn,
  onCta,
}: {
  preview: PreviewResponse;
  isSample: boolean;
  isLoggedIn: boolean;
  onCta: () => void;
}) {
  const reduce = useReducedMotion();
  const animate = !isSample && !reduce;
  const [copied, setCopied] = useState(false);
  const [showScrollCta, setShowScrollCta] = useState(false);
  const [ctaDismissed, setCtaDismissed] = useState(false);

  const vocabSentinelRef = useRef<HTMLDivElement>(null);
  const lockedRef = useRef<HTMLDivElement>(null);
  const passedVocab = useRef(false);
  const lockedVisible = useRef(false);

  // Scroll CTA: appears once the visitor scrolls past the vocabulary, hides while the
  // locked-section CTA is on screen (never two CTAs at once).
  useEffect(() => {
    const recompute = () => setShowScrollCta(passedVocab.current && !lockedVisible.current);
    const sentinel = vocabSentinelRef.current;
    const locked = lockedRef.current;
    if (!sentinel || !locked) return;

    const o1 = new IntersectionObserver(([e]) => {
      passedVocab.current = !e.isIntersecting && e.boundingClientRect.top < 0;
      recompute();
    });
    const o2 = new IntersectionObserver(([e]) => {
      lockedVisible.current = e.isIntersecting;
      recompute();
    });
    o1.observe(sentinel);
    o2.observe(locked);
    return () => {
      o1.disconnect();
      o2.disconnect();
    };
  }, []);

  function copyLink() {
    const link = `${window.location.origin}/video-lesson?v=${preview.videoId}`;
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(done).catch(done);
    } else {
      const ta = document.createElement('textarea');
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
      done();
    }
  }

  return (
    <div className="mt-10 space-y-6">
      {isSample && (
        <p className="flex items-center justify-center gap-2 rounded-xl border border-[#2a4166] bg-[#0b1524]/80 px-3 py-2.5 text-center text-[15px] text-white/85">
          <Sparkles className="h-4 w-4 shrink-0 text-lc-amber" aria-hidden />
          Here is an example. Paste your own video above to make a lesson from it.
        </p>
      )}

      <RoomPicture preview={preview} />

      {/* The video itself: a small credit, never the picture */}
      <div className="rounded-2xl border border-[#2a4166] bg-[#0b1524]/90 p-5">
        <div className="flex items-start gap-4">
          <div className="relative hidden aspect-video w-[112px] shrink-0 overflow-hidden rounded-lg bg-black sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.thumbnail} alt="" aria-hidden className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-lc-amber/15 px-3 py-0.5 text-[15px] font-semibold text-lc-amber">
                {levelFromPreview(preview.suggestedLevel)}
              </span>
              <button
                onClick={copyLink}
                className="ml-auto inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#2a4166] bg-white/[0.03] px-3 text-[15px] font-medium text-white/85 transition-colors hover:border-lc-amber/60 hover:text-white"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-300" aria-hidden /> Copied
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4" aria-hidden /> Copy lesson link
                  </>
                )}
              </button>
            </div>
            <h2 className="font-game mt-2 text-2xl leading-snug text-white">{preview.title}</h2>
            <p className="mt-1.5 text-[17px] leading-relaxed text-white/85">{preview.hook}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-[15px] text-white/70">
              <FileText className="h-4 w-4" aria-hidden />
              {preview.transcriptUsed
                ? "Built from this video's transcript."
                : "Based on the video's topic."}
            </p>
          </div>
        </div>
      </div>

      {/* Route strip — the real Captain's Flight */}
      <div className="rounded-2xl border border-[#2a4166] bg-[#0b1524]/90 p-5">
        <MarketingRouteStrip route={FEATURED_ROUTE} animate={animate} />
      </div>

      {/* Stage-mapped content, in lesson order */}
      <div className="space-y-6">
        <StageSection order={0} label="Warm-up" animate={animate} locked>
          <LockedChip>
            Three quick questions that get students guessing about the video before they watch. Made when you
            teach the lesson.
          </LockedChip>
        </StageSection>

        <StageSection order={1} label="Briefing" animate={animate}>
          <div className="rounded-xl border border-[#2a4166] bg-[#0b1524]/90 p-4">
            <p className="text-[17px] text-white/85">Watch the video together, then check understanding:</p>
            {preview.comprehensionQuestions.length > 0 && (
              <ol className="mt-3 space-y-2">
                {preview.comprehensionQuestions.map((q, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-lg border border-[#1d2f4d] bg-[#0a1626] p-3 text-[17px] text-white/90"
                  >
                    <span className="font-bold text-cyan-300">{i + 1}.</span>
                    <span>
                      <Emphasis text={q} />
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </StageSection>

        <StageSection order={2} label="Language Toolkit" animate={animate}>
          <h3 className="mb-3 flex items-center gap-2 text-[17px] font-semibold text-white">
            <BookOpen className="h-4 w-4 text-emerald-300" aria-hidden /> Key vocabulary
            <span className="font-instrument text-[13px] font-normal uppercase tracking-wide text-white/65">
              from this video
            </span>
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {preview.keyVocab.map((v) => (
              <div key={v.word} className="rounded-xl border border-emerald-400/25 bg-[#0b1524]/90 p-4">
                <p className="text-lg font-bold text-emerald-200">{v.word}</p>
                <p className="mt-1 text-[17px] text-white/90">{v.definition}</p>
                <p className="mt-1.5 text-[15px] italic text-white/70">
                  “<Emphasis text={v.example} />”
                </p>
              </div>
            ))}
          </div>
          <div ref={vocabSentinelRef} aria-hidden />
        </StageSection>

        <StageSection order={3} label="Quick mid-lesson rounds" animate={animate} locked>
          <LockedChip>
            A quick opinion question to get students talking, a board where they post their own questions, and
            a fast find-the-mistake round. Each is made from this video when you teach the lesson.
          </LockedChip>
        </StageSection>

        <StageSection order={4} label="Main Discussion" animate={animate}>
          <div className="space-y-2">
            {preview.discussionPrompts.map((p, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-xl border border-violet-400/25 bg-[#0b1524]/90 p-3 text-[17px] text-white/90"
              >
                <MessageSquare className="mt-1 h-4 w-4 shrink-0 text-violet-300" aria-hidden />
                <span>
                  <Emphasis text={p} />
                </span>
              </div>
            ))}
          </div>
        </StageSection>

        <StageSection order={5} label="Review Game · Wrap-up" animate={animate} locked>
          <LockedChip>A quiz built from today’s words, then a class wrap-up. Made when you teach the lesson.</LockedChip>
        </StageSection>
      </div>

      {/* How to run it + the one button */}
      <div ref={lockedRef}>
        <RunItPanel isLoggedIn={isLoggedIn} onCta={onCta} />
      </div>

      {/* Scroll CTA — slim sticky bar, dismissible, never overlapping the locked CTA */}
      {showScrollCta && !ctaDismissed && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-lc-amber/20 bg-[#04101f]/95 px-4 py-3 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <p className="hidden flex-1 text-[17px] text-white/85 sm:block">
              Run this lesson with your class.
            </p>
            <button
              onClick={onCta}
              className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-5 text-base font-bold text-[#1a1204] transition hover:brightness-105 sm:flex-none"
            >
              <PlaneTakeoff className="h-4 w-4" aria-hidden />
              {ctaLabel(isLoggedIn)}
            </button>
            <button
              onClick={() => setCtaDismissed(true)}
              aria-label="Dismiss"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-lc-text3 transition-colors hover:bg-white/5 hover:text-lc-text"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function VideoLessonClient() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<{ message: string; atCapacity: boolean } | null>(null);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (stageTimer.current) clearInterval(stageTimer.current);
    };
  }, []);

  // Auth-aware: the page is in the (public) shell, so a signed-in teacher lands here too.
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }: { data: { user: { id: string } | null } }) => setIsLoggedIn(!!data.user))
      .catch(() => {});
  }, []);

  // On mount: render a shared preview (?v=) if present, else pre-load a sample so visitors
  // see the destination before deciding to try. Both are cache hits — free, no rate cost.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('v');
    const urlParam = params.get('url'); // hero paste hand-off for non-cached links
    if (v) {
      build(`https://www.youtube.com/watch?v=${v}`);
    } else if (urlParam) {
      setUrl(urlParam);
      build(urlParam);
    } else if (SAMPLE_VIDEO) {
      build(SAMPLE_VIDEO.url, { sample: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function build(targetUrl: string, opts?: { sample?: boolean; source?: 'chip' | 'pasted' }) {
    const sample = opts?.sample ?? false;
    const trimmed = targetUrl.trim();
    if (!trimmed || loading) return;
    if (!sample) {
      setLoading(true);
      setPreview(null);
      setStage(0);
      stageTimer.current = setInterval(() => {
        setStage((s) => Math.min(s + 1, LOADING_STAGES.length - 1));
      }, 2600);
      trackEvent('video_lesson_built', { source: opts?.source ?? 'pasted' });
    }
    setError(null);

    try {
      const res = await fetch('/api/public/video-lesson-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = (await res.json()) as PreviewResponse;
      if (!res.ok) {
        // Sample/shared loads fail silently — never block the page on them.
        if (!sample) {
          setError({
            message: data.error ?? 'We couldn’t build a lesson from that link. Try another video.',
            atCapacity: data.code === 'DEMO_BUSY',
          });
        }
        return;
      }
      setPreview(data);
      setIsSample(sample);
      if (!sample) {
        // Make the result a shareable, refresh-proof URL (the preview is now cached → free).
        window.history.replaceState(null, '', `/video-lesson?v=${data.videoId}`);
        requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }
    } catch {
      if (!sample) setError({ message: 'Something went wrong. Please try again.', atCapacity: false });
    } finally {
      if (!sample) {
        if (stageTimer.current) clearInterval(stageTimer.current);
        setLoading(false);
      }
    }
  }

  function handleCta() {
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
    // Logged in → straight to the handoff on /home (video auto-attaches there).
    // Logged out → sign up first, then the same handoff.
    router.push(isLoggedIn ? '/home' : '/login?next=/home');
  }

  function pickChip(chip: DemoVideo) {
    setUrl(chip.url);
    build(chip.url, { source: 'chip' });
  }

  return (
    <div className="mx-auto w-full max-w-4xl py-4 sm:py-8">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="text-center">
        <p className="font-instrument text-[13px] font-semibold uppercase tracking-[0.14em] text-lc-amber">
          {isLoggedIn ? 'A lesson from a video' : 'Free to try · no sign-up'}
        </p>
        <h1 className="font-game mt-4 text-[2.5rem] leading-[1.06] text-white sm:text-6xl">
          Turn any YouTube video into a live English lesson.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
          Paste a link. LessonCaptain reads the video and builds the lesson: the words to teach, questions about
          the video, and things to talk about. You run it with your class on one shared screen.
        </p>

        {/* Input */}
        <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-2.5 sm:flex-row">
          <input
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') build(url);
            }}
            disabled={loading}
            aria-label="YouTube link"
            placeholder="https://youtube.com/watch?v=…"
            className="min-h-[54px] min-w-0 flex-1 rounded-xl border border-[#2a4166] bg-[#0a1626] px-4 py-3 text-[17px] text-white placeholder-white/40 outline-none focus:border-lc-amber focus:ring-1 focus:ring-lc-amber/40 disabled:opacity-60"
          />
          <button
            onClick={() => build(url)}
            disabled={loading || !url.trim()}
            className="inline-flex min-h-[54px] shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-orange-400 px-6 text-lg font-bold text-[#1a1204] transition hover:brightness-105 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PlaneTakeoff className="h-4 w-4" aria-hidden />}
            {loading ? 'Building…' : 'Build my lesson'}
          </button>
        </div>

        {/* Example videos: one tap, always ready */}
        {!loading && (
          <div className="mx-auto mt-6 max-w-2xl">
            <p className="font-instrument mb-2.5 text-[13px] uppercase tracking-[0.12em] text-white/70">
              {preview && !isSample ? 'or try another' : 'or try one of these'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {FEATURED_CHIPS.map((chip) => (
                <button
                  key={chip.videoId}
                  onClick={() => pickChip(chip)}
                  className="inline-flex min-h-[44px] max-w-full items-center rounded-full border border-[#2a4166] bg-[#0b1524]/80 px-4 text-[15px] font-medium text-white/90 transition-colors hover:border-lc-amber/70 hover:text-white"
                >
                  <span className="truncate">{chip.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="mx-auto mt-6 max-w-2xl text-[15px] text-white/75">
          No video? A lesson can also start from a topic, an article or a book.{' '}
          <Link href="/" className="font-semibold text-white underline underline-offset-4">See how LessonCaptain works</Link>
        </p>
      </section>

      {/* ── Loading ──────────────────────────────────────────── */}
      {loading && (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-[#2a4166] bg-[#0b1524]/90 p-8">
          <Loader2 className="h-6 w-6 animate-spin text-lc-amber" aria-hidden />
          <p className="font-instrument text-[15px] uppercase tracking-[0.14em] text-white">{LOADING_STAGES[stage]}</p>
          <div className="flex gap-1.5">
            {LOADING_STAGES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-8 rounded-full transition-colors ${i <= stage ? 'bg-lc-amber' : 'bg-white/15'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="mt-8 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-6 text-center">
          <p className="text-[17px] font-medium text-amber-200">{error.message}</p>
          {error.atCapacity && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {FEATURED_CHIPS.map((chip) => (
                <button
                  key={chip.videoId}
                  onClick={() => pickChip(chip)}
                  className="min-h-[44px] rounded-full border border-[#2a4166] bg-[#0b1524]/80 px-4 text-[15px] font-medium text-white/90 transition-colors hover:border-lc-amber/70 hover:text-white"
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
        <div ref={resultRef}>
          <LessonResult
            key={preview.videoId + (isSample ? '-sample' : '-build')}
            preview={preview}
            isSample={isSample}
            isLoggedIn={isLoggedIn}
            onCta={handleCta}
          />
          {!isSample && (
            <div className="mt-8">
              <EmailCaptureCard source="video-lesson" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
