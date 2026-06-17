import type { Difficulty } from '@/lib/difficulty';
import type { SourceCitation, SourceMaterial } from '@/types/source-material';

export type DestinationSceneTerrain = 'coastal' | 'mountain' | 'flatland' | 'desert' | 'island' | 'urban';
export type DestinationSceneVegetation = 'palms' | 'pines' | 'broadleaf' | 'sakura' | 'none';
export type DestinationSceneSkyline = 'low' | 'dense' | 'highrise' | 'historic';

export interface DestinationImage {
  url: string;
  alt: string;
  caption: string;
  sourceName: string;
  sourceUrl: string;
  creator?: string;
  license?: string;
  focalPoint?: { x: number; y: number };
}

export interface DestinationScene {
  terrain: DestinationSceneTerrain;
  vegetation?: DestinationSceneVegetation;
  skyline: DestinationSceneSkyline;
  /**
   * Optional bespoke city skyline. When set, the skyline layer renders a
   * city-specific massing/rooflines/accents instead of the generic `skyline`
   * family. Additive — omit it and the generic family is used unchanged.
   */
  skylineVariant?:
    | 'tokyo'
    | 'paris'
    | 'rio'
    | 'nyc'
    | 'london'
    | 'dubai'
    | 'singapore'
    | 'sydney'
    | 'hongkong'
    | 'moscow'
    | 'istanbul'
    | 'berlin'
    | 'seoul'
    | 'bangkok'
    | 'beijing'
    | 'rome'
    | 'amsterdam'
    | 'capetown'
    | 'toronto'
    | 'cairo'
    | 'la'
    | 'mumbai'
    | 'madrid'
    | 'mexicocity'
    | 'buenosaires'
    | 'vancouver'
    | 'miami'
    | 'honolulu'
    | 'delhi'
    | 'jakarta'
    | 'lagos'
    | 'lisbon'
    | 'dublin'
    | 'reykjavik'
    | 'panamacity'
    | 'hcmc'
    | 'almaty'
    | 'nairobi'
    | 'lima'
    | 'bogota'
    | 'perth'
    | 'auckland'
    | 'suva'
    | 'ulaanbaatar'
    | 'dakar'
    | 'manila'
    | 'santiago'
    | 'recife'
    | 'addisababa'
    | 'homebase';
  landmarkSilhouette?: string;
  palette: 'dawn' | 'night' | 'golden' | 'tropical' | 'winter';
}

export type DestinationFocusKind = 'video' | 'reading';
export type DestinationFocusReviewStatus = 'draft' | 'researched' | 'transcript-verified';

export type DestinationCitation = SourceCitation;

export interface DestinationFocusReview {
  status: DestinationFocusReviewStatus;
  reviewedAt?: string;
  transcriptLanguage?: string;
}

export interface DestinationEvidence {
  investigationTags: string[];
  keyIdea: string;
  tradeoff: string;
  designUse: string;
}

export interface DestinationFocus {
  id: string;
  kind: DestinationFocusKind;
  title: string;
  subtitle: string;
  difficulty: Difficulty;
  lessonGoal: string;
  skills: string[];
  image: DestinationImage;
  publisher: string;
  sourceUrl?: string;
  citations?: DestinationCitation[];
  review: DestinationFocusReview;
  evidence?: DestinationEvidence;
  sourceMaterial: SourceMaterial;
}

export interface DestinationPack {
  id: string;
  city: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  primaryAirport: string;
  airports: string[];
  scene: DestinationScene;
  heroImage: DestinationImage;
  focusOptions: DestinationFocus[];
}
