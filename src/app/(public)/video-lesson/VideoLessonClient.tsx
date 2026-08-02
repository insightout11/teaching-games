'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  PlaneTakeoff,
  Sparkles,
  Lock,
  BookOpen,
  MessageSquare,
  ArrowRight,
  Loader2,
  Play,
  Link as LinkIcon,
  Check,
  FileText,
  Trophy,
  X,
} from 'lucide-react';
import { FEATURED_CHIPS, type DemoVideo } from '@/lib/video-lesson-demos';
import { createClient } from '@/lib/supabase/client';
import { getFeaturedRoute } from '@/lib/discovery-shelves';
import { parseEmphasis } from '@/lib/emphasis';
import { MarketingRouteStrip } from '@/components/homepage/MarketingRouteStrip';
import { trackEvent } from '@/lib/analytics/posthog';
import { EmailCaptureCard } from '@/components/marketing/EmailCaptureCard';

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
  'Extracting the transcript…',
  'Reading the video…',
  'Planning the flight…',
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
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
            locked
              ? 'border-lc-border bg-white/[0.03] text-lc-text3'
              : 'border-cyan-300/40 bg-cyan-400/10 text-cyan-200'
          }`}
        >
          {order + 1}
        </span>
        <span className="font-instrument text-[11px] uppercase tracking-[0.16em] text-lc-text2">
          {label}
        </span>
        {locked && <Lock className="h-3 w-3 text-lc-text3" aria-hidden />}
      </div>
      {children}
    </motion.div>
  );
}

// Honest "generated when you fly it" chip — sells the full product without faking content.
function LockedChip({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-lc-border bg-white/[0.02] px-4 py-3">
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-lc-text3" aria-hidden />
      <p className="text-sm leading-relaxed text-lc-text3">{children}</p>
    </div>
  );
}

// Task 4 — the locked "live" panel: a frosted mini-leaderboard + student phone behind a
// lock badge. All hardcoded (no session code), consistent with TwoScreensSection.
const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Mei', score: 240 },
  { rank: 2, name: 'Diego', score: 215 },
  { rank: 3, name: 'Yuki', score: 190 },
];

function LockedLivePanel({ isLoggedIn, onCta }: { isLoggedIn: boolean; onCta: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-lc-amber/30 bg-gradient-to-br from-lc-amber/[0.08] to-transparent p-6">
      <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
        <div className="relative z-10">
          <p className="flex items-center gap-2 text-sm font-semibold text-lc-amber">
            <Lock className="h-4 w-4" aria-hidden />
            Live student devices, real-time scoring, and a class leaderboard
          </p>
          <p className="mt-2 text-sm leading-relaxed text-lc-text2">
            {isLoggedIn
              ? 'Open this in your planner to build the full lesson — every stage, student devices, and live scoring.'
              : 'Sign up free to run this as a full live lesson — students join from their phones, you run the whole flight, and scores track in real time.'}
          </p>
          <button
            onClick={onCta}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-lc-amber px-5 py-3 text-sm font-bold text-[#1a0f00] transition-colors hover:bg-lc-amber/90"
          >
            {isLoggedIn ? 'Open in your planner' : 'Sign up free and fly this lesson'}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {/* Frosted mock behind a lock badge */}
        <div aria-hidden className="relative mx-auto hidden h-[150px] w-[230px] select-none sm:block">
          <div className="absolute inset-0 opacity-70 blur-[1.5px]">
            {/* Mini leaderboard */}
            <div className="absolute right-0 top-0 w-40 rounded-xl border border-lc-border bg-[#0a1424]/90 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-lc-text2">
                <Trophy className="h-3 w-3 text-lc-amber" aria-hidden /> Leaderboard
              </p>
              <ul className="space-y-1.5">
                {MOCK_LEADERBOARD.map((e) => (
                  <li key={e.rank} className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                        e.rank === 1 ? 'bg-lc-amber text-[#1a0f00]' : 'bg-lc-surface text-lc-text2'
                      }`}
                    >
                      {e.rank}
                    </span>
                    <span className="flex-1 truncate text-[11px] text-lc-text">{e.name}</span>
                    <span className="text-[11px] font-semibold text-lc-text2">{e.score}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Student phone mid-answer */}
            <div className="absolute bottom-0 left-0 w-28 rounded-[1rem] border-[5px] border-[#10192c] bg-[#0a1424]/95 p-2">
              <p className="mb-1 text-center text-[8px] font-semibold text-lc-text">You · Mei</p>
              <div className="space-y-1">
                <div className="rounded bg-lc-blue px-1.5 py-1 text-[8px] font-semibold text-[#070B14]">It saves time</div>
                <div className="rounded border border-lc-border bg-lc-card/70 px-1.5 py-1 text-[8px] text-lc-text3">It builds confidence</div>
              </div>
            </div>
          </div>
          {/* Lock badge */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-lc-amber/40 bg-[#0a1424]/90 shadow-lg">
              <Lock className="h-4 w-4 text-lc-amber" aria-hidden />
            </span>
          </div>
        </div>
      </div>
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
        <div className="flex items-center justify-center gap-2 rounded-xl border border-cyan-300/15 bg-cyan-400/[0.05] px-3 py-2 text-center text-xs text-lc-text2">
          <Sparkles className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
          Here’s an example — paste your own video above to make one from it.
        </div>
      )}

      {/* Header: compact thumbnail beside title/level/hook + share */}
      <div className="rounded-2xl border border-cyan-300/20 bg-[#04101f]/80 p-5">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative mx-auto aspect-video w-full max-w-[260px] shrink-0 overflow-hidden rounded-xl bg-black sm:mx-0 sm:w-[200px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.thumbnail} alt={preview.title} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-400/15 px-2.5 py-0.5 text-xs font-semibold text-cyan-200">
                {preview.suggestedLevel}
              </span>
              <button
                onClick={copyLink}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-lc-border bg-white/[0.03] px-3 py-1 text-xs font-medium text-lc-text2 transition-colors hover:border-cyan-300/40 hover:text-lc-text"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden /> Copied
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-3.5 w-3.5" aria-hidden /> Copy lesson link
                  </>
                )}
              </button>
            </div>
            <h2 className="mt-2 text-lg font-bold leading-snug text-lc-text">{preview.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-lc-text2">{preview.hook}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-lc-text3">
              <FileText className="h-3.5 w-3.5" aria-hidden />
              {preview.transcriptUsed
                ? "Built from this video's transcript."
                : "Based on the video's topic."}
            </p>
          </div>
        </div>
      </div>

      {/* Route strip — the real Captain's Flight */}
      <div className="rounded-2xl border border-cyan-300/15 bg-[#04101f]/70 p-5">
        <MarketingRouteStrip route={FEATURED_ROUTE} animate={animate} />
      </div>

      {/* Stage-mapped content, in lesson order */}
      <div className="space-y-6">
        <StageSection order={0} label="Warm-up" animate={animate} locked>
          <LockedChip>
            3 quick warm-up questions that get students guessing about the video before they
            watch — generated when you fly it.
          </LockedChip>
        </StageSection>

        <StageSection order={1} label="Briefing" animate={animate}>
          <div className="rounded-xl border border-lc-border bg-lc-surface/50 p-4">
            <div className="flex items-center gap-3">
              <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.thumbnail} alt="" className="h-full w-full object-cover" aria-hidden />
                <span className="absolute inset-0 grid place-items-center">
                  <Play className="h-4 w-4 text-white/90" aria-hidden />
                </span>
              </div>
              <p className="text-sm text-lc-text2">Watch the video together, then check understanding:</p>
            </div>
            {preview.comprehensionQuestions.length > 0 && (
              <ol className="mt-3 space-y-2">
                {preview.comprehensionQuestions.map((q, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-lg border border-lc-border bg-lc-surface/60 p-3 text-sm text-lc-text2"
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
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-lc-text">
            <BookOpen className="h-4 w-4 text-emerald-300" aria-hidden /> Key vocabulary
            <span className="font-instrument text-[10px] font-normal uppercase tracking-wide text-lc-text3">
              from this video
            </span>
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {preview.keyVocab.map((v) => (
              <div key={v.word} className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
                <p className="text-sm font-bold text-emerald-200">{v.word}</p>
                <p className="mt-1 text-sm text-lc-text2">{v.definition}</p>
                <p className="mt-1.5 text-xs italic text-lc-text3">
                  “<Emphasis text={v.example} />”
                </p>
              </div>
            ))}
          </div>
          <div ref={vocabSentinelRef} aria-hidden />
        </StageSection>

        <StageSection order={3} label="Quick mid-lesson rounds" animate={animate} locked>
          <LockedChip>
            A quick opinion prompt to get students talking, a board where they post their own
            questions, and a fast find-the-mistake round — each built from this video when you
            fly it.
          </LockedChip>
        </StageSection>

        <StageSection order={4} label="Main Discussion" animate={animate}>
          <div className="space-y-2">
            {preview.discussionPrompts.map((p, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-xl border border-violet-400/20 bg-violet-400/[0.05] p-3 text-sm text-lc-text2"
              >
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden />
                <span>
                  <Emphasis text={p} />
                </span>
              </div>
            ))}
          </div>
        </StageSection>

        <StageSection order={5} label="Review Game · Wrap-up" animate={animate} locked>
          <LockedChip>A quiz built from today’s vocabulary, then a class wrap-up — generated when you fly it.</LockedChip>
        </StageSection>
      </div>

      {/* Locked live panel + CTA */}
      <div ref={lockedRef}>
        <LockedLivePanel isLoggedIn={isLoggedIn} onCta={onCta} />
      </div>

      {/* Scroll CTA — slim sticky bar, dismissible, never overlapping the locked CTA */}
      {showScrollCta && !ctaDismissed && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-lc-amber/20 bg-[#04101f]/95 px-4 py-3 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <p className="hidden flex-1 text-sm text-lc-text2 sm:block">
              Run this as a full live lesson with your class.
            </p>
            <button
              onClick={onCta}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-lc-amber px-4 py-2.5 text-sm font-bold text-[#1a0f00] transition-colors hover:bg-lc-amber/90 sm:flex-none"
            >
              {isLoggedIn ? 'Open in your planner' : 'Sign up free and fly this lesson'}
              <ArrowRight className="h-4 w-4" aria-hidden />
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
    // Logged in → straight to the planner handoff on /home (video auto-attaches there).
    // Logged out → sign up first, then the same handoff.
    router.push(isLoggedIn ? '/home' : '/login?next=/home');
  }

  function pickChip(chip: DemoVideo) {
    setUrl(chip.url);
    build(chip.url, { source: 'chip' });
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="text-center">
        {!isLoggedIn && (
          <span className="font-instrument inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
            <Sparkles className="h-3 w-3" aria-hidden />
            Free · No sign-up
          </span>
        )}
        <h1 className="mt-5 text-3xl font-bold leading-tight text-lc-text sm:text-[2.6rem]">
          Turn any YouTube video into a live English lesson
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-lc-text2">
          Paste a link and watch a full lesson build itself — vocabulary, comprehension,
          discussion, and a live class flight you run together.
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

        {/* Instant-gratification chips — recognizable thumbnails, always one cache-hit away */}
        {!loading && (
          <div className="mx-auto mt-6 max-w-md">
            <p className="font-instrument mb-2 text-[11px] uppercase tracking-wider text-lc-text3">
              {preview && !isSample ? 'or try another' : 'or try one of these'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {FEATURED_CHIPS.map((chip) => (
                <button
                  key={chip.videoId}
                  onClick={() => pickChip(chip)}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-white/[0.03] py-1 pl-1 pr-3 text-left transition-colors hover:border-cyan-300/45"
                >
                  <span className="relative h-7 w-12 shrink-0 overflow-hidden rounded-full bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${chip.videoId}/mqdefault.jpg`}
                      alt=""
                      aria-hidden
                      className="h-full w-full object-cover opacity-85"
                    />
                  </span>
                  <span className="max-w-[9rem] truncate text-xs font-medium text-lc-text2">{chip.title}</span>
                </button>
              ))}
            </div>
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
                  onClick={() => pickChip(chip)}
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
