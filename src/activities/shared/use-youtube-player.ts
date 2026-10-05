'use client';

import { useEffect, useRef, useState } from 'react';

type YTPlayer = InstanceType<Window['YT']['Player']>;

/** A YouTube IFrame API player bound to an iframe (Radio Check, First/Final Listen). */
export function useYouTubePlayer(youtubeId: string | undefined, iframe: HTMLIFrameElement | null) {
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  /** Wall-clock time the video last entered PLAYING (null while paused/buffering). */
  const playingSince = useRef<number | null>(null);
  useEffect(() => {
    if (!youtubeId || !iframe) return;
    const init = () => {
      playerRef.current = new window.YT.Player(iframe, {
        events: {
          onReady: () => setReady(true),
          onStateChange: (e) => { playingSince.current = e.data === 1 ? Date.now() : null; },
        },
      });
    };
    if (window.YT?.Player) init();
    else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); init(); };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }
  }, [youtubeId, iframe]);
  return { playerRef, ready, playingSince };
}
