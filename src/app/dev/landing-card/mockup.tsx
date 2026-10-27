'use client';

import { useEffect, useState } from 'react';
import { Josefin_Sans } from 'next/font/google';
import { Compass, Plane, Stamp, Sparkles } from 'lucide-react';
import { DestinationArrivalScene } from '@/components/world-flight/arrival-scene/destination-arrival-scene';
import { getDestinationById } from '@/data/world-flight/destinations';
import { MascotFigure } from '@/components/ui/mascot-figure';

const deco = Josefin_Sans({ subsets: ['latin'], weight: ['400', '600', '700'] });

// Poster paper: warm cream with a faint grain, as on printed travel posters.
const PAPER = '#f3e9d2';
const INK = '#1d2340';
const grain = 'radial-gradient(rgba(29,35,64,.06) 1px, transparent 1px)';

const CITIES = ['tokyo', 'cairo', 'paris', 'rio-de-janeiro', 'istanbul'];

export function LandingCardMockup() {
  const [cityId, setCityId] = useState('tokyo');
  const [tod, setTod] = useState<'day' | 'dusk' | 'night'>('dusk');
  const city = getDestinationById(cityId)!;
  // draw only in the browser (the arrival scene reads the clock, so server and browser differ)
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <main className="min-h-screen bg-[#0b1220]" />;
  return (
    <main className="min-h-screen bg-[#0b1220] p-6 text-white">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <b className="mr-2">Landing card mockup</b>
        {CITIES.map((c) => <button key={c} type="button" onClick={() => setCityId(c)} className={`rounded-full border px-3 py-1 ${c === cityId ? 'border-amber-300 text-amber-200' : 'border-white/20 text-white/70'}`}>{getDestinationById(c)?.city}</button>)}
        {(['day', 'dusk', 'night'] as const).map((t) => <button key={t} type="button" onClick={() => setTod(t)} className={`rounded-full border px-3 py-1 ${t === tod ? 'border-amber-300 text-amber-200' : 'border-white/20 text-white/70'}`}>{t}</button>)}
      </div>

      {/* the card: a poster with a ticket stub underneath */}
      <article className="mx-auto max-w-[760px] -rotate-[0.6deg] overflow-hidden rounded-[6px] shadow-[0_24px_60px_rgba(0,0,0,.55)]" style={{ background: PAPER, color: INK, backgroundImage: grain, backgroundSize: '4px 4px' }}>
        {/* poster: the city's own arrival art, framed by a cream margin, with poster lettering */}
        <div className="p-4 pb-0">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[3px]">
            <DestinationArrivalScene destinationId={city.id} scene={city.scene} phase="landed" progress={1} motion="static" timeOfDay={tod} className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-black/25 to-transparent" />
            <div className={`${deco.className} absolute inset-x-0 top-5 text-center text-[#fdf4dc] drop-shadow-[0_2px_0_rgba(29,35,64,.55)]`}>
              <p className="text-[13px] font-semibold tracking-[0.5em]">WELCOME TO</p>
              <p className="text-[64px] font-bold leading-[0.95] tracking-[0.08em] sm:text-[84px]">{city.city.toUpperCase()}</p>
              <p className="mt-1 text-[12px] font-semibold tracking-[0.45em]">{city.country.toUpperCase()}</p>
            </div>
            <div className={`${deco.className} absolute bottom-3 right-3 flex items-center gap-1.5 rounded-sm bg-[#fdf4dc]/90 px-2 py-0.5 text-[11px] font-bold tracking-[0.3em]`}>
              <Plane className="h-3.5 w-3.5" /> FLY LESSONCAPTAIN
            </div>
            <div className="absolute bottom-2 left-3"><MascotFigure look={{ body: 'robot', color: '#a78bfa', eyes: 'sleepy', head: 'horns', extra: 'jetpack' }} size={72} title="Captain Crumbs" /></div>
          </div>
        </div>

        {/* stub: perforated edge, then the flight facts */}
        <div className="relative mt-4">
          <div className="absolute inset-x-0 top-0 border-t-2 border-dashed border-[#1d2340]/25" />
          <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[#0b1220]" /><span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-[#0b1220]" />
        </div>
        <div className={`${deco.className} grid grid-cols-2 gap-3 px-6 pt-4 sm:grid-cols-4`}>
          {[['FLIGHT', `Dubai → ${city.city}`], ['LOCAL TIME', '18:42'], ['WEATHER', '24°C · clear'], ['STAMPS', '6 cities']].map(([k, v]) => (
            <div key={k}><p className="text-[10px] font-semibold tracking-[0.3em] text-[#1d2340]/55">{k}</p><p className="text-[17px] font-bold">{v}</p></div>
          ))}
        </div>

        {/* today's moments, as stamps on the stub */}
        <div className="grid gap-3 px-6 py-4 sm:grid-cols-3">
          <div className="rotate-[-1.5deg] rounded-md border-2 border-[#b4483a]/70 p-2.5 text-[#7a2e24]">
            <p className={`${deco.className} flex items-center gap-1 text-[10px] font-bold tracking-[0.25em]`}><Stamp className="h-3.5 w-3.5" /> OUR PREDICTION</p>
            <p className="mt-1 text-sm">We land at 18:40 local time.</p><p className="text-xs opacity-75">7 of 11 guessed right</p>
          </div>
          <div className="rotate-[1deg] rounded-md border-2 border-[#2f6b5a]/70 p-2.5 text-[#1f4a3e]">
            <p className={`${deco.className} flex items-center gap-1 text-[10px] font-bold tracking-[0.25em]`}><Sparkles className="h-3.5 w-3.5" /> BEST DISCOVERY</p>
            <p className="mt-1 text-sm">Mount Fuji at sunset</p><p className="text-xs opacity-75">The album cover for this flight</p>
          </div>
          <div className="rotate-[-0.5deg] rounded-md border-2 border-[#3a4a8a]/60 p-2.5 text-[#2a3566]">
            <p className={`${deco.className} flex items-center gap-1 text-[10px] font-bold tracking-[0.25em]`}><Compass className="h-3.5 w-3.5" /> EARNED TODAY</p>
            <div className="mt-1 flex gap-1.5">
              {['camel', 'teapot', 'tea'].map((s) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={s} src={`/stickers/${s}.webp`} alt="" className="h-8 w-8 rounded bg-white/70 p-0.5" />
              ))}
            </div>
          </div>
        </div>

        {/* actions */}
        <div className={`${deco.className} flex flex-wrap items-center justify-end gap-2 border-t border-[#1d2340]/15 px-6 py-3`}>
          <button type="button" className="rounded-sm bg-[#e9a23b] px-4 py-2 text-sm font-bold tracking-[0.15em] text-[#1d2340]">EXPLORE THE CITY</button>
          <button type="button" className="rounded-sm border-2 border-[#1d2340]/40 px-3 py-1.5 text-sm font-semibold tracking-[0.12em]">BEST DISCOVERY?</button>
          <button type="button" className="rounded-sm border-2 border-[#1d2340]/40 px-3 py-1.5 text-sm font-semibold tracking-[0.12em]">WHERE NEXT?</button>
          <button type="button" className="rounded-sm bg-[#1d2340] px-4 py-2 text-sm font-bold tracking-[0.15em] text-[#f3e9d2]">END CLASS</button>
        </div>
      </article>
      <p className="mx-auto mt-4 max-w-[760px] text-sm text-white/60">Mockup only, with sample numbers. The poster uses each city&apos;s own arrival art, so every destination gets its own poster in the right light.</p>
    </main>
  );
}
