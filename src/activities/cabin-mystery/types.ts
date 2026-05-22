import type { ActivityGeneratedContent } from '@/activities/types'

// ============================================
// Cabin Mystery — Local Types
// All Cabin Mystery-specific interfaces live here.
// Only extend global types.ts if framework sharing is required.
// ============================================

// All named characters shown on the passenger manifest.
// The culprit is always one of these — never hidden from the list.
export interface CabinSuspect {
  id: string
  name: string
  seatOrRole: string     // e.g. "Seat 12A" or "Lead Flight Attendant"
  isCulprit: boolean     // exactly one true per case
}

// Conditional answer on a role card.
export interface CabinConditionalAnswer {
  trigger: string        // e.g. "asked about the overhead bin"
  response: string       // what to say
  isRequired: boolean    // must reveal (true) vs. may reveal (false)
}

// The structured answer bank shown on the student's device during questioning.
export interface CabinAnswerBank {
  safeAnswer: string                         // always safe to give
  locationAnswer: string                     // where they were
  conditionalAnswers: CabinConditionalAnswer[]
  deflectionLines: string[]                  // evasion options (culprit uses most)
  improv: string                             // guidance on what they may add or must not say
}

// Private role card — assigned to a student at briefing.
export interface CabinRole {
  id: string
  suspectId: string          // links to CabinSuspect
  isRequired: boolean        // false = optional texture role
  isCulprit: boolean

  // Card fields — all shown on student device; privateSecret never projected
  publicIdentity: string
  alibi: string
  privateSecret: string      // student-device only; never on projected screen
  clue: string

  mustRevealTrigger: {
    condition: string        // e.g. 'if asked: "Did you move any suitcase?"'
    reveal: string           // what they must say
  }

  answerBank: CabinAnswerBank
  sentenceStems: string[]   // 2–3 model phrases to support speaking
  goal: string

  // Culprit-only fields
  culpritContext?: string    // framing for the culprit student
}

// One of the three evidence cards.
export interface CabinEvidence {
  cardNumber: 1 | 2 | 3
  label: string
  content: string

  corroboratesRoleIds: string[]
  contradictsRoleIds: string[]
  pointsToward: 'culprit' | 'red-herring' | 'narrowed' | 'neutral'

  implication: string            // shown after the card is revealed
  unlocksQuestionIds: string[]   // question IDs now available on student devices

  // True if fallbackClues may append text to this card's content
  includesFallbackClue: boolean
}

// Clue injected into an evidence card when a required role is not assigned.
export interface CabinFallbackClue {
  clueText: string               // appended to evidence card content
  appearsInCardNumber: 1 | 2 | 3
  onlyIfRoleIdMissing: string    // role id that carries this clue when assigned
}

// A single question in the question bank.
export interface CabinQuestion {
  id: string
  text: string
  targetType: 'any' | 'specific'
  targetSuspectId?: string       // required when targetType === 'specific'
}

// The full three-tier question bank.
export interface CabinQuestionBank {
  alwaysAvailable: CabinQuestion[]
  evidenceSpecific: {
    afterCardNumber: 1 | 2 | 3
    questions: CabinQuestion[]
  }[]
  characterSpecific: {
    targetSuspectId: string
    questions: CabinQuestion[]
  }[]
}

// One event in the solution timeline.
export interface CabinTimelineEvent {
  time: string             // e.g. "During boarding", "+20 minutes"
  event: string
  relatedRoleId?: string
}

// One step in the clue chain shown at reveal.
export interface CabinClueChainStep {
  cardNumber: 1 | 2 | 3
  insight: string
  pointedTo: 'culprit' | 'red-herring' | 'narrowed'
}

// Full solution — shown only at the reveal phase.
export interface CabinSolution {
  culpritRoleId: string
  culpritSuspectId: string
  explanation: string
  timeline: CabinTimelineEvent[]
  clueChain: CabinClueChainStep[]
  redHerringExplanation: string
  finalRevealScript: string      // teacher reads aloud
  culpritSidePrompt: string      // shown on culprit's device before the full reveal
  culpritSideSentenceStems: string[]
}

// Top-level content object — extends ActivityGeneratedContent.
// For V1 this is a static hand-authored case.
// When AI generation is added, the generator will produce objects of this type.
export interface CabinMysteryContent extends ActivityGeneratedContent {
  activityKey: 'cabin-mystery'
  schemaVersion: number
  caseId: string               // e.g. 'switched-suitcase'
  title: string
  setting: string              // flight number, route, altitude
  incident: string             // 2–4 sentence briefing shown on case board

  suspects: CabinSuspect[]     // full passenger manifest

  // requiredRoles: mystery is solvable with only these (4–6)
  requiredRoles: CabinRole[]
  // optionalRoles: added as class size grows; do not carry load-bearing clues
  optionalRoles: CabinRole[]

  evidenceCards: [CabinEvidence, CabinEvidence, CabinEvidence]  // exactly 3

  fallbackClues: CabinFallbackClue[]

  questionBank: CabinQuestionBank

  solution: CabinSolution

  // Topics this case adapts well to (used by generator; informational for static cases)
  topicAdaptations: string[]
}

// ============================================
// Runtime types — used by the activity component
// ============================================

// One entry in the question log (ephemeral, lives in component state).
export interface CabinQuestionRecord {
  roundNumber: 1 | 2
  askerClientId: string
  askerName: string
  questionId: string
  questionText: string
  targetSuspectId: string
  targetStudentName: string | null  // null if the target role is unassigned (NPC)
  askedAt: number                   // Date.now()
}

// Final vote payload — encoded as JSON string in RemoteVote.choice.
export interface CabinFinalVotePayload {
  suspectId: string
  motive: string    // free text, max 150 chars
}

// Phase state for the investigation sub-machine.
export interface CabinInvestigationState {
  revealedCardCount: 0 | 1 | 2 | 3
  questionRoundOpen: boolean
  round1Questions: CabinQuestionRecord[]
  round2Questions: CabinQuestionRecord[]
}

// The six top-level phases.
export type CabinMysteryPhase =
  | 'idle'
  | 'briefing'       // role cards distributed; students confirm
  | 'investigation'  // evidence reveals + question rounds
  | 'voting'         // final theory submission
  | 'culprit-side'   // culprit's in-character speech
  | 'reveal'         // clue chain + timeline reconstruction
  | 'done'
