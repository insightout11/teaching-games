'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { ActivityProps } from '../types';
import {
  ActivityStatus,
  type RegisterType,
  type InterviewExchange,
  type InterviewLabContent,
} from './types';

export function InterviewLabActivity({
  students,
  generatedContent,
  onContinue,
  onPhaseChange,
  customTopic,
}: ActivityProps) {
  const content = generatedContent as InterviewLabContent;

  const [status, setStatus] = useState<ActivityStatus>(ActivityStatus.IDLE);
  const [currentRegister, setCurrentRegister] = useState<RegisterType>('formal');
  const [exchanges, setExchanges] = useState<InterviewExchange[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const startActivity = useCallback(() => {
    setStatus(ActivityStatus.INTRO);
    onPhaseChange?.('intro');
  }, [onPhaseChange]);

  const startInterviewing = useCallback(() => {
    setStatus(ActivityStatus.INTERVIEWING);
    onPhaseChange?.('interviewing');
  }, [onPhaseChange]);

  const submitQuestion = useCallback(async () => {
    if (!currentQuestion.trim() || !currentStudentId) return;

    const student = students.find((s) => s.id === currentStudentId);
    if (!student) return;

    setStatus(ActivityStatus.AI_RESPONSE);
    onPhaseChange?.('ai-response');

    try {
      const response = await onContinue({
        sessionId: '',
        activityKey: 'interview-lab',
        topicContext: content.topicContext,
        previousExchanges: exchanges.map((e) => ({
          role: 'student' as const,
          content: `Q: ${e.question} | A: ${e.aiResponse}`,
          timestamp: e.timestamp,
        })),
        studentResponse: currentQuestion,
        requestType: 'follow-up',
      });

      const characterResponse = response.nextQuestion || generateFallbackResponse();
      setAiResponse(characterResponse);

      // Record the exchange
      const newExchange: InterviewExchange = {
        id: `exchange-${Date.now()}`,
        studentId: currentStudentId,
        studentName: student.name,
        question: currentQuestion,
        aiResponse: characterResponse,
        register: currentRegister,
        timestamp: Date.now(),
      };

      setExchanges((prev) => [...prev, newExchange]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setAiResponse(generateFallbackResponse());
    } finally {
      setStatus(ActivityStatus.FEEDBACK);
      onPhaseChange?.('feedback');
    }
  }, [currentQuestion, currentStudentId, students, currentRegister, content.topicContext, exchanges, onContinue, onPhaseChange]);

  const generateFallbackResponse = () => {
    const responses = [
      "That's an interesting question. Let me think about that...",
      "I appreciate you asking. In my experience...",
      "Great question! I'd say that...",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const askAnother = useCallback(() => {
    setCurrentQuestion('');
    setAiResponse(null);
    setCurrentStudentId(null);
    setStatus(ActivityStatus.INTERVIEWING);
    onPhaseChange?.('interviewing');
  }, [onPhaseChange]);

  const toggleRegister = useCallback(() => {
    setCurrentRegister((prev) => prev === 'formal' ? 'casual' : 'formal');
  }, []);

  const finishActivity = useCallback(() => {
    setStatus(ActivityStatus.FINISHED);
    onPhaseChange?.('finished');
  }, [onPhaseChange]);

  const restartActivity = useCallback(() => {
    setExchanges([]);
    setCurrentQuestion('');
    setCurrentStudentId(null);
    setAiResponse(null);
    setCurrentRegister('formal');
    setStatus(ActivityStatus.IDLE);
    onPhaseChange?.('idle');
  }, [onPhaseChange]);

  if (!content.character) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">No character available. Please regenerate content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-teal-400">Interview Lab</h3>
          {customTopic && (
            <p className="text-xs opacity-60">Topic: {customTopic}</p>
          )}
        </div>
        <div className="text-sm opacity-60">
          {exchanges.length} question{exchanges.length !== 1 ? 's' : ''} asked
        </div>
      </div>

      {/* IDLE State */}
      {status === ActivityStatus.IDLE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <p className="text-xl mb-2 opacity-90">Meet the Expert!</p>
          <p className="opacity-60 text-sm mb-8">
            Practice interviewing an AI character. Ask questions and practice conversation skills.
          </p>
          <button
            onClick={startActivity}
            className="px-12 py-6 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
          >
            MEET CHARACTER
          </button>
        </motion.div>
      )}

      {/* INTRO State */}
      {status === ActivityStatus.INTRO && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="glass p-6 rounded-2xl border-2 border-teal-500/30">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-2xl shrink-0">
                🎤
              </div>
              <div>
                <h4 className="text-xl font-bold text-teal-400">{content.character.name}</h4>
                <p className="text-sm text-cyan-300">{content.character.role}</p>
                <p className="mt-2 opacity-80">{content.character.background}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-4 rounded-xl">
              <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Personality</p>
              <p className="text-sm">{content.character.personality}</p>
            </div>
            <div className="glass p-4 rounded-xl">
              <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Expertise</p>
              <div className="flex flex-wrap gap-1">
                {content.character.expertise.map((exp, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded">
                    {exp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="glass p-4 rounded-xl">
            <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Context</p>
            <p>{content.context}</p>
          </div>

          {/* Sample questions */}
          {content.sampleQuestions && content.sampleQuestions.length > 0 && (
            <div className="glass p-4 rounded-xl border border-yellow-500/30">
              <p className="text-xs uppercase tracking-widest text-yellow-400 mb-2">Sample Questions</p>
              <ul className="text-sm space-y-1 opacity-80">
                {content.sampleQuestions.map((q, i) => (
                  <li key={i}>• {q}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={startInterviewing}
              className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              START INTERVIEW
            </button>
          </div>
        </motion.div>
      )}

      {/* INTERVIEWING State */}
      {status === ActivityStatus.INTERVIEWING && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Character reminder */}
          <div className="glass p-4 rounded-xl flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-xl shrink-0">
              🎤
            </div>
            <div>
              <p className="font-bold text-teal-400">{content.character.name}</p>
              <p className="text-sm opacity-70">{content.character.role}</p>
            </div>
          </div>

          {/* Register toggle */}
          <div className="flex justify-center">
            <button
              onClick={toggleRegister}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                currentRegister === 'formal'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}
            >
              Register: {currentRegister.toUpperCase()}
            </button>
          </div>

          {/* Student selection */}
          <div className="glass p-4 rounded-xl">
            <p className="text-sm font-bold mb-2 opacity-70">Who is asking?</p>
            <select
              value={currentStudentId || ''}
              onChange={(e) => setCurrentStudentId(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2"
            >
              <option value="">Select student...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          {/* Question input */}
          <div className="glass p-4 rounded-xl">
            <p className="text-sm font-bold mb-2 opacity-70">Ask your question:</p>
            <textarea
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder="Type the student's question..."
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 min-h-[100px] resize-none"
            />
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={submitQuestion}
              disabled={!currentQuestion.trim() || !currentStudentId}
              className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-30"
            >
              ASK QUESTION
            </button>
            {exchanges.length > 0 && (
              <button
                onClick={finishActivity}
                className="px-6 py-4 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-white/20"
              >
                END INTERVIEW
              </button>
            )}
          </div>

          {/* Previous exchanges */}
          {exchanges.length > 0 && (
            <div className="glass p-4 rounded-xl max-h-[200px] overflow-y-auto">
              <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Previous Questions</p>
              <div className="space-y-2">
                {exchanges.slice().reverse().map((e) => (
                  <div key={e.id} className="text-sm border-l-2 border-teal-500/30 pl-3">
                    <p className="text-teal-400">{e.studentName}: {e.question}</p>
                    <p className="opacity-70 text-xs mt-1">{e.aiResponse.slice(0, 100)}...</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* AI_RESPONSE State (loading) */}
      {status === ActivityStatus.AI_RESPONSE && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="glass p-4 rounded-xl">
            <p className="text-sm opacity-70">Question asked:</p>
            <p className="text-lg">&ldquo;{currentQuestion}&rdquo;</p>
          </div>

          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-12 h-12 border-4 border-teal-500/10 border-t-teal-500 rounded-full animate-spin" />
            <p className="font-game text-lg text-teal-400 animate-pulse">
              {content.character.name} is thinking...
            </p>
          </div>
        </motion.div>
      )}

      {/* FEEDBACK State */}
      {status === ActivityStatus.FEEDBACK && aiResponse && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="glass p-4 rounded-xl">
            <p className="text-sm opacity-70">Question:</p>
            <p className="text-lg">&ldquo;{currentQuestion}&rdquo;</p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-6 rounded-2xl border-2 border-teal-500/30"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-xl shrink-0">
                🎤
              </div>
              <div>
                <p className="font-bold text-teal-400 mb-2">{content.character.name}</p>
                <p className="text-lg">{aiResponse}</p>
              </div>
            </div>
          </motion.div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={askAnother}
              className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              ASK ANOTHER
            </button>
            <button
              onClick={finishActivity}
              className="px-6 py-4 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-white/20"
            >
              END INTERVIEW
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
          <p className="text-2xl font-game text-teal-400 mb-4">Great Interview!</p>
          <p className="text-4xl font-game mb-2">
            {exchanges.length}
            <span className="text-lg opacity-50 ml-2">questions asked</span>
          </p>

          {exchanges.length > 0 && (
            <div className="glass p-4 rounded-xl text-left max-h-[250px] overflow-y-auto">
              <p className="text-xs uppercase tracking-widest opacity-50 mb-3">Interview Summary</p>
              <div className="space-y-3">
                {exchanges.map((e, i) => (
                  <div key={e.id} className="border-l-2 border-teal-500/30 pl-3">
                    <p className="text-sm text-teal-400">{i + 1}. {e.studentName} asked:</p>
                    <p className="text-sm opacity-80">&ldquo;{e.question}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={restartActivity}
            className="px-8 py-4 glass hover:bg-white/10 rounded-xl font-game text-lg transition-all border border-white/20"
          >
            NEW INTERVIEW
          </button>
        </motion.div>
      )}
    </div>
  );
}
