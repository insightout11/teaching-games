/**
 * Topic-aware deterministic fallback builders.
 * Used when AI generation fails and content cache misses.
 * Each function returns the exact response shape the route expects.
 */

import type { GameSentence } from '@/app/api/vocab-sprint/generate/route';
import type { GridContent } from '@/games/grid-rush/types';

// ---------- Game fallbacks ----------

export function vocabSprintFallback(topic: string): GameSentence[] {
  return [
    { sentence: `Learning about ${topic} can be very good for students.`, weakWord: 'good', hint: 'What kind of good? Be more specific.', level: 'easy' },
    { sentence: `Many people said that ${topic} is important.`, weakWord: 'said', hint: 'How did they express it?', level: 'easy' },
    { sentence: `There are big changes happening in ${topic}.`, weakWord: 'big', hint: 'What kind of changes — significant? dramatic?', level: 'medium' },
    { sentence: `She went to learn more about ${topic}.`, weakWord: 'went', hint: 'Try a more specific movement verb.', level: 'medium' },
    { sentence: `The presentation about ${topic} was nice.`, weakWord: 'nice', hint: 'Describe the quality more precisely.', level: 'hard' },
    { sentence: `He made a very fast decision about ${topic}.`, weakWord: 'fast', hint: 'Try a more precise adverb for speed.', level: 'hard' },
  ];
}

export function synonymShowdownFallback(topic: string) {
  return {
    targetWord: 'important',
    contextSentence: `Understanding ${topic} is very important for everyday life.`,
    hint: 'Think about words that mean significant or essential.',
  };
}

export function sentenceScrambleFallback(topic: string) {
  return {
    sentences: [
      `Students often discuss ${topic} in class.`,
      `Learning about ${topic} helps us understand the world.`,
      `Many teachers use ${topic} as a discussion topic.`,
      `It is useful to study ${topic} every day.`,
      `People around the world are interested in ${topic}.`,
      `Reading about ${topic} can improve your vocabulary.`,
      `You can find information about ${topic} online.`,
      `Talking about ${topic} is a great way to practice English.`,
      `Some students enjoy learning about ${topic} the most.`,
      `Understanding ${topic} requires practice and patience.`,
    ],
  };
}

export function grammarBossFallback(topic: string) {
  return {
    task: `Describe your experience with ${topic} using the correct grammar structure.`,
    exampleSentence: `I have been studying ${topic} for several weeks now.`,
    sentenceStarter: `When it comes to ${topic}, I have ...`,
  };
}

export function errorHunterFallback(topic: string) {
  const paragraph = `${topic} are a very important subject to study. Many student finds it interesting to learn about ${topic}. Yesterday, we was discussing how ${topic} affects our daily lifes.`;
  return {
    paragraph,
    errorCount: 3,
    _errors: [
      { position: 6, word: 'student', errorType: 'subject-verb agreement', correction: 'students' },
      { position: 16, word: 'was', errorType: 'subject-verb agreement', correction: 'were' },
      { position: 22, word: 'lifes', errorType: 'spelling', correction: 'lives' },
    ],
  };
}

export function dialogueDetectiveFallback(topic: string) {
  return {
    speakerA_before: `Have you heard about the new developments in ${topic}?`,
    speakerA_after: `That's interesting! I'll have to look into that.`,
    context: `Two friends discussing ${topic} at a coffee shop.`,
    goal: `Share an opinion or fact about ${topic}.`,
  };
}

export function connectionsFallback(topic: string) {
  // Four groups of 4 words — generic but always structurally valid
  const groups = [
    { category: `${topic} basics`, words: ['LEARN', 'STUDY', 'READ', 'PRACTICE'], difficulty: 'easy', color: 'yellow' },
    { category: 'Feelings about learning', words: ['EXCITED', 'CURIOUS', 'FOCUSED', 'MOTIVATED'], difficulty: 'medium', color: 'green' },
    { category: 'Classroom items', words: ['BOOK', 'PENCIL', 'NOTEBOOK', 'DESK'], difficulty: 'hard', color: 'blue' },
    { category: 'Time expressions', words: ['TODAY', 'TOMORROW', 'ALWAYS', 'OFTEN'], difficulty: 'tricky', color: 'purple' },
  ];
  const allWords = groups.flatMap((g) => g.words);
  // Simple shuffle
  const words = [...allWords].sort(() => Math.random() - 0.5);
  return { words, groups };
}

export function wordChainFallback(topic: string) {
  return {
    startingWord: topic.split(/\s+/)[0]?.toLowerCase() || 'learning',
    hint: `Think of words related to ${topic}.`,
  };
}

export function gridRushFallback(topic: string): GridContent {
  // Extract letters from topic for a topic-flavored grid
  const topicLetters = topic.replace(/[^a-zA-Z]/g, '').toUpperCase().split('');
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  const consonants = ['T', 'N', 'S', 'R', 'L', 'D', 'C', 'M'];

  const letters: string[] = [];
  // Add up to 4 letters from the topic
  for (const l of topicLetters) {
    if (letters.length < 4 && !letters.includes(l)) letters.push(l);
  }
  // Pad with vowels and consonants to reach 9
  let vi = 0, ci = 0;
  while (letters.length < 9) {
    if (letters.length % 3 === 0 && vi < vowels.length) {
      if (!letters.includes(vowels[vi])) letters.push(vowels[vi]);
      vi++;
    } else if (ci < consonants.length) {
      if (!letters.includes(consonants[ci])) letters.push(consonants[ci]);
      ci++;
    } else {
      letters.push('E');
      break;
    }
  }
  // Trim to 9
  const grid = letters.slice(0, 9);
  // Shuffle
  for (let i = grid.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [grid[i], grid[j]] = [grid[j], grid[i]];
  }
  const bonusLetter = grid.find((l) => vowels.includes(l)) || grid[0];
  return {
    letters: grid,
    bonusLetter,
    bonusIndex: grid.indexOf(bonusLetter),
    topicWords: [topic.split(/\s+/)[0]?.toLowerCase() || 'word'],
  };
}

export function storySprintStarterFallback(topic: string) {
  return {
    starterSentence: `One day, something unexpected happened that changed how everyone thought about ${topic}.`,
  };
}

// ---------- Landing activity fallbacks ----------

export function finalAnswerFallback(topic: string) {
  return {
    activityKey: 'final-answer' as const,
    topicContext: topic,
    prompt: `What is the most important thing you learned about ${topic}?`,
    targetKeywords: [topic.split(/\s+/)[0] || 'lesson', 'learned', 'important', 'understand'],
    sentenceStarter: 'I think that...',
    exampleAnswer: `I learned that ${topic} is important because it helps us communicate better.`,
  };
}

export function micDropFallback(topic: string) {
  return {
    activityKey: 'mic-drop' as const,
    topicContext: topic,
    prompt: `Share your strongest opinion about ${topic} in one sentence.`,
    targetKeywords: [topic.split(/\s+/)[0] || 'lesson', 'believe', 'important'],
    exampleLine: `${topic} matters more than people realize.`,
  };
}

export function opinionShiftFallback(topic: string) {
  return {
    activityKey: 'opinion-shift' as const,
    topicContext: topic,
    beforePrompt: `Before this lesson I thought ${topic} was...`,
    nowPrompt: `Now I think ${topic} is...`,
  };
}

export function lightningRoundFallback(topic: string) {
  return {
    activityKey: 'lightning-round' as const,
    topicContext: topic,
    prompts: [
      { text: `One key word about ${topic}?`, targetKeywords: [topic.split(/\s+/)[0] || 'word'] },
      { text: `${topic}: useful or not?`, targetKeywords: ['useful', 'helpful'] },
      { text: `How would you use ${topic}?`, targetKeywords: ['use', 'apply', 'practice'] },
      { text: `What will you remember about ${topic}?`, targetKeywords: ['remember', 'learned'] },
    ],
  };
}

// ---------- Mission selector fallback ----------

export function missionSelectorFallback(topic: string) {
  return {
    activityKey: 'mission-selector' as const,
    topicContext: topic,
    questions: [
      `What do you already know about ${topic}?`,
      `What is one thing you want to learn about ${topic}?`,
      `How would you explain ${topic} to a friend?`,
      `What surprised you most about ${topic}?`,
      `How will you use what you learned about ${topic}?`,
      `What is the most useful word related to ${topic}?`,
    ],
  };
}
