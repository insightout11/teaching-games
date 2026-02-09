'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function SessionStarter({ classId, studentCount }: { classId: string; studentCount: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const startSession = async () => {
    if (studentCount === 0) {
      alert('Add students to your roster first');
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('sessions')
      .insert({ class_id: classId })
      .select()
      .single();

    if (data) {
      router.push(`/sessions/${data.id}`);
    }
    setLoading(false);
  };

  return (
    <Button onClick={startSession} disabled={loading} size="lg">
      {loading ? 'Starting...' : 'Start Session'}
    </Button>
  );
}
