import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/ui/sidebar';
import { MOCK_USER } from '@/lib/mock/data';
import type { User } from '@supabase/supabase-js';

function isMockModeServer(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user: User | null = null;

  if (isMockModeServer()) {
    // In mock mode, use the mock user directly
    user = MOCK_USER as unknown as User;
  } else {
    const supabase = createServerSupabase();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  }

  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex bg-lc-bg text-lc-text">
      <Sidebar user={user} />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
