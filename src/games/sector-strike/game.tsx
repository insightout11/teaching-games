'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Radar, Check, X as XIcon, Clock, Trophy, Star, Repeat, Zap, Bomb,
  Navigation, Crosshair, AlertTriangle, Users,
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
          <h2 className="text-2xl font-game text-lc-text">Sector Strike</h2>
          <p className="text-lc-text2 text-sm max-w-xs">
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
        <button
          onClick={startGame}
          className="px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-sky-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          Scramble Squadrons
        </button>
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
          <h2 className="text-2xl font-game text-lc-text">
            {tied ? "Stalemate over the airspace" : `${wt?.name} takes the skies!`}
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
          <div className="grid grid-cols-8 grid-rows-8 gap-1 w-full max-w-md mx-auto aspect-square">
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

        <button
          onClick={() => { stopTimer(); setPhase('idle'); onSetInputSpec?.(null); }}
          className="w-full py-3 bg-lc-surface border border-lc-border text-lc-text rounded-xl font-bold hover:bg-lc-card transition-all"
        >
          New Sortie
        </button>
      </div>
    );
  }

  // ── Render: Playing phases ────────────────────────────────────────────────
  const ct = TEAM[currentTeam];
  const showResultReveal = phase === 'applying' || (phase === 'bonus-pick');

  return (
    <div className="space-y-3">
      {/* Squadron HUD */}
      <div className="flex items-center justify-between text-sm font-bold">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${currentTeam === 'x' ? TEAM.x.chip : 'border-transparent'}`}>
          <Navigation className={`w-4 h-4 ${TEAM.x.text} fill-current`} />
          <span className={TEAM.x.text}>{xCount}</span>
        </div>
        <div className={`flex items-center gap-1 font-mono text-xs ${timeLeft <= 60 ? 'text-red-400 font-bold animate-pulse' : 'text-lc-text2'}`}>
          <Clock className="w-3 h-3" />
          {formatTime(timeLeft)}
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${currentTeam === 'o' ? TEAM.o.chip : 'border-transparent'}`}>
          <span className={TEAM.o.text}>{oCount}</span>
          <Navigation className={`w-4 h-4 ${TEAM.o.text} fill-current rotate-180`} />
        </div>
      </div>

      {/* Threat warning — one sector from victory */}
      {threat && (
        <div className="rounded-lg px-3 py-1.5 text-xs font-bold text-center bg-red-500/15 text-red-300 border border-red-500/30 flex items-center justify-center gap-1.5 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" />
          {TEAM[threat].name} is one sector from victory — defend the line!
        </div>
      )}

      {/* Team / picker banner */}
      {phase !== 'bonus-pick' && (
        <div className={`rounded-xl px-3 py-2 text-xs font-semibold flex items-center justify-between border ${ct.chip}`}>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${ct.dot}`} />
            {ct.name}
          </span>
          {currentPicker && (
            <span className="text-white/80 font-normal">
              {phase === 'picking'
                ? `${currentPicker.name} — choose a sector`
                : currentCell?.qType === 'written'
                  ? 'Squadron, answer on your devices'
                  : `${currentPicker.name} — answer aloud`}
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
            Bomb! {currentPicker?.name} — choose an enemy sector to destroy
          </div>
        ) : (
          <div className="rounded-xl px-3 py-2 text-xs font-semibold text-center bg-yellow-500/15 text-yellow-300 border border-yellow-500/25 flex items-center justify-center gap-1.5">
            <BonusIcon bonus={currentCell.bonus} className="w-3.5 h-3.5" />
            {BONUS_NAMES[currentCell.bonus]} — tap a highlighted sector
          </div>
        )
      )}

      {/* Tactical board */}
      <div className="relative rounded-2xl border border-sky-500/20 bg-gradient-to-b from-slate-900 to-slate-950 p-2 shadow-[inset_0_0_40px_rgba(56,189,248,0.07)]">
        {/* Radar sweep — only while a pilot is choosing */}
        {phase === 'picking' && (
          <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden opacity-25">
            <div
              className="absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 animate-radar-sweep"
              style={{ background: `conic-gradient(from 0deg, transparent 300deg, ${currentTeam === 'x' ? 'rgba(56,189,248,0.5)' : 'rgba(251,191,36,0.5)'} 360deg)` }}
            />
          </div>
        )}

        <div className="relative grid grid-cols-8 grid-rows-8 gap-1 w-full max-w-md mx-auto aspect-square">
          {cells.map((cell) => {
            const isSelected = cell.index === selectedCell;
            const isTarget = bonusPickTargets.includes(cell.index);
            const wasBombed = cell.index === lastBombedCell;
            const isClaiming = animatingCells.includes(cell.index);
            const isWinning = winningCells.includes(cell.index);
            const canPick = phase === 'picking' && cell.team === null;
            const canBonus = phase === 'bonus-pick' && isTarget;
            const showLock = isSelected && (phase === 'answering' || phase === 'loading');

            return (
              <button
                key={cell.index}
                onClick={() => {
                  if (canBonus) handleBonusPick(cell.index);
                  else if (canPick) handleCellClick(cell.index);
                }}
                disabled={!canPick && !canBonus}
                className={[
                  'relative w-full h-full rounded-[4px] flex items-center justify-center transition-all select-none border',
                  cell.team === 'x' ? `${TEAM.x.cellBg} ${TEAM.x.cellGlow} border-sky-300/30` :
                  cell.team === 'o' ? `${TEAM.o.cellBg} ${TEAM.o.cellGlow} border-amber-300/30` :
                  'bg-slate-800/40 border-white/5',
                  isClaiming ? 'animate-cell-claim' : '',
                  wasBombed ? 'animate-cell-shake ring-2 ring-red-500' : '',
                  isWinning ? 'animate-cell-flash ring-2 ring-white' : '',
                  showResultReveal && isSelected && lastResult === 'correct' ? 'ring-2 ring-green-400' : '',
                  showResultReveal && isSelected && lastResult === 'wrong' ? 'ring-2 ring-red-400' : '',
                  isTarget ? 'ring-2 ring-yellow-400 animate-pulse cursor-pointer' : '',
                  canPick ? 'hover:bg-slate-700/60 hover:border-sky-400/40 hover:scale-105 cursor-pointer' : 'cursor-default',
                ].filter(Boolean).join(' ')}
              >
                {cell.team && <Navigation className={`w-3 h-3 text-white/95 fill-white/30 ${cell.team === 'o' ? 'rotate-180' : ''}`} />}
                {!cell.team && cell.bonusRevealed && cell.bonus && (
                  <BonusIcon bonus={cell.bonus} className="w-3.5 h-3.5 text-yellow-400" />
                )}
                {!cell.team && !cell.bonusRevealed && phase === 'picking' && (
                  <span className="opacity-25 text-[9px] font-mono text-sky-200">{cell.index + 1}</span>
                )}
                {/* Target-lock reticle on the chosen sector */}
                {showLock && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center animate-target-lock">
                    <Crosshair className="w-full h-full text-white/80" strokeWidth={1.25} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question / answer panel */}
      {(phase === 'loading' || phase === 'answering' || phase === 'applying') && (
        <div className="rounded-xl border border-lc-border bg-lc-surface p-3 space-y-3">
          {phase === 'loading' && (
            <div className="flex items-center gap-2 text-lc-text2 py-1">
              <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="text-sm">Loading question…</span>
            </div>
          )}

          {(phase === 'answering' || phase === 'applying') && (
            <>
              {/* Bonus banner */}
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
                  </div>
                </div>
              )}

              {/* Question text */}
              {currentCell?.question && (
                <p className="text-sm font-semibold text-lc-text leading-snug">
                  {currentCell.question}
                </p>
              )}

              {/* Written: MC option grid (correct answer hidden until reveal) */}
              {currentCell?.qType === 'written' && currentCell.options && (
                <div className="grid grid-cols-2 gap-1.5">
                  {currentCell.options.map((opt, i) => {
                    const LABELS = ['A', 'B', 'C', 'D'];
                    const COLORS = ['bg-red-600', 'bg-blue-600', 'bg-amber-500', 'bg-green-600'];
                    const revealed = revealCorrectIndex !== null;
                    const isCorrect = i === revealCorrectIndex;
                    return (
                      <div
                        key={i}
                        className={`rounded-lg px-2 py-1.5 transition-all ${COLORS[i]} ${
                          revealed ? (isCorrect ? 'opacity-100 ring-2 ring-white' : 'opacity-35') : 'opacity-85'
                        }`}
                      >
                        <span className="text-[10px] font-black text-white/70 uppercase">{LABELS[i]}</span>
                        <p className="text-xs font-semibold text-white leading-snug">{opt}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Written: live reporting + reveal control */}
              {currentCell?.qType === 'written' && phase === 'answering' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-lc-text2">
                      <Users className="w-3.5 h-3.5" />
                      {reportedCount} of {activeTeamSize} reporting
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: activeTeamSize }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-2 h-2 rounded-full ${i < reportedCount ? ct.dot : 'bg-lc-border'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={evaluateWritten}
                    className="w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20 hover:scale-[1.02]"
                  >
                    {reportedCount === 0 ? 'Reveal answer & continue' : 'Reveal result'}
                  </button>
                </div>
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

              {/* Applying result */}
              {phase === 'applying' && lastResult !== null && (
                <div className={`text-center font-bold text-sm py-1.5 rounded-lg ${
                  lastResult === 'correct'
                    ? 'text-green-400 bg-green-500/10'
                    : 'text-red-400 bg-red-500/10'
                }`}>
                  {currentCell?.qType === 'written' && lastTally
                    ? lastResult === 'correct'
                      ? `✓ ${lastTally.correct}/${lastTally.total} correct — sector claimed!`
                      : `✗ ${lastTally.correct}/${lastTally.total} correct — sector held`
                    : lastResult === 'correct' ? '✓ Sector claimed!' : '✗ Missed — next squadron'}
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
          Tap any enemy sector to capture it
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
    </div>
  );
}
