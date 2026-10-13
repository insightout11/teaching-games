'use client';

import { useEffect, useState } from 'react';
import { SkyBackground, type WeatherState } from '@/components/ui/sky-background';

// The sky behind the signed-in pages follows the teacher's own clock: morning and day are blue, the early evening
// is golden, and night is dark with the moon and stars. (The teaching room is different: its sky follows the real
// flight.) Add ?sky=morning|day|sunset|night to any signed-in page to see a mood without waiting for the hour.

export type SkyMood = 'morning' | 'day' | 'sunset' | 'night';

export function skyMoodForHour(hour: number): SkyMood {
  if (hour >= 6 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'sunset';
  return 'night';
}

// Night keeps the calm dusk clouds these pages have always had (the 'cruising' mood lights its clouds brightly,
// which fights the text). The moon comes out, and the sky's own star field (random, and behind the clouds) is
// turned up.
const WEATHER: Record<SkyMood, WeatherState> = { morning: 'day', day: 'day', sunset: 'golden', night: 'golden' };
const CLOUDS = [
  { top: '10%', left: '3%', w: 320, o: 0.45 },
  { top: '22%', left: '72%', w: 420, o: 0.5 },
  { top: '58%', left: '-4%', w: 360, o: 0.4 },
  { top: '72%', left: '76%', w: 300, o: 0.45 },
];
const MOODS: SkyMood[] = ['morning', 'day', 'sunset', 'night'];

function currentMood(): SkyMood {
  try {
    const forced = new URLSearchParams(window.location.search).get('sky') as SkyMood | null;
    if (forced && MOODS.includes(forced)) return forced;
  } catch { /* no window */ }
  return skyMoodForHour(new Date().getHours());
}

export function ClockSky() {
  // Night until the browser tells us the time: the pages were designed on a dark sky, so that is the safe first paint.
  const [mood, setMood] = useState<SkyMood>('night');
  useEffect(() => {
    const update = () => setMood(currentMood());
    update();
    const id = setInterval(update, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  // The pages were designed on a dark sky. In daylight the two grey text colours are lightened (globals.css reads
  // this attribute), so small labels sitting directly on the sky stay readable.
  useEffect(() => {
    document.documentElement.dataset.sky = mood;
    return () => { delete document.documentElement.dataset.sky; };
  }, [mood]);
  const bright = mood === 'morning' || mood === 'day';

  return (
    <>
      <SkyBackground weatherState={WEATHER[mood]} altitude={0.75} intensity="subtle" showCityLights={false} showMoon={mood === 'night'} hideMoon={mood !== 'night'} starBoost={mood === 'night' ? 1.9 : 1} />
      {/* Sunset: a warm band low in the sky. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1] transition-opacity duration-1000"
        style={{ opacity: mood === 'sunset' ? 0.55 : 0, background: 'linear-gradient(180deg, rgba(70,44,110,0.25) 0%, rgba(196,98,84,0.55) 65%, rgba(244,156,92,0.7) 100%)' }}
      />
      {/* Morning and day: the sky system's own "day" mood only brightens its clouds on a navy sky, so a blue wash
          makes it daylight (warmer near the horizon in the morning), with soft clouds drawn above the wash. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1] transition-opacity duration-1000"
        style={{
          opacity: bright ? 0.7 : 0,
          background: mood === 'morning'
            ? 'linear-gradient(180deg, #21498a 0%, #5d87bd 55%, #e0a57f 100%)'
            : 'linear-gradient(180deg, #1c4f92 0%, #3f79b8 55%, #6f9fd0 100%)',
        }}
      />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[1] overflow-hidden transition-opacity duration-1000" style={{ opacity: bright ? 1 : 0 }}>
        {CLOUDS.map((c, i) => (
          <div key={i} className="absolute" style={{ top: c.top, left: c.left, width: c.w }}>
            <div className="relative h-[90px] w-full blur-[14px]" style={{ opacity: c.o }}>
              <span className="absolute bottom-0 left-0 h-[46px] w-full rounded-full bg-white" />
              <span className="absolute bottom-[16px] left-[12%] h-[58px] w-[40%] rounded-full bg-white" />
              <span className="absolute bottom-[20px] left-[40%] h-[70px] w-[40%] rounded-full bg-white" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
