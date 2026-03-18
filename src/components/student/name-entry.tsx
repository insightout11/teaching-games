'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Team } from '@/lib/supabase/types';

const AVATAR_SEEDS = ['teal', 'amber', 'red', 'blue', 'violet', 'green', 'white', 'gold', 'black', 'pink', 'silver', 'rainbow'];

function avatarUrl(seed: string) {
  return `/avatars/avatar-${seed}.png`;
}

interface StudentSession {
  clientId: string;
  studentId: string | null;
  displayName: string;
  team: Team | null;
  avatarSeed: string;
}

interface NameEntryProps {
  sessionId: string;
  onJoin: (data: StudentSession) => void;
}

// Generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function NameEntry({ sessionId, onJoin }: NameEntryProps) {
  const [name, setName] = useState('');
  const [avatarSeed, setAvatarSeed] = useState(AVATAR_SEEDS[0]);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsJoining(true);

    // Generate or retrieve client ID
    const storageKey = `studentSession_${sessionId}`;
    let clientId: string;
    let studentId: string | null = null;

    try {
      const existing = localStorage.getItem(storageKey);
      if (existing) {
        const parsed = JSON.parse(existing);
        clientId = parsed.clientId || generateUUID();
        studentId = parsed.studentId || null;
      } else {
        clientId = generateUUID();
      }
    } catch {
      clientId = generateUUID();
    }

    // Add student to roster via API
    try {
      const response = await fetch('/api/student/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, name: trimmedName, avatarSeed }),
      });

      if (response.ok) {
        const data = await response.json();
        studentId = data.studentId;
      } else {
        console.error('Failed to join roster:', await response.text());
      }
    } catch (e) {
      console.error('Failed to call join API:', e);
    }

    const sessionData: StudentSession = {
      clientId,
      studentId,
      displayName: trimmedName,
      team: null,
      avatarSeed,
    };

    // Save to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(sessionData));
    } catch (e) {
      console.error('Failed to save session data:', e);
    }

    onJoin(sessionData);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleJoin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="glass rounded-3xl p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Join Session</h1>
          <p className="text-gray-400 text-sm">Enter your name to participate</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your name..."
              maxLength={40}
              autoFocus
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Choose Your Avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_SEEDS.map((seed) => (
                <button
                  key={seed}
                  type="button"
                  onClick={() => setAvatarSeed(seed)}
                  className={`relative p-1.5 rounded-xl transition-all ${
                    avatarSeed === seed
                      ? 'ring-2 ring-cyan-400 scale-105 bg-white/10'
                      : 'opacity-50 hover:opacity-80 hover:bg-white/5'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl(seed)}
                    alt={seed}
                    width={64}
                    height={64}
                    className="w-full h-auto rounded-lg"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={handleJoin}
          disabled={!name.trim() || isJoining}
          className="w-full py-4 text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isJoining ? 'Joining...' : 'Join Session'}
        </Button>
      </div>
    </div>
  );
}
