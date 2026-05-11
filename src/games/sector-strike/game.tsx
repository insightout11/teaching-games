'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutGrid, Check, X as XIcon, Clock, Trophy } from 'lucide-react';
import type { GameProps, GameRemoteVote } from '../types';
import { getEffectiveTopic } from '@/stores/session-store';
import type { Student } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Team = 'x' | 'o';
type BonusType = 'double-down' | 'steal' | 'free-square' | 'bomb';
type QType = 'speaking' | 'written';
type Phase =
  | 'idle'
  | 'picking'
  | 'loading'
  | 'answering'
  | 'applying'
  | 'bonus-pick'
  | 'won'
  | 'timeout';

interface Cell {
  index: number;
  team: Team | null;
  bonus: BonusType | null;
  bonusRevealed: boolean;
  qType: QType;
  question: string | null;
}

const GAME_DURATION = 20 * 60;
const CLAIM_POINTS = 10;
const FREE_SQUARE_POINTS = 5;

const BONUS_LABELS: Record<BonusType, string> = {
  'double-down': '★',
  'steal': '↺',
  'free-square': '⚡',
  'bomb': '✦',
};

const BONUS_NAMES: Record<BonusType, string> = {
  'double-down': 'Double Down',
  'steal': 'Steal',
  'free-square': 'Free Sector',
  'bomb': 'Bomb',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getAdjacent(index: number): number[] {
  const row = Math.floor(index / 8);
  const col = index % 8;
  const adj: number[] = [];
  if (row > 0) adj.push((row - 1) * 8 + col);
  if (row < 7) adj.push((row + 1) * 8 + col);
  if (col > 0) adj.push(row * 8 + (col - 1));
  if (col < 7) adj.push(row * 8 + (col + 1));
  return adj;
}

function checkWin(cells: Cell[], team: Team): boolean {
  const owns = (i: number) => cells[i]?.team === team;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c <= 4; c++)
      if ([0, 1, 2, 3].every((d) => owns(r * 8 + c + d))) return true;
  for (let c = 0; c < 8; c++)
    for (let r = 0; r <= 4; r++)
      if ([0, 1, 2, 3].every((d) => owns((r + d) * 8 + c))) return true;
  for (let r = 0; r <= 4; r++)
    for (let c = 0; c <= 4; c++)
      if ([0, 1, 2, 3].every((d) => owns((r + d) * 8 + c + d))) return true;
  for (let r = 3; r < 8; r++)
    for (let c = 0; c <= 4; c++)
      if ([0, 1, 2, 3].every((d) => owns((r - d) * 8 + c + d))) return true;
  return false;
}

function buildCells(questionMode: string): Cell[] {
  const positions = shuffle(Array.from({ length: 64 }, (_, i) => i));
  const bonusMap: Record<number, BonusType> = {};
  const bonusTypes: BonusType[] = [
    'double-down', 'double-down',
    'steal', 'steal',
    'free-square', 'free-square',
    'bomb', 'bomb',
  ];
  bonusTypes.forEach((b, i) => { bonusMap[positions[i]] = b; });

  return Array.from({ length: 64 }, (_, i) => ({
    index: i,
    team: null,
    bonus: bonusMap[i] ?? null,
    bonusRevealed: false,
    qType:
      questionMode === 'speaking' ? 'speaking' :
      questionMode === 'written' ? 'written' :
      Math.random() < 0.5 ? 'speaking' : 'written',
    question: null,
  }));
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function opposite(team: Team): Team {
  return team === 'x' ? 'o' : 'x';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SectorStrikeGame({
  students,
  onScore,
  sessionSettings,
  config,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
}: GameProps) {
  const topic = getEffectiveTopic(sessionSettings);
  const { difficulty } = sessionSettings;
  const questionMode = (config.questionMode as string) ?? 'both';

  // ── State ─────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('idle');
  const [cells, setCells] = useState<Cell[]>([]);
  const [xTeam, setXTeam] = useState<Student[]>([]);
  const [oTeam, setOTeam] = useState<Student[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team>('x');
  const [currentPicker, setCurrentPicker] = useState<Student | null>(null);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [winner, setWinner] = useState<Team | null>(null);
  const [bonusPickTargets, setBonusPickTargets] = useState<number[]>([]);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);

  // ── Refs (avoids stale closures in callbacks) ─────────────────────────────
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;
  const cellsRef = useRef<Cell[]>([]);
  cellsRef.current = cells;
  const currentTeamRef = useRef<Team>('x');
  currentTeamRef.current = currentTeam;
  const currentPickerRef = useRef<Student | null>(null);
  currentPickerRef.current = currentPicker;
  const selectedCellRef = useRef<number | null>(null);
  selectedCellRef.current = selectedCell;
  const xTeamRef = useRef<Student[]>([]);
  xTeamRef.current = xTeam;
  const oTeamRef = useRef<Student[]>([]);
  oTeamRef.current = oTeam;
  const gameStartTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const applyingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const xCount = cells.filter((c) => c.team === 'x').length;
  const oCount = cells.filter((c) => c.team === 'o').length;
  const currentCell = selectedCell !== null ? cells[selectedCell] : null;

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (applyingTimerRef.current) clearTimeout(applyingTimerRef.current);
      fetchControllerRef.current?.abort();
    };
  }, []);

  // ── Timer: starts on game start, stops on win/timeout ────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    gameStartTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - gameStartTimeRef.current!) / 1000);
      const remaining = Math.max(0, GAME_DURATION - elapsed);
      setTimeLeft(remaining);
    }, 500);
  }, [stopTimer]);

  // Handle timeout when timeLeft hits 0
  useEffect(() => {
    if (
      timeLeft === 0 &&
      phase !== 'idle' &&
      phase !== 'won' &&
      phase !== 'timeout'
    ) {
      stopTimer();
      const x = cellsRef.current.filter((c) => c.team === 'x').length;
      const o = cellsRef.current.filter((c) => c.team === 'o').length;
      setWinner(x >= o ? 'x' : 'o');
      setPhase('timeout');
      onSetInputSpec?.(null);
    }
  }, [timeLeft, phase, stopTimer, onSetInputSpec]);

  // ── Advance to next turn ──────────────────────────────────────────────────
  const advanceTurn = useCallback((updatedCells: Cell[], scoringTeam: Team, checkForWin = true) => {
    if (checkForWin && checkWin(updatedCells, scoringTeam)) {
      stopTimer();
      setWinner(scoringTeam);
      setPhase('won');
      onSetInputSpec?.(null);
      return;
    }
    const nextTeam = opposite(scoringTeam);
    const nextTeamStudents = nextTeam === 'x' ? xTeamRef.current : oTeamRef.current;
    if (nextTeamStudents.length === 0) return;
    setCurrentTeam(nextTeam);
    setCurrentPicker(pickRandom(nextTeamStudents));
    setSelectedCell(null);
    setSubmittedAnswer(null);
    setLastResult(null);
    onSetInputSpec?.(null);
    setPhase('picking');
  }, [stopTimer, onSetInputSpec]);

  // ── Handle ✓ correct answer ───────────────────────────────────────────────
  const handleCorrect = useCallback(() => {
    if (phaseRef.current !== 'answering') return;
    const cellIdx = selectedCellRef.current;
    const team = currentTeamRef.current;
    const picker = currentPickerRef.current;
    if (cellIdx === null) return;

    onScore(picker?.id ?? '', {
      isCorrect: true,
      points: CLAIM_POINTS,
      responseData: { cell: cellIdx, team, bonus: cellsRef.current[cellIdx]?.bonus },
    });

    const updated = cellsRef.current.map((c) =>
      c.index === cellIdx ? { ...c, team, bonusRevealed: true } : c
    );
    setCells(updated);
    setLastResult('correct');
    setPhase('applying');

    const bonus = cellsRef.current[cellIdx]?.bonus ?? null;

    applyingTimerRef.current = setTimeout(() => {
      if (bonus === 'double-down') {
        const adj = getAdjacent(cellIdx).filter((i) => updated[i]?.team === null);
        if (adj.length > 0) { setBonusPickTargets(adj); setPhase('bonus-pick'); return; }
      }
      if (bonus === 'steal') {
        const targets = updated.filter((c) => c.team === opposite(team)).map((c) => c.index);
        if (targets.length > 0) { setBonusPickTargets(targets); setPhase('bonus-pick'); return; }
      }
      advanceTurn(updated, team);
    }, 1400);
  }, [onScore, advanceTurn]);

  // ── Handle ✗ wrong answer ─────────────────────────────────────────────────
  const handleWrong = useCallback(() => {
    if (phaseRef.current !== 'answering') return;
    const team = currentTeamRef.current;
    const picker = currentPickerRef.current;

    onScore(picker?.id ?? '', {
      isCorrect: false,
      points: 0,
      responseData: { cell: selectedCellRef.current, team },
    });
    setLastResult('wrong');
    setPhase('applying');

    applyingTimerRef.current = setTimeout(() => {
      advanceTurn(cellsRef.current, team, false);
    }, 1400);
  }, [onScore, advanceTurn]);

  // ── Handle bonus-pick tap ─────────────────────────────────────────────────
  const handleBonusPick = useCallback((targetIdx: number) => {
    if (phaseRef.current !== 'bonus-pick') return;
    const team = currentTeamRef.current;
    const cellIdx = selectedCellRef.current!;
    const bonus = cellsRef.current[cellIdx]?.bonus;

    const updated = cellsRef.current.map((c) => {
      if (c.index !== targetIdx) return c;
      if (bonus === 'double-down' || bonus === 'steal') return { ...c, team };
      if (bonus === 'bomb') return { ...c, team: null };
      return c;
    });

    setCells(updated);
    setBonusPickTargets([]);
    advanceTurn(updated, team);
  }, [advanceTurn]);

  // ── Handle auto-bonus cells (free-square / bomb) ──────────────────────────
  const applyAutoBonus = useCallback((cellIdx: number, snapshotCells: Cell[], team: Team) => {
    const picker = currentPickerRef.current;
    const cell = snapshotCells[cellIdx];

    if (cell?.bonus === 'free-square') {
      const updated = snapshotCells.map((c) =>
        c.index === cellIdx ? { ...c, team } : c
      );
      setCells(updated);
      setLastResult('correct');
      setPhase('applying');
      onScore(picker?.id ?? '', {
        isCorrect: true,
        points: FREE_SQUARE_POINTS,
        responseData: { cell: cellIdx, team, bonus: 'free-square' },
      });
      applyingTimerRef.current = setTimeout(() => advanceTurn(updated, team), 1400);
      return;
    }

    if (cell?.bonus === 'bomb') {
      const adjOpponent = getAdjacent(cellIdx).filter(
        (i) => snapshotCells[i]?.team === opposite(team)
      );
      if (adjOpponent.length > 0) {
        setCells(snapshotCells);
        setBonusPickTargets(adjOpponent);
        setPhase('bonus-pick');
      } else {
        advanceTurn(snapshotCells, team, false);
      }
    }
  }, [onScore, advanceTurn]);

  // ── Handle cell tap (picking phase) ──────────────────────────────────────
  const handleCellClick = useCallback(async (cellIdx: number) => {
    // Use a function to read phase — prevents TypeScript from narrowing across awaits
    const livePhase = (): Phase => phaseRef.current;
    if (livePhase() !== 'picking') return;
    const cell = cellsRef.current[cellIdx];
    if (!cell || cell.team !== null) return;

    setSelectedCell(cellIdx);

    const revealedCells = cellsRef.current.map((c) =>
      c.index === cellIdx ? { ...c, bonusRevealed: true } : c
    );
    setCells(revealedCells);

    if (cell.bonus === 'free-square' || cell.bonus === 'bomb') {
      applyAutoBonus(cellIdx, revealedCells, currentTeamRef.current);
      return;
    }

    setPhase('loading');
    fetchControllerRef.current?.abort();
    fetchControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/sector-strike/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty, qType: cell.qType }),
        signal: fetchControllerRef.current.signal,
      });
      if (livePhase() !== 'loading') return;

      const data = await res.json() as { question: string };
      const question = data.question;

      setCells((prev) =>
        prev.map((c) => c.index === cellIdx ? { ...c, question } : c)
      );

      if (cell.qType === 'written') {
        onSetInputSpec?.({
          type: 'text',
          gameKey: 'sector-strike',
          prompt: question,
          placeholder: 'Type your answer…',
          maxLength: 200,
        });
      }
      setPhase('answering');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      if (livePhase() !== 'loading') return;
      const fallback =
        cell.qType === 'speaking'
          ? `What do you know about ${topic}? Share at least two ideas.`
          : `Write one sentence that describes something important about ${topic}.`;
      setCells((prev) =>
        prev.map((c) => c.index === cellIdx ? { ...c, question: fallback } : c)
      );
      if (cell.qType === 'written') {
        onSetInputSpec?.({
          type: 'text',
          gameKey: 'sector-strike',
          prompt: fallback,
          placeholder: 'Type your answer…',
        });
      }
      setPhase('answering');
    }
  }, [topic, difficulty, applyAutoBonus, onSetInputSpec]);

  // ── Written answer vote handler ───────────────────────────────────────────
  const handleVote = useCallback((vote: GameRemoteVote) => {
    if (phaseRef.current !== 'answering') return;
    const pickerId = currentPickerRef.current?.id;
    if (!pickerId || vote.studentId !== pickerId) return;
    setSubmittedAnswer(vote.choice);
  }, []);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.(handleVote);
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, handleVote]);

  // ── Start game ────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    if (students.length < 2) return;
    if (applyingTimerRef.current) clearTimeout(applyingTimerRef.current);

    const shuffled = shuffle(students);
    const mid = Math.ceil(shuffled.length / 2);
    const x = shuffled.slice(0, mid);
    const o = shuffled.slice(mid);
    setXTeam(x);
    setOTeam(o);
    setCells(buildCells(questionMode));
    setCurrentTeam('x');
    setCurrentPicker(pickRandom(x));
    setSelectedCell(null);
    setSubmittedAnswer(null);
    setLastResult(null);
    setBonusPickTargets([]);
    setWinner(null);
    setTimeLeft(GAME_DURATION);
    startTimer();
    setPhase('picking');
  }, [students, questionMode, startTimer]);

  // ── Render: IDLE ──────────────────────────────────────────────────────────
  if (phase === 'idle') {
    if (students.length < 2) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <LayoutGrid className="w-10 h-10 text-lc-text3" />
          <p className="text-lc-text2 text-sm">At least 2 students must be connected to play Sector Strike.</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
          <LayoutGrid className="w-10 h-10 text-blue-400" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-game text-lc-text">Sector Strike</h2>
          <p className="text-lc-text2 text-sm max-w-xs">
            Two teams battle for control of the grid. Get 4 sectors in a row to win.
          </p>
          <p className="text-xs text-lc-text3">
            {students.length} students · {
              questionMode === 'both' ? 'Speaking & Written' :
              questionMode === 'speaking' ? 'Speaking' : 'Written'
            } · 20 minutes
          </p>
        </div>
        <button
          onClick={startGame}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          Start Game
        </button>
      </div>
    );
  }

  // ── Render: WON / TIMEOUT ─────────────────────────────────────────────────
  if (phase === 'won' || phase === 'timeout') {
    const xFinal = cells.filter((c) => c.team === 'x').length;
    const oFinal = cells.filter((c) => c.team === 'o').length;
    const tied = xFinal === oFinal;
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2 py-3">
          <div className="text-4xl">{tied ? '🤝' : winner === 'x' ? '🔵' : '🟠'}</div>
          <h2 className="text-2xl font-game text-lc-text">
            {phase === 'won'
              ? `Team ${winner === 'x' ? 'X' : 'O'} wins!`
              : tied ? "It's a tie!" : `Team ${winner === 'x' ? 'X' : 'O'} wins!`}
          </h2>
          <p className="text-lc-text2 text-sm">
            {phase === 'timeout' ? "Time's up — most sectors wins" : '4 in a row!'}
          </p>
          <div className="flex items-center justify-center gap-8 text-sm font-bold mt-1">
            <span className="text-blue-400">X: {xFinal}</span>
            <span className="text-lc-text3">sectors</span>
            <span className="text-orange-400">O: {oFinal}</span>
          </div>
        </div>

        <div className="grid grid-cols-8 gap-0.5">
          {cells.map((cell) => (
            <div
              key={cell.index}
              className={`aspect-square rounded flex items-center justify-center text-xs font-black ${
                cell.team === 'x' ? 'bg-blue-500 text-white' :
                cell.team === 'o' ? 'bg-orange-500 text-white' :
                'bg-lc-surface'
              }`}
            >
              {cell.team === 'x' ? 'X' : cell.team === 'o' ? 'O' : ''}
            </div>
          ))}
        </div>

        <button
          onClick={() => { stopTimer(); setPhase('idle'); onSetInputSpec?.(null); }}
          className="w-full py-3 bg-lc-surface border border-lc-border text-lc-text rounded-xl font-bold hover:bg-lc-card transition-all"
        >
          Play Again
        </button>
      </div>
    );
  }

  // ── Render: Playing phases ────────────────────────────────────────────────
  const teamBannerColor = currentTeam === 'x'
    ? 'bg-blue-500/15 text-blue-300 border-blue-500/25'
    : 'bg-orange-500/15 text-orange-300 border-orange-500/25';

  return (
    <div className="space-y-3">
      {/* Score bar */}
      <div className="flex items-center justify-between text-sm font-bold">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-black">X</span>
          <span className="text-blue-400">{xCount}</span>
        </div>
        <div className={`flex items-center gap-1 font-mono text-xs ${timeLeft <= 60 ? 'text-red-400 font-bold' : 'text-lc-text2'}`}>
          <Clock className="w-3 h-3" />
          {formatTime(timeLeft)}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-orange-400">{oCount}</span>
          <span className="w-5 h-5 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-black">O</span>
        </div>
      </div>

      {/* Team / picker banner */}
      {phase !== 'bonus-pick' && (
        <div className={`rounded-xl px-3 py-2 text-xs font-semibold flex items-center justify-between border ${teamBannerColor}`}>
          <span>Team {currentTeam === 'x' ? 'X' : 'O'}</span>
          {currentPicker && (
            <span className="text-white/80 font-normal">
              {currentPicker.name}
              {phase === 'picking' ? ' — choose a sector' : ' — answering'}
            </span>
          )}
          {currentCell?.qType && (phase === 'answering' || phase === 'loading' || phase === 'applying') && (
            <span className="text-white/50 text-xs">
              {currentCell.qType === 'speaking' ? '🎙' : '✍'}
            </span>
          )}
        </div>
      )}

      {phase === 'bonus-pick' && currentCell?.bonus && (
        <div className="rounded-xl px-3 py-2 text-xs font-semibold text-center bg-yellow-500/15 text-yellow-300 border border-yellow-500/25">
          {BONUS_LABELS[currentCell.bonus]} {BONUS_NAMES[currentCell.bonus]} — tap a highlighted sector
        </div>
      )}

      {/* 8×8 Grid */}
      <div className="grid grid-cols-8 gap-0.5">
        {cells.map((cell) => {
          const isSelected = cell.index === selectedCell;
          const isTarget = bonusPickTargets.includes(cell.index);
          const canPick = phase === 'picking' && cell.team === null;
          const canBonus = phase === 'bonus-pick' && isTarget;
          const showResult = phase === 'applying' && isSelected;

          return (
            <button
              key={cell.index}
              onClick={() => {
                if (canBonus) handleBonusPick(cell.index);
                else if (canPick) handleCellClick(cell.index);
              }}
              disabled={!canPick && !canBonus}
              className={[
                'aspect-square rounded flex items-center justify-center text-xs font-black transition-all select-none',
                cell.team === 'x' ? 'bg-blue-500 text-white' :
                cell.team === 'o' ? 'bg-orange-500 text-white' :
                'bg-lc-surface text-lc-text3',
                isSelected && !showResult ? 'ring-2 ring-white/60 scale-105' : '',
                showResult && lastResult === 'correct' ? 'ring-2 ring-green-400 scale-105' : '',
                showResult && lastResult === 'wrong' ? 'ring-2 ring-red-400' : '',
                isTarget ? 'ring-2 ring-yellow-400 animate-pulse cursor-pointer' : '',
                canPick ? 'hover:bg-lc-card hover:scale-105 cursor-pointer' : 'cursor-default',
              ].filter(Boolean).join(' ')}
            >
              {cell.team === 'x' && 'X'}
              {cell.team === 'o' && 'O'}
              {!cell.team && cell.bonusRevealed && cell.bonus && (
                <span className="text-yellow-400">{BONUS_LABELS[cell.bonus]}</span>
              )}
              {!cell.team && !cell.bonusRevealed && phase === 'picking' && (
                <span className="opacity-15 text-[9px]">{cell.index + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Question / answer panel */}
      {(phase === 'loading' || phase === 'answering' || phase === 'applying') && (
        <div className="rounded-xl border border-lc-border bg-lc-surface p-3 space-y-3">
          {phase === 'loading' && (
            <div className="flex items-center gap-2 text-lc-text2 py-1">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="text-sm">Loading question…</span>
            </div>
          )}

          {(phase === 'answering' || phase === 'applying') && currentCell?.question && (
            <>
              {/* Bonus badge */}
              {currentCell.bonus && currentCell.bonusRevealed && (
                <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-semibold">
                  <span>{BONUS_LABELS[currentCell.bonus]}</span>
                  <span>{BONUS_NAMES[currentCell.bonus]} bonus active!</span>
                </div>
              )}

              <p className="text-sm font-semibold text-lc-text leading-snug">
                {currentCell.question}
              </p>

              {/* Written: waiting or showing answer */}
              {currentCell.qType === 'written' && phase === 'answering' && !submittedAnswer && (
                <p className="text-xs text-lc-text3 italic">
                  Waiting for {currentPicker?.name} to submit…
                </p>
              )}
              {currentCell.qType === 'written' && submittedAnswer && (
                <div className="rounded-lg bg-lc-card border border-lc-border px-3 py-2">
                  <p className="text-xs text-lc-text3 mb-0.5">{currentPicker?.name}:</p>
                  <p className="text-sm text-lc-text">{submittedAnswer}</p>
                </div>
              )}

              {/* Approve/reject buttons */}
              {phase === 'answering' && (currentCell.qType === 'speaking' || submittedAnswer) && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCorrect}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30 rounded-xl text-sm font-bold transition-all active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    Correct
                  </button>
                  <button
                    onClick={handleWrong}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl text-sm font-bold transition-all active:scale-95"
                  >
                    <XIcon className="w-4 h-4" />
                    Wrong
                  </button>
                </div>
              )}

              {/* Applying result */}
              {phase === 'applying' && (
                <div className={`text-center font-bold text-sm py-1.5 rounded-lg ${
                  lastResult === 'correct'
                    ? 'text-green-400 bg-green-500/10'
                    : 'text-red-400 bg-red-500/10'
                }`}>
                  {lastResult === 'correct' ? '✓ Sector claimed!' : '✗ Missed — next team'}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Bonus-pick instruction */}
      {phase === 'bonus-pick' && currentCell?.bonus === 'double-down' && (
        <p className="text-xs text-lc-text3 text-center">
          Tap an adjacent free sector to claim it as a bonus
        </p>
      )}
      {phase === 'bonus-pick' && currentCell?.bonus === 'steal' && (
        <p className="text-xs text-lc-text3 text-center">
          Tap any opponent sector to take it
        </p>
      )}
      {phase === 'bonus-pick' && currentCell?.bonus === 'bomb' && (
        <p className="text-xs text-lc-text3 text-center">
          Tap an adjacent opponent sector to destroy it
        </p>
      )}

      {/* Legend (only during picking, compact) */}
      {phase === 'picking' && (
        <div className="flex items-center justify-center gap-4 text-[10px] text-lc-text3 pt-1">
          <span className="flex items-center gap-1"><span className="text-yellow-400">★</span> Double Down</span>
          <span className="flex items-center gap-1"><span className="text-yellow-400">↺</span> Steal</span>
          <span className="flex items-center gap-1"><span className="text-yellow-400">⚡</span> Free</span>
          <span className="flex items-center gap-1"><span className="text-yellow-400">✦</span> Bomb</span>
        </div>
      )}

      {/* Win notice during applying (if about to win) */}
      {phase === 'applying' && lastResult === 'correct' && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-lc-text3">
          <Trophy className="w-3 h-3" />
          <span>4 in a row wins the game</span>
        </div>
      )}
    </div>
  );
}
