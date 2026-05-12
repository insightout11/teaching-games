'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameProps, GameRemoteVote } from '../types';
import { BOARD_LAYOUT, CANVAS_W, CANVAS_H, TRACK_SECTIONS, TRACK_STROKE_WIDTH, SQUARE_CONFIG } from './board-layout';
import type { TeamState, GamePhase, ActiveQuestion, BoardSquare } from './types';
import { getEffectiveTopic, useSessionStore } from '@/stores/session-store';
import { createClient } from '@/lib/supabase/client';
import type { Student } from '@/lib/supabase/types';
import { Trophy, Crosshair, Snowflake } from 'lucide-react';

// ─── Movement constants ───────────────────────────────────────────────────────

const PUCK_R = 13;
const LANDING_THRESHOLD = 100;
const MS_PER_STEP = 160; // ms to animate between consecutive squares

// Full ordered paths through the board (upper branch takes sq4-7, lower takes sq8-11)
const UPPER_PATH = [0,1,2,3,4,5,6,7,12,13,14,15,16,17,18,19,20,21,22,23,24];
const LOWER_PATH = [0,1,2,3,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];

function getPath(squareIndex: number, branchChoice?: 'upper' | 'lower'): number[] {
  if (squareIndex >= 4 && squareIndex <= 7) return UPPER_PATH;
  if (squareIndex >= 8 && squareIndex <= 11) return LOWER_PATH;
  if (squareIndex === 3 && branchChoice === 'lower') return LOWER_PATH;
  return UPPER_PATH;
}

// ─── Team config ─────────────────────────────────────────────────────────────

const TEAM_NAMES = ['Red', 'Blue', 'Green', 'Yellow'];
const TEAM_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
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
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const sessionId = useSessionStore(state => state.sessionId);
  const [liveAim, setLiveAim] = useState<{ power: number; angleRad: number } | null>(null);

  const phaseRef = useRef<GamePhase>('idle');
  const teamsRef = useRef<TeamState[]>([]);
  const activeTeamIndexRef = useRef(0);
  const puckDomRef = useRef<HTMLDivElement>(null);
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

  // ─── Path animation ──────────────────────────────────────────────────────────

  const animatePuckAlongPath = useCallback((
    waypoints: Array<{ x: number; y: number }>,
    onComplete: () => void,
  ) => {
    let done = false;
    function finish() {
      if (done) return;
      done = true;
      clearTimeout(safetyTimer);
      onComplete();
    }

    if (waypoints.length === 0) { finish(); return; }

    const totalTime = Math.max(300, (waypoints.length - 1) * MS_PER_STEP);

    // Safety valve: if RAF never completes (e.g. tab hidden, cancelled frame), force resolution
    const safetyTimer = setTimeout(finish, totalTime + 600);

    if (waypoints.length === 1) {
      if (puckDomRef.current) {
        const p = waypoints[0];
        puckDomRef.current.style.transform = `translate(${p.x - PUCK_R}px, ${p.y - PUCK_R}px)`;
      }
      setTimeout(finish, 300);
      return;
    }

    const startTime = performance.now();

    function frame(now: number) {
      const t = Math.min(1, (now - startTime) / totalTime);
      const segT = t * (waypoints.length - 1);
      const segIdx = Math.min(Math.floor(segT), waypoints.length - 2);
      const localT = segT - segIdx;
      const a = waypoints[segIdx];
      const b = waypoints[segIdx + 1];
      const px = a.x + (b.x - a.x) * localT;
      const py = a.y + (b.y - a.y) * localT;

      if (puckDomRef.current) {
        puckDomRef.current.style.transform = `translate(${px - PUCK_R}px, ${py - PUCK_R}px)`;
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        finish();
      }
    }

    rafRef.current = requestAnimationFrame(frame);
  }, []);

  // ─── Handle shot ────────────────────────────────────────────────────────────

  function handleShot(power: number, angleRad: number) {
    const teamIdx = activeTeamIndexRef.current;
    const team = teamsRef.current[teamIdx];
    const curIdx = team.squareIndex;

    // At the fork (sq3) the angle's y-component picks the branch
    const branchChoice: 'upper' | 'lower' | undefined =
      curIdx === 3 ? (Math.sin(angleRad) < 0 ? 'upper' : 'lower') : undefined;

    const path = getPath(curIdx, branchChoice);
    const posInPath = path.indexOf(curIdx);

    // Power maps to 1-5 squares forward
    const squaresForward = Math.max(1, Math.round(power * 5));
    const newPosInPath = Math.min(path.length - 1, posInPath + squaresForward);
    const targetIdx = path[newPosInPath];

    const waypoints = path
      .slice(posInPath, newPosInPath + 1)
      .map(idx => BOARD_LAYOUT.squares[idx]);

    const startSq = BOARD_LAYOUT.squares[curIdx];
    if (puckDomRef.current) {
      puckDomRef.current.style.transform = `translate(${startSq.x - PUCK_R}px, ${startSq.y - PUCK_R}px)`;
    }
    setPuckVisible(true);
    setLandingSquareIndex(null);
    transitionTo('animating');

    animatePuckAlongPath(waypoints, () => {
      const sq = BOARD_LAYOUT.squares[targetIdx];
      onPuckStopped(sq.x, sq.y, false);
    });
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
  const shooter = activeTeam?.members[activeTeam.shooterIndex] ?? null;

  return (
    <div className="flex flex-col gap-3">
      {/* Board — fills available width, scales height proportionally */}
      <div
        ref={boardContainerRef}
        className="w-full rounded-2xl overflow-hidden flex-shrink-0 relative"
        style={{ height: Math.round(CANVAS_H * boardScale), border: '2px solid rgba(34,197,94,0.25)', boxShadow: '0 0 40px rgba(34,197,94,0.08)' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: CANVAS_W, height: CANVAS_H, transform: `scale(${boardScale})`, transformOrigin: 'top left' }}>
          {/* SVG track */}
          <svg className="absolute inset-0" width={CANVAS_W} height={CANVAS_H} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}>
            {/* Board background */}
            <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="#020b04" />
            {/* Subtle grid texture on background */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(34,197,94,0.04)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="url(#grid)" />

            {/* Course sections — separate polylines create visible Y-fork */}
            {Object.entries(TRACK_SECTIONS).map(([key, pts]) => (
              <polyline key={`c${key}`}
                points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none" stroke="#14532d"
                strokeWidth={TRACK_STROKE_WIDTH} strokeLinejoin="round" strokeLinecap="round"
              />
            ))}
            {/* Turf highlight */}
            {Object.entries(TRACK_SECTIONS).map(([key, pts]) => (
              <polyline key={`h${key}`}
                points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none" stroke="#4ade80"
                strokeWidth={TRACK_STROKE_WIDTH - 16} strokeLinejoin="round" strokeLinecap="round"
                opacity="0.09"
              />
            ))}


            {/* Water hazard between the two branches */}
            <ellipse cx={560} cy={253} rx={138} ry={54} fill="#0c4a6e" opacity="0.90" />
            <ellipse cx={560} cy={253} rx={118} ry={38} fill="#0ea5e9" opacity="0.30" />
            <ellipse cx={560} cy={253} rx={95}  ry={24} fill="#38bdf8" opacity="0.10" />
            <text x={560} y={257} textAnchor="middle" fill="#7dd3fc" fontSize="10" fontWeight="600" opacity="0.65" letterSpacing="2">WATER HAZARD</text>

            {/* Sand bunkers at corners */}
            <ellipse cx={175} cy={415} rx={58} ry={26} fill="#78350f" opacity="0.70" />
            <ellipse cx={175} cy={415} rx={42} ry={18} fill="#d97706" opacity="0.50" />
            <ellipse cx={845} cy={415} rx={58} ry={26} fill="#78350f" opacity="0.70" />
            <ellipse cx={845} cy={415} rx={42} ry={18} fill="#d97706" opacity="0.50" />


            {/* Square markers — small circles embedded in the course */}
            {boardSquares.map(sq => {
              const cfg = SQUARE_CONFIG[sq.type];
              const hidden = !sq.revealed;
              const isLanding = landingSquareIndex === sq.index;
              const color = hidden ? '#334155' : cfg.color;
              const r = sq.type === 'start' ? 20 : (isLanding ? 18 : 16);

              if (sq.type === 'finish') {
                return (
                  <g key={sq.index}>
                    {isLanding && <circle cx={sq.x} cy={sq.y} r={32} fill="#f59e0b" opacity="0.20" />}
                    <line x1={sq.x} y1={sq.y - 24} x2={sq.x} y2={sq.y + 12}
                      stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                    <polygon points={`${sq.x},${sq.y - 24} ${sq.x + 17},${sq.y - 16} ${sq.x},${sq.y - 8}`}
                      fill="#fbbf24" />
                    <circle cx={sq.x} cy={sq.y + 12} r={5} fill="#fbbf24" opacity="0.55" />
                  </g>
                );
              }

              return (
                <g key={sq.index}>
                  {isLanding && (
                    <circle cx={sq.x} cy={sq.y} r={30} fill={color} opacity="0.22" />
                  )}
                  <circle
                    cx={sq.x} cy={sq.y} r={r}
                    fill={color + (isLanding ? 'ff' : 'cc')}
                    stroke={isLanding ? '#fff' : color}
                    strokeWidth={isLanding ? 2.5 : 1.5}
                  />
                  <text x={sq.x} y={sq.y - 22} textAnchor="middle"
                    fill="rgba(255,255,255,0.30)" fontSize="8" fontWeight="700">
                    {sq.index}
                  </text>
                  <text x={sq.x} y={sq.y + 4} textAnchor="middle"
                    fill="white" fontSize={sq.type === 'question-boost' ? '7' : '8'} fontWeight="800">
                    {hidden ? '?' : cfg.label}
                  </text>
                </g>
              );
            })}

            {/* Live aim arc — streamed from student device via broadcast channel */}
            {phase === 'shooting' && liveAim && liveAim.power > 0.05 && activeTeam && (() => {
              const curSq = BOARD_LAYOUT.squares[activeTeam.squareIndex];
              const col = liveAim.power > 0.75 ? '#ef4444' : liveAim.power > 0.4 ? '#f59e0b' : '#3b82f6';
              let ex: number, ey: number, branchLabel: string | null = null;

              if (activeTeam.squareIndex === 3) {
                // At fork: snap arc to chosen branch direction
                const choice = Math.sin(liveAim.angleRad) < 0 ? 'upper' : 'lower';
                branchLabel = choice === 'upper' ? 'UPPER' : 'LOWER';
                const nextSq = BOARD_LAYOUT.squares[choice === 'upper' ? 4 : 8];
                const dx = nextSq.x - curSq.x, dy = nextSq.y - curSq.y;
                const dl = Math.hypot(dx, dy);
                const arcLen = liveAim.power * 260;
                ex = curSq.x + (dx / dl) * Math.min(arcLen, dl * 1.4);
                ey = curSq.y + (dy / dl) * Math.min(arcLen, dl * 1.4);
              } else {
                const arcLen = liveAim.power * 260;
                ex = curSq.x + Math.cos(liveAim.angleRad) * arcLen;
                ey = curSq.y + Math.sin(liveAim.angleRad) * arcLen;
              }

              return (
                <g>
                  <line x1={curSq.x} y1={curSq.y} x2={ex} y2={ey}
                    stroke={col} strokeWidth="3.5" strokeDasharray="10 7"
                    strokeLinecap="round" opacity="0.80" />
                  <circle cx={ex} cy={ey} r={7} fill={col} opacity="0.50" />
                  <circle cx={curSq.x} cy={curSq.y} r={5} fill={col} opacity="0.70" />
                  {branchLabel && (
                    <text x={ex + 12} y={ey + 4} fill={col} fontSize="11" fontWeight="800" opacity="0.90">
                      {branchLabel}
                    </text>
                  )}
                </g>
              );
            })()}
          </svg>

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
                zIndex: 30,
              }}
            />
          )}
        </div>{/* end scale wrapper */}
      </div>{/* end board */}

      {/* Bottom bar — phase info (left) + team chips (right) */}
      <div className="flex items-stretch gap-3">

        {/* Phase info card */}
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
            <span className="text-sm font-bold text-white animate-pulse">Puck in motion…</span>
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

        {/* Team chips + End Game button */}
        <div className="flex flex-col gap-2 justify-between shrink-0">
          {phase !== 'idle' && (
            <div className="flex gap-2">
              {teams.map((team, i) => {
                const sq = boardSquares[team.squareIndex];
                const isActive = i === activeTeamIndex && phase !== 'game_over';
                return (
                  <div
                    key={team.id}
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
