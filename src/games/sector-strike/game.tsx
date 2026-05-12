'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { LayoutGrid, Check, X as XIcon, Clock, Trophy, Star, Repeat, Zap, Bomb } from 'lucide-react';
import type { GameProps, GameRemoteVote } from '../types';
import { getEffectiveTopic } from '@/stores/session-store';
import type { Student } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Team = 'x' | 'o';
type BonusType = 'double-down' | 'steal' | 'free-square' | 'bomb';
type QType = 'speaking' | 'written';
type Phase =
  | 'idle'
  | 'preparing'
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
  options: string[] | null;
  correctIndex: number | null;
}

const GAME_DURATION = 20 * 60;
const CLAIM_POINTS = 10;
const FREE_SQUARE_POINTS = 5;

const BONUS_NAMES: Record<BonusType, string> = {
  'double-down': 'Double Down',
  'steal': 'Steal',
  'free-square': 'Free Sector',
  'bomb': 'Bomb',
};

function BonusIcon({ bonus, className }: { bonus: BonusType; className?: string }) {
  if (bonus === 'double-down') return <Star className={className} />;
  if (bonus === 'steal')       return <Repeat className={className} />;
  if (bonus === 'free-square') return <Zap className={className} />;
  if (bonus === 'bomb')        return <Bomb className={className} />;
  return null;
}

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

function checkWin(cells: Cell[], team: Team): number[] | null {
  const owns = (i: number) => cells[i]?.team === team;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c <= 4; c++) {
      const idx = [0,1,2,3].map(d => r*8+c+d);
      if (idx.every(owns)) return idx;
    }
  for (let c = 0; c < 8; c++)
    for (let r = 0; r <= 4; r++) {
      const idx = [0,1,2,3].map(d => (r+d)*8+c);
      if (idx.every(owns)) return idx;
    }
  for (let r = 0; r <= 4; r++)
    for (let c = 0; c <= 4; c++) {
      const idx = [0,1,2,3].map(d => (r+d)*8+c+d);
      if (idx.every(owns)) return idx;
    }
  for (let r = 3; r < 8; r++)
    for (let c = 0; c <= 4; c++) {
      const idx = [0,1,2,3].map(d => (r-d)*8+c+d);
      if (idx.every(owns)) return idx;
    }
  return null;
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
    options: null,
    correctIndex: null,
  } as Cell));
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
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [winner, setWinner] = useState<Team | null>(null);
  const [bonusPickTargets, setBonusPickTargets] = useState<number[]>([]);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);
  const [lastBombedCell, setLastBombedCell] = useState<number | null>(null);
  const [animatingCells, setAnimatingCells] = useState<number[]>([]);
  const [winningCells,   setWinningCells]   = useState<number[]>([]);

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
  const selectedOptionIndexRef = useRef<number | null>(null);

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

  // ── Fetch one question (used during pre-generation) ──────────────────────
  const fetchOneQuestion = useCallback(async (qType: QType): Promise<{ question: string; options?: string[]; correctIndex?: number } | null> => {
    try {
      const res = await fetch('/api/sector-strike/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty, qType }),
      });
      if (!res.ok) return null;
      return await res.json() as { question: string; options?: string[]; correctIndex?: number };
    } catch {
      return null;
    }
  }, [topic, difficulty]);

  // Handle timeout when timeLeft hits 0
  useEffect(() => {
    if (
      timeLeft === 0 &&
      phase !== 'idle' &&
      phase !== 'preparing' &&
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

  // ── Claim animation helper ────────────────────────────────────────────────
  const animateClaim = useCallback((indices: number[]) => {
    setAnimatingCells(indices);
    setTimeout(() => setAnimatingCells([]), 550);
  }, []);

  // ── Advance to next turn ──────────────────────────────────────────────────
  const advanceTurn = useCallback((updatedCells: Cell[], scoringTeam: Team, checkForWin = true) => {
    const win = checkForWin ? checkWin(updatedCells, scoringTeam) : null;
    if (win) {
      stopTimer();
      setWinner(scoringTeam);
      setWinningCells(win);
      setPhase('won');
      onSetInputSpec?.(null);
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.55 },
        colors: scoringTeam === 'x'
          ? ['#3b82f6', '#93c5fd', '#ffffff']
          : ['#f97316', '#fdba74', '#ffffff'],
      });
      return;
    }
    const nextTeam = opposite(scoringTeam);
    const nextTeamStudents = nextTeam === 'x' ? xTeamRef.current : oTeamRef.current;
    if (nextTeamStudents.length === 0) return;
    setCurrentTeam(nextTeam);
    setCurrentPicker(pickRandom(nextTeamStudents));
    setSelectedCell(null);
    setSelectedOptionIndex(null);
    selectedOptionIndexRef.current = null;
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
    animateClaim([cellIdx]);
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
  }, [onScore, advanceTurn, animateClaim]);

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

    if (bonus === 'bomb') {
      setLastBombedCell(targetIdx);
      setPhase('applying');
      applyingTimerRef.current = setTimeout(() => {
        setLastBombedCell(null);
        advanceTurn(updated, team, false);
      }, 1600);
    } else {
      animateClaim([targetIdx]);
      advanceTurn(updated, team);
    }
  }, [advanceTurn, animateClaim]);

  // ── Handle auto-bonus cells (free-square / bomb) ──────────────────────────
  const applyAutoBonus = useCallback((cellIdx: number, snapshotCells: Cell[], team: Team) => {
    const picker = currentPickerRef.current;
    const cell = snapshotCells[cellIdx];

    if (cell?.bonus === 'free-square') {
      const updated = snapshotCells.map((c) =>
        c.index === cellIdx ? { ...c, team } : c
      );
      setCells(updated);
      animateClaim([cellIdx]);
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
      const targets = snapshotCells
        .filter((c) => c.team === opposite(team))
        .map((c) => c.index);
      if (targets.length === 0) {
        setPhase('applying');
        applyingTimerRef.current = setTimeout(() => advanceTurn(snapshotCells, team, false), 1600);
        return;
      }
      setCells(snapshotCells);
      setBonusPickTargets(targets);
      setPhase('bonus-pick');
    }
  }, [onScore, advanceTurn, animateClaim]);

  // ── Handle cell tap (picking phase) ──────────────────────────────────────
  const handleCellClick = useCallback(async (cellIdx: number) => {
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

    // Question pre-generated at game start — instant reveal
    if (cell.question) {
      if (cell.qType === 'written' && cell.options) {
        onSetInputSpec?.({
          type: 'choice',
          gameKey: 'sector-strike',
          prompt: cell.question,
          options: cell.options,
          timerSeconds: 60,
        });
      }
      setPhase('answering');
      return;
    }

    // Fallback: pre-generation failed for this cell, fetch now
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

      const data = await res.json() as { question: string; options?: string[]; correctIndex?: number };
      setCells((prev) =>
        prev.map((c) =>
          c.index === cellIdx
            ? { ...c, question: data.question, options: data.options ?? null, correctIndex: data.correctIndex ?? null }
            : c
        )
      );
      if (cell.qType === 'written' && data.options) {
        onSetInputSpec?.({
          type: 'choice',
          gameKey: 'sector-strike',
          prompt: data.question,
          options: data.options,
          timerSeconds: 60,
        });
      }
      setPhase('answering');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      if (livePhase() !== 'loading') return;
      const fallback = cell.qType === 'speaking'
        ? `What do you know about ${topic}? Share at least two ideas.`
        : `Which of the following is true about ${topic}?`;
      const fallbackOptions = [
        'It is commonly studied and discussed',
        'It has no real-world applications',
        'It was invented last year',
        'It only exists in one country',
      ];
      setCells((prev) =>
        prev.map((c) =>
          c.index === cellIdx
            ? { ...c, question: fallback, options: cell.qType === 'written' ? fallbackOptions : null, correctIndex: cell.qType === 'written' ? 0 : null }
            : c
        )
      );
      if (cell.qType === 'written') {
        onSetInputSpec?.({ type: 'choice', gameKey: 'sector-strike', prompt: fallback, options: fallbackOptions, timerSeconds: 60 });
      }
      setPhase('answering');
    }
  }, [topic, difficulty, applyAutoBonus, onSetInputSpec]);

  // ── Written answer vote handler ───────────────────────────────────────────
  const handleVote = useCallback((vote: GameRemoteVote) => {
    if (phaseRef.current !== 'answering') return;
    const pickerId = currentPickerRef.current?.id;
    if (!pickerId || vote.studentId !== pickerId) return;
    const cell = cellsRef.current[selectedCellRef.current!];
    if (!cell || cell.qType !== 'written') return;
    if (selectedOptionIndexRef.current !== null) return;
    // ChoiceInput submits option text; QuizChoiceInput submits index string — handle both
    let choiceIndex = parseInt(vote.choice, 10);
    if (isNaN(choiceIndex)) choiceIndex = cell.options?.indexOf(vote.choice) ?? -1;
    if (choiceIndex < 0 || choiceIndex > 3) return;
    selectedOptionIndexRef.current = choiceIndex;
    setSelectedOptionIndex(choiceIndex);
    setTimeout(() => {
      if (choiceIndex === cell.correctIndex) handleCorrect();
      else handleWrong();
    }, 800);
  }, [handleCorrect, handleWrong]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.(handleVote);
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, handleVote]);

  // ── Start game ────────────────────────────────────────────────────────────
  const startGame = useCallback(async () => {
    if (students.length < 2) return;
    if (applyingTimerRef.current) clearTimeout(applyingTimerRef.current);

    const shuffled = shuffle(students);
    const mid = Math.ceil(shuffled.length / 2);
    const x = shuffled.slice(0, mid);
    const o = shuffled.slice(mid);
    setXTeam(x);
    setOTeam(o);

    const initialCells = buildCells(questionMode);
    setCells(initialCells);
    setCurrentTeam('x');
    setCurrentPicker(pickRandom(x));
    setSelectedCell(null);
    setSelectedOptionIndex(null);
    selectedOptionIndexRef.current = null;
    setLastResult(null);
    setBonusPickTargets([]);
    setWinner(null);
    setTimeLeft(GAME_DURATION);
    setAnimatingCells([]);
    setWinningCells([]);
    setPhase('preparing');

    // Pre-generate questions for all cells that need them (not free-square or bomb)
    const cellsToFetch = initialCells.filter(
      (c) => c.bonus !== 'free-square' && c.bonus !== 'bomb'
    );
    const results = await Promise.allSettled(
      cellsToFetch.map(async (cell) => {
        const data = await fetchOneQuestion(cell.qType);
        return { index: cell.index, data };
      })
    );

    setCells((prev) =>
      prev.map((cell) => {
        const hit = results.find(
          (r) => r.status === 'fulfilled' && r.value.index === cell.index
        );
        if (hit && hit.status === 'fulfilled' && hit.value.data) {
          const { question, options, correctIndex } = hit.value.data;
          return { ...cell, question: question ?? null, options: options ?? null, correctIndex: correctIndex ?? null };
        }
        return cell;
      })
    );

    startTimer();
    setPhase('picking');
  }, [students, questionMode, startTimer, fetchOneQuestion]);

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

  // ── Render: PREPARING ────────────────────────────────────────────────────
  if (phase === 'preparing') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-lc-text2 text-sm">Preparing board…</p>
        <p className="text-xs text-lc-text3">Generating questions for all 64 sectors</p>
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

        <div className="grid grid-cols-8 grid-rows-8 gap-0.5 w-full max-w-sm mx-auto aspect-square">
          {cells.map((cell) => (
            <div
              key={cell.index}
              className={[
                'rounded flex items-center justify-center text-xs font-black',
                cell.team === 'x' ? 'bg-blue-500 text-white' :
                cell.team === 'o' ? 'bg-orange-500 text-white' :
                'bg-lc-surface',
                winningCells.includes(cell.index) ? 'animate-cell-flash ring-2 ring-white' : '',
              ].filter(Boolean).join(' ')}
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
        currentCell.bonus === 'bomb' ? (
          <div className="rounded-xl px-3 py-2.5 text-sm font-bold text-center bg-red-500/15 text-red-300 border border-red-500/30 flex items-center justify-center gap-2">
            <Bomb className="w-4 h-4" />
            Bomb! {currentPicker?.name} — choose an opponent sector to destroy
          </div>
        ) : (
          <div className="rounded-xl px-3 py-2 text-xs font-semibold text-center bg-yellow-500/15 text-yellow-300 border border-yellow-500/25 flex items-center justify-center gap-1.5">
            <BonusIcon bonus={currentCell.bonus} className="w-3.5 h-3.5" />
            {BONUS_NAMES[currentCell.bonus]} — tap a highlighted sector
          </div>
        )
      )}

      {/* 8×8 Grid */}
      <div className="grid grid-cols-8 grid-rows-8 gap-0.5 w-full max-w-sm mx-auto aspect-square">
        {cells.map((cell) => {
          const isSelected = cell.index === selectedCell;
          const isTarget = bonusPickTargets.includes(cell.index);
          const wasBombed = cell.index === lastBombedCell;
          const isClaiming = animatingCells.includes(cell.index);
          const isWinning = winningCells.includes(cell.index);
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
                'w-full h-full rounded flex items-center justify-center text-xs font-black transition-colors select-none',
                cell.team === 'x' ? 'bg-blue-500 text-white' :
                cell.team === 'o' ? 'bg-orange-500 text-white' :
                'bg-lc-surface text-lc-text3',
                isClaiming                                         ? 'animate-cell-claim' : '',
                wasBombed                                          ? 'animate-cell-shake ring-2 ring-red-500' : '',
                isWinning                                          ? 'animate-cell-flash ring-2 ring-white' : '',
                isSelected && !showResult && !isClaiming           ? 'ring-2 ring-white/60 scale-105' : '',
                showResult && lastResult === 'correct' && !isClaiming ? 'ring-2 ring-green-400' : '',
                showResult && lastResult === 'wrong'               ? 'ring-2 ring-red-400' : '',
                isTarget                                           ? 'ring-2 ring-yellow-400 animate-pulse cursor-pointer' : '',
                canPick ? 'hover:bg-lc-card hover:scale-105 cursor-pointer' : 'cursor-default',
              ].filter(Boolean).join(' ')}
            >
              {cell.team === 'x' && 'X'}
              {cell.team === 'o' && 'O'}
              {!cell.team && cell.bonusRevealed && cell.bonus && (
                <BonusIcon bonus={cell.bonus} className="w-3 h-3 text-yellow-400" />
              )}
              {!cell.team && !cell.bonusRevealed && phase === 'picking' && (
                <span className="opacity-40 text-[10px]">{cell.index + 1}</span>
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

          {(phase === 'answering' || phase === 'applying') && (
            <>
              {/* Bonus banner — shown for all bonus cells, prominent */}
              {currentCell?.bonus && currentCell.bonusRevealed && (
                <div className={`rounded-lg border px-3 py-2.5 flex items-center gap-3 ${
                  currentCell.bonus === 'bomb'
                    ? 'bg-red-500/15 border-red-500/30'
                    : 'bg-yellow-500/15 border-yellow-500/30'
                }`}>
                  <BonusIcon bonus={currentCell.bonus} className={`w-6 h-6 flex-shrink-0 ${
                    currentCell.bonus === 'bomb' ? 'text-red-400' : 'text-yellow-400'
                  }`} />
                  <div>
                    <p className={`text-sm font-bold ${currentCell.bonus === 'bomb' ? 'text-red-300' : 'text-yellow-300'}`}>
                      {BONUS_NAMES[currentCell.bonus]}!
                    </p>
                    {currentCell.bonus === 'free-square' && (
                      <p className="text-xs text-yellow-400/70">Sector auto-claimed</p>
                    )}
                    {currentCell.bonus === 'bomb' && lastBombedCell !== null && (
                      <p className="text-xs text-red-400/70">Sector {lastBombedCell + 1} destroyed!</p>
                    )}
                    {currentCell.bonus === 'bomb' && lastBombedCell === null && phase === 'applying' && (
                      <p className="text-xs text-red-400/70">No opponent sectors to target</p>
                    )}
                  </div>
                </div>
              )}

              {/* Question text */}
              {currentCell?.question && (
                <p className="text-sm font-semibold text-lc-text leading-snug">
                  {currentCell.question}
                </p>
              )}

              {/* Written: MC option grid */}
              {currentCell?.qType === 'written' && currentCell.options && (
                <div className="grid grid-cols-2 gap-1.5">
                  {currentCell.options.map((opt, i) => {
                    const LABELS = ['A', 'B', 'C', 'D'];
                    const COLORS = ['bg-red-600', 'bg-blue-600', 'bg-amber-500', 'bg-green-600'];
                    const isPicked = selectedOptionIndex === i;
                    const isCorrect = i === currentCell.correctIndex;
                    return (
                      <div
                        key={i}
                        className={`rounded-lg px-2 py-1.5 transition-all ${COLORS[i]} ${
                          selectedOptionIndex !== null && (isPicked || isCorrect) ? 'opacity-100' :
                          selectedOptionIndex !== null ? 'opacity-40' : 'opacity-80'
                        }${isPicked ? ' ring-2 ring-white' : ''}`}
                      >
                        <span className="text-[10px] font-black text-white/70 uppercase">{LABELS[i]}</span>
                        <p className="text-xs font-semibold text-white leading-snug">{opt}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              {currentCell?.qType === 'written' && phase === 'answering' && selectedOptionIndex === null && (
                <p className="text-xs text-lc-text3 italic">
                  Waiting for {currentPicker?.name} to pick an answer…
                </p>
              )}

              {/* Speaking: approve/reject buttons */}
              {phase === 'answering' && currentCell?.qType === 'speaking' && (
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

              {/* Applying result — only for answered questions */}
              {phase === 'applying' && lastResult !== null && (
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

      {/* Legend (only during picking, compact) */}
      {phase === 'picking' && (
        <div className="flex items-center justify-center gap-4 text-[10px] text-lc-text3 pt-1">
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" /> Double Down</span>
          <span className="flex items-center gap-1"><Repeat className="w-3 h-3 text-yellow-400" /> Steal</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> Free</span>
          <span className="flex items-center gap-1"><Bomb className="w-3 h-3 text-yellow-400" /> Bomb</span>
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
