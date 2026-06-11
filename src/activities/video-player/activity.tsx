'use client';

import { useState, useRef, useEffect } from 'react';
import type { ActivityProps } from '../types';
import type { VideoPlayerContent } from '../types';
import { ComprehensionQuiz } from '../shared/comprehension-quiz';
import { ListChecks, CheckCircle2, Maximize, Minimize } from 'lucide-react';

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLIFrameElement,
        opts: { events: { onStateChange?: (e: { data: number }) => void; onReady?: () => void } },
      ) => {
        getCurrentTime(): number;
        getPlayerState(): number;
        pauseVideo(): void;
        playVideo(): void;
        seekTo(seconds: number, allowSeekAhead: boolean): void;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function fsRequest(el: HTMLElement) {
  if (el.requestFullscreen) return el.requestFullscreen();
  // @ts-expect-error webkit prefix
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
}

function fsExit() {
  if (document.exitFullscreen) return document.exitFullscreen();
  // @ts-expect-error webkit prefix
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
}

function fsElement() {
  return document.fullscreenElement
    // @ts-expect-error webkit prefix
    ?? document.webkitFullscreenElement
    ?? null;
}

type Phase = 'watching' | 'quiz' | 'done';

export function VideoPlayerActivity({
  generatedContent,
  students,
  onRegisterRemoteVoteHandler,
  onSetInputSpec,
  onScore,
}: ActivityProps) {
  const content = generatedContent as VideoPlayerContent;
  const { videoUrl, videoTitle, comprehensionQuestions = [], discussionPrompt } = content;

  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const isTed = videoUrl.includes('ted.com');

  const youtubeId = isYouTube
    ? videoUrl.match(/(?:v=|embed\/)([a-zA-Z0-9_-]{11})/)?.[1]
    : null;

  // fs=0 disables YouTube's own fullscreen button — we provide our own
  const embedUrl = (() => {
    if (isTed) return videoUrl;
    return youtubeId
      ? `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&rel=0&modestbranding=1&fs=0&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`
      : null;
  })();

  const [phase, setPhase] = useState<Phase>('watching');
  const [videoEnded, setVideoEnded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<InstanceType<Window['YT']['Player']> | null>(null);

  const hasQuestions = comprehensionQuestions.length > 0;

  // Track fullscreen state
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(fsElement() === containerRef.current);
    }
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  function toggleFullscreen() {
    if (isFullscreen) {
      fsExit();
    } else if (containerRef.current) {
      void fsRequest(containerRef.current);
    }
  }

  // YouTube player: detect when the video ends. Initialised once and kept alive
  // through the quiz phase so "Rewatch" can seek the player.
  useEffect(() => {
    if (!isYouTube || !youtubeId || playerRef.current) return;

    function initPlayer() {
      if (!iframeRef.current || !window.YT?.Player) return;
      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onStateChange: (e) => {
            if (e.data === 0) setVideoEnded(true); // ended
          },
        },
      });
    }

    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }
  }, [isYouTube, youtubeId]);

  function handleRewatch(seconds: number) {
    playerRef.current?.seekTo(Math.max(0, seconds - 2), true);
    playerRef.current?.playVideo();
  }

  // ── DONE ────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="glass rounded-3xl p-8 space-y-4 max-w-2xl mx-auto text-center">
        <CheckCircle2 className="w-10 h-10 text-lc-success mx-auto" />
        <h2 className="text-2xl font-bold text-lc-text">Briefing Complete!</h2>
        <p className="text-lc-text3">The class watched the video and finished the comprehension check.</p>
      </div>
    );
  }

  // ── WATCHING + QUIZ (video stays mounted so Rewatch can seek) ──────────────
  return (
    <div className="space-y-4">
      {/* Title bar — hidden in fullscreen */}
      <div className="flex items-center gap-2">
        <span className="text-lg">🎬</span>
        <h2 className="text-base font-semibold text-lc-text truncate">{videoTitle}</h2>
        {phase === 'watching' && videoEnded && (
          <span className="text-xs text-lc-success bg-lc-success/10 border border-lc-success/30 rounded-full px-2 py-0.5">
            Video finished
          </span>
        )}
      </div>

      {/* ── Video container — this div is what goes fullscreen ── */}
      {embedUrl ? (
        <div
          ref={containerRef}
          className="relative w-full bg-black"
          style={isFullscreen ? { height: '100%' } : { paddingBottom: '56.25%' }}
        >
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={videoTitle}
          />

          {/* ── Fullscreen toggle button (bottom-right) ── */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="absolute bottom-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-lg bg-black/55 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/75 hover:text-white"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 rounded-xl border border-lc-border bg-lc-surface text-lc-text3 text-sm">
          Video unavailable
        </div>
      )}

      {/* ── Below the video: start button (watching) or the quiz ── */}
      {phase === 'watching' ? (
        hasQuestions ? (
          <>
            <button
              onClick={() => setPhase('quiz')}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                videoEnded
                  ? 'bg-lc-blue text-white hover:bg-lc-blue/80'
                  : 'border-2 border-lc-blue bg-lc-blue/10 text-lc-blue hover:bg-lc-blue/20'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              Start Comprehension Questions
              <span className="text-xs font-normal opacity-80">({comprehensionQuestions.length})</span>
            </button>
            {isTed && !videoEnded && (
              <p className="text-xs text-center text-lc-text3">
                Play the TED talk above, then start the questions when it finishes.
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-center text-lc-text3 italic">
            No comprehension questions for this video.
          </p>
        )
      ) : (
        <ComprehensionQuiz
          questions={comprehensionQuestions}
          students={students}
          gameKey="video-player"
          discussionPrompt={discussionPrompt}
          onRewatch={isYouTube ? handleRewatch : undefined}
          onSetInputSpec={onSetInputSpec}
          onRegisterRemoteVoteHandler={onRegisterRemoteVoteHandler}
          onScore={onScore}
          onComplete={() => setPhase('done')}
        />
      )}
    </div>
  );
}
