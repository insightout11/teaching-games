export type SourceType = 'youtube' | 'ted' | 'teded' | 'bbc' | 'kurzgesagt' | 'bbc-ideas' | 'bigthink' | 'vox' | 'kids' | 'natgeo' | 'crash-course' | 'travel-english' | 'business-english' | 'internet-memes' | 'minecraft' | 'pdf' | 'image' | 'lyrics' | 'text' | 'stories' | 'voa' | 'picture-books';

export type SourceBriefingMode = 'exact' | 'excerpt' | 'adapted' | 'generated';

export interface SourceBriefingOption {
  id: string;
  label: string;
  description?: string;
  text: string;
  mode: SourceBriefingMode;
  wordCount?: number;
}

export interface SourceMaterial {
  sourceType: SourceType;
  sourceKey?: string; // YouTube video ID or TED talk ID
  title: string;
  summary: string; // ~500 words, used in AI prompts
  duration?: number;  // seconds — video sources
  rawText?: string;   // original unprocessed text (text/paste sources only)
  /** Student-facing text used for Captain's Briefing and downstream source-grounded generation. */
  briefingText?: string;
  briefingMode?: SourceBriefingMode;
  briefingOptions?: SourceBriefingOption[];
  /** Best extracted document text/excerpt retained for teacher review, not automatically shown to students. */
  sourceText?: string;
  /** Full original reading text when the upload is short and clean enough to offer as-is. */
  originalText?: string;
  documentKind?: string;
  wordCount?: number;
  slides?: string[];  // picture book slide image URLs, synced during read-aloud
}

export interface CheckpointQuestion {
  timestamp: number; // seconds into video
  timestampLabel: string; // "4:32"
  question: string;
  options: string[];
  correctIndex: number;
}
