'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { isMockMode } from '@/lib/mock/auth';

export default function LoginPage() {
  const router = useRouter();
  const mockMode = isMockMode();

  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
  };

  const handleDemoLogin = () => {
    // In mock mode, just redirect to classes
    router.push('/classes');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">TeachPlay</h1>
        <p className="text-gray-500 mb-8">Interactive classroom games that make learning fun</p>

        {mockMode ? (
          <button
            onClick={handleDemoLogin}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 rounded-xl px-6 py-3 text-white font-medium hover:bg-indigo-700 transition-all"
          >
            <span className="text-xl">🎮</span>
            Enter as Demo User
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-xl px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        )}

        {mockMode && (
          <p className="mt-4 text-sm text-amber-600 bg-amber-50 rounded-lg p-2">
            Demo Mode: No authentication required
          </p>
        )}
      </div>
    </div>
  );
}
