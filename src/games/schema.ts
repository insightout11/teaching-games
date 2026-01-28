// Game Schema - Standardized structure for all teaching games

export type GameCategory = 'warmup' | 'lesson' | 'activity' | 'closer';
export type StudentInputMode = 'spoken' | 'typed' | 'teacher-selects';
export type ScoringMethod = 'ai' | 'teacher' | 'peer' | 'completion' | 'none';

export interface GameInput {
  key: string;
  label: string;
  type: 'text' | 'select' | 'range' | 'checkbox';
  options?: string[]; // for select
  default?: any;
  required?: boolean;
}

export interface GameOutput {
  roundContent: {
    prompt: string;
    instructions?: string;
    examples?: string[];
    hints?: string[];
  };
  scoring?: {
    method: ScoringMethod;
    rubric?: string;
  };
  metadata?: {
    estimatedDuration: number; // seconds
    difficulty?: string;
  };
}

export interface Game {
  id: string;
  name: string;
  category: GameCategory;
  description: string;
  inputs: GameInput[];
  output: GameOutput;
  ai: {
    promptTemplate: string;
    judgeRubric?: string;
    safetyFilters: string[];
  };
  ui: {
    teacherControls: string[];
    displayMode: 'screen-share' | 'interactive';
    studentInputMode: StudentInputMode;
  };
}

// VocabSprint game definition
export const vocabSprint: Game = {
  id: 'vocab-sprint',
  name: 'VocabSprint',
  category: 'warmup',
  description: 'Fast-paced vocabulary recall game',
  inputs: [
    { key: 'topic', label: 'Topic', type: 'text', required: true },
    { key: 'level', label: 'Level', type: 'select', options: ['A2', 'B1', 'B2', 'C1'], default: 'B1' },
    { key: 'duration', label: 'Duration (seconds)', type: 'range', options: [30, 60, 90, 120], default: 60 },
    { key: 'tone', label: 'Tone', type: 'select', options: ['Neutral', 'Fun', 'Serious'], default: 'Neutral' },
  ],
  output: {
    roundContent: {
      prompt: '',
      instructions: 'Students recall vocabulary related to the topic',
      examples: ['Word', 'Use it in a sentence'],
    },
    scoring: {
      method: 'ai',
      rubric: 'Correct vocabulary + appropriate usage',
    },
    metadata: { estimatedDuration: 60 },
  },
  ai: {
    promptTemplate: `Generate a {level} vocabulary sprint on the topic: {topic}.
Duration: {duration} seconds.
Tone: {tone}.
Return a JSON array of 5-8 vocabulary words/phrases with brief context.`,
    judgeRubric: 'Score 1 point for each correct vocabulary item used appropriately.',
    safetyFilters: ['no inappropriate content', 'age-appropriate'],
  },
  ui: {
    teacherControls: ['Start', 'Next Round', 'End Early'],
    displayMode: 'screen-share',
    studentInputMode: 'teacher-selects',
  },
};

// GrammarBoss game definition
export const grammarBoss: Game = {
  id: 'grammar-boss',
  name: 'GrammarBoss',
  category: 'lesson',
  description: 'Grammar error identification and correction',
  inputs: [
    { key: 'grammarTopic', label: 'Grammar Topic', type: 'text', required: true },
    { key: 'level', label: 'Level', type: 'select', options: ['A2', 'B1', 'B2', 'C1'], default: 'B1' },
    { key: 'quantity', label: 'Number of items', type: 'range', options: [3, 5, 7, 10], default: 5 },
  ],
  output: {
    roundContent: {
      prompt: '',
      instructions: 'Identify and correct the errors',
    },
    scoring: {
      method: 'ai',
      rubric: 'Correct identification + accurate correction',
    },
    metadata: { estimatedDuration: 300 },
  },
  ai: {
    promptTemplate: `Generate {quantity} grammar errors for {level} students on: {grammarTopic}.
Include 1 correct sentence and 2-3 with errors.
Return JSON with the sentences and corrections.`,
    judgeRubric: 'Score based on accurate error identification and correction.',
    safetyFilters: ['no sensitive topics'],
  },
  ui: {
    teacherControls: ['Show Answer', 'Next Item', 'Reveal All'],
    displayMode: 'screen-share',
    studentInputMode: 'typed',
  },
};

// Export all games
export const games: Game[] = [vocabSprint, grammarBoss];

export function getGamesByCategory(category: GameCategory): Game[] {
  return games.filter(g => g.category === category);
}
