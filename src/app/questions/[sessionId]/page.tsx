'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { ClassQuestionsContent } from '@/components/session/class-questions-widget';

export default function QuestionsPopupPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const topic = searchParams.get('topic') ?? 'General';
  const difficulty = searchParams.get('difficulty') ?? 'Intermediate';

  function handleShowAnswer(question: string, answer: string) {
    // Send to the main session tab via BroadcastChannel so the overlay appears there
    const ch = new BroadcastChannel(`lc-session-${sessionId}`);
    ch.postMessage({ kind: 'show-answer', question, answer });
    ch.close();
  }

  return (
    <div className="min-h-screen bg-lc-bg p-4">
      <ClassQuestionsContent
        sessionId={sessionId}
        topic={topic}
        difficulty={difficulty}
        onShowAnswer={handleShowAnswer}
      />
    </div>
  );
}
