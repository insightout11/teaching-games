'use client';

import { useState } from 'react';
import { EyeOff, VenetianMask } from 'lucide-react';
import { buzz } from '@/components/student/phone-shell';
import type { ImposterAssignment } from '@/activities/imposter/activity';

const MONO = 'font-[family-name:var(--font-instrument)] uppercase tracking-[0.12em]';

/**
 * Imposter secret card: hidden until the student holds it, hidden again on
 * release — neighbours can't read it off the desk. Crew = cream paper (the word
 * is something you keep), imposter = red.
 */
export function ImposterSecretCard({ card }: { card: ImposterAssignment }) {
  const [peek, setPeek] = useState(false);
  const show = () => { if (!peek) buzz(40); setPeek(true); };
  const hide = () => setPeek(false);

  return (
    <div className="space-y-2">
      <p className={`${MONO} text-[11px] text-lc-text3`}>Your secret card · hold to peek</p>
      <button
        type="button"
        aria-label="Hold to see your secret card"
        onPointerDown={show}
        onPointerUp={hide}
        onPointerLeave={hide}
        onPointerCancel={hide}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') show(); }}
        onKeyUp={hide}
        className="relative flex min-h-[220px] w-full select-none flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl p-5 text-center [-webkit-touch-callout:none] touch-none"
        style={
          !peek ? { background: 'var(--lc-card)', border: '2px dashed var(--lc-border)' }
            : card.role === 'imposter' ? { background: '#2a0f14', border: '2px solid #FF4D4D' }
              : { background: '#f4efe3', color: '#1b2233' }
        }
      >
        {!peek ? (
          <>
            <EyeOff className="h-8 w-8 text-lc-text3" />
            <span className="font-display text-2xl text-lc-text">Hold to peek</span>
            <span className={`${MONO} text-[11px] text-lc-text3`}>Cover your screen · let go to hide</span>
          </>
        ) : card.role === 'imposter' ? (
          <>
            <VenetianMask className="h-9 w-9 text-red-300" />
            <span className="font-display text-3xl text-red-100">
              {card.partners && card.partners > 1 ? 'You’re an imposter' : 'You’re the imposter'}
            </span>
            {card.question ? (
              <>
                <span className={`${MONO} text-[11px] text-red-300`}>Your question</span>
                <span className="text-lg text-red-50">{card.question}</span>
                <span className="text-sm text-red-200">The crew has a different question. Blend in.</span>
              </>
            ) : (
              <>
                {card.hint && <span className={`${MONO} text-xs text-red-300`}>Hint · {card.hint}</span>}
                <span className="text-sm text-red-200">You don&apos;t know the word. Listen and blend in.</span>
              </>
            )}
          </>
        ) : card.question ? (
          <>
            <span className={`${MONO} text-[11px]`} style={{ color: '#7a6f5a' }}>Your question</span>
            <span className="font-display text-2xl leading-snug">{card.question}</span>
            <span className="text-sm" style={{ color: '#5b5446' }}>Answer out loud on your turn. One of you has a different question.</span>
          </>
        ) : (
          <>
            <span className={`${MONO} text-[11px]`} style={{ color: '#7a6f5a' }}>The secret word</span>
            <span className="break-words font-display text-4xl">{card.word}</span>
            <span className="text-sm" style={{ color: '#5b5446' }}>Give a clue, but not too easy: the imposter is listening.</span>
          </>
        )}
      </button>
    </div>
  );
}
