'use client';

import { useCallback, useEffect, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { ClassBoardCanvas } from '@/components/session/class-board-canvas';
import { boardSpecFields, getClassBoardPreset } from '@/lib/class-board';
import type { InputSpec } from '@/lib/input-spec';
import type { ActivityProps, WonderBoardContent } from '../types';

// Wonder Board runs on the class board: a 5 Ws question wall. Students post questions
// into Who/What/When/Where/Why, the class upvotes, the teacher answers (AI or by hand),
// and students follow up on answered questions. Moderation happens in the cockpit.

const BOARD_KEY = 'wonder-board';

type Phase = 'idle' | 'collecting' | 'done';

export function WonderBoardActivity({
  sessionId,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
}: ActivityProps) {
  const content = generatedContent as WonderBoardContent;
  const [phase, setPhase] = useState<Phase>('idle');

  const buildSpec = useCallback((): InputSpec => {
    const preset = getClassBoardPreset('five-ws');
    return {
      type: 'board',
      gameKey: 'wonder-board',
      prompt: content.framingPrompt,
      instruction: 'Ask a question',
      maxLength: 200,
      allowMultiple: true,
      boardQuestionWall: true,
      ...boardSpecFields(preset, BOARD_KEY),
      boardTitle: 'Wonder Board',
    };
  }, [content.framingPrompt]);

  // Broadcast / clear the board spec as the phase changes.
  useEffect(() => {
    if (phase === 'collecting') {
      onSetInputSpec?.(buildSpec());
    } else {
      onSetInputSpec?.(null);
    }
  }, [phase, buildSpec, onSetInputSpec]);

  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const handleStart = useCallback(() => {
    setPhase('collecting');
    onPhaseChange?.('collecting');
  }, [onPhaseChange]);

  const handleEnd = useCallback(() => {
    setPhase('done');
    onPhaseChange?.('finished');
  }, [onPhaseChange]);

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 py-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-violet-400/20 blur-2xl" />
          <HelpCircle className="relative h-20 w-20 text-violet-300" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-300/70">Question Wall</p>
          <h3 className="mt-2 text-4xl font-game text-white">Wonder Board</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{content.framingPrompt}</p>
          <p className="mx-auto mt-2 max-w-lg text-xs text-slate-500">
            Students post questions into Who / What / When / Where / Why. The class upvotes, you answer
            (AI or your own), and students can follow up. Approve questions from your cockpit.
          </p>
        </div>
        <button
          onClick={handleStart}
          className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 px-12 py-5 font-game text-xl text-white shadow-xl transition hover:scale-105 active:scale-95"
        >
          OPEN BOARD
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-300/70">Wonder Board</p>
          <h3 className="mt-1 text-2xl font-game text-white">
            {phase === 'collecting' ? 'Collecting questions' : 'Board closed'}
          </h3>
        </div>
        {phase === 'collecting' ? (
          <button
            onClick={handleEnd}
            className="rounded-xl bg-white/10 px-5 py-2.5 font-game text-sm text-white transition hover:bg-white/20"
          >
            END ACTIVITY
          </button>
        ) : (
          <button
            onClick={() => { setPhase('idle'); onPhaseChange?.('idle'); }}
            className="rounded-xl bg-white/10 px-5 py-2.5 font-game text-sm text-white transition hover:bg-white/20"
          >
            RESET
          </button>
        )}
      </div>

      {sessionId ? (
        <div className="rounded-2xl border border-violet-300/15 bg-slate-950/45">
          <ClassBoardCanvas sessionId={sessionId} boardKey={BOARD_KEY} presetKey="five-ws" questionWall />
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-400">Start a live session to collect questions.</p>
      )}
    </div>
  );
}
