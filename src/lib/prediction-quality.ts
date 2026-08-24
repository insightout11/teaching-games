import type { PredictionRoundQuestion } from '@/activities/types';

export interface PredictionQuestionCandidate {
  text?: string;
  optionA?: string;
  optionB?: string;
  correctAnswer?: string;
  revealFact?: string;
}

const SUBJECTIVE_PATTERNS = [
  /\b(most important|more important|best|worst|better|worse|greatest|most successful)\b/i,
  /\b(beautiful|boring|exciting|interesting|impressive|ideal|valuable)\b/i,
  /\b(should|ought to|deserves?|matters? more)\b/i,
  /\b(decides? which|shows? how|reflects?|symboli[sz]es?)\b/i,
  /\b(in my opinion|people believe|some say|arguably)\b/i,
];

export function isObjectivePredictionQuestion(candidate: PredictionQuestionCandidate): boolean {
  const text = candidate.text?.trim() ?? '';
  const optionA = candidate.optionA?.trim() ?? '';
  const optionB = candidate.optionB?.trim() ?? '';
  const revealFact = candidate.revealFact?.trim() ?? '';
  if (!text || !optionA || !optionB || !revealFact || optionA.toLowerCase() === optionB.toLowerCase()) return false;
  if (candidate.correctAnswer !== 'A' && candidate.correctAnswer !== 'B') return false;
  return !SUBJECTIVE_PATTERNS.some((pattern) => pattern.test(text));
}

function fallbackQuestion(topic: string, index: number): PredictionRoundQuestion {
  const safeTopic = topic.trim() || 'General';
  const fallbacks: PredictionRoundQuestion[] = [
    {
      text: `Today's lesson focuses on ${safeTopic}.`,
      optionA: 'True', optionB: 'False', correctAnswer: 'A',
      revealFact: `The lesson topic is ${safeTopic}.`,
    },
    {
      text: `${safeTopic} is not the subject of today's lesson.`,
      optionA: 'True', optionB: 'False', correctAnswer: 'B',
      revealFact: `${safeTopic} is the subject of today's lesson.`,
    },
    {
      text: `Students will encounter ${safeTopic} in this lesson.`,
      optionA: 'True', optionB: 'False', correctAnswer: 'A',
      revealFact: `The lesson materials are about ${safeTopic}.`,
    },
  ];
  return fallbacks[index] ?? fallbacks[0];
}

export function buildSafePredictionQuestions(
  candidates: PredictionQuestionCandidate[],
  topic: string,
): [PredictionRoundQuestion, PredictionRoundQuestion, PredictionRoundQuestion] {
  return [0, 1, 2].map((index) => {
    const candidate = candidates[index];
    if (!candidate || !isObjectivePredictionQuestion(candidate)) return fallbackQuestion(topic, index);
    return {
      text: candidate.text!.trim(),
      optionA: candidate.optionA!.trim(),
      optionB: candidate.optionB!.trim(),
      correctAnswer: candidate.correctAnswer as 'A' | 'B',
      revealFact: candidate.revealFact!.trim(),
    };
  }) as [PredictionRoundQuestion, PredictionRoundQuestion, PredictionRoundQuestion];
}
