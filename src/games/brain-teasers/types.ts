export type BrainTeaserStatus = 'idle' | 'loading' | 'showing' | 'revealed';

export interface BrainTeaserContent {
  riddle: string;
  answers: string[]; // pre-normalized (lowercase, no punctuation)
  explanation: string;
  category: string;
  cacheId: string | null;
}
