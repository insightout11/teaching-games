'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps, GameRemoteVote } from '../types';
import { GameStatus } from './types';
import type { ExtendedChainLink, ValidationResult, BonusChallenge } from './types';

type TeamId = 'A' | 'B';

interface TeamState {
  name: string;
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  score: number;
  members: { id: string; name: string }[];
  currentMemberIndex: number;
}

export function WordChainGame({ currentStudentId, students, onScore, onPickStudent, sessionSettings, onSetInputSpec, onRegisterSubmissionHandler, onRegisterRemoteVoteHandler }: GameProps) {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [startingWord, setStartingWord] = useState('');
  const [hint, setHint] = useState('');
  const [chain, setChain] = useState<ExtendedChainLink[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bonus challenge state
  const [activeBonus, setActiveBonus] = useState<BonusChallenge | null>(null);
  const [bonusToast, setBonusToast] = useState(false);
  const activeBonusRef = useRef<BonusChallenge | null>(null);
  activeBonusRef.current = activeBonus;
  const bonusIndexRef = useRef(0);

  // Team mode
  const isTeamMode = students.length >= 3;
  const [teams, setTeams] = useState<Record<TeamId, TeamState>>({
    A: { name: 'Team Alpha', color: 'from-cyan-500 to-blue-500', borderColor: 'border-cyan-500/30', bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-400', score: 0, members: [], currentMemberIndex: 0 },
    B: { name: 'Team Beta', color: 'from-orange-500 to-red-500', borderColor: 'border-orange-500/30', bgColor: 'bg-orange-500/20', textColor: 'text-orange-400', score: 0, members: [], currentMemberIndex: 0 },
  });
  const [activeTeam, setActiveTeam] = useState<TeamId>('A');
  const [losingTeam, setLosingTeam] = useState<TeamId | null>(null);

  const currentStudent = students.find((s) => s.id === currentStudentId);
  const currentWord = chain.length > 0 ? chain[chain.length - 1].word : startingWord;

  // Keep refs
  const currentWordRef = useRef<string>(currentWord);
  currentWordRef.current = currentWord;
  const chainRef = useRef<ExtendedChainLink[]>(chain);
  chainRef.current = chain;
  const startingWordRef = useRef<string>(startingWord);
  startingWordRef.current = startingWord;
  const statusRef = useRef<GameStatus>(status);
  statusRef.current = status;
  const activeTeamRef = useRef<TeamId>(activeTeam);
  activeTeamRef.current = activeTeam;
  const teamsRef = useRef(teams);
  teamsRef.current = teams;

  // Split students into teams when entering team mode
  useEffect(() => {
    if (!isTeamMode || students.length < 3) return;

    // Shuffle and split
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const half = Math.ceil(shuffled.length / 2);
    const teamA = shuffled.slice(0, half);
    const teamB = shuffled.slice(half);

    setTeams(prev => ({
      A: { ...prev.A, members: teamA.map(s => ({ id: s.id, name: s.name })), score: 0, currentMemberIndex: 0 },
      B: { ...prev.B, members: teamB.map(s => ({ id: s.id, name: s.name })), score: 0, currentMemberIndex: 0 },
    }));
    setActiveTeam('A');
  // Only re-split when student count changes significantly
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeamMode, students.length]);

  // Get current team member
  const getCurrentTeamMember = (teamId: TeamId) => {
    const team = teams[teamId];
    if (team.members.length === 0) return null;
    return team.members[team.currentMemberIndex % team.members.length];
  };

  // Point decay multiplier based on chain length
  const getPointMultiplier = (chainLength: number): number => {
    if (chainLength < 3) return 1.0;
    if (chainLength < 6) return 0.75;
    if (chainLength < 9) return 0.5;
    return 0.25;
  };

  const getMultiplierLabel = (chainLength: number): { text: string; color: string } | null => {
    const m = getPointMultiplier(chainLength);
    if (m === 1.0) return null;
    if (m === 0.75) return { text: '75%', color: 'text-yellow-400 bg-yellow-500/20' };
    if (m === 0.5) return { text: '50%', color: 'text-orange-400 bg-orange-500/20' };
    return { text: '25%', color: 'text-red-400 bg-red-500/20' };
  };

  // Pick a bonus challenge, rotating through types
  const pickBonus = useCallback((): BonusChallenge => {
    const types: BonusChallenge['type'][] = ['topic', 'syllable', 'letter', 'vocabulary'];
    const type = types[bonusIndexRef.current % types.length];
    bonusIndexRef.current++;

    switch (type) {
      case 'topic':
        return { type: 'topic', description: `Word must relate to "${sessionSettings.topic}"` };
      case 'syllable':
        return { type: 'syllable', description: 'Use a word with 3+ syllables' };
      case 'letter': {
        const consonants = 'BCDFGHJKLMNPRSTVW';
        const letter = consonants[Math.floor(Math.random() * consonants.length)];
        return { type: 'letter', description: `Word must start with "${letter}"`, letter };
      }
      case 'vocabulary':
        return { type: 'vocabulary', description: 'Use an advanced or uncommon word' };
    }
  }, [sessionSettings.topic]);

  // Simple syllable count heuristic (vowel groups)
  const countSyllables = (word: string): number => {
    const w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (w.length <= 2) return 1;
    const vowelGroups = w.match(/[aeiouy]+/g);
    let count = vowelGroups ? vowelGroups.length : 1;
    if (w.endsWith('e') && count > 1) count--;
    return Math.max(1, count);
  };

  // Check client-side bonus conditions
  const checkClientBonus = useCallback((word: string, bonus: BonusChallenge): boolean => {
    if (bonus.type === 'syllable') return countSyllables(word) >= 3;
    if (bonus.type === 'letter') return word.toLowerCase().startsWith((bonus.letter || '').toLowerCase());
    return false; // topic and vocabulary are checked server-side
  }, []);

  // Set bonus when chain reaches the right position
  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;
    // Trigger bonus when next link will be the 5th, 10th, 15th...
    if (chain.length > 0 && chain.length % 5 === 4) {
      setActiveBonus(pickBonus());
    } else {
      setActiveBonus(null);
    }
  }, [chain.length, status, pickBonus]);

  // Register input spec
  useEffect(() => {
    if (status === GameStatus.PLAYING && currentWord) {
      const bonusText = activeBonus ? `\n⭐ BONUS: ${activeBonus.description}` : '';
      onSetInputSpec?.({
        type: 'text',
        gameKey: 'word-chain',
        prompt: `Connect to: "${currentWord}"${bonusText}`,
        placeholder: activeBonus ? `Bonus challenge! Type a word...` : 'Type a connected word...',
        maxLength: 50,
      });
    } else {
      onSetInputSpec?.(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, currentWord, onSetInputSpec, isTeamMode, activeTeam, activeBonus]);

  // Evaluate a word submission (shared logic)
  const evaluateWord = useCallback(async (word: string, studentId: string, studentName: string, teamId?: TeamId): Promise<{ valid: boolean; result?: ValidationResult }> => {
    const prevWord = currentWordRef.current;
    if (!prevWord) return { valid: false };

    const allWords = [startingWordRef.current, ...chainRef.current.map(c => c.word.toLowerCase())];
    if (allWords.includes(word.toLowerCase())) {
      setLastFeedback('Already used! Try a different word.');
      return { valid: false };
    }

    try {
      const bonus = activeBonusRef.current;
      const response = await fetch('/api/word-chain/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousWord: prevWord,
          newWord: word.toLowerCase(),
          chainHistory: allWords,
          difficulty: sessionSettings.difficulty,
          ...(bonus && (bonus.type === 'topic' || bonus.type === 'vocabulary') ? { bonusChallenge: bonus } : {}),
        }),
      });

      if (!response.ok) throw new Error('Failed to evaluate');

      const result: ValidationResult & { bonusAchieved?: boolean } = await response.json();
      setLastFeedback(result.feedback);

      if (result.isValid) {
        // Determine bonus achievement
        let bonusAchieved = false;
        if (bonus) {
          if (bonus.type === 'topic' || bonus.type === 'vocabulary') {
            bonusAchieved = result.bonusAchieved ?? false;
          } else {
            bonusAchieved = checkClientBonus(word, bonus);
          }
        }

        // Apply decay multiplier and bonus
        const chainPos = chainRef.current.length;
        const multiplier = getPointMultiplier(chainPos);
        const bonusMult = bonusAchieved ? 2 : 1;
        const finalScore = Math.max(1, Math.round(result.score * bonusMult * multiplier));

        onScore(studentId, {
          isCorrect: true,
          points: finalScore,
          responseData: {
            word: word.toLowerCase(),
            connectionStrength: result.connectionStrength,
            chainPosition: chainPos + 1,
            bonusEarned: bonusAchieved,
          },
        });

        setChain(prev => [...prev, {
          word: word.toLowerCase(),
          connectionStrength: result.connectionStrength,
          score: finalScore,
          studentId,
          studentName,
          team: teamId,
          bonusEarned: bonusAchieved,
        }]);

        // Update team score
        if (teamId) {
          setTeams(prev => ({
            ...prev,
            [teamId]: { ...prev[teamId], score: prev[teamId].score + finalScore },
          }));
        }

        // Bonus toast
        if (bonusAchieved) {
          setBonusToast(true);
          setTimeout(() => setBonusToast(false), 2000);
        }

        // Clear active bonus after it's been attempted
        if (bonus) setActiveBonus(null);

        try {
          const audio = new Audio('/sounds/correct.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch {}
      } else {
        try {
          const audio = new Audio('/sounds/wrong.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch {}
      }

      return { valid: result.isValid, result };
    } catch {
      setLastFeedback('Error evaluating. Try again!');
      return { valid: false };
    }
  }, [sessionSettings.difficulty, onScore, checkClientBonus]);

  // Remote vote handler for team mode
  const handleRemoteVote = useCallback(async (vote: GameRemoteVote) => {
    if (statusRef.current !== GameStatus.PLAYING) return;

    const studentId = vote.studentId || vote.clientId;
    if (!studentId) return;

    const word = vote.choice?.trim();
    if (!word) return;

    // In team mode, check if this student is on the active team
    if (isTeamMode) {
      const team = activeTeamRef.current;
      const currentMember = teamsRef.current[team].members[teamsRef.current[team].currentMemberIndex % teamsRef.current[team].members.length];
      // Only accept from the current team member
      if (currentMember && studentId !== currentMember.id) return;
    }

    setIsEvaluating(true);
    const { valid, result } = await evaluateWord(word, studentId, vote.displayName, isTeamMode ? activeTeamRef.current : undefined);
    setIsEvaluating(false);

    if (valid) {
      if (isTeamMode) {
        // Advance team member index and switch teams
        const team = activeTeamRef.current;
        setTeams(prev => ({
          ...prev,
          [team]: { ...prev[team], currentMemberIndex: prev[team].currentMemberIndex + 1 },
        }));
        setActiveTeam(prev => prev === 'A' ? 'B' : 'A');
      } else {
        onPickStudent();
      }
    } else if (result && !result.isValid) {
      if (isTeamMode) {
        setLosingTeam(activeTeamRef.current);
        setStatus(GameStatus.CHAIN_BROKEN);
      } else {
        setStatus(GameStatus.CHAIN_BROKEN);
      }
    }
  }, [isTeamMode, evaluateWord, onPickStudent]);

  // Register remote vote handler
  useEffect(() => {
    onRegisterRemoteVoteHandler?.(handleRemoteVote);
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, handleRemoteVote]);

  // Register submission handler (fallback for non-team)
  useEffect(() => {
    if (isTeamMode) return;

    onRegisterSubmissionHandler?.({
      handleSubmission: async (content: string) => {
        const prevWord = currentWordRef.current;
        if (!prevWord) {
          return { isCorrect: false, points: 1, feedback: 'No active challenge' };
        }

        try {
          const response = await fetch('/api/word-chain/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              previousWord: prevWord,
              newWord: content.trim().toLowerCase(),
              chainHistory: [startingWordRef.current, ...chainRef.current.map((c) => c.word)],
              difficulty: sessionSettings.difficulty,
            }),
          });

          if (!response.ok) throw new Error('Evaluation failed');

          const result: ValidationResult = await response.json();

          setCurrentInput(content.trim());
          if (result.isValid) {
            setChain((prev) => [
              ...prev,
              {
                word: content.trim().toLowerCase(),
                connectionStrength: result.connectionStrength,
                score: result.score,
                studentId: '',
                studentName: 'Remote',
              },
            ]);
          }

          return {
            isCorrect: result.isValid,
            points: result.score,
            feedback: result.feedback,
          };
        } catch {
          return { isCorrect: false, points: 1, feedback: 'Evaluation error' };
        }
      },
    });

    return () => onRegisterSubmissionHandler?.(null);
  }, [isTeamMode, sessionSettings.difficulty, onRegisterSubmissionHandler]);

  const handleGenerate = async () => {
    if (!isTeamMode && !currentStudentId) {
      onPickStudent();
      return;
    }

    setStatus(GameStatus.GENERATING);
    setError(null);
    setChain([]);
    setCurrentInput('');
    setLastFeedback(null);
    setLosingTeam(null);
    setActiveBonus(null);
    bonusIndexRef.current = 0;
    if (isTeamMode) {
      setActiveTeam('A');
      setTeams(prev => ({
        A: { ...prev.A, score: 0, currentMemberIndex: 0 },
        B: { ...prev.B, score: 0, currentMemberIndex: 0 },
      }));
    }

    try {
      const response = await fetch('/api/word-chain/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: sessionSettings.topic,
          difficulty: sessionSettings.difficulty
        })
      });

      if (!response.ok) throw new Error('Failed to generate');

      const data = await response.json();
      setStartingWord(data.startingWord);
      setHint(data.hint);
      setStatus(GameStatus.PLAYING);
    } catch (err) {
      setError('Failed to start game. Please try again.');
      console.error(err);
      setStatus(GameStatus.IDLE);
    }
  };

  const handleSubmitWord = async () => {
    if (!currentInput.trim() || isEvaluating || status !== GameStatus.PLAYING) return;

    const newWord = currentInput.trim().toLowerCase();
    setCurrentInput('');
    setIsEvaluating(true);

    const teamId = isTeamMode ? activeTeam : undefined;
    const studentId = isTeamMode
      ? (getCurrentTeamMember(activeTeam)?.id || currentStudentId || '')
      : (currentStudentId || '');
    const studentName = isTeamMode
      ? (getCurrentTeamMember(activeTeam)?.name || 'Unknown')
      : (currentStudent?.name || 'Unknown');

    const { valid, result } = await evaluateWord(newWord, studentId, studentName, teamId);
    setIsEvaluating(false);

    if (valid) {
      if (isTeamMode) {
        // Advance member index and switch teams
        setTeams(prev => ({
          ...prev,
          [activeTeam]: { ...prev[activeTeam], currentMemberIndex: prev[activeTeam].currentMemberIndex + 1 },
        }));
        setActiveTeam(prev => prev === 'A' ? 'B' : 'A');
      } else {
        onPickStudent();
      }
    } else if (result && !result.isValid) {
      if (isTeamMode) {
        setLosingTeam(activeTeam);
      }
      setStatus(GameStatus.CHAIN_BROKEN);
    }
  };

  const handleEndChain = () => {
    setStatus(GameStatus.FINISHED);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitWord();
    }
  };

  const handleSameChallenge = () => {
    setChain([]);
    setCurrentInput('');
    setLastFeedback(null);
    setLosingTeam(null);
    setActiveBonus(null);
    bonusIndexRef.current = 0;
    setStatus(GameStatus.PLAYING);
    if (isTeamMode) {
      setActiveTeam('A');
      setTeams(prev => ({
        A: { ...prev.A, score: 0, currentMemberIndex: 0 },
        B: { ...prev.B, score: 0, currentMemberIndex: 0 },
      }));
    } else {
      onPickStudent();
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'creative': return 'from-lc-blue to-blue-500';
      case 'strong': return 'from-emerald-400 to-emerald-500';
      case 'moderate': return 'from-cyan-400 to-cyan-500';
      default: return 'from-slate-400 to-slate-500';
    }
  };

  // Get winning team
  const getWinningTeam = (): TeamId | null => {
    if (losingTeam) return losingTeam === 'A' ? 'B' : 'A';
    if (teams.A.score === teams.B.score) return null;
    return teams.A.score > teams.B.score ? 'A' : 'B';
  };

  // Render chain display
  const renderChain = () => {
    if (chain.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-slate-300">
          {startingWord}
        </span>
        {chain.map((link, i) => (
          <motion.div key={i} className="flex items-center gap-2" initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <span className="text-slate-500">→</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r ${
              isTeamMode && link.team
                ? (link.team === 'A' ? teams.A.color : teams.B.color)
                : getStrengthColor(link.connectionStrength)
            }`}>
              {link.bonusEarned && <span className="mr-1">⭐</span>}
              {link.word}
              <span className="ml-1 text-xs opacity-70">({link.studentName})</span>
            </span>
          </motion.div>
        ))}
      </div>
    );
  };

  // ============ TEAM MODE ============
  if (isTeamMode) {
    const currentMember = getCurrentTeamMember(activeTeam);
    const activeTeamState = teams[activeTeam];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="opacity-70 text-sm">Teams take turns adding words to the chain!</p>
          <p className="text-xs text-cyan-400 mt-1">{students.length} students in 2 teams</p>
        </div>

        {/* Team Scoreboard */}
        {status !== GameStatus.IDLE && status !== GameStatus.GENERATING && (
          <div className="grid grid-cols-2 gap-3">
            {(['A', 'B'] as TeamId[]).map(teamId => {
              const team = teams[teamId];
              const isActive = activeTeam === teamId && status === GameStatus.PLAYING;
              return (
                <div key={teamId} className={`glass p-4 rounded-xl border-2 transition-all ${
                  isActive ? team.borderColor + ' scale-[1.02]' : 'border-white/5 opacity-60'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-bold text-sm ${team.textColor}`}>{team.name}</h4>
                    <span className="text-2xl font-black text-white">{team.score}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {team.members.map((m, mi) => {
                      const isCurrent = isActive && (team.currentMemberIndex % team.members.length) === mi;
                      return (
                        <span key={m.id} className={`text-xs px-2 py-0.5 rounded-full ${
                          isCurrent ? team.bgColor + ' ' + team.textColor + ' font-bold' : 'bg-white/5 text-slate-500'
                        }`}>
                          {m.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* IDLE */}
        {status === GameStatus.IDLE && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="glass p-6 rounded-2xl border border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-3">Team Word Chain</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Teams alternate adding words. If your word breaks the chain, the other team wins!
              </p>
            </div>

            {/* Team preview */}
            <div className="grid grid-cols-2 gap-3">
              {(['A', 'B'] as TeamId[]).map(teamId => {
                const team = teams[teamId];
                return (
                  <div key={teamId} className={`glass p-4 rounded-xl border ${team.borderColor}`}>
                    <h4 className={`font-bold text-sm mb-2 ${team.textColor}`}>{team.name}</h4>
                    <div className="space-y-1">
                      {team.members.map(m => (
                        <p key={m.id} className="text-xs text-slate-400">{m.name}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={handleGenerate} className="w-full px-12 py-6 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20">
              START TEAM CHAIN
            </button>
          </motion.div>
        )}

        {/* GENERATING */}
        {status === GameStatus.GENERATING && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 py-12">
            <div className="w-16 h-16 border-4 border-teal-500/10 border-t-teal-500 rounded-full animate-spin" />
            <p className="font-game text-xl text-teal-400 uppercase tracking-widest animate-pulse">Finding Starting Word...</p>
          </motion.div>
        )}

        {/* Error */}
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">{error}</div>}

        {/* PLAYING */}
        {status === GameStatus.PLAYING && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Chain Length + Decay Badge */}
            <div className="flex items-center justify-center gap-2">
              <div className="px-4 py-2 bg-teal-500/20 text-teal-400 rounded-xl text-sm font-bold">
                Chain: {chain.length} links
              </div>
              {getMultiplierLabel(chain.length) && (
                <div className={`px-3 py-2 rounded-xl text-sm font-bold ${getMultiplierLabel(chain.length)!.color}`}>
                  {getMultiplierLabel(chain.length)!.text} pts
                </div>
              )}
            </div>

            {/* Bonus Challenge Banner */}
            <AnimatePresence>
              {activeBonus && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="relative p-4 rounded-xl border-2 border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-center"
                >
                  <span className="absolute -top-2 right-3 px-2 py-0.5 bg-yellow-500 text-black text-xs font-black rounded-full">
                    2x BONUS
                  </span>
                  <p className="text-yellow-300 font-bold text-sm">⭐ {activeBonus.description}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bonus Toast */}
            <AnimatePresence>
              {bonusToast && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: -20 }}
                  className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-yellow-500 text-black font-black text-xl rounded-2xl shadow-2xl"
                >
                  ⭐ +2x BONUS!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active team + current member indicator */}
            <div className={`glass p-4 rounded-xl border-2 ${activeTeamState.borderColor} text-center`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${activeTeamState.textColor}`}>
                {activeTeamState.name}&apos;s Turn
              </p>
              {currentMember && (
                <p className="text-lg font-bold text-white mt-1">{currentMember.name}</p>
              )}
            </div>

            {/* Current Word */}
            <div className="glass p-6 rounded-2xl border-2 border-teal-500/30 text-center">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-teal-400 uppercase tracking-widest">Connect to:</p>
                <button onClick={handleGenerate} disabled={isEvaluating} className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30">
                  Skip Question
                </button>
              </div>
              <h2 className="text-4xl font-black text-white mb-2">{currentWord}</h2>
              {chain.length === 0 && hint && <p className="text-xs text-slate-500">{hint}</p>}
            </div>

            {/* Chain Display */}
            {renderChain()}

            {/* Input */}
            <div className="flex gap-3">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={currentMember ? `${currentMember.name}, type a word...` : 'Type a connected word...'}
                disabled={isEvaluating}
                autoFocus
                className="flex-1 bg-black/40 border-2 border-white/10 text-white rounded-xl px-4 py-3 focus:border-teal-500 outline-none text-lg disabled:opacity-50"
              />
              <button
                onClick={handleSubmitWord}
                disabled={!currentInput.trim() || isEvaluating}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl font-bold text-white disabled:opacity-30"
              >
                {isEvaluating ? '...' : 'LINK'}
              </button>
            </div>

            {/* Waiting for remote */}
            {currentMember && (
              <p className="text-center text-xs text-slate-500">
                Waiting for {currentMember.name} to submit on their device, or teacher can type above
              </p>
            )}

            {/* Feedback */}
            <AnimatePresence>
              {lastFeedback && (
                <motion.p key={lastFeedback} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center text-sm text-slate-300">
                  {lastFeedback}
                </motion.p>
              )}
            </AnimatePresence>

            {/* End Chain */}
            {chain.length >= 3 && (
              <button onClick={handleEndChain} className="w-full py-3 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-white/10">
                END CHAIN ({chain.length} links)
              </button>
            )}
          </motion.div>
        )}

        {/* CHAIN_BROKEN / FINISHED */}
        {(status === GameStatus.CHAIN_BROKEN || status === GameStatus.FINISHED) && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="glass p-6 rounded-2xl border-2 border-teal-500/30 text-center">
              {status === GameStatus.CHAIN_BROKEN && losingTeam ? (
                <>
                  <h3 className="text-2xl font-bold text-white mb-2">Chain Broken!</h3>
                  <p className={`text-lg font-bold mb-2 ${teams[losingTeam === 'A' ? 'B' : 'A'].textColor}`}>
                    {teams[losingTeam === 'A' ? 'B' : 'A'].name} Wins!
                  </p>
                  <p className="text-sm text-slate-400">{teams[losingTeam].name} broke the chain</p>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-white mb-2">Chain Complete!</h3>
                  {getWinningTeam() ? (
                    <p className={`text-lg font-bold mb-2 ${teams[getWinningTeam()!].textColor}`}>
                      {teams[getWinningTeam()!].name} Wins!
                    </p>
                  ) : (
                    <p className="text-lg font-bold mb-2 text-yellow-400">It&apos;s a Tie!</p>
                  )}
                </>
              )}

              <p className="text-5xl font-black text-teal-400 mb-2">{chain.length}</p>
              <p className="text-slate-400 mb-2">links in the chain</p>

              {/* Team scores */}
              <div className="flex justify-center gap-6 mt-4">
                {(['A', 'B'] as TeamId[]).map(teamId => (
                  <div key={teamId} className="text-center">
                    <p className={`text-xs font-bold uppercase ${teams[teamId].textColor}`}>{teams[teamId].name}</p>
                    <p className="text-3xl font-black text-white">{teams[teamId].score}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Chain */}
            <div className="p-4 bg-black/20 rounded-xl">
              {renderChain()}
            </div>

            <div className="flex gap-3">
              <button onClick={handleGenerate} className="flex-1 py-4 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10">NEW CHAIN</button>
              <button onClick={handleSameChallenge} className="flex-1 py-4 bg-cyan-500/20 text-cyan-300 rounded-xl font-game transition-all border border-cyan-500/30 hover:bg-cyan-500/30">SAME WORD, REMATCH</button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // ============ TURN-BASED MODE (< 3 students) ============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          {currentStudent && (
            <p className="text-lg font-semibold text-cyan-400">
              {currentStudent.name}&apos;s turn
            </p>
          )}
          {!currentStudentId && (
            <p className="opacity-70 text-sm">Pick a student to start</p>
          )}
        </div>
        <div className="text-xs opacity-40">
          {sessionSettings.difficulty} / {sessionSettings.topic}
        </div>
      </div>

      {/* IDLE State */}
      {status === GameStatus.IDLE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-3">How to Play</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Build a chain of connected words! Each word must relate to the previous one. How long can you go?
            </p>
          </div>

          {!currentStudentId ? (
            <button
              onClick={onPickStudent}
              className="w-full px-12 py-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              PICK STUDENT
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              className="w-full px-12 py-6 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl font-game text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
            >
              START CHAIN
            </button>
          )}
        </motion.div>
      )}

      {/* GENERATING State */}
      {status === GameStatus.GENERATING && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-6 py-12"
        >
          <div className="w-16 h-16 border-4 border-teal-500/10 border-t-teal-500 rounded-full animate-spin" />
          <p className="font-game text-xl text-teal-400 uppercase tracking-widest animate-pulse">
            Finding Starting Word...
          </p>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* PLAYING State */}
      {status === GameStatus.PLAYING && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Chain Length + Decay Badge */}
          <div className="flex items-center justify-center gap-2">
            <div className="px-4 py-2 bg-teal-500/20 text-teal-400 rounded-xl text-sm font-bold">
              Chain: {chain.length} links
            </div>
            {getMultiplierLabel(chain.length) && (
              <div className={`px-3 py-2 rounded-xl text-sm font-bold ${getMultiplierLabel(chain.length)!.color}`}>
                {getMultiplierLabel(chain.length)!.text} pts
              </div>
            )}
          </div>

          {/* Bonus Challenge Banner */}
          <AnimatePresence>
            {activeBonus && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="relative p-4 rounded-xl border-2 border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-center"
              >
                <span className="absolute -top-2 right-3 px-2 py-0.5 bg-yellow-500 text-black text-xs font-black rounded-full">
                  2x BONUS
                </span>
                <p className="text-yellow-300 font-bold text-sm">⭐ {activeBonus.description}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bonus Toast */}
          <AnimatePresence>
            {bonusToast && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -20 }}
                className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-yellow-500 text-black font-black text-xl rounded-2xl shadow-2xl"
              >
                ⭐ +2x BONUS!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current Word */}
          <div className="glass p-6 rounded-2xl border-2 border-teal-500/30 text-center">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-teal-400 uppercase tracking-widest">Connect to:</p>
              <button
                onClick={handleGenerate}
                disabled={isEvaluating}
                className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30"
              >
                Skip Question
              </button>
            </div>
            <h2 className="text-4xl font-black text-white mb-2">{currentWord}</h2>
            {chain.length === 0 && hint && (
              <p className="text-xs text-slate-500">{hint}</p>
            )}
          </div>

          {/* Chain Display */}
          {renderChain()}

          {/* Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a connected word..."
              disabled={isEvaluating}
              autoFocus
              className="flex-1 bg-black/40 border-2 border-white/10 text-white rounded-xl px-4 py-3 focus:border-teal-500 outline-none text-lg disabled:opacity-50"
            />
            <button
              onClick={handleSubmitWord}
              disabled={!currentInput.trim() || isEvaluating}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl font-bold text-white disabled:opacity-30"
            >
              {isEvaluating ? '...' : 'LINK'}
            </button>
          </div>

          {/* Feedback */}
          {lastFeedback && (
            <motion.p
              key={lastFeedback}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm text-slate-300"
            >
              {lastFeedback}
            </motion.p>
          )}

          {/* End Chain Button */}
          {chain.length >= 3 && (
            <button
              onClick={handleEndChain}
              className="w-full py-3 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-white/10"
            >
              END CHAIN ({chain.length} links)
            </button>
          )}
        </motion.div>
      )}

      {/* CHAIN_BROKEN / FINISHED State */}
      {(status === GameStatus.CHAIN_BROKEN || status === GameStatus.FINISHED) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border-2 border-teal-500/30 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">
              {status === GameStatus.CHAIN_BROKEN ? 'Chain Broken!' : 'Chain Complete!'}
            </h3>
            <p className="text-5xl font-black text-teal-400 mb-2">{chain.length}</p>
            <p className="text-slate-400 mb-4">links in the chain</p>

            {/* Full Chain with Student Names */}
            <div className="flex flex-wrap justify-center items-center gap-2 p-4 bg-black/20 rounded-xl">
              <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-slate-300">
                {startingWord}
              </span>
              {chain.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-slate-500">→</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getStrengthColor(link.connectionStrength)}`}>
                    {link.bonusEarned && <span className="mr-1">⭐</span>}
                    {link.word}
                    <span className="ml-1 text-xs opacity-70">({link.studentName})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              className="flex-1 py-4 glass hover:bg-white/10 rounded-xl font-game transition-all border border-white/10"
            >
              NEW CHAIN
            </button>
            <button
              onClick={handleSameChallenge}
              className="flex-1 py-4 bg-cyan-500/20 text-cyan-300 rounded-xl font-game transition-all border border-cyan-500/30 hover:bg-cyan-500/30"
            >
              SAME WORD, NEW CHAIN
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
