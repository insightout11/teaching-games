'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Class } from '@/lib/supabase/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function ClassSettings({ cls }: { cls: Class }) {
  const [theme, setTheme] = useState(cls.theme);
  const [name, setName] = useState(cls.name);
  const supabase = createClient();
  const router = useRouter();

  const save = async () => {
    await supabase.from('classes').update({ name, theme }).eq('id', cls.id);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm('Delete this class? This cannot be undone.')) return;
    await supabase.from('classes').delete().eq('id', cls.id);
    router.push('/classes');
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold mb-4">Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Class Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Theme</label>
          <div className="flex gap-2">
            {(['colorful', 'professional'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  theme === t
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                    : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:border-gray-200'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-between pt-2">
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Delete Class
          </Button>
          <Button size="sm" onClick={save}>
            Save Changes
          </Button>
        </div>
      </div>
    </Card>
  );
}
