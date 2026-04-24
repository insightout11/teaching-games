export type SourceType = 'youtube' | 'ted' | 'teded' | 'pdf' | 'lyrics' | 'text';

export interface SourceMaterial {
  sourceType: SourceType;
  sourceKey?: string; // YouTube video ID or TED talk ID
  title: string;
  summary: string; // ~500 words, used in AI prompts
  duration?: number; // seconds
}

export interface CheckpointQuestion {
  timestamp: number; // seconds into video
  timestampLabel: string; // "4:32"
  question: string;
  options: string[];
  correctIndex: number;
}
