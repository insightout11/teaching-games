'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { startClassSession } from '@/lib/start-class';

export function SessionStarter({
  classId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  studentCount,
  size = 'lg',
  label = 'Start Session',
}: {
  classId: string;
  studentCount: number;
  size?: 'sm' | 'md' | 'lg' | 'compact' | 'icon';
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const startSession = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Through the server, so the lesson counts against the free monthly lessons.
      router.push(`/sessions/${await startClassSession(classId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the class.');
      setLoading(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button onClick={startSession} disabled={loading} size={size}>
        {loading ? 'Starting...' : label}
      </Button>
      {error && (
        <span role="alert" className="max-w-xs text-right text-xs text-red-300">
          {error} {error.includes('free lessons') && <a href="/pro" className="underline">See Pro</a>}
        </span>
      )}
    </span>
  );
}
