import type { ScoringMode } from '@/stores/session-store';
import type { GoalTag, SlotType } from './flight-plan-config';

export type LessonType = 'inquisitive' | 'skill-builder' | 'performance' | 'game-day';

export interface PresetScenarios {
  /** Heading shown above the option chips. */
  label: string;
  /** Placeholder for the free-text write-in input. */
  placeholder: string;
  /** Curated options — clicking one pre-fills the input. */
  options: string[];
}

export interface FlightPlanPreset {
  id: string;
  name: string;
  description: string;
  lessonDurationMinutes: 30 | 45 | 60 | 90;
  goal: GoalTag;
  lessonType: LessonType;
  /** Explicit scoring mode override — skips goal-derived default when set. */
  scoringMode?: ScoringMode;
  /** When true, loadPreset skips mission-selector takeoff and landing — pure game sequence. */
  skipTakeoffLanding?: boolean;
  /** Explicit takeoff activity key — overrides auto-assignment when set. */
  takeoff?: string;
  /** Explicit landing activity key — overrides auto-assignment when set. */
  landing?: string;
  /** Middle slots only — takeoff/landing are always auto-assigned. */
  moduleSequence: Array<{ slotType: SlotType; key: string }>;
  /**
   * When present, clicking this preset opens a scenario picker modal instead of
   * loading immediately. The selected scenario string is written to the topic field.
   */
  scenarios?: PresetScenarios;
}

export const FLIGHT_PLAN_PRESETS: FlightPlanPreset[] = [
  {
    id: 'game-day-60',
    name: 'Game Day',
    description: 'Pure competitive fun — 4 back-to-back games, running scoreboard',
    lessonDurationMinutes: 60,
    goal: 'creativity',
    lessonType: 'game-day',
    scoringMode: 'competitive',
    skipTakeoffLanding: true,
    moduleSequence: [
      { slotType: 'practice', key: 'connections' },
      { slotType: 'practice', key: 'grid-rush' },
      { slotType: 'presentation', key: 'imposter' },
      { slotType: 'practice', key: 'flash-quiz' },
    ],
    scenarios: {
      label: 'Choose a topic',
      placeholder: 'e.g. Famous movies and TV shows',
      options: [
        'Pop culture and entertainment',
        'Sport and competition',
        'Food and drink',
        'Travel and places',
        'Nature and animals',
        'Technology and gadgets',
      ],
    },
  },
  {
    id: 'debate-ready-60',
    name: 'Debate Ready',
    description: 'Opinion formation, structured argument, vote-and-discuss',
    lessonDurationMinutes: 60,
    goal: 'discussion-debate',
    lessonType: 'inquisitive',
    takeoff: 'mission-selector',
    landing: 'opinion-shift',
    moduleSequence: [
      { slotType: 'presentation', key: 'fact-detective' },
      { slotType: 'production', key: 'defend-it' },
      { slotType: 'production', key: 'hot-take-arena' },
    ],
    scenarios: {
      label: 'Choose a discussion theme',
      placeholder: 'e.g. Should junk food be taxed?',
      options: [
        'Technology and society',
        'Environment and sustainability',
        'Education and learning',
        'Health and lifestyle',
        'Work and the future',
        'Culture and identity',
      ],
    },
  },
  {
    id: 'vocab-blitz-60',
    name: 'Vocab Blitz',
    description: 'Vocabulary-first with game-based reinforcement and real use',
    lessonDurationMinutes: 60,
    goal: 'vocabulary-building',
    lessonType: 'skill-builder',
    takeoff: 'vocab-radar',
    landing: 'in-your-words',
    moduleSequence: [
      { slotType: 'practice', key: 'synonym-showdown' },
      { slotType: 'practice', key: 'vocab-sprint' },
      { slotType: 'production', key: 'password' },
    ],
    scenarios: {
      label: 'Choose a topic',
      placeholder: 'e.g. Street food around the world',
      options: [
        'Technology and the internet',
        'Food and cooking',
        'Travel and adventure',
        'Health and fitness',
        'Work and careers',
        'Nature and the environment',
      ],
    },
  },
  {
    id: 'speaking-circle-60',
    name: 'Speaking Circle',
    description: 'High speaking load, confidence-building sequence',
    lessonDurationMinutes: 60,
    goal: 'speaking-fluency',
    lessonType: 'performance',
    takeoff: 'character-cards',
    landing: 'final-word',
    moduleSequence: [
      { slotType: 'presentation', key: 'would-you-rather' },
      { slotType: 'practice', key: 'scene-igniter' },
      { slotType: 'production', key: 'conversation-rounds' },
    ],
    scenarios: {
      label: 'Choose a speaking situation',
      placeholder: 'e.g. Catching up with an old friend',
      options: [
        'Daily life — routines, home, neighbourhood',
        'Social — meeting people, making plans, small talk',
        'Opinions — sharing views on familiar topics',
        'Problem-solving — navigating everyday issues together',
        'Storytelling — sharing experiences and reactions',
        'Workplace — simple professional interactions',
      ],
    },
  },
  {
    id: 'grammar-clinic-60',
    name: 'Grammar Clinic',
    description: 'Sentence-level accuracy — spot errors, build sentences, perform under pressure',
    lessonDurationMinutes: 60,
    goal: 'grammar-reinforcement',
    lessonType: 'skill-builder',
    takeoff: 'grammar-check-in',
    landing: 'grammar-proof',
    moduleSequence: [
      { slotType: 'practice', key: 'error-hunter' },
      { slotType: 'practice', key: 'sentence-scramble' },
      { slotType: 'practice', key: 'grammar-boss' },
    ],
    scenarios: {
      label: 'Choose a topic',
      placeholder: 'e.g. Shopping at the market',
      options: [
        'Technology and social media',
        'Travel and transport',
        'Health and wellbeing',
        'Food and daily routines',
        'Work and careers',
        'The environment',
      ],
    },
  },
  {
    id: 'think-tank-60',
    name: 'Think Tank',
    description: 'Deep critical thinking — question, investigate, and deduce',
    lessonDurationMinutes: 60,
    goal: 'critical-thinking',
    lessonType: 'inquisitive',
    takeoff: 'wonder-board',
    landing: 'final-word',
    moduleSequence: [
      { slotType: 'presentation', key: 'fact-detective' },
      { slotType: 'practice', key: 'connections' },
      { slotType: 'production', key: 'twenty-questions' },
    ],
    scenarios: {
      label: 'Choose a thinking challenge',
      placeholder: 'e.g. Should cities ban private cars?',
      options: [
        'Artificial intelligence and society',
        'Climate change and the future',
        'Education and learning',
        'Health and medical ethics',
        'Urban life and community',
        'Media and truth',
      ],
    },
  },
  {
    id: 'travel-english-60',
    name: 'Travel English',
    description: 'Airport, hotel, and restaurant scenarios — situational speaking in real travel contexts',
    lessonDurationMinutes: 60,
    goal: 'functional-english',
    lessonType: 'performance',
    takeoff: 'vocab-radar',
    landing: 'final-word',
    moduleSequence: [
      { slotType: 'practice', key: 'dialogue-detective' },
      { slotType: 'practice', key: 'scene-igniter' },
      { slotType: 'production', key: 'conversation-rounds' },
    ],
    scenarios: {
      label: 'Choose a travel situation',
      placeholder: 'e.g. Checking in at a budget hostel',
      options: [
        'Airport — check-in and boarding',
        'Hotel — checking in and accommodation',
        'Restaurant — ordering and dealing with issues',
        'Shopping — markets, shops, and returns',
        'Getting around — directions and public transport',
        'Emergencies — problems, help, and medical situations',
      ],
    },
  },
  {
    id: 'job-english-60',
    name: 'Job English',
    description: 'Interview prep and workplace communication — professional vocabulary with role-based speaking',
    lessonDurationMinutes: 60,
    goal: 'functional-english',
    lessonType: 'performance',
    takeoff: 'vocab-radar',
    landing: 'final-word',
    moduleSequence: [
      { slotType: 'practice', key: 'dialogue-detective' },
      { slotType: 'practice', key: 'scene-igniter' },
      { slotType: 'production', key: 'conversation-rounds' },
    ],
    scenarios: {
      label: 'Choose a job role',
      placeholder: 'e.g. Barista at a specialty coffee shop',
      options: [
        'Waiter or restaurant server',
        'Cashier or retail assistant',
        'Hotel receptionist or concierge',
        'Customer service agent',
        'Healthcare worker or medical receptionist',
        'Office or admin assistant',
        'Tour guide or tourism worker',
      ],
    },
  },
  {
    id: 'creative-sprint-60',
    name: 'Creative Sprint',
    description: 'Open-ended expression with imagination-first storytelling',
    lessonDurationMinutes: 60,
    goal: 'creativity',
    lessonType: 'performance',
    takeoff: 'character-cards',
    landing: 'final-word',
    moduleSequence: [
      { slotType: 'presentation', key: 'wonder-board' },
      { slotType: 'practice', key: 'scene-igniter' },
      { slotType: 'production', key: 'story-sprint' },
    ],
    scenarios: {
      label: 'Choose a creative theme',
      placeholder: 'e.g. A strange discovery in an old building',
      options: [
        'Adventure and exploration',
        'Mystery and suspense',
        'Friendship and relationships',
        'Technology and the future',
        'Nature and survival',
        'Dreams and imagination',
      ],
    },
  },
  {
    id: 'first-day-60',
    name: 'First Day',
    description: 'Social icebreaker — gets students talking, laughing, and learning each other',
    lessonDurationMinutes: 60,
    goal: 'confidence-building',
    lessonType: 'performance',
    takeoff: 'quick-pulse',
    landing: 'final-word',
    moduleSequence: [
      { slotType: 'presentation', key: 'two-truths-and-a-lie' },
      { slotType: 'production', key: 'would-you-rather' },
      { slotType: 'presentation', key: 'imposter' },
    ],
    scenarios: {
      label: 'Choose a theme',
      placeholder: 'e.g. Things we all have in common',
      options: [
        'Getting to know each other',
        'Hobbies and free time',
        'Dreams and ambitions',
        'Technology and daily life',
        'The environment',
        'Health and lifestyle',
      ],
    },
  },
];
