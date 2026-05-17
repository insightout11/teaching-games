export type SourceType = 'youtube' | 'ted' | 'teded' | 'bbc' | 'kurzgesagt' | 'bbc-ideas' | 'bigthink' | 'vox' | 'kids' | 'natgeo' | 'crash-course' | 'travel-english' | 'business-english' | 'internet-memes' | 'minecraft' | 'pdf' | 'image' | 'lyrics' | 'text' | 'stories' | 'voa' | 'picture-books';

export interface SourceMaterial {
  sourceType: SourceType;
  sourceKey?: string; // YouTube video ID or TED talk ID
  title: string;
  summary: string; // ~500 words, used in AI prompts
  duration?: number;  // seconds — video sources
  rawText?: string;   // original unprocessed text (text/paste sources only)
  slides?: string[];  // picture book slide image URLs, synced during read-aloud
}

export interface CheckpointQuestion {
  timestamp: number; // seconds into video
  timestampLabel: string; // "4:32"
  question: string;
  options: string[];
  correctIndex: number;
}
