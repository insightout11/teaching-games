'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePollVotes } from '@/hooks/use-poll-votes';
import { Button } from '@/components/ui/button';
import type { Poll } from '@/lib/supabase/types';

interface PollContentProps {
  sessionId: string;
}

const QUICK_PRESETS = [
  { label: 'A/B/C/D', options: ['A', 'B', 'C', 'D'] },
  { label: 'Yes/No', options: ['Yes', 'No'] },
  { label: '1-5 Scale', options: ['1', '2', '3', '4', '5'] },
  { label: 'Agree/Disagree', options: ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'] },
];

export function PollContent({ sessionId }: PollContentProps) {
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const { tallies, votes } = usePollVotes(activePoll?.id || null);

  // Load active poll on mount
  useEffect(() => {
    async function loadActivePoll() {
      const { data } = await supabase
        .from('polls')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setActivePoll(data as Poll);
      }
    }

    loadActivePoll();
  }, [sessionId, supabase]);

  const handleCreatePoll = async () => {
    const trimmedQuestion = question.trim();
    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);

    if (!trimmedQuestion || validOptions.length < 2) return;

    setIsSubmitting(true);

    // Close any existing active poll
    if (activePoll) {
      await supabase
        .from('polls')
        .update({ is_active: false })
        .eq('id', activePoll.id);
    }

    // Create new poll
    const { data, error } = await supabase
      .from('polls')
      .insert({
        session_id: sessionId,
        question: trimmedQuestion,
        options: validOptions,
        is_active: true,
      })
      .select()
      .single();

    if (!error && data) {
      setActivePoll(data as Poll);
      setIsCreating(false);
      setQuestion('');
      setOptions(['', '']);
    }

    setIsSubmitting(false);
  };

  const handleClosePoll = async () => {
    if (!activePoll) return;

    await supabase
      .from('polls')
      .update({ is_active: false })
      .eq('id', activePoll.id);

    setActivePoll(null);
  };

  const handlePreset = (preset: typeof QUICK_PRESETS[0]) => {
    setOptions(preset.options);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const totalVotes = votes.length;

  return (
    <div className="p-4 overflow-x-hidden">
      {/* Active poll status badge */}
      {activePoll && (
        <div className="mb-3 flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">Active</span>
        </div>
      )}

      {/* Active Poll Display */}
      {activePoll && !isCreating && (
        <div className="space-y-4">
          <div>
            <p className="font-medium text-cyan-400 mb-2">{activePoll.question}</p>
            <p className="text-xs text-gray-500 mb-3">{totalVotes} votes</p>

            <div className="space-y-2">
              {(activePoll.options as string[]).map((option) => {
                const count = tallies[option] || 0;
                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

                return (
                  <div key={option} className="relative">
                    <div
                      className="absolute inset-0 bg-cyan-500/20 rounded"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="relative flex items-center justify-between p-2 text-sm">
                      <span>{option}</span>
                      <span className="text-cyan-400">{count} ({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsCreating(true)}
              className="flex-1 text-xs"
            >
              New Poll
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleClosePoll}
              className="flex-1 text-xs"
            >
              Close Poll
            </Button>
          </div>
        </div>
      )}

      {/* Create Poll Form */}
      {(isCreating || !activePoll) && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question..."
              className="w-full px-3 py-2 bg-lc-surface border border-lc-border rounded-lg text-sm text-lc-text placeholder:text-lc-text3 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-400">Options</label>
              <select
                defaultValue=""
                onChange={(e) => {
                  const preset = QUICK_PRESETS.find((p) => p.label === e.target.value);
                  if (preset) handlePreset(preset);
                  e.currentTarget.value = '';
                }}
                className="text-xs bg-lc-surface border border-lc-border rounded px-1.5 py-0.5 text-lc-text focus:outline-none cursor-pointer"
              >
                <option value="" disabled>Preset…</option>
                {QUICK_PRESETS.map((p) => (
                  <option key={p.label} value={p.label}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[index] = e.target.value;
                      setOptions(newOptions);
                    }}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-3 py-2 bg-lc-surface border border-lc-border rounded-lg text-sm text-lc-text placeholder:text-lc-text3 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="px-2 text-gray-400 hover:text-red-400"
                    >
                      x
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 6 && (
              <button
                onClick={addOption}
                className="mt-2 text-xs text-cyan-400 hover:text-cyan-300"
              >
                + Add option
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {activePoll && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsCreating(false)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              variant="primary"
              onClick={handleCreatePoll}
              disabled={!question.trim() || options.filter((o) => o.trim()).length < 2 || isSubmitting}
              className="flex-1 text-xs"
            >
              {isSubmitting ? 'Creating...' : 'Create Poll'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
