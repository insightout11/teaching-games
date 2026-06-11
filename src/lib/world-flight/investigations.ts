import type { WorldFlightEvidenceSnapshot } from '@/lib/world-flight/journey';

export interface WorldFlightInvestigationRequirement {
  id: string;
  label: string;
  description: string;
  matchTags: string[];
}

export interface WorldFlightInvestigation {
  id: string;
  title: string;
  question: string;
  designMissionTitle: string;
  requirements: WorldFlightInvestigationRequirement[];
}

export interface WorldFlightInvestigationEvidence {
  destinationId: string;
  city: string;
  focusTitle: string;
}

export interface WorldFlightInvestigationRequirementProgress
  extends Omit<WorldFlightInvestigationRequirement, 'matchTags'> {
  complete: boolean;
  evidence: WorldFlightInvestigationEvidence | null;
}

export interface WorldFlightInvestigationProgress {
  id: string;
  title: string;
  question: string;
  designMissionTitle: string;
  completedCount: number;
  totalCount: number;
  complete: boolean;
  requirements: WorldFlightInvestigationRequirementProgress[];
}

export interface CompletedWorldFlightEvidence {
  destinationId: string;
  completedAt: string | null;
  evidenceSnapshot: WorldFlightEvidenceSnapshot;
}

export const WORLD_FLIGHT_INVESTIGATIONS: WorldFlightInvestigation[] = [
  {
    id: 'how-cities-move',
    title: 'How Cities Move',
    question: 'What makes movement through a city work well?',
    designMissionTitle: 'Design a Better Journey',
    requirements: [
      {
        id: 'network',
        label: 'Study a transport network',
        description: 'Find how a city connects people and places.',
        matchTags: ['transport', 'systems', 'systems thinking', 'movement'],
      },
      {
        id: 'access',
        label: 'Notice everyday access',
        description: 'Find how movement shapes ordinary daily life.',
        matchTags: ['functional english', 'daily life', 'travel english', 'community'],
      },
      {
        id: 'tradeoff',
        label: 'Evaluate a movement tradeoff',
        description: 'Find a choice involving speed, access, cost, or pollution.',
        matchTags: ['debate', 'problem solving', 'environment', 'urban planning'],
      },
    ],
  },
  {
    id: 'cities-and-change',
    title: 'Cities and Change',
    question: 'Why do cities preserve some things and transform others?',
    designMissionTitle: 'Plan a City Change',
    requirements: [
      {
        id: 'past',
        label: 'Trace a city through time',
        description: 'Find an event or period that changed a city.',
        matchTags: ['history', 'urban history', 'timeline', 'urban change'],
      },
      {
        id: 'cause',
        label: 'Explain cause and effect',
        description: 'Find what caused a change and what followed.',
        matchTags: ['cause and effect', 'systems thinking', 'critical thinking'],
      },
      {
        id: 'preserve',
        label: 'Examine what gets preserved',
        description: 'Find how a city handles heritage, memory, or identity.',
        matchTags: ['heritage', 'identity', 'architecture', 'museums', 'archaeology'],
      },
    ],
  },
  {
    id: 'living-with-nature',
    title: 'Living With Nature',
    question: 'How do cities adapt to the natural world around them?',
    designMissionTitle: 'Design a Resilient City',
    requirements: [
      {
        id: 'setting',
        label: 'Study a natural setting',
        description: 'Find how geography shapes a city.',
        matchTags: ['nature', 'geography', 'water', 'place'],
      },
      {
        id: 'pressure',
        label: 'Identify an environmental pressure',
        description: 'Find a climate or environmental challenge.',
        matchTags: ['climate', 'environment', 'sustainability'],
      },
      {
        id: 'response',
        label: 'Evaluate a city response',
        description: 'Find a scientific, engineered, or practical response.',
        matchTags: ['problem solving', 'science', 'engineering', 'urban planning'],
      },
    ],
  },
  {
    id: 'belonging-and-identity',
    title: 'Belonging and Identity',
    question: 'How do people make a city feel like home?',
    designMissionTitle: 'Create a Place of Belonging',
    requirements: [
      {
        id: 'expression',
        label: 'Find a form of expression',
        description: 'Find culture expressed through art, language, or tradition.',
        matchTags: ['culture', 'identity', 'art', 'literature', 'religion', 'language'],
      },
      {
        id: 'daily-culture',
        label: 'Observe culture in daily life',
        description: 'Find how ordinary routines carry local identity.',
        matchTags: ['food culture', 'daily life', 'urban culture', 'neighborhoods'],
      },
      {
        id: 'mixed-city',
        label: 'Study a changing community',
        description: 'Find how different groups share or reshape a city.',
        matchTags: ['migration', 'community', 'identity', 'ethics'],
      },
    ],
  },
  {
    id: 'designing-fair-cities',
    title: 'Designing Fair Cities',
    question: 'Who benefits from the way a city is designed?',
    designMissionTitle: 'Make a City Work for More People',
    requirements: [
      {
        id: 'design-choice',
        label: 'Study a design choice',
        description: 'Find a decision about buildings, streets, or public space.',
        matchTags: ['urban design', 'urban planning', 'architecture', 'public space', 'design'],
      },
      {
        id: 'competing-needs',
        label: 'Compare competing needs',
        description: 'Find a city decision where people want different outcomes.',
        matchTags: ['debate', 'ethics', 'housing', 'economics', 'government'],
      },
      {
        id: 'improvement',
        label: 'Find a practical improvement',
        description: 'Find a response intended to make city life work better.',
        matchTags: ['problem solving', 'systems thinking', 'transport', 'community'],
      },
    ],
  },
];

const CANONICAL_TAG_RULES: Array<{ tag: string; matches: string[] }> = [
  { tag: 'mobility', matches: ['transport', 'movement', 'travel english', 'functional english'] },
  { tag: 'city-change', matches: ['history', 'urban history', 'urban change', 'cause and effect', 'timeline'] },
  { tag: 'environment', matches: ['nature', 'climate', 'geography', 'water', 'sustainability'] },
  { tag: 'identity', matches: ['culture', 'food culture', 'heritage', 'migration', 'community', 'language'] },
  { tag: 'fairness', matches: ['debate', 'ethics', 'housing', 'economics', 'government', 'public space'] },
];

function normalizeTag(value: string) {
  return value.trim().toLowerCase();
}

export function deriveInvestigationTags(skills: string[], explicitTags: string[] = []) {
  const tags = new Set([...skills, ...explicitTags].map(normalizeTag).filter(Boolean));

  for (const rule of CANONICAL_TAG_RULES) {
    if (rule.matches.some((match) => tags.has(match))) {
      tags.add(rule.tag);
    }
  }

  return Array.from(tags);
}

export function deriveWorldFlightInvestigationProgress(
  completedEvidence: CompletedWorldFlightEvidence[],
): WorldFlightInvestigationProgress[] {
  const evidence = [...completedEvidence]
    .sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''))
    .map((entry) => ({
      ...entry,
      tags: new Set(deriveInvestigationTags(
        Array.isArray(entry.evidenceSnapshot?.skills) ? entry.evidenceSnapshot.skills : [],
        Array.isArray(entry.evidenceSnapshot?.investigationTags)
          ? entry.evidenceSnapshot.investigationTags
          : [],
      )),
    }));

  return WORLD_FLIGHT_INVESTIGATIONS.map((investigation) => {
    type TaggedEvidence = (typeof evidence)[number];
    const findBestAssignment = (
      requirementIndex: number,
      usedCities: Set<string>,
    ): Array<TaggedEvidence | null> => {
      if (requirementIndex >= investigation.requirements.length) return [];

      const requirement = investigation.requirements[requirementIndex];
      const candidatesByCity = new Map<string, TaggedEvidence>();
      for (const entry of evidence) {
        if (
          !usedCities.has(entry.destinationId)
          && !candidatesByCity.has(entry.destinationId)
          && requirement.matchTags.some((tag) => entry.tags.has(normalizeTag(tag)))
        ) {
          candidatesByCity.set(entry.destinationId, entry);
        }
      }
      const candidates = Array.from(candidatesByCity.values());
      let best = [null, ...findBestAssignment(requirementIndex + 1, usedCities)] as Array<TaggedEvidence | null>;

      for (const candidate of candidates) {
        const nextUsedCities = new Set(usedCities);
        nextUsedCities.add(candidate.destinationId);
        const assignment = [
          candidate,
          ...findBestAssignment(requirementIndex + 1, nextUsedCities),
        ] as Array<TaggedEvidence | null>;
        const assignmentScore = assignment.filter(Boolean).length;
        const bestScore = best.filter(Boolean).length;
        if (assignmentScore > bestScore) best = assignment;
      }

      return best;
    };
    const assignment = findBestAssignment(0, new Set());
    const requirements = investigation.requirements.map((requirement, index) => {
      const match = assignment[index];

      return {
        id: requirement.id,
        label: requirement.label,
        description: requirement.description,
        complete: Boolean(match),
        evidence: match
          ? {
              destinationId: match.destinationId,
              city: match.evidenceSnapshot?.city || match.destinationId,
              focusTitle: match.evidenceSnapshot?.focusTitle || 'Completed city lesson',
            }
          : null,
      };
    });
    const completedCount = requirements.filter((requirement) => requirement.complete).length;

    return {
      id: investigation.id,
      title: investigation.title,
      question: investigation.question,
      designMissionTitle: investigation.designMissionTitle,
      completedCount,
      totalCount: requirements.length,
      complete: completedCount === requirements.length,
      requirements,
    };
  });
}
