export type SourceType = 'youtube' | 'ted' | 'teded' | 'bbc' | 'kurzgesagt' | 'bbc-ideas' | 'bigthink' | 'vox' | 'kids' | 'natgeo' | 'crash-course' | 'pdf' | 'lyrics' | 'text' | 'stories' | 'voa';

export interface SourceMaterial {
  sourceType: SourceType;
  sourceKey?: string; // YouTube video ID or TED talk ID
  title: string;
  summary: string; // ~500 words, used in AI prompts
  duration?: number;  // seconds — video sources
  rawText?: string;   // original unprocessed text (text/paste sources only)
}

export interface CheckpointQuestion {
  timestamp: number; // seconds into video
  timestampLabel: string; // "4:32"
  question: string;
  options: string[];
  correctIndex: number;
}
