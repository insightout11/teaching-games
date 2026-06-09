'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { ClassQuestionsContent } from '@/components/session/class-questions-widget';

export default function QuestionsPopupPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const topic = searchParams.get('topic') ?? 'General';
  const difficulty = searchParams.get('difficulty') ?? 'Intermediate';

  async function handleShowAnswer(question: string, answer: string) {
    await fetch('/api/session/screen-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, question, answer }),
    });
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
