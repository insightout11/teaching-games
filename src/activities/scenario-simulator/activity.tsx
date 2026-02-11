'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ActivityProps } from '../types';
import {
  ActivityStatus,
  type RoleAssignment,
  type DecisionRecord,
  type ScenarioSimulatorContent,
  type ScenarioBranch,
} from './types';

export function ScenarioSimulatorActivity({
  students,
  generatedContent,
  onPhaseChange,
  customTopic,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
}: ActivityProps) {
  const content = generatedContent as ScenarioSimulatorContent;

  const [status, setStatus] = useState<ActivityStatus>(ActivityStatus.IDLE);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [currentBranchIndex, setCurrentBranchIndex] = useState(0);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showConsequence, setShowConsequence] = useState(false);

  const currentBranch: ScenarioBranch | undefined = content.branchingPoints?.[currentBranchIndex];

  // Register input spec for student controller
  useEffect(() => {
    if (status === ActivityStatus.CHOOSING && currentBranch) {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'scenario-simulator',
        prompt: currentBranch.situation,
        options: currentBranch.choices.map((c, i) => `${String.fromCharCode(65 + i)}. ${c.action}`),
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [status, currentBranch, onSetInputSpec]);

  // Register remote vote handler to receive votes from student devices
  useEffect(() => {
    if (status !== ActivityStatus.CHOOSING || !currentBranch) return;

    onRegisterRemoteVoteHandler?.((vote) => {
      const options = currentBranch.choices.map((c, i) => `${String.fromCharCode(65 + i)}. ${c.action}`);
      const index = options.indexOf(vote.choice);
      if (index >= 0 && currentBranch.choices[index]) {
        setSelectedChoice(currentBranch.choices[index].id);
      }
    });

    return () => onRegisterRemoteVoteHandler?.(null);
  }, [status, currentBranch, onRegisterRemoteVoteHandler]);

  const startActivity = useCallback(() => {
    setStatus(ActivityStatus.SETUP);
    onPhaseChange?.('setup');
  }, [onPhaseChange]);

  const startAssigning = useCallback(() => {
    setStatus(ActivityStatus.ASSIGNING);
    onPhaseChange?.('assigning');
  }, [onPhaseChange]);

  const assignRole = useCallback((studentId: string, roleId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    setRoleAssignments((prev) => {
      const filtered = prev.filter((a) => a.studentId !== studentId);
      const withoutRole = filtered.filter((a) => a.roleId !== roleId);
      return [...withoutRole, { studentId, studentName: student.name, roleId }];
    });
  }, [students]);

  const startScenario = useCallback(() => {
    setStatus(ActivityStatus.SITUATION);
    setCurrentBranchIndex(0);
    onPhaseChange?.('situation');
  }, [onPhaseChange]);

  const startDiscussion = useCallback(() => {
    setStatus(ActivityStatus.DISCUSSING);
    onPhaseChange?.('discussing');
  }, [onPhaseChange]);

  const startChoosing = useCallback(() => {
    setStatus(ActivityStatus.CHOOSING);
    setSelectedChoice(null);
    onPhaseChange?.('choosing');
  }, [onPhaseChange]);

  const selectChoice = useCallback((choiceId: string) => {
    setSelectedChoice(choiceId);
  }, []);

  const confirmChoice = useCallback(() => {
    if (!currentBranch || !selectedChoice) return;

    const choice = currentBranch.choices.find((c) => c.id === selectedChoice);
    if (!choice) return;

    setDecisions((prev) => [...prev, {
      branchId: currentBranch.id,
      choiceId: choice.id,
      choiceText: choice.action,
      consequence: choice.consequence,
    }]);

    setShowConsequence(true);
    setStatus(ActivityStatus.CONSEQUENCE);
    onPhaseChange?.('consequence');
  }, [currentBranch, selectedChoice, onPhaseChange]);

  const nextSituation = useCallback(() => {
    const choice = currentBranch?.choices.find((c) => c.id === selectedChoice);

    // Check if there's a next branch specified
    if (choice?.nextBranchId) {
      const nextIndex = content.branchingPoints?.findIndex((b) => b.id === choice.nextBranchId);
      if (nextIndex !== undefined && nextIndex >= 0) {
        setCurrentBranchIndex(nextIndex);
        setSelectedChoice(null);
        setShowConsequence(false);
        setStatus(ActivityStatus.SITUATION);
        onPhaseChange?.('situation');
        return;
      }
    }

    // Otherwise, just go to next branch in sequence
    if (currentBranchIndex < (content.branchingPoints?.length || 0) - 1) {
      setCurrentBranchIndex((prev) => prev + 1);
      setSelectedChoice(null);
      setShowConsequence(false);
      setStatus(ActivityStatus.SITUATION);
      onPhaseChange?.('situation');
    } else {
      setStatus(ActivityStatus.FINISHED);
      onPhaseChange?.('finished');
    }
  }, [currentBranch, selectedChoice, currentBranchIndex, content.branchingPoints, onPhaseChange]);

  const restartActivity = useCallback(() => {
    setRoleAssignments([]);
    setCurrentBranchIndex(0);
    setDecisions([]);
    setSelectedChoice(null);
    setShowConsequence(false);
    setStatus(ActivityStatus.IDLE);
    onPhaseChange?.('idle');
  }, [onPhaseChange]);

  if (!content.scenario || !content.branchingPoints || content.branchingPoints.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">No scenario available. Please regenerate content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-lc-blue">Scenario Simulator</h3>
          {customTopic && (
            <p className="text-xs opacity-60">Topic: {customTopic}</p>
          )}
        </div>
        <div className="text-sm opacity-60">
          {status !== ActivityStatus.IDLE && status !== ActivityStatus.SETUP && status !== ActivityStatus.ASSIGNING && (
            <span>Decision {decisions.length + 1} / {content.branchingPoints.length}</span>
          )}
        </div>
      </div>

      {/* IDLE State */}
      {status === ActivityStatus.IDLE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <p className="text-xl mb-2 opacity-90">Enter the Scenario!</p>
          <p className="opacity-60 text-sm mb-8">
            Make decisions together and see how your choices shape the outcome.
          </p>
          <button
            onClick={startActivity}
            className="px-12 py-6 bg-gradient-to-br from-lc-blue to-blue-500 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            BEGIN SCENARIO
          </button>
        </motion.div>
      )}

      {/* SETUP State */}
      {status === ActivityStatus.SETUP && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border-2 border-lc-blue/25">
            <h4 className="text-xl font-bold text-lc-blue mb-2">{content.scenario.title}</h4>
            <p className="text-lg mb-4">{content.scenario.context}</p>
            <div className="glass p-4 rounded-xl">
              <p className="text-sm opacity-50 mb-1">Your Objective:</p>
              <p className="font-semibold">{content.scenario.objective}</p>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={startAssigning}
              className="px-8 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              ASSIGN ROLES
            </button>
          </div>
        </motion.div>
      )}

      {/* ASSIGNING State */}
      {status === ActivityStatus.ASSIGNING && content.roles && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="text-center mb-4">
            <p className="text-sm uppercase tracking-widest opacity-50">
              Assign Roles for the Scenario
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.roles.map((role) => {
              const assignment = roleAssignments.find((a) => a.roleId === role.id);
              return (
                <div key={role.id} className="glass p-4 rounded-2xl">
                  <h4 className="font-bold text-lc-blue">{role.name}</h4>
                  <p className="text-sm opacity-70 mb-2">{role.description}</p>
                  <div className="text-xs opacity-50 mb-2">Goals:</div>
                  <ul className="text-xs opacity-70 mb-3">
                    {role.goals.map((goal, i) => (
                      <li key={i}>• {goal}</li>
                    ))}
                  </ul>
                  <select
                    value={assignment?.studentId || ''}
                    onChange={(e) => e.target.value && assignRole(e.target.value, role.id)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Assign student...</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <button
              onClick={startScenario}
              className="px-8 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              START SCENARIO
            </button>
          </div>
        </motion.div>
      )}

      {/* SITUATION State */}
      {status === ActivityStatus.SITUATION && currentBranch && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Previous decisions summary */}
          {decisions.length > 0 && (
            <div className="glass p-3 rounded-xl text-sm">
              <span className="opacity-50">Previous: </span>
              {decisions.slice(-1)[0].choiceText}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-6 rounded-2xl border-2 border-lc-blue/25"
          >
            <p className="text-sm uppercase tracking-widest opacity-50 mb-2">Current Situation</p>
            <p className="text-xl">{currentBranch.situation}</p>
          </motion.div>

          <div className="flex justify-center">
            <button
              onClick={startDiscussion}
              className="px-8 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              DISCUSS OPTIONS
            </button>
          </div>
        </motion.div>
      )}

      {/* DISCUSSING State */}
      {status === ActivityStatus.DISCUSSING && currentBranch && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="glass p-4 rounded-xl">
            <p className="text-lg">{currentBranch.situation}</p>
          </div>

          <div className="text-center">
            <p className="text-sm uppercase tracking-widest opacity-50 mb-4">
              Your Options
            </p>
          </div>

          <div className="space-y-3">
            {currentBranch.choices.map((choice, index) => (
              <div key={choice.id} className="glass p-4 rounded-xl border border-white/10">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-rose-500/20 text-lc-blue flex items-center justify-center font-bold shrink-0">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <p className="text-lg">{choice.action}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="glass p-4 rounded-xl border-2 border-cyan-500/30">
            <p className="text-sm uppercase tracking-widest opacity-50 mb-2">Discussion Prompt</p>
            <p>Discuss with your team: What are the pros and cons of each option?</p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={startChoosing}
              className="px-8 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              MAKE DECISION
            </button>
          </div>
        </motion.div>
      )}

      {/* CHOOSING State */}
      {status === ActivityStatus.CHOOSING && currentBranch && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="text-center">
            <p className="text-sm uppercase tracking-widest opacity-50 mb-4">
              Select Your Choice
            </p>
          </div>

          <div className="space-y-3">
            {currentBranch.choices.map((choice, index) => (
              <button
                key={choice.id}
                onClick={() => selectChoice(choice.id)}
                className={`w-full glass p-4 rounded-xl border-2 text-left transition-all ${
                  selectedChoice === choice.id
                    ? 'border-rose-500 bg-rose-500/10'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                    selectedChoice === choice.id
                      ? 'bg-rose-500 text-white'
                      : 'bg-white/10'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <p className="text-lg">{choice.action}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={confirmChoice}
              disabled={!selectedChoice}
              className="px-8 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-30"
            >
              CONFIRM DECISION
            </button>
          </div>
        </motion.div>
      )}

      {/* CONSEQUENCE State */}
      {status === ActivityStatus.CONSEQUENCE && showConsequence && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="text-center">
            <p className="text-sm uppercase tracking-widest opacity-50 mb-2">
              The Consequence
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass p-8 rounded-2xl border-2 border-yellow-500/30"
          >
            <p className="text-xl text-center">
              {decisions[decisions.length - 1]?.consequence}
            </p>
          </motion.div>

          {/* Decision history */}
          {decisions.length > 1 && (
            <div className="glass p-4 rounded-xl">
              <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Your Journey</p>
              <div className="space-y-1">
                {decisions.map((d, i) => (
                  <p key={i} className="text-sm opacity-70">
                    {i + 1}. {d.choiceText}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={nextSituation}
              className="px-8 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              {currentBranchIndex < (content.branchingPoints?.length || 0) - 1
                ? 'CONTINUE STORY'
                : 'SEE ENDING'}
            </button>
          </div>
        </motion.div>
      )}

      {/* FINISHED State */}
      {status === ActivityStatus.FINISHED && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8 space-y-6"
        >
          <p className="text-2xl font-game text-lc-blue mb-4">Scenario Complete!</p>

          <div className="glass p-6 rounded-2xl">
            <p className="text-sm uppercase tracking-widest opacity-50 mb-3">Your Decisions</p>
            <div className="space-y-2 text-left">
              {decisions.map((d, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-500/20 text-lc-blue flex items-center justify-center text-sm font-bold shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm">{d.choiceText}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={restartActivity}
            className="px-8 py-4 glass hover:bg-white/10 rounded-xl font-game text-lg transition-all border border-white/20"
          >
            TRY DIFFERENT CHOICES
          </button>
        </motion.div>
      )}
    </div>
  );
}
