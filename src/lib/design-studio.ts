import type {
  DesignStudioBrief,
  DesignStudioDecision,
  DesignStudioOption,
  DesignStudioRound,
  DesignStudioState,
} from '@/activities/types';

export const DESIGN_STUDIO_DEFAULT_MAX_DECISIONS = 6;

export interface DesignStudioVote {
  clientId: string;
  choice: string;
}

export function optionIdFromChoice(choice: string): DesignStudioOption['id'] | null {
  const id = choice.trim().charAt(0).toUpperCase();
  return id === 'A' || id === 'B' || id === 'C' ? id : null;
}

export function resolveDesignStudioWinner(
  options: DesignStudioOption[],
  votes: DesignStudioVote[],
): DesignStudioOption {
  if (options.length === 0) {
    throw new Error('A Design Studio vote requires at least one option.');
  }
  const counts = new Map<DesignStudioOption['id'], number>(options.map((option) => [option.id, 0]));
  for (const vote of votes) {
    const id = optionIdFromChoice(vote.choice);
    if (id && counts.has(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return options.reduce((winner, option) => (
    (counts.get(option.id) ?? 0) > (counts.get(winner.id) ?? 0) ? option : winner
  ), options[0]);
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === 'string' && !!item.trim()).map((item) => item.trim());
  return items.length ? items : fallback;
}

export function normalizeDesignStudioRound(value: unknown, state: DesignStudioState): DesignStudioRound {
  const fallback = buildFallbackDesignStudioRound(state);
  if (!value || typeof value !== 'object') return fallback;

  const source = value as Partial<DesignStudioRound> & { options?: unknown };
  const sourceOptions = Array.isArray(source.options) ? source.options.slice(0, 3) : [];
  const ids: DesignStudioOption['id'][] = ['A', 'B', 'C'];
  const options = ids.map((id, index) => {
    const option = sourceOptions[index];
    const fallbackOption = fallback.options[index];
    if (!option || typeof option !== 'object') return fallbackOption;
    const candidate = option as Partial<DesignStudioOption>;
    return {
      id,
      title: readString(candidate.title, fallbackOption.title),
      description: readString(candidate.description, fallbackOption.description),
      benefit: readString(candidate.benefit, fallbackOption.benefit),
      tradeoff: readString(candidate.tradeoff, fallbackOption.tradeoff),
      designChange: readString(candidate.designChange, fallbackOption.designChange),
    };
  });

  return {
    stage: readString(source.stage, fallback.stage),
    question: readString(source.question, fallback.question),
    whyItMatters: readString(source.whyItMatters, fallback.whyItMatters),
    designSummary: readString(source.designSummary, fallback.designSummary),
    options,
  };
}

export function applyDesignStudioDecision(
  state: DesignStudioState,
  round: DesignStudioRound,
  selectedOption: DesignStudioOption,
): DesignStudioState {
  const decision: DesignStudioDecision = {
    roundNumber: state.decisions.length + 1,
    stage: round.stage,
    question: round.question,
    selectedOption,
  };

  return {
    ...state,
    designSummary: selectedOption.designChange,
    decisions: [...state.decisions, decision],
  };
}

export function buildFallbackDesignStudioRound(state: DesignStudioState): DesignStudioRound {
  const roundNumber = state.decisions.length + 1;
  const stages = ['Purpose', 'People', 'Core Feature', 'Access', 'Resilience', 'Final Refinement'];
  const stage = stages[Math.min(roundNumber - 1, stages.length - 1)];
  const base = state.designSummary || state.originalIdeas[0] || state.challenge;

  return {
    stage,
    question: 'What should the class improve next in this design?',
    whyItMatters: 'Every design choice changes who benefits and what becomes possible.',
    designSummary: base,
    options: [
      {
        id: 'A',
        title: 'Make it easier to use',
        description: 'Prioritize clear access and simple everyday use.',
        benefit: 'More people can use the design successfully.',
        tradeoff: 'Specialized features may receive less attention.',
        designChange: `${base} It now prioritizes simple, reliable access.`,
      },
      {
        id: 'B',
        title: 'Make it more adaptable',
        description: 'Prepare the design to respond when conditions change.',
        benefit: 'The design can keep working through future challenges.',
        tradeoff: 'Adaptability can increase cost and complexity.',
        designChange: `${base} It can now adapt when conditions or needs change.`,
      },
      {
        id: 'C',
        title: 'Make it fairer',
        description: 'Focus additional support on people currently underserved.',
        benefit: 'The design works for people who are often excluded.',
        tradeoff: 'The class must decide whose needs receive priority.',
        designChange: `${base} It now gives additional support to underserved users.`,
      },
    ],
  };
}

export function buildFallbackDesignStudioBrief(state: DesignStudioState): DesignStudioBrief {
  return {
    title: 'The Class Design',
    summary: state.designSummary || state.challenge,
    intendedUsers: ['People affected by the challenge', 'The wider community'],
    coreFeatures: state.decisions.map((decision) => decision.selectedOption.title),
    evidenceAndReasoning: state.decisions.map(
      (decision) => `${decision.selectedOption.benefit} The class accepted this tradeoff: ${decision.selectedOption.tradeoff}`,
    ),
    remainingTradeoffs: state.decisions.slice(-2).map((decision) => decision.selectedOption.tradeoff),
    pitch: `Our design responds to ${state.challenge} through a series of choices made by the class.`,
  };
}

export function normalizeDesignStudioBrief(value: unknown, state: DesignStudioState): DesignStudioBrief {
  const fallback = buildFallbackDesignStudioBrief(state);
  if (!value || typeof value !== 'object') return fallback;

  const source = value as Partial<DesignStudioBrief>;
  return {
    title: readString(source.title, fallback.title),
    summary: readString(source.summary, fallback.summary),
    intendedUsers: readStringArray(source.intendedUsers, fallback.intendedUsers),
    coreFeatures: readStringArray(source.coreFeatures, fallback.coreFeatures),
    evidenceAndReasoning: readStringArray(source.evidenceAndReasoning, fallback.evidenceAndReasoning),
    remainingTradeoffs: readStringArray(source.remainingTradeoffs, fallback.remainingTradeoffs),
    pitch: readString(source.pitch, fallback.pitch),
  };
}
