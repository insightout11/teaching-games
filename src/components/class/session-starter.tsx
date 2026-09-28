'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function SessionStarter({
  classId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  studentCount,
  size = 'lg',
}: {
  classId: string;
  studentCount: number;
  size?: 'sm' | 'md' | 'lg' | 'compact' | 'icon';
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const startSession = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data } = await supabase
      .from('sessions')
      .insert({ class_id: classId })
      .select()
      .single();

    if (data) {
      // A plan-free session opens as the Live Room. Drop the legacy unscoped plan
      // key so a lesson run earlier in this tab isn't loaded into the new room.
      try {
        sessionStorage.removeItem('lessonPlanContent');
      } catch {
        // storage unavailable — nothing to clear
      }
      router.push(`/sessions/${data.id}`);
    }
    setLoading(false);
  };

  return (
    <Button onClick={startSession} disabled={loading} size={size}>
      {loading ? 'Opening…' : 'Open Live Room'}
    </Button>
  );
}
