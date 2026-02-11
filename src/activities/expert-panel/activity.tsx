'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityProps } from '../types';
import {
  ActivityStatus,
  type RoleAssignment,
  type ExpertPanelContent,
  type ExpertRole,
  type ExpertQuestion,
} from './types';

export function ExpertPanelActivity({
  students,
  generatedContent,
  onContinue,
  onPhaseChange,
  customTopic,
  onSetInputSpec,
}: ActivityProps) {
  const content = generatedContent as ExpertPanelContent;

  const [status, setStatus] = useState<ActivityStatus>(ActivityStatus.IDLE);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [dynamicQuestions, setDynamicQuestions] = useState<ExpertQuestion[]>([]);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [responsesGiven, setResponsesGiven] = useState(0);

  // Combine starter questions with dynamic ones
  const allQuestions = useMemo(() => {
    return [...(content.starterQuestions || []), ...dynamicQuestions];
  }, [content.starterQuestions, dynamicQuestions]);

  const currentQuestion: ExpertQuestion | undefined = allQuestions[currentQuestionIndex];

  // Register input spec for student controller
  // Expert panel is primarily a verbal/in-person activity, so no remote input
  useEffect(() => {
    onSetInputSpec?.(null);
  }, [onSetInputSpec]);

  // Get role by ID
  const getRoleById = useCallback((roleId: string): ExpertRole | undefined => {
    return content.roles?.find((r) => r.id === roleId);
  }, [content.roles]);

  // Get student assigned to role
  const getStudentForRole = useCallback((roleId: string): RoleAssignment | undefined => {
    return roleAssignments.find((a) => a.roleId === roleId);
  }, [roleAssignments]);

  const startActivity = useCallback(() => {
    setStatus(ActivityStatus.ASSIGNING);
    onPhaseChange?.('assigning');
  }, [onPhaseChange]);

  const assignRole = useCallback((studentId: string, roleId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    setRoleAssignments((prev) => {
      // Remove any existing assignment for this student
      const filtered = prev.filter((a) => a.studentId !== studentId);
      // Remove any existing assignment for this role
      const withoutRole = filtered.filter((a) => a.roleId !== roleId);
      return [...withoutRole, { studentId, studentName: student.name, roleId }];
    });
  }, [students]);

  const startPanel = useCallback(() => {
    setStatus(ActivityStatus.PANEL);
    setCurrentQuestionIndex(0);
    onPhaseChange?.('panel');
  }, [onPhaseChange]);

  const askQuestion = useCallback(() => {
    setStatus(ActivityStatus.QUESTION);
    onPhaseChange?.('question');
  }, [onPhaseChange]);

  const recordResponse = useCallback(() => {
    setResponsesGiven((prev) => prev + 1);
    setStatus(ActivityStatus.RESPONSE);
    onPhaseChange?.('response');
  }, [onPhaseChange]);

  const generateFollowUp = useCallback(async () => {
    if (!currentQuestion) return;

    setIsLoadingQuestion(true);

    try {
      const targetRole = getRoleById(currentQuestion.targetRoleId);
      const response = await onContinue({
        sessionId: '',
        activityKey: 'expert-panel',
        topicContext: content.topicContext,
        previousExchanges: [
          { role: 'system', content: `Expert role: ${targetRole?.title}`, timestamp: Date.now() },
          { role: 'system', content: `Previous question: ${currentQuestion.question}`, timestamp: Date.now() },
        ],
        studentResponse: 'Student gave a response to the previous question',
        requestType: 'follow-up',
      });

      if (response.nextQuestion) {
        const newQuestion: ExpertQuestion = {
          id: `dynamic-${Date.now()}`,
          targetRoleId: currentQuestion.targetRoleId,
          question: response.nextQuestion,
          followUpHints: [],
        };
        setDynamicQuestions((prev) => [...prev, newQuestion]);
      }
    } catch (error) {
      console.error('Failed to generate follow-up:', error);
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [currentQuestion, content.topicContext, getRoleById, onContinue]);

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setStatus(ActivityStatus.PANEL);
      onPhaseChange?.('panel');
    } else {
      setStatus(ActivityStatus.FINISHED);
      onPhaseChange?.('finished');
    }
  }, [currentQuestionIndex, allQuestions.length, onPhaseChange]);

  const restartActivity = useCallback(() => {
    setRoleAssignments([]);
    setCurrentQuestionIndex(0);
    setDynamicQuestions([]);
    setResponsesGiven(0);
    setStatus(ActivityStatus.IDLE);
    onPhaseChange?.('idle');
  }, [onPhaseChange]);

  if (!content.roles || content.roles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">No expert roles available. Please regenerate content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-lc-blue">Expert Panel</h3>
          {customTopic && (
            <p className="text-xs opacity-60">Topic: {customTopic}</p>
          )}
        </div>
        <div className="text-sm opacity-60">
          {status !== ActivityStatus.IDLE && status !== ActivityStatus.ASSIGNING && (
            <span>Question {currentQuestionIndex + 1} / {allQuestions.length}</span>
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
          <p className="text-xl mb-2 opacity-90">Become the Expert!</p>
          <p className="opacity-60 text-sm mb-8">
            Students take on specialist roles and answer questions from their expert perspective.
          </p>
          <button
            onClick={startActivity}
            className="px-12 py-6 bg-gradient-to-br from-lc-blue to-blue-500 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            ASSIGN ROLES
          </button>
        </motion.div>
      )}

      {/* ASSIGNING State */}
      {status === ActivityStatus.ASSIGNING && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center mb-4">
            <p className="text-sm uppercase tracking-widest opacity-50">
              Assign Expert Roles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.roles.map((role) => {
              const assignment = getStudentForRole(role.id);
              return (
                <div
                  key={role.id}
                  className="glass p-4 rounded-2xl border-2 border-lc-blue/25"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-lc-blue">{role.title}</h4>
                      <p className="text-sm opacity-70">{role.description}</p>
                    </div>
                  </div>

                  <div className="text-xs opacity-50 mb-2">Expertise:</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {role.expertise.map((exp, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-xs">
                        {exp}
                      </span>
                    ))}
                  </div>

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

                  {assignment && (
                    <p className="text-sm text-lc-blue mt-2">
                      Assigned: {assignment.studentName}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <button
              onClick={startPanel}
              disabled={roleAssignments.length === 0}
              className="px-8 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-30"
            >
              START PANEL
            </button>
          </div>
        </motion.div>
      )}

      {/* PANEL State - Show assigned experts */}
      {status === ActivityStatus.PANEL && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="text-center mb-4">
            <p className="text-sm uppercase tracking-widest opacity-50">
              Today&apos;s Expert Panel
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {roleAssignments.map((assignment) => {
              const role = getRoleById(assignment.roleId);
              if (!role) return null;
              return (
                <div key={assignment.studentId} className="glass p-4 rounded-xl text-center">
                  <p className="font-bold text-lc-blue">{assignment.studentName}</p>
                  <p className="text-sm opacity-70">{role.title}</p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={askQuestion}
              className="px-8 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              ASK QUESTION
            </button>
          </div>
        </motion.div>
      )}

      {/* QUESTION State */}
      {status === ActivityStatus.QUESTION && currentQuestion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {(() => {
            const targetRole = getRoleById(currentQuestion.targetRoleId);
            const assignment = getStudentForRole(currentQuestion.targetRoleId);

            return (
              <>
                <div className="glass p-4 rounded-xl text-center">
                  <p className="text-sm opacity-50 mb-1">Question for:</p>
                  <p className="text-lg font-bold text-lc-blue">
                    {assignment?.studentName || 'Unassigned'} ({targetRole?.title})
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass p-8 rounded-2xl border-2 border-lc-blue/25"
                >
                  <p className="text-2xl font-semibold text-center">
                    &ldquo;{currentQuestion.question}&rdquo;
                  </p>
                </motion.div>

                {/* Suggested vocabulary */}
                {targetRole?.suggestedVocabulary && targetRole.suggestedVocabulary.length > 0 && (
                  <div className="glass p-4 rounded-xl">
                    <p className="text-xs opacity-50 mb-2">Suggested vocabulary:</p>
                    <div className="flex flex-wrap gap-2">
                      {targetRole.suggestedVocabulary.map((word, i) => (
                        <span key={i} className="px-3 py-1 bg-lc-blue/15 text-lc-blue rounded-lg text-sm">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up hints */}
                {currentQuestion.followUpHints.length > 0 && (
                  <div className="glass p-4 rounded-xl border border-yellow-500/30">
                    <p className="text-xs text-yellow-400 mb-2">Teacher hints:</p>
                    <ul className="text-sm opacity-70 space-y-1">
                      {currentQuestion.followUpHints.map((hint, i) => (
                        <li key={i}>• {hint}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-center">
                  <button
                    onClick={recordResponse}
                    className="px-8 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
                  >
                    RESPONSE GIVEN
                  </button>
                </div>
              </>
            );
          })()}
        </motion.div>
      )}

      {/* RESPONSE State */}
      {status === ActivityStatus.RESPONSE && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl text-center">
            <p className="text-2xl font-game text-green-400 mb-2">Great Answer!</p>
            <p className="opacity-70">
              {responsesGiven} response{responsesGiven !== 1 ? 's' : ''} so far
            </p>
          </div>

          <AnimatePresence>
            {isLoadingQuestion && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-4"
              >
                <div className="w-10 h-10 border-4 border-lc-blue/10 border-t-lc-blue rounded-full animate-spin" />
                <p className="text-sm text-lc-blue">Generating follow-up...</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={generateFollowUp}
              disabled={isLoadingQuestion}
              className="px-6 py-3 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-cyan-500/30 text-cyan-400 disabled:opacity-30"
            >
              GENERATE FOLLOW-UP
            </button>
            <button
              onClick={nextQuestion}
              className="px-6 py-3 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              {currentQuestionIndex < allQuestions.length - 1 ? 'NEXT QUESTION' : 'FINISH PANEL'}
            </button>
          </div>
        </motion.div>
      )}

      {/* FINISHED State */}
      {status === ActivityStatus.FINISHED && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <p className="text-2xl font-game text-lc-blue mb-4">Panel Complete!</p>
          <p className="text-4xl font-game mb-2">
            {responsesGiven}
            <span className="text-lg opacity-50 ml-2">expert responses</span>
          </p>
          <p className="opacity-70 mb-8">
            Great discussion from our {roleAssignments.length} experts!
          </p>
          <button
            onClick={restartActivity}
            className="px-8 py-4 glass hover:bg-white/10 rounded-xl font-game text-lg transition-all border border-white/20"
          >
            NEW PANEL
          </button>
        </motion.div>
      )}
    </div>
  );
}
