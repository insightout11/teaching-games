'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Class } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import Link from 'next/link';

export function ClassList({ initialClasses }: { initialClasses: Class[] }) {
  const [classes, setClasses] = useState(initialClasses);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('classes')
      .insert({ name: name.trim(), teacher_id: user.id })
      .select()
      .single();

    if (data) {
      setClasses([data, ...classes]);
      setName('');
      setShowCreate(false);
    }
    setLoading(false);
  };

  return (
    <>
      <Button onClick={() => setShowCreate(true)} className="mb-6">
        + New Class
      </Button>

      {classes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No classes yet</p>
          <p className="text-sm mt-1">Create your first class to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <Link key={cls.id} href={`/classes/${cls.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {cls.name}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 capitalize">
                    {cls.theme}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Created {new Date(cls.created_at).toLocaleDateString()}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Class">
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Class name"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
