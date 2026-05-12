'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ClassQuestionsContent } from '@/components/session/class-questions-widget';

export default function QuestionsPopupPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const topic = searchParams.get('topic') ?? 'General';
  const difficulty = searchParams.get('difficulty') ?? 'Intermediate';

  const [answer, setAnswer] = useState<{ question: string; answer: string } | null>(null);

  return (
    <div className="min-h-screen bg-lc-bg p-4">
      {answer && (
        <div className="mb-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
          <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">Answer</p>
          <p className="text-sm text-lc-text2 italic mb-1">{answer.question}</p>
          <p className="text-lc-text">{answer.answer}</p>
          <button
            onClick={() => setAnswer(null)}
            className="mt-2 text-xs text-lc-text3 hover:text-lc-text"
          >
            Dismiss
          </button>
        </div>
      )}
      <ClassQuestionsContent
        sessionId={sessionId}
        topic={topic}
        difficulty={difficulty}
        onShowAnswer={(q, a) => setAnswer({ question: q, answer: a })}
      />
    </div>
  );
}
