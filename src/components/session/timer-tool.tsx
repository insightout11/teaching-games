'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const PRESETS = [
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
];

export function TimerContent() {
  const [totalSeconds, setTotalSeconds] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [customMin, setCustomMin] = useState('');
  const [customSec, setCustomSec] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown logic
  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setRunning(false);
            setFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, remaining]);

  // Auto-clear finished flash after 3s
  useEffect(() => {
    if (finished) {
      const t = setTimeout(() => setFinished(false), 3000);
      return () => clearTimeout(t);
    }
  }, [finished]);

  const handlePreset = useCallback((seconds: number) => {
    setTotalSeconds(seconds);
    setRemaining(seconds);
    setRunning(false);
    setFinished(false);
  }, []);

  const handleCustomSet = useCallback(() => {
    const m = parseInt(customMin) || 0;
    const s = parseInt(customSec) || 0;
    const total = m * 60 + s;
    if (total > 0) {
      setTotalSeconds(total);
      setRemaining(total);
      setRunning(false);
      setFinished(false);
    }
  }, [customMin, customSec]);

  const handleStart = () => {
    if (remaining <= 0) {
      setRemaining(totalSeconds);
    }
    setFinished(false);
    setRunning(true);
  };
  const handlePause = () => setRunning(false);
  const handleReset = () => {
    setRunning(false);
    setRemaining(totalSeconds);
    setFinished(false);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;

  return (
    <div className="p-4 space-y-4">
      {/* Countdown Display */}
      <div className="text-center">
        <div className={`text-5xl font-mono font-bold tracking-wider ${
          finished ? 'text-red-400 animate-pulse' : remaining <= 10 && remaining > 0 ? 'text-orange-400' : 'text-cyan-400'
        }`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              finished ? 'bg-red-400' : remaining <= 10 ? 'bg-orange-400' : 'bg-cyan-500'
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {finished && (
          <p className="text-red-400 text-sm font-semibold mt-2 animate-pulse">Time&apos;s Up!</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        {!running ? (
          <button
            onClick={handleStart}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-sm font-semibold hover:scale-105 active:scale-95 transition-all text-white"
          >
            {remaining < totalSeconds && remaining > 0 ? 'Resume' : 'Start'}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-sm font-semibold hover:scale-105 active:scale-95 transition-all text-white"
          >
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Presets */}
      <div>
        <p className="text-xs uppercase tracking-wider opacity-60 mb-2">Quick Set</p>
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.seconds}
              onClick={() => handlePreset(p.seconds)}
              className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                totalSeconds === p.seconds && !running
                  ? 'bg-cyan-500/30 text-cyan-300'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom time */}
      <div>
        <p className="text-xs uppercase tracking-wider opacity-60 mb-2">Custom</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="99"
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            placeholder="min"
            className="w-16 px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white text-center placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
          <span className="opacity-60">:</span>
          <input
            type="number"
            min="0"
            max="59"
            value={customSec}
            onChange={(e) => setCustomSec(e.target.value)}
            placeholder="sec"
            className="w-16 px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white text-center placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
          <button
            onClick={handleCustomSet}
            className="px-3 py-1.5 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-colors"
          >
            Set
          </button>
        </div>
      </div>
    </div>
  );
}
