'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { InputSpec } from '@/lib/input-spec';

interface DynamicInputProps {
  spec: InputSpec;
  onSubmit: (value: string) => Promise<void>;
  isSubmitting: boolean;
  submitStatus: 'idle' | 'success' | 'error' | 'rate_limited';
  waitSeconds: number;
}

export function DynamicInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds }: DynamicInputProps) {
  switch (spec.type) {
    case 'text':
      return <TextInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
    case 'textarea':
      return <TextareaInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
    case 'choice':
      return <ChoiceInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
    case 'binary':
      return <BinaryInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
    case 'multi-select':
      return <MultiSelectInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
    case 'sequence':
      return <SequenceInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
    case 'ranking':
      return <RankingInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
    default:
      return <TextInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
  }
}

// Common status display component
function SubmitStatus({ status, waitSeconds }: { status: 'idle' | 'success' | 'error' | 'rate_limited'; waitSeconds: number }) {
  if (status === 'idle') return null;
  return (
    <div className="text-sm mt-2">
      {status === 'success' && <span className="text-green-400">Submitted!</span>}
      {status === 'error' && <span className="text-red-400">Failed to submit</span>}
      {status === 'rate_limited' && <span className="text-yellow-400">Wait {waitSeconds}s...</span>}
    </div>
  );
}

// Single line text input
function TextInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds }: DynamicInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!value.trim() || isSubmitting) return;
    await onSubmit(value.trim());
    setValue('');
  }, [value, isSubmitting, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium">{spec.prompt}</p>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={spec.placeholder || 'Type your answer...'}
        maxLength={spec.maxLength || 200}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
      />
      <div className="flex items-center justify-between">
        <div>
          <SubmitStatus status={submitStatus} waitSeconds={waitSeconds} />
          <span className="text-gray-500 text-sm ml-2">{value.length}/{spec.maxLength || 200}</span>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!value.trim() || isSubmitting || submitStatus === 'rate_limited'}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

// Multi-line textarea input
function TextareaInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds }: DynamicInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!value.trim() || isSubmitting) return;
    await onSubmit(value.trim());
    setValue('');
  }, [value, isSubmitting, onSubmit]);

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium">{spec.prompt}</p>
      )}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={spec.placeholder || 'Type your answer...'}
        maxLength={spec.maxLength || 1000}
        rows={4}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
      />
      <div className="flex items-center justify-between">
        <div>
          <SubmitStatus status={submitStatus} waitSeconds={waitSeconds} />
          <span className="text-gray-500 text-sm ml-2">{value.length}/{spec.maxLength || 1000}</span>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!value.trim() || isSubmitting || submitStatus === 'rate_limited'}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

// Multiple choice (pick one)
function ChoiceInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds }: DynamicInputProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!selected || isSubmitting) return;
    await onSubmit(selected);
    setSelected(null);
  }, [selected, isSubmitting, onSubmit]);

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium">{spec.prompt}</p>
      )}
      <div className="space-y-2">
        {spec.options?.map((option, index) => (
          <button
            key={index}
            onClick={() => setSelected(option)}
            disabled={isSubmitting}
            className={`w-full p-4 rounded-xl text-left transition-all ${
              selected === option
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            } disabled:opacity-50`}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <SubmitStatus status={submitStatus} waitSeconds={waitSeconds} />
        <Button
          onClick={handleSubmit}
          disabled={!selected || isSubmitting || submitStatus === 'rate_limited'}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

// Binary choice (A or B)
function BinaryInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds }: DynamicInputProps) {
  const labels = spec.optionLabels || ['A', 'B'];
  const options = spec.options || labels;

  const handleChoice = useCallback(async (choice: string) => {
    if (isSubmitting) return;
    await onSubmit(choice);
  }, [isSubmitting, onSubmit]);

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium text-center">{spec.prompt}</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleChoice(option)}
            disabled={isSubmitting || submitStatus === 'rate_limited'}
            className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-500/50 transition-all text-white font-bold text-xl disabled:opacity-50"
          >
            <div className="text-3xl mb-2">{labels[index]}</div>
            <div className="text-sm opacity-80">{option}</div>
          </button>
        ))}
      </div>
      <SubmitStatus status={submitStatus} waitSeconds={waitSeconds} />
    </div>
  );
}

// Multi-select (pick N from list)
function MultiSelectInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds }: DynamicInputProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const selectCount = spec.selectCount || 4;

  const toggleOption = (option: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(option)) {
      newSelected.delete(option);
    } else if (newSelected.size < selectCount) {
      newSelected.add(option);
    }
    setSelected(newSelected);
  };

  const handleSubmit = useCallback(async () => {
    if (selected.size !== selectCount || isSubmitting) return;
    await onSubmit(JSON.stringify(Array.from(selected)));
    setSelected(new Set());
  }, [selected, selectCount, isSubmitting, onSubmit]);

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium">{spec.prompt}</p>
      )}
      <p className="text-sm text-gray-400">Select {selectCount} items ({selected.size}/{selectCount})</p>
      <div className="grid grid-cols-4 gap-2">
        {spec.options?.map((option, index) => (
          <button
            key={index}
            onClick={() => toggleOption(option)}
            disabled={isSubmitting}
            className={`p-3 rounded-xl text-sm transition-all ${
              selected.has(option)
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            } disabled:opacity-50`}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <SubmitStatus status={submitStatus} waitSeconds={waitSeconds} />
        <Button
          onClick={handleSubmit}
          disabled={selected.size !== selectCount || isSubmitting || submitStatus === 'rate_limited'}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

// Sequence input (tap to build ordered list)
function SequenceInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds }: DynamicInputProps) {
  const [sequence, setSequence] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<string[]>(spec.options || []);

  const addToSequence = (item: string) => {
    setSequence([...sequence, item]);
    setRemaining(remaining.filter(r => r !== item));
  };

  const removeFromSequence = (index: number) => {
    const item = sequence[index];
    setRemaining([...remaining, item]);
    setSequence(sequence.filter((_, i) => i !== index));
  };

  const handleSubmit = useCallback(async () => {
    if (remaining.length > 0 || isSubmitting) return;
    await onSubmit(JSON.stringify(sequence));
    setSequence([]);
    setRemaining(spec.options || []);
  }, [sequence, remaining.length, isSubmitting, onSubmit, spec.options]);

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium">{spec.prompt}</p>
      )}

      {/* Built sequence */}
      <div className="min-h-[60px] p-3 bg-white/5 rounded-xl border border-dashed border-white/20">
        {sequence.length === 0 ? (
          <p className="text-gray-500 text-sm">Tap words to build your sentence...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sequence.map((item, index) => (
              <button
                key={index}
                onClick={() => removeFromSequence(index)}
                className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Remaining words */}
      <div className="flex flex-wrap gap-2">
        {remaining.map((item, index) => (
          <button
            key={index}
            onClick={() => addToSequence(item)}
            disabled={isSubmitting}
            className="px-3 py-1.5 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <SubmitStatus status={submitStatus} waitSeconds={waitSeconds} />
        <Button
          onClick={handleSubmit}
          disabled={remaining.length > 0 || isSubmitting || submitStatus === 'rate_limited'}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

// Ranking input (drag to reorder)
function RankingInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds }: DynamicInputProps) {
  const [items, setItems] = useState<string[]>(spec.options || []);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);
    setItems(newItems);
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    await onSubmit(JSON.stringify(items));
    setItems(spec.options || []);
  }, [items, isSubmitting, onSubmit, spec.options]);

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium">{spec.prompt}</p>
      )}
      <p className="text-sm text-gray-400">Drag to reorder (1 = highest)</p>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item}
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggedIndex !== null && draggedIndex !== index) {
                moveItem(draggedIndex, index);
              }
              setDraggedIndex(null);
            }}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-move transition-all ${
              draggedIndex === index
                ? 'bg-cyan-500/30 border border-cyan-500'
                : 'bg-white/10 border border-transparent hover:bg-white/15'
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-full text-sm font-bold">
              {index + 1}
            </span>
            <span className="text-white">{item}</span>
            <div className="ml-auto flex gap-1">
              <button
                onClick={() => index > 0 && moveItem(index, index - 1)}
                disabled={index === 0}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => index < items.length - 1 && moveItem(index, index + 1)}
                disabled={index === items.length - 1}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <SubmitStatus status={submitStatus} waitSeconds={waitSeconds} />
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || submitStatus === 'rate_limited'}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}
