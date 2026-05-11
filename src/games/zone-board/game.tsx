'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameProps, GameRemoteVote } from '../types';
import { BOARD_LAYOUT, CORRIDOR_RECTS, SQUARE_CONFIG } from './board-layout';
import type { TeamState, GamePhase, ActiveQuestion, PuckPhysics, BoardSquare } from './types';
import type { Wall, HoleZone } from './types';
import { getEffectiveTopic } from '@/stores/session-store';
import type { Student } from '@/lib/supabase/types';
import type { LucideIcon } from 'lucide-react';
import {
  Flag, Trophy, HelpCircle, Shield, Zap, Bomb,
  Rocket, Snowflake, CircleOff, Crosshair,
} from 'lucide-react';

// ─── Physics constants ────────────────────────────────────────────────────────

const FRICTION = 0.986;
const WALL_RESTITUTION = 0.62;
const PUCK_R = 13;
const STOP_THRESHOLD = 0.38;
const MAX_SPEED = 13;
const MAX_ANGLE_RAD = (Math.PI / 180) * 55;
const LANDING_THRESHOLD = 72; // px — max distance from square center to register landing

// ─── Square icons ────────────────────────────────────────────────────────────

const SQUARE_ICONS: Record<string, LucideIcon> = {
  start:            Flag,
  finish:           Trophy,
  question:         HelpCircle,
  safe:             Shield,
  boost:            Zap,
  trap:             Bomb,
  'question-boost': Rocket,
  freeze:           Snowflake,
  hole:             CircleOff,
};

// ─── Team config ─────────────────────────────────────────────────────────────

const TEAM_NAMES = ['Red', 'Blue', 'Green', 'Yellow'];
const TEAM_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
const TEAM_BG_CLASSES = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];

// ─── Pure physics helpers ─────────────────────────────────────────────────────

function closestPointOnSegment(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { x: x1, y: y1 };
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return { x: x1 + t * dx, y: y1 + t * dy };
}

function circleHitsWall(cx: number, cy: number, r: number, wall: Wall): boolean {
  const cp = closestPointOnSegment(cx, cy, wall.x1, wall.y1, wall.x2, wall.y2);
  return Math.hypot(cx - cp.x, cy - cp.y) <= r;
}

function wallNormal(wall: Wall) {
  const dx = wall.x2 - wall.x1;
  const dy = wall.y2 - wall.y1;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { nx: 0, ny: 1 };
  return { nx: -dy / len, ny: dx / len };
}

function stepPhysics(state: PuckPhysics, walls: Wall[], holes: HoleZone[]): PuckPhysics {
  let { x, y, vx, vy } = state;

  for (const hole of holes) {
    if (Math.hypot(x - hole.x, y - hole.y) < hole.radius) {
      return { x, y, vx: 0, vy: 0, active: false, fellInHole: true };
    }
  }

  vx *= FRICTION;
  vy *= FRICTION;
  x += vx;
  y += vy;

  for (const wall of walls) {
    if (circleHitsWall(x, y, PUCK_R, wall)) {
      const { nx, ny } = wallNormal(wall);
      const dot = vx * nx + vy * ny;
      if (dot < 0) {
        vx = (vx - 2 * dot * nx) * WALL_RESTITUTION;
        vy = (vy - 2 * dot * ny) * WALL_RESTITUTION;
      }
      const cp = closestPointOnSegment(x, y, wall.x1, wall.y1, wall.x2, wall.y2);
      const dist = Math.hypot(x - cp.x, y - cp.y);
      if (dist < PUCK_R && dist > 0.001) {
        const push = (PUCK_R - dist) + 0.5;
        x += ((x - cp.x) / dist) * push;
        y += ((y - cp.y) / dist) * push;
      }
    }
  }

  if (Math.hypot(vx, vy) < STOP_THRESHOLD) {
    return { x, y, vx: 0, vy: 0, active: false, fellInHole: false };
  }
  return { x, y, vx, vy, active: true, fellInHole: false };
}

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

  const phaseRef = useRef<GamePhase>('idle');
  const teamsRef = useRef<TeamState[]>([]);
  const activeTeamIndexRef = useRef(0);
  const puckDomRef = useRef<HTMLDivElement>(null);
  const puckStateRef = useRef<PuckPhysics>({ x: 0, y: 0, vx: 0, vy: 0, active: false, fellInHole: false });
  const rafRef = useRef<number>(0);
  const currentQuestionRef = useRef<ActiveQuestion | null>(null);
  const teamVotesRef = useRef<Map<string, number>>(new Map());
  const pendingQuestionRef = useRef<Promise<ActiveQuestion | null> | null>(null);
  const excludeCacheIdsRef = useRef<string[]>([]);
  const voteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function transitionTo(newPhase: GamePhase) {
    phaseRef.current = newPhase;
    setPhase(newPhase);
  }

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
    const isCorrect = majorityChoice === question.correctIndex;

    resolveQuestion(isCorrect);
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
        newIndex = Math.min(24, activeTeam.squareIndex + 4);
        message = `Correct! Jump forward 4 squares!`;
      } else {
        message = `Correct! Stay put.`;
      }
    } else {
      newIndex = Math.max(0, activeTeam.squareIndex - 3);
      message = `Wrong! Slide back 3 squares.`;
    }

    // Call onScore for all team members (participation tracking)
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

    // Check win
    if (newIndex >= 24) {
      setWinner(newTeams[teamIdx]);
      transitionTo('game_over');
      return;
    }

    scoringTimerRef.current = setTimeout(() => {
      if (phaseRef.current === 'scoring') advanceTurn();
    }, 3200);
  }

  // ─── Square resolution ──────────────────────────────────────────────────────

  async function resolveSquare(squareIndex: number) {
    const sq = BOARD_LAYOUT.squares[squareIndex];
    const teamIdx = activeTeamIndexRef.current;
    const teams = teamsRef.current;

    // Reveal hidden squares (boost/trap)
    if (!sq.revealed) {
      setBoardSquares(prev => prev.map(s => s.index === squareIndex ? { ...s, revealed: true } : s));
    }

    // Move team token to landing square
    const teamsWithToken = teams.map((t, i) =>
      i === teamIdx ? { ...t, squareIndex } : t
    );
    teamsRef.current = teamsWithToken;
    setTeams(teamsWithToken);

    // Check finish immediately
    if (sq.type === 'finish' || squareIndex >= 24) {
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
        const newIndex = Math.min(24, squareIndex + 4);
        setResolveMessage('Boost! Jump forward 4 squares!');
        const boostedTeams = teamsWithToken.map((t, i) =>
          i === teamIdx ? { ...t, squareIndex: newIndex } : t
        );
        teamsRef.current = boostedTeams;
        setTeams(boostedTeams);
        transitionTo('scoring');
        if (newIndex >= 24) { setWinner(boostedTeams[teamIdx]); transitionTo('game_over'); return; }
        scoringTimerRef.current = setTimeout(() => {
          if (phaseRef.current === 'scoring') advanceTurn();
        }, 2800);
        break;
      }

      case 'trap': {
        const newIndex = Math.max(0, squareIndex - 4);
        setResolveMessage('Trap! Slide back 4 squares!');
        const trappedTeams = teamsWithToken.map((t, i) =>
          i === teamIdx ? { ...t, squareIndex: newIndex } : t
        );
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
        const frozenTeams = teamsWithToken.map((t, i) =>
          i === teamIdx ? { ...t, skipNextTurn: true } : t
        );
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

        // Prefetch next question
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

    // Find nearest square that is forward (>= current position)
    const teamSquareIndex = teamsRef.current[activeTeamIndexRef.current].squareIndex;
    let bestIndex = -1;
    let bestDist = Infinity;
    for (const sq of BOARD_LAYOUT.squares) {
      if (sq.index < teamSquareIndex) continue;
      const dist = Math.hypot(x - sq.x, y - sq.y);
      if (dist < bestDist) { bestDist = dist; bestIndex = sq.index; }
    }

    if (bestIndex === -1 || bestDist > LANDING_THRESHOLD) {
      // Out of bounds — minor setback
      const teamIdx = activeTeamIndexRef.current;
      const teams = teamsRef.current;
      const newIndex = Math.max(0, teams[teamIdx].squareIndex - 2);
      const newTeams = teams.map((t, i) => i === teamIdx ? { ...t, squareIndex: newIndex } : t);
      teamsRef.current = newTeams;
      setTeams(newTeams);
      setPuckVisible(false);
      setResolveMessage('Out of bounds! Back 2 squares.');
      transitionTo('scoring');
      scoringTimerRef.current = setTimeout(() => {
        if (phaseRef.current === 'scoring') advanceTurn();
      }, 2800);
      return;
    }

    setLandingSquareIndex(bestIndex);
    // Prefetch question if the landing square is a question type
    const sq = BOARD_LAYOUT.squares[bestIndex];
    if (sq.type === 'question' || sq.type === 'question-boost') {
      prefetchQuestion();
    }

    resolveSquare(bestIndex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Physics loop ───────────────────────────────────────────────────────────

  const startPhysicsLoop = useCallback(() => {
    function step() {
      const state = puckStateRef.current;
      if (!state.active) return;

      const next = stepPhysics(state, BOARD_LAYOUT.walls, BOARD_LAYOUT.holes);
      puckStateRef.current = next;

      if (puckDomRef.current) {
        puckDomRef.current.style.transform = `translate(${next.x - PUCK_R}px, ${next.y - PUCK_R}px)`;
      }

      if (!next.active) {
        onPuckStopped(next.x, next.y, next.fellInHole);
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
  }, [onPuckStopped]);

  // ─── Handle shot ────────────────────────────────────────────────────────────

  function handleShot(power: number, angle: number) {
    const teamIdx = activeTeamIndexRef.current;
    const team = teamsRef.current[teamIdx];
    const curSq = BOARD_LAYOUT.squares[team.squareIndex];
    const nextSq = BOARD_LAYOUT.squares[Math.min(24, team.squareIndex + 1)];

    const forwardAngle = Math.atan2(nextSq.y - curSq.y, nextSq.x - curSq.x);
    const shotAngle = forwardAngle + angle * MAX_ANGLE_RAD;
    const speed = power * MAX_SPEED;

    puckStateRef.current = {
      x: curSq.x,
      y: curSq.y,
      vx: Math.cos(shotAngle) * speed,
      vy: Math.sin(shotAngle) * speed,
      active: true,
      fellInHole: false,
    };

    if (puckDomRef.current) {
      puckDomRef.current.style.transform = `translate(${curSq.x - PUCK_R}px, ${curSq.y - PUCK_R}px)`;
    }
    setPuckVisible(true);
    setLandingSquareIndex(null);
    transitionTo('animating');
    startPhysicsLoop();
  }

  // ─── Turn management ────────────────────────────────────────────────────────

  function advanceTurn() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (scoringTimerRef.current) clearTimeout(scoringTimerRef.current);
    if (voteTimerRef.current) clearTimeout(voteTimerRef.current);

    const teams = teamsRef.current;

    // Check if all finished
    if (teams.every(t => t.finished)) {
      transitionTo('game_over');
      return;
    }

    // Advance to next non-finished team
    let nextIdx = (activeTeamIndexRef.current + 1) % teams.length;
    let tries = 0;
    while (tries < teams.length) {
      const t = teams[nextIdx];
      if (t.finished) {
        nextIdx = (nextIdx + 1) % teams.length;
        tries++;
        continue;
      }
      if (t.skipNextTurn) {
        const updatedTeams = teams.map((t2, i) => i === nextIdx ? { ...t2, skipNextTurn: false } : t2);
        teamsRef.current = updatedTeams;
        setTeams(updatedTeams);
        nextIdx = (nextIdx + 1) % teams.length;
        tries++;
        continue;
      }
      break;
    }

    // Rotate shooter within previous team
    const prevIdx = activeTeamIndexRef.current;
    const prevTeam = teams[prevIdx];
    const newShooterIndex = (prevTeam.shooterIndex + 1) % Math.max(1, prevTeam.members.length);
    const rotatedTeams = teamsRef.current.map((t, i) =>
      i === prevIdx ? { ...t, shooterIndex: newShooterIndex } : t
    );
    teamsRef.current = rotatedTeams;
    setTeams(rotatedTeams);

    activeTeamIndexRef.current = nextIdx;
    setActiveTeamIndex(nextIdx);
    setResolveMessage('');
    setLandingSquareIndex(null);
    setPuckVisible(false);
    onSetInputSpec?.(null);

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
          const { power, angle } = JSON.parse(vote.choice) as { power: number; angle: number };
          handleShot(power, angle);
        } catch { /* ignore malformed */ }
        return;
      }

      if (phase === 'answering') {
        const choiceIndex = parseInt(vote.choice, 10);
        if (isNaN(choiceIndex)) return;
        teamVotesRef.current = new Map(teamVotesRef.current).set(vote.displayName, choiceIndex);
        setTeamVotes(new Map(teamVotesRef.current));

        // Check if all active team members have voted
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

  // ─── Render ──────────────────────────────────────────────────────────────────

  const activeTeam = teams[activeTeamIndex] ?? null;
  const shooter = activeTeam?.members[activeTeam.shooterIndex] ?? null;

  return (
    <div className="flex gap-4">
      {/* Board — scaled to 85% (680×476) so side panel stays visible */}
      <div
        className="rounded-2xl overflow-hidden flex-shrink-0 relative"
        style={{ width: 680, height: 476, border: '2px solid rgba(34,197,94,0.25)', boxShadow: '0 0 40px rgba(34,197,94,0.08)' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: 800, height: 560, transform: 'scale(0.85)', transformOrigin: 'top left' }}>
          {/* SVG track */}
          <svg className="absolute inset-0" width={800} height={560} viewBox="0 0 800 560">
            {/* Board background */}
            <rect x="0" y="0" width="800" height="560" fill="#020b04" />
            {/* Subtle grid texture on background */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(34,197,94,0.04)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="800" height="560" fill="url(#grid)" />

            {/* Course surface — bright green felt */}
            {CORRIDOR_RECTS.map((r, i) => (
              <rect key={`cf${i}`} x={r.x} y={r.y} width={r.w} height={r.h} fill="#14532d" rx="8" />
            ))}
            {/* Corridor inner highlight */}
            {CORRIDOR_RECTS.map((r, i) => (
              <rect key={`ch${i}`} x={r.x + 4} y={r.y + 4} width={r.w - 8} height={r.h - 8}
                fill="none" stroke="#22c55e" strokeWidth="1" rx="5" opacity="0.25" />
            ))}

            {/* Path connector */}
            <polyline
              points={BOARD_LAYOUT.squares.map(s => `${s.x},${s.y}`).join(' ')}
              fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="2.5"
              strokeDasharray="8 9" strokeLinejoin="round" strokeLinecap="round"
            />

            {/* Wall outer glow */}
            {BOARD_LAYOUT.walls.map((w, i) => (
              <line key={`wg${i}`} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                stroke="#4ade80" strokeWidth="14" strokeLinecap="round" opacity="0.08" />
            ))}
            {/* Wall solid */}
            {BOARD_LAYOUT.walls.map((w, i) => (
              <line key={`ws${i}`} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                stroke="#4ade80" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
            ))}

            {/* Hole danger zones */}
            {BOARD_LAYOUT.holes.map((h, i) => (
              <g key={`hz${i}`}>
                <circle cx={h.x} cy={h.y} r={h.radius + 16} fill="rgba(239,68,68,0.08)" />
                <circle cx={h.x} cy={h.y} r={h.radius + 8} fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.3" strokeDasharray="4 4" />
                <circle cx={h.x} cy={h.y} r={h.radius} fill="#050505" stroke="#ef4444" strokeWidth="2.5" opacity="0.95" />
                <text x={h.x} y={h.y + 4} textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="900" opacity="0.8">HOLE</text>
              </g>
            ))}
          </svg>

          {/* Square tiles */}
          {boardSquares.map(sq => {
            const cfg = SQUARE_CONFIG[sq.type];
            const hidden = !sq.revealed;
            const isLanding = landingSquareIndex === sq.index;
            const isSpecial = sq.type === 'start' || sq.type === 'finish';
            return (
              <div
                key={sq.index}
                className="absolute rounded-xl transition-all duration-300"
                style={{
                  left: sq.x - 30,
                  top: sq.y - 30,
                  width: 60,
                  height: 60,
                  background: hidden
                    ? 'rgba(15,23,42,0.97)'
                    : isLanding
                    ? cfg.color + 'ee'
                    : isSpecial
                    ? cfg.color + 'cc'
                    : cfg.color + '99',
                  border: isLanding
                    ? '2.5px solid #fff'
                    : hidden
                    ? '2px solid #334155'
                    : `2px solid ${cfg.color}`,
                  boxShadow: isLanding
                    ? `0 0 30px ${cfg.color}, 0 0 12px ${cfg.color}cc`
                    : isSpecial
                    ? `0 0 14px ${cfg.color}aa`
                    : '0 2px 10px rgba(0,0,0,0.7)',
                  transform: isLanding ? 'scale(1.35)' : 'scale(1)',
                  zIndex: isLanding ? 10 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="absolute top-0.5 left-1.5 text-[8px] font-bold leading-none"
                  style={{ color: hidden ? '#475569' : 'rgba(255,255,255,0.5)' }}>
                  {sq.index}
                </span>
                {(() => {
                  const Icon = hidden ? HelpCircle : (SQUARE_ICONS[sq.type] ?? HelpCircle);
                  return <Icon size={22} color="rgba(255,255,255,0.95)" strokeWidth={2} />;
                })()}
                <span className="text-[9px] font-black leading-none mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.92)', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                  {hidden ? '???' : cfg.label}
                </span>
              </div>
            );
          })}

          {/* Team tokens */}
          {teams.map((team, ti) => {
            const sq = boardSquares[team.squareIndex];
            if (!sq) return null;
            const offset = (ti - (teams.length - 1) / 2) * 13;
            const rowOffset = ti % 2 === 0 ? -16 : 16;
            const vertOffset = teams.length > 2 && ti >= 2 ? -rowOffset : 0;
            const isActiveTi = activeTeamIndex === ti;
            return (
              <div key={team.id}>
                {isActiveTi && (
                  <div
                    className="absolute rounded-full animate-ping pointer-events-none"
                    style={{
                      width: 44, height: 44,
                      backgroundColor: team.color + '35',
                      left: sq.x - 22 + offset,
                      top: sq.y - 22 + vertOffset,
                      zIndex: 19,
                      transition: 'left 0.5s ease-in-out, top 0.5s ease-in-out',
                    }}
                  />
                )}
                <div
                  className="absolute rounded-full flex items-center justify-center font-black text-white pointer-events-none"
                  style={{
                    width: 34, height: 34,
                    fontSize: 14,
                    backgroundColor: team.color,
                    left: sq.x - 17 + offset,
                    top: sq.y - 17 + vertOffset,
                    zIndex: isActiveTi ? 22 : 16,
                    transition: 'left 0.5s ease-in-out, top 0.5s ease-in-out',
                    border: isActiveTi ? '3px solid #fff' : '2px solid rgba(255,255,255,0.65)',
                    boxShadow: isActiveTi
                      ? `0 0 20px ${team.color}, 0 0 8px ${team.color}, 0 4px 12px rgba(0,0,0,0.8)`
                      : '0 3px 10px rgba(0,0,0,0.6)',
                  }}
                >
                  {team.name[0]}
                </div>
              </div>
            );
          })}

          {/* Puck */}
          {puckVisible && (
            <div
              ref={puckDomRef}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: PUCK_R * 2,
                height: PUCK_R * 2,
                background: puckFellInHole
                  ? '#030712'
                  : 'radial-gradient(circle at 35% 35%, #e0f2fe, #0284c7)',
                border: '2px solid #bae6fd',
                boxShadow: puckFellInHole ? 'none' : '0 0 16px #38bdf880',
                transition: puckFellInHole ? 'all 0.5s ease-in' : undefined,
                transform: 'scale(0)',
                zIndex: 30,
              }}
            />
          )}
        </div>{/* end scale wrapper */}
      </div>{/* end board */}

      {/* Side panel — phase controls + team list */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">

        {/* Phase info card */}
        <div className="bg-lc-card rounded-xl border border-lc-border p-4 flex-1">
          {phase === 'idle' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-lc-text2 uppercase tracking-wider">Teams</p>
              {Array.from({ length: numberOfTeams }, (_, i) => {
                const shuffled = [...students].sort(() => 0.5 - Math.random());
                const teamMembers = shuffled.filter((_, j) => j % numberOfTeams === i);
                return (
                  <div key={i} className="space-y-0.5">
                    <p className="text-sm font-bold" style={{ color: TEAM_COLORS[i] }}>{TEAM_NAMES[i]} Team</p>
                    <p className="text-xs text-lc-text2">
                      {teamMembers.length > 0 ? teamMembers.map(s => s.name).join(', ') : 'Auto-assigned on start'}
                    </p>
                  </div>
                );
              })}
              <p className="text-xs text-lc-text2 pt-1 border-t border-lc-border">
                {students.length === 0 ? 'Waiting for students to join…' : `${students.length} student${students.length !== 1 ? 's' : ''} ready`}
              </p>
            </div>
          )}

          {phase === 'shooting' && shooter && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crosshair size={16} style={{ color: activeTeam?.color }} />
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: activeTeam?.color }}>
                  {activeTeam?.name} Team
                </p>
              </div>
              <p className="text-base font-black text-white">{shooter.name}</p>
              <p className="text-xs text-lc-text2">Waiting for shot on student device…</p>
            </div>
          )}

          {phase === 'animating' && (
            <p className="text-base font-bold text-white animate-pulse">Puck in motion…</p>
          )}

          {(phase === 'resolving' || (phase === 'scoring' && !currentQuestion)) && (
            <div className="space-y-3">
              <p className="text-base font-bold text-white">{resolveMessage || 'Resolving…'}</p>
              {phase === 'scoring' && (
                <button
                  onClick={() => { if (scoringTimerRef.current) clearTimeout(scoringTimerRef.current); advanceTurn(); }}
                  className="w-full px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-bold transition-colors"
                >
                  Next Turn →
                </button>
              )}
            </div>
          )}

          {phase === 'answering' && currentQuestion && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white leading-snug">{currentQuestion.question}</p>
              <div className="space-y-1.5">
                {currentQuestion.options.map((opt, i) => {
                  const voteCount = Array.from(teamVotes.values()).filter(v => v === i).length;
                  return (
                    <div key={i}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs"
                      style={{ background: ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e'][i] + '22' }}>
                      <span className="font-bold text-white/60 w-4 shrink-0">{['A','B','C','D'][i]}</span>
                      <span className="flex-1 text-white/90">{opt}</span>
                      {voteCount > 0 && <span className="text-white/60 font-bold">{voteCount}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {phase === 'scoring' && currentQuestion && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-white">{resolveMessage}</p>
              <p className="text-xs text-lc-text2">{currentQuestion.explanation}</p>
              <button
                onClick={() => { if (scoringTimerRef.current) clearTimeout(scoringTimerRef.current); advanceTurn(); }}
                className="w-full px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-bold transition-colors"
              >
                Next Turn →
              </button>
            </div>
          )}

          {phase === 'game_over' && winner && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Trophy size={36} style={{ color: winner.color }} />
              <p className="text-2xl font-black" style={{ color: winner.color }}>{winner.name} Team wins!</p>
            </div>
          )}
        </div>

        {/* Team list (during game) */}
        {phase !== 'idle' && (
          <div className="bg-lc-card rounded-xl border border-lc-border p-3 space-y-2">
            {teams.map((team, i) => {
              const sq = boardSquares[team.squareIndex];
              const isActive = i === activeTeamIndex && phase !== 'game_over';
              return (
                <div
                  key={team.id}
                  className={`rounded-lg px-3 py-2 border transition-all ${isActive ? 'border-white/30' : 'border-lc-border'}`}
                  style={{ background: isActive ? team.color + '18' : undefined }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm flex items-center gap-1" style={{ color: team.color }}>
                      {team.name}
                      {team.skipNextTurn && <Snowflake size={11} color="#06b6d4" />}
                      {team.finished && <Trophy size={11} color="#f59e0b" />}
                    </span>
                    <span className="text-xs text-lc-text2">Sq {team.squareIndex}{sq ? ` · ${sq.type}` : ''}</span>
                  </div>
                  <p className="text-xs text-lc-text2 truncate mt-0.5">
                    {team.members.map((m, j) => (
                      <span key={m.id} className={j === team.shooterIndex && isActive ? 'font-bold text-white' : ''}>
                        {j > 0 ? ', ' : ''}{j === team.shooterIndex && isActive ? '▶ ' : ''}{m.name}
                      </span>
                    ))}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Action button */}
        {phase === 'idle' && (
          <button
            onClick={startGame}
            disabled={students.length === 0}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-lg disabled:opacity-40 transition-colors"
          >
            Start Game
          </button>
        )}
        {phase !== 'idle' && phase !== 'game_over' && (
          <button
            onClick={endGame}
            className="w-full py-2 rounded-xl border border-lc-border text-lc-text2 hover:text-red-400 hover:border-red-500/50 text-sm transition-colors"
          >
            End Game
          </button>
        )}
      </div>
    </div>
  );
}
