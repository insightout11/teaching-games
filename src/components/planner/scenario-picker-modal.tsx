'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import type { FlightPlanPreset } from '@/lib/flight-plan-presets';

interface ScenarioPickerModalProps {
  preset: FlightPlanPreset;
  onConfirm: (scenario: string) => void;
  onCancel: () => void;
}

export function ScenarioPickerModal({ preset, onConfirm, onCancel }: ScenarioPickerModalProps) {
  const [input, setInput] = useState('');
  const scenarios = preset.scenarios!;

  const isCustom = input.trim() !== '' && !scenarios.options.includes(input);

  const handleChipClick = (option: string) => {
    setInput(input === option ? '' : option);
  };

  const handleCustomInput = (value: string) => {
    setInput(value);
  };

  return (
    <Modal open title={preset.name} onClose={onCancel}>
      <p className="text-sm text-lc-text2 -mt-2 mb-5">{preset.description}</p>

      <p className="text-sm font-medium text-lc-text2 mb-2">{scenarios.label}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {scenarios.options.map((option) => (
          <button
            key={option}
            onClick={() => handleChipClick(option)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
              input === option
                ? 'bg-lc-blue/15 text-lc-blue border-lc-blue/40'
                : 'bg-lc-surface border-lc-border text-lc-text2 hover:border-lc-blue/30 hover:text-lc-text'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-lc-border" />
        <span className="text-xs text-lc-text3">or</span>
        <div className="flex-1 h-px bg-lc-border" />
      </div>

      <p className="text-sm font-medium text-lc-text2 mb-2">Use your own topic</p>
      <input
        type="text"
        value={isCustom ? input : ''}
        onChange={(e) => handleCustomInput(e.target.value)}
        onFocus={() => { if (!isCustom) setInput(''); }}
        placeholder={scenarios.placeholder}
        className="w-full px-4 py-3 bg-lc-surface border border-lc-border rounded-xl text-lc-text focus:ring-2 focus:ring-lc-blue-glow focus:border-lc-blue mb-5"
      />

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-lc-border text-lc-text2 hover:text-lc-text hover:border-lc-blue/30 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(input.trim())}
          disabled={!input.trim()}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-lc-blue text-white hover:bg-lc-blue-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Start Lesson
        </button>
      </div>
    </Modal>
  );
}
