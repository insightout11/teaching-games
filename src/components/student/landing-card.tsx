'use client';

import { Check, Flame, PlaneLanding, Share2, Volume2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { ReferenceVocabItem } from '@/lib/reference-materials';
import type { PhraseState } from '@/lib/phrasebook-progress';
import { CrewAvatar } from '@/components/ui/crew-avatar';
import { speak } from '@/components/student/phrase-card';

// End of the lesson on the phone: an arrival card on cream "keepsake" paper
// (cream = something you keep), torn into a pass and a stub like the Phrasebook.

const PAPER = '#f4efe3';
const INK = '#1b2233';
const INK_SOFT = '#5b5446';
const INK_FAINT = '#7a6f5a';
const STAMP = '#d4537e';
const RULE = '#c9bfa8';
const MONO = 'font-[family-name:var(--font-instrument)] uppercase tracking-[0.12em]';

export interface LandingResults {
  totalPoints: number;
  accuracy: number | null;
  bestStreak: number;
  rank: number | null;
  totalParticipants: number | null;
}

function Field({ label, children, big }: { label: string; children: React.ReactNode; big?: boolean }) {
  return (
    <div className="min-w-0">
      <p className={`${MONO} text-[10px]`} style={{ color: INK_FAINT }}>{label}</p>
      <p className={big ? 'font-display text-[34px] leading-none' : 'truncate text-[15px] font-semibold leading-snug'}>{children}</p>
    </div>
  );
}

export function LandingCard({
  name,
  seat,
  avatarSeed,
  topic,
  results,
  words,
  debriefUrl,
  shareCopied,
  onShare,
  hideRank = false,
}: {
  name: string;
  seat: string | null;
  avatarSeed: string | null;
  topic: string | null;
  results: LandingResults | null;
  words: Array<{ item: ReferenceVocabItem; state: PhraseState }>;
  debriefUrl: string | null;
  shareCopied: boolean;
  onShare: () => void;
  /** Junior classes: never show a rank. */
  hideRank?: boolean;
}) {
  const date = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const used = words.filter((w) => w.state === 'used' || w.state === 'mastered').length;
  // Rank is a pat on the back for the top three, never a "#9 of 10".
  const podium = !hideRank && results?.rank != null && results.totalParticipants != null && results.totalParticipants > 1 && results.rank <= 3;

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="text-center">
        <PlaneLanding className="mx-auto h-9 w-9 text-cyan-300" strokeWidth={1.5} aria-hidden />
        <h1 className="mt-2 font-display text-[32px] leading-tight text-white">You&apos;ve landed, {name}!</h1>
        <p className={`${MONO} mt-1 text-[11px] text-amber-300/80`}>Flight complete · great work today</p>
      </div>

      <article className="relative overflow-hidden rounded-3xl shadow-2xl" style={{ background: PAPER, color: INK }}>
        <div className="h-2" style={{ background: '#F59E0B' }} />

        {/* Pass */}
        <div className="relative px-5 pb-5 pt-4">
          <div className="flex items-center gap-3">
            <CrewAvatar seed={avatarSeed} name={name} size={52} />
            <div className="min-w-0 flex-1">
              <p className={`${MONO} text-[10px]`} style={{ color: INK_FAINT }}>Arrival card · LC International</p>
              <p className="truncate font-display text-[26px] leading-tight">{topic || 'Today’s flight'}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-3" style={{ borderColor: RULE }}>
            <Field label="Passenger">{name}</Field>
            <Field label="Seat">{seat ?? '—'}</Field>
            <Field label="Date">{date}</Field>
          </div>

          {results && (
            <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-3" style={{ borderColor: RULE }}>
              <Field label="Points" big>{results.totalPoints}</Field>
              {results.accuracy !== null ? <Field label="Accuracy" big>{results.accuracy}%</Field> : <span />}
              {results.bestStreak >= 2 ? (
                <Field label="Best streak" big><span className="inline-flex items-center gap-1"><Flame className="h-6 w-6" style={{ color: '#ea580c' }} />{results.bestStreak}</span></Field>
              ) : <span />}
            </div>
          )}
          {podium && (
            <p className="mt-3 text-[15px]" style={{ color: INK_SOFT }}>
              Top {results!.rank === 1 ? 'of the class' : 'three'}: <span className="font-semibold" style={{ color: INK }}>#{results!.rank}</span> of {results!.totalParticipants}
            </p>
          )}

          {/* ARRIVED stamp */}
          <div
            className="pointer-events-none absolute right-4 top-16 select-none rounded-lg border-[3px] px-3 py-1 text-center animate-[lcArrive_620ms_cubic-bezier(.2,1.4,.4,1)_300ms_both]"
            style={{ borderColor: STAMP, color: STAMP, transform: 'rotate(-10deg)', mixBlendMode: 'multiply' }}
          >
            <p className={`${MONO} text-[15px] font-semibold leading-tight`}>Arrived</p>
            <p className={`${MONO} text-[10px] leading-tight`}>{date}</p>
          </div>
          <style>{'@keyframes lcArrive{0%{transform:rotate(-10deg) scale(2.4);opacity:0}55%{transform:rotate(-10deg) scale(.92);opacity:1}100%{transform:rotate(-10deg) scale(1);opacity:1}}'}</style>
        </div>

        {/* Perforation */}
        <div className="relative mx-5 border-t-2 border-dashed" style={{ borderColor: RULE }}>
          <span className="absolute -left-7 -top-2.5 h-5 w-5 rounded-full bg-[#0b1220]" />
          <span className="absolute -right-7 -top-2.5 h-5 w-5 rounded-full bg-[#0b1220]" />
        </div>

        {/* Stub: the words you keep */}
        <div className="px-5 pb-5 pt-4">
          {words.length > 0 && (
            <>
              <div className="flex items-baseline justify-between">
                <p className={`${MONO} text-[11px]`} style={{ color: INK_FAINT }}>Words you keep</p>
                {used > 0 && <p className={`${MONO} text-[11px]`} style={{ color: STAMP }}>Used {used} of {words.length}</p>}
              </div>
              <div className="mt-2 divide-y" style={{ borderColor: RULE }}>
                {words.map(({ item, state }) => {
                  const isUsed = state === 'used' || state === 'mastered';
                  return (
                    <button key={item.word} type="button" onClick={() => speak(item.word)} className="flex w-full items-start gap-2.5 py-2 text-left" style={{ borderColor: RULE }}>
                      <Volume2 className="mt-1.5 h-3.5 w-3.5 shrink-0" style={{ color: INK_FAINT }} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="font-display text-[20px] leading-tight">{item.word}</span>
                        {item.definition && <span className="block text-[13px] leading-snug" style={{ color: INK_SOFT }}>{item.definition}</span>}
                      </span>
                      {isUsed && (
                        <span className={`${MONO} mt-1 shrink-0 rounded border-[1.5px] px-1.5 text-[10px]`} style={{ color: STAMP, borderColor: STAMP }}>Used</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {debriefUrl && (
            <div className="mt-4 flex items-center gap-4 border-t pt-4" style={{ borderColor: RULE }}>
              <div className="rounded-lg bg-white p-1.5">
                <QRCodeSVG value={debriefUrl} size={84} bgColor="#ffffff" fgColor={INK} />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-[13px] leading-snug" style={{ color: INK_SOFT }}>Keep this card: scan or save the link to see your words again.</p>
                <button type="button" onClick={onShare} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold active:scale-[0.98]" style={{ background: INK, color: '#F59E0B' }}>
                  {shareCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {shareCopied ? 'Link copied' : 'Save my card'}
                </button>
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
