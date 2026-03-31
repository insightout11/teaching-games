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
        <div className="text-center py-16 text-lc-text3">
          <p className="text-lg">No classes yet</p>
          <p className="text-sm mt-1">Create your first class to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="relative">
              <Link href={`/classes/${cls.id}`} className="block">
                <Card className="hover:border-lc-blue/30 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lc-text group-hover:text-lc-blue transition-colors">
                      {cls.name}
                    </h3>
                  </div>
                  <p className="text-sm text-lc-text3 mt-2">
                    Created {new Date(cls.created_at).toLocaleDateString()}
                  </p>
                  <div className="mt-4 h-7" />
                </Card>
              </Link>
              <Link
                href={`/classes/${cls.id}/control-room`}
                className="absolute bottom-4 right-4 text-xs font-semibold text-lc-blue hover:text-lc-blue-hover px-3 py-1.5 rounded-lg border border-lc-blue/30 hover:border-lc-blue/60 bg-lc-surface transition-colors z-10"
              >
                Control Room →
              </Link>
            </div>
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
            className="w-full px-4 py-2 bg-lc-surface border border-lc-border rounded-xl text-lc-text focus:outline-none focus:ring-2 focus:ring-lc-blue-glow focus:border-lc-blue"
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
