'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameProps, GameRemoteVote } from '../types';
import { BOARD_LAYOUT, BUMPERS, CANVAS_W, CANVAS_H, TRACK_SECTIONS, TRACK_STROKE_WIDTH, SQUARE_CONFIG } from './board-layout';
import type { TeamState, GamePhase, ActiveQuestion, BoardSquare } from './types';
import { getEffectiveTopic, useSessionStore } from '@/stores/session-store';
import { createClient } from '@/lib/supabase/client';
import type { Student } from '@/lib/supabase/types';
import { Trophy, Crosshair, Snowflake } from 'lucide-react';

// ─── Physics constants ────────────────────────────────────────────────────────

const PUCK_R       = 9;
const MAX_SPEED    = 14;    // px per frame at 60fps
const FRICTION     = 0.985; // velocity multiplier per frame
const BOUNCE_DAMP  = 0.72;  // energy retained on collision
const STOP_SPEED   = 0.65;  // px/frame below which puck is considered stopped
const MAX_PHYS_MS  = 8000;  // hard cutoff

const LANDING_THRESHOLD = 80; // max px from nearest square to count as a landing

// ─── Segment rendering helpers ────────────────────────────────────────────────

function segPoly(
  a: { x: number; y: number },
  b: { x: number; y: number },
  hw: number,
): string {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return '';
  const nx = (-dy / len) * hw, ny = (dx / len) * hw;
  return [
    `${a.x + nx},${a.y + ny}`,
    `${b.x + nx},${b.y + ny}`,
    `${b.x - nx},${b.y - ny}`,
    `${a.x - nx},${a.y - ny}`,
  ].join(' ');
}

const COURSE_SEGMENTS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],[4,5],
  [5,6],[6,7],
  [7,8],[8,9],[9,10],[10,11],[11,12],[12,13],
  [13,14],[14,15],
  [15,16],[16,17],[17,18],[18,19],[19,20],[20,21],
];

const SEG_HW = 34;

const SEG_COLOR: Record<string, string> = {
  start:            '#064e3b',
  finish:           '#78350f',
  question:         '#1e3a8a',
  safe:             '#14532d',
  boost:            '#78350f',
  trap:             '#7f1d1d',
  'question-boost': '#4c1d95',
  freeze:           '#0c4a6e',
  double:           '#4c1d95',
  steal:            '#312e81',
  shortcut:         '#7c2d12',
  bounce:           '#713f12',
  hole:             '#1c1917',
};

// ─── Tree helper ──────────────────────────────────────────────────────────────

const TREE_POSITIONS: [number, number][] = [
  // Top rough
  [22, 48], [200, 20], [490, 16], [790, 16], [968, 32],
  // Between middle and top rows
  [38, 168], [455, 168], [820, 170],
  // Between bottom and middle rows
  [38, 320], [680, 316], [905, 305],
  // Bottom edge
  [130, 482], [430, 484], [700, 482],
];

// ─── Team config ─────────────────────────────────────────────────────────────

const TEAM_NAMES     = ['Red', 'Blue', 'Green', 'Yellow'];
const TEAM_COLORS    = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
const TEAM_BG_CLASSES = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];

function splitIntoTeams(students: Student[], count: number): TeamState[] {
  const shuffled = [...students].sort(() => Math.random() - 0.5);
  const teams: TeamState[] = Array.from({ length: count }, (_, i) => ({
    id: i,
    name: TEAM_NAMES[i],
    color: TEAM_COLORS[i],
    bgClass: TEAM_BG_CLASSES[i],
    members: [] as Student[],
    squareIndex: 0,
    shooterIndex: 0,
    skipNextTurn: false,
    finished: false,
  }));
  shuffled.forEach((s, i) => teams[i % count].members.push(s));
  return teams;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ZoneBoardGame({
  students,
  onScore,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  config,
  sessionSettings,
}: GameProps) {
  const numberOfTeams = Math.min(4, Math.max(2, parseInt((config.numberOfTeams as string) ?? '2', 10)));

  const [phase, setPhase] = useState<GamePhase>('idle');
  const [teams, setTeams] = useState<TeamState[]>([]);
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);
  const [boardSquares, setBoardSquares] = useState<BoardSquare[]>(() => [...BOARD_LAYOUT.squares]);
  const [currentQuestion, setCurrentQuestion] = useState<ActiveQuestion | null>(null);
  const [teamVotes, setTeamVotes] = useState<Map<string, number>>(new Map());
  const [puckVisible, setPuckVisible] = useState(false);
  const [puckFellInHole, setPuckFellInHole] = useState(false);
  const [landingSquareIndex, setLandingSquareIndex] = useState<number | null>(null);
  const [resolveMessage, setResolveMessage] = useState('');
  const [winner, setWinner] = useState<TeamState | null>(null);
  const [boardScale, setBoardScale] = useState(0.90);
  const [liveAim, setLiveAim] = useState<{ power: number; angleRad: number } | null>(null);

  const boardContainerRef = useRef<HTMLDivElement>(null);
  const sessionId = useSessionStore(state => state.sessionId);

  const phaseRef            = useRef<GamePhase>('idle');
  const teamsRef            = useRef<TeamState[]>([]);
  const activeTeamIndexRef  = useRef(0);
  const puckDomRef          = useRef<HTMLDivElement>(null);
  const rafRef              = useRef<number>(0);
  const windmillRef         = useRef<SVGGElement>(null);
  const currentQuestionRef  = useRef<ActiveQuestion | null>(null);
  const teamVotesRef        = useRef<Map<string, number>>(new Map());
  const pendingQuestionRef  = useRef<Promise<ActiveQuestion | null> | null>(null);
  const excludeCacheIdsRef  = useRef<string[]>([]);
  const voteTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoringTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  function transitionTo(newPhase: GamePhase) {
    phaseRef.current = newPhase;
    setPhase(newPhase);
  }

  // ─── Windmill spin ──────────────────────────────────────────────────────────

  useEffect(() => {
    let raf: number;
    let angle = 0;
    const wm = BUMPERS[2]; // windmill bumper position
    function spin() {
      angle = (angle + 1.2) % 360;
      if (windmillRef.current) {
        windmillRef.current.setAttribute('transform', `rotate(${angle} ${wm.cx} ${wm.cy})`);
      }
      raf = requestAnimationFrame(spin);
    }
    raf = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ─── Question fetch ─────────────────────────────────────────────────────────

  function prefetchQuestion() {
    const topic = getEffectiveTopic(sessionSettings);
    pendingQuestionRef.current = fetch('/api/zone-board/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        difficulty: sessionSettings.difficulty,
        excludeCacheIds: excludeCacheIdsRef.current,
      }),
    })
      .then(r => r.json())
      .then((data: ActiveQuestion & { cacheId: string | null }) => {
        if (data.cacheId) excludeCacheIdsRef.current.push(data.cacheId);
        return data;
      })
      .catch(() => null);
  }

  async function awaitQuestion(): Promise<ActiveQuestion | null> {
    if (!pendingQuestionRef.current) prefetchQuestion();
    const q = await pendingQuestionRef.current;
    pendingQuestionRef.current = null;
    return q;
  }

  // ─── Vote tabulation ────────────────────────────────────────────────────────

  const tabulateVotes = useCallback(() => {
    if (phaseRef.current !== 'answering') return;
    if (voteTimerRef.current) clearTimeout(voteTimerRef.current);

    const activeTeam = teamsRef.current[activeTeamIndexRef.current];
    const question = currentQuestionRef.current;
    if (!question) return;

    const tally = [0, 0, 0, 0];
    activeTeam.members.forEach(m => {
      const vote = teamVotesRef.current.get(m.name);
      if (vote !== undefined && vote >= 0 && vote <= 3) tally[vote]++;
    });

    const maxVotes = Math.max(...tally);
    const topChoices = tally.reduce((acc, v, i) => (v === maxVotes ? [...acc, i] : acc), [] as number[]);
    const majorityChoice = topChoices.length === 1 ? topChoices[0] : -1;
    resolveQuestion(majorityChoice === question.correctIndex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Question resolution ────────────────────────────────────────────────────

  function resolveQuestion(isCorrect: boolean) {
    const teamIdx = activeTeamIndexRef.current;
    const teams = teamsRef.current;
    const activeTeam = teams[teamIdx];
    const sq = boardSquares.find(s => s.index === activeTeam.squareIndex) ?? boardSquares[activeTeam.squareIndex];
    const isBoostQuestion = sq?.type === 'question-boost';

    let newIndex = activeTeam.squareIndex;
    let message = '';

    if (isCorrect) {
      if (isBoostQuestion) {
        newIndex = Math.min(21, activeTeam.squareIndex + 4);
        message = 'Correct! Jump forward 4 squares!';
      } else {
        message = 'Correct! Stay put.';
      }
    } else {
      newIndex = Math.max(0, activeTeam.squareIndex - 3);
      message = 'Wrong! Slide back 3 squares.';
    }

    activeTeam.members.forEach(s => {
      onScore(s.id, { isCorrect, points: 0, responseData: { team: activeTeam.name, game: 'zone-board' } });
    });

    const newTeams = teams.map((t, i) => i === teamIdx ? { ...t, squareIndex: newIndex } : t);
    teamsRef.current = newTeams;
    setTeams(newTeams);
    setCurrentQuestion(null);
    onSetInputSpec?.(null);
    setResolveMessage(message);
    transitionTo('scoring');

    if (newIndex >= 21) { setWinner(newTeams[teamIdx]); transitionTo('game_over'); return; }

    scoringTimerRef.current = setTimeout(() => {
      if (phaseRef.current === 'scoring') advanceTurn();
    }, 3200);
  }

  // ─── Square resolution ──────────────────────────────────────────────────────

  async function resolveSquare(squareIndex: number) {
    const sq = BOARD_LAYOUT.squares[squareIndex];
    const teamIdx = activeTeamIndexRef.current;
    const teams = teamsRef.current;

    if (!sq.revealed) {
      setBoardSquares(prev => prev.map(s => s.index === squareIndex ? { ...s, revealed: true } : s));
    }

    const teamsWithToken = teams.map((t, i) => i === teamIdx ? { ...t, squareIndex } : t);
    teamsRef.current = teamsWithToken;
    setTeams(teamsWithToken);

    if (sq.type === 'finish' || squareIndex >= 21) {
      setWinner(teamsWithToken[teamIdx]);
      transitionTo('game_over');
      return;
    }

    setPuckVisible(false);

    switch (sq.type) {
      case 'safe': {
        setResolveMessage('Safe! Nothing happens.');
        transitionTo('scoring');
        scoringTimerRef.current = setTimeout(() => {
          if (phaseRef.current === 'scoring') advanceTurn();
        }, 2500);
        break;
      }

      case 'boost': {
        const newIndex = Math.min(21, squareIndex + 4);
        setResolveMessage('Bonus! Jump forward 4 squares!');
        const boostedTeams = teamsWithToken.map((t, i) => i === teamIdx ? { ...t, squareIndex: newIndex } : t);
        teamsRef.current = boostedTeams;
        setTeams(boostedTeams);
        if (newIndex >= 21) { setWinner(boostedTeams[teamIdx]); transitionTo('game_over'); return; }
        transitionTo('scoring');
        scoringTimerRef.current = setTimeout(() => {
          if (phaseRef.current === 'scoring') advanceTurn();
        }, 2800);
        break;
      }

      case 'trap': {
        const newIndex = Math.max(0, squareIndex - 4);
        setResolveMessage('Trap! Slide back 4 squares!');
        const trappedTeams = teamsWithToken.map((t, i) => i === teamIdx ? { ...t, squareIndex: newIndex } : t);
        teamsRef.current = trappedTeams;
        setTeams(trappedTeams);
        transitionTo('scoring');
        scoringTimerRef.current = setTimeout(() => {
          if (phaseRef.current === 'scoring') advanceTurn();
        }, 2800);
        break;
      }

      case 'freeze': {
        setResolveMessage('Freeze! Lose your next turn.');
        const frozenTeams = teamsWithToken.map((t, i) => i === teamIdx ? { ...t, skipNextTurn: true } : t);
        teamsRef.current = frozenTeams;
        setTeams(frozenTeams);
        transitionTo('scoring');
        scoringTimerRef.current = setTimeout(() => {
          if (phaseRef.current === 'scoring') advanceTurn();
        }, 2800);
        break;
      }

      case 'hole': {
        const newIndex = Math.max(0, squareIndex - 4);
        setResolveMessage('Hole! Back 4 squares and lose a turn.');
        const holedTeams = teamsWithToken.map((t, i) =>
          i === teamIdx ? { ...t, squareIndex: newIndex, skipNextTurn: true } : t
        );
        teamsRef.current = holedTeams;
        setTeams(holedTeams);
        transitionTo('scoring');
        scoringTimerRef.current = setTimeout(() => {
          if (phaseRef.current === 'scoring') advanceTurn();
        }, 2800);
        break;
      }

      case 'double': {
        const newIndex = Math.min(21, squareIndex + 4);
        setResolveMessage('Double! Jump forward 4 squares!');
        const doubledTeams = teamsWithToken.map((t, i) => i === teamIdx ? { ...t, squareIndex: newIndex } : t);
        teamsRef.current = doubledTeams;
        setTeams(doubledTeams);
        if (newIndex >= 21) { setWinner(doubledTeams[teamIdx]); transitionTo('game_over'); return; }
        transitionTo('scoring');
        scoringTimerRef.current = setTimeout(() => {
          if (phaseRef.current === 'scoring') advanceTurn();
        }, 2800);
        break;
      }

      case 'shortcut': {
        const newIndex = Math.min(21, squareIndex + 5);
        setResolveMessage('Shortcut! Skip ahead 5 squares!');
        const skippedTeams = teamsWithToken.map((t, i) => i === teamIdx ? { ...t, squareIndex: newIndex } : t);
        teamsRef.current = skippedTeams;
        setTeams(skippedTeams);
        if (newIndex >= 21) { setWinner(skippedTeams[teamIdx]); transitionTo('game_over'); return; }
        transitionTo('scoring');
        scoringTimerRef.current = setTimeout(() => {
          if (phaseRef.current === 'scoring') advanceTurn();
        }, 2800);
        break;
      }

      case 'steal': {
        const others = teamsWithToken.filter((_, i) => i !== teamIdx);
        if (others.length === 0) {
          setResolveMessage('Nothing to steal!');
          transitionTo('scoring');
          scoringTimerRef.current = setTimeout(() => { if (phaseRef.current === 'scoring') advanceTurn(); }, 2500);
          break;
        }
        const leader = others.reduce((a, b) => a.squareIndex >= b.squareIndex ? a : b);
        const amount = Math.min(2, leader.squareIndex);
        setResolveMessage(`Steal! ${leader.name} Team loses ${amount} squares!`);
        const stolenTeams = teamsWithToken.map((t) =>
          t.id === leader.id ? { ...t, squareIndex: t.squareIndex - amount } : t
        );
        teamsRef.current = stolenTeams;
        setTeams(stolenTeams);
        transitionTo('scoring');
        scoringTimerRef.current = setTimeout(() => { if (phaseRef.current === 'scoring') advanceTurn(); }, 2800);
        break;
      }

      case 'bounce': {
        const shift = Math.random() < 0.5 ? 2 : -2;
        const newIndex = Math.min(21, Math.max(0, squareIndex + shift));
        setResolveMessage(shift > 0 ? 'Bounce! Lucky — up 2 squares!' : 'Bounce! Deflected back 2 squares.');
        const bouncedTeams = teamsWithToken.map((t, i) => i === teamIdx ? { ...t, squareIndex: newIndex } : t);
        teamsRef.current = bouncedTeams;
        setTeams(bouncedTeams);
        if (newIndex >= 21) { setWinner(bouncedTeams[teamIdx]); transitionTo('game_over'); return; }
        transitionTo('scoring');
        scoringTimerRef.current = setTimeout(() => { if (phaseRef.current === 'scoring') advanceTurn(); }, 2800);
        break;
      }

      case 'question':
      case 'question-boost': {
        const question = await awaitQuestion();
        if (!question || phaseRef.current !== 'resolving') return;
        currentQuestionRef.current = question;
        setCurrentQuestion(question);
        teamVotesRef.current = new Map();
        setTeamVotes(new Map());

        onSetInputSpec?.({
          type: 'choice',
          gameKey: 'zone-board',
          prompt: question.question,
          options: question.options,
          timerSeconds: sessionSettings.timerSeconds || 20,
          startedAt: Date.now(),
        });

        transitionTo('answering');
        const timerMs = ((sessionSettings.timerSeconds || 20) + 2) * 1000;
        voteTimerRef.current = setTimeout(tabulateVotes, timerMs);
        prefetchQuestion();
        break;
      }
    }
  }

  // ─── Puck stopped ───────────────────────────────────────────────────────────

  const onPuckStopped = useCallback((x: number, y: number, fellInHole: boolean) => {
    if (phaseRef.current !== 'animating') return;
    transitionTo('resolving');

    if (fellInHole) {
      setPuckFellInHole(true);
      setTimeout(() => {
        setPuckFellInHole(false);
        setPuckVisible(false);
        const teamIdx = activeTeamIndexRef.current;
        const teams = teamsRef.current;
        const newIndex = Math.max(0, teams[teamIdx].squareIndex - 4);
        const newTeams = teams.map((t, i) =>
          i === teamIdx ? { ...t, squareIndex: newIndex, skipNextTurn: true } : t
        );
        teamsRef.current = newTeams;
        setTeams(newTeams);
        setResolveMessage('Fell in a hole! Back 4 squares and lose a turn.');
        transitionTo('scoring');
        scoringTimerRef.current = setTimeout(() => {
          if (phaseRef.current === 'scoring') advanceTurn();
        }, 3000);
      }, 1200);
      return;
    }

    // Find nearest square — no forward-only restriction with physics
    let bestIndex = -1;
    let bestDist = Infinity;
    for (const sq of BOARD_LAYOUT.squares) {
      const dist = Math.hypot(x - sq.x, y - sq.y);
      if (dist < bestDist) { bestDist = dist; bestIndex = sq.index; }
    }

    if (bestIndex === -1 || bestDist > LANDING_THRESHOLD) {
      const teamIdx = activeTeamIndexRef.current;
      const teams = teamsRef.current;
      const newIndex = Math.max(0, teams[teamIdx].squareIndex - 1);
      const newTeams = teams.map((t, i) => i === teamIdx ? { ...t, squareIndex: newIndex } : t);
      teamsRef.current = newTeams;
      setTeams(newTeams);
      setPuckVisible(false);
      setResolveMessage('Out of bounds! Back 1 square.');
      transitionTo('scoring');
      scoringTimerRef.current = setTimeout(() => {
        if (phaseRef.current === 'scoring') advanceTurn();
      }, 2800);
      return;
    }

    setLandingSquareIndex(bestIndex);
    const sq = BOARD_LAYOUT.squares[bestIndex];
    if (sq.type === 'question' || sq.type === 'question-boost') prefetchQuestion();
    resolveSquare(bestIndex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Physics shot ────────────────────────────────────────────────────────────

  function handleShot(power: number, angleRad: number) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const teamIdx = activeTeamIndexRef.current;
    const team = teamsRef.current[teamIdx];
    const startSq = BOARD_LAYOUT.squares[team.squareIndex];

    let px = startSq.x;
    let py = startSq.y;
    let vx = Math.cos(angleRad) * (power * MAX_SPEED);
    let vy = Math.sin(angleRad) * (power * MAX_SPEED);

    if (puckDomRef.current) {
      puckDomRef.current.style.transform = `translate(${px - PUCK_R}px, ${py - PUCK_R}px)`;
    }
    setPuckVisible(true);
    setPuckFellInHole(false);
    setLandingSquareIndex(null);
    transitionTo('animating');

    const launchTime = performance.now();

    function frame() {
      if (phaseRef.current !== 'animating') return;

      if (performance.now() - launchTime > MAX_PHYS_MS) {
        onPuckStopped(px, py, false);
        return;
      }

      px += vx;
      py += vy;
      vx *= FRICTION;
      vy *= FRICTION;

      // Canvas edge bouncing
      if (px < PUCK_R)            { px = PUCK_R;            vx =  Math.abs(vx) * BOUNCE_DAMP; }
      if (px > CANVAS_W - PUCK_R) { px = CANVAS_W - PUCK_R; vx = -Math.abs(vx) * BOUNCE_DAMP; }
      if (py < PUCK_R)            { py = PUCK_R;            vy =  Math.abs(vy) * BOUNCE_DAMP; }
      if (py > CANVAS_H - PUCK_R) { py = CANVAS_H - PUCK_R; vy = -Math.abs(vy) * BOUNCE_DAMP; }

      // Bumper collisions
      for (const b of BUMPERS) {
        const dx = px - b.cx;
        const dy = py - b.cy;
        const d = Math.hypot(dx, dy);
        const minD = PUCK_R + b.r;
        if (d < minD && d > 0.01) {
          const nx = dx / d;
          const ny = dy / d;
          const dot = vx * nx + vy * ny;
          vx = (vx - 2 * dot * nx) * BOUNCE_DAMP;
          vy = (vy - 2 * dot * ny) * BOUNCE_DAMP;
          px = b.cx + nx * (minD + 1);
          py = b.cy + ny * (minD + 1);
        }
      }

      if (puckDomRef.current) {
        puckDomRef.current.style.transform = `translate(${px - PUCK_R}px, ${py - PUCK_R}px)`;
      }

      if (Math.hypot(vx, vy) < STOP_SPEED) {
        onPuckStopped(px, py, false);
      } else {
        rafRef.current = requestAnimationFrame(frame);
      }
    }

    rafRef.current = requestAnimationFrame(frame);
  }

  // ─── Turn management ────────────────────────────────────────────────────────

  function advanceTurn() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (scoringTimerRef.current) clearTimeout(scoringTimerRef.current);
    if (voteTimerRef.current) clearTimeout(voteTimerRef.current);

    const teams = teamsRef.current;

    if (teams.every(t => t.finished)) { transitionTo('game_over'); return; }

    let nextIdx = (activeTeamIndexRef.current + 1) % teams.length;
    let tries = 0;
    while (tries < teams.length) {
      const t = teams[nextIdx];
      if (t.finished) { nextIdx = (nextIdx + 1) % teams.length; tries++; continue; }
      if (t.skipNextTurn) {
        const updated = teams.map((t2, i) => i === nextIdx ? { ...t2, skipNextTurn: false } : t2);
        teamsRef.current = updated;
        setTeams(updated);
        nextIdx = (nextIdx + 1) % teams.length;
        tries++;
        continue;
      }
      break;
    }

    const prevIdx = activeTeamIndexRef.current;
    const prevTeam = teams[prevIdx];
    const newShooter = (prevTeam.shooterIndex + 1) % Math.max(1, prevTeam.members.length);
    const rotated = teamsRef.current.map((t, i) => i === prevIdx ? { ...t, shooterIndex: newShooter } : t);
    teamsRef.current = rotated;
    setTeams(rotated);

    activeTeamIndexRef.current = nextIdx;
    setActiveTeamIndex(nextIdx);
    setResolveMessage('');
    setLandingSquareIndex(null);
    setPuckVisible(false);

    broadcastShootSpec(nextIdx, teamsRef.current);
    transitionTo('shooting');
  }

  function broadcastShootSpec(teamIdx: number, currentTeams: TeamState[]) {
    const team = currentTeams[teamIdx];
    if (!team || team.members.length === 0) return;
    const shooter = team.members[team.shooterIndex];
    onSetInputSpec?.({
      type: 'shuffleboard',
      gameKey: 'zone-board',
      prompt: `${shooter.name}'s turn — aim and shoot!`,
      perStudentData: { [shooter.name]: { isShooter: true } },
      sessionId: sessionId ?? undefined,
    });
  }

  // ─── Game lifecycle ─────────────────────────────────────────────────────────

  function startGame() {
    const newTeams = splitIntoTeams(students, numberOfTeams);
    teamsRef.current = newTeams;
    activeTeamIndexRef.current = 0;
    setTeams(newTeams);
    setActiveTeamIndex(0);
    setBoardSquares([...BOARD_LAYOUT.squares]);
    setWinner(null);
    setResolveMessage('');
    prefetchQuestion();
    broadcastShootSpec(0, newTeams);
    transitionTo('shooting');
  }

  function endGame() {
    if (voteTimerRef.current) clearTimeout(voteTimerRef.current);
    if (scoringTimerRef.current) clearTimeout(scoringTimerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    onSetInputSpec?.(null);
    transitionTo('game_over');
  }

  // ─── Remote vote handler ────────────────────────────────────────────────────

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote: GameRemoteVote) => {
      const phase = phaseRef.current;

      if (phase === 'shooting' && vote.inputType === 'shuffleboard') {
        const activeTeam = teamsRef.current[activeTeamIndexRef.current];
        const shooter = activeTeam?.members[activeTeam.shooterIndex];
        if (!shooter || vote.displayName !== shooter.name) return;
        try {
          const { power, angleRad } = JSON.parse(vote.choice) as { power: number; angleRad: number };
          handleShot(power, angleRad);
        } catch { /* ignore malformed */ }
        return;
      }

      if (phase === 'answering') {
        const choiceIndex = parseInt(vote.choice, 10);
        if (isNaN(choiceIndex)) return;
        teamVotesRef.current = new Map(teamVotesRef.current).set(vote.displayName, choiceIndex);
        setTeamVotes(new Map(teamVotesRef.current));

        const activeTeam = teamsRef.current[activeTeamIndexRef.current];
        const votedCount = activeTeam.members.filter(m => teamVotesRef.current.has(m.name)).length;
        if (votedCount >= activeTeam.members.length && activeTeam.members.length > 0) {
          tabulateVotes();
        }
      }
    });

    return () => { onRegisterRemoteVoteHandler?.(null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (voteTimerRef.current) clearTimeout(voteTimerRef.current);
      if (scoringTimerRef.current) clearTimeout(scoringTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const el = boardContainerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      if (w > 0) setBoardScale(Math.min(1.0, Math.max(0.5, w / CANVAS_W)));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== 'shooting' || !sessionId) { setLiveAim(null); return; }
    const supabase = createClient();
    const ch = supabase.channel(`${sessionId}-aim`)
      .on('broadcast', { event: 'aim' }, (msg: { payload: unknown }) => {
        setLiveAim(msg.payload as { power: number; angleRad: number });
      })
      .subscribe();
    return () => { void ch.unsubscribe(); setLiveAim(null); };
  }, [phase, sessionId]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  const activeTeam = teams[activeTeamIndex] ?? null;
  const shooter    = activeTeam?.members[activeTeam.shooterIndex] ?? null;

  return (
    <div className="flex flex-col gap-3">
      {/* Board */}
      <div
        ref={boardContainerRef}
        className="w-full rounded-2xl overflow-hidden flex-shrink-0 relative"
        style={{ height: Math.round(CANVAS_H * boardScale), border: '2px solid rgba(34,197,94,0.25)', boxShadow: '0 0 40px rgba(34,197,94,0.08)' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: CANVAS_W, height: CANVAS_H, transform: `scale(${boardScale})`, transformOrigin: 'top left' }}>
          <svg className="absolute inset-0" width={CANVAS_W} height={CANVAS_H} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}>
            <defs>
              <pattern id="boardDots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="0.8" fill="rgba(255,255,255,0.03)" />
              </pattern>
              <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="bumpGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <radialGradient id="roughGrad" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="#0d2a11" />
                <stop offset="100%" stopColor="#071509" />
              </radialGradient>
            </defs>

            {/* ── Background — dark forest green ── */}
            <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="url(#roughGrad)" />
            <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="url(#boardDots)" />

            {/* ── Stone border (outer) ── */}
            {Object.entries(TRACK_SECTIONS).map(([key, pts]) => (
              <polyline key={`stone${key}`}
                points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none" stroke="#4b5563"
                strokeWidth={TRACK_STROKE_WIDTH + 16} strokeLinejoin="round" strokeLinecap="round"
              />
            ))}

            {/* ── Track shadow ── */}
            {Object.entries(TRACK_SECTIONS).map(([key, pts]) => (
              <polyline key={`sh${key}`}
                points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none" stroke="rgba(0,0,0,0.60)"
                strokeWidth={TRACK_STROKE_WIDTH + 6} strokeLinejoin="round" strokeLinecap="round"
              />
            ))}

            {/* ── Coloured segment tiles ── */}
            {COURSE_SEGMENTS.map(([fi, ti]) => {
              const a = BOARD_LAYOUT.squares[fi];
              const b = BOARD_LAYOUT.squares[ti];
              const sq = boardSquares[ti];
              const baseColor = sq.revealed ? SEG_COLOR[sq.type] ?? '#14532d' : '#14532d';
              const poly = segPoly(a, b, SEG_HW);
              if (!poly) return null;
              return (
                <polygon key={`seg${fi}-${ti}`}
                  points={poly}
                  fill={baseColor}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              );
            })}

            {/* ── Tile dividers ── */}
            {COURSE_SEGMENTS.map(([fi, ti]) => {
              const a = BOARD_LAYOUT.squares[fi];
              const b = BOARD_LAYOUT.squares[ti];
              const dx = b.x - a.x, dy = b.y - a.y;
              const len = Math.hypot(dx, dy);
              if (len < 1) return null;
              const nx = (-dy / len) * (SEG_HW + 2), ny = (dx / len) * (SEG_HW + 2);
              return (
                <line key={`div${fi}-${ti}`}
                  x1={b.x + nx} y1={b.y + ny} x2={b.x - nx} y2={b.y - ny}
                  stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" strokeLinecap="round"
                />
              );
            })}

            {/* ── Corner junction patches (hide jagged joins) ── */}
            {[5, 7, 13, 15].map(idx => {
              const s = BOARD_LAYOUT.squares[idx];
              return <circle key={`junc${idx}`} cx={s.x} cy={s.y} r={SEG_HW + 2} fill={SEG_COLOR[boardSquares[idx].type] ?? '#14532d'} />;
            })}

            {/* ── Trees in the rough ── */}
            {TREE_POSITIONS.map(([tx, ty], i) => (
              <g key={`tree${i}`}>
                <rect x={tx - 2} y={ty + 6} width={4} height={7} fill="#713f12" rx={1} />
                <polygon points={`${tx},${ty - 18} ${tx - 10},${ty + 7} ${tx + 10},${ty + 7}`} fill="#15803d" />
                <polygon points={`${tx},${ty - 10} ${tx - 7},${ty + 4} ${tx + 7},${ty + 4}`} fill="#4ade80" opacity="0.35" />
              </g>
            ))}

            {/* ── Sand bunkers ── */}
            <ellipse cx={618} cy={358} rx={50} ry={20} fill="#78350f" opacity="0.65" />
            <ellipse cx={618} cy={358} rx={36} ry={13} fill="#d97706" opacity="0.45" />
            <ellipse cx={242} cy={187} rx={44} ry={18} fill="#78350f" opacity="0.65" />
            <ellipse cx={242} cy={187} rx={31} ry={12} fill="#d97706" opacity="0.45" />

            {/* ── Bumpers (regular red balls — indices 0, 1, 3) ── */}
            {BUMPERS.map((b, i) => {
              if (i === 2) return null; // windmill rendered below
              return (
                <g key={`bump${i}`} filter="url(#bumpGlow)">
                  <circle cx={b.cx} cy={b.cy} r={b.r + 6} fill="#ef4444" opacity="0.18" />
                  <circle cx={b.cx} cy={b.cy} r={b.r} fill="#dc2626" stroke="#f87171" strokeWidth="2.5" />
                  <circle cx={b.cx - b.r * 0.28} cy={b.cy - b.r * 0.28} r={b.r * 0.28} fill="white" opacity="0.22" />
                </g>
              );
            })}

            {/* ── Windmill obstacle (bumper index 2) ── */}
            {(() => {
              const wm = BUMPERS[2];
              return (
                <g>
                  <circle cx={wm.cx} cy={wm.cy} r={wm.r + 10} fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.18" />
                  <g ref={windmillRef}>
                    {[0, 60, 120, 180, 240, 300].map(d => {
                      const rad = d * Math.PI / 180;
                      return (
                        <line key={d}
                          x1={wm.cx} y1={wm.cy}
                          x2={wm.cx + Math.cos(rad) * (wm.r + 6)}
                          y2={wm.cy + Math.sin(rad) * (wm.r + 6)}
                          stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" opacity="0.90"
                        />
                      );
                    })}
                    <circle cx={wm.cx} cy={wm.cy} r={6} fill="#06b6d4" stroke="#a5f3fc" strokeWidth="1.5" />
                  </g>
                  <text x={wm.cx} y={wm.cy + wm.r + 14} textAnchor="middle" fill="#22d3ee" fontSize="8" fontWeight="700" opacity="0.70">WINDMILL</text>
                </g>
              );
            })()}

            {/* ── Square labels ── */}
            {boardSquares.map(sq => {
              const cfg = SQUARE_CONFIG[sq.type];
              const hidden = !sq.revealed;
              const isLanding = landingSquareIndex === sq.index;

              if (sq.type === 'finish') {
                return (
                  <g key={sq.index}>
                    {isLanding && <circle cx={sq.x} cy={sq.y} r={36} fill="#f59e0b" opacity="0.25" filter="url(#glow)" />}
                    <circle cx={sq.x} cy={sq.y} r={20} fill="#064e3b" stroke="#34d399" strokeWidth="2.5" />
                    <line x1={sq.x} y1={sq.y - 20} x2={sq.x} y2={sq.y - 44} stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                    <polygon points={`${sq.x},${sq.y - 44} ${sq.x + 18},${sq.y - 36} ${sq.x},${sq.y - 28}`} fill="#f59e0b" />
                    <text x={sq.x} y={sq.y + 4} textAnchor="middle" fill="#34d399" fontSize="7" fontWeight="900">HOLE</text>
                  </g>
                );
              }

              if (sq.type === 'start') {
                return (
                  <g key={sq.index}>
                    <circle cx={sq.x} cy={sq.y} r={22} fill="#064e3b" stroke="#34d399" strokeWidth="2.5" />
                    <text x={sq.x} y={sq.y + 4} textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="900" letterSpacing="0.5">START</text>
                  </g>
                );
              }

              const labelColor  = isLanding ? '#ffffff' : cfg.color;
              return (
                <g key={sq.index}>
                  {isLanding && (
                    <circle cx={sq.x} cy={sq.y} r={SEG_HW - 4} fill={cfg.color} opacity="0.28" filter="url(#glow)" />
                  )}
                  <text x={sq.x} y={sq.y + 5} textAnchor="middle"
                    fill="#000000" fontSize={sq.type === 'question-boost' ? '9' : '10'} fontWeight="900"
                    stroke="#000000" strokeWidth="3" paintOrder="stroke">
                    {hidden ? '?' : cfg.label}
                  </text>
                  <text x={sq.x} y={sq.y + 5} textAnchor="middle"
                    fill={labelColor} fontSize={sq.type === 'question-boost' ? '9' : '10'} fontWeight="900">
                    {hidden ? '?' : cfg.label}
                  </text>
                  <text x={sq.x} y={sq.y - 14} textAnchor="middle"
                    fill={cfg.color + '88'} fontSize="7" fontWeight="700">
                    {sq.index}
                  </text>
                </g>
              );
            })}

            {/* ── Live aim arc ── */}
            {phase === 'shooting' && liveAim && liveAim.power > 0.05 && activeTeam && (() => {
              const curSq = BOARD_LAYOUT.squares[activeTeam.squareIndex];
              const col = liveAim.power > 0.75 ? '#ef4444' : liveAim.power > 0.4 ? '#f59e0b' : '#3b82f6';
              const arcLen = liveAim.power * 260;
              const ex = curSq.x + Math.cos(liveAim.angleRad) * arcLen;
              const ey = curSq.y + Math.sin(liveAim.angleRad) * arcLen;
              return (
                <g>
                  <line x1={curSq.x} y1={curSq.y} x2={ex} y2={ey}
                    stroke={col} strokeWidth="3" strokeDasharray="9 6"
                    strokeLinecap="round" opacity="0.80" />
                  <circle cx={ex} cy={ey} r={6} fill={col} opacity="0.45" />
                  <circle cx={curSq.x} cy={curSq.y} r={5} fill={col} opacity="0.70" />
                </g>
              );
            })()}
          </svg>

          {/* Team tokens */}
          {teams.map((team, ti) => {
            const sq = boardSquares[team.squareIndex];
            if (!sq) return null;
            const offset = (ti - (teams.length - 1) / 2) * 13;
            const vertOffset = teams.length > 2 && ti >= 2 ? (ti % 2 === 0 ? -16 : 16) : 0;
            const isActiveTi = activeTeamIndex === ti;
            return (
              <div key={team.id}>
                {isActiveTi && (
                  <div className="absolute rounded-full animate-ping pointer-events-none"
                    style={{ width: 44, height: 44, backgroundColor: team.color + '35', left: sq.x - 22 + offset, top: sq.y - 22 + vertOffset, zIndex: 19, transition: 'left 0.5s, top 0.5s' }}
                  />
                )}
                <div className="absolute rounded-full flex items-center justify-center font-black text-white pointer-events-none"
                  style={{
                    width: 34, height: 34, fontSize: 14,
                    backgroundColor: team.color,
                    left: sq.x - 17 + offset, top: sq.y - 17 + vertOffset,
                    zIndex: isActiveTi ? 22 : 16,
                    transition: 'left 0.5s, top 0.5s',
                    border: isActiveTi ? '3px solid #fff' : '2px solid rgba(255,255,255,0.65)',
                    boxShadow: isActiveTi ? `0 0 20px ${team.color}, 0 4px 12px rgba(0,0,0,0.8)` : '0 3px 10px rgba(0,0,0,0.6)',
                  }}
                >
                  {team.name[0]}
                </div>
              </div>
            );
          })}

          {/* Golf ball puck */}
          {puckVisible && (
            <div
              ref={puckDomRef}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: PUCK_R * 2, height: PUCK_R * 2,
                background: puckFellInHole
                  ? '#030712'
                  : 'radial-gradient(circle at 35% 30%, #ffffff, #c8cdd4)',
                border: `1px solid ${puckFellInHole ? 'transparent' : 'rgba(0,0,0,0.30)'}`,
                boxShadow: puckFellInHole ? 'none' : '0 2px 10px rgba(0,0,0,0.70), 0 0 6px rgba(255,255,255,0.40)',
                transition: puckFellInHole ? 'all 0.5s ease-in' : undefined,
                zIndex: 30,
              }}
            />
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-stretch gap-3">
        <div className="flex-1 bg-lc-card rounded-xl border border-lc-border px-4 py-3">
          {phase === 'idle' && (
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex gap-4 flex-wrap">
                {Array.from({ length: numberOfTeams }, (_, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: TEAM_COLORS[i] }} />
                    <span className="text-xs font-bold" style={{ color: TEAM_COLORS[i] }}>{TEAM_NAMES[i]}</span>
                    <span className="text-xs text-lc-text2">auto-assigned</span>
                  </div>
                ))}
              </div>
              <span className="text-xs text-lc-text2 ml-auto">
                {students.length === 0 ? 'Waiting for students…' : `${students.length} student${students.length !== 1 ? 's' : ''} ready`}
              </span>
              <button
                onClick={startGame}
                disabled={students.length === 0}
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm disabled:opacity-40 transition-colors flex-shrink-0"
              >
                Start Game
              </button>
            </div>
          )}

          {phase === 'shooting' && shooter && (
            <div className="flex items-center gap-3">
              <Crosshair size={18} style={{ color: activeTeam?.color }} />
              <span className="text-sm font-black text-white">{shooter.name}</span>
              <span className="text-xs text-lc-text2" style={{ color: activeTeam?.color }}>({activeTeam?.name} Team)</span>
              <span className="text-xs text-lc-text2 ml-2">Waiting for shot on student device…</span>
            </div>
          )}

          {phase === 'animating' && (
            <span className="text-sm font-bold text-white animate-pulse">Ball in motion…</span>
          )}

          {(phase === 'resolving' || (phase === 'scoring' && !currentQuestion)) && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-white flex-1">{resolveMessage || 'Resolving…'}</span>
              {phase === 'scoring' && (
                <button
                  onClick={() => { if (scoringTimerRef.current) clearTimeout(scoringTimerRef.current); advanceTurn(); }}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-bold transition-colors flex-shrink-0"
                >
                  Next Turn →
                </button>
              )}
            </div>
          )}

          {phase === 'answering' && currentQuestion && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-white leading-snug">{currentQuestion.question}</p>
              <div className="flex gap-2 flex-wrap">
                {currentQuestion.options.map((opt, i) => {
                  const voteCount = Array.from(teamVotes.values()).filter(v => v === i).length;
                  return (
                    <div key={i}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs flex-1 min-w-[120px]"
                      style={{ background: ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e'][i] + '22' }}>
                      <span className="font-bold text-white/60 shrink-0">{['A','B','C','D'][i]}</span>
                      <span className="text-white/85 flex-1 truncate">{opt}</span>
                      {voteCount > 0 && <span className="text-white/70 font-bold shrink-0">{voteCount}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {phase === 'scoring' && currentQuestion && (
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{resolveMessage}</p>
                <p className="text-xs text-lc-text2 mt-0.5 truncate">{currentQuestion.explanation}</p>
              </div>
              <button
                onClick={() => { if (scoringTimerRef.current) clearTimeout(scoringTimerRef.current); advanceTurn(); }}
                className="px-4 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-bold transition-colors flex-shrink-0"
              >
                Next Turn →
              </button>
            </div>
          )}

          {phase === 'game_over' && winner && (
            <div className="flex items-center gap-3">
              <Trophy size={24} style={{ color: winner.color }} />
              <p className="text-xl font-black" style={{ color: winner.color }}>{winner.name} Team wins!</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 justify-between shrink-0">
          {phase !== 'idle' && (
            <div className="flex gap-2">
              {teams.map((team, i) => {
                const sq = boardSquares[team.squareIndex];
                const isActive = i === activeTeamIndex && phase !== 'game_over';
                return (
                  <div key={team.id}
                    className="rounded-lg px-3 py-2 border transition-all text-center min-w-[80px]"
                    style={{
                      background: isActive ? team.color + '20' : 'rgba(255,255,255,0.04)',
                      borderColor: isActive ? team.color + '60' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="flex items-center gap-1 justify-center">
                      <span className="text-xs font-black" style={{ color: team.color }}>{team.name}</span>
                      {team.skipNextTurn && <Snowflake size={10} color="#06b6d4" />}
                      {team.finished && <Trophy size={10} color="#f59e0b" />}
                    </div>
                    <p className="text-[10px] text-lc-text2 leading-tight">
                      Sq {team.squareIndex}{sq ? ` · ${sq.type}` : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          {phase !== 'idle' && phase !== 'game_over' && (
            <button
              onClick={endGame}
              className="px-3 py-1.5 rounded-lg border border-lc-border text-lc-text2 hover:text-red-400 hover:border-red-500/50 text-xs transition-colors"
            >
              End Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
