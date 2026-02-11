'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Student } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const isMockMode = () => process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

// In mock mode, persist students to localStorage
function getMockStudents(classId: string, fallback: Student[]): Student[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(`mock-students-${classId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load mock students:', e);
  }
  return fallback;
}

function saveMockStudents(classId: string, students: Student[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`mock-students-${classId}`, JSON.stringify(students));
  } catch (e) {
    console.error('Failed to save mock students:', e);
  }
}

// Parse bulk input: supports newlines, commas, and mixed
function parseBulkNames(input: string): string[] {
  // Split by newlines and commas
  const rawNames = input.split(/[\n,]+/);

  // Normalize: trim, collapse multiple spaces, filter empty
  const normalized = rawNames
    .map((n) => n.trim().replace(/\s+/g, ' '))
    .filter(Boolean);

  // Dedupe case-insensitive (keep first casing)
  const seen = new Map<string, string>();
  normalized.forEach((name) => {
    const lower = name.toLowerCase();
    if (!seen.has(lower)) {
      seen.set(lower, name);
    }
  });

  return Array.from(seen.values());
}

export function RosterEditor({ classId, initialStudents }: { classId: string; initialStudents: Student[] }) {
  const [students, setStudents] = useState(initialStudents);
  const [newName, setNewName] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkNames, setBulkNames] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const supabase = createClient();

  // In mock mode, load from localStorage on mount
  useEffect(() => {
    if (isMockMode()) {
      const stored = getMockStudents(classId, initialStudents);
      setStudents(stored);
    }
  }, [classId, initialStudents]);

  // Save to localStorage whenever students change (mock mode only)
  const updateStudents = useCallback((newStudents: Student[]) => {
    const sorted = [...newStudents].sort((a, b) => a.name.localeCompare(b.name));
    setStudents(sorted);
    if (isMockMode()) {
      saveMockStudents(classId, sorted);
    }
  }, [classId]);

  const addStudent = async () => {
    if (!newName.trim()) return;
    const name = newName.trim().replace(/\s+/g, ' ');

    // Check for duplicate
    const exists = students.some((s) => s.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      setFeedback(`"${name}" already exists`);
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    if (isMockMode()) {
      const newStudent: Student = {
        id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        class_id: classId,
        name,
        avatar_seed: `seed-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      updateStudents([...students, newStudent]);
      setNewName('');
      setFeedback('Added 1 student');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .insert({ class_id: classId, name })
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        setFeedback(`Error: ${error.message}`);
        setTimeout(() => setFeedback(null), 5000);
        return;
      }

      if (data) {
        updateStudents([...students, data]);
        setNewName('');
        setFeedback('Added 1 student');
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Add student error:', err);
      setFeedback('Failed to add student');
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const addBulk = async () => {
    const parsed = parseBulkNames(bulkNames);
    if (parsed.length === 0) {
      setFeedback('No names to add');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    // Filter out existing students (case-insensitive)
    const existingLower = new Set(students.map((s) => s.name.toLowerCase()));
    const newNames = parsed.filter((n) => !existingLower.has(n.toLowerCase()));
    const skipped = parsed.length - newNames.length;

    if (newNames.length === 0) {
      setFeedback(`All ${parsed.length} names already exist`);
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    if (isMockMode()) {
      const newStudents: Student[] = newNames.map((name, i) => ({
        id: `student-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        class_id: classId,
        name,
        avatar_seed: `seed-${Date.now()}-${i}`,
        created_at: new Date().toISOString(),
      }));
      updateStudents([...students, ...newStudents]);
      setBulkNames('');
      setBulkMode(false);
      const msg = skipped > 0
        ? `Added ${newStudents.length} students (${skipped} skipped duplicates)`
        : `Added ${newStudents.length} students`;
      setFeedback(msg);
      setTimeout(() => setFeedback(null), 5000);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .insert(newNames.map((name) => ({ class_id: classId, name })))
        .select();

      if (error) {
        console.error('Insert error:', error);
        setFeedback(`Error: ${error.message}`);
        setTimeout(() => setFeedback(null), 5000);
        return;
      }

      if (data && data.length > 0) {
        updateStudents([...students, ...data]);
        setBulkNames('');
        setBulkMode(false);

        const msg = skipped > 0
          ? `Added ${data.length} students (${skipped} skipped duplicates)`
          : `Added ${data.length} students`;
        setFeedback(msg);
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback('No students were added');
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Bulk add error:', err);
      setFeedback('Failed to add students');
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const removeStudent = async (id: string) => {
    if (isMockMode()) {
      updateStudents(students.filter((s) => s.id !== id));
      return;
    }
    await supabase.from('students').delete().eq('id', id);
    updateStudents(students.filter((s) => s.id !== id));
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Roster</h2>
        <Button variant="ghost" size="sm" onClick={() => setBulkMode(!bulkMode)}>
          {bulkMode ? 'Single add' : 'Bulk add'}
        </Button>
      </div>

      {/* Feedback message */}
      {feedback && (
        <div className="mb-4 px-3 py-2 bg-lc-success/10 border border-lc-success/25 text-lc-success text-sm rounded-lg">
          {feedback}
        </div>
      )}

      {bulkMode ? (
        <div className="space-y-2 mb-4">
          <textarea
            value={bulkNames}
            onChange={(e) => setBulkNames(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                addBulk();
              }
            }}
            placeholder="Alice&#10;Bob&#10;Charlie&#10;(or paste comma-separated: Alice, Bob, Charlie)"
            rows={5}
            className="w-full px-4 py-2 bg-lc-surface border border-lc-border rounded-xl text-lc-text text-sm font-mono focus:outline-none focus:ring-2 focus:ring-lc-blue-glow focus:border-lc-blue"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-lc-text3">
              One name per line (or comma-separated). Ctrl/Cmd+Enter to add.
            </span>
            <Button size="sm" onClick={addBulk} disabled={!bulkNames.trim()}>
              Add All
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addStudent()}
            placeholder="Student name"
            className="flex-1 px-4 py-2 bg-lc-surface border border-lc-border rounded-xl text-lc-text text-sm focus:outline-none focus:ring-2 focus:ring-lc-blue-glow focus:border-lc-blue"
          />
          <Button size="sm" onClick={addStudent} disabled={!newName.trim()}>
            Add
          </Button>
        </div>
      )}

      {students.length === 0 ? (
        <p className="text-sm text-lc-text3 text-center py-4">No students yet</p>
      ) : (
        <ul className="space-y-1">
          {students.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-lc-surface group">
              <span className="text-sm text-lc-text">{s.name}</span>
              <button
                onClick={() => removeStudent(s.id)}
                className="text-lc-danger/70 hover:text-lc-danger opacity-0 group-hover:opacity-100 transition-opacity text-sm"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
