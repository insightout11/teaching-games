import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MOCK_USER } from '@/lib/mock/data';
import type { User } from '@supabase/supabase-js';

function isMockModeServer(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
}

export default async function CockpitLayout({ children }: { children: React.ReactNode }) {
  let user: User | null = null;

  if (isMockModeServer()) {
    user = MOCK_USER as unknown as User;
  } else {
    const supabase = createServerSupabase();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  }

  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      {children}
    </div>
  );
}
