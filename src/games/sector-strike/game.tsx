'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { KitButton, KitLabel } from '@/components/session/widget-kit';
import {
  Radar, Check, X as XIcon, Clock, Trophy, Star, Repeat, Zap, Bomb,
  Navigation, Crosshair, AlertTriangle, Users, Mic, PenLine, Plane,
} from 'lucide-react';
import type { GameProps, GameRemoteVote } from '../types';
import type { InputSpec } from '@/lib/input-spec';
import { useSessionStore, getEffectiveTopic, getDisplayTopic } from '@/stores/session-store';
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

interface RoundVote {
  clientId: string;
  choiceIndex: number;
}

const GAME_DURATION = 20 * 60;
const CLAIM_POINTS = 10;
const FREE_SQUARE_POINTS = 5;

// ─── Squadron identities ───────────────────────────────────────────────────────

const TEAM = {
  x: {
    name: 'Azure Squadron',
    text: 'text-sky-300',
    cellBg: 'bg-gradient-to-br from-sky-400 to-blue-600',
    cellGlow: 'shadow-[0_0_10px_rgba(56,189,248,0.55)]',
    chip: 'bg-sky-500/15 border-sky-400/40 text-sky-300',
    dot: 'bg-sky-400',
    ring: 'ring-sky-400',
    confetti: ['#38bdf8', '#0ea5e9', '#ffffff'],
  },
  o: {
    name: 'Ember Squadron',
    text: 'text-amber-300',
    cellBg: 'bg-gradient-to-br from-amber-400 to-orange-600',
    cellGlow: 'shadow-[0_0_10px_rgba(251,191,36,0.55)]',
    chip: 'bg-amber-500/15 border-amber-400/40 text-amber-300',
    dot: 'bg-amber-400',
    ring: 'ring-amber-400',
    confetti: ['#fbbf24', '#f97316', '#ffffff'],
  },
} as const;

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

// All 4-in-a-row lines on the 8×8 grid (rows, columns, both diagonals).
function allLines(): number[][] {
  const lines: number[][] = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c <= 4; c++) lines.push([0, 1, 2, 3].map((d) => r * 8 + c + d));
  for (let c = 0; c < 8; c++) for (let r = 0; r <= 4; r++) lines.push([0, 1, 2, 3].map((d) => (r + d) * 8 + c));
  for (let r = 0; r <= 4; r++) for (let c = 0; c <= 4; c++) lines.push([0, 1, 2, 3].map((d) => (r + d) * 8 + c + d));
  for (let r = 3; r < 8; r++) for (let c = 0; c <= 4; c++) lines.push([0, 1, 2, 3].map((d) => (r - d) * 8 + c + d));
  return lines;
}

function checkWin(cells: Cell[], team: Team): number[] | null {
  for (const line of allLines()) {
    if (line.every((i) => cells[i]?.team === team)) return line;
  }
  return null;
}

// A team is "threatening" when some line holds 3 of its sectors plus 1 open sector.
function threatTeam(cells: Cell[]): Team | null {
  for (const line of allLines()) {
    const teams = line.map((i) => cells[i]?.team);
    for (const t of ['x', 'o'] as Team[]) {
      if (teams.filter((v) => v === t).length === 3 && teams.filter((v) => v === null).length === 1) {
        return t;
      }
    }
  }
  return null;
}

/** The line a team is one sector away from completing (for the red board highlight). */
function threatLine(cells: Cell[]): { team: Team; line: number[] } | null {
  for (const line of allLines()) {
    const teams = line.map((i) => cells[i]?.team);
    for (const t of ['x', 'o'] as Team[]) {
      if (teams.filter((v) => v === t).length === 3 && teams.filter((v) => v === null).length === 1) return { team: t, line };
    }
  }
  return null;
}

const COLS = 'ABCDEFGH';
/** Spoken coordinates (A1–H8) so pickers call their sector out loud. */
const coord = (i: number) => `${COLS[i % 8]}${Math.floor(i / 8) + 1}`;

function buildCells(questionMode: string): Cell[] {
  const positions = shuffle(Array.from({ length: 64 }, (_, i) => i));
  const bonusMap: Record<number, BonusType> = {};
  // ~14 of 64 sectors carry a power-up (was 8) so modifiers show up often enough to shape play,
  // skewed toward the fun/positive ones over the disruptive steal/bomb.
  const bonusTypes: BonusType[] = [
    'double-down', 'double-down', 'double-down', 'double-down',
    'free-square', 'free-square', 'free-square', 'free-square',
    'steal', 'steal', 'steal',
    'bomb', 'bomb', 'bomb',
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
  const sourceMaterial = useSessionStore((s) => s.sourceMaterial);
  // Human-facing theme for fallback question text — prefers the source title over a bare 'General'.
  const displayTopic = getDisplayTopic(sessionSettings, sourceMaterial);
  const questionMode = (config.questionMode as string) ?? 'both';

  // ── State ─────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('idle');
  const [cells, setCells] = useState<Cell[]>([]);
  const [xTeam, setXTeam] = useState<Student[]>([]);
  const [oTeam, setOTeam] = useState<Student[]>([]);
  const [teamMap, setTeamMap] = useState<Record<string, Team>>({});
  const [currentTeam, setCurrentTeam] = useState<Team>('x');
  const [currentPicker, setCurrentPicker] = useState<Student | null>(null);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [winner, setWinner] = useState<Team | null>(null);
  const [bonusPickTargets, setBonusPickTargets] = useState<number[]>([]);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);
  const [lastBombedCell, setLastBombedCell] = useState<number | null>(null);
  const [animatingCells, setAnimatingCells] = useState<number[]>([]);
  const [winningCells, setWinningCells] = useState<number[]>([]);
  const [roundVotes, setRoundVotes] = useState<Record<string, RoundVote>>({});
  const [revealCorrectIndex, setRevealCorrectIndex] = useState<number | null>(null);
  const [lastTally, setLastTally] = useState<{ correct: number; total: number } | null>(null);

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
  const teamMapRef = useRef<Record<string, Team>>({});
  teamMapRef.current = teamMap;
  const roundVotesRef = useRef<Record<string, RoundVote>>({});
  roundVotesRef.current = roundVotes;
  const gameStartTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const applyingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);
  // Set once per picked question; every broadcast of that question reuses it
  const questionStartedAtRef = useRef<number>(0);

  // ── Derived ───────────────────────────────────────────────────────────────
  const xCount = cells.filter((c) => c.team === 'x').length;
  const oCount = cells.filter((c) => c.team === 'o').length;
  const currentCell = selectedCell !== null ? cells[selectedCell] : null;
  const activeTeamSize = (currentTeam === 'x' ? xTeam : oTeam).length;
  const reportedCount = Object.keys(roundVotes).length;
  const threat = (phase === 'picking' || phase === 'answering') ? threatTeam(cells) : null;

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

  // ── Build the written-question input spec broadcast to all devices ────────
  // Carries the team map + active team so the defending squadron's phones show
  // a holding screen instead of a tappable question.
  const buildQuestionSpec = useCallback(
    (cell: Cell, perStudentData?: Record<string, unknown>): InputSpec => ({
      type: 'choice',
      gameKey: 'sector-strike',
      prompt: cell.question ?? '',
      options: cell.options ?? [],
      timerSeconds: 60,
      // Stable per-question nonce: reveal/lock rebroadcasts must carry the same
      // startedAt so the server keeps the original timer stamp for the round.
      startedAt: questionStartedAtRef.current,
      sectorTeamByStudentId: teamMapRef.current,
      sectorActiveTeam: currentTeamRef.current,
      ...(perStudentData ? { perStudentData } : {}),
    }),
    [],
  );

  // ── Fetch one question (used during pre-generation) ──────────────────────
  const fetchOneQuestion = useCallback(async (qType: QType): Promise<{ question: string; options?: string[]; correctIndex?: number } | null> => {
    try {
      const res = await fetch('/api/sector-strike/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty, qType, ...(sourceMaterial ? { sourceMaterial } : {}) }),
      });
      if (!res.ok) return null;
      return await res.json() as { question: string; options?: string[]; correctIndex?: number };
    } catch {
      return null;
    }
  }, [topic, difficulty, sourceMaterial]);

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
        particleCount: 160,
        spread: 85,
        origin: { y: 0.55 },
        colors: [...TEAM[scoringTeam].confetti],
      });
      return;
    }
    const nextTeam = opposite(scoringTeam);
    const nextTeamStudents = nextTeam === 'x' ? xTeamRef.current : oTeamRef.current;
    if (nextTeamStudents.length === 0) return;
    roundVotesRef.current = {};
    setRoundVotes({});
    setRevealCorrectIndex(null);
    setLastTally(null);
    setCurrentTeam(nextTeam);
    setCurrentPicker(pickRandom(nextTeamStudents));
    setSelectedCell(null);
    setLastResult(null);
    onSetInputSpec?.(null);
    setPhase('picking');
  }, [stopTimer, onSetInputSpec]);

  // ── Claim a sector for a team, then resolve any pick-based bonus ──────────
  const claimSector = useCallback((cellIdx: number, team: Team) => {
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
    }, 1600);
  }, [advanceTurn, animateClaim]);

  // ── Speaking: teacher taps ✓ ──────────────────────────────────────────────
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
    claimSector(cellIdx, team);
  }, [onScore, claimSector]);

  // ── Speaking: teacher taps ✗ ──────────────────────────────────────────────
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
    }, 1600);
  }, [onScore, advanceTurn]);

  // ── Written: tally the active team and claim if the majority is correct ───
  const evaluateWritten = useCallback(() => {
    if (phaseRef.current !== 'answering') return;
    const cellIdx = selectedCellRef.current;
    const team = currentTeamRef.current;
    if (cellIdx === null) return;
    const cell = cellsRef.current[cellIdx];
    if (!cell || cell.qType !== 'written') return;
    // Defensive: a written cell with no correct answer can't be scored — pass the turn rather than hang.
    if (cell.correctIndex == null) {
      setLastResult('wrong');
      setPhase('applying');
      applyingTimerRef.current = setTimeout(() => advanceTurn(cellsRef.current, team, false), 1200);
      return;
    }

    const votes = roundVotesRef.current;
    const activeSize = (team === 'x' ? xTeamRef.current : oTeamRef.current).length;

    let correct = 0;
    const perStudentData: Record<string, unknown> = {};
    Object.entries(votes).forEach(([studentId, v]) => {
      const isC = v.choiceIndex === cell.correctIndex;
      if (isC) correct++;
      onScore(studentId, {
        isCorrect: isC,
        points: isC ? CLAIM_POINTS : 0,
        responseData: { cell: cellIdx, team, choice: v.choiceIndex },
      });
      perStudentData[v.clientId] = {
        locked: true,
        result: isC ? 'correct' : 'incorrect',
        pointsEarned: isC ? CLAIM_POINTS : 0,
      };
    });

    // Majority of the active squadron must answer correctly to take the sector.
    const claimed = activeSize > 0 && correct * 2 > activeSize;
    setLastTally({ correct, total: activeSize });
    setRevealCorrectIndex(cell.correctIndex);
    onSetInputSpec?.(buildQuestionSpec(cell, perStudentData));

    if (claimed) {
      claimSector(cellIdx, team);
    } else {
      setLastResult('wrong');
      setPhase('applying');
      applyingTimerRef.current = setTimeout(() => {
        advanceTurn(cellsRef.current, team, false);
      }, 2000);
    }
  }, [onScore, onSetInputSpec, buildQuestionSpec, claimSector, advanceTurn]);

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
        isCorrect: null,
        points: FREE_SQUARE_POINTS,
        outcome: 'on-task',
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
    questionStartedAtRef.current = Date.now();
    roundVotesRef.current = {};
    setRoundVotes({});
    setRevealCorrectIndex(null);
    setLastTally(null);
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
        onSetInputSpec?.(buildQuestionSpec({ ...cell, bonusRevealed: true }));
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
        body: JSON.stringify({ topic, difficulty, qType: cell.qType, ...(sourceMaterial ? { sourceMaterial } : {}) }),
        signal: fetchControllerRef.current.signal,
      });
      if (livePhase() !== 'loading') return;

      const data = await res.json() as { question: string; options?: string[]; correctIndex?: number };
      const filledCell: Cell = { ...cell, bonusRevealed: true, question: data.question, options: data.options ?? null, correctIndex: data.correctIndex ?? null };
      setCells((prev) => prev.map((c) => (c.index === cellIdx ? filledCell : c)));
      if (cell.qType === 'written' && data.options) {
        onSetInputSpec?.(buildQuestionSpec(filledCell));
      }
      setPhase('answering');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      if (livePhase() !== 'loading') return;
      const fallback = cell.qType === 'speaking'
        ? `What do you know about ${displayTopic}? Share at least two ideas.`
        : `Which of the following is true about ${displayTopic}?`;
      const fallbackOptions = [
        'It is commonly studied and discussed',
        'It has no real-world applications',
        'It was invented last year',
        'It only exists in one country',
      ];
      const filledCell: Cell = {
        ...cell,
        bonusRevealed: true,
        question: fallback,
        options: cell.qType === 'written' ? fallbackOptions : null,
        correctIndex: cell.qType === 'written' ? 0 : null,
      };
      setCells((prev) => prev.map((c) => (c.index === cellIdx ? filledCell : c)));
      if (cell.qType === 'written') {
        onSetInputSpec?.(buildQuestionSpec(filledCell));
      }
      setPhase('answering');
    }
  }, [topic, displayTopic, difficulty, sourceMaterial, applyAutoBonus, onSetInputSpec, buildQuestionSpec]);

  // ── Written answer vote handler — collect votes from the active team ──────
  const handleVote = useCallback((vote: GameRemoteVote) => {
    if (phaseRef.current !== 'answering') return;
    const studentId = vote.studentId;
    if (!studentId) return;
    const team = currentTeamRef.current;
    if (teamMapRef.current[studentId] !== team) return; // only the active squadron answers
    const cell = cellsRef.current[selectedCellRef.current!];
    if (!cell || cell.qType !== 'written') return;
    if (roundVotesRef.current[studentId]) return; // one vote per student per sector

    // ChoiceInput submits option text; QuizChoiceInput submits index string — handle both
    let choiceIndex = parseInt(vote.choice, 10);
    if (isNaN(choiceIndex)) choiceIndex = cell.options?.indexOf(vote.choice) ?? -1;
    if (choiceIndex < 0 || choiceIndex > 3) return;

    const next = { ...roundVotesRef.current, [studentId]: { clientId: vote.clientId, choiceIndex } };
    roundVotesRef.current = next;
    setRoundVotes(next);

    const activeSize = (team === 'x' ? xTeamRef.current : oTeamRef.current).length;
    if (Object.keys(next).length >= activeSize) {
      setTimeout(() => evaluateWritten(), 700);
    }
  }, [evaluateWritten]);

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
    const map: Record<string, Team> = {};
    x.forEach((s) => { map[s.id] = 'x'; });
    o.forEach((s) => { map[s.id] = 'o'; });
    setTeamMap(map);
    teamMapRef.current = map;

    const initialCells = buildCells(questionMode);
    setCells(initialCells);
    setCurrentTeam('x');
    setCurrentPicker(pickRandom(x));
    setSelectedCell(null);
    roundVotesRef.current = {};
    setRoundVotes({});
    setRevealCorrectIndex(null);
    setLastTally(null);
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
          <Radar className="w-10 h-10 text-lc-text3" />
          <p className="text-lc-text2 text-sm">At least 2 students must be connected to play Sector Strike.</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="relative p-5 rounded-2xl bg-sky-500/10 border border-sky-500/20 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div
              className="absolute left-1/2 top-1/2 h-[180%] w-[180%] -translate-x-1/2 -translate-y-1/2 animate-radar-sweep"
              style={{ background: 'conic-gradient(from 0deg, transparent 300deg, rgba(56,189,248,0.5) 360deg)' }}
            />
          </div>
          <Radar className="relative w-10 h-10 text-sky-400" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="font-display text-5xl text-white">Sector Strike</h2>
          <p className="mx-auto max-w-md text-lg text-white/70">
            Two squadrons fight for control of the airspace. Your whole team answers each
            sector — claim it when the majority is correct. Lock 4 sectors in a row to win.
          </p>
          <p className="text-xs text-lc-text3">
            {students.length} pilots · {
              questionMode === 'both' ? 'Speaking & Written' :
              questionMode === 'speaking' ? 'Speaking' : 'Written'
            } · 20 minutes
          </p>
        </div>
        <KitButton tone="cyan" solid className="!px-8 !py-3 !text-base" onClick={startGame} icon={<Plane className="h-4 w-4" />}>Scramble squadrons</KitButton>
      </div>
    );
  }

  // ── Render: PREPARING ────────────────────────────────────────────────────
  if (phase === 'preparing') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-sky-500/20" />
          <div
            className="absolute inset-0 rounded-full animate-radar-sweep"
            style={{ background: 'conic-gradient(from 0deg, transparent 300deg, rgba(56,189,248,0.6) 360deg)' }}
          />
          <Radar className="absolute inset-0 m-auto w-5 h-5 text-sky-400" />
        </div>
        <p className="text-lc-text2 text-sm">Scanning airspace…</p>
        <p className="text-xs text-lc-text3">Briefing all 64 sectors</p>
      </div>
    );
  }

  // ── Render: WON / TIMEOUT ─────────────────────────────────────────────────
  if (phase === 'won' || phase === 'timeout') {
    const xFinal = cells.filter((c) => c.team === 'x').length;
    const oFinal = cells.filter((c) => c.team === 'o').length;
    const tied = xFinal === oFinal;
    const wt = winner ? TEAM[winner] : null;
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2 py-3">
          <div className="flex justify-center">
            {tied ? (
              <Users className="w-12 h-12 text-lc-text3" />
            ) : (
              <Trophy className={`w-12 h-12 ${wt?.text ?? ''}`} />
            )}
          </div>
          <h2 className="font-display text-5xl text-white">
            {tied ? 'Stalemate over the airspace' : `${wt?.name} takes the skies!`}
          </h2>
          <p className="text-lc-text2 text-sm">
            {phase === 'timeout' ? "Fuel's out — most sectors held wins" : '4 sectors locked in a row!'}
          </p>
          <div className="flex items-center justify-center gap-6 text-sm font-bold mt-1">
            <span className={TEAM.x.text}>{TEAM.x.name}: {xFinal}</span>
            <span className="text-lc-text3">vs</span>
            <span className={TEAM.o.text}>{TEAM.o.name}: {oFinal}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-b from-slate-900 to-slate-950 p-2">
          <div className="mx-auto grid aspect-square w-full max-w-[min(100%,60vh)] grid-cols-8 grid-rows-8 gap-1">
            {cells.map((cell) => (
              <div
                key={cell.index}
                className={[
                  'rounded-[3px] flex items-center justify-center',
                  cell.team === 'x' ? `${TEAM.x.cellBg}` :
                  cell.team === 'o' ? `${TEAM.o.cellBg}` :
                  'bg-slate-800/40',
                  winningCells.includes(cell.index) ? 'animate-cell-flash ring-2 ring-white' : '',
                ].filter(Boolean).join(' ')}
              >
                {cell.team && <Navigation className="w-2.5 h-2.5 text-white/90 fill-white/30" />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <KitButton tone="cyan" solid className="!px-8 !py-3 !text-base" onClick={() => { stopTimer(); setPhase('idle'); onSetInputSpec?.(null); }} icon={<Plane className="h-4 w-4" />}>New sortie</KitButton>
        </div>
      </div>
    );
  }

  // ── Render: Playing phases ────────────────────────────────────────────────
  const ct = TEAM[currentTeam];
  const showResultReveal = phase === 'applying' || (phase === 'bonus-pick');
  const tl = (phase === 'picking' || phase === 'answering' || phase === 'loading') ? threatLine(cells) : null;
  const territory = xCount + oCount;
  const xPct = territory ? (xCount / territory) * 100 : 50;

  return (
    <div className="flex flex-wrap items-start gap-4 text-white">
      {/* ── Board ── (wraps above the panel when the windscreen is narrow) */}
      <div className="relative min-w-0 flex-[2_1_420px] rounded-[1.5rem] border border-sky-400/20 bg-[radial-gradient(ellipse_at_center,#0c1a2e_0%,#060b16_75%)] p-3 shadow-[inset_0_0_60px_rgba(56,189,248,0.08)]">
        {phase === 'picking' && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.5rem] opacity-20">
            <div className="absolute left-1/2 top-1/2 h-[170%] w-[170%] -translate-x-1/2 -translate-y-1/2 animate-radar-sweep" style={{ background: `conic-gradient(from 0deg, transparent 300deg, ${currentTeam === 'x' ? 'rgba(56,189,248,0.55)' : 'rgba(251,191,36,0.55)'} 360deg)` }} />
          </div>
        )}
        <div className="relative mx-auto grid w-full max-w-[min(100%,60vh)] grid-cols-[1.4rem_1fr] grid-rows-[1.4rem_1fr] gap-1">
          <span />
          <div className="grid grid-cols-8 gap-1">{COLS.split('').map((c) => <span key={c} className="text-center font-mono text-xs font-semibold text-sky-200/60">{c}</span>)}</div>
          <div className="grid grid-rows-8 gap-1">{Array.from({ length: 8 }, (_, r) => <span key={r} className="flex items-center justify-center font-mono text-xs font-semibold text-sky-200/60">{r + 1}</span>)}</div>
          <div className="relative grid aspect-square grid-cols-8 grid-rows-8 gap-1">
            {cells.map((cell) => {
              const isSelected = cell.index === selectedCell;
              const isTarget = bonusPickTargets.includes(cell.index);
              const wasBombed = cell.index === lastBombedCell;
              const isClaiming = animatingCells.includes(cell.index);
              const isWinning = winningCells.includes(cell.index);
              const inThreat = tl?.line.includes(cell.index);
              const canPick = phase === 'picking' && cell.team === null;
              const canBonus = phase === 'bonus-pick' && isTarget;
              const showLock = isSelected && (phase === 'answering' || phase === 'loading');
              return (
                <button
                  key={cell.index}
                  onClick={() => { if (canBonus) handleBonusPick(cell.index); else if (canPick) handleCellClick(cell.index); }}
                  disabled={!canPick && !canBonus}
                  className={[
                    'relative flex h-full w-full select-none items-center justify-center rounded-md border transition-all',
                    cell.team === 'x' ? `${TEAM.x.cellBg} ${TEAM.x.cellGlow} border-sky-200/40` :
                    cell.team === 'o' ? `${TEAM.o.cellBg} ${TEAM.o.cellGlow} border-amber-200/40` :
                    'border-sky-300/10 bg-sky-950/40',
                    isClaiming ? 'animate-cell-claim' : '',
                    wasBombed ? 'animate-cell-shake ring-2 ring-red-500' : '',
                    isWinning ? 'animate-cell-flash z-10 ring-4 ring-white' : '',
                    inThreat && !isWinning ? `ring-2 ${tl?.team === 'x' ? 'ring-sky-300' : 'ring-amber-300'} animate-pulse` : '',
                    showResultReveal && isSelected && lastResult === 'correct' ? 'ring-4 ring-emerald-300' : '',
                    showResultReveal && isSelected && lastResult === 'wrong' ? 'ring-4 ring-rose-400' : '',
                    isTarget ? 'animate-pulse cursor-pointer ring-2 ring-yellow-300' : '',
                    canPick ? 'cursor-pointer hover:scale-105 hover:border-sky-300/60 hover:bg-sky-800/40' : 'cursor-default',
                  ].filter(Boolean).join(' ')}
                >
                  {cell.team && <Navigation className={`h-[45%] w-[45%] fill-white/30 text-white/95 ${cell.team === 'o' ? 'rotate-180' : ''}`} />}
                  {!cell.team && cell.bonusRevealed && cell.bonus && <BonusIcon bonus={cell.bonus} className="h-[45%] w-[45%] text-yellow-300" />}
                  {!cell.team && !cell.bonusRevealed && phase === 'picking' && <span className="font-mono text-[10px] font-semibold text-sky-200/35 sm:text-xs">{coord(cell.index)}</span>}
                  {showLock && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center animate-target-lock">
                      <Crosshair className="h-full w-full text-white/85" strokeWidth={1.25} />
                    </span>
                  )}
                </button>
              );
            })}
            {/* Capture fly-in: a plane streaks from the team's side to the new sector */}
            <AnimatePresence>
              {animatingCells.slice(0, 1).map((idx) => {
                const team = cells[idx]?.team;
                if (!team) return null;
                const left = `${(idx % 8) * 12.5 + 6.25}%`;
                const top = `${Math.floor(idx / 8) * 12.5 + 6.25}%`;
                return (
                  <motion.span key={`fly-${idx}`} className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2" initial={{ left: team === 'x' ? '-8%' : '108%', top, opacity: 0, scale: 0.6 }} animate={{ left, top, opacity: [0, 1, 1, 0], scale: [0.6, 1.4, 1.4, 0.4] }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }}>
                    <Plane className={`h-8 w-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] ${team === 'x' ? 'rotate-45 text-sky-200' : '-rotate-[135deg] text-amber-200'}`} />
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Side panel ── */}
      <div className="min-w-0 flex-[1_1_300px] space-y-3">
        {/* Squadron scoreboard + territory tug */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
          <div className="flex items-center justify-between">
            <div className={`rounded-xl px-3 py-1.5 ${currentTeam === 'x' ? 'bg-sky-400/15 ring-1 ring-sky-300/60' : ''}`}>
              <p className={`font-mono text-[11px] uppercase tracking-[0.14em] ${TEAM.x.text}`}>{TEAM.x.name}</p>
              <p className="font-display text-4xl leading-none">{xCount}</p>
            </div>
            <div className={`flex items-center gap-1 font-mono text-sm ${timeLeft <= 60 ? 'animate-pulse font-bold text-rose-300' : 'text-white/60'}`}><Clock className="h-4 w-4" />{formatTime(timeLeft)}</div>
            <div className={`rounded-xl px-3 py-1.5 text-right ${currentTeam === 'o' ? 'bg-amber-400/15 ring-1 ring-amber-300/60' : ''}`}>
              <p className={`font-mono text-[11px] uppercase tracking-[0.14em] ${TEAM.o.text}`}>{TEAM.o.name}</p>
              <p className="font-display text-4xl leading-none">{oCount}</p>
            </div>
          </div>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full bg-sky-400" animate={{ width: `${xPct}%` }} transition={{ type: 'spring', stiffness: 90, damping: 16 }} />
            <div className="h-full flex-1 bg-amber-400" />
          </div>
        </div>

        {threat && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-100 animate-pulse">
            <AlertTriangle className="h-4 w-4 shrink-0" />{TEAM[threat].name} is one sector from victory. Defend the line!
          </div>
        )}

        {phase !== 'bonus-pick' && (
          <div className={`rounded-2xl border px-4 py-3 ${ct.chip}`}>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em]">{ct.name}</p>
            {currentPicker && (
              <p className="mt-0.5 flex items-center gap-2 text-lg text-white">
                {phase === 'picking'
                  ? <><Crosshair className="h-5 w-5" />{currentPicker.name}: call a sector (like &ldquo;B4&rdquo;)</>
                  : currentCell?.qType === 'written'
                    ? <><PenLine className="h-5 w-5" />Squadron: answer on your phones</>
                    : <><Mic className="h-5 w-5" />{currentPicker.name}: answer out loud</>}
              </p>
            )}
          </div>
        )}

        {phase === 'bonus-pick' && currentCell?.bonus && (
          <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-lg font-semibold ${currentCell.bonus === 'bomb' ? 'border-rose-400/40 bg-rose-500/15 text-rose-100' : 'border-yellow-300/40 bg-yellow-400/10 text-yellow-100'}`}>
            <BonusIcon bonus={currentCell.bonus} className="h-5 w-5 shrink-0" />
            {currentCell.bonus === 'bomb' ? `Bomb! ${currentPicker?.name}: pick an enemy sector` : currentCell.bonus === 'double-down' ? 'Double Down: tap a free sector next to it' : currentCell.bonus === 'steal' ? 'Steal: tap any enemy sector' : `${BONUS_NAMES[currentCell.bonus]}: tap a highlighted sector`}
          </div>
        )}

        {(phase === 'loading' || phase === 'answering' || phase === 'applying') && (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
            {selectedCell !== null && <KitLabel tone={currentTeam === 'x' ? 'cyan' : 'amber'}>Sector {coord(selectedCell)}</KitLabel>}
            {phase === 'loading' && <p className="flex items-center gap-2 text-white/70"><span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />Loading question…</p>}
            {(phase === 'answering' || phase === 'applying') && (
              <>
                {currentCell?.bonus && currentCell.bonusRevealed && (
                  <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${currentCell.bonus === 'bomb' ? 'border-rose-400/40 bg-rose-500/15 text-rose-100' : 'border-yellow-300/40 bg-yellow-400/10 text-yellow-100'}`}>
                    <BonusIcon bonus={currentCell.bonus} className="h-5 w-5" />
                    <span className="font-semibold">{BONUS_NAMES[currentCell.bonus]}!</span>
                    {currentCell.bonus === 'free-square' && <span className="text-sm opacity-80">Sector auto-claimed</span>}
                  </div>
                )}
                {currentCell?.question && <p className="font-display text-2xl leading-snug">{currentCell.question}</p>}
                {currentCell?.qType === 'written' && currentCell.options && (
                  <div className="grid grid-cols-2 gap-2">
                    {currentCell.options.map((opt, i) => {
                      const revealed = revealCorrectIndex !== null;
                      const isCorrect = i === revealCorrectIndex;
                      const tone = ['border-cyan-300/50 bg-cyan-400/10', 'border-violet-300/50 bg-violet-400/10', 'border-amber-300/50 bg-amber-300/10', 'border-rose-300/50 bg-rose-400/10'][i];
                      return (
                        <div key={i} className={`rounded-xl border-2 px-3 py-2 transition-all ${tone} ${revealed ? (isCorrect ? 'ring-2 ring-emerald-300' : 'opacity-35') : ''}`}>
                          <span className="font-mono text-xs font-bold text-white/60">{'ABCD'[i]}</span>
                          <p className="text-base font-semibold leading-snug">{opt}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
                {currentCell?.qType === 'written' && phase === 'answering' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{reportedCount} of {activeTeamSize} answered</span>
                      <span className="flex gap-1">{Array.from({ length: activeTeamSize }).map((_, i) => <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < reportedCount ? ct.dot : 'bg-white/15'}`} />)}</span>
                    </div>
                    <KitButton tone={currentTeam === 'x' ? 'cyan' : 'amber'} solid className="w-full !py-2.5 !text-sm" onClick={evaluateWritten}>{reportedCount === 0 ? 'Reveal answer & continue' : 'Reveal result'}</KitButton>
                  </div>
                )}
                {phase === 'answering' && currentCell?.qType === 'speaking' && (
                  <div className="flex gap-2">
                    <KitButton tone="emerald" solid className="flex-1 !py-2.5 !text-sm" onClick={handleCorrect} icon={<Check className="h-4 w-4" />}>Correct</KitButton>
                    <KitButton tone="rose" className="flex-1 !py-2.5 !text-sm" onClick={handleWrong} icon={<XIcon className="h-4 w-4" />}>Wrong</KitButton>
                  </div>
                )}
                {phase === 'applying' && lastResult !== null && (
                  <motion.p initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`flex items-center justify-center gap-2 rounded-xl py-2 text-lg font-semibold ${lastResult === 'correct' ? 'bg-emerald-400/15 text-emerald-200' : 'bg-rose-400/15 text-rose-200'}`}>
                    {lastResult === 'correct' ? <Check className="h-5 w-5" /> : <XIcon className="h-5 w-5" />}
                    {currentCell?.qType === 'written' && lastTally
                      ? lastResult === 'correct' ? `${lastTally.correct}/${lastTally.total} correct: sector claimed!` : `${lastTally.correct}/${lastTally.total} correct: sector held`
                      : lastResult === 'correct' ? 'Sector claimed!' : 'Missed: next squadron'}
                  </motion.p>
                )}
              </>
            )}
          </div>
        )}

        {phase === 'picking' && (
          <div className="grid grid-cols-2 gap-1.5 text-xs text-white/60">
            <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-yellow-300" />Double Down: +1 sector</span>
            <span className="flex items-center gap-1.5"><Repeat className="h-3.5 w-3.5 text-yellow-300" />Steal an enemy sector</span>
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-yellow-300" />Free sector</span>
            <span className="flex items-center gap-1.5"><Bomb className="h-3.5 w-3.5 text-yellow-300" />Bomb an enemy sector</span>
          </div>
        )}
      </div>
    </div>
  );
}
