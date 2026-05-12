import type { InputSpec } from '@/lib/input-spec'

export type DisplayInputSpec = Pick<InputSpec,
  | 'type'
  | 'gameKey'
  | 'prompt'
  | 'options'
  | 'optionLabels'
  | 'timerSeconds'
  | 'startedAt'
  | 'instruction'
  | 'keywords'
  | 'keywordGroups'
  | 'readAloudQueue'
  | 'currentSlideUrl'
  | 'readAloudVocabWords'
  | 'buttonLabel'
>

export interface DisplayScore {
  clientId: string
  name: string
  points: number
}

export interface DisplayState {
  version: 1
  updatedAt: number
  phase: 'lobby' | 'live' | 'ended'
  displayInputSpec: DisplayInputSpec | null
  moduleLabel: string | null
  topic: string
  joinCode: string
  topScores: DisplayScore[]
  studentCount: number
}

export type DisplayChannelMessage =
  | ({ kind: 'state' } & DisplayState)
  | { kind: 'ping' }
